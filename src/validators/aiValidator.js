const { z } = require("zod");

const analyzeFoodSchema = z.object({
  foodQuery: z.string().min(1, "Food query is required").max(500).trim(),
});

const suggestWorkoutSchema = z.object({
  age: z.coerce.number().min(1).max(120),
  gender: z.string().trim().min(1),
  weight: z.coerce.number().min(10).max(600),
  height: z.coerce.number().min(50).max(300),
  goal: z.string().trim().min(1),
  targetWeight: z.coerce.number().min(10).max(600),
  activityLevel: z.string().trim().min(1),
  workoutDays: z.coerce.number().min(1).max(7).default(5).optional(),
