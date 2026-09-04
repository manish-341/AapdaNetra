const { calculateUnifiedRisk } = require("./riskEngine");
const Shelter = require("../models/Shelter");
const Habitation = require("../models/Habitation");

/**
 * "What If?" Disaster Simulation Service
 * Adjusts environmental parameters and estimates impact
 */
const runSimulation = async (scenario, adjustmentPercent, lat, lon) => {
    // 1. Get baseline risk
    const baseline = await calculateUnifiedRisk(lat || 28.6139, lon || 77.209);

    // 2. Calculate simulated parameters
    const baseWeather = baseline.weather;
    const simulated = { ...baseWeather };
    let scenarioDescription = "";

    switch (scenario) {
        case "heavy_rainfall":
            simulated.rainfall = baseWeather.rainfall * (1 + adjustmentPercent / 100);
            simulated.humidity = Math.min(baseWeather.humidity * 1.15, 100);
            scenarioDescription = `Rainfall increased by ${adjustmentPercent}% (${baseWeather.rainfall.toFixed(1)}mm → ${simulated.rainfall.toFixed(1)}mm)`;
            break;
        case "extreme_rainfall":
            simulated.rainfall = Math.max(baseWeather.rainfall, 20) * (1 + adjustmentPercent / 100);
            simulated.humidity = Math.min(95, baseWeather.humidity + 20);
            simulated.cloudCover = 95;
            scenarioDescription = `Extreme rainfall scenario: ${simulated.rainfall.toFixed(1)}mm`;
            break;
        case "temperature_rise":
            simulated.temperature = baseWeather.temperature + adjustmentPercent;
            simulated.humidity = Math.max(baseWeather.humidity - adjustmentPercent * 2, 10);
            scenarioDescription = `Temperature increased by ${adjustmentPercent}°C (${baseWeather.temperature}°C → ${simulated.temperature.toFixed(1)}°C)`;
            break;
        case "wildfire_conditions":
            simulated.temperature = Math.max(baseWeather.temperature, 35) + adjustmentPercent * 0.5;
            simulated.humidity = Math.max(15, baseWeather.humidity - adjustmentPercent);
            simulated.windSpeed = baseWeather.windSpeed * (1 + adjustmentPercent / 200);
            simulated.rainfall = 0;
            scenarioDescription = `Wildfire conditions: ${simulated.temperature.toFixed(1)}°C, ${simulated.humidity.toFixed(0)}% humidity, ${simulated.windSpeed.toFixed(1)} m/s wind`;
            break;
        case "landslide_rainfall":
            simulated.rainfall = Math.max(baseWeather.rainfall, 30) * (1 + adjustmentPercent / 100);
            simulated.humidity = Math.min(95, baseWeather.humidity + 15);
            scenarioDescription = `Sustained heavy rainfall for landslide assessment: ${simulated.rainfall.toFixed(1)}mm`;
            break;
        default:
            scenarioDescription = `Custom scenario with ${adjustmentPercent}% adjustment`;
    }

    // 3. Calculate simulated risk scores using adjusted parameters
    const simulatedRisks = {};
    const types = ["FLOOD", "LANDSLIDE", "WILDFIRE"];

    for (const type of types) {
        const baseRisk = baseline.assessments[type]?.riskScore || 20;

        // Calculate new risk based on weather changes
        let modifier = 0;
        if (type === "FLOOD") {
            modifier = (simulated.rainfall - baseWeather.rainfall) * 1.5 +
                       (simulated.humidity - baseWeather.humidity) * 0.3;
        } else if (type === "LANDSLIDE") {
            modifier = (simulated.rainfall - baseWeather.rainfall) * 1.2 +
                       (simulated.humidity - baseWeather.humidity) * 0.4;
        } else if (type === "WILDFIRE") {
            modifier = (simulated.temperature - baseWeather.temperature) * 2 +
                       (baseWeather.humidity - simulated.humidity) * 0.8 +
                       (simulated.windSpeed - baseWeather.windSpeed) * 1.5;
        }

        const newScore = Math.min(Math.max(Math.round(baseRisk + modifier), 0), 100);
        const change = newScore - baseRisk;

        simulatedRisks[type] = {
            baselineScore: baseRisk,
            simulatedScore: newScore,
            change,
            changePercent: baseRisk > 0 ? Math.round((change / baseRisk) * 100) : 0,
            direction: change > 0 ? "INCREASED" : change < 0 ? "DECREASED" : "UNCHANGED",
            riskCategory: newScore >= 76 ? "CRITICAL" : newScore >= 51 ? "RED" : newScore >= 26 ? "AMBER" : "GREEN"
        };
    }

    // 4. Estimate impact
    const habitations = await Habitation.find().lean().catch(() => []);
    const affectedHabitations = habitations.filter(h =>
        (h.currentRiskScore || 0) + (Object.values(simulatedRisks).reduce((max, r) => Math.max(max, r.change), 0)) >= 50
    );
    const affectedPopulation = affectedHabitations.reduce((sum, h) => sum + (h.population || 0), 0);

    const shelters = await Shelter.find({ status: { $ne: "CLOSED" } }).lean().catch(() => []);
    const totalShelterCapacity = shelters.reduce((sum, s) => sum + (s.capacity - s.currentOccupancy), 0);

    return {
        scenario,
        scenarioDescription,
        adjustmentPercent,
        location: { lat: lat || 28.6139, lon: lon || 77.209 },

        baselineWeather: {
            temperature: baseWeather.temperature,
            humidity: baseWeather.humidity,
            rainfall: baseWeather.rainfall,
            windSpeed: baseWeather.windSpeed
        },
        simulatedWeather: {
            temperature: simulated.temperature,
            humidity: simulated.humidity,
            rainfall: simulated.rainfall,
            windSpeed: simulated.windSpeed
        },

        riskComparison: simulatedRisks,

        impact: {
            estimatedAffectedHabitations: affectedHabitations.length,
            estimatedAffectedPopulation: affectedPopulation,
            shelterCapacityAvailable: totalShelterCapacity,
            shelterDeficit: Math.max(0, affectedPopulation - totalShelterCapacity),
            priorityAreas: affectedHabitations
                .sort((a, b) => (b.vulnerabilityScore || 0) - (a.vulnerabilityScore || 0))
                .slice(0, 5)
                .map(h => ({ name: h.name, district: h.district, vulnerability: h.vulnerabilityScore, population: h.population }))
        },

        disclaimer: "⚠️ SIMULATION — This is a hypothetical scenario, NOT a real prediction or forecast. Results are estimates based on simplified models.",
        timestamp: new Date().toISOString()
    };
};

module.exports = { runSimulation };
