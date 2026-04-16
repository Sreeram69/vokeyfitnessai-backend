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
  { page = 1, limit = 10, sort = { createdAt: -1 }, select = "", populate = "" } = {}
) => {
  const parsedPage = Math.max(1, parseInt(page, 10));
  const parsedLimit = Math.max(1, parseInt(limit, 10));
  const skip = (parsedPage - 1) * parsedLimit;

  let queryBuilder = model.find(query)
    .sort(sort)
    .select(select)
    .skip(skip)
    .limit(parsedLimit)
    .lean(); // Enforce lean for optimal performance

  if (populate) {
    queryBuilder = queryBuilder.populate(populate);
  }

  const [totalResults, results] = await Promise.all([
    model.countDocuments(query),
    queryBuilder,
  ]);

  const totalPages = Math.ceil(totalResults / parsedLimit);

  return {
    results,
    page: parsedPage,
    limit: parsedLimit,
    totalPages,
    totalResults,
  };
};

module.exports = paginate;
