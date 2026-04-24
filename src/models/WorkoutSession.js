const mongoose = require("mongoose");

const workoutSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "paused", "completed"],
      default: "active",
    },
    category: {
      type: String,
      default: "General",
    },
    duration: {
      type: Number, // total duration in seconds
      default: 0,
    },
    caloriesBurned: {
      type: Number,
      default: 0,
    },
    exercisesCompleted: [
      {
        exerciseId: String,
        name: String,
        sets: Number,
        reps: Number,
      }
    ],
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    }
  },
  {
    timestamps: true,
  }
);

workoutSessionSchema.index({ userId: 1, startedAt: -1 });

const WorkoutSession = mongoose.model("WorkoutSession", workoutSessionSchema);

module.exports = WorkoutSession;
