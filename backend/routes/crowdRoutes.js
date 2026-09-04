const express = require("express");

const {
    createCrowdObservation,
    getCrowdObservations,
    getCrowdObservationById
} = require("../controllers/crowdController");

const router = express.Router();

router.post("/", createCrowdObservation);
router.get("/", getCrowdObservations);
router.get("/:id", getCrowdObservationById);

module.exports = router;