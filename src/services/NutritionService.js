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
