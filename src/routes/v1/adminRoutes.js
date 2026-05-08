const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../../middleware/authMiddleware");
const {
  getAdminStats,
  getAdminUsers,
  updateAdminUser,
  toggleSuspendUser,
  deleteAdminUser,
  getAdminApiStats,
  getActiveWorkoutSessions
} = require("../../controllers/adminController");

// Apply protection globally to all admin routes
router.use(protect);
