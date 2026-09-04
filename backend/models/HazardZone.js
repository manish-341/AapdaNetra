const mongoose = require("mongoose");

const hazardZoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    hazardType: {
      type: String,
      enum: [
        "FLOOD",
        "LANDSLIDE",
        "WILDFIRE",
        "HEATWAVE",
        "EARTHQUAKE"
      ],
      required: true
    },

    district: {
      type: String,
      required: true
    },

    state: {
      type: String,
      required: true
    },

    severity: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },

    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },

    riskCategory: {
      type: String,
      enum: ["GREEN", "AMBER", "RED", "CRITICAL"],
      default: "GREEN"
    },

    probability: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    },

    geometry: {
      type: {
        type: String,
        enum: ["Polygon", "MultiPolygon"],
        required: true
      },

      coordinates: {
        type: Array,
        required: true
      }
    },

    source: {
      type: String
    },

    validUntil: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

hazardZoneSchema.index({ geometry: "2dsphere" });

module.exports = mongoose.model("HazardZone", hazardZoneSchema);