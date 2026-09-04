const Shelter = require("../models/Shelter");

// Create Shelter
const createShelter = async (req, res) => {
    try {
        const shelter = await Shelter.create(req.body);

        res.status(201).json({
            success: true,
            message: "Shelter created successfully",
            data: shelter
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get All Shelters
const getShelters = async (req, res) => {
    try {
        const shelters = await Shelter.find();

        res.status(200).json({
            success: true,
            count: shelters.length,
            data: shelters
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Shelter
const getShelterById = async (req, res) => {
    try {
        const shelter = await Shelter.findById(req.params.id);

        if (!shelter) {
            return res.status(404).json({
                success: false,
                message: "Shelter not found"
            });
        }

        res.status(200).json({
            success: true,
            data: shelter
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update Shelter
const updateShelter = async (req, res) => {
    try {
        const shelter = await Shelter.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!shelter) {
            return res.status(404).json({
                success: false,
                message: "Shelter not found"
            });
        }

        res.status(200).json({
            success: true,
            data: shelter
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createShelter,
    getShelters,
    getShelterById,
    updateShelter
};