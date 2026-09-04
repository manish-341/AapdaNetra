const mongoose = require("mongoose");

const habitationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    district: {
      type: String,
      required: true
    },

    state: {
      type: String,
      required: true
    },

    population: {
      type: Number,
      required: true,
      min: 0
    },

    vulnerablePopulation: {
      type: Number,
      default: 0,
      min: 0
    },

    vulnerabilityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },

    currentRiskScore: {
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
    }
  },
  {
    timestamps: true
  }
);

habitationSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Habitation", habitationSchema);