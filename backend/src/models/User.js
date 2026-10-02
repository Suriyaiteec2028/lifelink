const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { calculateAge } = require('../utils/age');

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false
    },
    bloodGroup: {
      type: String,
      required: [true, 'Blood group is required'],
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
      index: true
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required']
    },
    ageEligibilityVerified: {
      type: Boolean,
      default: true
    },
    locationAddress: {
      type: String,
      required: [true, 'Location address is required'],
      trim: true
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required']
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required']
    },
    location: {
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
    donorStatus: {
      type: String,
      enum: ['Active', 'Inactive', 'Donation Cooldown'],
      default: 'Active',
      index: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    totalDonations: {
      type: Number,
      default: 0
    },
    lastDonationDate: {
      type: Date,
      default: null
    },
    nextEligibleDate: {
      type: Date,
      default: null
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    lastLogin: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// 2dsphere index for geospatial searches if needed
UserSchema.index({ location: '2dsphere' });
UserSchema.index({ bloodGroup: 1, donorStatus: 1 });

// Virtual age field
UserSchema.virtual('age').get(function () {
  return calculateAge(this.dateOfBirth);
});

// Compare entered password with hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Sync location coordinates before save
UserSchema.pre('save', function (next) {
  if (this.isModified('latitude') || this.isModified('longitude') || !this.location || !this.location.coordinates.length) {
    this.location = {
      type: 'Point',
      coordinates: [this.longitude, this.latitude]
    };
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
