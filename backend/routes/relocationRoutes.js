const express = require("express");

const {
    createRelocation,
    getRelocations,
    getRelocationById,
    updateRelocation
} = require("../controllers/relocationController");

const router = express.Router();

router.post("/", createRelocation);
router.get("/", getRelocations);
router.get("/:id", getRelocationById);
router.put("/:id", updateRelocation);

module.exports = router;