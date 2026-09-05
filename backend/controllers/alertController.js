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

const { sendEmergencyDisasterEmail, broadcastEmergencyToAllUsers } = require("../services/emailService");

// Dispatch Critical Situation Email to single recipient / test diagnostic
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

// Broadcast Critical Emergency Alert to ALL registered users (Admin Only)
const broadcastEmergencyAlert = async (req, res) => {
    try {
        const {
            title = "CRITICAL DISASTER EMERGENCY ALERT",
            hazardType = "FLOOD",
            severity = "CRITICAL",
            district = "Delhi NCR",
            state = "Delhi",
            instructions,
            shelters
        } = req.body;

        const broadcastResult = await broadcastEmergencyToAllUsers({
            title,
            hazardType,
            severity,
            district,
            state,
            instructions,
            shelters,
            senderName: req.user?.name || "Disaster Operations Administrator"
        });

        // Persist emergency alert record in the central Alert collection
        let createdAlert = null;
        try {
            createdAlert = await Alert.create({
                title: title || `CRITICAL DISASTER WARNING — ${district}`,
                message: instructions || `Emergency hazard bulletin broadcast across ${district}, ${state}. Evacuate immediately if instructed.`,
                severity: severity === "CRITICAL" ? "CRITICAL" : "HIGH",
                hazardType: ["FLOOD", "LANDSLIDE", "WILDFIRE", "HEATWAVE", "EARTHQUAKE"].includes(hazardType) ? hazardType : "FLOOD",
                district,
                state,
                source: "OFFICIAL",
                verificationStatus: "VERIFIED",
                createdBy: req.user?._id,
                isActive: req.body.isActive === true // Only activate civil defense siren if explicitly requested
            });
        } catch (dbErr) {
            console.warn("[Broadcast Alert] Notice saving Alert model:", dbErr.message);
        }

        res.status(200).json({
            success: true,
            message: `Emergency alert broadcast dispatched successfully to ${broadcastResult.totalRecipients} registered citizens!`,
            data: {
                ...broadcastResult,
                alertRecordId: createdAlert?._id
            }
        });
    } catch (error) {
        console.error("broadcastEmergencyAlert error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to broadcast emergency alerts"
        });
    }
};

// Resolve / Clear Emergency Alerts (Admin-only: marks active alerts resolved/inactive)
const resolveEmergencyAlerts = async (req, res) => {
    try {
        const { district } = req.body;
        const query = { isActive: true };
        if (district) {
            const regex = new RegExp(district.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i");
            query.$or = [{ district: regex }, { title: regex }];
        }

        const result = await Alert.updateMany(query, { $set: { isActive: false } });

        res.status(200).json({
            success: true,
            message: `Successfully resolved and cleared ${result.modifiedCount} active alert(s). Emergency status returned to Normal.`,
            clearedCount: result.modifiedCount
        });
    } catch (error) {
        console.error("resolveEmergencyAlerts error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to resolve emergency alerts"
        });
    }
};

module.exports = {
    createAlert,
    getAlerts,
    getAlertById,
    updateAlert,
    dispatchEmergencyAlert,
    broadcastEmergencyAlert,
    resolveEmergencyAlerts
};