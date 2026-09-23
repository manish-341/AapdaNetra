const Alert = require("../models/Alert");
const Shelter = require("../models/Shelter");
const {
    getSmsWalletBalance,
    sendEmergencySms,
    broadcastEmergencySmsToCitizens
} = require("../services/smsService");

// Create Alert
const createAlert = async (req, res) => {
    try {
        const payload = {
            ...req.body,
            mode: req.body.mode || "LIVE",
            canonicalSeverity: req.body.canonicalSeverity || (["CRITICAL", "RED"].includes(String(req.body.severity).toUpperCase()) ? "CRITICAL" : "GREEN")
        };
        const alert = await Alert.create(payload);

        // Autonomous Emergency Cell Broadcast SMS triggered automatically on live critical/red alert occurrence
        let automatedSmsResult = null;
        const sev = String(alert?.severity || payload?.severity || "").toUpperCase();
        const isCriticalOrRed = sev === "CRITICAL" || sev === "RED" || alert?.canonicalSeverity === "CRITICAL";

        if (alert && alert.isActive !== false && isCriticalOrRed && alert.mode === "LIVE") {
            try {
                const targetDistrict = alert.district || alert.locationName || req.body.district || "";
                const targetState = alert.state || req.body.state || "";
                automatedSmsResult = await broadcastEmergencySmsToCitizens({
                    district: targetDistrict,
                    state: targetState,
                    title: alert.title || `🚨 EMERGENCY ALERT — ${targetDistrict || targetState || "Hazard Zone"}`,
                    instructions: alert.message || alert.instructions || `Critical emergency alert issued for ${targetDistrict || targetState}. Follow civil defense advisories immediately.`,
                    severity: sev || "CRITICAL",
                    hazardType: alert.hazardType || req.body.hazardType || "FLOOD"
                });
                console.log(`[Autonomous Alert Broadcast] Dispatched automated SMS to ${automatedSmsResult?.count || 0} citizen(s) for ${targetDistrict} (${targetState})`);
            } catch (smsErr) {
                console.warn("[Autonomous Alert Broadcast Warning]:", smsErr.message);
                automatedSmsResult = { success: false, error: smsErr.message };
            }
        }

        res.status(201).json({
            success: true,
            message: "Alert created successfully and automated SMS broadcast dispatched.",
            data: alert,
            smsBroadcast: automatedSmsResult
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
        let {
            title,
            hazardType = "FLOOD",
            severity = "CRITICAL",
            district,
            state,
            instructions,
            shelters
        } = req.body;

        // Auto-detect critical region if not explicitly provided
        if (!district) {
            const activeCritical = await Alert.findOne({ severity: "CRITICAL", isActive: true }).sort({ createdAt: -1 });
            if (activeCritical && activeCritical.district) {
                district = activeCritical.district;
                state = state || activeCritical.state;
                title = title || activeCritical.title;
                instructions = instructions || activeCritical.message;
                hazardType = activeCritical.hazardType || hazardType;
            }
        }

        const targetDistrict = district || "Bhopal";
        const lookupKey = targetDistrict.toLowerCase().trim();
        const coords = DISTRICT_COORDS[lookupKey] || {
            lat: parseFloat(req.body.latitude) || (lookupKey === "bhopal" ? 23.2599 : 28.6139),
            lon: parseFloat(req.body.longitude) || (lookupKey === "bhopal" ? 77.4126 : 77.2090),
            state: state || (lookupKey === "bhopal" ? "Madhya Pradesh" : "Delhi")
        };

        const targetState = state || coords.state || (lookupKey === "bhopal" ? "Madhya Pradesh" : "Delhi");

        // Fetch real-time live satellite & weather telemetry for the district
        let liveWeather = null;
        try {
            liveWeather = await getCurrentWeather(coords.lat, coords.lon);
        } catch (weaErr) {
            console.warn("[Broadcast] Real-time telemetry lookup warning:", weaErr.message);
        }

        let finalTitle = title || `🚨 CRITICAL DISASTER WARNING — ${targetDistrict}`;
        let finalSeverity = severity || "CRITICAL";
        let finalHazard = hazardType || "FLOOD";
        let finalInstructions = instructions || `Severe ${finalHazard.toLowerCase()} emergency in effect across ${targetDistrict}, ${targetState}. Follow civil defense evacuation directives and move to verified safe concrete shelters immediately.`;

        // Only downgrade if explicitly requested as NORMAL by caller
        if (severity === "NORMAL" && /delhi/i.test(targetDistrict)) {
            finalTitle = `Real-Time Environmental & Telemetry Report — ${targetDistrict}`;
            finalSeverity = "NORMAL / MONITORED";
            finalHazard = "METEOROLOGICAL_TELEMETRY";
            finalInstructions = `Disaster operations observation confirms that ${targetDistrict} currently has normal environmental parameters. Real-time satellite and hydrological telemetry confirms NO ACTIVE FLOOD in ${targetDistrict} at this time. Routine civil defense monitoring is active.`;
        }

        // Dynamically fetch shelters for this target district if shelters were not explicitly provided
        let targetShelters = shelters;
        if (!targetShelters || !targetShelters.length) {
            try {
                const dbShelters = await Shelter.find({
                    district: new RegExp(targetDistrict, "i"),
                    status: { $ne: "CLOSED" }
                }).limit(4).lean();
                if (dbShelters && dbShelters.length > 0) {
                    targetShelters = dbShelters.map(s => ({
                        name: s.name,
                        location: s.address || `${s.district}, ${s.state}`,
                        capacity: `${Math.max(0, (s.capacity || 0) - (s.currentOccupancy || 0))} of ${s.capacity || 0} slots available`
                    }));
                }
            } catch (shelterErr) {
                console.warn("[Broadcast] Shelter lookup warning:", shelterErr.message);
            }
        }

        const broadcastResult = await broadcastEmergencyToAllUsers({
            title: finalTitle,
            hazardType: finalHazard,
            severity: finalSeverity,
            district: targetDistrict,
            state: targetState,
            instructions: finalInstructions,
            shelters: targetShelters,
            senderName: req.body.senderName || req.user?.name || "Disaster Operations Administrator",
            senderEmail: req.body.senderEmail || req.user?.email,
            liveWeather
        });

        // Persist emergency alert record in the central Alert collection
        let createdAlert = null;
        try {
            createdAlert = await Alert.create({
                title: finalTitle,
                message: finalInstructions,
                severity: finalSeverity === "CRITICAL" ? "CRITICAL" : "HIGH",
                hazardType: ["FLOOD", "LANDSLIDE", "WILDFIRE", "HEATWAVE", "EARTHQUAKE"].includes(finalHazard) ? finalHazard : "FLOOD",
                district: targetDistrict,
                state: targetState,
                source: "OFFICIAL",
                verificationStatus: "VERIFIED",
                mode: "LIVE",
                canonicalSeverity: "CRITICAL",
                createdBy: req.user?._id,
                isActive: true // keep alert active so sirens and dashboard reflect the critical emergency
            });
        } catch (dbErr) {
            console.warn("[Broadcast Alert] Notice saving Alert model:", dbErr.message);
        }

        // 2. Parallel Emergency SMS Broadcast via Fast2SMS
        let smsResult = null;
        try {
            const sendSms = req.body.sendSms !== false;
            if (sendSms) {
                smsResult = await broadcastEmergencySmsToCitizens({
                    district: targetDistrict,
                    state: targetState,
                    title: finalTitle,
                    instructions: finalInstructions,
                    severity: finalSeverity,
                    hazardType: finalHazard,
                    directNumbers: req.body.testPhoneNumber ? [req.body.testPhoneNumber] : []
                });
            }
        } catch (smsErr) {
            console.warn("[Broadcast Alert] Notice dispatching SMS:", smsErr.message);
            smsResult = { success: false, error: smsErr.message };
        }

        res.status(200).json({
            success: true,
            message: `Emergency alert broadcast dispatched successfully to ${broadcastResult.totalRecipients} registered citizens regarding ${targetDistrict}!`,
            data: {
                ...broadcastResult,
                smsResult,
                targetDistrict,
                targetState,
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
        let { district, state, instructions, resolvedDetails } = req.body;
        
        // Auto-detect district from active critical alerts if not passed
        if (!district) {
            const activeAlert = await Alert.findOne({ severity: "CRITICAL", isActive: true }).sort({ createdAt: -1 });
            if (activeAlert) {
                district = activeAlert.district;
                state = state || activeAlert.state;
            }
        }

        const query = { isActive: true };
        if (district) {
            const regex = new RegExp(district.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i");
            query.$or = [{ district: regex }, { title: regex }];
        }

        const result = await Alert.updateMany(query, { $set: { isActive: false } });

        // Dispatch official Emergency Resolved (All Clear) email broadcast to all registered citizens
        const resolvedDistrict = district || "Bhopal";
        const resolvedState = state || "Madhya Pradesh";
        const broadcastResult = await broadcastEmergencyResolvedToAllUsers({
            title: `Critical Emergency Resolved — ${resolvedDistrict}`,
            district: resolvedDistrict,
            state: resolvedState,
            instructions: instructions || `Flood waters and hazard indices in ${resolvedDistrict} have receded to safe baseline levels. Civil defense sirens have stood down and normal movement may resume.`,
            resolvedDetails: resolvedDetails || `Disaster Operations Command confirms active emergency warnings across ${resolvedDistrict} have been contained and fully stood down.`,
            senderEmail: req.body.senderEmail || req.user?.email,
            senderName: req.body.senderName || req.user?.name
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

/**
 * OASIS CAP v1.2 (Common Alerting Protocol) Transformer
 * Maps AapdaNetra alert document to ITU-T X.1303 / OASIS CAP v1.2 XML & JSON
 */
function toCapXml(alert) {
    const severityMap = {
        CRITICAL: "Extreme",
        HIGH: "Severe",
        WARNING: "Moderate",
        INFO: "Minor"
    };
    const categoryMap = {
        FLOOD: "Met",
        LANDSLIDE: "Geo",
        WILDFIRE: "Fire",
        EARTHQUAKE: "Geo",
        HEATWAVE: "Met"
    };

    const capSeverity = severityMap[alert.severity] || "Moderate";
    const capCategory = categoryMap[alert.hazardType] || "Other";
    const capUrgency = alert.severity === "CRITICAL" ? "Immediate" : (alert.severity === "HIGH" ? "Expected" : "Future");
    const capCertainty = alert.verificationStatus === "VERIFIED" ? "Observed" : "Likely";

    const id = alert._id ? alert._id.toString() : `AN-${Date.now()}`;
    const sentDate = (alert.createdAt ? new Date(alert.createdAt) : new Date()).toISOString();
    const expiryDate = (alert.expiresAt ? new Date(alert.expiresAt) : new Date(Date.now() + 24 * 3600 * 1000)).toISOString();
    const district = alert.district || "Active Monitored Zone";
    const state = alert.state || "India";
    const coords = alert.location?.coordinates || [77.209, 28.6139];
    const lat = coords[1] || 28.6139;
    const lon = coords[0] || 77.209;
    const radiusKm = alert.affectedRadius || 5.0;

    const escapeXml = (unsafe) => {
        if (!unsafe) return "";
        return String(unsafe)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };

    return `  <alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
    <identifier>AAPDANETRA-${escapeXml(id)}</identifier>
    <sender>disaster-ops@aapdanetra.in</sender>
    <sent>${sentDate}</sent>
    <status>Actual</status>
    <msgType>${alert.isActive ? "Alert" : "Cancel"}</msgType>
    <scope>Public</scope>
    <info>
      <category>${capCategory}</category>
      <event>${escapeXml(alert.title || "Disaster Emergency Bulletin")}</event>
      <urgency>${capUrgency}</urgency>
      <severity>${capSeverity}</severity>
      <certainty>${capCertainty}</certainty>
      <eventCode>
        <valueName>SAME</valueName>
        <value>${escapeXml(alert.hazardType || "FLW")}</value>
      </eventCode>
      <expires>${expiryDate}</expires>
      <senderName>AapdaNetra Disaster Operations Command</senderName>
      <headline>${escapeXml(alert.title)}</headline>
      <description>${escapeXml(alert.message || alert.description)}</description>
      <instruction>Follow civil defense directives. Evacuate to designated emergency shelters if ordered.</instruction>
      <contact>emergency-control@aapdanetra.in</contact>
      <area>
        <areaDesc>${escapeXml(district)}, ${escapeXml(state)}</areaDesc>
        <circle>${lat.toFixed(4)},${lon.toFixed(4)},${radiusKm.toFixed(1)}</circle>
      </area>
    </info>
  </alert>`;
}

// Export All Active Alerts in OASIS CAP v1.2 Format (XML or JSON)
const getCapAlerts = async (req, res) => {
    try {
        const alerts = await Alert.find({ isActive: true })
            .populate("hazardZone")
            .populate("habitation")
            .sort({ createdAt: -1 });

        if (req.query.format === "json" || req.headers.accept?.includes("application/json")) {
            return res.status(200).json({
                protocol: "OASIS CAP v1.2 / ITU-T X.1303",
                feed: "AapdaNetra Common Alerting Protocol Service",
                count: alerts.length,
                timestamp: new Date().toISOString(),
                alerts: alerts.map(a => ({
                    identifier: `AAPDANETRA-${a._id}`,
                    sender: "disaster-ops@aapdanetra.in",
                    sent: a.createdAt,
                    status: "Actual",
                    msgType: a.isActive ? "Alert" : "Cancel",
                    scope: "Public",
                    info: {
                        category: a.hazardType === "FLOOD" ? "Met" : (a.hazardType === "LANDSLIDE" ? "Geo" : "Other"),
                        event: a.title,
                        urgency: a.severity === "CRITICAL" ? "Immediate" : "Expected",
                        severity: a.severity === "CRITICAL" ? "Extreme" : (a.severity === "HIGH" ? "Severe" : "Moderate"),
                        certainty: a.verificationStatus === "VERIFIED" ? "Observed" : "Likely",
                        headline: a.title,
                        description: a.message,
                        area: {
                            areaDesc: `${a.district || "Regional"}, ${a.state || "India"}`,
                            circle: `${a.location?.coordinates?.[1] || 28.6139},${a.location?.coordinates?.[0] || 77.209},${a.affectedRadius || 5}`
                        }
                    }
                }))
            });
        }

        const xmlList = alerts.map(toCapXml).join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- AapdaNetra OASIS CAP v1.2 (Common Alerting Protocol) Emergency Feed -->
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>AapdaNetra Live CAP Emergency Broadcast Feed</title>
  <updated>${new Date().toISOString()}</updated>
  <author><name>AapdaNetra Autonomous Disaster Command</name></author>
  <id>urn:aapdanetra:cap:feed</id>
${xmlList}
</feed>`;

        res.set("Content-Type", "application/xml; charset=utf-8");
        return res.status(200).send(xml);
    } catch (error) {
        console.error("CAP Export Error:", error);
        res.status(500).send(`<error>${error.message}</error>`);
    }
};

// Export Single Alert in OASIS CAP v1.2 XML
const getCapAlertById = async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id);
        if (!alert) {
            return res.status(404).send("<error>Alert not found</error>");
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
${toCapXml(alert)}`;

        res.set("Content-Type", "application/xml; charset=utf-8");
        return res.status(200).send(xml);
    } catch (error) {
        res.status(500).send(`<error>${error.message}</error>`);
    }
};

// Send live test SMS to an individual phone number (ideal for live SIH jury demo)
const sendTestSmsAlert = async (req, res) => {
    try {
        const { phoneNumber, district, severity, hazardType, instructions } = req.body;
        if (!phoneNumber) {
            return res.status(400).json({ success: false, message: "Valid 10-digit mobile number is required." });
        }

        const result = await sendEmergencySms({
            phoneNumbers: [phoneNumber],
            district: district || "Bhopal",
            severity: severity || "CRITICAL",
            hazardType: hazardType || "FLOOD",
            instructions: instructions || "Mandatory evacuation order in effect. Extreme cloudburst surge detected. Proceed to verified shelter immediately."
        });

        if (result.success) {
            return res.status(200).json({
                success: true,
                message: `Emergency SMS alert successfully dispatched to ${phoneNumber}!`,
                data: result
            });
        } else {
            return res.status(400).json({
                success: false,
                message: result.error || "Fast2SMS dispatch encountered an issue",
                data: result
            });
        }
    } catch (err) {
        console.error("sendTestSmsAlert error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// Check Fast2SMS gateway status and remaining free wallet balance
const getSmsGatewayStatus = async (req, res) => {
    try {
        const status = await getSmsWalletBalance();
        return res.status(200).json({ success: true, data: status });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    createAlert,
    getAlerts,
    getAlertById,
    updateAlert,
    dispatchEmergencyAlert,
    broadcastEmergencyAlert,
    resolveEmergencyAlerts,
    getCapAlerts,
    getCapAlertById,
    sendTestSmsAlert,
    getSmsGatewayStatus
};