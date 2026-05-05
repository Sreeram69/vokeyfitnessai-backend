const express = require("express");
const router = express.Router();

const exercises = [
  {
    id: 1,
    name: "Push-Up",
    bodyPart: "chest",
    target: "pectorals",
    equipment: "body weight",
  },
  {
    id: 2,
    name: "Bench Press",
    bodyPart: "chest",
    target: "pectorals",
    equipment: "barbell",
  },
  {
    id: 3,
    name: "Weighted Dips",
    bodyPart: "chest",
    target: "lower chest",
    equipment: "body weight",
  },
  {
    id: 4,
    name: "Pull-Up",
    bodyPart: "back",
    target: "lats",
    equipment: "body weight",
  },
  {
    id: 5,
    name: "Deadlift",
    bodyPart: "back",
    target: "lower back",
    equipment: "barbell",
  },
  {
    id: 6,
    name: "Squat",
    bodyPart: "legs",
    target: "quadriceps",
    equipment: "barbell",
  },
  {
    id: 7,
    name: "Leg Press",
    bodyPart: "legs",
    target: "quadriceps",
    equipment: "machine",
  },
];

router.get("/", (req, res) => {
  res.json(exercises);
});

router.get("/bodyPart/:bodyPart", (req, res) => {
  const bodyPart = req.params.bodyPart.toLowerCase();

  const filteredExercises = exercises.filter(
    (exercise) => exercise.bodyPart.toLowerCase() === bodyPart
  );

  res.json(filteredExercises);
});

router.get("/search/:query", (req, res) => {
  const query = req.params.query.toLowerCase();

  const results = exercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(query)
  );

  res.json(results);
});

module.exports = router;