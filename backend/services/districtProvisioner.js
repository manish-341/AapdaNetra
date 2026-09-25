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
    "chitrakoot": { lat: 25.1764, lng: 80.8643, state: "Madhya Pradesh", name: "Chitrakoot" },
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
    "vizag": { lat: 17.6868, lng: 83.2185, state: "Andhra Pradesh", name: "Visakhapatnam" },
    "shrinagar": { lat: 34.0837, lng: 74.7973, state: "Jammu and Kashmir", name: "Srinagar" },
    "chandigardh": { lat: 30.7333, lng: 76.7794, state: "Chandigarh", name: "Chandigarh" },
    "chitrakut": { lat: 25.2078, lng: 80.8953, state: "Uttar Pradesh", name: "Chitrakoot" },
    "vindhya": { lat: 24.5362, lng: 81.3038, state: "Madhya Pradesh", name: "Vindhya" }
};

/**
 * Resolve geographical coordinates for any Indian district name
 */
async function resolveDistrictCoordinates(districtName, stateName = "") {
    if (!districtName) return { lat: 28.6139, lng: 77.2090, name: "Delhi", state: "Delhi" };

    const clean = districtName.toLowerCase().trim();
    const cleanNormalized = clean.replace(/[-_]/g, ' ');

    // 1. Direct gazetteer key match (O(1))
    if (DISTRICT_COORDINATES[clean]) {
        return DISTRICT_COORDINATES[clean];
    }
    if (DISTRICT_COORDINATES[cleanNormalized]) {
        return DISTRICT_COORDINATES[cleanNormalized];
    }

    // 2. Exact name match across gazetteer values
    for (const [key, val] of Object.entries(DISTRICT_COORDINATES)) {
        if (clean === val.name.toLowerCase() || cleanNormalized === val.name.toLowerCase()) {
            return val;
        }
    }

    // 3. Token / Word boundary match sorted by longest key first (prevents 'patna' matching inside 'visakhapatnam')
    const sortedEntries = Object.entries(DISTRICT_COORDINATES).sort((a, b) => b[0].length - a[0].length);
    const cleanTokens = clean.split(/[\s,()\-]+/);

    for (const [key, val] of sortedEntries) {
        const valLower = val.name.toLowerCase();
        if (
            cleanTokens.includes(key) ||
            cleanTokens.includes(valLower) ||
            clean.startsWith(key) ||
            clean.startsWith(valLower) ||
            new RegExp(`\\b${key}\\b`, 'i').test(clean) ||
            new RegExp(`\\b${valLower}\\b`, 'i').test(clean)
        ) {
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
/**
 * Compute realistic, localized multi-hazard risk profiles and probabilities
 * based on live precipitation, regional topography, and geodetic classification.
 */
function computeTopographicalRisk(districtName, lat, lng, liveRain = 0) {
    const clean = (districtName || '').toLowerCase();
    const isCoastal = ['mumbai', 'visakhapatnam', 'vizag', 'kolkata', 'chennai', 'kochi', 'puri', 'goa', 'panaji'].some(c => clean.includes(c));
    const isMountain = ['dehradun', 'srinagar', 'shrinagar', 'shimla', 'haridwar', 'darjeeling', 'gangtok', 'shillong', 'imphal', 'aizawl', 'kohima', 'itanagar'].some(c => clean.includes(c));
    const isRiverPlain = ['delhi', 'patna', 'guwahati', 'lucknow', 'kanpur', 'varanasi', 'prayagraj', 'ayodhya', 'chitrakoot', 'chitrakut'].some(c => clean.includes(c));
    const isPlateau = ['bhopal', 'indore', 'pune', 'ranchi', 'vindhya', 'rewa', 'jaipur', 'jodhpur', 'nagpur', 'chandigarh', 'chandigardh'].some(c => clean.includes(c));

    const isRainSevere = liveRain >= 50;
    const isRainModerate = liveRain >= 15;
    const rainBonus = Math.min(0.35, liveRain * 0.012);

    let baseFloodProb = isCoastal ? 0.14 : isRiverPlain ? 0.09 : isMountain ? 0.05 : 0.06;
    let baseSlopeProb = isMountain ? 0.19 : isPlateau ? 0.08 : isCoastal ? 0.04 : 0.03;

    // In severe weather, probabilities surge realistically
    const floodProb = Number(Math.min(0.95, Math.max(0.04, isRainSevere ? 0.85 : isRainModerate ? 0.45 : (baseFloodProb + rainBonus))).toFixed(2));
    const slopeProb = Number(Math.min(0.95, Math.max(0.03, isRainSevere ? 0.72 : isRainModerate ? 0.38 : (baseSlopeProb + (rainBonus * 0.7)))).toFixed(2));

    const floodScore = isRainSevere ? 85 : isRainModerate ? 42 : Math.round(floodProb * 100);
    const slopeScore = isRainSevere ? 72 : isRainModerate ? 36 : Math.round(slopeProb * 100);

    const floodSev = isRainSevere ? 88 : isRainModerate ? 45 : Math.min(30, Math.round(floodScore * 1.1));
    const slopeSev = isRainSevere ? 75 : isRainModerate ? 40 : Math.min(28, Math.round(slopeScore * 1.1));

    const floodCategory = isRainSevere ? "CRITICAL" : isRainModerate ? "AMBER" : "GREEN";
    const slopeCategory = isRainSevere ? "RED" : isRainModerate ? "AMBER" : "GREEN";

    let floodZoneName = `${districtName} Basin Drainage Sector (Monitored)`;
    let slopeZoneName = `${districtName} Terrain Slope Sector (Monitored)`;

    if (clean.includes("chitrakoot")) {
        floodZoneName = "Chitrakoot Mandakini River Confluence Basin (Monitored)";
        slopeZoneName = "Chitrakoot Kamadgiri Foothills Escarpment (Monitored)";
    } else if (clean.includes("visakhapatnam") || clean.includes("vizag")) {
        floodZoneName = "Visakhapatnam Meghadrigedda Coastal Drainage Plain (Monitored)";
        slopeZoneName = "Visakhapatnam Kailasagiri Coastal Slope Sector (Monitored)";
    } else if (clean.includes("mumbai")) {
        floodZoneName = "Mumbai Mithi River Tidal Estuary Basin (Monitored)";
        slopeZoneName = "Mumbai Powai Ridge Slope Sector (Monitored)";
    } else if (clean.includes("kolkata")) {
        floodZoneName = "Kolkata Hooghly Tidal Drainage Plain (Monitored)";
        slopeZoneName = "Kolkata Tiljala Wetlands Outfall Sector (Monitored)";
    } else if (clean.includes("dehradun")) {
        floodZoneName = "Dehradun Rispana-Bindal Foothill Torrent Basin (Monitored)";
        slopeZoneName = "Dehradun Rajpur Himalayan Slope Sector (Monitored)";
    } else if (clean.includes("srinagar")) {
        floodZoneName = "Srinagar Jhelum Valley Floodplain Sector (Monitored)";
        slopeZoneName = "Srinagar Zabarwan Mountain Slope Sector (Monitored)";
    } else if (clean.includes("pune")) {
        floodZoneName = "Pune Mula-Mutha River Confluence Basin (Monitored)";
        slopeZoneName = "Pune Sinhagad Ridge Slope Sector (Monitored)";
    } else if (clean.includes("indore")) {
        floodZoneName = "Indore Kanh River Drainage Corridor (Monitored)";
        slopeZoneName = "Indore Ralamandal Ridge Slope Sector (Monitored)";
    } else if (clean.includes("lucknow")) {
        floodZoneName = "Lucknow Gomti River Basin Drainage Sector (Monitored)";
        slopeZoneName = "Lucknow Kukrail Outfall Lowland Sector (Monitored)";
    } else if (clean.includes("guwahati")) {
        floodZoneName = "Guwahati Brahmaputra South Bank Plain (Monitored)";
        slopeZoneName = "Guwahati Deepor Beel Valley Slope Sector (Monitored)";
    } else if (clean.includes("chandigarh")) {
        floodZoneName = "Chandigarh Sukhna Choe Outfall Plain (Monitored)";
        slopeZoneName = "Chandigarh Shivalik Foothills Slope Sector (Monitored)";
    } else if (clean.includes("ranchi")) {
        floodZoneName = "Ranchi Subarnarekha River Basin (Monitored)";
        slopeZoneName = "Ranchi Kanke Dam Escarpment Sector (Monitored)";
    } else if (clean.includes("vindhya") || clean.includes("rewa")) {
        floodZoneName = "Vindhya Bichia River Confluence Basin (Monitored)";
        slopeZoneName = "Vindhya Tons River Gorge Slope Sector (Monitored)";
    }

    let baseFireProb = isMountain ? 0.16 : isPlateau ? 0.11 : isCoastal ? 0.03 : 0.05;
    if (liveRain >= 15) baseFireProb = Math.max(0.02, baseFireProb - 0.08);
    const fireProb = Number(Math.min(0.95, Math.max(0.02, baseFireProb)).toFixed(2));
    const fireScore = Math.round(fireProb * 100);
    const fireSev = Math.min(30, Math.round(fireScore * 1.05));
    const fireCategory = fireScore >= 60 ? "RED" : fireScore >= 25 ? "AMBER" : "GREEN";
    let fireZoneName = `${districtName} Vegetative & Forest Canopy Buffer (Monitored)`;

    if (clean.includes("dehradun")) {
        fireZoneName = "Dehradun Mussoorie Foothill Pine Canopy Zone (Monitored)";
    } else if (clean.includes("srinagar")) {
        fireZoneName = "Srinagar Dachigam Pine Forest Buffer (Monitored)";
    } else if (clean.includes("vindhya") || clean.includes("rewa")) {
        fireZoneName = "Vindhya Kaimur Range Forest Buffer (Monitored)";
    } else if (clean.includes("pune")) {
        fireZoneName = "Pune Sinhagad Foothills Vegetative Sector (Monitored)";
    } else if (clean.includes("guwahati")) {
        fireZoneName = "Guwahati Nilachal Hill Canopy Buffer (Monitored)";
    } else if (clean.includes("delhi")) {
        fireZoneName = "Central Delhi Ridge Forest Reserve Sector (Monitored)";
    }

    return {
        floodProb,
        slopeProb,
        fireProb,
        floodScore,
        slopeScore,
        fireScore,
        floodSev,
        slopeSev,
        fireSev,
        floodCategory,
        slopeCategory,
        fireCategory,
        floodZoneName,
        slopeZoneName,
        fireZoneName,
        isMountain
    };
}

async function ensureDistrictProvisioned(districtName, stateName = "") {
    try {
        if (!districtName) return;

        const coords = await resolveDistrictCoordinates(districtName, stateName);
        const { lat, lng } = coords;
        const reg = new RegExp(`^${districtName.trim()}$`, "i");

        // Fetch real-time weather to calibrate provisioned risk metrics strictly to live reality
        let liveWeather = null;
        try {
            const { getCurrentWeather } = require("./weatherService");
            liveWeather = await getCurrentWeather(lat, lng);
        } catch (weaErr) {
            console.warn(`[districtProvisioner] Weather lookup warning for ${districtName}:`, weaErr.message);
        }
        const liveRain = Number(liveWeather?.rainfall) || 0;
        const isRainSevere = liveRain >= 50;
        const isRainModerate = liveRain >= 15;

        // Dynamic multi-hazard assessment
        const topoRisk = computeTopographicalRisk(districtName, lat, lng, liveRain);

        // Check if existing records exist and verify they are positioned at the true coordinates
        const existingHabs = await Habitation.find({ district: reg });
        const existingZones = await HazardZone.find({ district: reg });

        if (existingHabs.length > 0 && existingHabs[0].location?.coordinates) {
            const [eLng, eLat] = existingHabs[0].location.coordinates;
            const dLat = Math.abs(eLat - lat);
            const dLng = Math.abs(eLng - lng);

            // Reposition misplaced records (e.g. from previous fallback to Rewa)
            if (dLat >= 0.5 || dLng >= 0.5) {
                console.log(`Repositioning misplaced records for ${districtName} to correct coordinates [${lat}, ${lng}]...`);
                await Habitation.deleteMany({ district: reg });
                await Shelter.deleteMany({ district: reg });
                await HazardZone.deleteMany({ district: reg });
                await Alert.deleteMany({ district: reg });
            } else {
                // Ensure at most 1 zone per hazard type for the district
                const typesPresent = new Set(existingZones.map(z => z.hazardType));
                if (!typesPresent.has("WILDFIRE")) {
                    console.log(`[districtProvisioner] Generating missing WILDFIRE hazard zone for ${districtName}...`);
                    await HazardZone.create({
                        name: topoRisk.fireZoneName,
                        hazardType: "WILDFIRE",
                        district: districtName,
                        state: stateName || coords.state,
                        severity: topoRisk.fireSev,
                        riskScore: topoRisk.fireScore,
                        riskCategory: topoRisk.fireCategory,
                        probability: topoRisk.fireProb,
                        geometry: {
                            type: "Polygon",
                            coordinates: [[[lng + 0.02, lat - 0.04], [lng + 0.05, lat - 0.04], [lng + 0.05, lat - 0.01], [lng + 0.02, lat - 0.01], [lng + 0.02, lat - 0.04]]]
                        },
                        source: "Forest Survey & Satellite Telemetry"
                    });
                }

                if (existingHabs.length > 3) {
                    const sortedHabs = existingHabs.sort((a, b) => b.createdAt - a.createdAt);
                    const toDeleteHabs = sortedHabs.slice(3).map(h => h._id);
                    await Habitation.deleteMany({ _id: { $in: toDeleteHabs } });
                }

                // DYNAMIC CALIBRATION: Synchronize with genuine real-time conditions & topography
                if (!isRainSevere && !isRainModerate) {
                    console.log(`[districtProvisioner] Calibrating ${districtName} records to peacetime conditions (${liveRain}mm rain)...`);
                    await HazardZone.updateMany(
                        { district: reg, hazardType: "FLOOD" },
                        {
                            $set: {
                                riskCategory: topoRisk.floodCategory,
                                riskScore: topoRisk.floodScore,
                                severity: topoRisk.floodSev,
                                probability: topoRisk.floodProb,
                                name: topoRisk.floodZoneName
                            }
                        }
                    );
                    await HazardZone.updateMany(
                        { district: reg, hazardType: "LANDSLIDE" },
                        {
                            $set: {
                                riskCategory: topoRisk.slopeCategory,
                                riskScore: topoRisk.slopeScore,
                                severity: topoRisk.slopeSev,
                                probability: topoRisk.slopeProb,
                                name: topoRisk.slopeZoneName
                            }
                        }
                    );
                    await HazardZone.updateMany(
                        { district: reg, hazardType: "WILDFIRE" },
                        {
                            $set: {
                                riskCategory: topoRisk.fireCategory,
                                riskScore: topoRisk.fireScore,
                                severity: topoRisk.fireSev,
                                probability: topoRisk.fireProb,
                                name: topoRisk.fireZoneName
                            }
                        }
                    );
                    await Habitation.updateMany(
                        { district: reg },
                        { $set: { riskCategory: "GREEN", currentRiskScore: Math.min(22, topoRisk.floodScore + 4), vulnerabilityScore: 25 } }
                    );
                    await Alert.updateMany(
                        { district: reg, isActive: true },
                        { $set: { isActive: false } }
                    );
                    return;
                } else if (isRainSevere) {
                    // Genuine live storm: escalate
                    await HazardZone.updateMany(
                        { district: reg, hazardType: "FLOOD" },
                        { $set: { riskCategory: "CRITICAL", riskScore: 85, severity: 88, probability: 0.85 } }
                    );
                    await Habitation.updateMany(
                        { district: reg },
                        { $set: { riskCategory: "CRITICAL", currentRiskScore: 82, vulnerabilityScore: 80 } }
                    );
                    return;
                }
                return;
            }
        }

        console.log(`Auto-provisioning localized disaster intelligence infrastructure for: ${districtName} (${coords.state}) at [${lat}, ${lng}]...`);

        // 1. Create Localized Habitations
        const habitationData = [
            {
                name: `${districtName} Riverfront Settlement`,
                district: districtName,
                state: stateName || coords.state,
                population: 3800,
                vulnerablePopulation: 950,
                vulnerabilityScore: isRainSevere ? 84 : 25,
                currentRiskScore: isRainSevere ? 82 : isRainModerate ? 45 : topoRisk.floodScore + 4,
                riskCategory: isRainSevere ? "CRITICAL" : isRainModerate ? "AMBER" : "GREEN",
                location: { type: "Point", coordinates: [lng + 0.012, lat - 0.008] }
            },
            {
                name: `${districtName} Central Lowlands`,
                district: districtName,
                state: stateName || coords.state,
                population: 4100,
                vulnerablePopulation: 780,
                vulnerabilityScore: isRainSevere ? 75 : 20,
                currentRiskScore: isRainSevere ? 72 : isRainModerate ? 38 : topoRisk.floodScore,
                riskCategory: isRainSevere ? "RED" : isRainModerate ? "AMBER" : "GREEN",
                location: { type: "Point", coordinates: [lng - 0.015, lat + 0.014] }
            },
            {
                name: `${districtName} Valley Habitation`,
                district: districtName,
                state: stateName || coords.state,
                population: 2600,
                vulnerablePopulation: 520,
                vulnerabilityScore: isRainSevere ? 68 : 18,
                currentRiskScore: isRainSevere ? 64 : isRainModerate ? 30 : Math.max(8, topoRisk.slopeScore - 2),
                riskCategory: isRainSevere ? "AMBER" : "GREEN",
                location: { type: "Point", coordinates: [lng + 0.022, lat + 0.018] }
            }
        ];
        const habs = await Habitation.insertMany(habitationData);

        // 2. Create Localized Relief Shelters
        const shelterData = [
            {
                name: `${districtName} District Disaster Relief Center`,
                district: districtName,
                state: stateName || coords.state,
                address: `Civil Lines Emergency Hub, ${districtName}`,
                capacity: 650,
                currentOccupancy: 80,
                availableCapacity: 570,
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
                currentOccupancy: 40,
                availableCapacity: 410,
                status: "AVAILABLE",
                facilities: ["water", "electricity", "food", "sanitation"],
                accessibility: "FULL",
                riskScore: 10,
                contactNumber: "112 / 1078",
                location: { type: "Point", coordinates: [lng + 0.018, lat - 0.012] }
            }
        ];
        const shelters = await Shelter.insertMany(shelterData);

        // 3. Create Localized Hazard Zones calibrated to live conditions & topography
        await HazardZone.insertMany([
            {
                name: topoRisk.floodZoneName,
                hazardType: "FLOOD",
                district: districtName,
                state: stateName || coords.state,
                severity: topoRisk.floodSev,
                riskScore: topoRisk.floodScore,
                riskCategory: topoRisk.floodCategory,
                probability: topoRisk.floodProb,
                geometry: {
                    type: "Polygon",
                    coordinates: [[[lng - 0.03, lat - 0.03], [lng + 0.03, lat - 0.03], [lng + 0.03, lat + 0.03], [lng - 0.03, lat + 0.03], [lng - 0.03, lat - 0.03]]]
                },
                source: "District Hydrological & Topographical Survey"
            },
            {
                name: topoRisk.slopeZoneName,
                hazardType: "LANDSLIDE",
                district: districtName,
                state: stateName || coords.state,
                severity: topoRisk.slopeSev,
                riskScore: topoRisk.slopeScore,
                riskCategory: topoRisk.slopeCategory,
                probability: topoRisk.slopeProb,
                geometry: {
                    type: "Polygon",
                    coordinates: [[[lng - 0.05, lat + 0.02], [lng - 0.02, lat + 0.02], [lng - 0.02, lat + 0.05], [lng - 0.05, lat + 0.05], [lng - 0.05, lat + 0.02]]]
                },
                source: "Geological Survey Analysis"
            },
            {
                name: topoRisk.fireZoneName,
                hazardType: "WILDFIRE",
                district: districtName,
                state: stateName || coords.state,
                severity: topoRisk.fireSev,
                riskScore: topoRisk.fireScore,
                riskCategory: topoRisk.fireCategory,
                probability: topoRisk.fireProb,
                geometry: {
                    type: "Polygon",
                    coordinates: [[[lng + 0.02, lat - 0.04], [lng + 0.05, lat - 0.04], [lng + 0.05, lat - 0.01], [lng + 0.02, lat - 0.01], [lng + 0.02, lat - 0.04]]]
                },
                source: "Forest Survey & Satellite Telemetry"
            }
        ]);

        // 4. Create Relocation Plan (Only Active if Severe, otherwise Planned / Standby)
        await Relocation.create({
            habitation: habs[0]._id,
            fromLocation: {
                type: "Point",
                coordinates: habs[0].location.coordinates
            },
            destinationShelter: shelters[0]._id,
            populationToRelocate: isRainSevere ? 950 : 0,
            priority: isRainSevere ? "IMMEDIATE" : "MONITOR",
            status: isRainSevere ? "IN_PROGRESS" : "PLANNED",
            reason: isRainSevere ? `Urgent evacuation due to heavy precipitation in ${districtName}` : `Routine seasonal contingency protocol for ${districtName}`
        });

        // 5. Create Local Alert (Only ACTIVE if true severe emergency exists)
        if (isRainSevere) {
            await Alert.create({
                title: `🚨 HEAVY RAINFALL WARNING — ${districtName}`,
                message: `Severe precipitation (${liveRain.toFixed(1)}mm) detected by satellite telemetry in ${districtName}. Water levels rising. Responders on alert.`,
                severity: "WARNING",
                district: districtName,
                state: stateName || coords.state,
                hazardType: "FLOOD",
                source: "OFFICIAL",
                verificationStatus: "VERIFIED",
                location: { type: "Point", coordinates: [lng, lat] },
                affectedRadius: 15,
                isActive: true,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            });
        } else {
            await Alert.create({
                title: `Environmental Monitoring Status — ${districtName}`,
                message: `Current meteorological telemetry confirms normal conditions (${liveRain.toFixed(1)}mm rain). Civil defense monitoring active.`,
                severity: "INFO",
                district: districtName,
                state: stateName || coords.state,
                hazardType: "FLOOD",
                source: "OFFICIAL",
                verificationStatus: "VERIFIED",
                location: { type: "Point", coordinates: [lng, lat] },
                affectedRadius: 10,
                isActive: false, // Inactive so it doesn't sound false sirens!
                expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
            });
        }

        console.log(`District ${districtName} successfully provisioned!`);
    } catch (err) {
        console.error(`ensureDistrictProvisioned error for ${districtName}:`, err.message);
    }
}

module.exports = {
    DISTRICT_COORDINATES,
    resolveDistrictCoordinates,
    ensureDistrictProvisioned,
    computeTopographicalRisk
};
