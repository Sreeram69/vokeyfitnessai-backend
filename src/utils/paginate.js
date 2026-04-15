/**
 * Centralized High-Performance Pagination Utility
 * @param {Object} model - Mongoose Model
 * @param {Object} query - MongoDB query object
 * @param {Object} options - Pagination options
 * @param {Number} options.page - Page number (default: 1)
 * @param {Number} options.limit - Results per page (default: 10)
 * @param {Object} options.sort - Sort order (default: { createdAt: -1 })
 * @param {String} options.select - Projection fields
 * @param {String|Object} options.populate - Populate references
 * @returns {Promise<Object>}
 */
const paginate = async (
  model,
  query = {},
