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
    // Fetch today's nutrition logs
    const nutrition = await Nutrition.findOne({ userId, date: todayStart }).lean();

    // Default target metrics from user profile template
    const stepTarget = user.profile?.stepTarget || 8000;
    const waterTarget = user.profile?.dailyWaterGoal || 3000;
    const caloriesTarget = user.profile?.calories?.targetCalories || 2000;

    // Calculate actual counts
    const stepsActual = activity ? activity.steps : 0;
    const waterActual = activity ? activity.waterIntake : 0;
    
    let caloriesActual = 0;
    if (nutrition && nutrition.meals) {
      caloriesActual = nutrition.meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    }

    // Goal completion percentages
    const stepsProgress = Math.min(Math.round((stepsActual / stepTarget) * 100) || 0, 100);
    const waterProgress = Math.min(Math.round((waterActual / waterTarget) * 100) || 0, 100);
    const caloriesProgress = Math.min(Math.round((caloriesActual / caloriesTarget) * 100) || 0, 100);

    // Consistency score calculation (A+ to F depending on weekly step and workout goals met)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    const pastWeekActivities = await Activity.find({
      userId,
      date: { $gte: oneWeekAgo }
    }).lean();

    let daysTargetMet = 0;
    pastWeekActivities.forEach(act => {
      if (act.steps >= stepTarget || act.exercisesCompleted?.length > 0) {
        daysTargetMet++;
      }
    });

    let consistencyGrade = "C";
    if (daysTargetMet >= 6) consistencyGrade = "A+";
    else if (daysTargetMet >= 5) consistencyGrade = "A";
    else if (daysTargetMet >= 4) consistencyGrade = "B+";
    else if (daysTargetMet >= 3) consistencyGrade = "B";
    else if (daysTargetMet >= 2) consistencyGrade = "C+";

    return {
      success: true,
      targets: {
        stepTarget,
        waterTarget,
        caloriesTarget
      },
      actuals: {
        stepsActual,
        waterActual,
        caloriesActual
      },
      completion: {
        stepsProgress,
        waterProgress,
        caloriesProgress
      },
      consistency: {
        scoreGrade: consistencyGrade,
        daysMet: daysTargetMet,
        totalDays: 7
      },
      streak: user.profile?.achievements?.streak || 0
    };
  }

  // Generates 7-day historical dataset for dashboard line-graphs
  async getWeeklyTrend(userId) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    const activities = await Activity.find({
      userId,
      date: { $gte: oneWeekAgo }
    }).sort({ date: 1 }).lean();

    return activities.map(act => ({
      date: act.date,
      steps: act.steps || 0,
      totalSteps: act.steps || 0,
      caloriesBurned: act.caloriesBurned || 0,
      totalCaloriesBurned: act.caloriesBurned || 0,
      activeMinutes: act.timeTaken || 0,
      waterIntake: act.waterIntake || 0,
      totalWater: act.waterIntake || 0
    }));
  }
}

module.exports = new AnalyticsService();
