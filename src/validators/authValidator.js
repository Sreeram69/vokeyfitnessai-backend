const { z } = require("zod");

const registerSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters long")
    .max(30, "Username must not exceed 30 characters")
    .trim(),
  email: z.string()
    .email("Please provide a valid email address")
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(6, "Password must be at least 6 characters long"),
});

const loginSchema = z.object({
  email: z.string()
    .email("Please provide a valid email address")
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(1, "Password is required"),
});

const verifyOtpSchema = z.object({
  code: z.string()
    .length(6, "Verification code must be exactly 6 digits"),
  email: z.string()
    .email("Please provide a valid email address")
    .toLowerCase()
    .trim()
    .optional(),
  purpose: z.string().optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string()
    .email("Please provide a valid email address")
    .toLowerCase()
    .trim(),
});

const resetPasswordSchema = z.object({
  email: z.string()
    .email("Please provide a valid email address")
    .toLowerCase()
    .trim(),
  code: z.string()
    .length(6, "Verification code must be exactly 6 digits"),
  newPassword: z.string()
    .min(6, "Password must be at least 6 characters long"),
});

const updateProfileSchema = z.object({
  name: z.string().optional(),
  age: z.coerce.number().min(1, "Age must be positive").max(120, "Age is invalid").optional(),
  gender: z.string().optional(),
  height: z.coerce.number().min(50, "Height must be positive").max(300, "Height is invalid").optional(),
  weight: z.coerce.number().min(10, "Weight must be positive").max(600, "Weight is invalid").optional(),
  targetWeight: z.coerce.number().min(10).max(600).optional(),
  activityLevel: z.string().optional(),
  goal: z.string().optional(),
  nutritionPreference: z.string().optional(),
  dailyWaterGoal: z.coerce.number().min(0).optional(),
  stepTarget: z.coerce.number().min(0).optional(),
  stepTargetType: z.string().optional(),
  customStepTarget: z.string().optional(),
  experienceLevel: z.string().optional(),
  injuries: z.array(z.string()).optional(),
  activePlan: z.object({
    id: z.string(),
    title: z.string(),
    level: z.string(),
    duration: z.string(),
    split: z.string(),
    calories: z.string().optional(),
  }).optional(),
  selectedPlan: z.any().optional(),
  achievements: z.object({
    streak: z.coerce.number().optional(),
    lastStreakDate: z.string().optional(),
    workoutsCompleted: z.coerce.number().optional(),
    plansCompleted: z.coerce.number().optional(),
  }).optional(),
  bmi: z.object({
    bmi: z.coerce.string().optional(),
    category: z.string().optional(),
  }).optional(),
  calories: z.object({
    maintenanceCalories: z.coerce.number().optional(),
    targetCalories: z.coerce.number().optional(),
  }).optional(),
  joinedDate: z.string().optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
};
