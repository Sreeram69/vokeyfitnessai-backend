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

