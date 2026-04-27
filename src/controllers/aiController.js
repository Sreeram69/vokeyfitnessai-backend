const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
const AIHistory = require("../models/AIHistory");
const { sendSuccess, sendError } = require("../utils/apiResponse");

// @desc    Analyze food nutritional profile
// @route   POST /api/ai/analyze-food
// @access  Protected/Private
const analyzeFood = async (req, res, next) => {
  try {
    const { foodQuery } = req.body;
    let nutritionData = null;
    let fallbackUsed = false;

