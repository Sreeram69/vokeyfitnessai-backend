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
} = require("../../validators/aiValidator");

// Apply tighter rate limiting specific to high-resource Gemini API operations
router.post("/analyze-food", protect, aiLimiter, validate({ body: analyzeFoodSchema }), analyzeFood);
router.post("/nutrition", protect, aiLimiter, validate({ body: analyzeFoodSchema }), analyzeFood);
router.post("/workout-plan", protect, aiLimiter, validate({ body: suggestWorkoutSchema }), suggestWorkoutPlan);
router.post("/plan", protect, aiLimiter, validate({ body: suggestWorkoutSchema }), suggestWorkoutPlan);
router.post("/chat", protect, aiLimiter, validate({ body: chatAssistantSchema }), chatAssistant);

module.exports = router;
