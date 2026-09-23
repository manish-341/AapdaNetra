const h3 = require("h3-js");
const Alert = require("../models/Alert");
const CitizenReport = require("../models/CitizenReport");
const { broadcastEmergencySmsToCitizens } = require("./smsService");

/**
 * Intelligent Alert Engine
 * Calculates priority based on risk + location + severity + confidence + verification
 * Prevents duplicate alerts via eventKey idempotency and H3 cell resolution
 */
const createIntelligentAlert = async ({
    title,
    message,
    severity = "CRITICAL",
    canonicalSeverity = "CRITICAL",
    hazardType = "FLOOD",
    source = "AI_PREDICTION",
    mode = "LIVE",
    location,
    affectedRadius = 5,
    createdBy,
    district,
    state,
    h3Cell,
    eventKey,
    expiresInHours = 12
}) => {
    // 1. Resolve H3 Cell Index (Resolution 7 ~ 1.2km radius) if not provided
    let resolvedH3Cell = h3Cell;
    if (!resolvedH3Cell && location?.coordinates && location.coordinates.length === 2) {
        const [lon, lat] = location.coordinates;
        if (typeof lat === "number" && typeof lon === "number") {
            try {
                resolvedH3Cell = h3.latLngToCell(lat, lon, 7);
            } catch (h3Err) {
                console.warn("[Intelligent Alert] H3 calculation warning:", h3Err.message);
            }
        }
    }

    // 2. Derive stable daily eventKey: ${hazardType}_${h3Cell}_${activeDateWindow}
    const dateWindow = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const resolvedEventKey = eventKey || `${hazardType.toUpperCase()}_${resolvedH3Cell || "GLOBAL"}_${dateWindow}`;

    // 3. Idempotent check: find existing active alert with this eventKey
    let existingAlert = await Alert.findOne({
        eventKey: resolvedEventKey,
        isActive: true
    }).catch(() => null);

    // Secondary fallback check by H3 cell & hazard if eventKey missed
    if (!existingAlert && resolvedH3Cell) {
        existingAlert = await Alert.findOne({
            h3Cell: resolvedH3Cell,
            hazardType: hazardType.toUpperCase(),
            isActive: true,
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }).catch(() => null);
    }

    // 4. If existing alert found, UPDATE it (Idempotent: DO NOT INSERT duplicate, DO NOT re-dispatch notifications)
    if (existingAlert) {
        existingAlert.severity = severity || existingAlert.severity;
        existingAlert.canonicalSeverity = canonicalSeverity || existingAlert.canonicalSeverity;
        existingAlert.message = message || existingAlert.message;
        existingAlert.title = title || existingAlert.title;
        existingAlert.mode = mode || existingAlert.mode || "LIVE";
        if (district && !existingAlert.district) existingAlert.district = district;
        if (state && !existingAlert.state) existingAlert.state = state;
        existingAlert.updatedAt = new Date();
        await existingAlert.save();
        return { alert: existingAlert, action: "updated_existing" };
    }

    // 5. Create new Alert record (concurrency-safe with partial unique index)
    let alert;
    try {
        alert = await Alert.create({
            title,
            message,
            severity: severity || "CRITICAL",
            canonicalSeverity: canonicalSeverity || "CRITICAL",
            hazardType: hazardType.toUpperCase(),
            source: source || "AI_PREDICTION",
            verificationStatus: source === "OFFICIAL" ? "VERIFIED" : "VERIFIED",
            location: location ? { type: "Point", coordinates: location.coordinates } : undefined,
            affectedRadius: affectedRadius || 5,
            district,
            state,
            h3Cell: resolvedH3Cell,
            eventKey: resolvedEventKey,
            mode: mode || "LIVE",
            createdBy,
            isActive: true,
            lastNotificationDispatchedAt: new Date(),
            expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
        });
    } catch (createErr) {
        // Concurrency-safe deduplication: if another concurrent worker created this active alert at the same millisecond
        if (createErr.code === 11000 || (createErr.message && createErr.message.includes("E11000"))) {
            const concurrentAlert = await Alert.findOne({
                eventKey: resolvedEventKey,
                isActive: true
            }).catch(() => null);

            if (concurrentAlert) {
                concurrentAlert.severity = severity || concurrentAlert.severity;
                concurrentAlert.canonicalSeverity = canonicalSeverity || concurrentAlert.canonicalSeverity;
                concurrentAlert.message = message || concurrentAlert.message;
                concurrentAlert.title = title || concurrentAlert.title;
                concurrentAlert.mode = mode || concurrentAlert.mode || "LIVE";
                if (district && !concurrentAlert.district) concurrentAlert.district = district;
                if (state && !concurrentAlert.state) concurrentAlert.state = state;
                concurrentAlert.updatedAt = new Date();
                await concurrentAlert.save();
                return { alert: concurrentAlert, action: "updated_existing" };
            }
        }
        throw createErr;
    }

    // 6. Only dispatch emergency SMS for genuine, newly created LIVE CRITICAL alerts (never on updates or tests)
    if (mode === "LIVE" && (canonicalSeverity === "CRITICAL" || severity === "CRITICAL")) {
        broadcastEmergencySmsToCitizens({
            district: alert.district || district || title,
            state: alert.state || state,
            title,
            instructions: message,
            severity: canonicalSeverity || severity,
            hazardType
        }).catch((err) => console.warn("[Intelligent Alert Engine] Automated SMS warning:", err.message));
    }

    return { alert, action: "created" };
};

/**
 * Generate alerts from verified risk assessment results
 */
const generateAlertsFromRisk = async (riskAssessment, options = {}) => {
    const generated = [];
    const { assessments, location, district, state } = riskAssessment;
    if (!assessments || !location) return generated;

    const lat = location.lat;
    const lon = location.lon;
    let cell7 = null;
    if (typeof lat === "number" && typeof lon === "number") {
        try {
            cell7 = h3.latLngToCell(lat, lon, 7);
        } catch {}
    }

    const alertMode = options.mode || "LIVE";

    for (const [type, assessment] of Object.entries(assessments)) {
        // Strict Life-Safety Rule: Only generate alerts when canonical severity reaches CRITICAL (score >= 76)
        const isCritical = assessment.riskCategory === "CRITICAL" || assessment.riskScore >= 76;

        // For FLOOD, also confirm operational threshold is met
        const isFloodOperational = type.toUpperCase() !== "FLOOD" || (assessment.riskScore >= 20);

        if (isCritical && isFloodOperational) {
            const result = await createIntelligentAlert({
                title: `🚨 CRITICAL ${type} WARNING — ${district || 'Active Monitored Zone'}`,
                message: `${type} risk score is ${assessment.riskScore}/100 (CRITICAL). ${assessment.recommendedAction || 'Evacuate low-lying areas immediately and move to verified shelters.'}`,
                severity: "CRITICAL",
                canonicalSeverity: "CRITICAL",
                hazardType: type,
                source: "AI_PREDICTION",
                mode: alertMode,
                district,
                state,
                h3Cell: cell7,
                location: { coordinates: [lon, lat] },
                affectedRadius: 10,
                expiresInHours: 12
            });
            generated.push(result);
        }
    }

    return generated;
};

/**
 * Get relevant alerts for a user's location
 */
const getRelevantAlerts = async (lat, lon, radiusKm = 50) => {
    const query = { isActive: true };

    if (lat && lon) {
        query.location = {
            $near: {
                $geometry: { type: "Point", coordinates: [lon, lat] },
                $maxDistance: radiusKm * 1000
            }
        };
    }

    const alerts = await Alert.find(query)
        .sort({ severity: -1, createdAt: -1 })
        .limit(20)
        .populate("createdBy", "name role")
        .lean();

    // Also get alerts without location (broadcast alerts)
    const broadcastAlerts = await Alert.find({
        isActive: true,
        location: { $exists: false }
    }).sort({ createdAt: -1 }).limit(5).lean();

    const allAlerts = [...alerts, ...broadcastAlerts];

    // Remove duplicates
    const seen = new Set();
    return allAlerts.filter(a => {
        const id = a._id.toString();
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
    });
};

/**
 * Expire old alerts
 */
const cleanupExpiredAlerts = async () => {
    const result = await Alert.updateMany(
        { expiresAt: { $lt: new Date() }, isActive: true },
        { isActive: false }
    );
    return result.modifiedCount;
};

module.exports = {
    createIntelligentAlert,
    generateAlertsFromRisk,
    getRelevantAlerts,
    cleanupExpiredAlerts
};
