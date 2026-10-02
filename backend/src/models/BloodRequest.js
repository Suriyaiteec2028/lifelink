const mongoose = require('mongoose');

const BloodRequestSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    requesterNameSnapshot: {
      type: String,
      required: true
    },
    requesterAgeSnapshot: {
      type: Number,
      required: true
    },
    requesterBloodGroupSnapshot: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
    },
    requiredBloodGroup: {
      type: String,
      required: [true, 'Required blood group is mandatory'],
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
      index: true
    },
    unitsRequired: {
      type: Number,
      required: [true, 'Number of units required is mandatory'],
      min: [1, 'At least 1 unit must be requested']
    },
    requestAddress: {
      type: String,
      required: [true, 'Request address is mandatory'],
      trim: true
    },
    requestLatitude: {
      type: Number,
      required: true
    },
    requestLongitude: {
      type: Number,
      required: true
    },
    requestLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        default: [0, 0]
      }
    },
    searchRadiusKm: {
      type: Number,
      required: [true, 'Search radius is mandatory'],
      min: [1, 'Search radius must be at least 1 km'],
      max: [500, 'Search radius cannot exceed 500 km']
    },
    requiredDate: {
      type: Date,
      required: [true, 'Required date is mandatory']
    },
    requiredTime: {
      type: String,
      required: [true, 'Required time is mandatory']
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone number is mandatory'],
      trim: true
    },
    additionalInformation: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: [
        'Draft',
        'Searching',
        'Invitations Sent',
        'Matched',
        'Cancellation Requested',
        'Cancelled',
        'Expired',
        'Closed'
      ],
      default: 'Invitations Sent',
      index: true
    },
    acceptedDonorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    acceptedAt: {
      type: Date,
      default: null
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    cancellationReason: {
      type: String,
      default: null
    },
    invitationsCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

BloodRequestSchema.index({ requestLocation: '2dsphere' });
BloodRequestSchema.index({ status: 1, requiredBloodGroup: 1 });

BloodRequestSchema.pre('save', function (next) {
  if (this.isModified('requestLatitude') || this.isModified('requestLongitude') || !this.requestLocation || !this.requestLocation.coordinates.length) {
    this.requestLocation = {
      type: 'Point',
      coordinates: [this.requestLongitude, this.requestLatitude]
    };
  }
  next();
});

module.exports = mongoose.model('BloodRequest', BloodRequestSchema);
