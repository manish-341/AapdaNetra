const mongoose = require("mongoose");

const crowdObservationSchema = new mongoose.Schema(
  {
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true
      },

      coordinates: {
        type: [Number],
        required: true
      }
    },

    crowdCount: {
      type: Number,
      required: true,
      min: 0
    },

    density: {
      type: String,
      enum: [
        "LOW",
        "MEDIUM",
        "HIGH",
        "VERY_HIGH"
      ],
      default: "LOW"
    },

    source: {
      type: String,
      enum: [
        "FIELD_REPORT",
        "CCTV_AI",
        "MOBILE_APP",
        "SENSOR",
        "ESTIMATED"
      ],
      required: true
    },

    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    },

    observedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

crowdObservationSchema.index({
  location: "2dsphere"
});

module.exports = mongoose.model(
  "CrowdObservation",
  crowdObservationSchema
);