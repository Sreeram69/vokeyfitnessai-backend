const mongoose = require("mongoose");

const nutritionSchema = new mongoose.Schema(
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
    meals: [
      {
        name: { type: String, required: true },
        calories: { type: Number, required: true },
        protein: { type: Number, required: true },
        carbs: { type: Number, required: true },
        fats: { type: Number, required: true }
      }
    ]
  },
  {
    timestamps: true,
  }
);

nutritionSchema.index({ userId: 1, date: 1 });

const Nutrition = mongoose.model("Nutrition", nutritionSchema);

module.exports = Nutrition;
