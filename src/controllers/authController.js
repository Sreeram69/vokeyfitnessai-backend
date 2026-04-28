const User = require("../models/User");
const Session = require("../models/Session");
const OTPVerification = require("../models/OTPVerification");
const Notification = require("../models/Notification");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const tokenBlacklist = require("../utils/tokenBlacklist");
const emailQueue = require("../utils/emailQueue");
const { sendSuccess, sendError } = require("../utils/apiResponse");

// Generate short-lived JWT Access Token (15 minutes)
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
