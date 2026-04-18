const jwt = require("jsonwebtoken");
const User = require("../models/User");
const tokenBlacklist = require("../utils/tokenBlacklist");
const { sendError } = require("../utils/apiResponse");

const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } 
