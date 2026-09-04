const { body, param, query, validationResult } = require("express-validator");

// Process validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array().map(e => ({
                field: e.path,
                message: e.msg
            }))
        });
    }
    next();
};

// Sanitize text to prevent prompt injection
const sanitizePrompt = (text) => {
    if (typeof text !== "string") return text;
    // Remove common prompt injection patterns
    const injectionPatterns = [
        /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules)/gi,
        /you\s+are\s+now\s+/gi,
        /forget\s+(all\s+)?(previous|your)\s+/gi,
        /system\s*:\s*/gi,
        /\[INST\]/gi,
        /<<SYS>>/gi,
        /<\|im_start\|>/gi,
    ];
    let cleaned = text;
    for (const pattern of injectionPatterns) {
        cleaned = cleaned.replace(pattern, "[filtered]");
    }
    return cleaned.trim();
};

// Prompt injection protection middleware
const promptInjectionGuard = (fields = ["message", "query", "question"]) => {
    return (req, res, next) => {
        for (const field of fields) {
            if (req.body[field] && typeof req.body[field] === "string") {
                req.body[field] = sanitizePrompt(req.body[field]);
            }
        }
        next();
    };
};

// Auth validators
const validateRegister = [
    body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Name must be 2-100 characters"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("phone").optional({ checkFalsy: true }).isMobilePhone().withMessage("Invalid phone number"),
    body("district").optional().trim().isLength({ max: 100 }),
    body("state").optional().trim().isLength({ max: 100 }),
    body("receiveAlerts").optional().isBoolean(),
    validate
];

const validateLogin = [
    body("email").trim().notEmpty().withMessage("Email or mobile/Admin ID required"),
    body("password").notEmpty().withMessage("Password required"),
    validate
];

// Citizen report validators
const validateCitizenReport = [
    body("description").trim().isLength({ min: 10, max: 2000 }).withMessage("Description must be 10-2000 characters"),
    body("latitude").isFloat({ min: -90, max: 90 }).withMessage("Valid latitude required"),
    body("longitude").isFloat({ min: -180, max: 180 }).withMessage("Valid longitude required"),
    body("disasterType").optional().isIn(["FLOOD", "LANDSLIDE", "WILDFIRE", "EARTHQUAKE", "HEATWAVE", "OTHER"])
        .withMessage("Invalid disaster type"),
    validate
];

// AI chat validators
const validateAIChat = [
    body("message").trim().isLength({ min: 1, max: 1000 }).withMessage("Message must be 1-1000 characters"),
    body("latitude").optional().isFloat({ min: -90, max: 90 }),
    body("longitude").optional().isFloat({ min: -180, max: 180 }),
    validate
];

// Simulation validators
const validateSimulation = [
    body("scenario").isIn(["heavy_rainfall", "extreme_rainfall", "temperature_rise", "wildfire_conditions", "landslide_rainfall"])
        .withMessage("Invalid scenario type"),
    body("adjustmentPercent").isFloat({ min: -100, max: 500 }).withMessage("Adjustment must be -100 to 500"),
    body("latitude").optional().isFloat({ min: -90, max: 90 }),
    body("longitude").optional().isFloat({ min: -180, max: 180 }),
    validate
];

// MongoDB ObjectId validator
const validateObjectId = [
    param("id").isMongoId().withMessage("Invalid ID format"),
    validate
];

module.exports = {
    validate,
    sanitizePrompt,
    promptInjectionGuard,
    validateRegister,
    validateLogin,
    validateCitizenReport,
    validateAIChat,
    validateSimulation,
    validateObjectId
};
