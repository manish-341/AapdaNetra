const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      }
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local"
    },

    avatar: {
      type: String
    },

    phone: {
      type: String
    },

    role: {
      type: String,
      enum: [
        "ADMIN",
        "DISTRICT_OFFICER",
        "FIELD_OFFICER",
        "RESPONDER",
        "CITIZEN"
      ],
      default: "CITIZEN"
    },

    district: {
      type: String
    },

    state: {
      type: String
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);