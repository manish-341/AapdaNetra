import React from "react";
import { GeoJSON, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Threat color matrix
const RISK_CONFIG = {
  CRITICAL: {
    color: "#ef4444",
    glow: "rgba(239, 68, 68, 0.4)",
    label: "CRITICAL",
    fillOpacity: 0.32,
    dashArray: "6, 6",
  },
  RED: {
    color: "#f97316",
    glow: "rgba(249, 115, 22, 0.35)",
    label: "HIGH RISK",
    fillOpacity: 0.28,
    dashArray: "8, 6",
  },
  AMBER: {
    color: "#eab308",
    glow: "rgba(234, 179, 8, 0.3)",
    label: "MODERATE",
    fillOpacity: 0.22,
    dashArray: null,
  },
  GREEN: {
    color: "#10b981",
    glow: "rgba(16, 185, 129, 0.25)",
    label: "SAFE",
    fillOpacity: 0.16,
    dashArray: null,
  },
};

const HAZARD_ICONS = {
  FLOOD: "🌊",
  LANDSLIDE: "🏔️",
  WILDFIRE: "🔥",
  HEATWAVE: "☀️",
  EARTHQUAKE: "🌍",
};

const getRiskConfig = (category) =>
  RISK_CONFIG[category] || {
    color: "#64748b",
    glow: "rgba(100, 116, 139, 0.2)",
    label: category || "MONITORED",
    fillOpacity: 0.2,
    dashArray: null,
  };

// Compute centroid [lat, lng] from GeoJSON Polygon / MultiPolygon
function getCentroid(geometry) {
  if (!geometry || !geometry.coordinates) return null;
  let totalLat = 0;
  let totalLng = 0;
  let count = 0;

  const traverse = (coords) => {
    if (!Array.isArray(coords)) return;
    if (
      coords.length >= 2 &&
      typeof coords[0] === "number" &&
      typeof coords[1] === "number"
    ) {
      totalLng += coords[0];
      totalLat += coords[1];
      count += 1;
    } else {
      coords.forEach(traverse);
    }
  };

  traverse(geometry.coordinates);
  if (count === 0) return null;
  return [totalLat / count, totalLng / count];
}

/**
 * Tactical RiskZone
 * Renders a high-tech GeoJSON hazard polygon with a floating center badge,
 * dynamic glowing borders, and an AI intelligence emergency briefing popup.
 */
const RiskZone = ({ zone }) => {
  if (!zone || !zone.geometry) return null;

  const cfg = getRiskConfig(zone.riskCategory);
  const hazardIcon = HAZARD_ICONS[(zone.hazardType || "").toUpperCase()] || "⚠️";
  const centroid = getCentroid(zone.geometry);

  const zoneStyle = () => ({
    color: cfg.color,
    weight: zone.riskCategory === "CRITICAL" ? 3 : 2,
    opacity: 0.95,
    fillColor: cfg.color,
    fillOpacity: cfg.fillOpacity,
    dashArray: cfg.dashArray,
  });

  const feature = {
    type: "Feature",
    properties: {
      name: zone.name,
      riskCategory: zone.riskCategory,
      hazardType: zone.hazardType,
      district: zone.district,
      riskScore: zone.riskScore,
      severity: zone.severity,
      probability: zone.probability,
    },
    geometry: zone.geometry,
  };

  // Center badge divIcon so users instantly understand the zone at a glance
  const badgeIcon = L.divIcon({
    className: "hazard-zone-badge",
    html: `
      <div class="hazard-badge-content" style="
        background: rgba(15, 23, 42, 0.88);
        border: 1.5px solid ${cfg.color};
        color: #ffffff;
        box-shadow: 0 0 12px ${cfg.glow};
      ">
        <span style="font-size: 13px;">${hazardIcon}</span>
        <span style="color: ${cfg.color}; font-weight: 800;">${zone.hazardType || "RISK"}</span>
        <span style="opacity: 0.6; font-size: 9px;">•</span>
        <span style="font-size: 10px; color: ${cfg.color};">${zone.riskScore ? `${zone.riskScore}%` : cfg.label}</span>
      </div>
    `,
    iconSize: [120, 24],
    iconAnchor: [60, 12],
  });

  return (
    <>
      <GeoJSON
        key={`${zone._id || zone.name}-${zone.riskCategory}`}
        data={feature}
        style={zoneStyle}
      >
        <Popup>
          <div style={{ minWidth: 240, padding: "8px 10px", fontFamily: "inherit" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{
                fontSize: 20,
                width: 34,
                height: 34,
                borderRadius: 8,
                background: cfg.glow,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${cfg.color}`
              }}>
                {hazardIcon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#f8fafc", lineHeight: 1.2 }}>
                  {zone.name}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  {zone.district ? `${zone.district}, Sector` : "Monitored Zone"}
                </div>
              </div>
            </div>

            {/* Severity Pill Banner */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "4px 8px",
              borderRadius: 6,
              background: cfg.glow,
              border: `1px solid ${cfg.color}`,
              marginBottom: 10
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>
                {zone.riskCategory} THREAT LEVEL
              </span>
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                padding: "1px 6px",
                borderRadius: 4,
                backgroundColor: cfg.color,
                color: "#ffffff"
              }}>
                SCORE: {zone.riskScore || 0}/100
              </span>
            </div>

            {/* Metrics Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 6,
              fontSize: 11,
              marginBottom: 10
            }}>
              <div style={{ background: "rgba(255,255,255,0.05)", padding: "5px 7px", borderRadius: 5 }}>
                <div style={{ color: "#94a3b8", fontSize: 10 }}>Hazard Classification</div>
                <div style={{ fontWeight: 700, color: "#e2e8f0" }}>{zone.hazardType}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.05)", padding: "5px 7px", borderRadius: 5 }}>
                <div style={{ color: "#94a3b8", fontSize: 10 }}>AI Probability</div>
                <div style={{ fontWeight: 700, color: cfg.color }}>
                  {typeof zone.probability === "number" ? `${Math.round(zone.probability * 100)}%` : "Verified"}
                </div>
              </div>
            </div>

            {/* AI Tactical Directive */}
            <div style={{
              fontSize: 11,
              lineHeight: 1.35,
              padding: "6px 8px",
              borderRadius: 6,
              background: "rgba(15, 23, 42, 0.7)",
              borderLeft: `3px solid ${cfg.color}`,
              color: "#cbd5e1"
            }}>
              {zone.riskCategory === "CRITICAL"
                ? "🚨 Critical Alert: Evacuate low-lying residents immediately via safe corridors."
                : zone.riskCategory === "RED"
                ? "⚠️ High Risk: Deploy emergency sandbags & close underpass routes."
                : zone.riskCategory === "AMBER"
                ? "👁️ Advisory: Monitor water levels and storm drain capacity closely."
                : "✅ Baseline: Normal automated sensor monitoring active."}
            </div>
          </div>
        </Popup>
      </GeoJSON>

      {/* Floating Centroid Badge so the map explains itself without requiring a click */}
      {centroid && (
        <Marker position={centroid} icon={badgeIcon} interactive={false} />
      )}
    </>
  );
};

export default RiskZone;
