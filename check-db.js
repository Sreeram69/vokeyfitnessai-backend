const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Activity = require("./src/models/Activity");
const WorkoutSession = require("./src/models/WorkoutSession");
const User = require("./src/models/User");

async function checkDb() {
  console.log("Connecting to database...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.");

  // Find user Charmi
  const user = await User.findOne({ username: /Charmi/i });
