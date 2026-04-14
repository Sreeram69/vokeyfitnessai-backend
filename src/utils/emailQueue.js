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
