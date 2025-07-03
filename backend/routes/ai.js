// routes/ai.js
const express = require("express");
const router = express.Router();
const { generateContent, startSession, endSession, selfCareHomeContent } = require("../controllers/ai");
const { verifyToken } = require("../middleware/auth");

router.post("/generate", generateContent);
router.post("/session-generate", verifyToken, generateContent);
router.post("/start-session", verifyToken, startSession);
router.post("/end-session", verifyToken, endSession);

// Self-care home daily content
router.get("/self-care-home", selfCareHomeContent);

module.exports = router;