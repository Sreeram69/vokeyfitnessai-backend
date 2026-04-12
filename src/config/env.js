const { z } = require("zod");
const dotenv = require("dotenv");

// Ensure environment variables are loaded
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string({
    required_error: "MONGO_URI is a mandatory environment variable.",
  }).refine(val => val.startsWith("mongodb://") || val.startsWith("mongodb+srv://"), {
    message: "MONGO_URI must be a valid MongoDB connection string starting with mongodb:// or mongodb+srv://"
  }),
  JWT_SECRET: z.string({
    required_error: "JWT_SECRET is a mandatory environment variable.",
