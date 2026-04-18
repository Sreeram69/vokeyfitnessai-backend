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
