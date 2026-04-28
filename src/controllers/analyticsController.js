const AnalyticsService = require("../services/AnalyticsService");
const { sendSuccess } = require("../utils/apiResponse");

// @desc    Get weekly analytics summaries
// @route   GET /api/analytics/weekly
// @access  Protected
const getWeeklyAnalytics = async (req, res, next) => {
  try {
    const weeklyData = await AnalyticsService.getWeeklyTrend(req.user._id);
    return sendSuccess(res, "Weekly analytics compiled successfully", weeklyData);
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly analytics summaries
// @route   GET /api/analytics/monthly
// @access  Protected
const getMonthlyAnalytics = async (req, res, next) => {
  try {
    const summary = await AnalyticsService.getDashboardSummary(req.user._id);
    return sendSuccess(res, "Monthly analytics compiled successfully", summary);
  } catch (error) {
    next(error);
  }
};

// @desc    Get progress logs & streaks
// @route   GET /api/analytics/progress
// @access  Protected
const getProgressStats = async (req, res, next) => {
  try {
    const summary = await AnalyticsService.getDashboardSummary(req.user._id);
    return sendSuccess(res, "Progress logs calculated successfully", {
      currentStreak: req.user.profile?.achievements?.streak || 0,
      xp: req.user.profile?.achievements?.workoutsCompleted * 100 || 0,
      level: Math.floor((req.user.profile?.achievements?.workoutsCompleted || 0) / 10) + 1,
      consistency: summary.consistency
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getProgressStats
};
