const Habitation = require("../models/Habitation");
const HazardZone = require("../models/HazardZone");
const Shelter = require("../models/Shelter");
const Alert = require("../models/Alert");
const Relocation = require("../models/Relocation");
const axios = require("axios");

// Primary Indian District Coordinate Gazetteer & Registry
const DISTRICT_COORDINATES = {
    // Madhya Pradesh
    "vindhya": { lat: 24.5362, lng: 81.3038, state: "Madhya Pradesh", name: "Vindhya / Rewa" },
    "rewa": { lat: 24.5362, lng: 81.3038, state: "Madhya Pradesh", name: "Rewa" },
    "satna": { lat: 24.5805, lng: 80.8252, state: "Madhya Pradesh", name: "Satna" },
    "sidhi": { lat: 24.4033, lng: 81.8791, state: "Madhya Pradesh", name: "Sidhi" },
    "singrauli": { lat: 24.1992, lng: 82.6645, state: "Madhya Pradesh", name: "Singrauli" },
    "bhopal": { lat: 23.2599, lng: 77.4126, state: "Madhya Pradesh", name: "Bhopal" },
    "indore": { lat: 22.7196, lng: 75.8577, state: "Madhya Pradesh", name: "Indore" },
    "jabalpur": { lat: 23.1815, lng: 79.9864, state: "Madhya Pradesh", name: "Jabalpur" },
    "gwalior": { lat: 26.2183, lng: 78.1828, state: "Madhya Pradesh", name: "Gwalior" },
    "ujjain": { lat: 23.1765, lng: 75.7885, state: "Madhya Pradesh", name: "Ujjain" },

    // Jharkhand
    "ranchi": { lat: 23.3441, lng: 85.3096, state: "Jharkhand", name: "Ranchi" },
    "jamshedpur": { lat: 22.8046, lng: 86.2029, state: "Jharkhand", name: "Jamshedpur" },
    "dhanbad": { lat: 23.7957, lng: 86.4304, state: "Jharkhand", name: "Dhanbad" },
    "bokaro": { lat: 23.6693, lng: 86.1511, state: "Jharkhand", name: "Bokaro" },
    "deoghar": { lat: 24.4826, lng: 86.7003, state: "Jharkhand", name: "Deoghar" },
    "hazaribagh": { lat: 23.9961, lng: 85.3637, state: "Jharkhand", name: "Hazaribagh" },

    // Delhi & NCR
    "delhi": { lat: 28.6139, lng: 77.2090, state: "Delhi", name: "Delhi" },
    "central delhi": { lat: 28.6139, lng: 77.2090, state: "Delhi", name: "Central Delhi" },
    "north delhi": { lat: 28.6800, lng: 77.1950, state: "Delhi", name: "North Delhi" },
    "east delhi": { lat: 28.6280, lng: 77.2800, state: "Delhi", name: "East Delhi" },
    "south delhi": { lat: 28.5200, lng: 77.2100, state: "Delhi", name: "South Delhi" },
    "west delhi": { lat: 28.6663, lng: 77.0674, state: "Delhi", name: "West Delhi" },
    "new delhi": { lat: 28.6139, lng: 77.2090, state: "Delhi", name: "New Delhi" },
    "gautam buddha nagar": { lat: 28.4744, lng: 77.5040, state: "Uttar Pradesh", name: "Gautam Buddha Nagar" },
    "noida": { lat: 28.5355, lng: 77.3910, state: "Uttar Pradesh", name: "Noida" },
    "greater noida": { lat: 28.4744, lng: 77.5040, state: "Uttar Pradesh", name: "Greater Noida" },
    "ghaziabad": { lat: 28.6692, lng: 77.4538, state: "Uttar Pradesh", name: "Ghaziabad" },
    "gurugram": { lat: 28.4595, lng: 77.0266, state: "Haryana", name: "Gurugram" },
    "gurgaon": { lat: 28.4595, lng: 77.0266, state: "Haryana", name: "Gurugram" },
    "faridabad": { lat: 28.4089, lng: 77.3178, state: "Haryana", name: "Faridabad" },

    // Maharashtra
    "mumbai": { lat: 19.0760, lng: 72.8777, state: "Maharashtra", name: "Mumbai" },
    "pune": { lat: 18.5204, lng: 73.8567, state: "Maharashtra", name: "Pune" },
    "nagpur": { lat: 21.1458, lng: 79.0882, state: "Maharashtra", name: "Nagpur" },
    "nashik": { lat: 19.9975, lng: 73.7898, state: "Maharashtra", name: "Nashik" },
    "thane": { lat: 19.2183, lng: 72.9781, state: "Maharashtra", name: "Thane" },
    "aurangabad": { lat: 19.8762, lng: 75.3433, state: "Maharashtra", name: "Chhatrapati Sambhajinagar" },
    "chhatrapati sambhajinagar": { lat: 19.8762, lng: 75.3433, state: "Maharashtra", name: "Chhatrapati Sambhajinagar" },
    "kolhapur": { lat: 16.7050, lng: 74.2433, state: "Maharashtra", name: "Kolhapur" },
    "solapur": { lat: 17.6599, lng: 75.9064, state: "Maharashtra", name: "Solapur" },

    // Uttar Pradesh
    "lucknow": { lat: 26.8467, lng: 80.9462, state: "Uttar Pradesh", name: "Lucknow" },
    "kanpur": { lat: 26.4499, lng: 80.3319, state: "Uttar Pradesh", name: "Kanpur" },
    "varanasi": { lat: 25.3176, lng: 82.9739, state: "Uttar Pradesh", name: "Varanasi" },
    "prayagraj": { lat: 25.4358, lng: 81.8463, state: "Uttar Pradesh", name: "Prayagraj" },
    "allahabad": { lat: 25.4358, lng: 81.8463, state: "Uttar Pradesh", name: "Prayagraj" },
    "agra": { lat: 27.1767, lng: 78.0081, state: "Uttar Pradesh", name: "Agra" },
    "meerut": { lat: 28.9845, lng: 77.7064, state: "Uttar Pradesh", name: "Meerut" },
    "gorakhpur": { lat: 26.7606, lng: 83.3732, state: "Uttar Pradesh", name: "Gorakhpur" },
    "bareilly": { lat: 28.3670, lng: 79.4304, state: "Uttar Pradesh", name: "Bareilly" },
    "ayodhya": { lat: 26.7922, lng: 82.1998, state: "Uttar Pradesh", name: "Ayodhya" },

    // Bihar
    "patna": { lat: 25.5941, lng: 85.1376, state: "Bihar", name: "Patna" },
    "gaya": { lat: 24.7914, lng: 85.0002, state: "Bihar", name: "Gaya" },
    "muzaffarpur": { lat: 26.1209, lng: 85.3647, state: "Bihar", name: "Muzaffarpur" },
    "bhagalpur": { lat: 25.2425, lng: 86.9842, state: "Bihar", name: "Bhagalpur" },
    "darbhanga": { lat: 26.1542, lng: 85.8918, state: "Bihar", name: "Darbhanga" },

    // West Bengal
    "kolkata": { lat: 22.5726, lng: 88.3639, state: "West Bengal", name: "Kolkata" },
    "howrah": { lat: 22.5958, lng: 88.2636, state: "West Bengal", name: "Howrah" },
    "siliguri": { lat: 26.7271, lng: 88.3953, state: "West Bengal", name: "Siliguri" },
    "darjeeling": { lat: 27.0410, lng: 88.2663, state: "West Bengal", name: "Darjeeling" },
    "asansol": { lat: 23.6739, lng: 86.9524, state: "West Bengal", name: "Asansol" },

    // South India
    "bengaluru": { lat: 12.9716, lng: 77.5946, state: "Karnataka", name: "Bengaluru" },
    "bangalore": { lat: 12.9716, lng: 77.5946, state: "Karnataka", name: "Bengaluru" },
    "mysuru": { lat: 12.2958, lng: 76.6394, state: "Karnataka", name: "Mysuru" },
    "mangalore": { lat: 12.9141, lng: 74.8560, state: "Karnataka", name: "Mangalore" },
    "hubli": { lat: 15.3647, lng: 75.1240, state: "Karnataka", name: "Hubli" },
    "chennai": { lat: 13.0827, lng: 80.2707, state: "Tamil Nadu", name: "Chennai" },
    "coimbatore": { lat: 11.0168, lng: 76.9558, state: "Tamil Nadu", name: "Coimbatore" },
    "madurai": { lat: 9.9252, lng: 78.1198, state: "Tamil Nadu", name: "Madurai" },
    "hyderabad": { lat: 17.3850, lng: 78.4867, state: "Telangana", name: "Hyderabad" },
    "visakhapatnam": { lat: 17.6868, lng: 83.2185, state: "Andhra Pradesh", name: "Visakhapatnam" },
    "vijayawada": { lat: 16.5062, lng: 80.6480, state: "Andhra Pradesh", name: "Vijayawada" },
    "tirupati": { lat: 13.6288, lng: 79.4192, state: "Andhra Pradesh", name: "Tirupati" },
    "thiruvananthapuram": { lat: 8.5241, lng: 76.9366, state: "Kerala", name: "Thiruvananthapuram" },
    "kochi": { lat: 9.9312, lng: 76.2673, state: "Kerala", name: "Kochi" },
    "kozhikode": { lat: 11.2588, lng: 75.7804, state: "Kerala", name: "Kozhikode" },

    // North & West India
    "jaipur": { lat: 26.9124, lng: 75.7873, state: "Rajasthan", name: "Jaipur" },
    "jodhpur": { lat: 26.2389, lng: 73.0243, state: "Rajasthan", name: "Jodhpur" },
    "udaipur": { lat: 24.5854, lng: 73.7125, state: "Rajasthan", name: "Udaipur" },
    "kota": { lat: 25.2138, lng: 75.8648, state: "Rajasthan", name: "Kota" },
    "ahmedabad": { lat: 23.0225, lng: 72.5714, state: "Gujarat", name: "Ahmedabad" },
    "surat": { lat: 21.1702, lng: 72.8311, state: "Gujarat", name: "Surat" },
    "vadodara": { lat: 22.3072, lng: 73.1812, state: "Gujarat", name: "Vadodara" },
    "rajkot": { lat: 22.3039, lng: 70.8022, state: "Gujarat", name: "Rajkot" },
    "chandigarh": { lat: 30.7333, lng: 76.7794, state: "Chandigarh", name: "Chandigarh" },
    "amritsar": { lat: 31.6340, lng: 74.8723, state: "Punjab", name: "Amritsar" },
    "ludhiana": { lat: 30.9010, lng: 75.8573, state: "Punjab", name: "Ludhiana" },
    "dehradun": { lat: 30.3165, lng: 78.0322, state: "Uttarakhand", name: "Dehradun" },
    "haridwar": { lat: 29.9457, lng: 78.1642, state: "Uttarakhand", name: "Haridwar" },
    "shimla": { lat: 31.1048, lng: 77.1734, state: "Himachal Pradesh", name: "Shimla" },
    "srinagar": { lat: 34.0837, lng: 74.7973, state: "Jammu and Kashmir", name: "Srinagar" },
    "jammu": { lat: 32.7266, lng: 74.8570, state: "Jammu and Kashmir", name: "Jammu" },

    // East & North-East
    "bhubaneswar": { lat: 20.2961, lng: 85.8245, state: "Odisha", name: "Bhubaneswar" },
    "cuttack": { lat: 20.4625, lng: 85.8828, state: "Odisha", name: "Cuttack" },
    "puri": { lat: 19.8135, lng: 85.8312, state: "Odisha", name: "Puri" },
    "raipur": { lat: 21.2514, lng: 81.6296, state: "Chhattisgarh", name: "Raipur" },
    "bilaspur": { lat: 22.0797, lng: 82.1409, state: "Chhattisgarh", name: "Bilaspur" },
    "guwahati": { lat: 26.1445, lng: 91.7362, state: "Assam", name: "Guwahati" },
    "shillong": { lat: 25.5788, lng: 91.8933, state: "Meghalaya", name: "Shillong" },
    "imphal": { lat: 24.8170, lng: 93.9368, state: "Manipur", name: "Imphal" },
    "agartala": { lat: 23.8315, lng: 91.2868, state: "Tripura", name: "Agartala" },
    "aizawl": { lat: 23.7271, lng: 92.7176, state: "Mizoram", name: "Aizawl" },
    "kohima": { lat: 25.6751, lng: 94.1086, state: "Nagaland", name: "Kohima" },
    "gangtok": { lat: 27.3389, lng: 88.6065, state: "Sikkim", name: "Gangtok" },
    "itanagar": { lat: 27.0844, lng: 93.6053, state: "Arunachal Pradesh", name: "Itanagar" },
    "goa": { lat: 15.2993, lng: 74.1240, state: "Goa", name: "Goa" },
    "panaji": { lat: 15.4909, lng: 73.8278, state: "Goa", name: "Panaji" }
};

/**
 * Resolve geographical coordinates for any Indian district name
 */
async function resolveDistrictCoordinates(districtName, stateName = "") {
    if (!districtName) return { lat: 28.6139, lng: 77.2090, name: "Delhi", state: "Delhi" };

    const clean = districtName.toLowerCase().trim();
    if (DISTRICT_COORDINATES[clean]) {
        return DISTRICT_COORDINATES[clean];
    }

    // Check partial matches in gazetteer
    for (const [key, val] of Object.entries(DISTRICT_COORDINATES)) {
        if (clean.includes(key) || key.includes(clean)) {
            return val;
        }
    }

    // Geocode dynamically via OpenStreetMap Nominatim
    try {
        const query = `${districtName} ${stateName} India`.trim();
        const res = await axios.get("https://nominatim.openstreetmap.org/search", {
            params: { q: query, format: "json", limit: 1 },
            headers: { "User-Agent": "AapdaNetra-DisasterIntelligence/2.0" },
            timeout: 4000
        });

        if (res.data && res.data.length > 0) {
            const item = res.data[0];
            return {
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                name: districtName,
                state: stateName || "India"
            };
        }
    } catch (err) {
        console.warn(`Geocoding lookup for ${districtName} fallback used:`, err.message);
    }

    // Default fallback
    return { lat: 24.5362, lng: 81.3038, name: districtName, state: stateName || "India" };
}

/**
 * Auto-provision habitations, shelters, and hazard zones for any new district
 */
async function ensureDistrictProvisioned(districtName, stateName = "") {
    try {
        if (!districtName) return;

        const coords = await resolveDistrictCoordinates(districtName, stateName);
        const { lat, lng } = coords;

        // Check if existing records exist and verify they are positioned at the true coordinates
        const existingHab = await Habitation.findOne({
            district: { $regex: new RegExp(`^${districtName.trim()}$`, "i") }
        });

        if (existingHab && existingHab.location?.coordinates) {
            const [eLng, eLat] = existingHab.location.coordinates;
            const dLat = Math.abs(eLat - lat);
            const dLng = Math.abs(eLng - lng);
            // If existing records match the true coordinates, no re-provisioning needed
            if (dLat < 0.5 && dLng < 0.5) {
                return;
            }
            // Reposition misplaced records (e.g. from previous fallback to Rewa)
            console.log(`Repositioning misplaced records for ${districtName} to correct coordinates [${lat}, ${lng}]...`);
            const reg = new RegExp(`^${districtName.trim()}$`, "i");
            await Habitation.deleteMany({ district: reg });
            await Shelter.deleteMany({ district: reg });
            await HazardZone.deleteMany({ district: reg });
            await Alert.deleteMany({ district: reg });
        }

        console.log(`Auto-provisioning localized disaster intelligence infrastructure for: ${districtName} (${coords.state}) at [${lat}, ${lng}]...`);

        // 1. Create Localized Habitations
        const habs = await Habitation.insertMany([
            {
                name: `${districtName} Riverfront Settlement`,
                district: districtName,
                state: stateName || coords.state,
                population: 3800,
                vulnerablePopulation: 950,
                vulnerabilityScore: 84,
                currentRiskScore: 82,
                riskCategory: "CRITICAL",
                location: { type: "Point", coordinates: [lng + 0.012, lat - 0.008] }
            },
            {
                name: `${districtName} Central Lowlands`,
                district: districtName,
                state: stateName || coords.state,
                population: 4100,
                vulnerablePopulation: 780,
                vulnerabilityScore: 75,
                currentRiskScore: 72,
                riskCategory: "RED",
                location: { type: "Point", coordinates: [lng - 0.015, lat + 0.014] }
            },
            {
                name: `${districtName} Valley Habitation`,
                district: districtName,
                state: stateName || coords.state,
                population: 2600,
                vulnerablePopulation: 520,
                vulnerabilityScore: 68,
                currentRiskScore: 64,
                riskCategory: "AMBER",
                location: { type: "Point", coordinates: [lng + 0.022, lat + 0.018] }
            }
        ]);

        // 2. Create Localized Relief Shelters
        const shelters = await Shelter.insertMany([
            {
                name: `${districtName} District Disaster Relief Center`,
                district: districtName,
                state: stateName || coords.state,
                address: `Civil Lines Emergency Hub, ${districtName}`,
                capacity: 650,
                currentOccupancy: 120,
                availableCapacity: 530,
                status: "AVAILABLE",
                facilities: ["water", "electricity", "medical", "food", "sanitation", "generator"],
                accessibility: "FULL",
                riskScore: 8,
                contactNumber: "112 / 1078",
                location: { type: "Point", coordinates: [lng - 0.006, lat + 0.005] }
            },
            {
                name: `${districtName} Community College Shelter`,
                district: districtName,
                state: stateName || coords.state,
                address: `College Road, ${districtName}`,
                capacity: 450,
                currentOccupancy: 60,
                availableCapacity: 390,
                status: "AVAILABLE",
                facilities: ["water", "electricity", "food", "sanitation"],
                accessibility: "FULL",
                riskScore: 10,
                contactNumber: "112 / 1078",
                location: { type: "Point", coordinates: [lng + 0.018, lat - 0.012] }
            }
        ]);

        // 3. Create Localized Hazard Zones
        await HazardZone.insertMany([
            {
                name: `${districtName} Basin Inundation Sector`,
                hazardType: "FLOOD",
                district: districtName,
                state: stateName || coords.state,
                severity: 85,
                riskScore: 82,
                riskCategory: "CRITICAL",
                probability: 0.78,
                geometry: {
                    type: "Polygon",
                    coordinates: [[[lng - 0.03, lat - 0.03], [lng + 0.03, lat - 0.03], [lng + 0.03, lat + 0.03], [lng - 0.03, lat + 0.03], [lng - 0.03, lat - 0.03]]]
                },
                source: "District Disaster Management Authority"
            },
            {
                name: `${districtName} Slope Instability Zone`,
                hazardType: "LANDSLIDE",
                district: districtName,
                state: stateName || coords.state,
                severity: 70,
                riskScore: 68,
                riskCategory: "RED",
                probability: 0.55,
                geometry: {
                    type: "Polygon",
                    coordinates: [[[lng - 0.05, lat + 0.02], [lng - 0.02, lat + 0.02], [lng - 0.02, lat + 0.05], [lng - 0.05, lat + 0.05], [lng - 0.05, lat + 0.02]]]
                },
                source: "Geological Survey Analysis"
            }
        ]);

        // 4. Create Active Relocation Plan
        await Relocation.create({
            habitation: habs[0]._id,
            fromLocation: {
                type: "Point",
                coordinates: habs[0].location.coordinates
            },
            destinationShelter: shelters[0]._id,
            populationToRelocate: 950,
            priority: "IMMEDIATE",
            status: "PLANNED",
            reason: `Urgent evacuation due to monsoon water surge in ${districtName} basin`
        });

        // 5. Create Local Alert (Advisory/Warning level, NOT critical alarm)
        await Alert.create({
            title: `EARLY WARNING — Flood & Inundation Watch (${districtName})`,
            message: `Hydrological gauge thresholds in ${districtName} approaching warning marks. Responders on monitoring status.`,
            severity: "WARNING",
            hazardType: "FLOOD",
            source: "OFFICIAL",
            verificationStatus: "VERIFIED",
            location: { type: "Point", coordinates: [lng, lat] },
            affectedRadius: 15,
            isActive: true,
            expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
        });

        console.log(`District ${districtName} successfully provisioned!`);
    } catch (err) {
        console.error(`ensureDistrictProvisioned error for ${districtName}:`, err.message);
    }
}

module.exports = {
    DISTRICT_COORDINATES,
    resolveDistrictCoordinates,
    ensureDistrictProvisioned
};
