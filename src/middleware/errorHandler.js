const { sendError } = require("../utils/apiResponse");

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  
  // Log the error stack to the console/logger
  const logger = global.logger || console;
  logger.error(`Error: ${err.message} | Stack: ${err.stack}`);

  let message = err.message || "An unexpected server error occurred";
  let errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";

  // Handle common Mongoose/MongoDB errors
  if (err.name === "ValidationError") {
    message = Object.values(err.errors).map((val) => val.message).join(", ");
    errorCode = "VALIDATION_ERROR";
    return sendError(res, message, errorCode, 400);
  }

  if (err.name === "CastError") {
    message = `Resource not found with id of ${err.value}`;
    errorCode = "RESOURCE_NOT_FOUND";
    return sendError(res, message, errorCode, 404);
  }

  if (err.code === 11000) {
    message = "Duplicate field value entered";
    errorCode = "DUPLICATE_KEY_ERROR";
    return sendError(res, message, errorCode, 400);
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    message = "Invalid token authorization signature";
    errorCode = "INVALID_TOKEN";
    return sendError(res, message, errorCode, 401);
  }

  if (err.name === "TokenExpiredError") {
    message = "Authorization token has expired";
    errorCode = "TOKEN_EXPIRED";
    return sendError(res, message, errorCode, 401);
  }

  // Under production, hide deep server stack traces
  const finalMessage = process.env.NODE_ENV === "production" && statusCode === 500
    ? "An unexpected internal server error occurred"
    : message;

  return sendError(res, finalMessage, errorCode, statusCode);
};

module.exports = errorHandler;

