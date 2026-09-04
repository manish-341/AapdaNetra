const Habitation = require("../models/Habitation");

// Create Habitation
const createHabitation = async (req, res) => {
    try {
        const habitation = await Habitation.create(req.body);

        res.status(201).json({
            success: true,
            message: "Habitation created successfully",
            data: habitation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get All Habitations
const getHabitations = async (req, res) => {
    try {
        const habitations = await Habitation.find();

        res.status(200).json({
            success: true,
            count: habitations.length,
            data: habitations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Habitation
const getHabitationById = async (req, res) => {
    try {
        const habitation = await Habitation.findById(req.params.id);

        if (!habitation) {
            return res.status(404).json({
                success: false,
                message: "Habitation not found"
            });
        }

        res.status(200).json({
            success: true,
            data: habitation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update Habitation
const updateHabitation = async (req, res) => {
    try {
        const habitation = await Habitation.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!habitation) {
            return res.status(404).json({
                success: false,
                message: "Habitation not found"
            });
        }

        res.status(200).json({
            success: true,
            data: habitation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete Habitation
const deleteHabitation = async (req, res) => {
    try {
        const habitation = await Habitation.findByIdAndDelete(req.params.id);

        if (!habitation) {
            return res.status(404).json({
                success: false,
                message: "Habitation not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Habitation deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createHabitation,
    getHabitations,
    getHabitationById,
    updateHabitation,
    deleteHabitation
};