/**
 * Async Error Handler Wrapper Middleware
 * Eliminates standard try/catch blocks in express controllers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
