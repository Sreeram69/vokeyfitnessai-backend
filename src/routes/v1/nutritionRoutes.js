const express = require("express");
const router = express.Router();

router.use((req, res, next) => {
  console.log(`[DEBUG] NutritionRoute incoming: ${req.method} ${req.url}`);
  next();
});
const { 
  logMeal, 
  getNutrition, 
  searchFood, 
  lookupBarcode, 
  getAiSuggestions,
  getAllFoods,
  createFood,
