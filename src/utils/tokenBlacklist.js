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
    const remainingTimeSec = Math.ceil(remainingTimeMs / 1000);
    const key = `blacklist:${token}`;
    try {
      await client.set(key, "blacklisted", { EX: remainingTimeSec });
    } catch (err) {
      console.warn("⚠️ Failed to write blacklisted token to Redis cache, falling back to local memory:", err.message);
      blacklist.set(token, expiresAt);
    }
  } else {
    blacklist.set(token, expiresAt);
  }
};

/**
 * Check if a token is blacklisted
 * @param {String} token - JWT Access Token
 * @returns {Promise<Boolean>}
 */
const has = async (token) => {
  if (isRedisActive) {
    const key = `blacklist:${token}`;
    try {
      const exists = await client.get(key);
      if (exists) return true;
    } catch (err) {
      console.warn("⚠️ Failed to read blacklisted token from Redis cache, falling back to local memory:", err.message);
    }
  }

  // Fallback memory check
  const expiresAt = blacklist.get(token);
  if (!expiresAt) return false;

  // If token has expired, remove it and return false
  if (Date.now() > expiresAt) {
    blacklist.delete(token);
    return false;
  }

  return true;
};

// Periodically prune expired tokens every 5 minutes in the local fallback map
setInterval(() => {
  const now = Date.now();
  for (const [token, expiresAt] of blacklist.entries()) {
    if (now > expiresAt) {
      blacklist.delete(token);
    }
  }
}, 5 * 60 * 1000).unref(); // Use .unref() to not block Node process exit

module.exports = {
  add,
  has,
};
