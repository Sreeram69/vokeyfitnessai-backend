const express = require("express");
const router = express.Router();

const { logger } = require("../config/logger");

router.use((req, res, next) => {
  logger.warn(`[ROUTE_DEBUG] apiRouter: method=${req.method} url=${req.url} path=${req.path} baseUrl=${req.baseUrl}`);
  next();
});

// Import sub-routers
const authRoutes = require("./v1/authRoutes");
const workoutRoutes = require("./v1/workoutRoutes");
const nutritionRoutes = require("./v1/nutritionRoutes");
const aiRoutes = require("./v1/aiRoutes");
