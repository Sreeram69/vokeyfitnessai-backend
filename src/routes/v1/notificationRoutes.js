const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../../middleware/authMiddleware");
const {
  createNotification,
  getNotifications,
  markNotificationRead,
  deleteNotification
} = require("../../controllers/notificationController");

router.route("/")
  .get(protect, getNotifications)
  .post(protect, adminOnly, createNotification);

router.route("/:id/read")
  .put(protect, markNotificationRead);

router.route("/:id")
  .delete(protect, adminOnly, deleteNotification);

module.exports = router;
