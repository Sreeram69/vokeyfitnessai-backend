const notificationEmitter = require("../utils/notificationEmitter");

/**
 * Establish a native Server-Sent Events stream connection for real-time alerts
 * @route GET /api/notifications/stream
 * @access Private
 */
const streamNotifications = async (req, res, next) => {
  try {
    const userIdStr = req.user._id.toString();

    // Set standard Server-Sent Events headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no" // Disable buffering for Nginx if present
    });

    // Write baseline handshake event to open client channel
    res.write("retry: 10000\n");
    res.write("event: handshake\n");
    res.write(`data: ${JSON.stringify({ status: "connected", userId: userIdStr })}\n\n`);

    // Setup listener on the shared event broker
    const newAlertListener = (notif) => {
      const recipient = notif.recipient ? notif.recipient.toString() : "all";
      const isRecipientMatch = recipient === "all" || recipient === userIdStr;
      
      const isAdminMatch = recipient === "admin" && req.user.role === "admin";

      if (isRecipientMatch || isAdminMatch) {
        // Translate format to align with TopbarV2 DB structures
        const payload = {
          id: notif._id,
          title: notif.title,
          message: notif.message,
          type: notif.type || "announcement",
          priority: notif.priority || "medium",
          read: notif.read || false,
          date: new Date(notif.createdAt).toLocaleDateString(),
          isDb: true
        };
        
        res.write("event: message\n");
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      }
    };

    // Keep connection alive with 30s heartbeats (prevents timeouts from reverse proxies)
    const heartbeatInterval = setInterval(() => {
      res.write(":\n\n"); // SSE comment as heartbeat
    }, 30000);

    notificationEmitter.on("new_alert", newAlertListener);

    // Clean up connections on client close
    req.on("close", () => {
      clearInterval(heartbeatInterval);
      notificationEmitter.off("new_alert", newAlertListener);
      res.end();
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  streamNotifications
};
