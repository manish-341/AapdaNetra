const Shelter = require("../models/Shelter");
const HazardZone = require("../models/HazardZone");

/**
 * Smart Shelter Recommendation
 * Ranks shelters based on: distance, availability, capacity, occupancy,
 * disaster risk around shelter, accessibility, facilities, estimated travel time
 */
const recommendShelters = async (lat, lon, options = {}) => {
    const { maxDistance = 30000, limit = 5, requiredFacilities = [] } = options;

    // Find nearby shelters that aren't closed
    let shelters = await Shelter.find({
        status: { $ne: "CLOSED" },
        location: {
            $near: {
                $geometry: { type: "Point", coordinates: [lon, lat] },
                $maxDistance: maxDistance
            }
        }
    }).limit(20).lean();

    if (shelters.length === 0) {
        // Fallback: get any available shelters
        shelters = await Shelter.find({ status: { $ne: "CLOSED" } })
            .limit(10).lean();
    }

    // Score each shelter
    const scored = await Promise.all(shelters.map(async (shelter) => {
        const [sLon, sLat] = shelter.location.coordinates;
        const distance = haversineDistance(lat, lon, sLat, sLon);
        const travelTimeMinutes = Math.round(distance / 40 * 60); // ~40 km/h avg

        // Distance score (closer is better, max 25 points)
        const distanceScore = Math.max(0, 25 - (distance / maxDistance * 1000) * 25);

        // Availability score (max 25 points)
        const availableCapacity = shelter.capacity - shelter.currentOccupancy;
        const occupancyRatio = shelter.currentOccupancy / Math.max(shelter.capacity, 1);
        let availabilityScore = 0;
        if (shelter.status === "AVAILABLE") availabilityScore = 25;
        else if (shelter.status === "NEAR_CAPACITY") availabilityScore = 10;
        else if (shelter.status === "FULL") availabilityScore = 0;

        // Capacity score (more capacity = better, max 15 points)
        const capacityScore = Math.min(availableCapacity / 100 * 15, 15);

        // Risk around shelter (lower risk = better, max 15 points)
        const shelterRisk = shelter.riskScore || 0;
        const riskScore = Math.max(0, 15 - (shelterRisk / 100) * 15);

        // Accessibility score (max 10 points)
        let accessScore = 10;
        if (shelter.accessibility === "PARTIAL") accessScore = 6;
        else if (shelter.accessibility === "LIMITED") accessScore = 3;

        // Facilities score (max 10 points)
        let facilityScore = Math.min(shelter.facilities?.length || 0, 5) * 2;
        if (requiredFacilities.length > 0) {
            const matched = requiredFacilities.filter(f =>
                shelter.facilities?.includes(f)
            ).length;
            facilityScore = (matched / requiredFacilities.length) * 10;
        }

        const totalScore = distanceScore + availabilityScore + capacityScore +
                          riskScore + accessScore + facilityScore;

        return {
            shelter: {
                _id: shelter._id,
                name: shelter.name,
                district: shelter.district,
                state: shelter.state,
                address: shelter.address,
                status: shelter.status,
                capacity: shelter.capacity,
                currentOccupancy: shelter.currentOccupancy,
                availableCapacity,
                facilities: shelter.facilities,
                accessibility: shelter.accessibility,
                contactNumber: shelter.contactNumber,
                coordinates: shelter.location.coordinates
            },
            distance: Math.round(distance * 100) / 100,
            estimatedTravelTime: `${travelTimeMinutes} min`,
            riskAroundShelter: shelterRisk <= 25 ? "LOW" : shelterRisk <= 50 ? "MEDIUM" : "HIGH",
            recommendationScore: Math.round(totalScore),
            scoreBreakdown: {
                distance: Math.round(distanceScore),
                availability: Math.round(availabilityScore),
                capacity: Math.round(capacityScore),
                safety: Math.round(riskScore),
                accessibility: Math.round(accessScore),
                facilities: Math.round(facilityScore)
            }
        };
    }));

    // Sort by score descending
    scored.sort((a, b) => b.recommendationScore - a.recommendationScore);

    const results = scored.slice(0, limit);

    return {
        recommended: results[0] || null,
        alternatives: results.slice(1),
        totalFound: scored.length,
        searchRadius: `${maxDistance / 1000} km`,
        timestamp: new Date().toISOString()
    };
};

/**
 * Haversine distance calculation (km)
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return deg * Math.PI / 180; }

module.exports = { recommendShelters, haversineDistance };
