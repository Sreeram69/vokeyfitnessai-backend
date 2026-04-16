const redis = require("redis");

let isRedisActive = false;
let client = null;
let publisher = null;
let subscriber = null;

const initializeRedis = async () => {
  if (process.env.REDIS_URL && process.env.REDIS_URL !== "redis://localhost:6379") {
    try {
      client = redis.createClient({ url: process.env.REDIS_URL });
      publisher = redis.createClient({ url: process.env.REDIS_URL });
      subscriber = redis.createClient({ url: process.env.REDIS_URL });

      client.on("error", (err) => console.warn("⚠️ Redis client error:", err.message));
      publisher.on("error", (err) => console.warn("⚠️ Redis publisher error:", err.message));
      subscriber.on("error", (err) => console.warn("⚠️ Redis subscriber error:", err.message));

      await Promise.all([
        client.connect(),
        publisher.connect(),
        subscriber.connect()
      ]);

      isRedisActive = true;
      console.log("✅ Redis cluster connections successfully established (Cache, Pub, Sub).");
    } catch (err) {
      console.warn("⚠️ Redis initialization failed. Falling back to local in-memory brokers:", err.message);
      isRedisActive = false;
      client = null;
      publisher = null;
      subscriber = null;
    }
  }
};

initializeRedis();

// Mock local cache implementation that matches redis API contracts (async/await)
const localCache = new Map();
const mockClient = {
  get: async (key) => {
    const record = localCache.get(key);
    if (!record) return null;
    if (record.expiresAt && Date.now() > record.expiresAt) {
      localCache.delete(key);
      return null;
    }
    return record.value;
  },
  set: async (key, value, options) => {
    let expiresAt = null;
    if (options && options.EX) {
      expiresAt = Date.now() + (options.EX * 1000);
    }
    localCache.set(key, { value: String(value), expiresAt });
    return "OK";
  },
  del: async (key) => {
    localCache.delete(key);
    return 1;
  }
};

module.exports = {
  get isRedisActive() { return isRedisActive; },
  get client() { return isRedisActive ? client : mockClient; },
  get publisher() { return isRedisActive ? publisher : null; },
  get subscriber() { return isRedisActive ? subscriber : null; }
};
