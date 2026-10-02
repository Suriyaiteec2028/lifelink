const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    notificationType: {
      type: String,
      enum: [
        'REGISTRATION',
        'PASSWORD_RESET',
        'NEW_BLOOD_INVITATION',
        'REQUEST_ACCEPTED',
        'REQUEST_DECLINED',
        'REQUEST_CLOSED',
        'CANCELLATION_REQUESTED',
        'CANCELLATION_APPROVED',
        'CANCELLATION_REJECTED',
        'REQUEST_CANCELLED',
        'COOLDOWN_ENDED',
        'SECURITY_ALERT'
      ],
      required: true,
      index: true
    },
    relatedRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BloodRequest',
      default: null
    },
    relatedInvitationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invitation',
      default: null
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
