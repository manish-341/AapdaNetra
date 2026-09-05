const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Alert = require('../models/Alert');
const Shelter = require('../models/Shelter');
const Habitation = require('../models/Habitation');
const HazardZone = require('../models/HazardZone');

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB Atlas');

        // 1. Ensure Critical Alert for Bhopal is ACTIVE and properly keyed
        let bhopalAlert = await Alert.findOne({
            $or: [
                { district: /bhopal/i },
                { title: /bhopal/i }
            ]
        });

        if (bhopalAlert) {
            bhopalAlert.district = 'Bhopal';
            bhopalAlert.state = 'Madhya Pradesh';
            bhopalAlert.severity = 'CRITICAL';
            bhopalAlert.hazardType = 'FLOOD';
            bhopalAlert.title = '🚨 RED ALERT — Critical Flash Flood & Evacuation Order (Bhopal)';
            bhopalAlert.message = 'Extreme cloudburst surge detected in Upper Lake / Bada Talab basin. Water levels at 1668.5 ft exceeding breach threshold. Civil defense sirens and mandatory evacuation in effect.';
            bhopalAlert.isActive = true;
            bhopalAlert.location = {
                type: 'Point',
                coordinates: [77.4126, 23.2599]
            };
            bhopalAlert.affectedRadius = 35;
            bhopalAlert.verificationStatus = 'VERIFIED';
            await bhopalAlert.save();
            console.log('Updated existing Bhopal alert to CRITICAL & ACTIVE:', bhopalAlert._id);
        } else {
            bhopalAlert = await Alert.create({
                title: '🚨 RED ALERT — Critical Flash Flood & Evacuation Order (Bhopal)',
                message: 'Extreme cloudburst surge detected in Upper Lake / Bada Talab basin. Water levels at 1668.5 ft exceeding breach threshold. Civil defense sirens and mandatory evacuation in effect.',
                severity: 'CRITICAL',
                hazardType: 'FLOOD',
                district: 'Bhopal',
                state: 'Madhya Pradesh',
                source: 'OFFICIAL',
                verificationStatus: 'VERIFIED',
                isActive: true,
                affectedRadius: 35,
                location: {
                    type: 'Point',
                    coordinates: [77.4126, 23.2599]
                }
            });
            console.log('Created new Bhopal CRITICAL alert:', bhopalAlert._id);
        }

        // 2. Ensure Bhopal Shelters exist
        const shelterCount = await Shelter.countDocuments({ district: 'Bhopal' });
        if (shelterCount === 0) {
            await Shelter.create([
                {
                    name: 'Bhopal Central Disaster Relief Shelter #1',
                    district: 'Bhopal',
                    state: 'Madhya Pradesh',
                    location: { type: 'Point', coordinates: [77.4100, 23.2650] },
                    capacity: 850,
                    currentOccupancy: 320,
                    status: 'AVAILABLE',
                    contactPerson: 'Commandant R. K. Verma',
                    contactPhone: '+91 755 2740112',
                    facilities: ['Medical Aid', 'Clean Water', 'Food Rations', 'Backup Generator']
                },
                {
                    name: 'TT Nagar Stadium Emergency Evacuation Camp',
                    district: 'Bhopal',
                    state: 'Madhya Pradesh',
                    location: { type: 'Point', coordinates: [77.4020, 23.2350] },
                    capacity: 1200,
                    currentOccupancy: 640,
                    status: 'AVAILABLE',
                    contactPerson: 'SDRF Officer Meena',
                    contactPhone: '+91 755 2445890',
                    facilities: ['Field Hospital', 'Sanitation Blocks', 'Helipad', 'Emergency Rations']
                }
            ]);
            console.log('Provisioned 2 emergency shelters for Bhopal.');
        }

        // 3. Ensure Bhopal Habitations exist
        const habCount = await Habitation.countDocuments({ district: 'Bhopal' });
        if (habCount === 0) {
            await Habitation.create([
                {
                    name: 'Upper Lake Catchment Basti',
                    district: 'Bhopal',
                    state: 'Madhya Pradesh',
                    location: { type: 'Point', coordinates: [77.3850, 23.2450] },
                    population: 4800,
                    vulnerabilityIndex: 0.88,
                    currentRiskScore: 86,
                    riskCategory: 'CRITICAL',
                    primaryHazard: 'FLOOD',
                    evacuationPriority: 'IMMEDIATE'
                },
                {
                    name: 'Halali River Lowland Sector',
                    district: 'Bhopal',
                    state: 'Madhya Pradesh',
                    location: { type: 'Point', coordinates: [77.4320, 23.2780] },
                    population: 5700,
                    vulnerabilityIndex: 0.82,
                    currentRiskScore: 78,
                    riskCategory: 'RED',
                    primaryHazard: 'FLOOD',
                    evacuationPriority: 'HIGH'
                }
            ]);
            console.log('Provisioned 2 high-risk habitations for Bhopal.');
        }

        // 4. Ensure Bhopal Hazard Zones exist with realistic multi-tier risk distribution
        const hazardCount = await HazardZone.countDocuments({ district: 'Bhopal' });
        if (hazardCount < 4) {
            await HazardZone.deleteMany({ district: 'Bhopal' });
            await HazardZone.create([
                {
                    name: 'Upper Lake Inundation & Spillway Zone',
                    district: 'Bhopal',
                    state: 'Madhya Pradesh',
                    hazardType: 'FLOOD',
                    riskCategory: 'CRITICAL',
                    severity: 92,
                    riskScore: 88,
                    probability: 0.95,
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[[77.37, 23.23], [77.42, 23.23], [77.42, 23.27], [77.37, 23.27], [77.37, 23.23]]]
                    }
                },
                {
                    name: 'Halali River Lowland Inundation Sector',
                    district: 'Bhopal',
                    state: 'Madhya Pradesh',
                    hazardType: 'FLOOD',
                    riskCategory: 'RED',
                    severity: 78,
                    riskScore: 74,
                    probability: 0.80,
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[[77.41, 23.26], [77.45, 23.26], [77.45, 23.30], [77.41, 23.30], [77.41, 23.26]]]
                    }
                },
                {
                    name: 'TT Nagar Urban Drainage Basin',
                    district: 'Bhopal',
                    state: 'Madhya Pradesh',
                    hazardType: 'FLOOD',
                    riskCategory: 'AMBER',
                    severity: 55,
                    riskScore: 50,
                    probability: 0.60,
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[[77.39, 23.21], [77.43, 23.21], [77.43, 23.25], [77.39, 23.25], [77.39, 23.21]]]
                    }
                },
                {
                    name: 'Shahpura Lake Peripheral Buffer',
                    district: 'Bhopal',
                    state: 'Madhya Pradesh',
                    hazardType: 'FLOOD',
                    riskCategory: 'GREEN',
                    severity: 22,
                    riskScore: 20,
                    probability: 0.25,
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[[77.42, 23.18], [77.46, 23.18], [77.46, 23.22], [77.42, 23.22], [77.42, 23.18]]]
                    }
                }
            ]);
            console.log('Provisioned 4 multi-tier hazard zones for Bhopal.');
        }

        console.log('Bhopal critical infrastructure provisioned successfully!');
        process.exit(0);
    } catch(err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();
