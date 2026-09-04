require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const path = require("path");

const connectDB = require("./config/db");
const errorMiddleware = require("./middleware/errorMiddleware");
const { apiLimiter } = require("./middleware/rateLimiter");

const app = express();

// Trust reverse proxy headers (Render, Heroku, Cloudflare)
app.set("trust proxy", 1);

// Connect MongoDB
connectDB();

// ========================
// SECURITY MIDDLEWARE
// ========================
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false
}));

// CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Rate limiting
app.use("/api/", apiLimiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// NoSQL injection protection (Express 5 compatible)
app.use((req, res, next) => {
    if (req.body) mongoSanitize.sanitize(req.body);
    if (req.params) mongoSanitize.sanitize(req.params);
    if (req.query) mongoSanitize.sanitize(req.query);
    next();
});

// Static files for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ========================
// EXISTING ROUTES
// ========================
const authRoutes = require("./routes/authRoutes");
const habitationRoutes = require("./routes/habitationRoutes");
const hazardRoutes = require("./routes/hazardRoutes");
const riskRoutes = require("./routes/riskRoutes");
const shelterRoutes = require("./routes/shelterRoutes");
const crowdRoutes = require("./routes/crowdRoutes");
const relocationRoutes = require("./routes/relocationRoutes");
const alertRoutes = require("./routes/alertRoutes");

// NEW ROUTES
const aiRoutes = require("./routes/aiRoutes");
const citizenReportRoutes = require("./routes/citizenReportRoutes");
const intelligenceRoutes = require("./routes/intelligenceRoutes");

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", authRoutes);
app.use("/api/habitations", habitationRoutes);
app.use("/api/hazards", hazardRoutes);
app.use("/api/risks", riskRoutes);
app.use("/api/shelters", shelterRoutes);
app.use("/api/crowd", crowdRoutes);
app.use("/api/relocations", relocationRoutes);
app.use("/api/alerts", alertRoutes);

// New AI & Intelligence Routes
app.use("/api/ai", aiRoutes);
app.use("/api/reports/citizen", citizenReportRoutes);
app.use("/api/intelligence", intelligenceRoutes);

// Health check
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "AapdaNetra AI Disaster Intelligence Platform — Backend Running",
        version: "2.0.0",
        timestamp: new Date().toISOString()
    });
});

// 404 route
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// Error middleware
app.use(errorMiddleware);

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🛡️  AapdaNetra AI Platform — Server started on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`   AI Service: ${process.env.AI_SERVICE_URL || "http://localhost:8000"}`);
    console.log(`   Frontend: ${process.env.FRONTEND_URL || "http://localhost:5173"}\n`);
});