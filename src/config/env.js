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
  }).min(8, "JWT_SECRET must be at least 8 characters long."),
  JWT_REFRESH_SECRET: z.string().min(8, "JWT_REFRESH_SECRET must be at least 8 characters long.").default("vokeyfitness_refresh_super_2026_default_secret"),
  GEMINI_API_KEY: z.string({
    required_error: "GEMINI_API_KEY is a mandatory environment variable.",
  }).min(1, "GEMINI_API_KEY must not be empty."),
  CLIENT_URL: z.string().url("CLIENT_URL must be a valid website URL.").default("http://localhost:5173"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});

let env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error("❌ Environment validation failed:");
  if (error.errors) {
    error.errors.forEach((err) => {
      console.error(`   - ${err.path.join(".")}: ${err.message}`);
    });
  } else {
    console.error(error);
  }
  process.exit(1);
}

module.exports = env;
