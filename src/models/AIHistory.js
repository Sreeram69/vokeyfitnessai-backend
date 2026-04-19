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
      type: String,
      required: true,
    },
    response: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

aiHistorySchema.index({ userId: 1, createdAt: -1 });

const AIHistory = mongoose.model("AIHistory", aiHistorySchema);

module.exports = AIHistory;
