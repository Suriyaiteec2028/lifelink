const Invitation = require('../models/Invitation');
const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');
const DonationHistory = require('../models/DonationHistory');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { calculateNextEligibleDate, isInCooldown } = require('../utils/cooldown');
const { calculateAge } = require('../utils/age');
const {
  sendRequestAcceptedEmail,
  sendRequestDeclinedEmail,
  sendRequestClosedNotificationEmail,
  sendMistakenAcceptanceAlertEmail,
  sendCancellationDecisionEmail
} = require('../utils/emailService');

/**
 * @desc Get all invitations for current donor
 * @route GET /api/invitations/my
 */
const getMyInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({ donorId: req.user._id })
      .populate('requestId')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      invitations
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving invitations.' });
  }
};

/**
 * @desc Get single invitation details
 * @route GET /api/invitations/:id
 */
const getInvitationById = async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id)
      .populate('requestId')
      .populate('donorId', 'fullName bloodGroup totalDonations phone locationAddress');

    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found.' });
    }

    // Verify ownership
    const isDonor = invitation.donorId._id.toString() === req.user._id.toString();
    const isRequester = invitation.requestId.requesterId.toString() === req.user._id.toString();

    if (!isDonor && !isRequester) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this invitation.' });
    }

    return res.status(200).json({
      success: true,
      invitation,
      isDonor,
      isRequester
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving invitation.' });
  }
};

/**
 * @desc Accept Blood Request Invitation (Atomic single-donor acceptance workflow)
 * @route POST /api/invitations/:id/accept
 */
const acceptInvitation = async (req, res) => {
  try {
    const invitationId = req.params.id;
    const donor = await User.findById(req.user._id);

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found.' });
    }

    if (invitation.donorId.toString() !== donor._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: This invitation is not addressed to you.' });
    }

    if (invitation.status !== 'Sent') {
      return res.status(400).json({
        success: false,
        message: `This invitation has already been ${invitation.status.toLowerCase()}.`
      });
    }

    // Re-verify donor eligibility
    const age = calculateAge(donor.dateOfBirth);
    if (age < 18) {
      return res.status(400).json({ success: false, message: 'You must be at least 18 years old to donate blood.' });
    }

    if (isInCooldown(donor.nextEligibleDate)) {
      return res.status(400).json({
        success: false,
        message: 'You are currently in a donation cooldown and cannot accept blood requests.'
      });
    }

    // ATOMIC UPDATE: Only match if request has no accepted donor and status is open
    const bloodRequest = await BloodRequest.findOneAndUpdate(
      {
        _id: invitation.requestId,
        status: { $in: ['Searching', 'Invitations Sent'] },
        acceptedDonorId: null
      },
      {
        status: 'Matched',
        acceptedDonorId: donor._id,
        acceptedAt: new Date()
      },
      { new: true }
    );

    if (!bloodRequest) {
      // Race condition or request already fulfilled/cancelled
      invitation.status = 'Closed';
      await invitation.save();
      return res.status(409).json({
        success: false,
        message: 'This blood request has already been matched with another donor or is no longer available.'
      });
    }

    // Mark invitation as Accepted
    invitation.status = 'Accepted';
    invitation.respondedAt = new Date();
    invitation.acceptanceType = 'Acceptance-Based Donation';
    await invitation.save();

    // Close all other pending invitations for this request
    const otherInvitations = await Invitation.find({
      requestId: bloodRequest._id,
      _id: { $ne: invitation._id },
      status: 'Sent'
    }).populate('donorId', 'fullName email');

    await Invitation.updateMany(
      { requestId: bloodRequest._id, _id: { $ne: invitation._id }, status: 'Sent' },
      { status: 'Closed', respondedAt: new Date() }
    );

    // Notify other invited donors that request is fulfilled
    for (const otherInv of otherInvitations) {
      if (otherInv.donorId) {
        await Notification.create({
          userId: otherInv.donorId._id,
          title: 'Blood Request Fulfilled',
          message: `The blood request for ${bloodRequest.requiredBloodGroup} in ${bloodRequest.requestAddress} was fulfilled by another donor.`,
          notificationType: 'REQUEST_CLOSED',
          relatedRequestId: bloodRequest._id
        });

        await sendRequestClosedNotificationEmail({
          donorEmail: otherInv.donorId.email,
          donorName: otherInv.donorId.fullName,
          requiredBloodGroup: bloodRequest.requiredBloodGroup,
          requestLocation: bloodRequest.requestAddress
        });
      }
    }

    // Calculate 6-month cooldown
    const acceptanceDate = new Date();
    const nextEligibleDate = calculateNextEligibleDate(acceptanceDate);

    // Update Donor availability & cooldown status
    donor.donorStatus = 'Donation Cooldown';
    donor.isAvailable = false;
    donor.lastDonationDate = acceptanceDate;
    donor.totalDonations += 1;
    donor.nextEligibleDate = nextEligibleDate;
    await donor.save();

    // Create Donation History Record
    const donationRecord = await DonationHistory.create({
      donorId: donor._id,
      requesterId: bloodRequest.requesterId,
      requestId: bloodRequest._id,
      invitationId: invitation._id,
      bloodGroup: donor.bloodGroup,
      units: bloodRequest.unitsRequired,
      requestLocation: bloodRequest.requestAddress,
      recordType: 'Acceptance-Based Record',
      recordedDate: acceptanceDate,
      actualDonationConfirmed: false,
      nextEligibleDate,
      status: 'Active Record'
    });

    // Fetch Requester to send notification & email revealing donor contact info
    const requester = await User.findById(bloodRequest.requesterId);
    if (requester) {
      await Notification.create({
        userId: requester._id,
        title: 'Blood Request Accepted!',
        message: `${donor.fullName} (${donor.bloodGroup}) accepted your request for ${bloodRequest.requiredBloodGroup}. Contact: ${donor.phone}`,
        notificationType: 'REQUEST_ACCEPTED',
        relatedRequestId: bloodRequest._id,
        relatedInvitationId: invitation._id
      });

      await sendRequestAcceptedEmail({
        requesterEmail: requester.email,
        requesterName: requester.fullName,
        donorName: donor.fullName,
        donorAge: age,
        donorBloodGroup: donor.bloodGroup,
        donorDonationCount: donor.totalDonations,
        donorLocation: donor.locationAddress,
        donorMobile: donor.phone,
        requiredBloodGroup: bloodRequest.requiredBloodGroup,
        unitsRequired: bloodRequest.unitsRequired,
        acceptanceDate: acceptanceDate.toLocaleString(),
        requestUrl: `${process.env.APP_URL || 'http://localhost:5173'}/requests`
      });
    }

    // Audit Log
    await AuditLog.create({
      userId: donor._id,
      action: 'INVITATION_ACCEPTED',
      entityType: 'Invitation',
      entityId: invitation._id,
      details: {
        requestId: bloodRequest._id,
        donorId: donor._id,
        nextEligibleDate,
        cooldownStarted: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Blood request accepted successfully. Donor cooldown has been activated.',
      invitation,
      bloodRequest,
      cooldown: {
        nextEligibleDate,
        donorStatus: donor.donorStatus
      }
    });
  } catch (error) {
    console.error('acceptInvitation error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error accepting invitation.' });
  }
};

/**
 * @desc Decline Blood Request Invitation
 * @route POST /api/invitations/:id/decline
 */
const declineInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id).populate('requestId');
    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found.' });
    }

    if (invitation.donorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    if (invitation.status !== 'Sent') {
      return res.status(400).json({ success: false, message: `Invitation already ${invitation.status.toLowerCase()}.` });
    }

    invitation.status = 'Declined';
    invitation.respondedAt = new Date();
    await invitation.save();

    const requester = await User.findById(invitation.requestId.requesterId);
    if (requester) {
      await Notification.create({
        userId: requester._id,
        title: 'Donor Declined Request',
        message: `An invited donor was unable to accept your request for ${invitation.requestId.requiredBloodGroup}.`,
        notificationType: 'REQUEST_DECLINED',
        relatedRequestId: invitation.requestId._id
      });

      await sendRequestDeclinedEmail({
        requesterEmail: requester.email,
        requesterName: requester.fullName,
        requiredBloodGroup: invitation.requestId.requiredBloodGroup
      });
    }

    await AuditLog.create({
      userId: req.user._id,
      action: 'INVITATION_DECLINED',
      entityType: 'Invitation',
      entityId: invitation._id
    });

    return res.status(200).json({
      success: true,
      message: 'Invitation declined.',
      invitation
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error declining invitation.' });
  }
};

/**
 * @desc Report Mistaken Acceptance (Donor reports accidental acceptance)
 * @route POST /api/invitations/:id/request-cancellation
 */
const requestMistakenCancellation = async (req, res) => {
  try {
    const { reason } = req.body;
    const invitation = await Invitation.findById(req.params.id).populate('requestId');

    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found.' });
    }

    if (invitation.donorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    if (invitation.status !== 'Accepted') {
      return res.status(400).json({
        success: false,
        message: 'Only accepted invitations can have a mistaken acceptance cancellation requested.'
      });
    }

    invitation.status = 'Cancellation Requested';
    invitation.cancellationReason = reason || 'Donor reported accidental acceptance';
    invitation.cancellationRequestedAt = new Date();
    invitation.cancellationDecision = 'Pending';
    await invitation.save();

    // Mark blood request status
    const bloodRequest = await BloodRequest.findById(invitation.requestId._id);
    if (bloodRequest) {
      bloodRequest.status = 'Cancellation Requested';
      await bloodRequest.save();
    }

    // Notify requester
    const requester = await User.findById(invitation.requestId.requesterId);
    if (requester) {
      await Notification.create({
        userId: requester._id,
        title: 'Mistaken Acceptance Reported',
        message: `${req.user.fullName} reported an accidental acceptance. Reason: "${reason || 'Mistake'}". Please review in your dashboard.`,
        notificationType: 'CANCELLATION_REQUESTED',
        relatedRequestId: invitation.requestId._id,
        relatedInvitationId: invitation._id
      });

      await sendMistakenAcceptanceAlertEmail({
        requesterEmail: requester.email,
        requesterName: requester.fullName,
        donorName: req.user.fullName,
        reason,
        requestUrl: `${process.env.APP_URL || 'http://localhost:5173'}/requests`
      });
    }

    await AuditLog.create({
      userId: req.user._id,
      action: 'MISTAKEN_ACCEPTANCE_REPORTED',
      entityType: 'Invitation',
      entityId: invitation._id,
      details: { reason }
    });

    return res.status(200).json({
      success: true,
      message: 'Cancellation request submitted. Awaiting approval from the requester.',
      invitation
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

/**
 * @desc Approve Cancellation of Mistaken Acceptance (Requester approves)
 * @route POST /api/invitations/:id/approve-cancellation
 */
const approveCancellation = async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id)
      .populate('requestId')
      .populate('donorId');

    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found.' });
    }

    // Verify requester ownership
    if (invitation.requestId.requesterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Only the requester can approve this cancellation.' });
    }

    if (invitation.status !== 'Cancellation Requested') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve cancellation for invitation in '${invitation.status}' state.`
      });
    }

    // 1. Update Invitation
    invitation.status = 'Cancelled';
    invitation.cancellationDecision = 'Approved';
    invitation.cancellationDecisionAt = new Date();
    await invitation.save();

    // 2. Reverse Donation History Record
    const donation = await DonationHistory.findOne({
      invitationId: invitation._id,
      status: 'Active Record'
    });

    if (donation) {
      donation.status = 'Reversed - Mistaken Acceptance';
      donation.reversedAt = new Date();
      donation.reverseReason = invitation.cancellationReason;
      await donation.save();
    }

    // 3. Restore Donor's eligibility & clear acceptance cooldown
    const donor = invitation.donorId;
    if (donor) {
      donor.totalDonations = Math.max(0, donor.totalDonations - 1);

      // Check if donor has any other prior legitimate active donation cooldown
      const priorDonation = await DonationHistory.findOne({
        donorId: donor._id,
        status: { $in: ['Active Record', 'Completed'] },
        _id: { $ne: donation ? donation._id : null }
      }).sort({ recordedDate: -1 });

      if (priorDonation && priorDonation.nextEligibleDate && new Date() < new Date(priorDonation.nextEligibleDate)) {
        // Keep prior cooldown
        donor.nextEligibleDate = priorDonation.nextEligibleDate;
        donor.donorStatus = 'Donation Cooldown';
        donor.isAvailable = false;
      } else {
        // Full restoration
        donor.nextEligibleDate = null;
        donor.donorStatus = 'Active';
        donor.isAvailable = true;
      }

      await donor.save();

      // Notify donor
      await Notification.create({
        userId: donor._id,
        title: 'Cancellation Approved - Cooldown Restored',
        message: `${req.user.fullName} approved your mistaken acceptance cancellation. Your cooldown has been removed and your donor availability restored.`,
        notificationType: 'CANCELLATION_APPROVED',
        relatedRequestId: invitation.requestId._id
      });

      await sendCancellationDecisionEmail({
        donorEmail: donor.email,
        donorName: donor.fullName,
        decision: 'Approved',
        requesterName: req.user.fullName
      });
    }

    // 4. Reopen Request for new search/matching
    const bloodRequest = await BloodRequest.findById(invitation.requestId._id);
    if (bloodRequest) {
      bloodRequest.status = 'Searching';
      bloodRequest.acceptedDonorId = null;
      bloodRequest.acceptedAt = null;
      await bloodRequest.save();
    }

    await AuditLog.create({
      userId: req.user._id,
      action: 'CANCELLATION_APPROVED',
      entityType: 'Invitation',
      entityId: invitation._id,
      details: { donorId: donor ? donor._id : null, cooldownReversed: true }
    });

    return res.status(200).json({
      success: true,
      message: 'Cancellation approved. Donor cooldown removed and blood request reopened.',
      invitation
    });
  } catch (error) {
    console.error('approveCancellation error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

/**
 * @desc Reject Cancellation of Mistaken Acceptance (Requester rejects)
 * @route POST /api/invitations/:id/reject-cancellation
 */
const rejectCancellation = async (req, res) => {
  try {
    const { reason } = req.body;
    const invitation = await Invitation.findById(req.params.id)
      .populate('requestId')
      .populate('donorId');

    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found.' });
    }

    if (invitation.requestId.requesterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    if (invitation.status !== 'Cancellation Requested') {
      return res.status(400).json({
        success: false,
        message: 'No cancellation request is currently pending.'
      });
    }

    // Revert back to Accepted
    invitation.status = 'Accepted';
    invitation.cancellationDecision = 'Rejected';
    invitation.cancellationDecisionReason = reason || 'Requester declined cancellation';
    invitation.cancellationDecisionAt = new Date();
    await invitation.save();

    // Revert BloodRequest back to Matched
    const bloodRequest = await BloodRequest.findById(invitation.requestId._id);
    if (bloodRequest) {
      bloodRequest.status = 'Matched';
      await bloodRequest.save();
    }

    // Notify donor
    const donor = invitation.donorId;
    if (donor) {
      await Notification.create({
        userId: donor._id,
        title: 'Cancellation Request Rejected',
        message: `${req.user.fullName} did not approve your cancellation request. The request remains in accepted status.`,
        notificationType: 'CANCELLATION_REJECTED',
        relatedRequestId: invitation.requestId._id
      });

      await sendCancellationDecisionEmail({
        donorEmail: donor.email,
        donorName: donor.fullName,
        decision: 'Rejected',
        requesterName: req.user.fullName
      });
    }

    await AuditLog.create({
      userId: req.user._id,
      action: 'CANCELLATION_REJECTED',
      entityType: 'Invitation',
      entityId: invitation._id,
      details: { reason }
    });

    return res.status(200).json({
      success: true,
      message: 'Cancellation request rejected. Accepted status retained.',
      invitation
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

module.exports = {
  getMyInvitations,
  getInvitationById,
  acceptInvitation,
  declineInvitation,
  requestMistakenCancellation,
  approveCancellation,
  rejectCancellation
};
