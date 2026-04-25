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

