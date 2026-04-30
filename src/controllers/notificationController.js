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
