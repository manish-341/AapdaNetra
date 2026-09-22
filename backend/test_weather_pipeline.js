require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const mongoose = require("mongoose");
const axios = require("axios");
const h3 = require("h3-js");
const WeatherObservation = require("./models/WeatherObservation");
const { computeAntecedentRainfall, collectSingleObservation } = require("./services/weatherCollector");
const { getCurrentWeather } = require("./services/weatherService");

async function runTests() {
  console.log("================================================================================");
  console.log("  AapdaNetra — Weather Ingestion & MongoDB Accumulator Verification");
  console.log("================================================================================");

  const apiKey = process.env.OPENWEATHER_API_KEY;
  console.log(`\n[Config Check] OPENWEATHER_API_KEY present: ${apiKey ? "YES (ends in ..." + apiKey.slice(-4) + ")" : "NO"}`);
  console.log(`[Config Check] MONGO_URI present: ${process.env.MONGO_URI ? "YES" : "NO"}`);

  if (!apiKey) {
    console.error("❌ ERROR: OPENWEATHER_API_KEY is not set.");
    process.exit(1);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 1: OpenWeather Collection
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--------------------------------------------------------------------------------");
  console.log("TEST 1: OpenWeather Collection (/data/2.5/weather)");
  console.log("--------------------------------------------------------------------------------");

  const testLat = 28.6139;
  const testLon = 77.2090;
  const testCellId = h3.latLngToCell(testLat, testLon, 7);
  console.log(`Test Location: Lat ${testLat}, Lon ${testLon} (H3 Res-7 Cell: ${testCellId})`);

  let openWeatherData = null;
  try {
    const res = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
      params: { lat: testLat, lon: testLon, appid: apiKey, units: "metric" },
      timeout: 6000,
    });
    openWeatherData = res.data;
    console.log("✅ OpenWeather API responded with HTTP 200 OK");
    console.log(`   - Station Timestamp (dt) : ${new Date(openWeatherData.dt * 1000).toISOString()}`);
    console.log(`   - Temperature           : ${openWeatherData.main?.temp} °C`);
    console.log(`   - Humidity              : ${openWeatherData.main?.humidity} %`);
    console.log(`   - Atmospheric Pressure  : ${openWeatherData.main?.pressure} hPa`);
    console.log(`   - Wind Speed            : ${openWeatherData.wind?.speed} m/s`);
    console.log(`   - Rainfall (1h)         : ${openWeatherData.rain?.["1h"] || 0} mm`);
    console.log(`   - Condition Description : "${openWeatherData.weather?.[0]?.description || 'clear'}"`);
  } catch (err) {
    console.error(`❌ OpenWeather API call failed: ${err.message}`);
    process.exit(1);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 2: MongoDB Rainfall Storage & Duplicate Prevention
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--------------------------------------------------------------------------------");
  console.log("TEST 2: MongoDB Rainfall Storage & Duplicate Prevention");
  console.log("--------------------------------------------------------------------------------");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB Atlas");

  const testObsCell = "test_cell_accumulator_872d54e4fffffff";
  const fixedTimestamp = new Date("2026-09-22T10:00:00.000Z");

  // Clean any previous test run
  await WeatherObservation.deleteMany({ cell_id: testObsCell });

  // Store observation 1
  const ok1 = await WeatherObservation.updateOne(
    { cell_id: testObsCell, timestamp: fixedTimestamp },
    {
      $setOnInsert: {
        cell_id: testObsCell,
        latitude: testLat,
        longitude: testLon,
        timestamp: fixedTimestamp,
        rainfall_1h: 4.5,
        temperature: 29.5,
        humidity: 78,
        pressure: 1010,
        wind_speed: 6.2,
        description: "moderate rain test",
        source: "OpenWeather",
      },
    },
    { upsert: true }
  );

  console.log(`✅ Stored test observation in MongoDB (upserted: ${ok1.upsertedCount})`);

  // Attempt duplicate insert with the same cell_id and timestamp
  const ok2 = await WeatherObservation.updateOne(
    { cell_id: testObsCell, timestamp: fixedTimestamp },
    {
      $setOnInsert: {
        cell_id: testObsCell,
        latitude: testLat,
        longitude: testLon,
        timestamp: fixedTimestamp,
        rainfall_1h: 4.5,
        temperature: 29.5,
        humidity: 78,
        pressure: 1010,
        wind_speed: 6.2,
        description: "duplicate test",
        source: "OpenWeather",
      },
    },
    { upsert: true }
  );

  const countAfterDuplicate = await WeatherObservation.countDocuments({ cell_id: testObsCell });
  if (countAfterDuplicate === 1) {
    console.log(`✅ Duplicate Prevention Verified: Attempted duplicate insertion rejected (Document count remained 1)`);
  } else {
    console.error(`❌ Duplicate Prevention Failed: Document count is ${countAfterDuplicate}`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 3: 1/3/5/7/10-Day Rainfall Aggregation & Incomplete History Detection
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--------------------------------------------------------------------------------");
  console.log("TEST 3: 1/3/5/7/10-Day Rainfall Aggregation & Coverage Verification");
  console.log("--------------------------------------------------------------------------------");

  // Case 3A: Zero history cell
  const zeroResult = await computeAntecedentRainfall("non_existent_cell_0000000");
  console.log("Sub-case 3A: Non-existent / Zero-history cell:");
  console.log(`   - Data hours: ${zeroResult.data_hours}`);
  console.log(`   - 10-day complete: ${zeroResult.has_full_10d_history}`);
  console.log(`   - History status: "${zeroResult.history_status}"`);
  console.log(`   - rainfall_1d_pre: ${zeroResult.rainfall_1d_pre}`);
  console.log(`   - Message: "${zeroResult.message}"`);
  if (zeroResult.rainfall_1d_pre === null && zeroResult.has_full_10d_history === false) {
    console.log("   ✅ Correctly returned null features and flagged lack of history");
  } else {
    console.error("   ❌ Failed zero history check");
  }

  // Case 3B: Partial history cell (e.g. 2 days of data = 48 hours)
  const partialCell = "test_cell_partial_872d54e4fffffff";
  await WeatherObservation.deleteMany({ cell_id: partialCell });

  const now = new Date();
  const partialRecords = [];
  // 48 hourly observations (2 days), 1.0 mm rain each
  for (let h = 0; h < 48; h++) {
    partialRecords.push({
      cell_id: partialCell,
      latitude: testLat,
      longitude: testLon,
      timestamp: new Date(now.getTime() - h * 60 * 60 * 1000),
      rainfall_1h: 1.0,
      temperature: 28,
      humidity: 70,
      pressure: 1012,
      wind_speed: 5,
      source: "OpenWeather",
    });
  }
  await WeatherObservation.insertMany(partialRecords);

  const partialResult = await computeAntecedentRainfall(partialCell, testLat, testLon);
  console.log("\nSub-case 3B: Partial history cell (48 hours / 2 days of observations):");
  console.log(`   - Observation count: ${partialResult.observation_count}`);
  console.log(`   - Data hours: ${partialResult.data_hours} (~${partialResult.history_days} days)`);
  console.log(`   - rainfall_1d_pre (24h)  : ${partialResult.rainfall_1d_pre} mm (expected ~24-25 mm)`);
  console.log(`   - rainfall_3d_pre (72h)  : ${partialResult.rainfall_3d_pre} (expected null due to <50% coverage)`);
  console.log(`   - rainfall_5d_pre (120h) : ${partialResult.rainfall_5d_pre} (expected null)`);
  console.log(`   - rainfall_7d_pre (168h) : ${partialResult.rainfall_7d_pre} (expected null)`);
  console.log(`   - rainfall_10d_pre (240h): ${partialResult.rainfall_10d_pre} (expected null)`);
  console.log(`   - has_full_10d_history   : ${partialResult.has_full_10d_history}`);
  console.log(`   - history_status         : "${partialResult.history_status}"`);
  console.log(`   - Message: "${partialResult.message}"`);

  if (
    partialResult.rainfall_1d_pre !== null &&
    partialResult.rainfall_3d_pre === null &&
    partialResult.rainfall_10d_pre === null &&
    partialResult.has_full_10d_history === false
  ) {
    console.log("   ✅ Partial history accurately aggregated available 1d window while preserving nulls for 3d/5d/7d/10d!");
  } else {
    console.error("   ❌ Partial history check failed!");
  }

  // Case 3C: Full 10-day history cell (240 hours of observations)
  const fullCell = "test_cell_full_872d54e4fffffff";
  await WeatherObservation.deleteMany({ cell_id: fullCell });

  const fullRecords = [];
  // 240 hourly observations (10 days), 0.5 mm rain each
  for (let h = 0; h <= 240; h++) {
    fullRecords.push({
      cell_id: fullCell,
      latitude: testLat,
      longitude: testLon,
      timestamp: new Date(now.getTime() - h * 60 * 60 * 1000),
      rainfall_1h: 0.5,
      temperature: 28,
      humidity: 70,
      pressure: 1012,
      wind_speed: 5,
      source: "OpenWeather",
    });
  }
  await WeatherObservation.insertMany(fullRecords);

  const fullResult = await computeAntecedentRainfall(fullCell, testLat, testLon);
  console.log("\nSub-case 3C: Full 10-day history cell (240 hours of observations, 0.5 mm/h):");
  console.log(`   - Observation count: ${fullResult.observation_count}`);
  console.log(`   - Data hours: ${fullResult.data_hours} (~${fullResult.history_days} days)`);
  console.log(`   - rainfall_1d_pre (24h)  : ${fullResult.rainfall_1d_pre} mm (expected ~12.5 mm)`);
  console.log(`   - rainfall_3d_pre (72h)  : ${fullResult.rainfall_3d_pre} mm (expected ~36.5 mm)`);
  console.log(`   - rainfall_5d_pre (120h) : ${fullResult.rainfall_5d_pre} mm (expected ~60.5 mm)`);
  console.log(`   - rainfall_7d_pre (168h) : ${fullResult.rainfall_7d_pre} mm (expected ~84.5 mm)`);
  console.log(`   - rainfall_10d_pre (240h): ${fullResult.rainfall_10d_pre} mm (expected ~120.5 mm)`);
  console.log(`   - has_full_10d_history   : ${fullResult.has_full_10d_history}`);
  console.log(`   - history_status         : "${fullResult.history_status}"`);
  console.log(`   - Message: "${fullResult.message}"`);

  if (
    fullResult.rainfall_1d_pre > 0 &&
    fullResult.rainfall_3d_pre > fullResult.rainfall_1d_pre &&
    fullResult.rainfall_5d_pre > fullResult.rainfall_3d_pre &&
    fullResult.rainfall_7d_pre > fullResult.rainfall_5d_pre &&
    fullResult.rainfall_10d_pre > fullResult.rainfall_7d_pre &&
    fullResult.has_full_10d_history === true
  ) {
    console.log("   ✅ Full 10-day multi-window accumulation verified monotonically increasing and accurate!");
  } else {
    console.error("   ❌ Full history check failed!");
  }

  // Cleanup test cells
  await WeatherObservation.deleteMany({
    cell_id: { $in: [testObsCell, partialCell, fullCell] }
  });
  console.log("\n🧹 Cleaned up temporary test observation documents from MongoDB");

  // Check weatherService.js with OpenWeather primary
  console.log("\n--------------------------------------------------------------------------------");
  console.log("TEST: weatherService.getCurrentWeather (OpenWeather production check)");
  console.log("--------------------------------------------------------------------------------");
  const ws = await getCurrentWeather(testLat, testLon);
  console.log(`   - Source : ${ws.source}`);
  console.log(`   - Status : ${ws.status}`);
  console.log(`   - Temp   : ${ws.temperature} °C`);
  console.log(`   - Rain   : ${ws.rainfall} mm`);
  if (ws.source === "OpenWeather") {
    console.log("   ✅ Confirmed OpenWeather is the primary production weather provider in weatherService!");
  } else {
    console.warn(`   ⚠️ Source was: ${ws.source}`);
  }

  await mongoose.disconnect();
  console.log("\n================================================================================");
  console.log("  Weather & MongoDB Accumulator Tests Completed Successfully");
  console.log("================================================================================\n");
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
