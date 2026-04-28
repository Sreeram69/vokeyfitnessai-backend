const User = require("../models/User");
const Session = require("../models/Session");
const OTPVerification = require("../models/OTPVerification");
const Notification = require("../models/Notification");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const tokenBlacklist = require("../utils/tokenBlacklist");
const emailQueue = require("../utils/emailQueue");
const { sendSuccess, sendError } = require("../utils/apiResponse");

// Generate short-lived JWT Access Token (15 minutes)
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

// Generate long-lived JWT Refresh Token (7 days)
const generateRefreshToken = (id) => {
  // Add a unique nonce (random string + timestamp) to prevent duplicate key errors in the sessions collection during concurrent logins
  const nonce = Math.random().toString(36).substring(2) + Date.now();
  return jwt.sign({ id, nonce }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

// Generate and send OTP helper
const generateAndSendOtp = async (email, purpose, username = null) => {
  // Check for resend cooldown (30 seconds)
  const lastOtp = await OTPVerification.findOne({ email, purpose }).sort({ createdAt: -1 });
  if (lastOtp && (Date.now() - new Date(lastOtp.createdAt).getTime()) < 30 * 1000) {
    throw new Error("RESEND_COOLDOWN");
  }

  // Generate secure 6-digit OTP
  const otpCode = crypto.randomInt(100000, 999999).toString();
  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(otpCode, salt);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

  // Store hashed OTP
  await OTPVerification.create({
    email,
    otpHash,
    purpose,
    expiresAt,
    attempts: 0,
    verified: false,
  });

  // Look up user to get their username if not provided
  let finalUsername = username;
  if (!finalUsername) {
    const user = await User.findOne({ email: email.toLowerCase() }).lean();
    finalUsername = user ? user.username : "Athlete";
  }

  // Queue email dispatch in the background out-of-band of the HTTP response
  await emailQueue.add({ email, otpCode, purpose, username: finalUsername });
  return otpCode;
};

// Helper to set HttpOnly secure cookies
const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === "production";
  
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/",
  };

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// Helper to clear token cookies
const clearTokenCookies = (res) => {
  const isProduction = process.env.NODE_ENV === "production";
  
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/",
  };

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
};

// Helper to create a user session in DB
const createUserSession = async (userId, refreshToken, req) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  await Session.create({
    userId,
    refreshToken,
    expiresAt,
    userAgent: req.headers["user-agent"] || "unknown",
    ipAddress: req.ip || req.connection.remoteAddress || "unknown",
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email }).lean();

    if (userExists) {
      return sendError(res, "User already exists", "USER_ALREADY_EXISTS", 400);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user (unverified by default)
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      isVerified: false,
    });

    if (user) {
      // Generate & send verification OTP
      const otpCode = await generateAndSendOtp(user.email, "email_verification", user.username);

      // Create system notification for admins
      await Notification.create({
        recipient: "admin",
        sender: "system",
        title: "New Athlete Registration",
        message: `Athlete ${user.username} has registered a new node account.`,
        type: "auth",
        priority: "low"
      }).catch(err => console.error("Failed to trigger registration notification alert:", err));

      // Security audit log
      if (global.securityLogger) {
        global.securityLogger.warn(`New account registered: Email: ${user.email} | User ID: ${user._id}`);
      }

      // Return status requiring verification
      return sendSuccess(res, "User registered successfully. Please verify your email.", {
        needsVerification: true,
        email: user.email,
        userId: user._id,
        devOtp: process.env.NODE_ENV === "development" ? otpCode : undefined,
      }, 201);
    } else {
      return sendError(res, "Invalid user data", "INVALID_USER_DATA", 400);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && user.status === "suspended") {
      return sendError(res, "Your account has been suspended. Please contact support.", "ACCOUNT_SUSPENDED", 403);
    }

    if (user && (await bcrypt.compare(password, user.password))) {
      // Generate OTP code for 2-factor verification
      const otpCode = await generateAndSendOtp(user.email, "email_verification", user.username);

      // Security audit log
      if (global.securityLogger) {
        global.securityLogger.warn(`User login requested OTP: Email: ${user.email} | User ID: ${user._id}`);
      }

      return sendSuccess(res, "Verification code sent to your email", {
        needsVerification: true,
        email: user.email,
        userId: user._id,
        devOtp: process.env.NODE_ENV === "development" ? otpCode : undefined,
      });
    } else {
      if (global.securityLogger) {
        global.securityLogger.warn(`Failed login attempt for email: ${email}`);
      }
      return sendError(res, "Invalid credentials", "UNAUTHORIZED", 401);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Send a new OTP
// @route   POST /api/auth/send-otp
// @access  Public/Private
const sendOtp = async (req, res, next) => {
  try {
    const email = req.user ? req.user.email : req.body.email;
    const purpose = req.body.purpose || "email_verification";

    if (!email) {
      return sendError(res, "Email address is required", "BAD_REQUEST", 400);
    }

    try {
      const otpCode = await generateAndSendOtp(email, purpose);
      return sendSuccess(res, "Verification code sent successfully!", {
        devOtp: process.env.NODE_ENV === "development" ? otpCode : undefined,
      });
    } catch (err) {
      if (err.message === "RESEND_COOLDOWN") {
        return sendError(res, "Please wait 30 seconds before requesting another code", "RESEND_COOLDOWN", 429);
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP code
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res, next) => {
  try {
    const { code } = req.body;
    const email = req.user ? req.user.email : req.body.email;
    const purpose = req.body.purpose || "email_verification";

    if (!email) {
      return sendError(res, "Email is required to verify OTP", "BAD_REQUEST", 400);
    }

    // Find latest active OTP record
    const record = await OTPVerification.findOne({ email, purpose, verified: false }).sort({ createdAt: -1 });

    if (!record) {
      return sendError(res, "No verification request found for this email", "INVALID_OTP", 400);
    }

    // Expiration check
    if (record.expiresAt < new Date()) {
      return sendError(res, "Verification code has expired. Request a new OTP.", "OTP_EXPIRED", 400);
    }

    // Lockout check
    if (record.attempts >= 5) {
      return sendError(res, "Too many failed attempts. This code is locked. Please request a new OTP.", "OTP_LOCKED", 400);
    }

    const isMatch = await bcrypt.compare(code, record.otpHash);
    if (!isMatch) {
      record.attempts += 1;
      await record.save();

      if (record.attempts >= 5) {
        return sendError(res, "Too many failed attempts. This code is locked. Please request a new OTP.", "OTP_LOCKED", 400);
      }

      return sendError(res, `Invalid verification code. ${5 - record.attempts} attempts remaining.`, "INVALID_OTP", 400);
    }

    // Mark verified
    record.verified = true;
    await record.save();

    if (purpose === "email_verification") {
      const user = await User.findOne({ email });
      if (user) {
        user.isVerified = true;
        if (user.email === "ramsreeram249@gmail.com" && user.role !== "admin") {
          user.role = "admin";
        }
        await user.save();

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        await createUserSession(user._id, refreshToken, req);
        setTokenCookies(res, accessToken, refreshToken);

        return sendSuccess(res, "Email verified successfully!", {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.email === "ramsreeram249@gmail.com" ? "admin" : (user.role || "user"),
          token: accessToken,
          accessToken,
          profile: user.profile,
        });
      }
    }

    return sendSuccess(res, "OTP verified successfully!", { verified: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend OTP code
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOtp = async (req, res, next) => {
  try {
    const email = req.user ? req.user.email : req.body.email;
    const purpose = req.body.purpose || "email_verification";

    if (!email) {
      return sendError(res, "Email is required to resend OTP", "BAD_REQUEST", 400);
    }

    try {
      const otpCode = await generateAndSendOtp(email, purpose);
      return sendSuccess(res, "New verification code sent successfully!", {
        devOtp: process.env.NODE_ENV === "development" ? otpCode : undefined,
      });
    } catch (err) {
      if (err.message === "RESEND_COOLDOWN") {
        return sendError(res, "Please wait 30 seconds before requesting another code", "RESEND_COOLDOWN", 429);
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password request
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      const otpCode = await generateAndSendOtp(email, "password_reset", user.username);
      return sendSuccess(res, "If the email is registered, a password reset code has been sent.", {
        devOtp: process.env.NODE_ENV === "development" ? otpCode : undefined,
      });
    }

    return sendSuccess(res, "If the email is registered, a password reset code has been sent.");
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using OTP code
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return sendError(res, "User not found", "USER_NOT_FOUND", 404);
    }

    // Verify reset OTP
    const record = await OTPVerification.findOne({ email, purpose: "password_reset", verified: false }).sort({ createdAt: -1 });

    if (!record) {
      return sendError(res, "No active password reset request found for this email", "INVALID_OTP", 400);
    }

    if (record.expiresAt < new Date()) {
      return sendError(res, "Verification code has expired. Request a new password reset code.", "OTP_EXPIRED", 400);
    }

    if (record.attempts >= 5) {
      return sendError(res, "Verification code locked due to too many failed attempts.", "OTP_LOCKED", 400);
    }

    const isMatch = await bcrypt.compare(code, record.otpHash);
    if (!isMatch) {
      record.attempts += 1;
      await record.save();
      return sendError(res, "Invalid verification code", "INVALID_OTP", 400);
    }

    // Mark OTP as verified
    record.verified = true;
    await record.save();

    // Hash and update new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Invalidate active user sessions
    await Session.deleteMany({ userId: user._id });
    clearTokenCookies(res);

    if (global.securityLogger) {
      global.securityLogger.warn(`Password reset successfully for email: ${email}`);
    }

    return sendSuccess(res, "Password updated successfully! Please log in with your new credentials.");
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh session and tokens (RTR)
// @route   POST /api/auth/refresh
// @access  Public
const refreshSession = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    
    if (!token) {
      return sendError(res, "Refresh token is missing", "NO_REFRESH_TOKEN", 401);
    }

    // Find the session in database
    const session = await Session.findOne({ refreshToken: token });
    if (!session) {
      clearTokenCookies(res);
      return sendError(res, "Session not found or expired", "INVALID_REFRESH_TOKEN", 401);
    }

    try {
      // Verify refresh token signature
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      if (decoded.id !== session.userId.toString()) {
        await session.deleteOne();
        clearTokenCookies(res);
        return sendError(res, "Invalid token payload mapping", "INVALID_REFRESH_TOKEN", 401);
      }

      // Refresh Token Rotation (RTR): Delete old session, generate new tokens, create new session
      await session.deleteOne();

      const newAccessToken = generateAccessToken(decoded.id);
      const newRefreshToken = generateRefreshToken(decoded.id);

      await createUserSession(decoded.id, newRefreshToken, req);
      setTokenCookies(res, newAccessToken, newRefreshToken);

      return sendSuccess(res, "Token refreshed successfully", {
        token: newAccessToken,
        accessToken: newAccessToken
      });
    } catch (err) {
      // Delete session and cookies if token verification fails
      await session.deleteOne();
      clearTokenCookies(res);
      return sendError(res, "Refresh token signature failed", "INVALID_REFRESH_TOKEN", 401);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user & invalidate tokens
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    if (token) {
      // Invalidate/delete the session in MongoDB
      await Session.deleteOne({ refreshToken: token });
    }

    // Blacklist current access token if present
    let accessToken;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      accessToken = req.headers.authorization.split(" ")[1];
    } else {
      accessToken = req.cookies.accessToken;
    }

    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        const remainingTime = (decoded.exp * 1000) - Date.now();
        if (remainingTime > 0) {
          // Add to blacklist until it naturally expires
          await tokenBlacklist.add(accessToken, Date.now() + remainingTime);
        }
      } catch (err) {
        // Token is already invalid, no need to blacklist
      }
    }

    clearTokenCookies(res);
    return sendSuccess(res, "Logged out successfully", {});
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    let user = await User.findById(req.user._id).select("-password").lean();

    if (user) {
      // Dynamic fallback check: If the developer email is registered, ensure it is set as admin
      if (user.email === "ramsreeram249@gmail.com" && user.role !== "admin") {
        await User.updateOne({ _id: user._id }, { $set: { role: "admin" } });
        user.role = "admin";
      }
      return sendSuccess(res, "Profile fetched successfully", {
        ...user,
        role: user.email === "ramsreeram249@gmail.com" ? "admin" : (user.role || "user")
      });
    } else {
      return sendError(res, "User not found", "USER_NOT_FOUND", 404);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // Safely convert user.profile to plain object using toObject on parent user
      const existingProfile = user.toObject().profile || {};
      user.profile = {
        ...existingProfile,
        ...req.body
      };

      const updatedUser = await user.save();
      return sendSuccess(res, "Profile updated successfully", { profile: updatedUser.toObject().profile });
    } else {
      return sendError(res, "User not found", "USER_NOT_FOUND", 404);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Generate Google Consent URL with profile and fitness scopes
// @route   GET /api/auth/google/url
// @access  Public
const getGoogleAuthUrl = (req, res, next) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return sendError(res, "Google Client ID or Redirect URI is missing on the server", "CONFIG_ERROR", 500);
    }

    const scopes = [
      "openid",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/fitness.activity.read",
      "https://www.googleapis.com/auth/fitness.body.read",
      "https://www.googleapis.com/auth/fitness.heart_rate.read",
      "https://www.googleapis.com/auth/fitness.sleep.read"
    ];

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scopes.join(" "))}` +
      `&access_type=offline` +
      `&prompt=select_account`;

    return sendSuccess(res, "Google Auth URL generated successfully", { url: authUrl });
  } catch (error) {
    next(error);
  }
};

// @desc    Handle Google OAuth callback and authenticate / register user
// @route   POST /api/auth/google/callback
// @access  Public
const handleGoogleCallback = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return sendError(res, "Authorization code is required", "BAD_REQUEST", 400);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return sendError(res, "Google Fit API credentials are not fully configured on the server", "CONFIG_ERROR", 500);
    }

    // Exchange auth code for Google OAuth tokens
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
      console.error("Google Token Exchange failure:", tokens.error_description || tokens.error);
      return sendError(res, tokens.error_description || tokens.error, "OAUTH_EXCHANGE_FAILURE", 400);
    }

    const { access_token, refresh_token, expires_in } = tokens;

    // Fetch user profile info from Google
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { "Authorization": `Bearer ${access_token}` }
    });
    
    const profileData = await profileRes.json();
    if (profileData.error) {
      console.error("Google profile lookup failure:", profileData.error);
      return sendError(res, "Failed to retrieve Google profile data", "OAUTH_PROFILE_FAILURE", 400);
    }

    const googleId = profileData.sub;
    const email = profileData.email?.toLowerCase();
    const name = profileData.name || "Athlete";
    const picture = profileData.picture || "";

    if (!email) {
      return sendError(res, "Google account must have an email associated to login", "NO_EMAIL_ASSOCIATED", 400);
    }

    // Find user by Google ID or by email
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      // 1. Create a brand new Google user
      user = new User({
        username: name.replace(/\s+/g, "").substring(0, 15) + Math.floor(1000 + Math.random() * 9000),
        email,
        authProvider: "google",
        avatar: picture,
        googleId,
        isVerified: true,
        googleEmailVerified: true,
        profile: {
          name,
          joinedDate: new Date(),
          achievements: { streak: 0, workoutsCompleted: 0, plansCompleted: 0 }
        }
      });
    } else {
      // 2. Existing user found: Merge / Update profile details
      user.googleId = googleId;
      user.authProvider = "google";
      user.avatar = picture || user.avatar;
      user.isVerified = true;
      user.googleEmailVerified = true;
    }

    // 3. Save Google Fit Credentials into user schema
    user.googleFitCredentials = {
      accessToken: access_token,
      refreshToken: refresh_token || (user.googleFitCredentials && user.googleFitCredentials.refreshToken),
      expiryDate: Date.now() + (expires_in * 1000),
      isConnected: true
    };

    await user.save();

    // 4. Trigger instant background sync in a micro-task so dashboard is loaded immediately with latest telemetry
    const GoogleFitService = require("../services/GoogleFitService");
    GoogleFitService.syncAllMetrics(user).catch(err => {
      console.error(`[OAUTH] Post-login background Google Fit sync failed for ${user.username}:`, err.message);
    });

    // 5. Create active session and issue tokens
    const accessToken = generateAccessToken(user._id);
    const platformRefreshToken = generateRefreshToken(user._id);

    await createUserSession(user._id, platformRefreshToken, req);
    setTokenCookies(res, accessToken, platformRefreshToken);

    // 6. Security audit logging
    if (global.securityLogger) {
      global.securityLogger.warn(`Google OAuth Login success: Email: ${user.email} | User ID: ${user._id}`);
    }

    // Create system notification
    await Notification.create({
      recipient: user._id,
      sender: "system",
      title: "Google Sync Successful",
      message: `Welcome back, ${name}! Your Google Fit telemetry has been successfully integrated and synchronized.`,
      type: "auth",
      priority: "low"
    }).catch(err => console.error("OAuth registration notification error:", err));

    return sendSuccess(res, "Google authentication successful", {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.email === "ramsreeram249@gmail.com" ? "admin" : (user.role || "user"),
      token: accessToken,
      accessToken,
      profile: user.profile,
      avatar: user.avatar
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  sendOtp,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  refreshSession,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getGoogleAuthUrl,
  handleGoogleCallback
};
