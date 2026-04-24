const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function() {
        return this.authProvider === "local";
      },
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    avatar: {
      type: String,
    },
    googleEmailVerified: {
      type: Boolean,
      default: false,
    },
    profile: {
      name: String,
      age: Number,
      gender: String,
      height: Number,
      weight: Number,
      targetWeight: Number,
      activityLevel: String,
      goal: String,
      nutritionPreference: String,
      dailyWaterGoal: Number,
      stepTarget: Number,
      stepTargetType: String,
      customStepTarget: String,
      experienceLevel: String,
      injuries: [String],
      joinedDate: Date,
      bmi: {
        bmi: String,
        category: String
      },
      calories: {
        maintenanceCalories: Number,
        targetCalories: Number
      },
      achievements: {
        streak: { type: Number, default: 0 },
        lastStreakDate: String,
        workoutsCompleted: { type: Number, default: 0 },
        plansCompleted: { type: Number, default: 0 }
      },
      activePlan: {
        id: String,
        title: String,
        level: String,
        duration: String,
        split: String,
        calories: String
      },
      selectedPlan: mongoose.Schema.Types.Mixed
    },
    googleFitCredentials: {
      accessToken: String,
      refreshToken: String,
      expiryDate: Number,
      isConnected: { type: Boolean, default: false }
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active"
    }
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
