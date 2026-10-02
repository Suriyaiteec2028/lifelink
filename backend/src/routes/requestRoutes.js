const express = require('express');
const router = express.Router();
const {
  searchDonors,
  createRequest,
  sendInvitations,
  getMyRequests,
  getRequestById,
  cancelRequest,
  getRequestHistory
} = require('../controllers/requestController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/search-donors', searchDonors);
router.post('/', createRequest);
router.get('/my', getMyRequests);
router.get('/history', getRequestHistory);
router.get('/:id', getRequestById);
router.post('/:id/invitations', sendInvitations);
router.post('/:id/cancel', cancelRequest);

module.exports = router;
