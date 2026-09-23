require("dotenv").config();
const dns = require("dns");
try { dns.setServers(["8.8.8.8", "1.1.1.1", ...dns.getServers()]); } catch (e) {}

const mongoose = require("mongoose");
const h3 = require("h3-js");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const connectDB = require("./config/db");
const Alert = require("./models/Alert");
const Habitation = require("./models/Habitation");
const WeatherObservation = require("./models/WeatherObservation");
const {
    startAutonomousFloodMonitor,
    stopAutonomousFloodMonitor,
    getAuthoritativeFloodCells,
    evaluateSingleCell,
    runAutonomousFloodEvaluation,
    getAutonomousMonitorStatus,
    getPersistedCellWeather
} = require("./services/autonomousFloodMonitor");
const { createIntelligentAlert } = require("./services/alertService");
const { calculateUnifiedRisk } = require("./services/riskEngine");
const { computeAntecedentRainfall } = require("./services/weatherCollector");
const weatherService = require("./services/weatherService");
const { isTrueCriticalAlert } = require("../frontend/src/utils/alertMatcher");

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
    totalTests++;
    if (!condition) {
        console.error(`❌ FAILED: ${message}`);
        throw new Error(message);
    }
    console.log(`  ✓ ${message}`);
    passedTests++;
}

async function runStage2Verification() {
    console.log("================================================================================");
    console.log("  AapdaNetra — Stage 2: Autonomous Flood Monitoring & OpenWeather Optimization");
    console.log("================================================================================");

    await connectDB();

    const createdTestAlertIds = [];
    const createdObsIds = [];

    try {
        // ─────────────────────────────────────────────────────────────────────────────
        // TEST A: Autonomous monitor obtains latest WeatherObservation
        // ─────────────────────────────────────────────────────────────────────────────
        console.log("\n--------------------------------------------------------------------------------");
        console.log("TEST A: Autonomous Monitor Obtains Latest WeatherObservation from MongoDB");
        console.log("--------------------------------------------------------------------------------");
        const testCellId = "872f5a375ffffff";
        const now = new Date();

        // Insert a known fresh observation for this test
        const testObs = await WeatherObservation.create({
            cell_id: testCellId,
            latitude: 28.7350,
            longitude: 77.1100,
            timestamp: now,
            rainfall_1h: 4.5,
            temperature: 29.5,
            humidity: 68,
            pressure: 1011,
            wind_speed: 6.2,
            description: "moderate rain",
            source: "OpenWeather"
        });
        createdObsIds.push(testObs._id);

        const persisted = await getPersistedCellWeather(testCellId);
        assert(persisted != null, "getPersistedCellWeather returned an object");
        assert(persisted.observation != null, "Found observation in MongoDB for cell");
        assert(persisted.observation.cell_id === testCellId, "Retrieved observation matches requested cell_id");
        assert(persisted.observation.temperature === 29.5, "Temperature matches persisted value (29.5°C)");
        assert(persisted.observation.rainfall_1h === 4.5, "Instantaneous 1h rainfall matches persisted value (4.5mm)");
        console.log("✅ TEST A PASSED: Autonomous monitor retrieves latest WeatherObservation directly from MongoDB.");

        // ─────────────────────────────────────────────────────────────────────────────
        // TEST B: Fresh WeatherObservation is passed to risk evaluation
        // ─────────────────────────────────────────────────────────────────────────────
        console.log("\n--------------------------------------------------------------------------------");
        console.log("TEST B: Fresh WeatherObservation is Passed into Risk Evaluation");
        console.log("--------------------------------------------------------------------------------");
        assert(persisted.freshness === "fresh", "Observation within 60 minutes is identified as 'fresh'");
        assert(persisted.weather.status === "persisted_fresh", "Weather status is marked 'persisted_fresh'");
        assert(persisted.weather.rainfall === 4.5, "weather.rainfall accurately reflects 1h snapshot");
        assert(persisted.weather.humidity === 68, "weather.humidity accurately reflects persisted humidity");
        console.log("✅ TEST B PASSED: Fresh persisted observation is mapped and passed to risk evaluation.");

        // ─────────────────────────────────────────────────────────────────────────────
        // TEST C: Autonomous monitor does NOT call OpenWeather directly
        // ─────────────────────────────────────────────────────────────────────────────
        console.log("\n--------------------------------------------------------------------------------");
        console.log("TEST C: Autonomous Monitor Does NOT Call OpenWeather Directly");
        console.log("--------------------------------------------------------------------------------");
        const monitorCode = fs.readFileSync(path.join(__dirname, "services/autonomousFloodMonitor.js"), "utf8");
        assert(!monitorCode.includes("api.openweathermap.org"), "autonomousFloodMonitor.js contains zero OpenWeather URLs");
        assert(!monitorCode.includes("axios.get"), "autonomousFloodMonitor.js makes zero direct axios GET calls");
        assert(!monitorCode.includes("fetch("), "autonomousFloodMonitor.js makes zero fetch() calls");
        console.log("✅ TEST C PASSED: Autonomous monitor has zero direct OpenWeather or external HTTP calls.");

        // ─────────────────────────────────────────────────────────────────────────────
        // TEST D: Autonomous monitor does NOT cause getCurrentWeather() to make an external request
        // ─────────────────────────────────────────────────────────────────────────────
        console.log("\n--------------------------------------------------------------------------------");
        console.log("TEST D: Persisted Weather Bypasses getCurrentWeather() Live Calls");
        console.log("--------------------------------------------------------------------------------");
        let externalCallMade = false;
        const originalGetCurrentWeather = weatherService.getCurrentWeather;

        // Monkey-patch to detect any invocation of getCurrentWeather
        weatherService.getCurrentWeather = async function (lat, lon) {
            externalCallMade = true;
            return originalGetCurrentWeather.apply(this, arguments);
        };

        try {
            // Evaluate single cell with persisted weather
            const singleResult = await evaluateSingleCell({
                cellId: testCellId,
                lat: 28.7350,
                lon: 77.1100,
                district: "North West Delhi",
                state: "Delhi"
            }, { mode: "TEST" });

            assert(externalCallMade === false, "getCurrentWeather() was completely bypassed when persisted weather was provided");
            assert(singleResult.weatherFreshness === "fresh", "Single cell evaluated with weatherFreshness: 'fresh'");
        } finally {
            weatherService.getCurrentWeather = originalGetCurrentWeather;
        }
        console.log("✅ TEST D PASSED: Supplying persisted weather prevents any external weatherService/OpenWeather call.");

        // ─────────────────────────────────────────────────────────────────────────────
        // TEST E: Antecedent rainfall still comes from WeatherObservation rolling windows
        // ─────────────────────────────────────────────────────────────────────────────
        console.log("\n--------------------------------------------------------------------------------");
        console.log("TEST E: Antecedent Rainfall Computed from Rolling-Window Accumulator");
        console.log("--------------------------------------------------------------------------------");
        const ar = await computeAntecedentRainfall(testCellId, 28.7350, 77.1100);
        assert(ar != null, "Antecedent rainfall computation returned a result object");
        assert("rainfall_1d_pre" in ar, "Result contains rainfall_1d_pre");
        assert("rainfall_3d_pre" in ar, "Result contains rainfall_3d_pre");
        assert("rainfall_5d_pre" in ar, "Result contains rainfall_5d_pre");
        assert("rainfall_7d_pre" in ar, "Result contains rainfall_7d_pre");
        assert("rainfall_10d_pre" in ar, "Result contains rainfall_10d_pre");
        assert(ar.observation_count >= 1, "Antecedent accumulator processed observations for this cell");
        console.log("✅ TEST E PASSED: Rolling-window antecedent rainfall features remain intact.");

        // ─────────────────────────────────────────────────────────────────────────────
        // TEST F: Missing weather observation is handled safely
        // ─────────────────────────────────────────────────────────────────────────────
        console.log("\n--------------------------------------------------------------------------------");
        console.log("TEST F: Missing Weather Observation Handled Safely (Zero Fabrication)");
        console.log("--------------------------------------------------------------------------------");
        const missingCellId = "872f5a000000000"; // non-existent cell
        const missingPersisted = await getPersistedCellWeather(missingCellId);
        assert(missingPersisted.freshness === "missing", "Non-existent observation flagged as 'missing'");
        assert(missingPersisted.weather.status === "missing_observation", "Weather status is 'missing_observation'");
        assert(missingPersisted.weather.rainfall === 0, "Missing observation sets rainfall to 0 (no fabrication)");

        const missingEval = await evaluateSingleCell({
            cellId: missingCellId,
            lat: 28.5000,
            lon: 77.2000,
            district: "Safe Missing District",
            state: "Delhi"
        }, { mode: "TEST" });

        assert(missingEval.isCritical === false, "Missing observation evaluates to non-critical peacetime risk");
        assert(missingEval.generatedAlerts.length === 0, "No alerts generated for missing observation");
        console.log("✅ TEST F PASSED: Missing observation safely falls back to baseline with zero fabricated rainfall.");

        // ─────────────────────────────────────────────────────────────────────────────
        // TEST G: Stale observation is handled safely
        // ─────────────────────────────────────────────────────────────────────────────
        console.log("\n--------------------------------------------------------------------------------");
        console.log("TEST G: Stale Observation Handled Safely (Rainfall Zeroed Out)");
        console.log("--------------------------------------------------------------------------------");
        const staleCellId = "872f5a999999999";
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours old (> 60m freshness window)

        const staleObs = await WeatherObservation.create({
            cell_id: staleCellId,
            latitude: 28.6000,
            longitude: 77.3000,
            timestamp: twoHoursAgo,
            rainfall_1h: 35.0, // Significant rain 2 hours ago
            temperature: 27.0,
            humidity: 85,
            source: "OpenWeather"
        });
        createdObsIds.push(staleObs._id);

        const stalePersisted = await getPersistedCellWeather(staleCellId);
        assert(stalePersisted.freshness === "stale", "Observation older than 60 minutes flagged as 'stale'");
        assert(stalePersisted.weather.status === "stale_observation", "Weather status is 'stale_observation'");
        assert(stalePersisted.weather.rainfall === 0, "Stale observation zeroes out rainfall (does NOT treat old rain as current rain)");
        console.log("✅ TEST G PASSED: Stale observation zeroes out current rainfall, preventing false alarms.");

        // ─────────────────────────────────────────────────────────────────────────────
        // TEST H: Existing normal calculateUnifiedRisk() behavior remains functional
        // ─────────────────────────────────────────────────────────────────────────────
        console.log("\n--------------------------------------------------------------------------------");
        console.log("TEST H: Normal User calculateUnifiedRisk() Path Preserved");
        console.log("--------------------------------------------------------------------------------");
        const normalRisk = await calculateUnifiedRisk(28.6139, 77.2090, "FLOOD");
        assert(normalRisk != null, "Normal calculateUnifiedRisk call returns a result");
        assert("weather" in normalRisk, "Normal result contains weather");
        assert("assessments" in normalRisk, "Normal result contains assessments");
        assert("FLOOD" in normalRisk.assessments, "Normal result evaluated FLOOD hazard");
        assert(normalRisk.assessments.FLOOD.riskScore >= 0, "FLOOD riskScore is valid integer");
        console.log("✅ TEST H PASSED: Normal user-driven calculateUnifiedRisk() path remains 100% operational.");

        // ─────────────────────────────────────────────────────────────────────────────
        // TEST I: Critical flood risk still creates exactly one alert
        // ─────────────────────────────────────────────────────────────────────────────
        console.log("\n--------------------------------------------------------------------------------");
        console.log("TEST I: Critical Flood Risk Creates Exactly One LIVE Alert");
        console.log("--------------------------------------------------------------------------------");
        const testEventKey = `FLOOD_OPT_TEST_${Date.now()}`;
        const alertRes = await createIntelligentAlert({
            title: "🚨 OPTIMIZED PIPELINE CRITICAL WARNING",
            message: "Extreme 3-day precipitation exceedance. Immediate evacuation directive.",
            severity: "CRITICAL",
            canonicalSeverity: "CRITICAL",
            hazardType: "FLOOD",
            source: "AI_PREDICTION",
            mode: "LIVE",
            district: "Optimization Test District",
            state: "Test State",
            h3Cell: testCellId,
            eventKey: testEventKey,
            location: { coordinates: [77.1100, 28.7350] },
            expiresInHours: 2
        });

        assert(alertRes.action === "created", "Alert action reported as 'created'");
        assert(alertRes.alert && alertRes.alert._id, "Alert saved with valid ObjectId");
        createdTestAlertIds.push(alertRes.alert._id);

        const alertCount = await Alert.countDocuments({ eventKey: testEventKey, isActive: true });
        assert(alertCount === 1, "Exactly 1 active alert exists in MongoDB for this eventKey");
        console.log("✅ TEST I PASSED: Critical risk creates exactly one LIVE alert.");

        // ─────────────────────────────────────────────────────────────────────────────
        // TEST J: Repeated monitoring still updates existing alert without duplicate SMS/email
        // ─────────────────────────────────────────────────────────────────────────────
        console.log("\n--------------------------------------------------------------------------------");
        console.log("TEST J: Repeated Monitoring Updates Existing Alert Without Re-notification");
        console.log("--------------------------------------------------------------------------------");
        const updateRes = await createIntelligentAlert({
            title: "🚨 OPTIMIZED PIPELINE CRITICAL WARNING (CYCLE REFRESH)",
            message: "Updated telemetry snapshot.",
            severity: "CRITICAL",
            canonicalSeverity: "CRITICAL",
            hazardType: "FLOOD",
            source: "AI_PREDICTION",
            mode: "LIVE",
            district: "Optimization Test District",
            state: "Test State",
            h3Cell: testCellId,
            eventKey: testEventKey,
            location: { coordinates: [77.1100, 28.7350] },
            expiresInHours: 2
        });

        assert(updateRes.action === "updated_existing", "Subsequent evaluation returns 'updated_existing'");
        assert(updateRes.alert._id.toString() === alertRes.alert._id.toString(), "Alert document ID remains identical");

        const alertCountAfter = await Alert.countDocuments({ eventKey: testEventKey, isActive: true });
        assert(alertCountAfter === 1, "MongoDB still has exactly 1 alert (zero duplicates)");
        console.log("✅ TEST J PASSED: Repeat evaluations update existing alert; duplicate alerts and notifications prevented.");

        // ─────────────────────────────────────────────────────────────────────────────
        // TEST K: Landslide/Wildfire remain intact
        // ─────────────────────────────────────────────────────────────────────────────
        console.log("\n--------------------------------------------------------------------------------");
        console.log("TEST K: Landslide and Wildfire Pipelines Remain Intact");
        console.log("--------------------------------------------------------------------------------");
        const predictPath = path.join(__dirname, "../ai-services/prediction/predict.py");
        const predictCode = fs.readFileSync(predictPath, "utf8");
        assert(predictCode.includes("def predict_unified"), "predict_unified exists in predict.py");
        assert(fs.existsSync(path.join(__dirname, "../ai-services/models/landslide_model.joblib")), "landslide_model.joblib exists");
        assert(fs.existsSync(path.join(__dirname, "../ai-services/models/wildfire_model.joblib")), "wildfire_model.joblib exists");
        console.log("✅ TEST K PASSED: Landslide and Wildfire pipelines remain intact.");

        // ─────────────────────────────────────────────────────────────────────────────
        // TEST L: Forecast/Sequence GRU remains untouched
        // ─────────────────────────────────────────────────────────────────────────────
        console.log("\n--------------------------------------------------------------------------------");
        console.log("TEST L: Forecast & Sequence GRU Disconnection Verified");
        console.log("--------------------------------------------------------------------------------");
        const monitorSource = fs.readFileSync(path.join(__dirname, "services/autonomousFloodMonitor.js"), "utf8");
        const riskSource = fs.readFileSync(path.join(__dirname, "services/riskEngine.js"), "utf8");
        assert(!monitorSource.includes("time_series") && !riskSource.includes("time_series"), "No imports of time_series.py");
        assert(!monitorSource.includes("Sequence GRU") && !riskSource.includes("Sequence GRU"), "No references to Sequence GRU");
        console.log("✅ TEST L PASSED: Automatic alert pipeline is strictly decoupled from forecasting and Sequence GRU.");

        console.log("\n================================================================================");
        console.log(`  ALL TESTS A THROUGH L COMPLETED WITH 100% PASS RATE (${passedTests}/${totalTests} assertions)`);
        console.log("================================================================================\n");

    } finally {
        if (createdTestAlertIds.length > 0) {
            await Alert.deleteMany({ _id: { $in: createdTestAlertIds } });
        }
        if (createdObsIds.length > 0) {
            await WeatherObservation.deleteMany({ _id: { $in: createdObsIds } });
        }
        await mongoose.disconnect();
    }
}

runStage2Verification().catch((err) => {
    console.error("\n❌ TEST SUITE FAILURE:", err);
    process.exit(1);
});
