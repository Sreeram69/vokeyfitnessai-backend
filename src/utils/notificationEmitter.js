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

  setupRedisSubscription() {
    if (isRedisActive && subscriber) {
      try {
        subscriber.subscribe(REDIS_CHANNEL, (message) => {
          try {
            const notif = JSON.parse(message);
            // Trigger standard EventEmitter dispatches to all local SSE socket threads
            super.emit("new_alert", notif);
          } catch (e) {
            console.error("❌ Failed to parse Redis Pub/Sub notification payload:", e.message);
          }
        });
        this.redisSubscribed = true;
        console.log("📡 Redis Pub/Sub subscription active for channel 'vokey_notifications'.");
      } catch (err) {
        console.error("⚠️ Failed to activate Redis Pub/Sub subscription:", err.message);
      }
    }
  }

  emit(event, ...args) {
    // Intercept alert emissions and publish to Redis cluster for multi-instance dispatch
    if (event === "new_alert" && isRedisActive && publisher) {
      try {
        const notif = args[0];
        publisher.publish(REDIS_CHANNEL, JSON.stringify(notif));
        return true;
      } catch (err) {
        console.warn("⚠️ Failed to publish event on Redis, falling back locally:", err.message);
        return super.emit(event, ...args);
      }
    }
    return super.emit(event, ...args);
  }
}

const notificationEmitter = new NotificationEmitter();

module.exports = notificationEmitter;
