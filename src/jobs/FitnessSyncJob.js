const cron = require("node-cron");
const User = require("../models/User");
const GoogleFitService = require("../services/GoogleFitService");

const initSyncJobs = () => {
  // Sync all active Google Fit users at 11:55 PM every day to capture the complete day's statistics
  cron.schedule("55 23 * * *", async () => {
    console.log("[CRON] Running nightly Google Fit synchronization process...");
    try {
      const activeUsers = await User.find({ "googleFitCredentials.isConnected": true });
      console.log(`[CRON] Found ${activeUsers.length} connected accounts.`);

      for (const user of activeUsers) {
        try {
          console.log(`[CRON] Synchronizing user: ${user.username} (${user._id})`);
