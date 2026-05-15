// 1. Zod Environment Variable Validation (crashes fast with clear messages if misconfigured)
const env = require("./src/config/env");

// 2. Winston Professional Logger Initialization
const { logger } = require("./src/config/logger");

const express = require("express");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const compression = require("compression");
const helmet = require("helmet");

// Middleware Imports
const requestLogger = require("./src/middleware/requestLogger");
const { applySecurity, generalLimiter, authLimiter, aiLimiter } = require("./src/middleware/security");
