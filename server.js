// 1. Zod Environment Variable Validation (crashes fast with clear messages if misconfigured)
const env = require("./src/config/env");

// 2. Winston Professional Logger Initialization
const { logger } = require("./src/config/logger");

const express = require("express");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const compression = require("compression");
const helmet = require("helmet");

// Middleware Imports
const requestLogger = require("./src/middleware/requestLogger");
const { applySecurity, generalLimiter, authLimiter, aiLimiter } = require("./src/middleware/security");
const apiRouter = require("./src/routes");
const errorHandler = require("./src/middleware/errorHandler");

// Initialize express app
const app = express();

// A. Enable response payload Gzip compression
app.use(compression());

// B. Secure response headers
app.use(helmet());

// C. Dynamic HTTP Request Logging
app.use(requestLogger);

// D. Parse Cookie payloads
app.use(cookieParser());

// E. Parse JSON and URL-encoded bodies with rigid size bounds
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Express 5.x compatibility: redefine req.query as a standard writable/configurable object
app.use((req, res, next) => {
  if (req.query) {
    Object.defineProperty(req, "query", {
      value: { ...req.query },
      writable: true,
      configurable: true,
      enumerable: true
    });
  }
  next();
});

// F. Apply advanced filters (NoSQL injection, Parameter pollution, XSS cleans, dynamic CORS credentials)
applySecurity(app);

// G. Fine-grained rate limits
app.use("/api/auth", authLimiter);
app.use("/api/v1/auth", authLimiter);
app.use("/api/ai", aiLimiter);
app.use("/api/v1/ai", aiLimiter);
app.use("/api", generalLimiter);

// H. Mount Master versioned routing
app.use("/api", apiRouter);

// I. Root Check Endpoint
app.get("/", (req, res) => {
  res.send("VokeyFitness Production API Server Running");
});

// J. Global Centralized Error middleware
app.use(errorHandler);

// K. Database Connection Setup
const { initSyncJobs } = require("./src/jobs/FitnessSyncJob");

mongoose
  .connect(env.MONGO_URI)
  .then(async () => {
    logger.info("✅ Database connected successfully (MongoDB)");
    
    // Drop the unique username_1 index if it exists, to allow duplicate usernames
    try {
      await mongoose.connection.db.collection("users").dropIndex("username_1");
      logger.info("🗑️  Successfully dropped unique index 'username_1' from users collection.");
    } catch (indexErr) {
      // Index might not exist, which is fine
      if (indexErr.codeName !== "IndexNotFound" && indexErr.code !== 27) {
        logger.warn(`⚠️  Non-critical warning dropping index 'username_1': ${indexErr.message}`);
      }
    }

    initSyncJobs();
    logger.info("⏰ Background synchronization cron jobs successfully scheduled.");

    // Ensure the default developer email has the admin role in database
    try {
      const User = require("./src/models/User");
      const adminUpdate = await User.updateOne(
        { email: "ramsreeram249@gmail.com" },
        { $set: { role: "admin" } }
      );
      if (adminUpdate.modifiedCount > 0) {
        logger.info("👑 Granted admin role to ramsreeram249@gmail.com");
      } else {
        logger.info("👑 Checked admin status for ramsreeram249@gmail.com");
      }
    } catch (adminErr) {
      logger.error(`⚠️ Failed to ensure admin user role: ${adminErr.message}`);
    }
  })
  .catch((err) => {
    logger.error(`❌ Database connection failure: ${err.message}`);
    process.exit(1);
  });

// L. Start Server Listening
const PORT = env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`🚀 VokeyFitness API online in [${env.NODE_ENV}] mode on port [${PORT}]`);
});

// M. Graceful Shutdown & Uncaught Signal Listeners
const shutdown = (signal) => {
  logger.warn(`⚠️  Received ${signal}. Starting graceful shutdown procedure...`);

  // Stop accepting new connections
  server.close(() => {
    logger.info("🛑 Express server stopped accepting new requests.");

    // Close MongoDB connections cleanly
    mongoose.connection.close(false).then(() => {
      logger.info("💾 Database connection cleanly closed.");
      logger.warn("👋 Process exiting. Safe shutdown completed.");
      process.exit(0);
    });
  });

  // Force exit after 10 seconds if connections are hanging
  setTimeout(() => {
    logger.error("🚨 Forcefully shutting down. Active connections did not resolve within timeout window.");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Trap unhandled Promise rejections and core sync faults
process.on("unhandledRejection", (reason, promise) => {
  logger.error(`🚨 Unhandled Promise Rejection at: ${promise} | reason: ${reason.stack || reason}`);
  // In production, log and determine if safe to keep server alive
});

process.on("uncaughtException", (error) => {
  logger.error(`🚨 Uncaught Exception crash: ${error.message} | stack: ${error.stack}`);
  // Always exit immediately on uncaught sync exceptions to avoid unstable state
  process.exit(1);
});
