const axios = require("axios");
const { getCurrentWeather } = require("./weatherService");
const HazardZone = require("../models/HazardZone");
const CitizenReport = require("../models/CitizenReport");
const Habitation = require("../models/Habitation");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

/**
 * Unified Risk Assessment Engine
 * Combines: ML prediction + weather + historical data + citizen reports + vulnerability
 * Calculates composite risk score (0-100)
 */
const calculateUnifiedRisk = async (lat, lon, hazardType = null) => {
    try {
        // 1. Get weather data
        const weather = await getCurrentWeather(lat, lon);

        // 2. Get ML predictions from Python service
        let mlPredictions = {};
        try {
            const mlResponse = await axios.post(`${AI_SERVICE_URL}/predict/unified`, {
                latitude: lat,
                longitude: lon,
                temperature: weather.temperature,
                humidity: weather.humidity,
                rainfall: weather.rainfall,
                wind_speed: weather.windSpeed,
                pressure: weather.pressure,
                soil_moisture_pct: weather.soilMoisturePct || 50
            }, { timeout: 10000 });
            mlPredictions = mlResponse.data;
        } catch (mlError) {
            console.warn("ML service unavailable, using rule-based fallback:", mlError.message);
            mlPredictions = getRuleBasedPrediction(weather);
        }

        // 3. Get nearby citizen reports (last 24 hours)
        const recentReports = await CitizenReport.countDocuments({
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: [lon, lat] },
                    $maxDistance: 10000 // 10km
                }
            },
            status: { $in: ["SUBMITTED", "UNDER_REVIEW", "VERIFIED"] },
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }).catch(() => 0);

        // 4. Get historical hazard zone data
        const nearbyHazards = await HazardZone.find({
            geometry: {
                $near: {
                    $geometry: { type: "Point", coordinates: [lon, lat] },
                    $maxDistance: 15000
                }
            }
        }).limit(5).catch(() => []);

        // 5. Get vulnerability data from nearby habitations
        const nearbyHabitations = await Habitation.find({
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: [lon, lat] },
                    $maxDistance: 10000
                }
            }
        }).limit(10).catch(() => []);

        const avgVulnerability = nearbyHabitations.length > 0
            ? nearbyHabitations.reduce((sum, h) => sum + (h.vulnerabilityScore || 0), 0) / nearbyHabitations.length
            : 30;

        // 6. Calculate composite risk scores for each disaster type
        const types = hazardType ? [hazardType] : ["FLOOD", "LANDSLIDE", "WILDFIRE"];
        const assessments = {};

        for (const type of types) {
            const mlScore = (mlPredictions[type.toLowerCase()]?.probability || 0) * 100;
            const weatherScore = getWeatherRiskScore(weather, type);
            const historicalScore = getHistoricalScore(nearbyHazards, type);
            const reportBoost = Math.min(recentReports * 5, 20);

            // Weighted composite: ML 40% + Weather 25% + Historical 15% + Vulnerability 10% + Reports 10%
            const composite = Math.round(
                mlScore * 0.40 +
                weatherScore * 0.25 +
                historicalScore * 0.15 +
                avgVulnerability * 0.10 +
                reportBoost * 0.50 // Reports contribute their boost directly
            );

            const finalScore = Math.min(Math.max(composite, 0), 100);

            assessments[type] = {
                disasterType: type,
                riskScore: finalScore,
                riskCategory: getRiskCategory(finalScore),
                confidence: mlPredictions[type.toLowerCase()]?.confidence || 0.6,
                factors: {
                    mlPrediction: { score: Math.round(mlScore), weight: "40%" },
                    weatherConditions: { score: Math.round(weatherScore), weight: "25%", details: getWeatherFactors(weather, type) },
                    historicalData: { score: Math.round(historicalScore), weight: "15%" },
                    vulnerability: { score: Math.round(avgVulnerability), weight: "10%" },
                    citizenReports: { count: recentReports, boost: reportBoost, weight: "10%" }
                },
                affectedPopulation: nearbyHabitations.reduce((sum, h) => sum + (h.population || 0), 0),
                nearbyHabitationsCount: nearbyHabitations.length,
                recommendedAction: getRecommendedAction(finalScore, type)
            };
        }

        // Determine overall highest risk
        const highestRisk = Object.values(assessments).sort((a, b) => b.riskScore - a.riskScore)[0];

        return {
            location: { lat, lon },
            weather: {
                ...weather,
                source: weather.source,
                timestamp: weather.timestamp,
                status: weather.status
            },
            assessments,
            overallRisk: highestRisk,
            timestamp: new Date().toISOString(),
            dataQuality: {
                weatherSource: weather.source,
                weatherStatus: weather.status,
                mlServiceAvailable: !!mlPredictions.flood || !!mlPredictions.FLOOD,
                citizenReportsNearby: recentReports,
                historicalZonesNearby: nearbyHazards.length
            }
        };
    } catch (error) {
        console.error("Risk assessment error:", error.message);
        throw new Error("Risk assessment failed: " + error.message);
    }
};

function getRuleBasedPrediction(weather) {
    const soilFactor = (weather.soilMoisturePct || 50) / 100;
    return {
        flood: {
            probability: Math.min((weather.rainfall / 100) * 0.5 + (weather.humidity / 100) * 0.25 + soilFactor * 0.25, 1),
            confidence: 0.75
        },
        landslide: {
            probability: Math.min((weather.rainfall / 80) * 0.4 + (weather.humidity / 100) * 0.2 + soilFactor * 0.4, 1),
            confidence: 0.70
        },
        wildfire: {
            probability: Math.min((weather.temperature / 50) * 0.4 + ((100 - weather.humidity) / 100) * 0.4 + ((1 - soilFactor) * 0.2), 1),
            confidence: 0.65
        }
    };
}

function getWeatherRiskScore(weather, type) {
    switch (type) {
        case "FLOOD":
            return Math.min(
                (weather.rainfall / 50) * 40 +
                (weather.humidity / 100) * 30 +
                (weather.cloudCover / 100) * 10, 100
            );
        case "LANDSLIDE":
            return Math.min(
                (weather.rainfall / 60) * 50 +
                (weather.humidity / 100) * 25 +
                (weather.windSpeed / 30) * 10, 100
            );
        case "WILDFIRE":
            return Math.min(
                (weather.temperature / 45) * 35 +
                ((100 - weather.humidity) / 100) * 35 +
                (weather.windSpeed / 25) * 20, 100
            );
        default:
            return 20;
    }
}

function getWeatherFactors(weather, type) {
    const factors = [];
    if (type === "FLOOD") {
        if (weather.rainfall > 30) factors.push("Heavy rainfall detected");
        if (weather.humidity > 80) factors.push("High humidity");
        if (weather.rainfall > 50) factors.push("Extreme precipitation");
    } else if (type === "LANDSLIDE") {
        if (weather.rainfall > 25) factors.push("Sustained rainfall");
        if (weather.humidity > 85) factors.push("Soil saturation likely");
    } else if (type === "WILDFIRE") {
        if (weather.temperature > 38) factors.push("Extreme temperature");
        if (weather.humidity < 30) factors.push("Very low humidity");
        if (weather.windSpeed > 15) factors.push("Strong winds");
    }
    return factors;
}

function getHistoricalScore(hazards, type) {
    const relevant = hazards.filter(h => h.hazardType === type);
    if (relevant.length === 0) return 10;
    const maxSeverity = Math.max(...relevant.map(h => h.severity || 30));
    return Math.min(maxSeverity + relevant.length * 5, 100);
}

function getRiskCategory(score) {
    if (score >= 76) return "CRITICAL";
    if (score >= 51) return "RED";
    if (score >= 26) return "AMBER";
    return "GREEN";
}

function getRecommendedAction(score, type) {
    if (score >= 76) {
        const actions = {
            FLOOD: "EVACUATE low-lying areas immediately. Move to higher ground and nearest verified shelter.",
            LANDSLIDE: "EVACUATE hillside and slope areas immediately. Avoid valleys and drainage channels.",
            WILDFIRE: "EVACUATE the area immediately. Follow designated evacuation routes away from fire direction."
        };
        return actions[type] || "Evacuate the area and follow official emergency instructions.";
    }
    if (score >= 51) {
        return "PREPARE for possible evacuation. Monitor official alerts. Pack emergency supplies.";
    }
    if (score >= 26) {
        return "STAY ALERT. Monitor weather conditions and official updates. Review your emergency plan.";
    }
    return "No immediate action required. Stay informed through official channels.";
}

/**
 * Generate explainable risk summary
 */
const generateRiskExplanation = (assessment, mode = "citizen") => {
    const { riskScore, riskCategory, factors, disasterType } = assessment;

    if (mode === "citizen") {
        const lines = [`Risk Level: ${riskCategory} (${riskScore}/100)`];
        lines.push(`\nWhy this risk level:`);

        if (factors.weatherConditions.details.length > 0) {
            factors.weatherConditions.details.forEach(d => lines.push(`• ${d}`));
        }
        if (factors.historicalData.score > 30) {
            lines.push(`• This area has historical ${disasterType.toLowerCase()} susceptibility`);
        }
        if (factors.citizenReports.count > 0) {
            lines.push(`• ${factors.citizenReports.count} citizen report(s) in your area (last 24h)`);
        }
        if (factors.vulnerability.score > 50) {
            lines.push(`• Area has higher vulnerable population`);
        }

        lines.push(`\nRecommended Action: ${assessment.recommendedAction}`);
        return lines.join("\n");
    }

    // Technical explanation for responders
    return {
        riskScore,
        riskCategory,
        disasterType,
        confidence: assessment.confidence,
        factorBreakdown: factors,
        affectedPopulation: assessment.affectedPopulation,
        nearbyHabitations: assessment.nearbyHabitationsCount,
        recommendedAction: assessment.recommendedAction
    };
};

module.exports = {
    calculateUnifiedRisk,
    generateRiskExplanation,
    getRiskCategory
};
