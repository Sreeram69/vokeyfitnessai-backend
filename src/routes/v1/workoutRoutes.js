const express = require("express");
const router = express.Router();
const {
  startSession,
  pauseSession,
  resumeSession,
  endSession,
  updateSessionProgress,
  getHistory,
  getStats
} = require("../../controllers/workoutController");
const { protect } = require("../../middleware/authMiddleware");
const validate = require("../../middleware/validate");
const { startSessionSchema, endSessionSchema } = require("../../validators/workoutValidator");

router.route("/start").post(protect, validate({ body: startSessionSchema }), startSession);
router.route("/pause").post(protect, pauseSession);
router.route("/resume").post(protect, resumeSession);
router.route("/end").post(protect, validate({ body: endSessionSchema }), endSession);
router.route("/progress").put(protect, updateSessionProgress);
router.route("/history").get(protect, getHistory);
router.route("/stats").get(protect, getStats);

module.exports = router;
