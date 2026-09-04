const express = require("express");
const {
    register,
    login,
    getMe,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    googleAuth,
    googleCallback,
    googleDirectLogin
} = require("../controllers/authController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { validateRegister, validateLogin } = require("../middleware/validators");
const { authLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// Public auth routes
router.post("/register", authLimiter, validateRegister, register);
router.post("/login", authLimiter, validateLogin, login);

// Google OAuth 2.0 routes
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);
router.post("/google-direct", googleDirectLogin);

// Protected routes
router.get("/me", protect, getMe);
router.get("/", protect, authorize("ADMIN", "DISTRICT_OFFICER"), getUsers);
router.get("/:id", protect, getUserById);
router.put("/:id", protect, updateUser);
router.delete("/:id", protect, authorize("ADMIN"), deleteUser);

module.exports = router;