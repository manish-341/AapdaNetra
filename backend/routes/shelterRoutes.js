const express = require("express");

const {
    createShelter,
    getShelters,
    getShelterById,
    updateShelter
} = require("../controllers/shelterController");

const router = express.Router();

router.post("/", createShelter);
router.get("/", getShelters);
router.get("/:id", getShelterById);
router.put("/:id", updateShelter);

module.exports = router;