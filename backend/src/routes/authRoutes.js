const express = require('express');
const router = express.Router();
const {
  sendRegistrationOTP,
  verifyRegistrationOTP,
  login,
  forgotPassword,
  resetPassword,
  getMe
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { otpLimiter } = require('../middleware/rateLimiter');

router.post('/send-otp', otpLimiter, sendRegistrationOTP);
router.post('/verify-otp', verifyRegistrationOTP);
router.post('/login', login);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.post('/logout', protect, (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

module.exports = router;
