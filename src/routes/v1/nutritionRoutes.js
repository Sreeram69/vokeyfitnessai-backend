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
  updateFood,
  deleteFood
} = require("../../controllers/nutritionController");
const { protect, adminOnly } = require("../../middleware/authMiddleware");
const validate = require("../../middleware/validate");
const { logMealSchema, getNutritionSchema } = require("../../validators/nutritionValidator");

router.route("/search").get(protect, searchFood);
router.route("/barcode/:upc").get(protect, lookupBarcode);
router.route("/suggestions").get(protect, getAiSuggestions);

router.route("/foods")
  .get(protect, getAllFoods)
  .post(protect, adminOnly, createFood);

router.route("/foods/:name")
  .put(protect, adminOnly, updateFood)
  .delete(protect, adminOnly, deleteFood);

router.route("/")
  .post(protect, validate({ body: logMealSchema }), logMeal)
  .get(protect, validate({ query: getNutritionSchema }), getNutrition);

module.exports = router;
