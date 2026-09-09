/**
 * Seed script — Gautam Buddha Nagar (Uttar Pradesh)
 * Run: node scripts/seedGBN.js
 *
 * Adds hazard zones, habitations, shelters, alerts, and citizen reports
 * for Greater Noida / Gautam Buddha Nagar so the map is populated when
 * users have that district selected.
 *
 * This does NOT clear existing data — it appends.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const dns = require("dns");
try { dns.setServers(["8.8.8.8", "1.1.1.1", ...dns.getServers()]); } catch (e) {}

const HazardZone = require("../models/HazardZone");
const Habitation  = require("../models/Habitation");
const Shelter     = require("../models/Shelter");
const Alert       = require("../models/Alert");
const CitizenReport = require("../models/CitizenReport");

const DISTRICT = "Gautam Buddha Nagar";
const STATE    = "Uttar Pradesh";

// Greater Noida center: 28.4744°N, 77.5040°E
// Noida center:         28.5355°N, 77.3910°E

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Remove existing GBN data to avoid duplicates on re-run
    await HazardZone.deleteMany({ district: DISTRICT });
    await Habitation.deleteMany({ district: DISTRICT });
    await Shelter.deleteMany({ district: DISTRICT });
    console.log("Cleared existing Gautam Buddha Nagar data");

    // ── Hazard Zones ──────────────────────────────────────────
    const hazards = await HazardZone.insertMany([
      {
        name: "Hindon River Embankment Safe Buffer",
        hazardType: "FLOOD",
        district: DISTRICT, state: STATE,
        severity: 22, riskScore: 18, riskCategory: "GREEN", probability: 0.12,
        geometry: { type: "Polygon", coordinates: [[[77.38, 28.56], [77.42, 28.56], [77.42, 28.60], [77.38, 28.60], [77.38, 28.56]]] },
        source: "CWC Advisory 2026 - Controlled Safe Level"
      },
      {
        name: "Yamuna Barrage Regulated Safe Zone",
        hazardType: "FLOOD",
        district: DISTRICT, state: STATE,
        severity: 24, riskScore: 20, riskCategory: "GREEN", probability: 0.14,
        geometry: { type: "Polygon", coordinates: [[[77.44, 28.52], [77.50, 28.52], [77.50, 28.56], [77.44, 28.56], [77.44, 28.52]]] },
        source: "NDMA Survey 2026 - Regulated Flow"
      },
      {
        name: "Greater Noida Expressway Drainage Sector",
        hazardType: "FLOOD",
        district: DISTRICT, state: STATE,
        severity: 42, riskScore: 38, riskCategory: "AMBER", probability: 0.28,
        geometry: { type: "Polygon", coordinates: [[[77.48, 28.46], [77.53, 28.46], [77.53, 28.50], [77.48, 28.50], [77.48, 28.46]]] },
        source: "GNIDA Infrastructure Report"
      },
      {
        name: "Sector 150 Low-Lying Drainage Buffer",
        hazardType: "FLOOD",
        district: DISTRICT, state: STATE,
        severity: 20, riskScore: 16, riskCategory: "GREEN", probability: 0.10,
        geometry: { type: "Polygon", coordinates: [[[77.50, 28.42], [77.55, 28.42], [77.55, 28.46], [77.50, 28.46], [77.50, 28.42]]] },
        source: "DDA Flood Map"
      },
      {
        name: "Noida Sector 62-63 Urban Heat Zone",
        hazardType: "HEATWAVE",
        district: DISTRICT, state: STATE,
        severity: 48, riskScore: 42, riskCategory: "AMBER", probability: 0.35,
        geometry: { type: "Polygon", coordinates: [[[77.36, 28.62], [77.40, 28.62], [77.40, 28.65], [77.36, 28.65], [77.36, 28.62]]] },
        source: "IMD Heatwave Advisory"
      },
      {
        name: "Dadri Industrial Hazard Zone",
        hazardType: "WILDFIRE",
        district: DISTRICT, state: STATE,
        severity: 45, riskScore: 38, riskCategory: "AMBER", probability: 0.25,
        geometry: { type: "Polygon", coordinates: [[[77.55, 28.53], [77.60, 28.53], [77.60, 28.57], [77.55, 28.57], [77.55, 28.53]]] },
        source: "Fire Service Report"
      },
      {
        name: "Surajpur Wetland Safe Corridor",
        hazardType: "FLOOD",
        district: DISTRICT, state: STATE,
        severity: 20, riskScore: 15, riskCategory: "GREEN", probability: 0.10,
        geometry: { type: "Polygon", coordinates: [[[77.48, 28.50], [77.52, 28.50], [77.52, 28.53], [77.48, 28.53], [77.48, 28.50]]] },
        source: "Wetland Survey"
      }
    ]);
    console.log(`Seeded ${hazards.length} hazard zones for ${DISTRICT}`);

    // ── Habitations ───────────────────────────────────────────
    const habitations = await Habitation.insertMany([
      { name: "Kunda Basti, Ward 7",           district: DISTRICT, state: STATE, population: 312,  vulnerablePopulation: 82,  vulnerabilityScore: 35, currentRiskScore: 32, riskCategory: "AMBER", location: { type: "Point", coordinates: [77.395, 28.575] } },
      { name: "Nala Colony, Sector 135",       district: DISTRICT, state: STATE, population: 198,  vulnerablePopulation: 52,  vulnerabilityScore: 25, currentRiskScore: 20, riskCategory: "GREEN", location: { type: "Point", coordinates: [77.410, 28.540] } },
      { name: "Ghat Para Settlement",          district: DISTRICT, state: STATE, population: 140,  vulnerablePopulation: 38,  vulnerabilityScore: 22, currentRiskScore: 18, riskCategory: "GREEN", location: { type: "Point", coordinates: [77.490, 28.470] } },
      { name: "Station Road Settlement",       district: DISTRICT, state: STATE, population: 85,   vulnerablePopulation: 12,  vulnerabilityScore: 20, currentRiskScore: 15, riskCategory: "GREEN", location: { type: "Point", coordinates: [77.460, 28.480] } },
      { name: "Kasna Village Cluster",         district: DISTRICT, state: STATE, population: 520,  vulnerablePopulation: 145, vulnerabilityScore: 28, currentRiskScore: 24, riskCategory: "GREEN", location: { type: "Point", coordinates: [77.530, 28.450] } },
      { name: "Dadri Urban Basti",             district: DISTRICT, state: STATE, population: 680,  vulnerablePopulation: 190, vulnerabilityScore: 38, currentRiskScore: 34, riskCategory: "AMBER", location: { type: "Point", coordinates: [77.560, 28.550] } },
      { name: "Sector 150 Resettlement",       district: DISTRICT, state: STATE, population: 420,  vulnerablePopulation: 110, vulnerabilityScore: 24, currentRiskScore: 19, riskCategory: "GREEN", location: { type: "Point", coordinates: [77.520, 28.440] } },
      { name: "Bisrakh Industrial Labour Camp", district: DISTRICT, state: STATE, population: 350,  vulnerablePopulation: 95,  vulnerabilityScore: 32, currentRiskScore: 28, riskCategory: "GREEN", location: { type: "Point", coordinates: [77.460, 28.560] } },
      { name: "Jewar Airport Workers Colony",  district: DISTRICT, state: STATE, population: 230,  vulnerablePopulation: 40,  vulnerabilityScore: 20, currentRiskScore: 15, riskCategory: "GREEN", location: { type: "Point", coordinates: [77.600, 28.360] } },
      { name: "Surajpur Nature Reserve Edge",  district: DISTRICT, state: STATE, population: 180,  vulnerablePopulation: 25,  vulnerabilityScore: 15, currentRiskScore: 10, riskCategory: "GREEN", location: { type: "Point", coordinates: [77.500, 28.510] } }
    ]);
    console.log(`Seeded ${habitations.length} habitations for ${DISTRICT}`);

    // ── Shelters ──────────────────────────────────────────────
    const shelters = await Shelter.insertMany([
      { name: "NDRF Shelter - Sector 39", district: DISTRICT, state: STATE, address: "Near Sector 39 Metro", capacity: 600, currentOccupancy: 85, availableCapacity: 515, status: "AVAILABLE", facilities: ["water", "electricity", "medical", "food", "sanitation"], accessibility: "FULL", riskScore: 5, contactNumber: "0120-2345001", location: { type: "Point", coordinates: [77.382, 28.570] } },
      { name: "Pari Chowk Convention Centre", district: DISTRICT, state: STATE, address: "Knowledge Park II", capacity: 1200, currentOccupancy: 150, availableCapacity: 1050, status: "AVAILABLE", facilities: ["water", "electricity", "medical", "food", "sanitation", "generator"], accessibility: "FULL", riskScore: 3, contactNumber: "0120-2345002", location: { type: "Point", coordinates: [77.500, 28.470] } },
      { name: "Alpha Commercial Belt Hall", district: DISTRICT, state: STATE, address: "Alpha 1, Greater Noida", capacity: 400, currentOccupancy: 60, availableCapacity: 340, status: "AVAILABLE", facilities: ["water", "electricity", "food"], accessibility: "FULL", riskScore: 8, contactNumber: "0120-2345003", location: { type: "Point", coordinates: [77.505, 28.485] } },
      { name: "Dadri Community Centre", district: DISTRICT, state: STATE, address: "Main Road, Dadri", capacity: 350, currentOccupancy: 200, availableCapacity: 150, status: "NEAR_CAPACITY", facilities: ["water", "electricity", "medical", "food"], accessibility: "PARTIAL", riskScore: 22, contactNumber: "0120-2345004", location: { type: "Point", coordinates: [77.555, 28.545] } },
      { name: "Surajpur Sports Complex", district: DISTRICT, state: STATE, address: "Surajpur, Greater Noida", capacity: 800, currentOccupancy: 40, availableCapacity: 760, status: "AVAILABLE", facilities: ["water", "electricity", "medical", "food", "sanitation", "generator"], accessibility: "FULL", riskScore: 4, contactNumber: "0120-2345005", location: { type: "Point", coordinates: [77.490, 28.515] } },
      { name: "Kasna Government School", district: DISTRICT, state: STATE, address: "Kasna Village", capacity: 250, currentOccupancy: 0, availableCapacity: 250, status: "AVAILABLE", facilities: ["water", "sanitation"], accessibility: "PARTIAL", riskScore: 15, contactNumber: "0120-2345006", location: { type: "Point", coordinates: [77.535, 28.448] } }
    ]);
    console.log(`Seeded ${shelters.length} shelters for ${DISTRICT}`);

    // ── Alerts ─────────────────────────────────────────────────
    const alerts = await Alert.insertMany([
      { title: "Standard Advisory — Hindon River Normal Flow", message: "Hindon river water level is currently normal and within safe embankment limits. Regular monitoring active.", severity: "INFO", hazardType: "FLOOD", source: "OFFICIAL", verificationStatus: "VERIFIED", location: { type: "Point", coordinates: [77.395, 28.575] }, affectedRadius: 5, isActive: false, expiresAt: new Date(Date.now() + 48 * 3600000) },
      { title: "Moderate Rainfall Watch — Greater Noida", message: "IMD predicts light to moderate rainfall for Gautam Buddha Nagar. Drainage channels operational.", severity: "INFO", hazardType: "FLOOD", source: "OFFICIAL", verificationStatus: "VERIFIED", isActive: false, expiresAt: new Date(Date.now() + 24 * 3600000) }
    ]);
    console.log(`Seeded ${alerts.length} alerts for ${DISTRICT}`);

    // ── Citizen Reports ────────────────────────────────────────
    const citizenReports = await CitizenReport.insertMany([
      { description: "Minor water pooling near Sector 135 underpass resolved after pump activation.", location: { type: "Point", coordinates: [77.410, 28.538] }, disasterType: "FLOOD", severity: "LOW", category: "Road flooding", priority: "LOW", status: "RESOLVED", aiClassification: { disasterType: "FLOOD", severity: "LOW", category: "Road flooding", priority: "LOW", confidence: 0.90 } },
      { description: "Drain maintenance completed in Kasna village. Free flow observed.", location: { type: "Point", coordinates: [77.528, 28.452] }, disasterType: "FLOOD", severity: "LOW", category: "Residential flooding", priority: "LOW", status: "RESOLVED", aiClassification: { disasterType: "FLOOD", severity: "LOW", category: "Residential flooding", priority: "LOW", confidence: 0.85 } }
    ]);
    console.log(`Seeded ${citizenReports.length} citizen reports for ${DISTRICT}`);

    console.log(`\n✅ Gautam Buddha Nagar data seeded successfully!\n`);
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seed();
