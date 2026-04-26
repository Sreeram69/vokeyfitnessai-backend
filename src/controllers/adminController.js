const User = require("../models/User");
const WorkoutSession = require("../models/WorkoutSession");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const os = require("os");

/**
 * Get system stats and analytics for the admin bento grid & charts
 */
const getAdminStats = async (req, res, next) => {
  try {
    const { range = "all" } = req.query;
    const now = new Date();
    
    let filterQuery = {};
    let userFilterQuery = {};
