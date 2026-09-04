require("dotenv").config();
const mongoose = require("mongoose");
const Habitation = require("../models/Habitation");
const HazardZone = require("../models/HazardZone");
const Shelter = require("../models/Shelter");
const Alert = require("../models/Alert");
const CitizenReport = require("../models/CitizenReport");
const Relocation = require("../models/Relocation");
const User = require("../models/User");

async function seedGuwahati() {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/AapdaNetraDB");
        console.log("Connected to MongoDB for Guwahati seeding");

        const citizenUser = await User.findOne({ email: "citizen@aapdanetra.in" });
        const repId = citizenUser ? citizenUser._id : new mongoose.Types.ObjectId();

        // Clear existing Guwahati records to update cleanly
        await Habitation.deleteMany({ district: { $regex: /guwahati/i } });
        await HazardZone.deleteMany({ district: { $regex: /guwahati/i } });
        await Shelter.deleteMany({ district: { $regex: /guwahati/i } });
        await Alert.deleteMany({ $or: [{ district: { $regex: /guwahati/i } }, { title: { $regex: /guwahati|brahmaputra/i } }] });

        // 1. Habitations in Guwahati
        const habs = await Habitation.insertMany([
            {
                name: "Bharalumukh Riverside Settlement (Guwahati)",
                district: "Guwahati",
                state: "Assam",
                population: 4500,
                vulnerablePopulation: 1200,
                vulnerabilityScore: 90,
                currentRiskScore: 88,
                riskCategory: "CRITICAL",
                location: { type: "Point", coordinates: [91.7310, 26.1820] }
            },
            {
                name: "Pandu Ghat Lowland Community",
                district: "Guwahati",
                state: "Assam",
                population: 3800,
                vulnerablePopulation: 950,
                vulnerabilityScore: 84,
                currentRiskScore: 82,
                riskCategory: "RED",
                location: { type: "Point", coordinates: [91.6920, 26.1680] }
            },
            {
                name: "Boragaon Deepor Beel Settlement",
                district: "Guwahati",
                state: "Assam",
                population: 3100,
                vulnerablePopulation: 720,
                vulnerabilityScore: 78,
                currentRiskScore: 76,
                riskCategory: "RED",
                location: { type: "Point", coordinates: [91.6780, 26.1280] }
            },
            {
                name: "Uzan Bazar Ward 12",
                district: "Guwahati",
                state: "Assam",
                population: 2900,
                vulnerablePopulation: 510,
                vulnerabilityScore: 70,
                currentRiskScore: 68,
                riskCategory: "AMBER",
                location: { type: "Point", coordinates: [91.7610, 26.1910] }
            }
        ]);
        console.log(`Seeded ${habs.length} Guwahati habitations`);

        // 2. Hazard Zones in Guwahati
        const hz = await HazardZone.insertMany([
            {
                name: "Brahmaputra River Inundation Sector (Guwahati)",
                hazardType: "FLOOD",
                district: "Guwahati",
                state: "Assam",
                severity: 90,
                riskScore: 88,
                riskCategory: "CRITICAL",
                probability: 0.85,
                geometry: {
                    type: "Polygon",
                    coordinates: [[[91.70, 26.16], [91.78, 26.16], [91.78, 26.20], [91.70, 26.20], [91.70, 26.16]]]
                },
                source: "Assam State Disaster Management Authority (ASDMA)"
            },
            {
                name: "Kamakhya & Nilachal Hills Landslide Zone",
                hazardType: "LANDSLIDE",
                district: "Guwahati",
                state: "Assam",
                severity: 80,
                riskScore: 78,
                riskCategory: "RED",
                probability: 0.65,
                geometry: {
                    type: "Polygon",
                    coordinates: [[[91.69, 26.14], [91.73, 26.14], [91.73, 26.17], [91.69, 26.17], [91.69, 26.14]]]
                },
                source: "GSI North East Circle Survey"
            },
            {
                name: "Deepor Beel Waterlogging & Wetland Buffer",
                hazardType: "FLOOD",
                district: "Guwahati",
                state: "Assam",
                severity: 75,
                riskScore: 72,
                riskCategory: "RED",
                probability: 0.60,
                geometry: {
                    type: "Polygon",
                    coordinates: [[[91.65, 26.10], [91.70, 26.10], [91.70, 26.14], [91.65, 26.14], [91.65, 26.10]]]
                },
                source: "Guwahati Municipal Corporation Flood Cell"
            }
        ]);
        console.log(`Seeded ${hz.length} Guwahati hazard zones`);

        // 3. Shelters in Guwahati
        const shs = await Shelter.insertMany([
            {
                name: "Sarusajai Indoor Stadium Mega Relief Center",
                district: "Guwahati",
                state: "Assam",
                address: "National Games Stadium Complex, Lokhra Road, Guwahati",
                capacity: 1200,
                currentOccupancy: 220,
                availableCapacity: 980,
                status: "AVAILABLE",
                facilities: ["water", "electricity", "medical", "food", "sanitation", "generator"],
                accessibility: "FULL",
                riskScore: 5,
                contactNumber: "0361-2237001",
                location: { type: "Point", coordinates: [91.7580, 26.1120] }
            },
            {
                name: "Cotton University Panbazar Emergency Shelter",
                district: "Guwahati",
                state: "Assam",
                address: "Panbazar, Near Dighalipukhuri, Guwahati",
                capacity: 600,
                currentOccupancy: 110,
                availableCapacity: 490,
                status: "AVAILABLE",
                facilities: ["water", "electricity", "medical", "food"],
                accessibility: "FULL",
                riskScore: 8,
                contactNumber: "0361-2540200",
                location: { type: "Point", coordinates: [91.7480, 26.1880] }
            },
            {
                name: "Gauhati Commerce College Relief Camp",
                district: "Guwahati",
                state: "Assam",
                address: "R.G. Baruah Road, Chandmari, Guwahati",
                capacity: 450,
                currentOccupancy: 90,
                availableCapacity: 360,
                status: "AVAILABLE",
                facilities: ["water", "electricity", "food", "sanitation"],
                accessibility: "FULL",
                riskScore: 10,
                contactNumber: "0361-2415100",
                location: { type: "Point", coordinates: [91.7780, 26.1840] }
            },
            {
                name: "Dispur Government High School Relief Hub",
                district: "Guwahati",
                state: "Assam",
                address: "Capital Complex, Dispur, Guwahati",
                capacity: 500,
                currentOccupancy: 90,
                availableCapacity: 410,
                status: "AVAILABLE",
                facilities: ["water", "electricity", "food"],
                accessibility: "FULL",
                riskScore: 6,
                contactNumber: "0361-2261300",
                location: { type: "Point", coordinates: [91.7890, 26.1420] }
            }
        ]);
        console.log(`Seeded ${shs.length} Guwahati shelters`);

        // 4. Alerts specifically for Guwahati
        await Alert.insertMany([
            {
                title: "BRAHMAPUTRA FLOOD WARNING — River Rising Above Danger Level (Pandu)",
                message: "Brahmaputra river gauge at Pandu reached 49.85m (danger level: 49.68m). Riverfront wards in Bharalumukh and Pandu must immediately activate flood protocols.",
                severity: "CRITICAL",
                hazardType: "FLOOD",
                district: "Guwahati",
                state: "Assam",
                source: "OFFICIAL",
                verificationStatus: "VERIFIED",
                location: { type: "Point", coordinates: [91.7310, 26.1820] },
                affectedRadius: 12,
                isActive: true,
                expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
            },
            {
                title: "Urban Flash Flood & Waterlogging Warning — Bharalu Basin (Guwahati)",
                message: "Intense precipitation (130mm+) causing urban flash floods across GS Road, Zoo Road, and Bharalu drainage outfall. Emergency pumping initiated.",
                severity: "HIGH",
                hazardType: "FLOOD",
                district: "Guwahati",
                state: "Assam",
                source: "OFFICIAL",
                verificationStatus: "VERIFIED",
                location: { type: "Point", coordinates: [91.7500, 26.1600] },
                affectedRadius: 10,
                isActive: true,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            },
            {
                title: "Kamakhya & Nilachal Hills Landslide & Rockfall Advisory",
                message: "Continuous downpours have oversaturated Nilachal hill slopes. High landslide susceptibility on Kamakhya Temple access road.",
                severity: "WARNING",
                hazardType: "LANDSLIDE",
                district: "Guwahati",
                state: "Assam",
                source: "AI_PREDICTION",
                verificationStatus: "UNVERIFIED",
                location: { type: "Point", coordinates: [91.7050, 26.1650] },
                affectedRadius: 8,
                isActive: true,
                expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000)
            }
        ]);

        // 5. Citizen Reports for Guwahati
        await CitizenReport.insertMany([
            {
                reporter: repId,
                description: "Brahmaputra flood water overflowing onto MG road near Bharalumukh. Vehicles stalled and water entering ground floors.",
                location: { type: "Point", coordinates: [91.7320, 26.1830] },
                disasterType: "FLOOD",
                severity: "CRITICAL",
                category: "Road flooding",
                priority: "CRITICAL",
                status: "VERIFIED",
                aiClassification: { disasterType: "FLOOD", severity: "CRITICAL", category: "Road flooding", priority: "CRITICAL", confidence: 0.94 }
            },
            {
                reporter: repId,
                description: "Loose rocks and wet mud sliding onto the main pathway near Kamakhya foothills.",
                location: { type: "Point", coordinates: [91.7080, 26.1620] },
                disasterType: "LANDSLIDE",
                severity: "HIGH",
                category: "Road blockage",
                priority: "HIGH",
                status: "VERIFIED",
                aiClassification: { disasterType: "LANDSLIDE", severity: "HIGH", category: "Road blockage", priority: "HIGH", confidence: 0.88 }
            }
        ]);

        // 6. Relocation Plan for Guwahati
        await Relocation.create({
            habitation: habs[0]._id,
            fromLocation: {
                type: "Point",
                coordinates: habs[0].location.coordinates
            },
            destinationShelter: shs[1]._id,
            populationToRelocate: 1200,
            priority: "IMMEDIATE",
            status: "PLANNED",
            reason: "Critical river inundation from Brahmaputra surge at Bharalumukh"
        });

        console.log("Successfully seeded authentic Guwahati (Assam) disaster intelligence into MongoDB!");
        process.exit(0);
    } catch (err) {
        console.error("Guwahati seed error:", err);
        process.exit(1);
    }
}

seedGuwahati();
