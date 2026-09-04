const express = require("express");
const { chatAssistant, chatCopilot, explainRisk, summarizeIncidents, getRiskAssessment } = require("../controllers/aiController");
const { protect, optionalProtect, authorize } = require("../middleware/authMiddleware");
const { validateAIChat, promptInjectionGuard } = require("../middleware/validators");
const { aiLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// AI Assistant (citizen-facing)
router.post("/chat", protect, aiLimiter, promptInjectionGuard(), validateAIChat, chatAssistant);

// AI Copilot (responder & operational decision support)
router.post("/copilot", protect, authorize("ADMIN", "DISTRICT_OFFICER", "FIELD_OFFICER", "RESPONDER", "CITIZEN"), aiLimiter, promptInjectionGuard(["message", "query"]), chatCopilot);

// Explainable AI
router.post("/explain", optionalProtect, explainRisk);

// Risk assessment
router.get("/risk", optionalProtect, getRiskAssessment);

// Incident summary
router.get("/summary", protect, authorize("ADMIN", "DISTRICT_OFFICER", "FIELD_OFFICER", "RESPONDER"), summarizeIncidents);

module.exports = router;
