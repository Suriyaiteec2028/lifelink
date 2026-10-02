const User = require('../models/User');
const DonationHistory = require('../models/DonationHistory');
const BloodRequest = require('../models/BloodRequest');
const AuditLog = require('../models/AuditLog');
const { isInCooldown } = require('../utils/cooldown');
const { calculateAge } = require('../utils/age');

/**
 * @desc Get user profile
 * @route GET /api/donors/profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    return res.status(200).json({
      success: true,
      profile: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        bloodGroup: user.bloodGroup,
        dateOfBirth: user.dateOfBirth,
        age: user.age,
        locationAddress: user.locationAddress,
        latitude: user.latitude,
        longitude: user.longitude,
        donorStatus: user.donorStatus,
        isAvailable: user.isAvailable,
        totalDonations: user.totalDonations,
        lastDonationDate: user.lastDonationDate,
        nextEligibleDate: user.nextEligibleDate
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving profile.' });
  }
};

/**
 * @desc Update user profile (Name, phone, location address/coords, etc.)
 * @route PUT /api/donors/profile
 */
const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, locationAddress, latitude, longitude, bloodGroup } = req.body;
    const user = await User.findById(req.user._id);

    if (fullName) user.fullName = fullName.trim();
    if (phone) user.phone = phone.trim();
    if (bloodGroup) user.bloodGroup = bloodGroup;

    if (locationAddress) user.locationAddress = locationAddress.trim();
    if (latitude !== undefined && longitude !== undefined) {
      user.latitude = Number(latitude);
      user.longitude = Number(longitude);
      user.location = {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)]
      };
    }

    await user.save();

    await AuditLog.create({
      userId: user._id,
      action: 'PROFILE_UPDATED',
      entityType: 'User',
      entityId: user._id,
      details: { fullName: user.fullName, locationAddress: user.locationAddress }
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      profile: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        bloodGroup: user.bloodGroup,
        dateOfBirth: user.dateOfBirth,
        age: user.age,
        locationAddress: user.locationAddress,
        latitude: user.latitude,
        longitude: user.longitude,
        donorStatus: user.donorStatus,
        isAvailable: user.isAvailable,
        totalDonations: user.totalDonations,
        nextEligibleDate: user.nextEligibleDate
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to update profile.' });
  }
};

/**
 * @desc Get Donor Availability Status
 * @route GET /api/donors/availability
 */
const getAvailability = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const inCooldown = isInCooldown(user.nextEligibleDate);

    // If cooldown elapsed and status is still Donation Cooldown, auto-transition
    if (!inCooldown && user.donorStatus === 'Donation Cooldown') {
      user.donorStatus = 'Inactive';
      await user.save();
    }

    return res.status(200).json({
      success: true,
      availability: {
        donorStatus: user.donorStatus,
        isAvailable: user.donorStatus === 'Active',
        inCooldown,
        lastDonationDate: user.lastDonationDate,
        nextEligibleDate: user.nextEligibleDate
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving availability.' });
  }
};

/**
 * @desc Update Donor Availability (Active <-> Inactive)
 * @route PUT /api/donors/availability
 */
const updateAvailability = async (req, res) => {
  try {
    const { status } = req.body; // 'Active' or 'Inactive'
    const user = await User.findById(req.user._id);

    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'Active' or 'Inactive'."
      });
    }

    // Check cooldown restriction
    const inCooldown = isInCooldown(user.nextEligibleDate);
    if (inCooldown && status === 'Active') {
      const formattedDate = new Date(user.nextEligibleDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      return res.status(400).json({
        success: false,
        message: `You are currently in a mandatory donation cooldown period and cannot activate your donor status until ${formattedDate}.`
      });
    }

    const previousStatus = user.donorStatus;
    user.donorStatus = status;
    user.isAvailable = status === 'Active';
    await user.save();

    await AuditLog.create({
      userId: user._id,
      action: 'AVAILABILITY_CHANGED',
      entityType: 'User',
      entityId: user._id,
      details: { previousStatus, newStatus: status }
    });

    return res.status(200).json({
      success: true,
      message: `Donor availability updated to ${status}.`,
      availability: {
        donorStatus: user.donorStatus,
        isAvailable: user.isAvailable,
        inCooldown,
        nextEligibleDate: user.nextEligibleDate
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to update availability.' });
  }
};

/**
 * @desc Get detailed donor eligibility
 * @route GET /api/donors/eligibility
 */
const getEligibility = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const age = calculateAge(user.dateOfBirth);
    const inCooldown = isInCooldown(user.nextEligibleDate);

    // Active accepted requests where user is the donor
    const activeAcceptedRequest = await BloodRequest.findOne({
      acceptedDonorId: user._id,
      status: { $in: ['Matched', 'Cancellation Requested'] }
    });

    const isEligible =
      age >= 18 &&
      !inCooldown &&
      !activeAcceptedRequest;

    return res.status(200).json({
      success: true,
      eligibility: {
        isEligible,
        age,
        ageEligible: age >= 18,
        inCooldown,
        nextEligibleDate: user.nextEligibleDate,
        hasActiveAcceptedRequest: !!activeAcceptedRequest,
        donorStatus: user.donorStatus,
        totalDonations: user.totalDonations
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving eligibility.' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAvailability,
  updateAvailability,
  getEligibility
};
