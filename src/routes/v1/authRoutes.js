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
  handleGoogleCallback,
} = require("../../controllers/authController");
const { protect } = require("../../middleware/authMiddleware");
const validate = require("../../middleware/validate");
const { authLimiter } = require("../../middleware/security");
const {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} = require("../../validators/authValidator");

// Apply rate limits to registration/login
router.post("/register", authLimiter, validate({ body: registerSchema }), registerUser);
router.post("/login", authLimiter, validate({ body: loginSchema }), loginUser);

// Google Auth
router.get("/google/url", getGoogleAuthUrl);
router.post("/google/callback", handleGoogleCallback);

// OTP Routes (made public to handle unauthenticated password reset and verification flows)
router.post("/send-otp", sendOtp);
router.post("/verify-otp", validate({ body: verifyOtpSchema }), verifyOtp);
router.post("/verify-login-otp", validate({ body: verifyOtpSchema }), verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/resend-login-otp", resendOtp);

// Password Reset Routes
router.post("/forgot-password", validate({ body: forgotPasswordSchema }), forgotPassword);
router.post("/reset-password", validate({ body: resetPasswordSchema }), resetPassword);

// Session and Logout
router.post("/refresh", refreshSession);
router.post("/logout", logoutUser);

// Profile (Protected)
router.route("/profile")
  .get(protect, getUserProfile)
  .put(protect, validate({ body: updateProfileSchema }), updateUserProfile);

module.exports = router;
