const mongoose = require("mongoose");
const WorkoutSession = require("../models/WorkoutSession");
const { sendSuccess, sendError } = require("../utils/apiResponse");

// @desc    Start active workout session
// @route   POST /api/workout/start
// @access  Protected
const startSession = async (req, res, next) => {
  try {
    // Check if there is an active session
    const activeSession = await WorkoutSession.findOne({
      userId: req.user._id,
      status: "active"
    }).lean(); // Fast lean lookup

