const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const OTPRecordSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    otpHash: {
      type: String,
      required: true
    },
    purpose: {
      type: String,
      enum: ['REGISTRATION', 'FORGOT_PASSWORD', 'EMAIL_UPDATE'],
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // TTL index removes document after expiresAt
    },
    attemptCount: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 5
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    isUsed: {
      type: Boolean,
      default: false
    },
    tempRegistrationData: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Method to verify OTP
OTPRecordSchema.methods.verifyOTP = async function (enteredOTP) {
  if (this.isUsed) {
    return { valid: false, reason: 'This OTP has already been used.' };
  }
  if (new Date() > this.expiresAt) {
    return { valid: false, reason: 'This OTP has expired. Please request a new one.' };
  }
  if (this.attemptCount >= this.maxAttempts) {
    return { valid: false, reason: 'Maximum OTP verification attempts exceeded. Please request a new OTP.' };
  }

  const isMatch = await bcrypt.compare(enteredOTP.toString(), this.otpHash);
  if (!isMatch) {
    this.attemptCount += 1;
    await this.save();
    const remaining = this.maxAttempts - this.attemptCount;
    return { valid: false, reason: `Invalid OTP. ${remaining} attempt(s) remaining.` };
  }

  this.isUsed = true;
  this.verifiedAt = new Date();
  await this.save();
  return { valid: true };
};

module.exports = mongoose.model('OTPRecord', OTPRecordSchema);
