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
