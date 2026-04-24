const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    duration: {
      type: Number, // recommended duration in minutes
      default: 45,
    },
    exercises: [
      {
        name: String,
        sets: String,
        reps: String,
      }
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  },
  {
    timestamps: true,
  }
);

workoutSchema.index({ title: 1 });

const Workout = mongoose.model("Workout", workoutSchema);

module.exports = Workout;
