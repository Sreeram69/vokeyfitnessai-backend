const Activity = require("../models/Activity");
const Nutrition = require("../models/Nutrition");
const User = require("../models/User");

class AnalyticsService {
  // Compiles high-fidelity consistency scoring and goals metrics
  async getDashboardSummary(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Fetch today's activity logs
    const activity = await Activity.findOne({ userId, date: todayStart }).lean();
