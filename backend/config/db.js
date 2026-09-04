const mongoose = require("mongoose");
const dns = require("dns");

// Ensure MongoDB Atlas SRV lookups work reliably across Windows & ISP DNS
try {
    dns.setServers(["8.8.8.8", "1.1.1.1", ...dns.getServers()]);
} catch (e) {
    // Ignore if system restricts dns setServers
}

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;