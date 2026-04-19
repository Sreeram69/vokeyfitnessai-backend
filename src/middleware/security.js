const rateLimit = require("express-rate-limit");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");

/**
 * Configure dynamic CORS matching based on CLIENT_URL
 */
const corsConfiguration = () => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  
  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin, localhost loops, 127.0.0.1 loops, or matching clientUrl
      if (
        !origin ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("https://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin.startsWith("https://127.0.0.1:") ||
        origin === clientUrl ||
        clientUrl.startsWith(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS policy."));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  });
};

const isDev = process.env.NODE_ENV === "development";

/**
 * Rate Limiter for general endpoints
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 5000 : 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
    errorCode: "RATE_LIMIT_EXCEEDED"
  }
});

/**
 * Rate Limiter for auth routes (registration, login, OTP)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 60, // looser limit in dev, 60 in prod to mitigate brute-force
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication requests, please try again after 15 minutes",
    errorCode: "AUTH_RATE_LIMIT_EXCEEDED"
  }
});

/**
 * Rate Limiter for AI routes (costly token generation)
 */
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 500 : 15, // limit to 500 in dev, 15 in prod
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many AI requests. Please wait 15 minutes before executing more generations.",
    errorCode: "AI_RATE_LIMIT_EXCEEDED"
  }
});

/**
 * Clean incoming text fields from HTML/script injection tags (XSS protection)
 */
const xssClean = (req, res, next) => {
  const sanitize = (value) => {
    if (typeof value === "string") {
      // Basic stripping of HTML script or sensitive tags
      return value
        .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
        .replace(/on\w+="[^"]*"/gi, "")
        .replace(/on\w+='[^']*'/gi, "")
        .replace(/javascript:[^\s]*/gi, "");
    }
    if (value && typeof value === "object") {
      for (const key in value) {
        value[key] = sanitize(value[key]);
      }
    }
    return value;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) {
    const sanitizedQuery = sanitize(req.query);
    Object.defineProperty(req, "query", {
      value: sanitizedQuery,
      writable: true,
      configurable: true,
      enumerable: true
    });
  }
  if (req.params) req.params = sanitize(req.params);

  next();
};

/**
 * Apply security middleware wrappers
 */
const applySecurity = (app) => {
  // CORS configuration
  app.use(corsConfiguration());

  // Parameter pollution protection
  app.use(hpp());

  // Prevent NoSQL query injection
  app.use(mongoSanitize());

  // XSS Clean filtering
  app.use(xssClean);
};

module.exports = {
  applySecurity,
  generalLimiter,
  authLimiter,
  aiLimiter,
};
