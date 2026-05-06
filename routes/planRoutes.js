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
