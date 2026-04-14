const { isRedisActive, client } = require("./redisClient");
const { sendOtpEmail } = require("./mailer");

const QUEUE_KEY = "vokey_email_queue";
let isWorkerRunning = false;

/**
 * Background worker loop to consume email tasks from Redis
 */
const startQueueWorker = async () => {
  if (!isRedisActive || !client || isWorkerRunning) return;
  isWorkerRunning = true;
  console.log("⚙️  Redis Background Email Worker successfully launched.");

  while (isRedisActive) {
    try {
      // Blocking pop from the right side of the list (blocking timeout: 5s)
      // client.blPop returns [key, value] or null
      const taskData = await client.blPop(QUEUE_KEY, 5);
      if (taskData) {
        const { email, otpCode, purpose, username } = JSON.parse(taskData.element);
        console.log(`✉️  Background Worker processing task: ${email} for [${purpose}]`);
        await sendOtpEmail(email, otpCode, purpose, username);
      }
    } catch (err) {
      // Prevent infinite crash loops on connection hiccups, wait 2 seconds before retry
      console.warn("⚠️ Background Email Worker encountered connection issue. Retrying in 2s...", err.message);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  isWorkerRunning = false;
};

// Initialize the background worker if Redis is active
setTimeout(() => {
  if (isRedisActive) {
    startQueueWorker();
  }
}, 2000).unref();

/**
 * Add a task to the background email queue
 * @param {Object} task - { email, otpCode, purpose, username }
 */
const add = async (task) => {
  const { email, otpCode, purpose, username } = task;

  if (isRedisActive && client) {
    try {
      const payload = JSON.stringify({ email, otpCode, purpose, username });
      // Push task to the left side of the list
      await client.lPush(QUEUE_KEY, payload);
      
      // Auto-boot worker if it dropped out
      if (!isWorkerRunning) {
        startQueueWorker();
      }
      return;
    } catch (err) {
      console.warn("⚠️ Redis task queuing failed. Falling back to local setImmediate deferral:", err.message);
    }
  }

  // Local out-of-band event loop execution
  // Delays SMTP/Ethereal generation until the next tick, freeing the HTTP request immediately
  setImmediate(async () => {
    console.log(`✉️  setImmediate Background processing task: ${email} for [${purpose}]`);
    await sendOtpEmail(email, otpCode, purpose, username);
  });
};

module.exports = {
  add
};
