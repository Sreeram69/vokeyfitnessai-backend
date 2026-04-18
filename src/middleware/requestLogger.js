const { logger } = require("../config/logger");

/**
 * Express Request Logger Middleware
 * Logs method, URL, status code, response time, and remote IP
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log on response completion
  res.on("finish", () => {
    const duration = Date.now() - start;
    const { method, originalUrl, ip } = req;
    const { statusCode } = res;

