const axios = require("axios");
const h3 = require("h3-js");
const WeatherObservation = require("../models/WeatherObservation");
const Habitation = require("../models/Habitation");

const OPENWEATHER_BASE = "https://api.openweathermap.org/data/2.5";
const H3_RESOLUTION = 7;
const COLLECTION_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Weather Collector — Scheduled OpenWeather observation ingestion
 *
 * Periodically polls OpenWeather /data/2.5/weather for each monitored
 * H3 resolution-7 cell and stores timestamped rainfall observations
 * in MongoDB. These observations are later aggregated into the 5
 * antecedent rainfall features required by the verified flood model.
 */

// ── Core: fetch & store a single observation ────────────────────────────────

async function collectSingleObservation(lat, lon, cellId, apiKey) {
  try {
    const response = await axios.get(`${OPENWEATHER_BASE}/weather`, {
      params: { lat, lon, appid: apiKey, units: "metric" },
      timeout: 5000,
    });

    const data = response.data;
    // Use OpenWeather observation timestamp (unix UTC) to prevent duplicate snapshots
    const obsDate = data.dt ? new Date(data.dt * 1000) : new Date();

    await WeatherObservation.updateOne(
      { cell_id: cellId, timestamp: obsDate },
      {
        $setOnInsert: {
          cell_id: cellId,
          latitude: lat,
          longitude: lon,
          timestamp: obsDate,
          rainfall_1h: data.rain?.["1h"] || 0,
          temperature: data.main?.temp,
          humidity: data.main?.humidity,
          pressure: data.main?.pressure,
          wind_speed: data.wind?.speed,
          description: data.weather?.[0]?.description || "",
          source: "OpenWeather",
        },
      },
      { upsert: true }
    );
    return true;
  } catch (err) {
    console.error(
      `[WeatherCollector] Failed to collect for cell ${cellId} (${lat},${lon}): ${err.message}`
    );
    return false;
  }
}

// ── Scheduled collection run ────────────────────────────────────────────────

async function runCollectionCycle() {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey || apiKey === "your_openweather_api_key_here") {
    console.warn(
      "[WeatherCollector] OPENWEATHER_API_KEY not configured — skipping collection cycle"
    );
    return;
  }

  try {
    // Gather unique monitored locations from Habitation collection
    const habitations = await Habitation.find(
      { location: { $exists: true } },
      { location: 1 }
    )
      .limit(200)
      .lean();

    // Deduplicate by H3 cell to avoid redundant API calls
    const cellMap = new Map(); // cellId → {lat, lon}

    for (const hab of habitations) {
      if (
        !hab.location ||
        !hab.location.coordinates ||
        hab.location.coordinates.length < 2
      )
        continue;

      const [lng, lat] = hab.location.coordinates; // GeoJSON is [lon, lat]
      const cellId = h3.latLngToCell(lat, lng, H3_RESOLUTION);
      if (!cellMap.has(cellId)) {
        cellMap.set(cellId, { lat: Math.round(lat * 1000) / 1000, lon: Math.round(lng * 1000) / 1000 });
      }
    }

    if (cellMap.size === 0) {
      console.log(
        "[WeatherCollector] No monitored locations found — skipping"
      );
      return;
    }

    console.log(
      `[WeatherCollector] Collecting weather for ${cellMap.size} unique H3 cells...`
    );

    let success = 0;
    let failed = 0;

    for (const [cellId, { lat, lon }] of cellMap.entries()) {
      const ok = await collectSingleObservation(lat, lon, cellId, apiKey);
      if (ok) success++;
      else failed++;

      // Rate limiting: ~60 calls/min free tier → small delay between calls
      if (cellMap.size > 30) {
        await new Promise((r) => setTimeout(r, 1100));
      }
    }

    console.log(
      `[WeatherCollector] Cycle complete: ${success} stored, ${failed} failed out of ${cellMap.size} cells`
    );
  } catch (err) {
    console.error(`[WeatherCollector] Collection cycle error: ${err.message}`);
  }
}

// ── Antecedent Rainfall Computation ─────────────────────────────────────────

/**
 * Compute cumulative antecedent rainfall from stored observations.
 *
 * @param {string|null} cellId  - H3 cell ID (if null, computed from lat/lon)
 * @param {number} lat          - Latitude
 * @param {number} lon          - Longitude
 * @returns {Object} { rainfall_1d_pre, rainfall_3d_pre, rainfall_5d_pre,
 *                      rainfall_7d_pre, rainfall_10d_pre, data_hours }
 *
 * Values are null when insufficient observation history exists for that window.
 */
async function computeAntecedentRainfall(cellId, lat, lon) {
  try {
    if (!cellId && lat != null && lon != null) {
      cellId = h3.latLngToCell(lat, lon, H3_RESOLUTION);
    }

    if (!cellId) {
      return nullRainfallResult("No cell ID or coordinates provided");
    }

    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

    // Fetch all observations for this cell in the last 10 days, sorted by time
    const observations = await WeatherObservation.find(
      {
        cell_id: cellId,
        timestamp: { $gte: tenDaysAgo, $lte: now },
      },
      { timestamp: 1, rainfall_1h: 1, _id: 0 }
    )
      .sort({ timestamp: -1 })
      .lean();

    if (observations.length === 0) {
      return nullRainfallResult("No observations found for this cell");
    }

    // Compute the total observation span in hours
    const oldestObs = observations[observations.length - 1];
    const dataHours = Math.round(
      (now.getTime() - new Date(oldestObs.timestamp).getTime()) / (1000 * 60 * 60)
    );

    // Accumulate rainfall for each time window
    const windows = [
      { key: "rainfall_1d_pre", hours: 24 },
      { key: "rainfall_3d_pre", hours: 72 },
      { key: "rainfall_5d_pre", hours: 120 },
      { key: "rainfall_7d_pre", hours: 168 },
      { key: "rainfall_10d_pre", hours: 240 },
    ];

    const hasFull10d = dataHours >= 240 * 0.9;
    const result = {
      cell_id: cellId,
      data_hours: dataHours,
      history_days: Math.round((dataHours / 24) * 10) / 10,
      observation_count: observations.length,
      has_full_10d_history: hasFull10d,
      history_status: hasFull10d ? "complete" : dataHours >= 20 ? "partial" : "insufficient",
      message:
        hasFull10d
          ? "Full 10-day rainfall history available"
          : `Cell has ${Math.round((dataHours / 24) * 10) / 10} days of rainfall history (< 10 days). Missing windows will be imputed by verified flood preprocessor.`,
    };

    for (const { key, hours } of windows) {
      if (dataHours < hours * 0.75) {
        // Require at least 75% coverage of the window for valid accumulation
        result[key] = null;
      } else {
        const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
        const sum = observations
          .filter((o) => new Date(o.timestamp) >= cutoff)
          .reduce((acc, o) => acc + (o.rainfall_1h || 0), 0);
        result[key] = Math.round(sum * 100) / 100;
      }
    }

    return result;
  } catch (err) {
    console.error(
      `[WeatherCollector] Antecedent rainfall computation error: ${err.message}`
    );
    return nullRainfallResult(err.message);
  }
}

function nullRainfallResult(reason) {
  return {
    rainfall_1d_pre: null,
    rainfall_3d_pre: null,
    rainfall_5d_pre: null,
    rainfall_7d_pre: null,
    rainfall_10d_pre: null,
    data_hours: 0,
    history_days: 0,
    observation_count: 0,
    has_full_10d_history: false,
    history_status: "no_data",
    cell_id: null,
    message: `No rainfall history available: ${reason}. Features will be imputed by verified flood preprocessor.`,
    reason,
  };
}

// ── Lifecycle ───────────────────────────────────────────────────────────────

let collectorInterval = null;

function startCollector() {
  console.log(
    `[WeatherCollector] Starting — collecting every ${COLLECTION_INTERVAL_MS / 60000} minutes`
  );

  // Run first collection after a 10-second delay (let MongoDB connect fully)
  setTimeout(() => {
    runCollectionCycle();
  }, 10000);

  // Then repeat on schedule
  collectorInterval = setInterval(runCollectionCycle, COLLECTION_INTERVAL_MS);
}

function stopCollector() {
  if (collectorInterval) {
    clearInterval(collectorInterval);
    collectorInterval = null;
    console.log("[WeatherCollector] Stopped");
  }
}

module.exports = {
  startCollector,
  stopCollector,
  runCollectionCycle,
  computeAntecedentRainfall,
  collectSingleObservation,
};
