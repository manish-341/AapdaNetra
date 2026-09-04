const { getNearestEmergencyFacilities } = require("../services/emergencyFacilitiesService");

function detectLanguage(text, requestedLang) {
    if (requestedLang && requestedLang !== "auto") return requestedLang;
    if (!text) return "en";
    
    // Devanagari script (Hindi)
    if (/[\u0900-\u097F]/.test(text)) return "hi";
    // Bengali/Assamese script
    if (/[\u0980-\u09FF]/.test(text)) {
        if (/ক'লৈ|কেনে|আহিছে|বানপানী|আশ্ৰয়|সহায়/.test(text)) return "as";
        return "bn";
    }
    
    // Hinglish keywords
    const lower = text.toLowerCase();
    const hinglishWords = [
        "kaha", "kahan", "jaun", "jaye", "karein", "karna", "batao", "pass", "paas", 
        "bacho", "madad", "chahiye", "aaya", "aayi", "hai", "hain", "aspataal", "rahat", 
        "bhookamp", "baadh", "yeh", "kuch", "shuru", "turant", "suraksha", "bhi", "hum", "apke"
    ];
    let matchCount = 0;
    for (const w of hinglishWords) {
        if (new RegExp(`\\b${w}\\b`).test(lower)) matchCount++;
    }
    if (matchCount >= 2) return "hinglish";

    return "en";
}

async function testGenerator() {
    const facilities = await getNearestEmergencyFacilities(26.1445, 91.7362, "Guwahati");
    console.log("Guwahati facilities count:", facilities.hospitals.length, "hospitals,", facilities.shelters.length, "shelters");
    console.log("Detected language 1 ('bhookamp aaya hai kaha jaun'):", detectLanguage("bhookamp aaya hai kaha jaun", "auto"));
    console.log("Detected language 2 ('भूकंप आया है'):", detectLanguage("भूकंप आया है", "auto"));
    console.log("Detected language 3 ('Where is the nearest hospital'):", detectLanguage("Where is the nearest hospital", "auto"));
}

testGenerator();
