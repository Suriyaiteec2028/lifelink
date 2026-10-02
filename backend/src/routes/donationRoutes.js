const express = require('express');
const router = express.Router();
const {
  getDonationHistory,
  getDonationById
} = require('../controllers/donationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/history', getDonationHistory);
router.get('/:id', getDonationById);

module.exports = router;
