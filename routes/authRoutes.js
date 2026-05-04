const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  verifyOtp,
  resendOtp,
} = require("../src/controllers/authController");
const { protect } = require("../src/middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-otp", protect, verifyOtp);
router.post("/resend-otp", protect, resendOtp);
router.route("/profile").get(protect, getUserProfile).put(protect, updateUserProfile);

module.exports = router;
