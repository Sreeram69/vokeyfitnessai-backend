const winston = require("winston");
require("winston-daily-rotate-file");
const path = require("path");

const logDirectory = path.join(__dirname, "../../logs");

// Logging levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Colors for console logging
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

// Log formats
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.printf(
    (info) => `[${info.timestamp}] [${info.level.toUpperCase()}]: ${info.message}`
  )
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `[${info.timestamp}] [${info.level}]: ${info.message}`
  )
);

// Transports
const transports = [
  // Console logging for development
  new winston.transports.Console({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    format: consoleFormat,
  }),

  // Error logs rotation
  new winston.transports.DailyRotateFile({
    filename: path.join(logDirectory, "error-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
    level: "error",
    format,
  }),

  // Combined logs rotation
  new winston.transports.DailyRotateFile({
    filename: path.join(logDirectory, "combined-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
    level: "info",
    format,
  }),
];

// Create specific security logger
const securityLoggerObj = winston.createLogger({
  levels,
  transports: [
    new winston.transports.Console({
      level: "warn",
      format: consoleFormat,
    }),
    new winston.transports.DailyRotateFile({
      filename: path.join(logDirectory, "security-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "30d",
      level: "info",
      format,
    }),
  ],
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  levels,
  transports,
});

// Set global logger objects
global.logger = logger;
global.securityLogger = securityLoggerObj;

module.exports = {
  logger,
  securityLogger: securityLoggerObj,
};
