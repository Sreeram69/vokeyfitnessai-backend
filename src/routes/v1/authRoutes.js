const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  sendOtp,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  refreshSession,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getGoogleAuthUrl,
