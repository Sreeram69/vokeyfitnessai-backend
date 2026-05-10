const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { sendSuccess } = require("../../utils/apiResponse");

router.get("/", (req, res) => {
  const dbState = mongoose.connection.readyState;
  
  // Connection states map: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbStates = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
