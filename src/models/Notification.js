const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: String, // "all" for global broadcast, "admin" for system alerts, or userId string for targeted user alert
      default: "all",
      index: true
    },
    sender: {
      type: String,
      default: "system"
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["workout", "nutrition", "system", "announcement", "alert", "auth"],
      default: "announcement"
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    read: {
      type: Boolean,
      default: false
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ]
  },
  {
    timestamps: true
  }
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
