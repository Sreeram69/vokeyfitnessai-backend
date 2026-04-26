const { z } = require("zod");

const startSessionSchema = z.object({
  category: z.string().trim().default("General").optional(),
});

const endSessionSchema = z.object({
  duration: z.coerce.number().min(0, "Duration must be positive").default(0),
  caloriesBurned: z.coerce.number().min(0, "Calories burned must be positive").default(0),
  exercisesCompleted: z.array(
    z.object({
      exerciseId: z.string().min(1, "exerciseId is required"),
      name: z.string().min(1, "Exercise name is required"),
      sets: z.coerce.number().min(0).optional(),
      reps: z.coerce.number().min(0).optional(),
      bodyPart: z.string().optional(),
    })
  ).default([]),
});

module.exports = {
  startSessionSchema,
  endSessionSchema,
};
