const { sendError } = require("../utils/apiResponse");

/**
 * Zod Request Validation Middleware
 * Matches schemas against body, query, or params and formats clean 400 errors.
 * @param {Object} schemas - object containing Zod schemas for body, query, or params
 */
const validate = (schemas) => (req, res, next) => {
  try {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    if (schemas.query) {
      const parsedQuery = schemas.query.parse(req.query);
      Object.defineProperty(req, "query", {
        value: parsedQuery,
        writable: true,
        configurable: true,
        enumerable: true
      });
    }
    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }
    next();
  } catch (error) {
    if (error.errors) {
      // Map Zod validation errors to clean messages
      const details = error.errors.map(
        (err) => `${err.path.join(".")}: ${err.message}`
      );
      
      return res.status(400).json({
        success: false,
        message: "Invalid request payload validation failed",
        errorCode: "VALIDATION_ERROR",
        errors: details,
        timestamp: new Date().toISOString()
      });
    }
    next(error);
  }
};

module.exports = validate;
