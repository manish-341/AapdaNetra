const express = require("express");

const {
    createHazardZone,
    getHazardZones,
    getHazardZoneById,
    updateHazardZone,
    deleteHazardZone
} = require("../controllers/hazardController");

const router = express.Router();

router.post("/", createHazardZone);
router.get("/", getHazardZones);
router.get("/:id", getHazardZoneById);
router.put("/:id", updateHazardZone);
router.delete("/:id", deleteHazardZone);

module.exports = router;