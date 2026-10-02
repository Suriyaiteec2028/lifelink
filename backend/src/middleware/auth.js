const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token missing or invalid. Please log in.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'lifelink_jwt_secret_dev_key_2026');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // Auto-update cooldown if elapsed
    if (user.donorStatus === 'Donation Cooldown' && user.nextEligibleDate && new Date() >= new Date(user.nextEligibleDate)) {
      user.donorStatus = 'Inactive'; // Eligible to be activated now
      await user.save();
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.'
    });
  }
};

module.exports = { protect };
