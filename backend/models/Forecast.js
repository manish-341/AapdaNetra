const mongoose = require("mongoose");

const forecastSchema = new mongoose.Schema(
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

        locationName: {
            type: String
        },

        indicator: {
            type: String,
            enum: ["RAINFALL", "TEMPERATURE", "FLOOD_RISK", "FIRE_RISK", "LANDSLIDE_RISK", "WIND_SPEED", "HUMIDITY"],
            required: true
        },

        currentValue: {
            type: Number,
            required: true
        },

        unit: {
            type: String,
            default: ""
        },

        forecasts: [{
            horizon: {
                type: String,
                enum: ["6h", "12h", "24h", "48h"],
                required: true
            },
            value: {
                type: Number,
                required: true
            },
            confidence: {
                type: Number,
                min: 0,
                max: 1,
                default: 0.5
            },
            riskLevel: {
                type: String,
                enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
            }
        }],

        modelVersion: {
            type: String,
            default: "gru-v1"
        },

        generatedAt: {
            type: Date,
            default: Date.now
        },

        dataSource: {
            type: String,
            default: "AapdaNetra AI"
        },

        isSimulation: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

forecastSchema.index({ location: "2dsphere" });
forecastSchema.index({ indicator: 1, generatedAt: -1 });

module.exports = mongoose.model("Forecast", forecastSchema);
