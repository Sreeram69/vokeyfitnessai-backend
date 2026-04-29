const User = require("../models/User");
const Activity = require("../models/Activity");
const GoogleFitService = require("../services/GoogleFitService");

// Generate Google Auth URL
const getOAuthUrl = (req, res) => {
  try {
    const { clientId, redirectUri } = GoogleFitService.getGoogleCredentials();
    const scopes = [
      "https://www.googleapis.com/auth/fitness.activity.read",
      "https://www.googleapis.com/auth/fitness.body.read",
      "https://www.googleapis.com/auth/fitness.heart_rate.read",
      "https://www.googleapis.com/auth/fitness.sleep.read"
    ];
    
    const hasRefreshToken = req.user?.googleFitCredentials?.refreshToken;
    const promptParam = hasRefreshToken ? "select_account" : "consent";

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scopes.join(" "))}` +
      `&access_type=offline` +
      `&prompt=${promptParam}`;

    res.json({ success: true, url: authUrl });
  } catch (error) {
    console.error("OAuth URL error:", error.message);
    res.status(500).json({ success: false, message: error.message || "Failed to generate authorization URL" });
  }
};

// Handle Callback (Exchange code for tokens)
const handleOAuthCallback = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: "Authorization code is required" });
    }

    const { clientId, clientSecret, redirectUri } = GoogleFitService.getGoogleCredentials();

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });

    const tokens = await response.json();
    if (tokens.error) {
      console.error("Token exchange failed:", tokens.error_description || tokens.error);
      return res.status(400).json({ success: false, message: tokens.error_description || tokens.error });
    }

    const expiryDate = Date.now() + (tokens.expires_in * 1000);

    // Save tokens in user document
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.googleFitCredentials = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || (user.googleFitCredentials && user.googleFitCredentials.refreshToken),
      expiryDate,
      isConnected: true
    };
    await user.save();

    res.json({ success: true, message: "Google Fit connected successfully!" });
  } catch (error) {
    console.error("Callback handling error:", error.message);
    res.status(500).json({ success: false, message: error.message || "Internal server error during OAuth exchange" });
  }
};

// Synchronize daily fitness metrics
const syncFitnessData = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.googleFitCredentials || !user.googleFitCredentials.isConnected) {
      return res.status(400).json({ success: false, message: "Google Fit is not integrated for this account. Please connect Google Fit." });
    }

    const { date } = req.body;
    const syncResult = await GoogleFitService.syncAllMetrics(user, date);

    res.json({
      success: true,
      message: "Synced with Google Fit successfully!",
      steps: syncResult.steps,
      caloriesBurned: syncResult.caloriesBurned,
      activeMinutes: syncResult.activeMinutes,
      data: syncResult
    });
  } catch (error) {
    console.error("Step sync error:", error.message);
    
    // Auto-disconnect if credentials revoked
    if (error.message.includes("Token refresh failed") || error.message.includes("invalid_grant")) {
      await User.findByIdAndUpdate(req.user._id, {
        "googleFitCredentials.isConnected": false
      });
    }

    res.status(500).json({ success: false, message: error.message || "Fitness data sync failure" });
  }
};

// Fetch today's steps count
const getTodaySteps = async (req, res) => {
  try {
    const { date } = req.query;
    let activityDate;
    if (date) {
      activityDate = new Date(`${date}T00:00:00.000Z`);
    } else {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      activityDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    }

    const activity = await Activity.findOne({ userId: req.user._id, date: activityDate });
    const user = await User.findById(req.user._id).lean();

    res.json({
      success: true,
      steps: activity ? activity.steps : 0,
      caloriesBurned: activity ? activity.caloriesBurned : 0,
      activeMinutes: activity ? Math.round(activity.timeTaken / 60000) : 0,
      distance: activity ? activity.distance : 0,
      heartPoints: activity ? activity.heartPoints : 0,
      averageHeartRate: activity ? activity.averageHeartRate : 0,
      sleepHours: activity ? activity.sleepHours : 0,
      isConnected: !!(user && user.googleFitCredentials && user.googleFitCredentials.isConnected)
    });
  } catch (error) {
    console.error("Get steps error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching steps" });
  }
};

// Fetch weekly steps dataset
const getWeeklySteps = async (req, res) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    const activities = await Activity.find({
      userId: req.user._id,
      date: { $gte: oneWeekAgo }
    }).sort({ date: 1 }).lean();

    const weeklyLogs = activities.map(act => ({
      date: act.date,
      steps: act.steps || 0,
      caloriesBurned: act.caloriesBurned || 0,
      activeMinutes: Math.round((act.timeTaken || 0) / 60000),
      distance: act.distance || 0,
      heartPoints: act.heartPoints || 0,
      averageHeartRate: act.averageHeartRate || 0,
      sleepHours: act.sleepHours || 0
    }));

    res.json({
      success: true,
      data: weeklyLogs
    });
  } catch (error) {
    console.error("Get weekly steps error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching weekly dataset" });
  }
};

// Disconnect Google Fit connection
const disconnectFitness = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.googleFitCredentials = {
      accessToken: undefined,
      refreshToken: undefined,
      expiryDate: undefined,
      isConnected: false
    };
    await user.save();

    res.json({
      success: true,
      message: "Google Fit disconnected successfully!"
    });
  } catch (error) {
    console.error("Disconnect Google Fit error:", error);
    res.status(500).json({ success: false, message: "Server error while disconnecting Google Fit" });
  }
};

module.exports = {
  getOAuthUrl,
  handleOAuthCallback,
  syncFitnessData,
  getTodaySteps,
  getWeeklySteps,
  disconnectFitness
};
