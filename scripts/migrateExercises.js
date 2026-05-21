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

    // Read local exerciseDb.json
    const exerciseDbPath = path.join(__dirname, "../src/data/exerciseDb.json");
    if (!fs.existsSync(exerciseDbPath)) {
      console.warn("⚠️  Source file src/data/exerciseDb.json not found! Migration cancelled.");
      await mongoose.connection.close();
      return;
    }

    const localExercises = JSON.parse(fs.readFileSync(exerciseDbPath, "utf-8"));
    console.log(`📂 Read ${localExercises.length} exercises from JSON database.`);

    let insertedCount = 0;
    let skippedCount = 0;

    for (const ex of localExercises) {
      const exists = await Exercise.exists({ id: ex.id });
      if (!exists) {
        await Exercise.create({
          id: ex.id,
          name: ex.name,
          bodyPart: (ex.bodyPart || "cardio").toLowerCase().trim(),
          target: (ex.target || "general").toLowerCase().trim(),
          equipment: (ex.equipment || "body weight").toLowerCase().trim(),
          gifUrl: ex.gifUrl || "",
          description: ex.description || "",
          difficulty: ex.difficulty || "Intermediate",
          instructions: Array.isArray(ex.instructions) ? ex.instructions : [ex.instructions || ""],
          secondaryMuscles: Array.isArray(ex.secondaryMuscles) ? ex.secondaryMuscles : [],
          role: ex.role || "user"
        });
        insertedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`🎉 Migration Completed!`);
    console.log(`   - Seeded/Inserted: ${insertedCount} exercises`);
    console.log(`   - Skipped (already in DB): ${skippedCount} exercises`);
    
    await mongoose.connection.close();
    console.log("👋 Database connection cleanly closed. Safe exit.");
  } catch (error) {
    console.error("❌ Critical migration failure:", error);
    process.exit(1);
  }
};

migrate();
