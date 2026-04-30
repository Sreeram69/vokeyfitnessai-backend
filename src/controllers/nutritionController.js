const Nutrition = require("../models/Nutrition");
const NutritionService = require("../services/NutritionService");
const User = require("../models/User");
const { sendSuccess } = require("../utils/apiResponse");

// @desc    Log a meal
// @route   POST /api/nutrition
// @access  Private
const logMeal = async (req, res, next) => {
  try {
    const { date, meal } = req.body;

    let nutritionDate;
    if (date) {
      const datePart = typeof date === 'string' ? date.substring(0, 10) : new Date(date).toISOString().substring(0, 10);
