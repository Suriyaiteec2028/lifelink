const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTPRecord = require('../models/OTPRecord');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { calculateAge, isAgeEligible } = require('../utils/age');
const { VALID_BLOOD_GROUPS } = require('../utils/compatibility');
const { sendRegistrationOTPEmail, sendPasswordResetOTPEmail } = require('../utils/emailService');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'lifelink_jwt_secret_dev_key_2026', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const generateSecureOTP = () => {
  // Generate cryptographically strong 6-digit numeric OTP
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * @desc Step 1: Validate registration info and send OTP
 * @route POST /api/auth/send-otp
 */
const sendRegistrationOTP = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      email,
      bloodGroup,
      dateOfBirth,
      locationAddress,
      latitude,
      longitude,
      password,
      confirmPassword
    } = req.body;

    // 1. Mandatory field checks
    if (!fullName || !phone || !email || !bloodGroup || !dateOfBirth || !locationAddress || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required registration fields.'
      });
    }

    // 2. Validate passwords
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters in length.'
      });
    }

    // 3. Validate Blood Group
    if (!VALID_BLOOD_GROUPS.includes(bloodGroup)) {
      return res.status(400).json({
        success: false,
        message: `Invalid blood group. Supported groups: ${VALID_BLOOD_GROUPS.join(', ')}`
      });
    }

    // 4. Age validation (Must be 18+)
    const age = calculateAge(dateOfBirth);
    if (age < 18) {
      return res.status(400).json({
        success: false,
        message: 'You must be at least 18 years old to create an account.'
      });
    }

    // 5. Check if email already registered
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'This email address is already registered. Please log in.'
      });
    }

    // 6. Generate OTP and hash it
    const otp = generateSecureOTP();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save temporary data in OTP record
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Invalidate previous unverified registration OTPs for this email
    await OTPRecord.updateMany(
      { email: normalizedEmail, purpose: 'REGISTRATION', isUsed: false },
      { isUsed: true }
    );

    const otpDoc = await OTPRecord.create({
      email: normalizedEmail,
      otpHash,
      purpose: 'REGISTRATION',
      expiresAt,
      tempRegistrationData: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: normalizedEmail,
        passwordHash,
        bloodGroup,
        dateOfBirth: new Date(dateOfBirth),
        locationAddress: locationAddress.trim(),
        latitude: Number(latitude) || 13.0827,
        longitude: Number(longitude) || 80.2707,
        donorStatus: 'Active',
        isAvailable: true
      }
    });

    // 7. Send Email
    await sendRegistrationOTPEmail(normalizedEmail, otp, fullName);

    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}. It is valid for 5 minutes.`,
      email: normalizedEmail,
      // Provide devOtp when not in production for easy automated testing & review
      devOtp: process.env.NODE_ENV === 'production' ? undefined : otp
    });
  } catch (error) {
    console.error('sendRegistrationOTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send registration OTP. Please try again.'
    });
  }
};

/**
 * @desc Step 2: Verify registration OTP and create account
 * @route POST /api/auth/verify-otp
 */
const verifyRegistrationOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP code are required.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpRecord = await OTPRecord.findOne({
      email: normalizedEmail,
      purpose: 'REGISTRATION',
      isUsed: false
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'No active OTP verification session found for this email. Please request a new OTP.'
      });
    }

    const verificationResult = await otpRecord.verifyOTP(otp);
    if (!verificationResult.valid) {
      return res.status(400).json({
        success: false,
        message: verificationResult.reason
      });
    }

    // Check if account was created meanwhile
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const userData = otpRecord.tempRegistrationData;
    if (!userData) {
      return res.status(400).json({
        success: false,
        message: 'Registration session expired. Please register again.'
      });
    }

    // Create user
    const newUser = await User.create({
      ...userData,
      emailVerified: true
    });

    // Create welcome notification
    await Notification.create({
      userId: newUser._id,
      title: 'Welcome to LifeLink!',
      message: `Welcome ${newUser.fullName}. Your account has been registered with blood group ${newUser.bloodGroup}. Your donor availability is Active.`,
      notificationType: 'REGISTRATION'
    });

    // Audit log
    await AuditLog.create({
      userId: newUser._id,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: newUser._id,
      details: { email: newUser.email, bloodGroup: newUser.bloodGroup }
    });

    const token = generateToken(newUser._id);

    return res.status(201).json({
      success: true,
      message: 'Account created and verified successfully!',
      token,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        bloodGroup: newUser.bloodGroup,
        dateOfBirth: newUser.dateOfBirth,
        age: newUser.age,
        locationAddress: newUser.locationAddress,
        latitude: newUser.latitude,
        longitude: newUser.longitude,
        donorStatus: newUser.donorStatus,
        isAvailable: newUser.isAvailable,
        totalDonations: newUser.totalDonations,
        nextEligibleDate: newUser.nextEligibleDate
      }
    });
  } catch (error) {
    console.error('verifyRegistrationOTP error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while verifying OTP.'
    });
  }
};

/**
 * @desc User Login
 * @route POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.'
      });
    }

    // Auto-update cooldown if expired
    if (user.donorStatus === 'Donation Cooldown' && user.nextEligibleDate && new Date() >= new Date(user.nextEligibleDate)) {
      user.donorStatus = 'Inactive';
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
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
    console.error('login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.'
    });
  }
};

/**
 * @desc Request Forgot Password OTP
 * @route POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered email address.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Return vague message for privacy or clean message
      return res.status(404).json({
        success: false,
        message: 'No registered user found with this email address.'
      });
    }

    const otp = generateSecureOTP();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Invalidate prior forgot password OTPs
    await OTPRecord.updateMany(
      { email: normalizedEmail, purpose: 'FORGOT_PASSWORD', isUsed: false },
      { isUsed: true }
    );

    await OTPRecord.create({
      email: normalizedEmail,
      otpHash,
      purpose: 'FORGOT_PASSWORD',
      expiresAt
    });

    await sendPasswordResetOTPEmail(normalizedEmail, otp, user.fullName);

    return res.status(200).json({
      success: true,
      message: `Password reset OTP has been sent to ${normalizedEmail}.`,
      email: normalizedEmail,
      devOtp: process.env.NODE_ENV === 'production' ? undefined : otp
    });
  } catch (error) {
    console.error('forgotPassword error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process forgot password request.'
    });
  }
};

/**
 * @desc Reset Password using OTP
 * @route POST /api/auth/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required.'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters in length.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpRecord = await OTPRecord.findOne({
      email: normalizedEmail,
      purpose: 'FORGOT_PASSWORD',
      isUsed: false
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'No active password reset OTP session found. Please request a new OTP.'
      });
    }

    const verificationResult = await otpRecord.verifyOTP(otp);
    if (!verificationResult.valid) {
      return res.status(400).json({
        success: false,
        message: verificationResult.reason
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    await Notification.create({
      userId: user._id,
      title: 'Password Reset Successful',
      message: 'Your LifeLink account password was updated successfully.',
      notificationType: 'SECURITY_ALERT'
    });

    await AuditLog.create({
      userId: user._id,
      action: 'PASSWORD_RESET_SUCCESS',
      entityType: 'User',
      entityId: user._id
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.'
    });
  } catch (error) {
    console.error('resetPassword error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password.'
    });
  }
};

/**
 * @desc Get current authenticated user profile
 * @route GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const unreadNotifications = await Notification.countDocuments({ userId: user._id, isRead: false });

    return res.status(200).json({
      success: true,
      user: {
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
        nextEligibleDate: user.nextEligibleDate,
        unreadNotifications
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error retrieving user data.' });
  }
};

module.exports = {
  sendRegistrationOTP,
  verifyRegistrationOTP,
  login,
  forgotPassword,
  resetPassword,
  getMe
};
