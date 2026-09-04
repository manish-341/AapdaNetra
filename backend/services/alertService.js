const Alert = require("../models/Alert");
const CitizenReport = require("../models/CitizenReport");

/**
 * Intelligent Alert Engine
 * Calculates priority based on risk + location + severity + confidence + verification
 * Prevents duplicate alerts
 */
const createIntelligentAlert = async ({ title, message, severity, hazardType, source, location, affectedRadius, createdBy, expiresInHours = 24 }) => {
    // Check for duplicate (same type, same area, last 2 hours)
    if (location?.coordinates) {
        const duplicate = await Alert.findOne({
            hazardType,
            isActive: true,
            createdAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: location.coordinates },
                    $maxDistance: 5000
                }
            }
        }).catch(() => null);

        if (duplicate) {
            // Update existing alert if new severity is higher
            const severityOrder = { INFO: 0, WARNING: 1, HIGH: 2, CRITICAL: 3 };
            if (severityOrder[severity] > severityOrder[duplicate.severity]) {
                duplicate.severity = severity;
                duplicate.message = message;
                duplicate.updatedAt = new Date();
                await duplicate.save();
                return { alert: duplicate, action: "updated_existing" };
            }
            return { alert: duplicate, action: "duplicate_suppressed" };
        }
    }

    const alert = await Alert.create({
        title,
        message,
        severity,
        hazardType,
        source: source || "OFFICIAL",
        verificationStatus: source === "OFFICIAL" ? "VERIFIED" : "UNVERIFIED",
        location: location ? { type: "Point", coordinates: location.coordinates } : undefined,
        affectedRadius: affectedRadius || 5,
        createdBy,
        isActive: true,
        expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
    });

    return { alert, action: "created" };
};

/**
 * Generate alerts from risk assessment results
 */
const generateAlertsFromRisk = async (riskAssessment) => {
    const generated = [];
    const { assessments, location } = riskAssessment;

    for (const [type, assessment] of Object.entries(assessments)) {
        if (assessment.riskScore >= 70) {
            const severity = assessment.riskScore >= 85 ? "CRITICAL" : "HIGH";
            const result = await createIntelligentAlert({
                title: `${type} Risk Alert — ${severity}`,
                message: `${type} risk score: ${assessment.riskScore}/100. ${assessment.recommendedAction}`,
                severity,
                hazardType: type,
                source: "AI_PREDICTION",
                location: { coordinates: [location.lon, location.lat] },
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
