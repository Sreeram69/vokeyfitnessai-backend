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
const activityRoutes = require("./v1/activityRoutes");
const analyticsRoutes = require("./v1/analyticsRoutes");
const exerciseRoutes = require("./v1/exerciseRoutes");
const fitnessRoutes = require("./v1/fitnessRoutes");
const planRoutes = require("./v1/planRoutes");
const healthRoutes = require("./v1/health");
const adminRoutes = require("./v1/adminRoutes");
const notificationRoutes = require("./v1/notificationRoutes");
const sseRoutes = require("./v1/sseRoutes");

// Create standard v1 router bundle
const v1Router = express.Router();
v1Router.use("/auth", authRoutes);
v1Router.use("/workout", workoutRoutes);
v1Router.use("/nutrition", nutritionRoutes);
v1Router.use("/ai", aiRoutes);
v1Router.use("/activities", activityRoutes);
v1Router.use("/analytics", analyticsRoutes);
v1Router.use("/exercises", exerciseRoutes);
v1Router.use("/fitness", fitnessRoutes);
v1Router.use("/plans", planRoutes);
v1Router.use("/health", healthRoutes);
v1Router.use("/admin", adminRoutes);
v1Router.use("/notifications", notificationRoutes);
v1Router.use("/stream", sseRoutes);

// Mount versioned routing
router.use("/v1", v1Router);

// Fallback legacy mappings to maintain 100% frontend backwards-compatibility
router.use("/auth", authRoutes);
router.use("/workout", workoutRoutes);
router.use("/nutrition", nutritionRoutes);
router.use("/ai", aiRoutes);
router.use("/activities", activityRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/exercises", exerciseRoutes);
router.use("/fitness", fitnessRoutes);
router.use("/plans", planRoutes);
router.use("/health", healthRoutes);
router.use("/admin", adminRoutes);
router.use("/notifications", notificationRoutes);
router.use("/stream", sseRoutes);

module.exports = router;
