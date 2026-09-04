const Alert = require("../models/Alert");

// Create Alert
const createAlert = async (req, res) => {
    try {
        const alert = await Alert.create(req.body);

        res.status(201).json({
            success: true,
            message: "Alert created successfully",
            data: alert
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Active Alerts
const getAlerts = async (req, res) => {
    try {
        const alerts = await Alert.find({
            isActive: true
        })
            .populate("hazardZone")
            .populate("habitation")
            .populate("createdBy", "name role")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: alerts.length,
            data: alerts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Alert
const getAlertById = async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id)
            .populate("hazardZone")
            .populate("habitation")
            .populate("createdBy", "name role");

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: "Alert not found"
            });
        }

        res.status(200).json({
            success: true,
            data: alert
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update Alert
const updateAlert = async (req, res) => {
    try {
        const alert = await Alert.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: "Alert not found"
            });
        }

        res.status(200).json({
            success: true,
            data: alert
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const { sendEmergencyDisasterEmail } = require("../services/emailService");

// Dispatch Critical Situation Email & Notification Alert
const dispatchEmergencyAlert = async (req, res) => {
    try {
        const {
            recipientEmail,
            recipientName,
            title = "Severe Inundation & Flash Flood Alert",
            hazardType = "FLOOD",
            severity = "CRITICAL",
            district = "Delhi NCR",
            state = "Delhi",
            instructions
        } = req.body;

        const email = recipientEmail || req.user?.email || "citizen@aapdanetra.in";
        const name = recipientName || req.user?.name || "Citizen";

        const result = await sendEmergencyDisasterEmail({
            recipientEmail: email,
            recipientName: name,
            title,
            hazardType,
            severity,
            district,
            state,
            instructions: instructions || "Move to designated high-ground concrete shelters immediately. Shut off master breaker and gas connections. Keep Aadhaar and emergency rations ready."
        });

        res.status(200).json({
            success: true,
            message: `Critical emergency alert dispatched to ${email}`,
            data: result
        });
    } catch (error) {
        console.error("dispatchEmergencyAlert error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to dispatch emergency alert"
        });
    }
};

module.exports = {
    createAlert,
    getAlerts,
    getAlertById,
    updateAlert,
    dispatchEmergencyAlert
};