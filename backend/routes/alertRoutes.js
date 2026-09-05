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

// Emergency email alert broadcast to ALL registered users
router.post("/broadcast-emergency", (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        return protect(req, res, (err) => {
            if (err) return next();
            next();
        });
    }
    next();
}, broadcastEmergencyAlert);

// Resolve & clear active emergency alerts
router.post("/resolve-emergency", (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        return protect(req, res, (err) => {
            if (err) return next();
            next();
        });
    }
    next();
}, resolveEmergencyAlerts);

router.get("/:id", getAlertById);
router.put("/:id", updateAlert);

module.exports = router;