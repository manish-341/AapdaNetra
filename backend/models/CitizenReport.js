const mongoose = require("mongoose");

const citizenReportSchema = new mongoose.Schema(
    {
        reporter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        description: {
            type: String,
            required: true,
            maxlength: 2000
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
        },

        disasterType: {
            type: String,
            enum: ["FLOOD", "LANDSLIDE", "WILDFIRE", "EARTHQUAKE", "HEATWAVE", "OTHER"],
            default: "OTHER"
        },

        severity: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            default: "MEDIUM"
        },

        category: {
            type: String,
            default: "General"
        },

        priority: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            default: "MEDIUM"
        },

        status: {
            type: String,
            enum: ["SUBMITTED", "UNDER_REVIEW", "VERIFIED", "REJECTED", "RESOLVED"],
            default: "SUBMITTED"
        },

        aiClassification: {
            disasterType: String,
            severity: String,
            category: String,
            priority: String,
            confidence: Number
        },

        imageUrl: {
            type: String
        },

        visionAnalysis: {
            detections: [{
                label: String,
                confidence: Number,
                bbox: [Number]
            }],
            analyzedAt: Date
        },

        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        verifiedAt: {
            type: Date
        },

        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        resolvedAt: {
            type: Date
        },

        rejectionReason: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

citizenReportSchema.index({ location: "2dsphere" });
citizenReportSchema.index({ status: 1, createdAt: -1 });
citizenReportSchema.index({ disasterType: 1 });

module.exports = mongoose.model("CitizenReport", citizenReportSchema);
