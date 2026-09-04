const axios = require("axios");
const { runSimulation } = require("../services/simulationService");
const { getEvacuationRecommendation, getAllEvacuationRoutes } = require("../services/evacuationService");
const { recommendShelters } = require("../services/shelterRecommender");
const { getCurrentWeather, getWeatherForecast } = require("../services/weatherService");
const Alert = require("../models/Alert");
const Shelter = require("../models/Shelter");
const Habitation = require("../models/Habitation");
const HazardZone = require("../models/HazardZone");
const CitizenReport = require("../models/CitizenReport");
const RiskAssessment = require("../models/RiskAssessment");
const Relocation = require("../models/Relocation");

// Simulation
const simulate = async (req, res) => {
    try {
        const { scenario, adjustmentPercent, latitude, longitude } = req.body;
        const result = await runSimulation(scenario, adjustmentPercent, latitude, longitude);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Evacuation recommendation
const getEvacuation = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        if (!latitude || !longitude) {
            return res.status(400).json({ success: false, message: "Latitude and longitude required" });
        }
        const result = await getEvacuationRecommendation(parseFloat(latitude), parseFloat(longitude));
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Smart shelter recommendation
const getShelterRecommendation = async (req, res) => {
    try {
        const { latitude, longitude } = req.query;
        if (!latitude || !longitude) {
            return res.status(400).json({ success: false, message: "Latitude and longitude required" });
        }
        const result = await recommendShelters(parseFloat(latitude), parseFloat(longitude));
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Weather data
const getWeather = async (req, res) => {
    try {
        const { latitude, longitude } = req.query;
        const lat = parseFloat(latitude) || 28.6139;
        const lon = parseFloat(longitude) || 77.209;
        const weather = await getCurrentWeather(lat, lon);
        res.status(200).json({ success: true, data: weather });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Weather and AI temporal risk forecast
const getForecast = async (req, res) => {
    try {
        const { latitude, longitude, indicator } = req.query;
        const lat = parseFloat(latitude) || 28.6139;
        const lon = parseFloat(longitude) || 77.209;
        const ind = (indicator || "FLOOD_RISK").toUpperCase();

        const weather = await getCurrentWeather(lat, lon);
        let baseVal = 72;
        if (ind === "RAINFALL") baseVal = weather.rainfall || 22.5;
        else if (ind === "TEMPERATURE") baseVal = weather.temperature || 31.5;
        else if (ind === "FLOOD_RISK") baseVal = Math.min(Math.max(Math.round((weather.rainfall * 2.2) + 38), 25), 92);
        else if (ind === "FIRE_RISK") baseVal = Math.min(Math.max(Math.round((weather.temperature * 1.6) + (35 - weather.humidity)), 15), 88);

        const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
        let aiForecast = null;
        try {
            const aiRes = await axios.post(`${AI_SERVICE_URL}/forecast`, {
                indicator: ind,
                current_value: baseVal,
                horizon_hours: [0, 2, 6, 12, 24]
            }, { timeout: 5000 });
            aiForecast = aiRes.data;
        } catch (aiErr) {
            console.warn("AI service forecast fallback:", aiErr.message);
        }

        const weatherForecast = await getWeatherForecast(lat, lon);

        res.status(200).json({
            success: true,
            data: {
                location: { lat, lon },
                indicator: ind,
                currentValue: baseVal,
                forecasts: aiForecast?.forecasts || [],
                modelVersion: aiForecast?.modelVersion || "gru-temporal-v2.1",
                provenance: "AI PREDICTION — Probabilistic Temporal Forecast",
                weatherForecast: weatherForecast?.forecasts || [],
                disclaimer: "Projections for +2h, +6h, +12h, and +24h are probabilistic AI predictions, not government declarations."
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Dashboard stats
const getDashboardStats = async (req, res) => {
    try {
        const [
            alertCount,
            criticalAlerts,
            shelterCount,
            availableShelters,
            habitationCount,
            highRiskHabitations,
            reportCount,
            verifiedReports,
            relocationCount,
            activeRelocations,
            hazardCount,
            criticalHazards
        ] = await Promise.all([
            Alert.countDocuments({ isActive: true }),
            Alert.countDocuments({ isActive: true, severity: "CRITICAL" }),
            Shelter.countDocuments(),
            Shelter.countDocuments({ status: "AVAILABLE" }),
            Habitation.countDocuments(),
            Habitation.countDocuments({ riskCategory: { $in: ["RED", "CRITICAL"] } }),
            CitizenReport.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
            CitizenReport.countDocuments({ status: "VERIFIED", createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
            Relocation.countDocuments(),
            Relocation.countDocuments({ status: "IN_PROGRESS" }),
            HazardZone.countDocuments(),
            HazardZone.countDocuments({ riskCategory: { $in: ["RED", "CRITICAL"] } })
        ]);

        const totalShelterCapacity = await Shelter.aggregate([
            { $group: { _id: null, total: { $sum: "$capacity" }, occupied: { $sum: "$currentOccupancy" } } }
        ]).catch(() => [{ total: 0, occupied: 0 }]);

        const populationAtRisk = await Habitation.aggregate([
            { $match: { currentRiskScore: { $gte: 60 } } },
            { $group: { _id: null, total: { $sum: "$population" } } }
        ]).catch(() => [{ total: 0 }]);

        const recentAlerts = await Alert.find({ isActive: true })
            .sort({ createdAt: -1 }).limit(5).lean();

        const recentReports = await CitizenReport.find()
            .sort({ createdAt: -1 }).limit(5)
            .populate("reporter", "name").lean();

        // Risk distribution
        const riskDistribution = await Habitation.aggregate([
            { $group: { _id: "$riskCategory", count: { $sum: 1 } } }
        ]).catch(() => []);

        // Disaster type distribution
        const disasterDistribution = await HazardZone.aggregate([
            { $group: { _id: "$hazardType", count: { $sum: 1 } } }
        ]).catch(() => []);

        res.status(200).json({
            success: true,
            data: {
                alerts: { total: alertCount, critical: criticalAlerts },
                shelters: {
                    total: shelterCount,
                    available: availableShelters,
                    totalCapacity: totalShelterCapacity[0]?.total || 0,
                    occupied: totalShelterCapacity[0]?.occupied || 0
                },
                habitations: { total: habitationCount, highRisk: highRiskHabitations },
                reports: { last24h: reportCount, verified: verifiedReports },
                relocations: { total: relocationCount, active: activeRelocations },
                hazards: { total: hazardCount, critical: criticalHazards },
                populationAtRisk: populationAtRisk[0]?.total || 0,
                riskDistribution: riskDistribution.reduce((acc, r) => { acc[r._id || "UNKNOWN"] = r.count; return acc; }, {}),
                disasterDistribution: disasterDistribution.reduce((acc, d) => { acc[d._id || "UNKNOWN"] = d.count; return acc; }, {}),
                recentAlerts,
                recentReports,
                lastUpdated: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all turn-by-turn evacuation road corridors
const getEvacuationCorridors = async (req, res) => {
    try {
        const routes = await getAllEvacuationRoutes();
        res.status(200).json({ success: true, count: routes.length, data: routes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Set active district and ensure disaster infrastructure is provisioned
const changeDistrict = async (req, res) => {
    try {
        const { district, state } = req.body;
        if (!district) {
            return res.status(400).json({ success: false, message: "District name is required" });
        }

        const { resolveDistrictCoordinates, ensureDistrictProvisioned } = require("../services/districtProvisioner");
        const coords = await resolveDistrictCoordinates(district, state);
        await ensureDistrictProvisioned(district, state);

        res.status(200).json({
            success: true,
            data: {
                district: coords.name,
                state: coords.state,
                latitude: coords.lat,
                longitude: coords.lng
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    simulate,
    getEvacuation,
    getShelterRecommendation,
    getWeather,
    getForecast,
    getDashboardStats,
    getEvacuationCorridors,
    changeDistrict
};
