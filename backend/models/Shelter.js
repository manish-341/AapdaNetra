const mongoose = require("mongoose");

const shelterSchema = new mongoose.Schema(
    {
        name: {
            type: String,
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

        address: {
            type: String
        },

        capacity: {
            type: Number,
            required: true,
            min: 0
        },

        currentOccupancy: {
            type: Number,
            default: 0,
            min: 0
        },

        availableCapacity: {
            type: Number,
            default: 0,
            min: 0
        },

        status: {
            type: String,
            enum: ["AVAILABLE", "NEAR_CAPACITY", "FULL", "CLOSED"],
            default: "AVAILABLE"
        },

        facilities: {
            type: [String],
            default: []
            // e.g. ["water", "electricity", "medical", "food", "sanitation"]
        },

        accessibility: {
            type: String,
            enum: ["FULL", "PARTIAL", "LIMITED"],
            default: "FULL"
        },

        riskScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },

        contactNumber: {
            type: String
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

shelterSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Shelter", shelterSchema);