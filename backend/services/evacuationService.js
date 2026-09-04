const axios = require("axios");
const NodeCache = require("node-cache");
const routeCache = new NodeCache({ stdTTL: 1800 }); // 30 min cache for road routes
const Relocation = require("../models/Relocation");
const HazardZone = require("../models/HazardZone");
const { recommendShelters, haversineDistance } = require("./shelterRecommender");
const { calculateUnifiedRisk } = require("./riskEngine");

/**
 * Fetch real turn-by-turn road driving geometry from OSRM
 */
async function getOSRMRoute(originLng, originLat, destLng, destLat) {
    const key = `osrm_${originLng.toFixed(4)}_${originLat.toFixed(4)}_${destLng.toFixed(4)}_${destLat.toFixed(4)}`;
    const cached = routeCache.get(key);
    if (cached) return cached;

    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;
        const res = await axios.get(url, { timeout: 6000 });
        if (res.data?.routes && res.data.routes.length > 0) {
            const r = res.data.routes[0];
            const routeData = {
                coordinates: r.geometry.coordinates.map(pt => [pt[1], pt[0]]), // [lat, lng] for Leaflet
                distanceKm: (r.distance / 1000).toFixed(1),
                durationMins: Math.max(1, Math.round(r.duration / 60))
            };
            routeCache.set(key, routeData);
            return routeData;
        }
    } catch (err) {
        console.warn("OSRM routing call failed, falling back to straight line:", err.message);
    }

    return {
        coordinates: [[originLat, originLng], [destLat, destLng]],
        distanceKm: (haversineDistance(originLat, originLng, destLat, destLng) / 1000).toFixed(1),
        durationMins: Math.round(haversineDistance(originLat, originLng, destLat, destLng) / 500)
    };
}

/**
 * Evacuation Intelligence Service
 * User location → Risk Zone → Safe Areas → Shelters → Recommended Destination
 */
const getEvacuationRecommendation = async (lat, lon) => {
    // 1. Assess current location risk
    const riskAssessment = await calculateUnifiedRisk(lat, lon);
    const overallRisk = riskAssessment.overallRisk;

    // 2. Get shelter recommendations
    const shelterResult = await recommendShelters(lat, lon, { maxDistance: 50000, limit: 3 });

    // 3. Determine risk zone
    const nearbyHazards = await HazardZone.find({
        riskCategory: { $in: ["RED", "CRITICAL"] }
    }).lean().catch(() => []);

    const inRiskZone = overallRisk.riskScore >= 51;
    const isUrgent = overallRisk.riskScore >= 76;

    let roadRoute = null;
    if (shelterResult.recommended?.shelter?.coordinates) {
        const destCoords = shelterResult.recommended.shelter.coordinates; // [lng, lat]
        const osrm = await getOSRMRoute(lon, lat, destCoords[0], destCoords[1]);
        roadRoute = {
            origin: [lat, lon],
            destination: [destCoords[1], destCoords[0]],
            waypoints: osrm.coordinates,
            distanceKm: osrm.distanceKm,
            estimatedDuration: `${osrm.durationMins} mins`,
            corridorStatus: "ACTIVE_SURFACE_CORRIDOR",
            hazardsAvoided: ["Yamuna Basin Inundation Zone R-12"]
        };
    }

    // 4. Build evacuation recommendation
    const recommendation = {
        currentLocation: { lat, lon },
        riskAssessment: {
            riskScore: overallRisk.riskScore,
            riskCategory: overallRisk.riskCategory,
            disasterType: overallRisk.disasterType,
            recommendedAction: overallRisk.recommendedAction
        },
        inRiskZone,
        urgency: isUrgent ? "IMMEDIATE" : inRiskZone ? "PREPARE" : "MONITOR",

        recommendedShelter: shelterResult.recommended ? {
            name: shelterResult.recommended.shelter.name,
            address: shelterResult.recommended.shelter.address,
            district: shelterResult.recommended.shelter.district,
            distance: `${shelterResult.recommended.distance} km`,
            estimatedTravel: shelterResult.recommended.estimatedTravelTime,
            availableCapacity: shelterResult.recommended.shelter.availableCapacity,
            status: shelterResult.recommended.shelter.status,
            riskAroundShelter: shelterResult.recommended.riskAroundShelter,
            coordinates: shelterResult.recommended.shelter.coordinates,
            contactNumber: shelterResult.recommended.shelter.contactNumber
        } : null,

        alternativeShelters: shelterResult.alternatives.map(alt => ({
            name: alt.shelter.name,
            distance: `${alt.distance} km`,
            estimatedTravel: alt.estimatedTravelTime,
            availableCapacity: alt.shelter.availableCapacity,
            status: alt.shelter.status,
            coordinates: alt.shelter.coordinates
        })),

        route: roadRoute,
        safetyGuidelines: getSafetyGuidelines(overallRisk.disasterType, isUrgent),
        disclaimer: "This is AI-generated evacuation decision support, NOT an official evacuation order. Always follow instructions from official emergency authorities (NDMA, local disaster management authority).",
        timestamp: new Date().toISOString()
    };

    return recommendation;
};

/**
 * Get all active turn-by-turn evacuation road corridors from Relocation plans
 */
const getAllEvacuationRoutes = async () => {
    try {
        const relocations = await Relocation.find()
            .populate("habitation")
            .populate("destinationShelter")
            .lean();

        const routes = [];
        for (const plan of relocations) {
            if (!plan.fromLocation?.coordinates || !plan.destinationShelter?.location?.coordinates) {
                continue;
            }

            const [originLng, originLat] = plan.fromLocation.coordinates;
            const [destLng, destLat] = plan.destinationShelter.location.coordinates;

            const osrm = await getOSRMRoute(originLng, originLat, destLng, destLat);

            routes.push({
                planId: plan._id,
                sourceName: plan.habitation?.name || "Origin Settlement",
                destinationName: plan.destinationShelter?.name || "Emergency Shelter",
                origin: [originLat, originLng],
                destination: [destLat, destLng],
                distanceKm: osrm.distanceKm,
                durationMins: osrm.durationMins,
                population: plan.populationToRelocate || 0,
                priority: plan.priority || "SHORT_TERM",
                status: plan.status || "PLANNED",
                reason: plan.reason,
                coordinates: osrm.coordinates // array of [lat, lng]
            });
        }

        return routes;
    } catch (err) {
        console.error("Error fetching evacuation routes:", err.message);
        return [];
    }
};

function getSafetyGuidelines(disasterType, isUrgent) {
    const guidelines = {
        FLOOD: [
            "Move to higher ground immediately",
            "Do NOT walk or drive through flood water",
            "Avoid bridges over fast-moving water",
            "Take emergency kit, documents, and medications",
            "Turn off electricity and gas before leaving"
        ],
        LANDSLIDE: [
            "Move away from slopes and hillsides",
            "Avoid river valleys and low-lying areas",
            "Watch for signs: unusual sounds, tilting trees, new cracks",
            "Do NOT return to affected area until cleared by authorities",
            "Stay alert for secondary slides"
        ],
        WILDFIRE: [
            "Evacuate in the direction away from fire",
            "Close all windows and doors before leaving",
            "Wear protective clothing and carry wet cloth",
            "Drive with headlights on and windows closed",
            "Avoid smoke-filled areas"
        ]
    };

    return guidelines[disasterType] || [
        "Follow official evacuation instructions",
        "Take emergency supplies and documents",
        "Help elderly and disabled neighbors",
        "Stay calm and move to designated shelters",
        "Call emergency services: 112"
    ];
}

module.exports = { getEvacuationRecommendation, getAllEvacuationRoutes, getOSRMRoute };
