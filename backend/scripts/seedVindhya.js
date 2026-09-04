require("dotenv").config();
const mongoose = require("mongoose");
const Habitation = require("../models/Habitation");
const HazardZone = require("../models/HazardZone");
const Shelter = require("../models/Shelter");
const Alert = require("../models/Alert");
const CitizenReport = require("../models/CitizenReport");
const Relocation = require("../models/Relocation");
const User = require("../models/User");

async function seedVindhya() {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/AapdaNetraDB");
        console.log("Connected to MongoDB for Vindhya MP seeding");

        const citizenUser = await User.findOne({ email: "citizen@aapdanetra.in" });
        const repId = citizenUser ? citizenUser._id : new mongoose.Types.ObjectId();

        // Clear existing Vindhya/Rewa records
        await Habitation.deleteMany({ district: { $in: ["Vindhya", "Rewa"] } });
        await HazardZone.deleteMany({ district: { $in: ["Vindhya", "Rewa"] } });
        await Shelter.deleteMany({ district: { $in: ["Vindhya", "Rewa"] } });
        await Alert.deleteMany({ title: { $regex: /vindhya|bihar river/i } });

        // 1. Habitations in Vindhya Region (Rewa / Satna, MP)
        const habs = await Habitation.insertMany([
            {
                name: "Bichhiya Ward 14 (Rewa, Vindhya)",
                district: "Vindhya",
                state: "Madhya Pradesh",
                population: 4200,
                vulnerablePopulation: 1150,
                vulnerabilityScore: 88,
                currentRiskScore: 86,
                riskCategory: "CRITICAL",
                location: { type: "Point", coordinates: [81.3120, 24.5280] }
            },
            {
                name: "Sirmour Lowland Settlement (Vindhya)",
                district: "Vindhya",
                state: "Madhya Pradesh",
                population: 3500,
                vulnerablePopulation: 850,
                vulnerabilityScore: 82,
                currentRiskScore: 80,
                riskCategory: "RED",
                location: { type: "Point", coordinates: [81.3780, 24.8420] }
            },
            {
                name: "Ratahara Floodplain Basti (Rewa)",
                district: "Vindhya",
                state: "Madhya Pradesh",
                population: 2800,
                vulnerablePopulation: 620,
                vulnerabilityScore: 76,
                currentRiskScore: 74,
                riskCategory: "RED",
                location: { type: "Point", coordinates: [81.3280, 24.5510] }
            },
            {
                name: "Govindgarh Lakeside Habitation",
                district: "Vindhya",
                state: "Madhya Pradesh",
                population: 3100,
                vulnerablePopulation: 710,
                vulnerabilityScore: 68,
                currentRiskScore: 64,
                riskCategory: "AMBER",
                location: { type: "Point", coordinates: [81.2950, 24.3820] }
            }
        ]);
        console.log(`Seeded ${habs.length} Vindhya habitations`);

        // 2. Hazard Zones in Vindhya Region
        const hz = await HazardZone.insertMany([
            {
                name: "Bihar River Monsoon Inundation Zone (Vindhya)",
                hazardType: "FLOOD",
                district: "Vindhya",
                state: "Madhya Pradesh",
                severity: 88,
                riskScore: 86,
                riskCategory: "CRITICAL",
                probability: 0.82,
                geometry: {
                    type: "Polygon",
                    coordinates: [[[81.28, 24.51], [81.34, 24.51], [81.34, 24.56], [81.28, 24.56], [81.28, 24.51]]]
                },
                source: "MP State Disaster Authority (SDMA)"
            },
            {
                name: "Kaimur Hills Landslide Instability Sector",
                hazardType: "LANDSLIDE",
                district: "Vindhya",
                state: "Madhya Pradesh",
                severity: 74,
                riskScore: 72,
                riskCategory: "RED",
                probability: 0.60,
                geometry: {
                    type: "Polygon",
                    coordinates: [[[81.22, 24.45], [81.27, 24.45], [81.27, 24.50], [81.22, 24.50], [81.22, 24.45]]]
                },
                source: "GSI MP Survey"
            },
            {
                name: "Govindgarh Forest Wildfire Corridor",
                hazardType: "WILDFIRE",
                district: "Vindhya",
                state: "Madhya Pradesh",
                severity: 68,
                riskScore: 65,
                riskCategory: "RED",
                probability: 0.48,
                geometry: {
                    type: "Polygon",
                    coordinates: [[[81.26, 24.35], [81.32, 24.35], [81.32, 24.41], [81.26, 24.41], [81.26, 24.35]]]
                },
                source: "MP Forest Department"
            }
        ]);
        console.log(`Seeded ${hz.length} Vindhya hazard zones`);

        // 3. Shelters in Vindhya Region
        const shs = await Shelter.insertMany([
            {
                name: "Rewa Municipal Disaster Relief Center (Civil Lines)",
                district: "Vindhya",
                state: "Madhya Pradesh",
                address: "Civil Lines, Rewa, Vindhya MP",
                capacity: 600,
                currentOccupancy: 110,
                availableCapacity: 490,
                status: "AVAILABLE",
                facilities: ["water", "electricity", "medical", "food", "sanitation"],
                accessibility: "FULL",
                riskScore: 8,
                contactNumber: "07662-254100",
                location: { type: "Point", coordinates: [81.2980, 24.5410] }
            },
            {
                name: "Sirmour Government College Relief Shelter",
                district: "Vindhya",
                state: "Madhya Pradesh",
                address: "College Road, Sirmour, Vindhya MP",
                capacity: 450,
                currentOccupancy: 80,
                availableCapacity: 370,
                status: "AVAILABLE",
                facilities: ["water", "electricity", "food"],
                accessibility: "FULL",
                riskScore: 12,
                contactNumber: "07662-261200",
                location: { type: "Point", coordinates: [81.3820, 24.8390] }
            },
            {
                name: "Vindhya Sanskritik Kendra Emergency Hub",
                district: "Vindhya",
                state: "Madhya Pradesh",
                address: "Kendra Marg, Rewa, MP",
                capacity: 800,
                currentOccupancy: 140,
                availableCapacity: 660,
                status: "AVAILABLE",
                facilities: ["water", "electricity", "medical", "food", "generator"],
                accessibility: "FULL",
                riskScore: 5,
                contactNumber: "07662-258900",
                location: { type: "Point", coordinates: [81.3050, 24.5320] }
            },
            {
                name: "Govindgarh Community Relief Complex",
                district: "Vindhya",
                state: "Madhya Pradesh",
                address: "Near Govindgarh Fort, Rewa MP",
                capacity: 350,
                currentOccupancy: 50,
                availableCapacity: 300,
                status: "AVAILABLE",
                facilities: ["water", "sanitation", "food"],
                accessibility: "FULL",
                riskScore: 6,
                contactNumber: "07662-273100",
                location: { type: "Point", coordinates: [81.2910, 24.3850] }
            }
        ]);
        console.log(`Seeded ${shs.length} Vindhya shelters`);

        // 4. Alerts
        await Alert.insertMany([
            {
                title: "FLOOD WARNING — Bihar & Tons River Water Surge (Vindhya)",
                message: "Water levels in Bihar river inundating low-lying habitations in Bichhiya and Ratahara. Residents on riverbanks must evacuate to municipal relief centers.",
                severity: "CRITICAL",
                hazardType: "FLOOD",
                source: "OFFICIAL",
                verificationStatus: "VERIFIED",
                location: { type: "Point", coordinates: [81.3120, 24.5280] },
                affectedRadius: 15,
                isActive: true,
                expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
            },
            {
                title: "Heavy Monsoon Downpour Advisory — Rewa & Satna Basin",
                message: "Heavy localized precipitation (110mm+) active in Vindhya plateau drainage catchment. Preparedness standby activated.",
                severity: "HIGH",
                hazardType: "FLOOD",
                source: "OFFICIAL",
                verificationStatus: "VERIFIED",
                isActive: true,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            },
            {
                title: "Kaimur Escarpment Soil Saturation Advisory",
                message: "Sustained rain in Kaimur ranges elevating slope shear stress. Monitor road transit corridors for rockfall.",
                severity: "WARNING",
                hazardType: "LANDSLIDE",
                source: "AI_PREDICTION",
                verificationStatus: "UNVERIFIED",
                location: { type: "Point", coordinates: [81.2500, 24.4800] },
                affectedRadius: 10,
                isActive: true,
                expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000)
            }
        ]);

        // 5. Citizen Reports
        await CitizenReport.insertMany([
            {
                reporter: repId,
                description: "Bihar river water entered Bichhiya ward market area. 2 feet of water on the main street.",
                location: { type: "Point", coordinates: [81.3150, 24.5300] },
                disasterType: "FLOOD",
                severity: "CRITICAL",
                category: "Road flooding",
                priority: "CRITICAL",
                status: "VERIFIED",
                aiClassification: { disasterType: "FLOOD", severity: "CRITICAL", category: "Road flooding", priority: "CRITICAL", confidence: 0.92 }
            },
            {
                reporter: repId,
                description: "Minor rock and gravel slipping onto the road near Kaimur ghat section.",
                location: { type: "Point", coordinates: [81.2520, 24.4810] },
                disasterType: "LANDSLIDE",
                severity: "HIGH",
                category: "Road blockage",
                priority: "HIGH",
                status: "VERIFIED",
                aiClassification: { disasterType: "LANDSLIDE", severity: "HIGH", category: "Road blockage", priority: "HIGH", confidence: 0.84 }
            }
        ]);

        // 6. Relocation Plan
        await Relocation.create({
            habitation: habs[0]._id,
            fromLocation: {
                type: "Point",
                coordinates: habs[0].location.coordinates
            },
            destinationShelter: shs[0]._id,
            populationToRelocate: 1150,
            priority: "IMMEDIATE",
            status: "PLANNED",
            reason: "Critical flood inundation from Bihar river monsoon surge"
        });

        console.log("Successfully seeded Vindhya (Madhya Pradesh) region into MongoDB!");
        process.exit(0);
    } catch (err) {
        console.error("Vindhya seed error:", err);
        process.exit(1);
    }
}

seedVindhya();
