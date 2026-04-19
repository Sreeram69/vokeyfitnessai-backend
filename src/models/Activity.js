const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    exercisesCompleted: [
      {
        exerciseId: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        bodyPart: {
          type: String,
        },
      },
    ],
    waterIntake: { type: Number, default: 0 },
    steps: { type: Number, default: 0 },
    caloriesBurned: { type: Number, default: 0 },
    timeTaken: { type: Number, default: 0 },
    completionPercentage: { type: Number, default: 0 },
    totalExercises: { type: Number, default: 0 },
    distance: { type: Number, default: 0 },
    heartPoints: { type: Number, default: 0 },
    averageHeartRate: { type: Number, default: 0 },
    sleepHours: { type: Number, default: 0 }
  },
  {
    timestamps: true,
  }
);

// We can create a compound index on userId and date to quickly find a user's activities for a specific day
activitySchema.index({ userId: 1, date: 1 });

const Activity = mongoose.model("Activity", activitySchema);

module.exports = Activity;
