const express = require("express");

const {
    createRiskAssessment,
    getRiskAssessments,
    getRiskAssessmentById,
    updateRiskAssessment
} = require("../controllers/riskController");

const router = express.Router();

router.post("/", createRiskAssessment);
router.get("/", getRiskAssessments);
router.get("/:id", getRiskAssessmentById);
router.put("/:id", updateRiskAssessment);

module.exports = router;