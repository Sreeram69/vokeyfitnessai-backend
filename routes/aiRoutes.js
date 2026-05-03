const express = require("express");
const router = express.Router();
const aiController = require("../src/controllers/aiController");
const { protect } = require("../src/middleware/authMiddleware");

router.post("/nutrition", protect, aiController.analyzeFood);
router.post("/plan", protect, aiController.suggestWorkoutPlan);
router.post("/chat", protect, aiController.chatAssistant);

module.exports = router;
