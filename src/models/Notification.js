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
