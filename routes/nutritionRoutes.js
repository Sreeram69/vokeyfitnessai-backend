const express = require("express");
const router = express.Router();
const { logMeal, getNutrition } = require("../src/controllers/nutritionController");
const { protect } = require("../src/middleware/authMiddleware");

router.route("/").post(protect, logMeal).get(protect, getNutrition);

module.exports = router;
