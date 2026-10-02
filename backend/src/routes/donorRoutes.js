const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getAvailability,
  updateAvailability,
  getEligibility
} = require('../controllers/donorController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/availability', getAvailability);
router.put('/availability', updateAvailability);
router.get('/eligibility', getEligibility);

module.exports = router;
