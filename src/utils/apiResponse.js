/**
 * Centralized API Response Helpers
 */

/**
 * Standard Success Response
 * @param {Object} res - Express response object
 * @param {String} message - Human-readable success message
 * @param {Object|Array} data - Data payload
 * @param {Number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (res, message, data = {}, statusCode = 200) => {
  const responseObj = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };

  // Preserve absolute backward-compatibility with the client-side code
  // by spreading flat data object properties directly into the response root
  if (data && typeof data === "object" && !Array.isArray(data)) {
    Object.assign(responseObj, data);
  }

  return res.status(statusCode).json(responseObj);
};

/**
 * Standard Error Response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {String} errorCode - Custom error identifier code
 * @param {Number} statusCode - HTTP status code (default: 500)
 */
const sendError = (res, message, errorCode = "INTERNAL_SERVER_ERROR", statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  sendSuccess,
  sendError
};
