const express = require("express");
const router = express.Router();
const {
  startSession,
  pauseSession,
  resumeSession,
  endSession,
  getHistory,
  getStats
} = require("../src/controllers/workoutController");
const { protect } = require("../src/middleware/authMiddleware");

router.route("/start").post(protect, startSession);
router.route("/pause").post(protect, pauseSession);
router.route("/resume").post(protect, resumeSession);
router.route("/end").post(protect, endSession);
router.route("/history").get(protect, getHistory);
router.route("/stats").get(protect, getStats);

module.exports = router;
