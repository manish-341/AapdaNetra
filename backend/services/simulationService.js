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
            const baseRain = Math.max(baseWeather.rainfall || 0, 22.5);
            simulated.rainfall = baseRain * (1 + adjustmentPercent / 100);
            simulated.humidity = Math.min(Math.max(baseWeather.humidity || 60, 60) * 1.15, 100);
            scenarioDescription = `Rainfall increased by ${adjustmentPercent}% (${baseRain.toFixed(1)}mm/h → ${simulated.rainfall.toFixed(1)}mm/h)`;
            break;
        case "extreme_rainfall":
            const extremeBase = Math.max(baseWeather.rainfall || 0, 35.0);
            simulated.rainfall = extremeBase * (1 + adjustmentPercent / 100);
            simulated.humidity = Math.min(95, (baseWeather.humidity || 70) + 20);
            simulated.cloudCover = 95;
            scenarioDescription = `Flash Downpour Surge (+${adjustmentPercent}%): ${extremeBase.toFixed(1)}mm/h → ${simulated.rainfall.toFixed(1)}mm/h`;
            break;
        case "temperature_rise":
            const baseTemp = Math.max(baseWeather.temperature || 0, 32.0);
            simulated.temperature = baseTemp + (adjustmentPercent * 0.1);
            simulated.humidity = Math.max((baseWeather.humidity || 50) - adjustmentPercent * 0.3, 10);
            scenarioDescription = `Heatwave Surge (+${adjustmentPercent}%): ${baseTemp.toFixed(1)}°C → ${simulated.temperature.toFixed(1)}°C`;
            break;
        case "wildfire_conditions":
            const fireTemp = Math.max(baseWeather.temperature || 0, 34.0) + adjustmentPercent * 0.15;
            simulated.temperature = fireTemp;
            simulated.humidity = Math.max(12, (baseWeather.humidity || 45) - adjustmentPercent * 0.4);
            simulated.windSpeed = (baseWeather.windSpeed || 12) * (1 + adjustmentPercent / 100);
            simulated.rainfall = 0;
            scenarioDescription = `Wildfire Stress (+${adjustmentPercent}%): ${simulated.temperature.toFixed(1)}°C, ${simulated.humidity.toFixed(0)}% RH, ${simulated.windSpeed.toFixed(1)} km/h wind`;
            break;
        case "landslide_rainfall":
            const slopeRain = Math.max(baseWeather.rainfall || 0, 28.0);
            simulated.rainfall = slopeRain * (1 + adjustmentPercent / 100);
            simulated.humidity = Math.min(95, (baseWeather.humidity || 70) + 15);
            scenarioDescription = `Slope Saturation Rainfall (+${adjustmentPercent}%): ${slopeRain.toFixed(1)}mm/h → ${simulated.rainfall.toFixed(1)}mm/h`;
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
            modifier = (simulated.rainfall - (baseWeather.rainfall || 15)) * 1.5 +
                       (simulated.humidity - (baseWeather.humidity || 50)) * 0.3;
        } else if (type === "LANDSLIDE") {
            modifier = (simulated.rainfall - (baseWeather.rainfall || 15)) * 1.2 +
                       (simulated.humidity - (baseWeather.humidity || 50)) * 0.4;
        } else if (type === "WILDFIRE") {
            modifier = (simulated.temperature - (baseWeather.temperature || 30)) * 2 +
                       ((baseWeather.humidity || 50) - simulated.humidity) * 0.8 +
                       (simulated.windSpeed - (baseWeather.windSpeed || 10)) * 1.5;
        }       }

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
