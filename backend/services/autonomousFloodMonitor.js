const h3 = require("h3-js");
const Habitation = require("../models/Habitation");
const WeatherObservation = require("../models/WeatherObservation");
const { calculateUnifiedRisk } = require("./riskEngine");

/**
 * Autonomous Flood Risk Monitoring Worker (Stage 2)
 *
 * Runs background multi-hazard risk evaluations across all authoritative
 * Flood H3 resolution-7 cells on a 15–30 minute cycle.
 *
 * Architecture:
 *   WeatherCollector (scheduled OpenWeather telemetry)
 *         ↓
 *   WeatherObservation (MongoDB 10-day antecedent rainfall accumulator)
 *         ↓
 *   autonomousFloodMonitor (background worker loop)
 *         ↓
 *   calculateUnifiedRisk(lat, lon, "FLOOD", { mode })
 *         ↓
 *   Stage 1 Alert Bridge (CRITICAL score >= 76)
 *         ↓
 *   createIntelligentAlert (concurrency-safe partial unique index deduplication)
 *         ↓
 *   EmergencyAlertSentinel / Automated SMS (only on newly created LIVE CRITICAL alerts)
 */

const DEFAULT_INTERVAL_MS = 20 * 60 * 1000; // 20 minutes (within 15–30 min range)
const DEFAULT_CONCURRENCY = 5;
const INTER_BATCH_DELAY_MS = 200; // Controlled pacing between batches

let monitorInterval = null;
let initialTimeout = null;
let isCycleRunning = false;
let monitorStats = {
    isRunning: false,
    totalCycles: 0,
    lastRunAt: null,
    lastDurationMs: 0,
    lastEvaluatedCount: 0,
    lastCriticalCount: 0,
    lastAlertsCreated: 0,
    lastAlertsUpdated: 0,
    lastErrorsCount: 0
};

/**
 * Resolve the authoritative H3 resolution-7 cells monitored for Flood risk.
 * Derives cell coordinates directly from the authoritative Habitation repository
 * and WeatherObservation accumulator records.
 */
async function getAuthoritativeFloodCells() {
    try {
        const habitations = await Habitation.find(
            { location: { $exists: true } },
            { location: 1, district: 1, state: 1, name: 1 }
        ).lean();

        const cellMap = new Map(); // cellId -> { cellId, lat, lon, district, state, habitationCount }

        for (const hab of habitations) {
            if (!hab.location || !hab.location.coordinates || hab.location.coordinates.length < 2) {
                continue;
            }
            const [lng, lat] = hab.location.coordinates;
            if (typeof lat !== "number" || typeof lng !== "number") continue;

            const cellId = h3.latLngToCell(lat, lng, 7);
            if (!cellMap.has(cellId)) {
                cellMap.set(cellId, {
                    cellId,
                    lat: Math.round(lat * 10000) / 10000,
                    lon: Math.round(lng * 10000) / 10000,
                    district: hab.district || "Unknown District",
                    state: hab.state || "Unknown State",
                    habitationCount: 1
                });
            } else {
                const existing = cellMap.get(cellId);
                existing.habitationCount++;
                if (!existing.district && hab.district) existing.district = hab.district;
                if (!existing.state && hab.state) existing.state = hab.state;
            }
        }

        // If habitations yielded cells, return them
        if (cellMap.size > 0) {
            return Array.from(cellMap.values());
        }

        // Fallback: Check existing WeatherObservation cells if Habitations not yet seeded
        const distinctObsCells = await WeatherObservation.distinct("cell_id");
        for (const cellId of distinctObsCells) {
            if (cellId && typeof cellId === "string" && h3.isValidCell(cellId)) {
                const [lat, lon] = h3.cellToLatLng(cellId);
                cellMap.set(cellId, {
                    cellId,
                    lat: Math.round(lat * 10000) / 10000,
                    lon: Math.round(lon * 10000) / 10000,
                    district: "Monitored Cell",
                    state: "Monitored Zone",
                    habitationCount: 0
                });
            }
        }

        return Array.from(cellMap.values());
    } catch (err) {
        console.error("[AutonomousFloodMonitor] Error resolving flood cells:", err.message);
        return [];
    }
}

/**
 * Retrieve the latest persisted weather observation for an H3 cell and evaluate freshness.
 * Reference: 30-minute weatherCollector schedule (COLLECTION_INTERVAL_MS = 30 * 60 * 1000).
 *
 * Freshness Contract:
 * - Fresh: Recorded within MAX_WEATHER_AGE_MS (60 minutes = 2 collection cycles).
 * - Stale: Older than 60 minutes; rainfall is zeroed out to prevent treating old rain as current.
 * - Missing: No observation found in MongoDB; safe baseline is provided with zero rainfall.
 *
 * Zero data fabrication: rainfall_1h is never equated with rainfall_1d_pre.
 */
async function getPersistedCellWeather(cellId, maxAgeMs = 60 * 60 * 1000) {
    const latestObs = await WeatherObservation.findOne({ cell_id: cellId })
        .sort({ timestamp: -1 })
        .lean();

    const now = Date.now();

    if (!latestObs || !latestObs.timestamp) {
        return {
            freshness: "missing",
            observation: null,
            ageMs: null,
            weather: {
                temperature: 28,
                humidity: 50,
                pressure: 1013,
                windSpeed: 5,
                rainfall: 0, // Zero rainfall: do NOT invent or manufacture telemetry
                soilMoisturePct: 45,
                description: "No observations available",
                source: "calibrated_baseline",
                timestamp: new Date().toISOString(),
                status: "missing_observation"
            }
        };
    }

    const obsDate = new Date(latestObs.timestamp);
    const obsAgeMs = now - obsDate.getTime();

    if (obsAgeMs <= maxAgeMs) {
        // Fresh observation: preserve real telemetry without modification
        return {
            freshness: "fresh",
            observation: latestObs,
            ageMs: obsAgeMs,
            weather: {
                temperature: latestObs.temperature ?? 28,
                humidity: latestObs.humidity ?? 60,
                pressure: latestObs.pressure ?? 1013,
                windSpeed: latestObs.wind_speed ?? 5,
                rainfall: latestObs.rainfall_1h ?? 0, // Instantaneous 1-hour rainfall snapshot
                soilMoisturePct: 55,
                description: latestObs.description || "",
                source: latestObs.source || "OpenWeather",
                timestamp: obsDate.toISOString(),
                status: "persisted_fresh"
            }
        };
    }

    // Stale observation: older than 60 minutes (do NOT treat old rain as current rain)
    return {
        freshness: "stale",
        observation: latestObs,
        ageMs: obsAgeMs,
        weather: {
            temperature: latestObs.temperature ?? 28,
            humidity: latestObs.humidity ?? 55,
            pressure: latestObs.pressure ?? 1013,
            windSpeed: latestObs.wind_speed ?? 5,
            rainfall: 0, // Zero rainfall for stale state: do NOT treat old precipitation as active
            soilMoisturePct: 45,
            description: "Stale telemetry",
            source: latestObs.source || "OpenWeather",
            timestamp: obsDate.toISOString(),
            status: "stale_observation"
        }
    };
}

/**
 * Evaluate a single Flood H3 cell through the verified risk engine.
 * Reuses the latest persisted WeatherObservation from MongoDB, completely
 * eliminating duplicate OpenWeather API requests.
 * Failure in one cell is isolated and will not disrupt remaining cells.
 */
async function evaluateSingleCell(cell, options = {}) {
    const { cellId, lat, lon, district, state } = cell;
    const mode = options.mode || "LIVE";

    try {
        // 1. Retrieve latest persisted weather observation with freshness validation
        const persisted = await getPersistedCellWeather(cellId);

        // 2. Pass persisted weather into calculateUnifiedRisk (bypasses live OpenWeather call)
        const riskResult = await calculateUnifiedRisk(lat, lon, "FLOOD", {
            district,
            state,
            mode,
            weather: options.weather || persisted.weather
        });

        const floodAssessment = riskResult.assessments?.FLOOD || {};
        const riskScore = floodAssessment.riskScore || 0;
        const riskCategory = floodAssessment.riskCategory || "GREEN";
        const isCritical = riskCategory === "CRITICAL" || riskScore >= 76;
        const generatedAlerts = riskResult.generatedAlerts || [];

        return {
            cellId,
            district,
            state,
            lat,
            lon,
            riskScore,
            riskCategory,
            confidence: floodAssessment.confidence,
            isCritical,
            generatedAlerts,
            weatherFreshness: persisted.freshness,
            weatherStatus: persisted.weather.status,
            error: null
        };
    } catch (cellErr) {
        console.warn(
            `[AutonomousFloodMonitor] Cell evaluation error for ${cellId} (${district}): ${cellErr.message}`
        );
        return {
            cellId,
            district,
            state,
            lat,
            lon,
            riskScore: null,
            riskCategory: null,
            isCritical: false,
            generatedAlerts: [],
            weatherFreshness: null,
            weatherStatus: null,
            error: cellErr.message
        };
    }
}

/**
 * Execute a complete autonomous evaluation cycle across monitored Flood cells.
 * Uses controlled batch concurrency to prevent overwhelming AI microservice,
 * OpenWeather API, or MongoDB connections.
 *
 * @param {Object} options
 * @param {string} options.mode - "LIVE" (default), "TEST", or "SIMULATION"
 * @param {Array} options.cells - Optional subset of cells (defaults to all authoritative cells)
 * @param {number} options.concurrency - Concurrency batch size (default: 5)
 */
async function runAutonomousFloodEvaluation(options = {}) {
    if (isCycleRunning && !options.allowConcurrentCycle) {
        console.warn("[AutonomousFloodMonitor] Previous cycle is still in progress — skipping duplicate trigger.");
        return { skipped: true, reason: "cycle_already_in_progress" };
    }

    isCycleRunning = true;
    const startTime = Date.now();
    const mode = options.mode || "LIVE";
    const concurrency = options.concurrency || DEFAULT_CONCURRENCY;

    try {
        const cells = options.cells || (await getAuthoritativeFloodCells());

        if (!cells || cells.length === 0) {
            console.log("[AutonomousFloodMonitor] No authoritative Flood H3 cells available to evaluate.");
            return {
                success: true,
                evaluated: 0,
                critical: 0,
                alertsCreated: 0,
                alertsUpdated: 0,
                errors: [],
                durationMs: Date.now() - startTime
            };
        }

        console.log(
            `[AutonomousFloodMonitor] Starting evaluation cycle: ${cells.length} H3 Res-7 cells (Mode: ${mode}, Concurrency: ${concurrency})...`
        );

        const results = [];

        // Controlled concurrency: Process in sequential batches with inter-batch delay
        for (let i = 0; i < cells.length; i += concurrency) {
            const batch = cells.slice(i, i + concurrency);
            const batchResults = await Promise.all(
                batch.map((c) => evaluateSingleCell(c, { mode }))
            );
            results.push(...batchResults);

            // Small delay between batches to respect rate limits and prevent socket exhaustion
            if (i + concurrency < cells.length) {
                await new Promise((resolve) => setTimeout(resolve, INTER_BATCH_DELAY_MS));
            }
        }

        // Tally cycle results
        let criticalCount = 0;
        let alertsCreated = 0;
        let alertsUpdated = 0;
        const errors = [];

        for (const res of results) {
            if (res.error) {
                errors.push({ cellId: res.cellId, error: res.error });
            }
            if (res.isCritical) {
                criticalCount++;
            }
            if (Array.isArray(res.generatedAlerts)) {
                for (const g of res.generatedAlerts) {
                    if (g.action === "created") alertsCreated++;
                    else if (g.action === "updated_existing") alertsUpdated++;
                }
            }
        }

        const durationMs = Date.now() - startTime;
        const evaluatedCount = results.length - errors.length;

        // Update runtime monitor statistics
        monitorStats = {
            isRunning: true,
            totalCycles: monitorStats.totalCycles + 1,
            lastRunAt: new Date().toISOString(),
            lastDurationMs: durationMs,
            lastEvaluatedCount: evaluatedCount,
            lastCriticalCount: criticalCount,
            lastAlertsCreated: alertsCreated,
            lastAlertsUpdated: alertsUpdated,
            lastErrorsCount: errors.length
        };

        console.log(
            `[AutonomousFloodMonitor] Cycle complete in ${durationMs}ms: ` +
            `${evaluatedCount}/${cells.length} cells evaluated, ${criticalCount} critical, ` +
            `${alertsCreated} alerts created, ${alertsUpdated} alerts updated, ${errors.length} errors.`
        );

        return {
            success: true,
            totalCells: cells.length,
            evaluated: evaluatedCount,
            critical: criticalCount,
            alertsCreated,
            alertsUpdated,
            errors,
            durationMs,
            timestamp: new Date().toISOString()
        };
    } catch (cycleErr) {
        console.error("[AutonomousFloodMonitor] Fatal error in evaluation cycle:", cycleErr.message);
        return {
            success: false,
            error: cycleErr.message,
            durationMs: Date.now() - startTime
        };
    } finally {
        isCycleRunning = false;
    }
}

/**
 * Start the autonomous flood evaluation background worker.
 * Initiates after a short delay (15 seconds) to allow DB connection and weather collector to settle,
 * then repeats every interval.
 */
function startAutonomousFloodMonitor() {
    if (monitorInterval) {
        console.log("[AutonomousFloodMonitor] Worker already active.");
        return;
    }

    const intervalMs = parseInt(process.env.AUTONOMOUS_FLOOD_INTERVAL_MS, 10) || DEFAULT_INTERVAL_MS;
    console.log(
        `[AutonomousFloodMonitor] Initializing background loop (interval: ${intervalMs / 60000} mins)...`
    );

    monitorStats.isRunning = true;

    // Stagger first run: 15 seconds after startup
    initialTimeout = setTimeout(() => {
        runAutonomousFloodEvaluation({ mode: "LIVE" }).catch((err) =>
            console.error("[AutonomousFloodMonitor] Scheduled run error:", err.message)
        );
    }, 15000);

    // Periodic repeating timer
    monitorInterval = setInterval(() => {
        runAutonomousFloodEvaluation({ mode: "LIVE" }).catch((err) =>
            console.error("[AutonomousFloodMonitor] Periodic run error:", err.message)
        );
    }, intervalMs);
}

/**
 * Gracefully stop the autonomous flood monitoring worker.
 */
function stopAutonomousFloodMonitor() {
    if (initialTimeout) {
        clearTimeout(initialTimeout);
        initialTimeout = null;
    }
    if (monitorInterval) {
        clearInterval(monitorInterval);
        monitorInterval = null;
    }
    isCycleRunning = false;
    monitorStats.isRunning = false;
    console.log("[AutonomousFloodMonitor] Stopped background worker.");
}

/**
 * Return current runtime statistics for operational health diagnostics.
 */
function getAutonomousMonitorStatus() {
    return {
        ...monitorStats,
        isCycleRunning
    };
}

module.exports = {
    startAutonomousFloodMonitor,
    stopAutonomousFloodMonitor,
    runAutonomousFloodEvaluation,
    getAuthoritativeFloodCells,
    evaluateSingleCell,
    getAutonomousMonitorStatus,
    getPersistedCellWeather
};
