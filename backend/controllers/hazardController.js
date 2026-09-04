const HazardZone = require("../models/HazardZone");

// Create Hazard Zone
const createHazardZone = async (req, res) => {
    try {
        const hazard = await HazardZone.create(req.body);

        res.status(201).json({
            success: true,
            message: "Hazard zone created successfully",
            data: hazard
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get All Hazard Zones
const getHazardZones = async (req, res) => {
    try {
        const hazards = await HazardZone.find();

        res.status(200).json({
            success: true,
            count: hazards.length,
            data: hazards
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Hazard Zone
const getHazardZoneById = async (req, res) => {
    try {
        const hazard = await HazardZone.findById(req.params.id);

        if (!hazard) {
            return res.status(404).json({
                success: false,
                message: "Hazard zone not found"
            });
        }

        res.status(200).json({
            success: true,
            data: hazard
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update Hazard Zone
const updateHazardZone = async (req, res) => {
    try {
        const hazard = await HazardZone.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!hazard) {
            return res.status(404).json({
                success: false,
                message: "Hazard zone not found"
            });
        }

        res.status(200).json({
            success: true,
            data: hazard
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete Hazard Zone
const deleteHazardZone = async (req, res) => {
    try {
        const hazard = await HazardZone.findByIdAndDelete(req.params.id);

        if (!hazard) {
            return res.status(404).json({
                success: false,
                message: "Hazard zone not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Hazard zone deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createHazardZone,
    getHazardZones,
    getHazardZoneById,
    updateHazardZone,
    deleteHazardZone
};