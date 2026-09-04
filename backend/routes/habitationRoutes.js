const express = require("express");

const {
    createHabitation,
    getHabitations,
    getHabitationById,
    updateHabitation,
    deleteHabitation
} = require("../controllers/habitationController");

const router = express.Router();

router.post("/", createHabitation);
router.get("/", getHabitations);
router.get("/:id", getHabitationById);
router.put("/:id", updateHabitation);
router.delete("/:id", deleteHabitation);

module.exports = router;