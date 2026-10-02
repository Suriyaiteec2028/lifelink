const BloodRequest = require('../models/BloodRequest');
const Invitation = require('../models/Invitation');
const User = require('../models/User');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { getCompatibleDonorGroups } = require('../utils/compatibility');
const { calculateDistanceKm } = require('../utils/distance');
const { calculateAge } = require('../utils/age');
const { isInCooldown } = require('../utils/cooldown');
const {
  sendBloodRequestInvitationEmail,
  sendRequestCancelledByRequesterEmail
} = require('../utils/emailService');

/**
 * @desc Search nearby eligible compatible donors
 * @route POST /api/requests/search-donors
 */
const searchDonors = async (req, res) => {
  try {
    const { requiredBloodGroup, requestLatitude, requestLongitude, searchRadiusKm } = req.body;

    if (!requiredBloodGroup || requestLatitude === undefined || requestLongitude === undefined || !searchRadiusKm) {
      return res.status(400).json({
        success: false,
        message: 'Please provide required blood group, request latitude, longitude, and search radius.'
      });
    }

    const radius = Number(searchRadiusKm);
    if (isNaN(radius) || radius <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Search radius must be a valid positive number.'
      });
    }

    const compatibleGroups = getCompatibleDonorGroups(requiredBloodGroup);
    if (!compatibleGroups.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blood group specified.'
      });
    }

    // 1. Fetch potential donors from database matching criteria
    const candidates = await User.find({
      _id: { $ne: req.user._id }, // Don't match the requester
      bloodGroup: { $in: compatibleGroups },
      donorStatus: 'Active',
      isAvailable: true
    }).select('-passwordHash');

    // 2. Filter candidates based on age, cooldown, active requests, and distance
    const matchedDonors = [];

    for (const candidate of candidates) {
      // Age verification (18+)
      const age = calculateAge(candidate.dateOfBirth);
      if (age < 18) continue;

      // Cooldown check
      if (isInCooldown(candidate.nextEligibleDate)) continue;

      // Active matched request check (donor already committed to another request)
      const existingCommitment = await BloodRequest.findOne({
        acceptedDonorId: candidate._id,
        status: { $in: ['Matched', 'Cancellation Requested'] }
      });
      if (existingCommitment) continue;

      // Calculate Haversine distance
      const distance = calculateDistanceKm(
        requestLatitude,
        requestLongitude,
        candidate.latitude,
        candidate.longitude
      );

      if (distance <= radius) {
        // Privacy: extract approximate area without exposing full home address or exact coordinates
        const addressParts = (candidate.locationAddress || '').split(',');
        const approximateArea = addressParts.length > 1
          ? addressParts.slice(-2).join(',').trim()
          : candidate.locationAddress;

        matchedDonors.push({
          id: candidate._id,
          fullName: candidate.fullName,
          bloodGroup: candidate.bloodGroup,
          age,
          distanceKm: distance,
          approximateArea,
          totalDonations: candidate.totalDonations,
          lastDonationDate: candidate.lastDonationDate,
          donorStatus: candidate.donorStatus,
          isEligible: true
        });
      }
    }

    // Sort by nearest distance first
    matchedDonors.sort((a, b) => a.distanceKm - b.distanceKm);

    return res.status(200).json({
      success: true,
      count: matchedDonors.length,
      searchCriteria: {
        requiredBloodGroup,
        compatibleGroups,
        searchRadiusKm: radius,
        requestCoordinates: { latitude: Number(requestLatitude), longitude: Number(requestLongitude) }
      },
      donors: matchedDonors,
      message:
        matchedDonors.length === 0
          ? 'No eligible donors found within your selected radius. You can increase the search distance or change the request location.'
          : `Found ${matchedDonors.length} eligible donor(s) within ${radius} km.`
    });
  } catch (error) {
    console.error('searchDonors error:', error);
    return res.status(500).json({ success: false, message: 'Server error while searching donors.' });
  }
};

/**
 * @desc Create a new Blood Request
 * @route POST /api/requests
 */
const createRequest = async (req, res) => {
  try {
    const {
      requiredBloodGroup,
      unitsRequired,
      requestAddress,
      requestLatitude,
      requestLongitude,
      searchRadiusKm,
      requiredDate,
      requiredTime,
      contactPhone,
      additionalInformation
    } = req.body;

    if (!requiredBloodGroup || !unitsRequired || !requestAddress || !requiredDate || !requiredTime) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all required fields.'
      });
    }

    // Date validation - prevent past dates
    const reqDateTime = new Date(`${requiredDate}T${requiredTime}`);
    const now = new Date();
    // Allow slight 5-minute grace for clock skew
    if (reqDateTime < new Date(now.getTime() - 5 * 60 * 1000)) {
      return res.status(400).json({
        success: false,
        message: 'The required date and time cannot be in the past.'
      });
    }

    const requester = req.user;
    const requesterAge = calculateAge(requester.dateOfBirth);

    const bloodRequest = await BloodRequest.create({
      requesterId: requester._id,
      requesterNameSnapshot: requester.fullName,
      requesterAgeSnapshot: requesterAge,
      requesterBloodGroupSnapshot: requester.bloodGroup,
      requiredBloodGroup,
      unitsRequired: Number(unitsRequired),
      requestAddress: requestAddress.trim(),
      requestLatitude: Number(requestLatitude),
      requestLongitude: Number(requestLongitude),
      searchRadiusKm: Number(searchRadiusKm) || 20,
      requiredDate: new Date(requiredDate),
      requiredTime,
      contactPhone: (contactPhone || requester.phone).trim(),
      additionalInformation: additionalInformation ? additionalInformation.trim() : '',
      status: 'Searching'
    });

    await AuditLog.create({
      userId: requester._id,
      action: 'BLOOD_REQUEST_CREATED',
      entityType: 'BloodRequest',
      entityId: bloodRequest._id,
      details: { requiredBloodGroup, unitsRequired }
    });

    return res.status(201).json({
      success: true,
      message: 'Blood request created successfully.',
      request: bloodRequest
    });
  } catch (error) {
    console.error('createRequest error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error creating request.' });
  }
};

/**
 * @desc Send Blood Request Invitations to Multiple Selected Donors
 * @route POST /api/requests/:id/invitations
 */
const sendInvitations = async (req, res) => {
  try {
    const { donorIds } = req.body;
    const requestId = req.params.id;

    if (!Array.isArray(donorIds) || donorIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one eligible donor to invite.'
      });
    }

    const bloodRequest = await BloodRequest.findById(requestId);
    if (!bloodRequest) {
      return res.status(404).json({ success: false, message: 'Blood request not found.' });
    }

    if (bloodRequest.requesterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You are not the owner of this request.' });
    }

    if (['Matched', 'Cancelled', 'Closed', 'Expired'].includes(bloodRequest.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot send invitations for a request with status: ${bloodRequest.status}`
      });
    }

    const createdInvitations = [];
    const skippedDonors = [];

    for (const donorId of donorIds) {
      const donor = await User.findById(donorId);
      if (!donor) continue;

      // Prevent duplicate invitation
      const existingInvitation = await Invitation.findOne({ requestId: bloodRequest._id, donorId });
      if (existingInvitation) {
        skippedDonors.push({ donorId, reason: 'Already invited' });
        continue;
      }

      // Create invitation
      const invitation = await Invitation.create({
        requestId: bloodRequest._id,
        donorId,
        status: 'Sent',
        sentAt: new Date()
      });

      createdInvitations.push(invitation);

      // Create In-App Notification
      await Notification.create({
        userId: donor._id,
        title: `Urgent ${bloodRequest.requiredBloodGroup} Blood Request`,
        message: `${bloodRequest.requesterNameSnapshot} needs ${bloodRequest.unitsRequired} unit(s) of ${bloodRequest.requiredBloodGroup} blood near ${bloodRequest.requestAddress}.`,
        notificationType: 'NEW_BLOOD_INVITATION',
        relatedRequestId: bloodRequest._id,
        relatedInvitationId: invitation._id
      });

      // Send Email Notification
      await sendBloodRequestInvitationEmail({
        donorEmail: donor.email,
        donorName: donor.fullName,
        requesterName: bloodRequest.requesterNameSnapshot,
        requesterAge: bloodRequest.requesterAgeSnapshot,
        requiredBloodGroup: bloodRequest.requiredBloodGroup,
        unitsRequired: bloodRequest.unitsRequired,
        requestLocation: bloodRequest.requestAddress,
        requiredDate: new Date(bloodRequest.requiredDate).toLocaleDateString(),
        requiredTime: bloodRequest.requiredTime,
        additionalInformation: bloodRequest.additionalInformation,
        invitationUrl: `${process.env.APP_URL || 'http://localhost:5173'}/invitations`
      });
    }

    // Update request state
    bloodRequest.status = 'Invitations Sent';
    bloodRequest.invitationsCount += createdInvitations.length;
    await bloodRequest.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'INVITATIONS_SENT',
      entityType: 'BloodRequest',
      entityId: bloodRequest._id,
      details: { invitationsSent: createdInvitations.length, skippedCount: skippedDonors.length }
    });

    return res.status(200).json({
      success: true,
      message: `Invitations sent to ${createdInvitations.length} donor(s).`,
      sentCount: createdInvitations.length,
      skippedCount: skippedDonors.length
    });
  } catch (error) {
    console.error('sendInvitations error:', error);
    return res.status(500).json({ success: false, message: 'Server error sending invitations.' });
  }
};

/**
 * @desc Get all requests created by current user
 * @route GET /api/requests/my
 */
const getMyRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find({ requesterId: req.user._id })
      .populate('acceptedDonorId', 'fullName phone bloodGroup locationAddress totalDonations')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      requests
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving requests.' });
  }
};

/**
 * @desc Get request details by ID
 * @route GET /api/requests/:id
 */
const getRequestById = async (req, res) => {
  try {
    const bloodRequest = await BloodRequest.findById(req.params.id)
      .populate('acceptedDonorId', 'fullName phone bloodGroup locationAddress totalDonations');

    if (!bloodRequest) {
      return res.status(404).json({ success: false, message: 'Blood request not found.' });
    }

    const isRequester = bloodRequest.requesterId.toString() === req.user._id.toString();

    // If requester, include all sent invitations and their statuses
    let invitations = [];
    if (isRequester) {
      invitations = await Invitation.find({ requestId: bloodRequest._id })
        .populate('donorId', 'fullName bloodGroup totalDonations locationAddress')
        .sort({ createdAt: -1 });
    }

    return res.status(200).json({
      success: true,
      request: bloodRequest,
      invitations,
      isRequester
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving request details.' });
  }
};

/**
 * @desc Cancel a Blood Request
 * @route POST /api/requests/:id/cancel
 */
const cancelRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const bloodRequest = await BloodRequest.findById(req.params.id);

    if (!bloodRequest) {
      return res.status(404).json({ success: false, message: 'Blood request not found.' });
    }

    if (bloodRequest.requesterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this request.' });
    }

    if (['Cancelled', 'Closed'].includes(bloodRequest.status)) {
      return res.status(400).json({ success: false, message: 'Request is already cancelled or closed.' });
    }

    bloodRequest.status = 'Cancelled';
    bloodRequest.cancelledAt = new Date();
    bloodRequest.cancellationReason = reason || 'Cancelled by requester';
    await bloodRequest.save();

    // Close all open invitations
    const pendingInvitations = await Invitation.find({
      requestId: bloodRequest._id,
      status: { $in: ['Sent', 'Accepted'] }
    }).populate('donorId', 'fullName email');

    for (const inv of pendingInvitations) {
      inv.status = 'Cancelled';
      inv.cancellationReason = reason || 'Request cancelled by requester';
      await inv.save();

      // Notify donor
      if (inv.donorId) {
        await Notification.create({
          userId: inv.donorId._id,
          title: 'Blood Request Cancelled',
          message: `The blood request for ${bloodRequest.requiredBloodGroup} has been cancelled by the requester.`,
          notificationType: 'REQUEST_CANCELLED',
          relatedRequestId: bloodRequest._id
        });

        await sendRequestCancelledByRequesterEmail({
          donorEmail: inv.donorId.email,
          donorName: inv.donorId.fullName,
          requiredBloodGroup: bloodRequest.requiredBloodGroup,
          cancellationReason: reason
        });
      }
    }

    await AuditLog.create({
      userId: req.user._id,
      action: 'REQUEST_CANCELLED',
      entityType: 'BloodRequest',
      entityId: bloodRequest._id,
      details: { reason }
    });

    return res.status(200).json({
      success: true,
      message: 'Blood request has been cancelled.',
      request: bloodRequest
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error cancelling request.' });
  }
};

/**
 * @desc Get complete request history for current user
 * @route GET /api/requests/history
 */
const getRequestHistory = async (req, res) => {
  try {
    const history = await BloodRequest.find({ requesterId: req.user._id })
      .populate('acceptedDonorId', 'fullName bloodGroup phone locationAddress totalDonations')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving request history.' });
  }
};

module.exports = {
  searchDonors,
  createRequest,
  sendInvitations,
  getMyRequests,
  getRequestById,
  cancelRequest,
  getRequestHistory
};
