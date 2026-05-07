const express = require("express");
const router = express.Router();
const {
  logActivity,
  getUserActivities,
} = require("../../controllers/activityController");
const { protect } = require("../../middleware/authMiddleware");

router.route("/").get(protect, getUserActivities);
router.route("/log").post(protect, logActivity);

module.exports = router;
