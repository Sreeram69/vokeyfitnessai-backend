const express = require("express");
const router = express.Router();

router.use((req, res, next) => {
  console.log(`[DEBUG] AiRoute incoming: ${req.method} ${req.url}`);
  next();
});
const { analyzeFood, suggestWorkoutPlan, chatAssistant } = require("../../controllers/aiController");
const { protect } = require("../../middleware/authMiddleware");
const validate = require("../../middleware/validate");
const { aiLimiter } = require("../../middleware/security");
const {
  analyzeFoodSchema,
  suggestWorkoutSchema,
  chatAssistantSchema,
