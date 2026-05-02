const Exercise = require("../models/Exercise");
const MemoryCache = require("../cache/MemoryCache");

class ExerciseService {
  async addExercise(exerciseData) {
    const id = exerciseData.id || `custom-${Date.now()}`;
    
    // Normalize string casing to ensure query matching consistency
    const newExercise = await Exercise.create({
      id,
      name: exerciseData.name,
      bodyPart: (exerciseData.bodyPart || "cardio").toLowerCase().trim(),
      target: (exerciseData.target || "general").toLowerCase().trim(),
      equipment: (exerciseData.equipment || "body weight").toLowerCase().trim(),
      gifUrl: exerciseData.gifUrl || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=400",
      description: exerciseData.description || "",
      difficulty: exerciseData.difficulty || "Intermediate",
      instructions: Array.isArray(exerciseData.instructions) 
        ? exerciseData.instructions 
        : (exerciseData.instructions ? [exerciseData.instructions] : []),
      secondaryMuscles: exerciseData.secondaryMuscles || [],
      role: exerciseData.role || "user"
    });

    MemoryCache.clear();
    return newExercise.toObject();
  }

  async updateExercise(id, exerciseData) {
    const updatePayload = { ...exerciseData };
    
    // Maintain lowercase normalization on updates
    if (updatePayload.bodyPart) updatePayload.bodyPart = updatePayload.bodyPart.toLowerCase().trim();
    if (updatePayload.target) updatePayload.target = updatePayload.target.toLowerCase().trim();
    if (updatePayload.equipment) updatePayload.equipment = updatePayload.equipment.toLowerCase().trim();

    const updated = await Exercise.findOneAndUpdate(
      { id },
      { $set: updatePayload },
      { new: true }
    ).lean();

    if (updated) {
      MemoryCache.clear();
    }
    return updated;
  }

  async deleteExercise(id) {
    const deleted = await Exercise.findOneAndDelete({ id });
    if (deleted) {
      MemoryCache.clear();
      return true;
    }
    return false;
  }

  async getAllExercises(filters = {}) {
    const cacheKey = `exercises_${JSON.stringify(filters)}`;
    const cached = MemoryCache.get(cacheKey);
    if (cached) return cached;

    const query = {};
    if (filters.bodyPart) query.bodyPart = filters.bodyPart.toLowerCase().trim();
    if (filters.target) query.target = filters.target.toLowerCase().trim();
    if (filters.equipment) query.equipment = filters.equipment.toLowerCase().trim();
    if (filters.difficulty) query.difficulty = filters.difficulty; // Enum case matches
    
    if (filters.search) {
      const regexQuery = new RegExp(filters.search.trim(), "i");
      query.$or = [
        { name: regexQuery },
        { description: regexQuery }
      ];
    }

    const total = await Exercise.countDocuments(query);
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const skip = (page - 1) * limit;

    const data = await Exercise.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const response = {
      total,
      page,
      limit,
      data
    };

    MemoryCache.set(cacheKey, response, 300); // 5 minute TTL cache
    return response;
  }

  async getExerciseById(id) {
    return await Exercise.findOne({ id }).lean();
  }
}

module.exports = new ExerciseService();
