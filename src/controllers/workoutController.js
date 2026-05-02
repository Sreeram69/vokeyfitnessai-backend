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

    if (activeSession) {
      return sendError(res, "You already have an active workout session in progress", "ACTIVE_SESSION_EXISTS", 400);
    }

    const newSession = await WorkoutSession.create({
      userId: req.user._id,
      status: "active",
      category: req.body.category || "General",
      startedAt: new Date()
    });

    return sendSuccess(res, "Workout started successfully", newSession.toObject(), 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Pause active workout session
// @route   POST /api/workout/pause
// @access  Protected
const pauseSession = async (req, res, next) => {
  try {
    const session = await WorkoutSession.findOne({
      userId: req.user._id,
      status: "active"
    });

    if (!session) {
      return sendError(res, "No active workout session found", "SESSION_NOT_FOUND", 404);
    }

    session.status = "paused";
    await session.save();

    return sendSuccess(res, "Workout paused successfully", session.toObject());
  } catch (error) {
    next(error);
  }
};

// @desc    Resume active workout session
// @route   POST /api/workout/resume
// @access  Protected
const resumeSession = async (req, res, next) => {
  try {
    const session = await WorkoutSession.findOne({
      userId: req.user._id,
      status: "paused"
    });

    if (!session) {
      return sendError(res, "No paused workout session found", "SESSION_NOT_FOUND", 404);
    }

    session.status = "active";
    await session.save();

    return sendSuccess(res, "Workout resumed successfully", session.toObject());
  } catch (error) {
    next(error);
  }
};

// @desc    End active/paused workout session
// @route   POST /api/workout/end
// @access  Protected
const endSession = async (req, res, next) => {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();
  try {
    const session = await WorkoutSession.findOne({
      userId: req.user._id,
      status: { $in: ["active", "paused"] }
    }).session(dbSession);

    if (!session) {
      await dbSession.abortTransaction();
      dbSession.endSession();
      return sendError(res, "No active or paused workout session found", "SESSION_NOT_FOUND", 404);
    }

    const { duration, caloriesBurned, exercisesCompleted } = req.body;

    session.status = "completed";
    session.duration = duration || Math.round((new Date() - session.startedAt) / 1000);
    session.caloriesBurned = caloriesBurned || 0;
    session.exercisesCompleted = exercisesCompleted || [];
    session.endedAt = new Date();

    await session.save({ session: dbSession });

    await dbSession.commitTransaction();
    dbSession.endSession();

    return sendSuccess(res, "Workout completed successfully", session.toObject());
  } catch (error) {
    await dbSession.abortTransaction();
    dbSession.endSession();
    next(error);
  }
};

// @desc    Update progress of active workout session
// @route   PUT /api/workout/progress
// @access  Protected
const updateSessionProgress = async (req, res, next) => {
  try {
    const session = await WorkoutSession.findOne({
      userId: req.user._id,
      status: "active"
    });

    if (!session) {
      return sendError(res, "No active workout session found", "SESSION_NOT_FOUND", 404);
    }

    const { duration, caloriesBurned, exercisesCompleted } = req.body;

    if (duration !== undefined) session.duration = duration;
    if (caloriesBurned !== undefined) session.caloriesBurned = caloriesBurned;
    if (exercisesCompleted !== undefined) session.exercisesCompleted = exercisesCompleted;

    await session.save();

    return sendSuccess(res, "Workout progress updated successfully", session.toObject());
  } catch (error) {
    next(error);
  }
};

// @desc    Get workout session history
// @route   GET /api/workout/history
// @access  Protected
const getHistory = async (req, res, next) => {
  try {
    // Highly optimized with .lean() for fast history retrieval
    const history = await WorkoutSession.find({ userId: req.user._id })
      .sort({ startedAt: -1 })
      .lean();

    return sendSuccess(res, "History retrieved successfully", history);
  } catch (error) {
    next(error);
  }
};

// @desc    Get quick workout stats
// @route   GET /api/workout/stats
// @access  Protected
const getStats = async (req, res, next) => {
  try {
    // Highly optimized with .lean() for fast statistics calculation
    const sessions = await WorkoutSession.find({
      userId: req.user._id,
      status: "completed"
    }).lean();

    const totalSessions = sessions.length;
    const totalCalories = sessions.reduce((sum, s) => sum + (s.caloriesBurned || 0), 0);
    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);

    return sendSuccess(res, "Stats retrieved successfully", {
      totalSessions,
      totalCalories,
      totalDuration
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startSession,
  pauseSession,
  resumeSession,
  endSession,
  updateSessionProgress,
  getHistory,
  getStats
};
