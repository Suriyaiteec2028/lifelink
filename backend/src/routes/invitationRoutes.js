const express = require('express');
const router = express.Router();
const {
  getMyInvitations,
  getInvitationById,
  acceptInvitation,
  declineInvitation,
  requestMistakenCancellation,
  approveCancellation,
  rejectCancellation
} = require('../controllers/invitationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/my', getMyInvitations);
router.get('/:id', getInvitationById);
router.post('/:id/accept', acceptInvitation);
router.post('/:id/decline', declineInvitation);
router.post('/:id/request-cancellation', requestMistakenCancellation);
router.post('/:id/approve-cancellation', approveCancellation);
router.post('/:id/reject-cancellation', rejectCancellation);

module.exports = router;
