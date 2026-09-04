const mongoose = require("mongoose");

const riskAssessmentSchema = new mongoose.Schema(
  {
    habitation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Habitation",
      required: true
    },

    hazardZone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HazardZone"
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

    hazardScore: {
      type: Number,
      min: 0,
      max: 100
    },

    exposureScore: {
      type: Number,
      min: 0,
      max: 100
    },

    vulnerabilityScore: {
      type: Number,
      min: 0,
      max: 100
    },

    capacityDeficitScore: {
      type: Number,
      min: 0,
      max: 100
    },

    mlProbability: {
      type: Number,
      min: 0,
      max: 1
    },

    finalRiskScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },

    riskCategory: {
      type: String,
      enum: ["GREEN", "AMBER", "RED", "CRITICAL"],
      required: true
    },

    assessedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "RiskAssessment",
  riskAssessmentSchema
);