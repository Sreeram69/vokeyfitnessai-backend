const { z } = require("zod");

const logMealSchema = z.object({
  date: z.string().datetime().optional().or(z.string().optional()),
  meal: z.object({
    name: z.string().min(1, "Meal name is required").trim(),
    calories: z.coerce.number().min(0, "Calories must be positive"),
    protein: z.coerce.number().min(0).default(0),
    carbs: z.coerce.number().min(0).default(0),
    fats: z.coerce.number().min(0).default(0),
    fiber: z.coerce.number().min(0).optional().default(0),
    sugar: z.coerce.number().min(0).optional().default(0),
    sodium: z.coerce.number().min(0).optional().default(0),
    mealType: z.string().optional().default("Snack"),
  }),
});

const getNutritionSchema = z.object({
  date: z.string().optional(),
});

module.exports = {
  logMealSchema,
  getNutritionSchema,
};
