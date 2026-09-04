const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },

        message: {
            type: String,
            required: true
        },

        severity: {
            type: String,
            enum: ["INFO", "WARNING", "HIGH", "CRITICAL"],
            required: true
        },

        hazardType: {
            type: String,
            enum: ["FLOOD", "LANDSLIDE", "WILDFIRE", "HEATWAVE", "EARTHQUAKE"]
        },

        district: {
            type: String
        },

        state: {
            type: String
        },

        hazardZone: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "HazardZone"
        },

        habitation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Habitation"
        },

        location: {
            type: {
                type: String,
                enum: ["Point"]
            },
            coordinates: {
                type: [Number]
            }
        },

        affectedRadius: {
            type: Number,
            default: 5 // km
        },

        source: {
            type: String,
            enum: ["OFFICIAL", "AI_PREDICTION", "CITIZEN_REPORT"],
            default: "OFFICIAL"
        },

        verificationStatus: {
            type: String,
            enum: ["UNVERIFIED", "VERIFIED", "REJECTED"],
            default: "UNVERIFIED"
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        isActive: {
            type: Boolean,
            default: true
        },

        expiresAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

alertSchema.index({ location: "2dsphere" });
alertSchema.index({ isActive: 1, severity: 1, createdAt: -1 });
alertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Alert", alertSchema);