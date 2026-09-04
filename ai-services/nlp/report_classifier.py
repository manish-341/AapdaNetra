"""
AapdaNetra NLP Report Classifier Module
Classifies free-text citizen disaster reports.
"""

def classify_citizen_text(text: str) -> dict:
    t = text.lower()
    disaster_type = "OTHER"
    severity = "MEDIUM"
    category = "General Incident"
    priority = "MEDIUM"
    confidence = 0.65

    # Rules
    if any(k in t for k in ["flood", "water", "waterlog", "submerged", "overflow", "river", "inundation", "paani", "baadh"]):
        disaster_type = "FLOOD"
        confidence = 0.88
        if any(k in t for k in ["road", "street", "path", "highway"]):
            category = "Road Flooding"
        elif any(k in t for k in ["house", "home", "building", "ghar"]):
            category = "Residential Flooding"
        else:
            category = "General Inundation"

    elif any(k in t for k in ["landslide", "mudslide", "slope", "rockfall", "debris", "collapse", "bhoolskhalan"]):
        disaster_type = "LANDSLIDE"
        confidence = 0.85
        category = "Slope Failure / Landslide"

    elif any(k in t for k in ["fire", "wildfire", "smoke", "blaze", "burning", "flames", "aag"]):
        disaster_type = "WILDFIRE"
        confidence = 0.86
        category = "Fire Hazard"

    elif any(k in t for k in ["earthquake", "tremor", "seismic", "bhookamp"]):
        disaster_type = "EARTHQUAKE"
        confidence = 0.82
        category = "Seismic Activity"

    # Severity evaluation
    if any(k in t for k in ["trap", "trapped", "danger", "urgent", "critical", "death", "rescue", "life"]):
        severity = "CRITICAL"
        priority = "CRITICAL"
    elif any(k in t for k in ["heavy", "major", "rising", "high", "severe"]):
        severity = "HIGH"
        priority = "HIGH"
    elif any(k in t for k in ["minor", "small", "slight", "low"]):
        severity = "LOW"
        priority = "LOW"

    return {
        "disasterType": disaster_type,
        "severity": severity,
        "category": category,
        "priority": priority,
        "confidence": confidence,
        "isOfficialWarning": False,
        "status": "SUBMITTED"
    }
