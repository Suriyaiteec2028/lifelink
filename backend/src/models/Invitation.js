const mongoose = require('mongoose');

const InvitationSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BloodRequest',
      required: true,
      index: true
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['Sent', 'Accepted', 'Declined', 'Closed', 'Cancelled', 'Cancellation Requested'],
      default: 'Sent',
      index: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    respondedAt: {
      type: Date,
      default: null
    },
    acceptanceType: {
      type: String,
      enum: ['Acceptance-Based Donation', 'Confirmed Actual Donation', null],
      default: null
    },
    cancellationReason: {
      type: String,
      default: null
    },
    cancellationRequestedAt: {
      type: Date,
      default: null
    },
    cancellationDecisionAt: {
      type: Date,
      default: null
    },
    cancellationDecision: {
      type: String,
      enum: ['None', 'Pending', 'Approved', 'Rejected'],
      default: 'None'
    },
    cancellationDecisionReason: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Ensure one invitation per donor per request
InvitationSchema.index({ requestId: 1, donorId: 1 }, { unique: true });

module.exports = mongoose.model('Invitation', InvitationSchema);
