const EventEmitter = require("events");
const { isRedisActive, publisher, subscriber } = require("./redisClient");

const REDIS_CHANNEL = "vokey_notifications";

class NotificationEmitter extends EventEmitter {
  constructor() {
    super();
    this.redisSubscribed = false;
    
    // Defer setup by 1.5 seconds to let async Redis connections complete
    setTimeout(() => {
      this.setupRedisSubscription();
    }, 1500).unref();
  }
