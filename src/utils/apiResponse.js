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
