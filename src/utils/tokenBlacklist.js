const { isRedisActive, client } = require("./redisClient");

// Memory cache fallback for when Redis is disabled/offline
const blacklist = new Map();

/**
 * Add a token to the blacklist
 * @param {String} token - JWT Access Token
 * @param {Number} expiresAt - Expiration timestamp in milliseconds
 */
const add = async (token, expiresAt) => {
  const remainingTimeMs = expiresAt - Date.now();
  if (remainingTimeMs <= 0) return;

  if (isRedisActive) {
