const User = require("../models/User");
const Activity = require("../models/Activity");

class GoogleFitService {
  // Helpers to get client configurations dynamically
  getGoogleCredentials() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error("Google Fit API credentials are not fully configured on the server");
    }

    return { clientId, clientSecret, redirectUri };
