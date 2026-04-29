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
