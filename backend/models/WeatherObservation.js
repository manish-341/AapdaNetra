const mongoose = require("mongoose");

/**
 * WeatherObservation — Timestamped rainfall & weather snapshots
 *
 * Populated by the scheduled weatherCollector service using OpenWeather API.
 * Used to compute antecedent cumulative rainfall features required by the
 * verified flood model (rainfall_1d_pre through rainfall_10d_pre).
 *
 * TTL index auto-removes records older than 15 days (model only needs 10).
 */
const weatherObservationSchema = new mongoose.Schema(
  {
    cell_id: {
      type: String,
      required: true,
      index: true,
      comment: "H3 resolution-7 cell identifier",
    },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    rainfall_1h: {
      type: Number,
      default: 0,
      comment: "Rainfall in mm over the last hour (OpenWeather rain.1h)",
    },
    temperature: { type: Number, comment: "Temperature in °C" },
    humidity: { type: Number, comment: "Relative humidity %" },
    pressure: { type: Number, comment: "Atmospheric pressure hPa" },
    wind_speed: { type: Number, comment: "Wind speed m/s" },
    description: { type: String, comment: "OpenWeather weather description" },
    source: { type: String, default: "OpenWeather" },
  },
  {
    timestamps: false, // we manage timestamp ourselves
  }
);

// Compound unique index for fast antecedent rainfall aggregation and duplicate prevention
weatherObservationSchema.index({ cell_id: 1, timestamp: -1 }, { unique: true });

// TTL index: auto-delete documents older than 15 days (1,296,000 seconds)
weatherObservationSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 15 * 24 * 60 * 60 }
);

module.exports = mongoose.model("WeatherObservation", weatherObservationSchema);
