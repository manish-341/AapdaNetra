const Relocation = require("../models/Relocation");

// Create Relocation Plan
const createRelocation = async (req, res) => {
    try {
        const relocation = await Relocation.create(req.body);

        res.status(201).json({
            success: true,
            message: "Relocation plan created successfully",
            data: relocation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get All Relocations
const getRelocations = async (req, res) => {
    try {
        const relocations = await Relocation.find()
            .populate("habitation")
            .populate("destinationShelter")
            .populate("approvedBy", "name email role");

        res.status(200).json({
            success: true,
            count: relocations.length,
            data: relocations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Relocation
const getRelocationById = async (req, res) => {
    try {
        const relocation = await Relocation.findById(req.params.id)
            .populate("habitation")
            .populate("destinationShelter")
            .populate("approvedBy", "name email role");

        if (!relocation) {
            return res.status(404).json({
                success: false,
                message: "Relocation plan not found"
            });
        }

        res.status(200).json({
            success: true,
            data: relocation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update Relocation
const updateRelocation = async (req, res) => {
    try {
        const relocation = await Relocation.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!relocation) {
            return res.status(404).json({
                success: false,
                message: "Relocation plan not found"
            });
        }

        res.status(200).json({
            success: true,
            data: relocation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createRelocation,
    getRelocations,
    getRelocationById,
    updateRelocation
};