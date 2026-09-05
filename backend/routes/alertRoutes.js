const express = require("express");
const {
    createAlert,
    getAlerts,
    getAlertById,
    updateAlert,
    dispatchEmergencyAlert,
    broadcastEmergencyAlert
} = require("../controllers/alertController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", createAlert);
router.get("/", getAlerts);

// Dispatch single emergency bulletin / diagnostic
router.post("/dispatch-emergency", dispatchEmergencyAlert);

// Strictly ADMIN-ONLY emergency email alert broadcast to ALL registered users
router.post("/broadcast-emergency", protect, authorize("ADMIN"), broadcastEmergencyAlert);

router.get("/:id", getAlertById);
router.put("/:id", updateAlert);

module.exports = router;