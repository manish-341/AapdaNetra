const express = require("express");

const {
    createAlert,
    getAlerts,
    getAlertById,
    updateAlert,
    dispatchEmergencyAlert
} = require("../controllers/alertController");

const router = express.Router();

router.post("/", createAlert);
router.get("/", getAlerts);
router.post("/dispatch-emergency", dispatchEmergencyAlert);
router.get("/:id", getAlertById);
router.put("/:id", updateAlert);

module.exports = router;