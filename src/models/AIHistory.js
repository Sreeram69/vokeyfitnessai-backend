const mongoose = require("mongoose");

const aiHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["meal_analysis", "workout_generation", "insight"],
      required: true,
    },
    prompt: {
