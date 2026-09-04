const RiskAssessment = require("../models/RiskAssessment");

// Create Risk Assessment
const createRiskAssessment = async (req, res) => {
    try {
        const risk = await RiskAssessment.create(req.body);

        res.status(201).json({
            success: true,
            message: "Risk assessment created successfully",
            data: risk
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get All Risk Assessments
const getRiskAssessments = async (req, res) => {
    try {
        const risks = await RiskAssessment.find()
            .populate("habitation")
            .populate("hazardZone");

        res.status(200).json({
            success: true,
            count: risks.length,
            data: risks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Risk Assessment
const getRiskAssessmentById = async (req, res) => {
    try {
        const risk = await RiskAssessment.findById(req.params.id)
            .populate("habitation")
            .populate("hazardZone");

        if (!risk) {
            return res.status(404).json({
                success: false,
                message: "Risk assessment not found"
            });
        }

        res.status(200).json({
            success: true,
            data: risk
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update Risk Assessment
const updateRiskAssessment = async (req, res) => {
    try {
        const risk = await RiskAssessment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!risk) {
            return res.status(404).json({
                success: false,
                message: "Risk assessment not found"
            });
        }

        res.status(200).json({
            success: true,
            data: risk
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createRiskAssessment,
    getRiskAssessments,
    getRiskAssessmentById,
    updateRiskAssessment
};