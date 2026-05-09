const express = require("express");
const router = express.Router();
const { getAllExercises, getExerciseById, createExercise, updateExercise, deleteExercise } = require("../../controllers/exerciseController");
const { protect, adminOnly } = require("../../middleware/authMiddleware");

router.route("/")
  .get(protect, getAllExercises)
  .post(protect, adminOnly, createExercise);

// Backward compatibility legacy endpoints to avoid frontend breakages
router.get("/bodyPart/:bodyPart", protect, async (req, res, next) => {
  req.query.bodyPart = req.params.bodyPart;
  return getAllExercises(req, res, next);
});

router.get("/search/:query", protect, async (req, res, next) => {
  req.query.search = req.params.query;
  return getAllExercises(req, res, next);
});

router.route("/:id")
  .get(protect, getExerciseById)
  .put(protect, adminOnly, updateExercise)
  .delete(protect, adminOnly, deleteExercise);

module.exports = router;
