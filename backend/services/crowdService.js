const CitizenReport = require("../models/CitizenReport");

/**
 * Classify citizen report text using NLP rules
 * Falls back to rule-based when Python AI service is unavailable
 */
const classifyReport = (description) => {
    const lower = description.toLowerCase();
    let disasterType = "OTHER";
    let severity = "MEDIUM";
    let category = "General";
    let priority = "MEDIUM";
    let confidence = 0.6;

    // Disaster type detection
    const floodKeywords = ["flood", "water", "submerged", "waterlogged", "inundation", "overflow", "river", "drain", "waterlog", "paani", "baadh"];
    const landslideKeywords = ["landslide", "mudslide", "slope", "debris", "collapse", "hill", "rockfall", "erosion", "cave-in", "bhoolskhalan"];
    const wildfireKeywords = ["fire", "wildfire", "smoke", "burning", "blaze", "flames", "forest fire", "aag"];
    const earthquakeKeywords = ["earthquake", "tremor", "shaking", "seismic", "quake", "bhookamp"];

    if (floodKeywords.some(k => lower.includes(k))) {
        disasterType = "FLOOD";
        confidence = 0.8;
        if (lower.includes("road") || lower.includes("street")) category = "Road flooding";
        else if (lower.includes("house") || lower.includes("home") || lower.includes("ghar")) category = "Residential flooding";
        else if (lower.includes("river") || lower.includes("nadi")) category = "River overflow";
        else category = "General flooding";
    } else if (landslideKeywords.some(k => lower.includes(k))) {
        disasterType = "LANDSLIDE";
        confidence = 0.75;
        if (lower.includes("road") || lower.includes("block")) category = "Road blockage";
        else if (lower.includes("house") || lower.includes("building")) category = "Structural damage";
        else category = "Land movement";
    } else if (wildfireKeywords.some(k => lower.includes(k))) {
        disasterType = "WILDFIRE";
        confidence = 0.8;
        if (lower.includes("forest") || lower.includes("jungle")) category = "Forest fire";
        else if (lower.includes("building") || lower.includes("house")) category = "Structure fire";
        else category = "Open fire";
    } else if (earthquakeKeywords.some(k => lower.includes(k))) {
        disasterType = "EARTHQUAKE";
        confidence = 0.75;
        category = "Seismic event";
    }

    // Severity detection
    const criticalWords = ["emergency", "urgent", "trapped", "life", "death", "critical", "severe", "extreme", "danger", "help", "rescue", "sos"];
    const highWords = ["heavy", "major", "serious", "large", "significant", "rising", "fast", "bad"];
    const lowWords = ["minor", "small", "slight", "little", "slowly"];

    if (criticalWords.some(w => lower.includes(w))) {
        severity = "CRITICAL";
        priority = "CRITICAL";
    } else if (highWords.some(w => lower.includes(w))) {
        severity = "HIGH";
        priority = "HIGH";
    } else if (lowWords.some(w => lower.includes(w))) {
        severity = "LOW";
        priority = "LOW";
    }

    return { disasterType, severity, category, priority, confidence };
};

module.exports = { classifyReport };
