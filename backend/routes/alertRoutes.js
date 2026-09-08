const express = require("express");
const {
    createAlert,
    getAlerts,
    getAlertById,
    updateAlert,
    dispatchEmergencyAlert,
    broadcastEmergencyAlert,
    resolveEmergencyAlerts
} = require("../controllers/alertController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", createAlert);
router.get("/", getAlerts);

// Dispatch single emergency bulletin / diagnostic
router.post("/dispatch-emergency", dispatchEmergencyAlert);

// Graceful token extraction for broadcast operations
const optionalAuth = async (req, res, next) => {
    try {
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            const token = req.headers.authorization.split(" ")[1];
            if (token) {
                const jwt = require("jsonwebtoken");
                const User = require("../models/User");
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = await User.findById(decoded.id).select("-password");
            }
        }
    } catch (err) {
        // Non-fatal: token expired or invalid, proceed so emergency broadcast is not blocked
    }
    next();
};

// Emergency email alert broadcast to ALL registered users
router.post("/broadcast-emergency", optionalAuth, broadcastEmergencyAlert);

// Resolve & clear active emergency alerts and email All-Clear to ALL registered users
router.post("/resolve-emergency", optionalAuth, resolveEmergencyAlerts);

router.get("/:id", getAlertById);
router.put("/:id", updateAlert);

module.exports = router;