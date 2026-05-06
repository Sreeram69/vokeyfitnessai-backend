const express = require('express');
const router = express.Router();

const workoutPlans = [
  {
    id: "beginner_gain",
    title: "Beginner to Gym Plan",
    level: "Beginner",
    goal: "Muscle Gain",
    duration: "8 Weeks",
    calories: "2300 kcal/day",
    split: "Chest+Bicep / Back+Tricep / Legs+Shoulder",
    weeklySchedule: [
      "Monday: Chest + Bicep",
      "Tuesday: Back + Tricep",
      "Wednesday: Legs + Shoulder",
      "Thursday: Chest + Bicep",
      "Friday: Back + Tricep",
      "Saturday: Legs + Shoulder",
      "Sunday: Home Workout",
    ],
    exercises: [
      { id: "home-01", name: "Bodyweight Squat", sets: "3", reps: "15" },
      { id: "home-02", name: "Push-ups", sets: "3", reps: "15" },
      { id: "home-03", name: "Plank", sets: "3", reps: "60s" },
      { id: "home-04", name: "Jumping Jacks", sets: "3", reps: "30" },
      { id: "1", name: "Chest + Bicep", sets: "3", reps: "15" },
      { id: "2", name: "Back + Tricep", sets: "3", reps: "12" },
      { id: "3", name: "Legs + Shoulder", sets: "3", reps: "12" },
      { id: "4", name: "Chest + Bicep", sets: "3", reps: "12" },
      { id: "5", name: "Back + Tricep", sets: "3", reps: "15" },
      { id: "6", name: "Legs + Shoulder", sets: "3", reps: "12" },
    ],
  },
  {
    id: "intermediate_gain",
    title: "Intermediate to Gym Plan",
    level: "Intermediate",
    goal: "Muscle Gain",
    duration: "8 Weeks",
    calories: "2700 kcal/day",
    split: "Chest+Bicep / Back+Tricep / Legs+Shoulder",
    weeklySchedule: [
      "Monday: Chest + Bicep",
      "Tuesday: Back + Tricep",
      "Wednesday: Legs + Shoulder",
      "Thursday: Chest + Bicep",
      "Friday: Back + Tricep",
      "Saturday: Legs + Shoulder",
      "Sunday: Home Workout",
    ],
    exercises: [
      { id: "home-01", name: "Bodyweight Squat", sets: "3", reps: "15" },
      { id: "home-02", name: "Push-ups", sets: "3", reps: "15" },
      { id: "home-03", name: "Plank", sets: "3", reps: "60s" },
      { id: "home-04", name: "Jumping Jacks", sets: "3", reps: "30" },
      { id: "7", name: "Chest + Bicep ", sets: "4", reps: "10" },
      { id: "8", name: "Barbell Curl", sets: "4", reps: "10" },
      { id: "9", name: "Deadlift", sets: "4", reps: "8" },
      { id: "10", name: "Skull Crushers", sets: "4", reps: "10" },
      { id: "11", name: "Leg Press", sets: "4", reps: "12" },
      { id: "12", name: "Lateral Raises", sets: "4", reps: "12" },
    ],
  },
  {
    id: "advanced_gain",
    title: "Advanced to Gym Plan",
    level: "Advanced",
    goal: "Muscle Gain",
    duration: "8 Weeks",
    calories: "3200 kcal/day",
    split: "Chest+Bicep / Back+Tricep / Legs+Shoulder",
    weeklySchedule: [
      "Monday: Chest + Bicep",
      "Tuesday: Back + Tricep",
      "Wednesday: Legs + Shoulder",
      "Thursday: Chest + Bicep",
      "Friday: Back + Tricep",
      "Saturday: Legs + Shoulder",
      "Sunday: Home Workout",
    ],
    exercises: [
      { id: "home-01", name: "Bodyweight Squat", sets: "3", reps: "15" },
      { id: "home-02", name: "Push-ups", sets: "3", reps: "15" },
      { id: "home-03", name: "Plank", sets: "3", reps: "60s" },
      { id: "home-04", name: "Jumping Jacks", sets: "3", reps: "30" },
      { id: "13", name: "Incline Bench Press", sets: "5", reps: "8" },
      { id: "14", name: "Preacher Curl", sets: "5", reps: "10" },
      { id: "15", name: "Weighted Pull-Ups", sets: "5", reps: "8" },
      { id: "16", name: "Close Grip Bench Press", sets: "5", reps: "8" },
      { id: "17", name: "Barbell Squats", sets: "5", reps: "8" },
      { id: "18", name: "Military Press", sets: "5", reps: "8" },
    ],
  },
  {
    id: "fat_loss",
    title: "Fat Loss Plan",
    level: "Intermediate",
    goal: "Fat Loss",
    duration: "2-8 Weeks",
    calories: "1800 kcal/day",
    split: "Fat Burn + Strength",
    weeklySchedule: [
      "Monday: Chest + Bicep + Cardio",
      "Tuesday: Back + Tricep + HIIT",
      "Wednesday: Legs + Shoulder + Cardio",
      "Thursday: Chest + Bicep + HIIT",
      "Friday: Back + Tricep + Cardio",
      "Saturday: Legs + Shoulder + HIIT",
      "Sunday: Home Workout",
    ],
    exercises: [
      { id: "home-01", name: "Bodyweight Squat", sets: "3", reps: "15" },
      { id: "home-02", name: "Push-ups", sets: "3", reps: "15" },
      { id: "home-03", name: "Plank", sets: "3", reps: "60s" },
      { id: "home-04", name: "Jumping Jacks", sets: "3", reps: "30" },
      { id: "19", name: "Burpees", sets: "4", reps: "20" },
      { id: "20", name: "Mountain Climbers", sets: "4", reps: "25" },
      { id: "21", name: "Jump Squats", sets: "4", reps: "20" },
    ],
  },
  {
    id: "body_gain",
    title: "Body Gain Plan",
    level: "Intermediate",
    goal: "Muscle Gain",
    duration: "2-8 Weeks",
    calories: "2900 kcal/day",
    split: "Mass Gain Split",
    weeklySchedule: [
      "Monday: Chest + Bicep",
      "Tuesday: Back + Tricep",
      "Wednesday: Legs + Shoulder",
      "Thursday: Chest + Bicep",
      "Friday: Back + Tricep",
      "Saturday: Legs + Shoulder",
      "Sunday: Home Workout",
    ],
    exercises: [
      { id: "home-01", name: "Bodyweight Squat", sets: "3", reps: "15" },
      { id: "home-02", name: "Push-ups", sets: "3", reps: "15" },
      { id: "home-03", name: "Plank", sets: "3", reps: "60s" },
      { id: "home-04", name: "Jumping Jacks", sets: "3", reps: "30" },
      { id: "22", name: "Bench Press", sets: "5", reps: "8" },
      { id: "23", name: "Barbell Row", sets: "5", reps: "8" },
      { id: "24", name: "Squats", sets: "5", reps: "8" },
    ],
  },
  {
    id: "strength_gain",
    title: "Strength Gain Plan",
    level: "Advanced",
    goal: "Strength",
    duration: "2-8 Weeks",
    calories: "3100 kcal/day",
    split: "Strength Builder",
    weeklySchedule: [
      "Monday: Chest + Bicep",
      "Tuesday: Back + Tricep",
      "Wednesday: Legs + Shoulder",
      "Thursday: Chest + Bicep",
      "Friday: Back + Tricep",
      "Saturday: Legs + Shoulder",
      "Sunday: Home Workout",
    ],
    exercises: [
      { id: "home-01", name: "Bodyweight Squat", sets: "3", reps: "15" },
      { id: "home-02", name: "Push-ups", sets: "3", reps: "15" },
      { id: "home-03", name: "Plank", sets: "3", reps: "60s" },
      { id: "home-04", name: "Jumping Jacks", sets: "3", reps: "30" },
      { id: "25", name: "Deadlift", sets: "5", reps: "5" },
      { id: "26", name: "Bench Press", sets: "5", reps: "5" },
      { id: "27", name: "Squat", sets: "5", reps: "5" },
    ],
  },
];


// @route   GET /api/plans
// @desc    Get all workout plans
// @access  Public
router.get('/', (req, res) => {
  res.json(workoutPlans);
});

// @route   GET /api/plans/:id
// @desc    Get single workout plan
// @access  Public
router.get('/:id', (req, res) => {
  const plan = workoutPlans.find(p => p.id === req.params.id);
  if (plan) {
    res.json(plan);
  } else {
    res.status(404).json({ message: 'Plan not found' });
  }
});

module.exports = router;
