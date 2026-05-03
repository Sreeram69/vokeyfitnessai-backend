const fs = require("fs");
const path = require("path");
const MemoryCache = require("../cache/MemoryCache");

class NutritionService {
  constructor() {
    this.localFoods = [];
    try {
      const dataPath = path.join(__dirname, "../data/foodDb.json");
      if (fs.existsSync(dataPath)) {
        this.localFoods = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
      }
    } catch (e) {
      console.error("Failed to load food database:", e.message);
    }
  }

  async addFood(foodData) {
    const dataPath = path.join(__dirname, "../data/foodDb.json");
    
    try {
      if (fs.existsSync(dataPath)) {
        this.localFoods = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
      }
    } catch (e) {
      console.error("Failed to reload food database:", e.message);
    }

    const nameLower = foodData.name.toLowerCase().trim();
    const exists = this.localFoods.some(f => f.name.toLowerCase().trim() === nameLower);
    
    if (!exists) {
      const newFoodItem = {
        name: foodData.name,
        servingSize: foodData.servingSize || "1 serving",
        calories: Number(foodData.calories) || 0,
        protein: Number(foodData.protein) || 0,
        carbs: Number(foodData.carbs) || 0,
        fats: Number(foodData.fats) || 0,
        fiber: Number(foodData.fiber) || 0,
        sugar: Number(foodData.sugar) || 0,
        sodium: Number(foodData.sodium) || 0,
        category: foodData.category || "common",
        upc: foodData.upc || ""
      };
      
      this.localFoods.push(newFoodItem);
      
      try {
        fs.writeFileSync(dataPath, JSON.stringify(this.localFoods, null, 2), "utf-8");
        MemoryCache.clear();
        return newFoodItem;
      } catch (writeErr) {
        console.error("Failed to write to foodDb.json:", writeErr.message);
      }
    }
    return null;
  }

  async searchFood(query) {
    if (!query) return [];
    
    const cacheKey = `food_search_${query.trim().toLowerCase()}`;
    const cached = MemoryCache.get(cacheKey);
    if (cached) return cached;

    // Direct local fast fuzzy-search
    const searchTerms = query.toLowerCase().split(/\s+/);
    const results = this.localFoods.filter(food => 
      searchTerms.every(term => food.name.toLowerCase().includes(term))
    );

    MemoryCache.set(cacheKey, results, 600); // 10 minute cache TTL
    return results;
  }

  async getFoodByUpc(barcode) {
    if (!barcode) return null;
    
    const cacheKey = `food_upc_${barcode}`;
    const cached = MemoryCache.get(cacheKey);
    if (cached) return cached;

    const matched = this.localFoods.find(food => food.upc === barcode) || null;
    if (matched) {
      MemoryCache.set(cacheKey, matched, 1800); // 30 minute cache TTL
    }
    return matched;
  }

  // Prepares the architectural bridge for AI meal suggestions
  async getAiMealSuggestions(profileDetails) {
    // Generates a mock but contextually rich recommendation outline 
    // that the Phase 3 AI Engine can expand upon
    const goal = profileDetails.goal ? profileDetails.goal.toLowerCase() : "fitness";
    const pref = profileDetails.nutritionPreference ? profileDetails.nutritionPreference.toLowerCase() : "any";

    const suggestions = {
      breakfast: "Scrambled egg whites with avocado toast and dry-rolled oats.",
      lunch: "Grilled chicken breast, jasmine rice, and steamed broccoli.",
      dinner: "Atlantic salmon filet with roasted sweet potatoes and baby spinach.",
      snacks: "Greek yogurt with a handful of raw almonds and organic banana."
    };

    return {
      success: true,
      context: { goal, preference: pref },
      recommendations: suggestions,
      targetMacros: {
        proteinGoal: "150g",
        carbsGoal: "200g",
        fatsGoal: "65g"
      }
    };
  }

  async getAllFoods(filters = {}) {
    let list = [...this.localFoods];
    const { search, category, page = 1, limit = 10 } = filters;

    if (search) {
      const searchTerms = search.toLowerCase().split(/\s+/);
      list = list.filter(food => 
        searchTerms.every(term => food.name.toLowerCase().includes(term))
      );
    }

    if (category) {
      const catLower = category.toLowerCase().trim();
      list = list.filter(food => food.category.toLowerCase().trim() === catLower);
    }

    const total = list.length;
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const sliced = list.slice(startIndex, endIndex);

    return {
      data: sliced,
      total,
      page: Number(page),
      limit: Number(limit)
    };
  }

  async updateFood(oldName, updatedData) {
    const dataPath = path.join(__dirname, "../data/foodDb.json");
    const oldNameTrimmed = oldName.toLowerCase().trim();
    const index = this.localFoods.findIndex(f => f.name.toLowerCase().trim() === oldNameTrimmed);
    if (index === -1) return null;

    if (updatedData.name && updatedData.name.toLowerCase().trim() !== oldNameTrimmed) {
      const newNameLower = updatedData.name.toLowerCase().trim();
      const exists = this.localFoods.some((f, idx) => idx !== index && f.name.toLowerCase().trim() === newNameLower);
      if (exists) {
        throw new Error("A food item with this name already exists");
      }
    }

    const updatedItem = {
      name: updatedData.name || this.localFoods[index].name,
      servingSize: updatedData.servingSize || this.localFoods[index].servingSize,
      calories: Number(updatedData.calories) !== undefined && !isNaN(Number(updatedData.calories)) ? Number(updatedData.calories) : this.localFoods[index].calories,
      protein: Number(updatedData.protein) !== undefined && !isNaN(Number(updatedData.protein)) ? Number(updatedData.protein) : this.localFoods[index].protein,
      carbs: Number(updatedData.carbs) !== undefined && !isNaN(Number(updatedData.carbs)) ? Number(updatedData.carbs) : this.localFoods[index].carbs,
      fats: Number(updatedData.fats) !== undefined && !isNaN(Number(updatedData.fats)) ? Number(updatedData.fats) : this.localFoods[index].fats,
      fiber: Number(updatedData.fiber) !== undefined && !isNaN(Number(updatedData.fiber)) ? Number(updatedData.fiber) : this.localFoods[index].fiber || 0,
      sugar: Number(updatedData.sugar) !== undefined && !isNaN(Number(updatedData.sugar)) ? Number(updatedData.sugar) : this.localFoods[index].sugar || 0,
      sodium: Number(updatedData.sodium) !== undefined && !isNaN(Number(updatedData.sodium)) ? Number(updatedData.sodium) : this.localFoods[index].sodium || 0,
      category: updatedData.category || this.localFoods[index].category || "common",
      upc: updatedData.upc !== undefined ? updatedData.upc : this.localFoods[index].upc || ""
    };

    this.localFoods[index] = updatedItem;

    try {
      fs.writeFileSync(dataPath, JSON.stringify(this.localFoods, null, 2), "utf-8");
      MemoryCache.clear();
      return updatedItem;
    } catch (writeErr) {
      console.error("Failed to write updated food to foodDb.json:", writeErr.message);
      throw writeErr;
    }
  }

  async deleteFood(name) {
    const dataPath = path.join(__dirname, "../data/foodDb.json");
    const nameTrimmed = name.toLowerCase().trim();
    const index = this.localFoods.findIndex(f => f.name.toLowerCase().trim() === nameTrimmed);
    if (index === -1) return false;

    this.localFoods.splice(index, 1);

    try {
      fs.writeFileSync(dataPath, JSON.stringify(this.localFoods, null, 2), "utf-8");
      MemoryCache.clear();
      return true;
    } catch (writeErr) {
      console.error("Failed to write database after deletion to foodDb.json:", writeErr.message);
      throw writeErr;
    }
  }

  async findFallbackMatch(query) {
    if (!query) return null;
    
    // 1. Try standard exact/fuzzy search first
    const standardMatches = await this.searchFood(query);
    if (standardMatches && standardMatches.length > 0) {
      return standardMatches[0];
    }
    
    // 2. Token-overlap and substring fallback matches
    const queryLower = query.toLowerCase().trim();
    
    // Rank database foods by how well they match the query
    const rankedMatches = this.localFoods.map(food => {
      const foodNameLower = food.name.toLowerCase().trim();
      
      // Case A: Food name is entirely contained in query (e.g. "chicken breast" inside "100g chicken breast")
      if (queryLower.includes(foodNameLower)) {
        return { food, score: foodNameLower.length * 2 }; // high score for longer name matches
      }
      
      // Case B: Food name contains some words of the query or vice-versa
      // Filter out common numbers, units, and small filler words to avoid false positive overlap
      const fillerWords = new Set(["a", "an", "the", "of", "and", "in", "with", "for", "to", "at", "on", "from", "by", "of", "is", "are"]);
      const queryWords = queryLower
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter(w => w.length > 1 && !fillerWords.has(w) && isNaN(w) && w !== "g" && w !== "kg" && w !== "oz" && w !== "ml" && w !== "serving" && w !== "servings");
        
      const foodWords = foodNameLower
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter(w => w.length > 1 && !fillerWords.has(w));
        
      if (queryWords.length === 0 || foodWords.length === 0) return { food, score: 0 };
      
      let overlapCount = 0;
      for (const qw of queryWords) {
        if (foodWords.some(fw => fw.includes(qw) || qw.includes(fw))) {
          overlapCount++;
        }
      }
      
      const score = overlapCount > 0 ? (overlapCount / Math.max(queryWords.length, foodWords.length)) : 0;
      return { food, score };
    }).filter(m => m.score > 0.1) // Minimum match threshold
      .sort((a, b) => b.score - a.score);
      
    if (rankedMatches.length > 0) {
      return rankedMatches[0].food;
    }
    
    return null;
  }
}

module.exports = new NutritionService();
