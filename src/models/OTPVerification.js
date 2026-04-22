const mongoose = require("mongoose");

const otpVerificationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ["email_verification", "password_reset"],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Rapid lookups by email and purpose
otpVerificationSchema.index({ email: 1, purpose: 1 });

const OTPVerification = mongoose.model("OTPVerification", otpVerificationSchema);

module.exports = OTPVerification;
