const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Load environmental variables
const env = require("../src/config/env");
const Exercise = require("../src/models/Exercise");

const migrate = async () => {
  try {
    console.log("🚀 Starting Exercise MongoDB Migration Seeding Process...");
    
    // Connect to database
    await mongoose.connect(env.MONGO_URI);
    console.log("✅ Database connected successfully.");
