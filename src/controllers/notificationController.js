const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const notificationEmitter = require("../utils/notificationEmitter");

// @desc    Create a new notification (announcement or targeted)
// @route   POST /api/notifications
// @access  Private (Admin only)
const createNotification = async (req, res, next) => {
  try {
    const { recipient, title, message, type, priority } = req.body;

    if (!title || !message) {
      return sendError(res, "Title and message are required fields", "VALIDATION_ERROR", 400);
    }

    let recipientId = recipient || "all";

    // If an email address is provided as the recipient, resolve it to the User's ID
    if (recipientId !== "all" && recipientId !== "admin") {
      const isEmail = recipientId.includes("@");
      if (isEmail) {
        const targetUser = await User.findOne({ email: recipientId.toLowerCase().trim() });
        if (!targetUser) {
          return sendError(res, `No registered athlete found with the email: ${recipientId}`, "USER_NOT_FOUND", 400);
        }
        recipientId = targetUser._id.toString();
      }
    }

    const notif = await Notification.create({
      recipient: recipientId,
      sender: req.user.username || "admin",
      title,
      message,
      type: type || "announcement",
      priority: priority || "medium"
    });

    // Emit real-time notification broadcast
    notificationEmitter.emit("new_alert", notif);

    return sendSuccess(res, "Notification successfully created and queued", notif.toObject(), 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get notifications relevant to the active user session
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const userIdStr = req.user._id.toString();
    const query = {
      $or: [
        { recipient: "all" },
        { recipient: userIdStr }
      ]
    };

    if (req.user.role === "admin") {
      query.$or.push({ recipient: "admin" });
    }

    const list = await Notification.find(query).sort({ createdAt: -1 }).limit(100);

    const mapped = list.map((item) => {
      const obj = item.toObject();
      if (obj.recipient === "all" || obj.recipient === "admin") {
        obj.read = obj.readBy?.some((id) => id.toString() === userIdStr) || false;
      }
      delete obj.readBy;
      return obj;
    });

    return sendSuccess(res, "Notifications fetched successfully", mapped);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationRead = async (req, res, next) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) {
      return sendError(res, "Notification not found", "NOTIFICATION_NOT_FOUND", 404);
    }

    const userIdStr = req.user._id.toString();

    if (notif.recipient === "all" || notif.recipient === "admin") {
      if (notif.recipient === "admin" && req.user.role !== "admin") {
        return sendError(res, "Access denied", "FORBIDDEN", 403);
      }
      notif.readBy = notif.readBy || [];
      if (!notif.readBy.some((id) => id.toString() === userIdStr)) {
        notif.readBy.push(req.user._id);
        await notif.save();
      }
    } else if (notif.recipient === userIdStr) {
      notif.read = true;
      await notif.save();
    } else {
      return sendError(res, "Access denied", "FORBIDDEN", 403);
    }

    return sendSuccess(res, "Notification marked as read");
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private (Admin only)
const deleteNotification = async (req, res, next) => {
  try {
    const deleted = await Notification.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return sendError(res, "Notification not found", "NOTIFICATION_NOT_FOUND", 404);
    }
    return sendSuccess(res, "Notification deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNotification,
  getNotifications,
  markNotificationRead,
  deleteNotification
};
