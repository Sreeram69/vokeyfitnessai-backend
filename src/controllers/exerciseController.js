const ExerciseService = require("../services/ExerciseService");
const { sendSuccess } = require("../utils/apiResponse");

// @desc    Get all exercises with dynamic filters & pagination
// @route   GET /api/exercises
// @access  Private
const getAllExercises = async (req, res, next) => {
  try {
    const filters = {
      bodyPart: req.query.bodyPart,
      target: req.query.target,
      equipment: req.query.equipment,
      difficulty: req.query.difficulty,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit
    };

    const results = await ExerciseService.getAllExercises(filters);
    return sendSuccess(res, "Exercises retrieved successfully", results);
  } catch (error) {
    next(error);
  }
};

// @desc    Get exercise by ID
// @route   GET /api/exercises/:id
// @access  Private
const getExerciseById = async (req, res, next) => {
  try {
    const exercise = await ExerciseService.getExerciseById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ success: false, message: "Exercise not found" });
    }
    return sendSuccess(res, "Exercise details retrieved successfully", exercise);
  } catch (error) {
    next(error);
  }
};

const createExercise = async (req, res, next) => {
  try {
    const exercise = await ExerciseService.addExercise(req.body);
    return sendSuccess(res, "Exercise created successfully", exercise, 201);
  } catch (error) {
    next(error);
  }
};

const updateExercise = async (req, res, next) => {
  try {
    const exercise = await ExerciseService.updateExercise(req.params.id, req.body);
    if (!exercise) {
      return res.status(404).json({ success: false, message: "Exercise not found" });
    }
    return sendSuccess(res, "Exercise updated successfully", exercise);
  } catch (error) {
    next(error);
  }
};

const deleteExercise = async (req, res, next) => {
  try {
    const success = await ExerciseService.deleteExercise(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, message: "Exercise not found" });
    }
    return sendSuccess(res, "Exercise deleted successfully", {});
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise
};
