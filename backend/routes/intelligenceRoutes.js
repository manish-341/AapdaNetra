const express = require("express");
const { simulate, getEvacuation, getShelterRecommendation, getWeather, getForecast, getDashboardStats, getEvacuationCorridors, changeDistrict } = require("../controllers/intelligenceController");
const { protect, optionalProtect, authorize } = require("../middleware/authMiddleware");
const { validateSimulation } = require("../middleware/validators");
const { aiLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// District location provisioning & resolution
router.post("/set-district", changeDistrict);

// Dashboard stats
router.get("/dashboard", protect, getDashboardStats);

// Weather
router.get("/weather", optionalProtect, getWeather);

// Forecast
router.get("/forecast", optionalProtect, getForecast);

// Shelter recommendation
router.get("/shelters/recommend", protect, getShelterRecommendation);

// Evacuation
router.post("/evacuation", protect, getEvacuation);

// Evacuation Corridors (Turn-by-turn road paths)
router.get("/evacuation-routes", protect, getEvacuationCorridors);

// Simulation (admin/responder only)
router.post("/simulation", protect, authorize("ADMIN", "DISTRICT_OFFICER", "RESPONDER"), aiLimiter, validateSimulation, simulate);

module.exports = router;
