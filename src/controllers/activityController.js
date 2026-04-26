const Activity = require("../models/Activity");

// @desc    Log a completed exercise
// @route   POST /api/activities/log
// @access  Private
const logActivity = async (req, res) => {
  try {
    const { date, exercisesCompleted, waterIntake, steps, caloriesBurned, timeTaken, completionPercentage, totalExercises } = req.body;

    // Use provided date or today's date if not provided
    // Normalizing the date to UTC midnight to prevent local server timezone shifting
    let activityDate;
    if (date) {
      const datePart = typeof date === 'string' ? date.substring(0, 10) : new Date(date).toISOString().substring(0, 10);
      activityDate = new Date(`${datePart}T00:00:00.000Z`);
    } else {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      activityDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    }

    // Check if an activity log already exists for this user on this date
    let activity = await Activity.findOne({
      userId: req.user._id,
      date: activityDate,
    });

    if (activity) {
      if (exercisesCompleted && Array.isArray(exercisesCompleted)) {
        exercisesCompleted.forEach((exercise) => {
          const exists = activity.exercisesCompleted.some(
            (e) => e.exerciseId?.toString() === exercise.exerciseId?.toString() || e.name === exercise.name
          );
          if (!exists) {
            activity.exercisesCompleted.push(exercise);
          }
        });
      }
      if (waterIntake !== undefined) activity.waterIntake = waterIntake;
      if (steps !== undefined) activity.steps = steps;
      if (caloriesBurned !== undefined) activity.caloriesBurned = caloriesBurned;
      if (timeTaken !== undefined) activity.timeTaken = timeTaken;
      if (completionPercentage !== undefined) activity.completionPercentage = completionPercentage;
      if (totalExercises !== undefined) activity.totalExercises = totalExercises;
      await activity.save();
    } else {
      activity = await Activity.create({
        userId: req.user._id,
        date: activityDate,
        exercisesCompleted: exercisesCompleted || [],
        waterIntake,
        steps,
        caloriesBurned,
        timeTaken,
        completionPercentage,
        totalExercises
      });
    }

    res.status(201).json(activity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while logging activity" });
  }
};

// @desc    Get user activities (for yearly streak calendar)
// @route   GET /api/activities
// @access  Private
const getUserActivities = async (req, res) => {
  try {
    // Optionally allow filtering by year or month via query params
    const { year, month } = req.query;
    
    let query = { userId: req.user._id };

    if (year) {
      const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${parseInt(year) + 1}-01-01T00:00:00.000Z`);
      query.date = { $gte: startDate, $lt: endDate };
    }

    const activities = await Activity.find(query).sort({ date: 1 });

    res.json(activities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while fetching activities" });
  }
};

module.exports = {
  logActivity,
  getUserActivities,
};
