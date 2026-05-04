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
