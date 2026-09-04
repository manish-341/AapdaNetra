const CrowdObservation = require("../models/CrowdObservation");

// Create Crowd Observation
const createCrowdObservation = async (req, res) => {
    try {
        const crowd = await CrowdObservation.create(req.body);

        res.status(201).json({
            success: true,
            message: "Crowd observation created successfully",
            data: crowd
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Crowd Observations
const getCrowdObservations = async (req, res) => {
    try {
        const crowd = await CrowdObservation.find()
            .sort({ observedAt: -1 });

        res.status(200).json({
            success: true,
            count: crowd.length,
            data: crowd
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Single Observation
const getCrowdObservationById = async (req, res) => {
    try {
        const crowd = await CrowdObservation.findById(req.params.id);

        if (!crowd) {
            return res.status(404).json({
                success: false,
                message: "Crowd observation not found"
            });
        }

        res.status(200).json({
            success: true,
            data: crowd
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createCrowdObservation,
    getCrowdObservations,
    getCrowdObservationById
};