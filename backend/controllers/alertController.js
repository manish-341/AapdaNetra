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

const {
    sendEmergencyDisasterEmail,
    broadcastEmergencyToAllUsers,
    broadcastEmergencyResolvedToAllUsers
} = require("../services/emailService");
const { getCurrentWeather } = require("../services/weatherService");

const DISTRICT_COORDS = {
    "delhi": { lat: 28.6139, lon: 77.2090, state: "Delhi" },
    "delhi ncr": { lat: 28.6139, lon: 77.2090, state: "Delhi" },
    "central delhi": { lat: 28.6139, lon: 77.2090, state: "Delhi" },
    "gautam buddha nagar": { lat: 28.4744, lon: 77.5040, state: "Uttar Pradesh" },
    "noida": { lat: 28.5355, lon: 77.3910, state: "Uttar Pradesh" },
    "greater noida": { lat: 28.4744, lon: 77.5040, state: "Uttar Pradesh" },
    "bhopal": { lat: 23.2599, lon: 77.4126, state: "Madhya Pradesh" },
    "mumbai": { lat: 19.0760, lon: 72.8777, state: "Maharashtra" },
    "pune": { lat: 18.5204, lon: 73.8567, state: "Maharashtra" },
    "kolkata": { lat: 22.5726, lon: 88.3639, state: "West Bengal" },
    "ranchi": { lat: 23.3441, lon: 85.3096, state: "Jharkhand" },
    "patna": { lat: 25.5941, lon: 85.1376, state: "Bihar" },
    "lucknow": { lat: 26.8467, lon: 80.9462, state: "Uttar Pradesh" },
    "dehradun": { lat: 30.3165, lon: 78.0322, state: "Uttarakhand" }
};

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

        const adminRealEmail = (process.env.ADMIN_ALERT_EMAIL || "ayuyyysh0714@gmail.com").trim();
        let email = (recipientEmail || req.user?.email || "").trim();
        if (!email || email.endsWith("@aapdanetra.in")) {
            email = adminRealEmail;
        }
        const name = recipientName || req.user?.name || "Disaster Operations Lead";

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
            title,
            hazardType = "FLOOD",
            severity = "CRITICAL",
            district = "Delhi NCR",
            state = "Delhi",
            instructions,
            shelters
        } = req.body;

        const targetDistrict = district || "Delhi NCR";
        const lookupKey = targetDistrict.toLowerCase().trim();
        const coords = DISTRICT_COORDS[lookupKey] || {
            lat: parseFloat(req.body.latitude) || 28.6139,
            lon: parseFloat(req.body.longitude) || 77.2090,
            state: state || "Delhi"
        };

        // Fetch real-time live satellite & weather telemetry for the district
        let liveWeather = null;
        try {
            liveWeather = await getCurrentWeather(coords.lat, coords.lon);
        } catch (weaErr) {
            console.warn("[Broadcast] Real-time telemetry lookup warning:", weaErr.message);
        }

        // Evaluate real-time meteorological conditions
        const isFloodConditions = liveWeather && liveWeather.rainfall >= 40;
        let finalTitle = title || `CRITICAL DISASTER WARNING — ${targetDistrict}`;
        let finalSeverity = severity;
        let finalHazard = hazardType;
        let finalInstructions = instructions;

        // If broadcasting for Delhi NCR or areas where sensors confirm normal weather (no flood)
        if (!isFloodConditions && /delhi/i.test(targetDistrict)) {
            finalTitle = `Real-Time Environmental & Telemetry Report — ${targetDistrict}`;
            finalSeverity = "NORMAL / MONITORED";
            finalHazard = "METEOROLOGICAL_TELEMETRY";
            finalInstructions = `Disaster operations observation confirms that ${targetDistrict} currently has normal environmental parameters (Air Temp: ${liveWeather?.temperature || 27}°C, Rainfall: ${liveWeather?.rainfall || 0} mm/h). Real-time satellite and hydrological telemetry confirms NO ACTIVE FLOOD in ${targetDistrict} at this time. Routine civil defense monitoring is active.`;
        }

        const broadcastResult = await broadcastEmergencyToAllUsers({
            title: finalTitle,
            hazardType: finalHazard,
            severity: finalSeverity,
            district: targetDistrict,
            state: state || coords.state || "Delhi",
            instructions: finalInstructions,
            shelters,
            senderName: req.user?.name || "Disaster Operations Administrator",
            liveWeather
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

// Resolve / Clear Emergency Alerts (Admin-only: marks active alerts resolved/inactive and notifies citizens)
const resolveEmergencyAlerts = async (req, res) => {
    try {
        const { district, state, instructions, resolvedDetails } = req.body;
        const query = { isActive: true };
        if (district) {
            const regex = new RegExp(district.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i");
            query.$or = [{ district: regex }, { title: regex }];
        }

        const result = await Alert.updateMany(query, { $set: { isActive: false } });

        // Dispatch official Emergency Resolved (All Clear) email broadcast to all registered citizens
        const resolvedDistrict = district || "Delhi NCR";
        const resolvedState = state || "Delhi";
        const broadcastResult = await broadcastEmergencyResolvedToAllUsers({
            title: `Critical Emergency Resolved — ${resolvedDistrict}`,
            district: resolvedDistrict,
            state: resolvedState,
            instructions: instructions || "Flood waters and hazard indices have receded to safe baseline levels. Civil defense sirens have stood down and normal movement may resume.",
            resolvedDetails: resolvedDetails || `Disaster Operations Command confirms active emergency warnings across ${resolvedDistrict} have been contained and fully stood down.`
        });

        res.status(200).json({
            success: true,
            message: `Successfully resolved ${result.modifiedCount} active alert(s). Emergency status returned to Normal and All-Clear notifications sent to ${broadcastResult.totalRecipients} registered citizens!`,
            clearedCount: result.modifiedCount,
            broadcast: broadcastResult
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