require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dns = require("dns");
try { dns.setServers(["8.8.8.8", "1.1.1.1", ...dns.getServers()]); } catch (e) {}

const User = require("../models/User");
const Habitation = require("../models/Habitation");
const HazardZone = require("../models/HazardZone");
const Shelter = require("../models/Shelter");
const Alert = require("../models/Alert");
const RiskAssessment = require("../models/RiskAssessment");
const CitizenReport = require("../models/CitizenReport");
const Relocation = require("../models/Relocation");

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            Habitation.deleteMany({}),
            HazardZone.deleteMany({}),
            Shelter.deleteMany({}),
            Alert.deleteMany({}),
            RiskAssessment.deleteMany({}),
            CitizenReport.deleteMany({}),
            Relocation.deleteMany({})
        ]);
        console.log("Cleared existing data");

        // 1. Users
        const hashedPassword = await bcrypt.hash("password123", 12);
        const users = await User.insertMany([
            { name: "Admin User", email: "admin@aapdanetra.in", password: hashedPassword, role: "ADMIN", district: "Central Delhi", state: "Delhi" },
            { name: "District Officer", email: "officer@aapdanetra.in", password: hashedPassword, role: "DISTRICT_OFFICER", district: "Central Delhi", state: "Delhi" },
            { name: "Field Officer", email: "field@aapdanetra.in", password: hashedPassword, role: "FIELD_OFFICER", district: "East Delhi", state: "Delhi" },
            { name: "Responder Team Lead", email: "responder@aapdanetra.in", password: hashedPassword, role: "RESPONDER", district: "South Delhi", state: "Delhi" },
            { name: "Citizen User", email: "citizen@aapdanetra.in", password: hashedPassword, role: "CITIZEN", district: "North Delhi", state: "Delhi" }
        ]);
        console.log(`Seeded ${users.length} users`);

        // 2. Habitations
        const habitations = await Habitation.insertMany([
            { name: "Kunda Basti, Ward 7", district: "Central Delhi", state: "Delhi", population: 3120, vulnerablePopulation: 820, vulnerabilityScore: 88, currentRiskScore: 82, riskCategory: "CRITICAL", location: { type: "Point", coordinates: [77.2090, 28.6280] } },
            { name: "Nala Colony", district: "East Delhi", state: "Delhi", population: 1980, vulnerablePopulation: 510, vulnerabilityScore: 78, currentRiskScore: 74, riskCategory: "RED", location: { type: "Point", coordinates: [77.2750, 28.6150] } },
            { name: "Ghat Para", district: "North Delhi", state: "Delhi", population: 1400, vulnerablePopulation: 380, vulnerabilityScore: 65, currentRiskScore: 58, riskCategory: "RED", location: { type: "Point", coordinates: [77.1950, 28.6800] } },
            { name: "Station Road Settlement", district: "South Delhi", state: "Delhi", population: 850, vulnerablePopulation: 120, vulnerabilityScore: 35, currentRiskScore: 28, riskCategory: "AMBER", location: { type: "Point", coordinates: [77.2280, 28.5700] } },
            { name: "Yamuna Vihar Colony", district: "East Delhi", state: "Delhi", population: 4500, vulnerablePopulation: 1200, vulnerabilityScore: 92, currentRiskScore: 88, riskCategory: "CRITICAL", location: { type: "Point", coordinates: [77.2800, 28.6350] } },
            { name: "Rohini Sector 22", district: "North West Delhi", state: "Delhi", population: 6200, vulnerablePopulation: 400, vulnerabilityScore: 22, currentRiskScore: 15, riskCategory: "GREEN", location: { type: "Point", coordinates: [77.1100, 28.7350] } },
            { name: "Dwarka Phase 2", district: "South West Delhi", state: "Delhi", population: 8500, vulnerablePopulation: 600, vulnerabilityScore: 18, currentRiskScore: 12, riskCategory: "GREEN", location: { type: "Point", coordinates: [77.0450, 28.5920] } },
            { name: "Jangpura Extension", district: "South East Delhi", state: "Delhi", population: 2100, vulnerablePopulation: 340, vulnerabilityScore: 52, currentRiskScore: 45, riskCategory: "AMBER", location: { type: "Point", coordinates: [77.2420, 28.5850] } },
            { name: "Burari Village", district: "North Delhi", state: "Delhi", population: 5200, vulnerablePopulation: 1400, vulnerabilityScore: 72, currentRiskScore: 65, riskCategory: "RED", location: { type: "Point", coordinates: [77.1950, 28.7500] } },
            { name: "Trilokpuri Block 32", district: "East Delhi", state: "Delhi", population: 3800, vulnerablePopulation: 980, vulnerabilityScore: 80, currentRiskScore: 70, riskCategory: "RED", location: { type: "Point", coordinates: [77.3050, 28.6080] } }
        ]);
        console.log(`Seeded ${habitations.length} habitations`);

        // 3. Hazard Zones
        const hazards = await HazardZone.insertMany([
            { name: "Yamuna Flood Plain R-12", hazardType: "FLOOD", district: "Central Delhi", state: "Delhi", severity: 85, riskScore: 82, riskCategory: "CRITICAL", probability: 0.78, geometry: { type: "Polygon", coordinates: [[[77.20, 28.62], [77.22, 28.62], [77.22, 28.64], [77.20, 28.64], [77.20, 28.62]]] }, source: "NDMA Survey 2025" },
            { name: "Landslide Zone L-4 Ridge Area", hazardType: "LANDSLIDE", district: "South Delhi", state: "Delhi", severity: 70, riskScore: 68, riskCategory: "RED", probability: 0.55, geometry: { type: "Polygon", coordinates: [[[77.18, 28.56], [77.20, 28.56], [77.20, 28.58], [77.18, 28.58], [77.18, 28.56]]] }, source: "GSI Report 2024" },
            { name: "East Delhi Flood Zone R-15", hazardType: "FLOOD", district: "East Delhi", state: "Delhi", severity: 75, riskScore: 72, riskCategory: "RED", probability: 0.65, geometry: { type: "Polygon", coordinates: [[[77.27, 28.61], [77.30, 28.61], [77.30, 28.64], [77.27, 28.64], [77.27, 28.61]]] }, source: "DDA Flood Map" },
            { name: "Rohini Heatwave Zone", hazardType: "HEATWAVE", district: "North West Delhi", state: "Delhi", severity: 55, riskScore: 48, riskCategory: "AMBER", probability: 0.45, geometry: { type: "Polygon", coordinates: [[[77.10, 28.72], [77.13, 28.72], [77.13, 28.74], [77.10, 28.74], [77.10, 28.72]]] }, source: "IMD Alert" },
            { name: "Asola Wildlife Fire Zone", hazardType: "WILDFIRE", district: "South Delhi", state: "Delhi", severity: 60, riskScore: 55, riskCategory: "RED", probability: 0.40, geometry: { type: "Polygon", coordinates: [[[77.24, 28.44], [77.28, 28.44], [77.28, 28.48], [77.24, 28.48], [77.24, 28.44]]] }, source: "Forest Dept" },
            { name: "Burari North Flood Risk", hazardType: "FLOOD", district: "North Delhi", state: "Delhi", severity: 65, riskScore: 60, riskCategory: "RED", probability: 0.58, geometry: { type: "Polygon", coordinates: [[[77.18, 28.74], [77.21, 28.74], [77.21, 28.76], [77.18, 28.76], [77.18, 28.74]]] }, source: "CWC Data" }
        ]);
        console.log(`Seeded ${hazards.length} hazard zones`);

        // 4. Shelters
        const shelters = await Shelter.insertMany([
            { name: "NDRF Shelter - Connaught Place", district: "Central Delhi", state: "Delhi", address: "Near CP Metro Station", capacity: 500, currentOccupancy: 120, availableCapacity: 380, status: "AVAILABLE", facilities: ["water", "electricity", "medical", "food", "sanitation"], accessibility: "FULL", riskScore: 8, contactNumber: "011-23456789", location: { type: "Point", coordinates: [77.2195, 28.6315] } },
            { name: "Community Hall - Laxmi Nagar", district: "East Delhi", state: "Delhi", address: "Laxmi Nagar Main Road", capacity: 300, currentOccupancy: 85, availableCapacity: 215, status: "AVAILABLE", facilities: ["water", "electricity", "food"], accessibility: "FULL", riskScore: 15, contactNumber: "011-22345678", location: { type: "Point", coordinates: [77.2770, 28.6310] } },
            { name: "Sports Complex - Rohini", district: "North West Delhi", state: "Delhi", address: "Sector 15, Rohini", capacity: 800, currentOccupancy: 50, availableCapacity: 750, status: "AVAILABLE", facilities: ["water", "electricity", "medical", "food", "sanitation", "generator"], accessibility: "FULL", riskScore: 5, contactNumber: "011-27891234", location: { type: "Point", coordinates: [77.1180, 28.7280] } },
            { name: "School Building - Dwarka", district: "South West Delhi", state: "Delhi", address: "Sector 10, Dwarka", capacity: 400, currentOccupancy: 0, availableCapacity: 400, status: "AVAILABLE", facilities: ["water", "electricity", "sanitation"], accessibility: "FULL", riskScore: 3, contactNumber: "011-25678901", location: { type: "Point", coordinates: [77.0480, 28.5880] } },
            { name: "Relief Camp - ITO", district: "Central Delhi", state: "Delhi", address: "Near ITO Bridge", capacity: 250, currentOccupancy: 200, availableCapacity: 50, status: "NEAR_CAPACITY", facilities: ["water", "medical", "food"], accessibility: "PARTIAL", riskScore: 35, contactNumber: "011-23456780", location: { type: "Point", coordinates: [77.2410, 28.6290] } },
            { name: "Temple Complex - Karol Bagh", district: "Central Delhi", state: "Delhi", address: "Ajmal Khan Road", capacity: 200, currentOccupancy: 30, availableCapacity: 170, status: "AVAILABLE", facilities: ["water", "food"], accessibility: "PARTIAL", riskScore: 12, contactNumber: "011-25432100", location: { type: "Point", coordinates: [77.1900, 28.6520] } }
        ]);
        console.log(`Seeded ${shelters.length} shelters`);

        // 5. Alerts
        const alerts = await Alert.insertMany([
            { title: "FLOOD WARNING — Yamuna Water Level Rising", message: "Yamuna water level at 205.5m (danger mark: 205.33m). Low-lying areas near Yamuna flood plain should prepare for evacuation.", severity: "CRITICAL", hazardType: "FLOOD", source: "OFFICIAL", verificationStatus: "VERIFIED", location: { type: "Point", coordinates: [77.2090, 28.6280] }, affectedRadius: 10, isActive: true, expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) },
            { title: "Heavy Rainfall Alert — East Delhi", message: "IMD predicts heavy rainfall (120mm+) in next 24 hours for East Delhi. Waterlogging expected in low-lying areas.", severity: "HIGH", hazardType: "FLOOD", source: "OFFICIAL", verificationStatus: "VERIFIED", isActive: true, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
            { title: "AI Prediction — Landslide Risk Elevated", message: "AI models indicate increased landslide risk near Ridge area due to sustained rainfall and soil saturation. Risk score: 68/100.", severity: "WARNING", hazardType: "LANDSLIDE", source: "AI_PREDICTION", verificationStatus: "UNVERIFIED", location: { type: "Point", coordinates: [77.1900, 28.5700] }, affectedRadius: 5, isActive: true, expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000) },
            { title: "Heatwave Advisory — North West Delhi", message: "Temperature expected to exceed 44°C. Avoid outdoor activities between 11AM-4PM. Stay hydrated.", severity: "WARNING", hazardType: "HEATWAVE", source: "OFFICIAL", verificationStatus: "VERIFIED", isActive: true, expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000) }
        ]);
        console.log(`Seeded ${alerts.length} alerts`);

        // 6. Citizen Reports
        const citizenReports = await CitizenReport.insertMany([
            { reporter: users[4]._id, description: "Heavy water logging on the main road near Yamuna Vihar. Water is knee-deep and rising. Vehicles stuck.", location: { type: "Point", coordinates: [77.2780, 28.6330] }, disasterType: "FLOOD", severity: "HIGH", category: "Road flooding", priority: "HIGH", status: "VERIFIED", aiClassification: { disasterType: "FLOOD", severity: "HIGH", category: "Road flooding", priority: "HIGH", confidence: 0.85 }, verifiedBy: users[3]._id, verifiedAt: new Date() },
            { reporter: users[4]._id, description: "I see smoke coming from the forest area near Asola. Looks like a small fire is spreading.", location: { type: "Point", coordinates: [77.2550, 28.4600] }, disasterType: "WILDFIRE", severity: "MEDIUM", category: "Forest fire", priority: "HIGH", status: "UNDER_REVIEW", aiClassification: { disasterType: "WILDFIRE", severity: "MEDIUM", category: "Forest fire", priority: "HIGH", confidence: 0.78 } },
            { reporter: users[4]._id, description: "Minor cracks noticed on the wall of our house after tremors felt this morning. Building is old.", location: { type: "Point", coordinates: [77.2100, 28.6400] }, disasterType: "EARTHQUAKE", severity: "MEDIUM", category: "Structural damage", priority: "MEDIUM", status: "SUBMITTED", aiClassification: { disasterType: "EARTHQUAKE", severity: "MEDIUM", category: "Structural damage", priority: "MEDIUM", confidence: 0.65 } },
            { reporter: users[4]._id, description: "The drain near Nala Colony is overflowing. Dirty water entering houses. Need urgent help.", location: { type: "Point", coordinates: [77.2740, 28.6140] }, disasterType: "FLOOD", severity: "CRITICAL", category: "Residential flooding", priority: "CRITICAL", status: "VERIFIED", aiClassification: { disasterType: "FLOOD", severity: "CRITICAL", category: "Residential flooding", priority: "CRITICAL", confidence: 0.90 }, verifiedBy: users[1]._id, verifiedAt: new Date() },
            { reporter: users[4]._id, description: "Road partially blocked by mud and rocks near Ridge road. Possibly small landslide after heavy rain.", location: { type: "Point", coordinates: [77.1920, 28.5750] }, disasterType: "LANDSLIDE", severity: "MEDIUM", category: "Road blockage", priority: "MEDIUM", status: "SUBMITTED", aiClassification: { disasterType: "LANDSLIDE", severity: "MEDIUM", category: "Road blockage", priority: "MEDIUM", confidence: 0.72 } }
        ]);
        console.log(`Seeded ${citizenReports.length} citizen reports`);

        // 7. Risk Assessments
        const riskAssessments = await RiskAssessment.insertMany([
            { habitation: habitations[0]._id, hazardZone: hazards[0]._id, hazardType: "FLOOD", hazardScore: 85, exposureScore: 90, vulnerabilityScore: 88, capacityDeficitScore: 45, mlProbability: 0.78, finalRiskScore: 82, riskCategory: "CRITICAL" },
            { habitation: habitations[1]._id, hazardZone: hazards[2]._id, hazardType: "FLOOD", hazardScore: 72, exposureScore: 75, vulnerabilityScore: 78, capacityDeficitScore: 35, mlProbability: 0.65, finalRiskScore: 74, riskCategory: "RED" },
            { habitation: habitations[4]._id, hazardZone: hazards[0]._id, hazardType: "FLOOD", hazardScore: 88, exposureScore: 92, vulnerabilityScore: 92, capacityDeficitScore: 55, mlProbability: 0.82, finalRiskScore: 88, riskCategory: "CRITICAL" },
            { habitation: habitations[2]._id, hazardType: "FLOOD", hazardScore: 58, exposureScore: 60, vulnerabilityScore: 65, capacityDeficitScore: 30, mlProbability: 0.48, finalRiskScore: 58, riskCategory: "RED" }
        ]);
        console.log(`Seeded ${riskAssessments.length} risk assessments`);

        // 8. Relocations
        const relocations = await Relocation.insertMany([
            { habitation: habitations[0]._id, fromLocation: habitations[0].location, destinationShelter: shelters[0]._id, priority: "IMMEDIATE", populationToRelocate: 820, reason: "Yamuna floodplain water level exceeded danger mark (205.5m)", status: "IN_PROGRESS", approvedBy: users[1]._id, approvedAt: new Date(Date.now() - 3 * 3600000) },
            { habitation: habitations[4]._id, fromLocation: habitations[4].location, destinationShelter: shelters[1]._id, priority: "IMMEDIATE", populationToRelocate: 1200, reason: "High waterlogging in low-lying sector; stormwater overflow", status: "APPROVED", approvedBy: users[0]._id, approvedAt: new Date(Date.now() - 5 * 3600000) },
            { habitation: habitations[1]._id, fromLocation: habitations[1].location, destinationShelter: shelters[1]._id, priority: "SHORT_TERM", populationToRelocate: 510, reason: "Drainage channel backflow risk during sustained rainfall", status: "PLANNED" },
            { habitation: habitations[2]._id, fromLocation: habitations[2].location, destinationShelter: shelters[4]._id, priority: "SHORT_TERM", populationToRelocate: 380, reason: "Proximity to northern flood bund; preventive relocation", status: "IN_PROGRESS", approvedBy: users[1]._id, approvedAt: new Date(Date.now() - 12 * 3600000) },
            { habitation: habitations[8]._id, fromLocation: habitations[8].location, destinationShelter: shelters[2]._id, priority: "MEDIUM_TERM", populationToRelocate: 650, reason: "Secondary runoff basin inundation advisory", status: "COMPLETED", approvedBy: users[0]._id, approvedAt: new Date(Date.now() - 24 * 3600000) },
            { habitation: habitations[3]._id, fromLocation: habitations[3].location, destinationShelter: shelters[5]._id, priority: "MONITOR", populationToRelocate: 120, reason: "Sloped area vulnerable to minor soil displacement", status: "PLANNED" }
        ]);
        console.log(`Seeded ${relocations.length} relocation plans`);

        console.log("\n✅ Database seeded successfully!");
        console.log("\nTest Accounts:");
        console.log("  Admin:    admin@aapdanetra.in / password123");
        console.log("  Officer:  officer@aapdanetra.in / password123");
        console.log("  Field:    field@aapdanetra.in / password123");
        console.log("  Responder: responder@aapdanetra.in / password123");
        console.log("  Citizen:  citizen@aapdanetra.in / password123\n");

        process.exit(0);
    } catch (error) {
        console.error("Seed error:", error);
        process.exit(1);
    }
};

seed();
