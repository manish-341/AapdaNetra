const express = require("express");

const {
    createAlert,
    getAlerts,
    getAlertById,
    updateAlert
} = require("../controllers/alertController");

const router = express.Router();

router.post("/", createAlert);
router.get("/", getAlerts);
router.get("/:id", getAlertById);
router.put("/:id", updateAlert);

module.exports = router;