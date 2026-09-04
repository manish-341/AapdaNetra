const express = require("express");
const { submitReport, getReports, getReportById, verifyReport, resolveReport } = require("../controllers/citizenReportController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { validateCitizenReport } = require("../middleware/validators");

const router = express.Router();

router.post("/", protect, validateCitizenReport, submitReport);
router.get("/", protect, getReports);
router.get("/:id", protect, getReportById);
router.put("/:id/verify", protect, authorize("ADMIN", "DISTRICT_OFFICER", "FIELD_OFFICER", "RESPONDER"), verifyReport);
router.put("/:id/resolve", protect, authorize("ADMIN", "DISTRICT_OFFICER", "FIELD_OFFICER", "RESPONDER"), resolveReport);

module.exports = router;
