const express = require("express");
const router = express.Router();
const {
  getOAuthUrl,
  handleOAuthCallback,
  syncFitnessData,
  getTodaySteps,
  getWeeklySteps,
  disconnectFitness
} = require("../src/controllers/fitnessController");
const { protect } = require("../src/middleware/authMiddleware");

router.route("/oauth").get(protect, getOAuthUrl);
router.route("/oauth/callback").post(protect, handleOAuthCallback);
router.route("/sync").post(protect, syncFitnessData);
router.route("/steps/today").get(protect, getTodaySteps);
router.route("/steps/weekly").get(protect, getWeeklySteps);
router.route("/disconnect").post(protect, disconnectFitness);

module.exports = router;
