const mongoose = require("mongoose");

const relocationSchema = new mongoose.Schema(
  {
    habitation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Habitation",
      required: true
    },

    fromLocation: {
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

    destinationShelter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shelter"
    },

    priority: {
      type: String,
      enum: [
        "IMMEDIATE",
        "SHORT_TERM",
        "MEDIUM_TERM",
        "MONITOR"
      ],
      required: true
    },

    populationToRelocate: {
      type: Number,
      required: true,
      min: 0
    },

    reason: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: [
        "PLANNED",
        "APPROVED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED"
      ],
      default: "PLANNED"
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    approvedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

relocationSchema.index({
  fromLocation: "2dsphere"
});

module.exports = mongoose.model(
  "Relocation",
  relocationSchema
);