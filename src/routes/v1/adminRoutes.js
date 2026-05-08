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
router.use(adminOnly);

router.get("/stats", getAdminStats);
router.get("/active-sessions", getActiveWorkoutSessions);
router.get("/api-stats", getAdminApiStats);
router.get("/users", getAdminUsers);
router.route("/users/:id")
  .put(updateAdminUser)
  .delete(deleteAdminUser);
router.put("/users/:id/suspend", toggleSuspendUser);

module.exports = router;
