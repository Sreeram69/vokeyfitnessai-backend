const jwt = require("jsonwebtoken");
const User = require("../models/User");
const tokenBlacklist = require("../utils/tokenBlacklist");
const { sendError } = require("../utils/apiResponse");

const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } 
  // 2. Fallback to HttpOnly cookie
  else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }
  // 3. Fallback to query parameter (needed for EventSource SSE)
  else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return sendError(res, "Not authorized, no token provided", "UNAUTHORIZED", 401);
  }

  // 3. Check if token is blacklisted (e.g. logged out)
  if (await tokenBlacklist.has(token)) {
    return sendError(res, "Session has expired, please log in again", "TOKEN_BLACKLISTED", 401);
  }

  try {
    // 4. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Get user from database
    req.user = await User.findById(decoded.id).select("-password").lean();

    if (!req.user) {
      return sendError(res, "User associated with this token no longer exists", "USER_NOT_FOUND", 401);
    }

    if (!req.user.isVerified) {
      return sendError(res, "Please verify your email address to proceed", "EMAIL_NOT_VERIFIED", 403);
    }

    if (req.user.status === "suspended") {
      return sendError(res, "Your account has been suspended. Please contact support.", "ACCOUNT_SUSPENDED", 403);
    }

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return sendError(res, "Authorization token has expired", "TOKEN_EXPIRED", 401);
    }
    return sendError(res, "Not authorized, token validation failed", "INVALID_TOKEN", 401);
  }
};
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return sendError(res, "Access denied. Admin privileges required.", "FORBIDDEN", 403);
};

module.exports = { protect, adminOnly };
