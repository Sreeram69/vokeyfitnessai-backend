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
          const syncResult = await GoogleFitService.syncAllMetrics(user);
          console.log(`[CRON] Sync success for user ${user.username}:`, JSON.stringify(syncResult));
        } catch (userErr) {
          console.error(`[CRON] Failed syncing user ${user.username}:`, userErr.message);
          
          // Auto-disconnect user if refresh token is revoked
          if (userErr.message.includes("Token refresh failed") || userErr.message.includes("invalid_grant")) {
            user.googleFitCredentials.isConnected = false;
            await user.save();
            console.log(`[CRON] Auto-disconnected revoked user credentials for ${user.username}`);
          }
        }
      }
    } catch (globalError) {
      console.error("[CRON] Nightly synchronization job failed:", globalError.message);
    }
  });
};

module.exports = { initSyncJobs };
