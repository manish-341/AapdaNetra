const CitizenReport = require("../models/CitizenReport");
const { classifyReport } = require("../services/crowdService");

// Submit citizen report
const submitReport = async (req, res) => {
    try {
        const { description, latitude, longitude, disasterType, imageUrl } = req.body;

        // AI classification
        const aiClassification = classifyReport(description);

        const report = await CitizenReport.create({
            reporter: req.user?._id,
            description,
            location: {
                type: "Point",
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            disasterType: disasterType || aiClassification.disasterType,
            severity: aiClassification.severity,
            category: aiClassification.category,
            priority: aiClassification.priority,
            status: "SUBMITTED",
            aiClassification,
            imageUrl
        });

        res.status(201).json({
            success: true,
            message: "Report submitted successfully",
            data: report
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get reports
const getReports = async (req, res) => {
    try {
        const { status, disasterType, limit = 50 } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (disasterType) filter.disasterType = disasterType;

        const reports = await CitizenReport.find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate("reporter", "name role")
            .populate("verifiedBy", "name role");

        res.status(200).json({
            success: true,
            count: reports.length,
            data: reports
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single report
const getReportById = async (req, res) => {
    try {
        const report = await CitizenReport.findById(req.params.id)
            .populate("reporter", "name role")
            .populate("verifiedBy", "name role");
        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }
        res.status(200).json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Verify report (responder/admin only)
const verifyReport = async (req, res) => {
    try {
        const { action, rejectionReason } = req.body;
        const report = await CitizenReport.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }

        if (action === "verify") {
            report.status = "VERIFIED";
            report.verifiedBy = req.user._id;
            report.verifiedAt = new Date();
        } else if (action === "reject") {
            report.status = "REJECTED";
            report.verifiedBy = req.user._id;
            report.verifiedAt = new Date();
            report.rejectionReason = rejectionReason || "Not verified";
        } else {
            return res.status(400).json({ success: false, message: "Action must be 'verify' or 'reject'" });
        }

        await report.save();
        res.status(200).json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Resolve report
const resolveReport = async (req, res) => {
    try {
        const report = await CitizenReport.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }
        report.status = "RESOLVED";
        report.resolvedBy = req.user._id;
        report.resolvedAt = new Date();
        await report.save();
        res.status(200).json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { submitReport, getReports, getReportById, verifyReport, resolveReport };
