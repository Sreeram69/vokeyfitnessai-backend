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
