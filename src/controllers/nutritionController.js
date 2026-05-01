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
      nutritionDate = new Date(`${datePart}T00:00:00.000Z`);
    } else {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      nutritionDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    }

    let nutrition = await Nutrition.findOne({
      userId: req.user._id,
      date: nutritionDate,
    });

    // Clean dynamic defaults if not present
    const mealWithDefaults = {
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fats: meal.fats,
      fiber: meal.fiber || 0,
      sugar: meal.sugar || 0,
      sodium: meal.sodium || 0,
      mealType: meal.mealType || "Snack"
    };

    if (nutrition) {
      nutrition.meals.push(mealWithDefaults);
      await nutrition.save();
    } else {
      nutrition = await Nutrition.create({
        userId: req.user._id,
        date: nutritionDate,
        meals: [mealWithDefaults],
      });
    }

    return sendSuccess(res, "Meal logged successfully", nutrition.toObject(), 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's nutrition log for a specific date
// @route   GET /api/nutrition
// @access  Private
const getNutrition = async (req, res, next) => {
  try {
    const { date } = req.query;
    
    let queryDate;
    if (date) {
      const datePart = typeof date === 'string' ? date.substring(0, 10) : new Date(date).toISOString().substring(0, 10);
      queryDate = new Date(`${datePart}T00:00:00.000Z`);
    } else {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      queryDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    }

    const nutrition = await Nutrition.findOne({
      userId: req.user._id,
      date: queryDate,
    }).lean();

    return sendSuccess(res, "Nutrition log retrieved successfully", nutrition || { meals: [] });
  } catch (error) {
    next(error);
  }
};

// @desc    Autocomplete and instant food search
// @route   GET /api/nutrition/search
// @access  Private
const searchFood = async (req, res, next) => {
  try {
    const { query } = req.query;
    const results = await NutritionService.searchFood(query);
    return sendSuccess(res, "Food items searched successfully", results);
  } catch (error) {
    next(error);
  }
};

// @desc    UPC Barcode nutrition lookup
// @route   GET /api/nutrition/barcode/:upc
// @access  Private
const lookupBarcode = async (req, res, next) => {
  try {
    const matched = await NutritionService.getFoodByUpc(req.params.upc);
    if (!matched) {
      return res.status(404).json({ success: false, message: "UPC barcode not found in package food library" });
    }
    return sendSuccess(res, "UPC barcode food resolved successfully", matched);
  } catch (error) {
    next(error);
  }
};

// @desc    AI Meal suggestions recommendation
// @route   GET /api/nutrition/suggestions
// @access  Private
const getAiSuggestions = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const suggestions = await NutritionService.getAiMealSuggestions(user.profile || {});
    return sendSuccess(res, "AI meal suggestions resolved successfully", suggestions);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all foods in library with pagination & search
// @route   GET /api/nutrition/foods
// @access  Private
const getAllFoods = async (req, res, next) => {
  try {
    const filters = {
      search: req.query.search,
      category: req.query.category,
      page: req.query.page,
      limit: req.query.limit
    };
    const results = await NutritionService.getAllFoods(filters);
    return sendSuccess(res, "Food library retrieved successfully", results);
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new food to the library
// @route   POST /api/nutrition/foods
// @access  Private/Admin
const createFood = async (req, res, next) => {
  try {
    const foodItem = await NutritionService.addFood(req.body);
    if (!foodItem) {
      return res.status(400).json({ success: false, message: "Food item with this name already exists in library" });
    }
    return sendSuccess(res, "Food item created successfully in library", foodItem, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a food item in the library
// @route   PUT /api/nutrition/foods/:name
// @access  Private/Admin
const updateFood = async (req, res, next) => {
  try {
    const foodItem = await NutritionService.updateFood(req.params.name, req.body);
    if (!foodItem) {
      return res.status(404).json({ success: false, message: "Food item not found" });
    }
    return sendSuccess(res, "Food item updated successfully", foodItem);
  } catch (error) {
    if (error.message === "A food item with this name already exists") {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Delete a food item from the library
// @route   DELETE /api/nutrition/foods/:name
// @access  Private/Admin
const deleteFood = async (req, res, next) => {
  try {
    const success = await NutritionService.deleteFood(req.params.name);
    if (!success) {
      return res.status(404).json({ success: false, message: "Food item not found" });
    }
    return sendSuccess(res, "Food item deleted successfully from library", {});
  } catch (error) {
    next(error);
  }
};

module.exports = {
  logMeal,
  getNutrition,
  searchFood,
  lookupBarcode,
  getAiSuggestions,
  getAllFoods,
  createFood,
  updateFood,
  deleteFood
};
