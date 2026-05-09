const express = require("express");
const router = express.Router();
const {
  getOAuthUrl,
  handleOAuthCallback,
  syncFitnessData,
  getTodaySteps,
  getWeeklySteps,
  disconnectFitness
} = require("../../controllers/fitnessController");
const { protect } = require("../../middleware/authMiddleware");

router.route("/oauth").get(protect, getOAuthUrl);
router.route("/oauth/callback").post(protect, handleOAuthCallback);
router.route("/sync").post(protect, syncFitnessData);
