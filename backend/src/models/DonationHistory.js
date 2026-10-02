const mongoose = require('mongoose');

const DonationHistorySchema = new mongoose.Schema(
  {
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BloodRequest',
      required: true,
      index: true
    },
    invitationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invitation',
      required: true
    },
    bloodGroup: {
      type: String,
      required: true,
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
    },
    units: {
      type: Number,
      default: 1
    },
    requestLocation: {
      type: String,
      default: ''
    },
    recordType: {
      type: String,
      enum: ['Acceptance-Based Record', 'Confirmed Actual Donation'],
      default: 'Acceptance-Based Record',
      required: true
    },
    recordedDate: {
      type: Date,
      default: Date.now
    },
    actualDonationConfirmed: {
      type: Boolean,
      default: false
    },
    nextEligibleDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['Active Record', 'Reversed - Mistaken Acceptance', 'Completed'],
      default: 'Active Record',
      index: true
    },
    reversedAt: {
      type: Date,
      default: null
    },
    reverseReason: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

DonationHistorySchema.index({ donorId: 1, recordedDate: -1 });

module.exports = mongoose.model('DonationHistory', DonationHistorySchema);
