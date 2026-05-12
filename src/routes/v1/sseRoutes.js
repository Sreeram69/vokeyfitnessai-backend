const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/authMiddleware");
const { streamNotifications } = require("../../controllers/sseController");

router.get("/", protect, streamNotifications);

module.exports = router;
