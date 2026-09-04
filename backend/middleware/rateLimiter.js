const rateLimit = require("express-rate-limit");

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please try again later."
    }
});

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many authentication attempts. Please try again later."
    }
});

// AI endpoint limiter (expensive operations)
const aiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "AI request limit reached. Please wait a moment."
    }
});

// Upload limiter
const uploadLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Upload limit reached. Please try again later."
    }
});

module.exports = { apiLimiter, authLimiter, aiLimiter, uploadLimiter };
