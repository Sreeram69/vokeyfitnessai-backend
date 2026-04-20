const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    bodyPart: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    target: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    equipment: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    gifUrl: {
      type: String,
      default: ""
    },
    description: {
      type: String,
      default: ""
    },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Intermediate",
      index: true
    },
    instructions: {
      type: [String],
      default: []
    },
    secondaryMuscles: {
      type: [String],
      default: []
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Create compound and text indexes for dynamic keyword matching and search optimization
exerciseSchema.index({ name: "text", description: "text" });

const Exercise = mongoose.model("Exercise", exerciseSchema);

module.exports = Exercise;
