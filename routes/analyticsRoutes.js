const express = require("express");
const router = express.Router();
const {
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getProgressStats
} = require("../src/controllers/analyticsController");
const { protect } = require("../src/middleware/authMiddleware");

router.route("/weekly").get(protect, getWeeklyAnalytics);
router.route("/monthly").get(protect, getMonthlyAnalytics);
router.route("/progress").get(protect, getProgressStats);

module.exports = router;
