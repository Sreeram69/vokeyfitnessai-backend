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
  if (!user) {
    console.error("User Charmi not found. Listing all users in database:");
    const allUsers = await User.find({}, { username: 1, email: 1 });
    allUsers.forEach(u => console.log(`- ${u.username} (${u.email})`));
    mongoose.disconnect();
    return;
  }

  console.log("=== USER DETAILS ===");
  console.log(`ID: ${user._id}`);
  console.log(`Username: ${user.username}`);
  console.log(`Email: ${user.email}`);
  console.log(`Role: ${user.role}`);
  console.log("Achievements:", JSON.stringify(user.profile?.achievements || {}, null, 2));

  console.log("\n=== WORKOUT SESSIONS ===");
  const sessions = await WorkoutSession.find({ userId: user._id }).sort({ startedAt: -1 }).limit(5);
  sessions.forEach(s => {
    console.log(`- Date: ${s.startedAt.toISOString()} | Status: ${s.status} | Duration: ${s.duration}s | Calories: ${s.caloriesBurned} | Category: ${s.category}`);
    console.log(`  Completed Exercises (${s.exercisesCompleted.length}):`, s.exercisesCompleted.map(e => e.name).join(", "));
  });

  console.log("\n=== ACTIVITY LOGS ===");
  const activities = await Activity.find({ userId: user._id }).sort({ date: -1 }).limit(5);
  activities.forEach(a => {
    console.log(`- Date: ${a.date.toISOString()} | Steps: ${a.steps} | Water: ${a.waterIntake} | Calories: ${a.caloriesBurned} | Time: ${a.timeTaken}ms | Completion: ${a.completionPercentage}%`);
    console.log(`  Exercises Completed (${a.exercisesCompleted.length}):`, a.exercisesCompleted.map(e => e.name).join(", "));
  });

  mongoose.disconnect();
}

checkDb().catch(err => {
  console.error("Error:", err);
  mongoose.disconnect();
});
