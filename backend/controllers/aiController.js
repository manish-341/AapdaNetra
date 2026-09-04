const { chatWithAssistant, chatWithCopilot, generateIncidentSummary } = require("../services/aiService");
const { calculateUnifiedRisk, generateRiskExplanation } = require("../services/riskEngine");

// AI Emergency Assistant (citizen)
// AI Emergency Assistant (citizen)
const chatAssistant = async (req, res) => {
    try {
        const { latitude, longitude, language, district } = req.body;
        const messageText = req.body.message || req.body.query;
        const result = await chatWithAssistant(messageText, latitude, longitude, language, district);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// AI Emergency Copilot (responder)
const chatCopilot = async (req, res) => {
    try {
        const { latitude, longitude, language, district } = req.body;
        const messageText = req.body.message || req.body.query;
        const result = await chatWithCopilot(messageText, latitude, longitude, language, district);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Explainable AI - risk explanation
const explainRisk = async (req, res) => {
    try {
        const { latitude, longitude, hazardType } = req.body;
        if (!latitude || !longitude) {
            return res.status(400).json({ success: false, message: "Latitude and longitude required" });
        }

        const risk = await calculateUnifiedRisk(latitude, longitude, hazardType);
        const mode = req.user?.role === "CITIZEN" ? "citizen" : "responder";

        const explanations = {};
        for (const [type, assessment] of Object.entries(risk.assessments)) {
            explanations[type] = generateRiskExplanation(assessment, mode);
        }

        res.status(200).json({
            success: true,
            data: {
                location: risk.location,
                weather: risk.weather,
                overallRisk: risk.overallRisk,
                explanations,
                dataQuality: risk.dataQuality,
                timestamp: risk.timestamp
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Incident summary
const summarizeIncidents = async (req, res) => {
    try {
        const hours = parseInt(req.query.hours) || 2;
        const summary = await generateIncidentSummary(hours);
        res.status(200).json({ success: true, data: summary });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Unified risk assessment
const getRiskAssessment = async (req, res) => {
    try {
        const { latitude, longitude } = req.query;
        if (!latitude || !longitude) {
            return res.status(400).json({ success: false, message: "Latitude and longitude required" });
        }
        const risk = await calculateUnifiedRisk(parseFloat(latitude), parseFloat(longitude));
        res.status(200).json({ success: true, data: risk });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { chatAssistant, chatCopilot, explainRisk, summarizeIncidents, getRiskAssessment };
