import React from "react";
import { GeoJSON, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useThemeMode } from "../../context/ThemeContext";

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
 * Renders a GeoJSON hazard polygon with a floating center badge,
 * dynamic glowing borders, and an AI intelligence emergency briefing popup.
 * Fully adaptive: white in light mode, dark in dark mode.
 */
const RiskZone = ({ zone }) => {
  const { isDark } = useThemeMode();

  if (!zone || !zone.geometry) return null;

  const cfg = getRiskConfig(zone.riskCategory);
  const hazardIcon = HAZARD_ICONS[(zone.hazardType || "").toUpperCase()] || "⚠️";
  const centroid = getCentroid(zone.geometry);

  const zoneStyle = () => ({
    color: cfg.color,
    weight: zone.riskCategory === "CRITICAL" ? 3 : 2,
    opacity: 0.95,
    fillColor: cfg.color,
    fillOpacity: isDark ? cfg.fillOpacity : Math.max(0.12, cfg.fillOpacity - 0.06),
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

  const zoneCode = zone.code || (zone.name?.match(/([A-Z]+-\d+)/i) ? zone.name.match(/([A-Z]+-\d+)/i)[1].toUpperCase() : (zone.district?.toLowerCase().includes("delhi") ? `NCR-${String(Math.abs((zone.name || "0").split("").reduce((acc, c) => (acc << 5) - acc + c.charCodeAt(0), 0)) % 900 + 42).padStart(3, "0")}` : `${(zone.district || "SEC").slice(0, 3).toUpperCase()}-${String(Math.abs((zone.name || "0").split("").reduce((acc, c) => (acc << 5) - acc + c.charCodeAt(0), 0)) % 900 + 12).padStart(3, "0")}`));

  const hazardName = (zone.hazardType || "FLOOD").charAt(0).toUpperCase() + (zone.hazardType || "FLOOD").slice(1).toLowerCase();
  const isCritical = zone.riskCategory === "CRITICAL";

  // Tactical Marker Icon: Reference Design representation
  // For Critical: Red glowing double-border pin + persistent callout HUD card
  // For other levels: Sleek tactical circular pin with hazard icon & short info tooltip
  const tacticalPinIcon = L.divIcon({
    className: "hazard-tactical-marker",
    html: `
      <div class="tactical-pin-container">
        ${
          isCritical
            ? `
          <div class="tactical-callout-card" style="
            border-color: ${cfg.color};
            box-shadow: 0 8px 28px rgba(0,0,0,0.65), 0 0 16px ${cfg.glow};
          ">
            <div class="tactical-callout-header">
              <span style="font-size: 14px; color: ${cfg.color};">⚠️</span>
              <span>${zoneCode}</span>
            </div>
            <div class="tactical-callout-hazard">
              <span>${hazardName} Risk</span>
              <span style="opacity: 0.5; font-size: 9px; margin: 0 2px;">•</span>
              <span class="tactical-callout-score" style="color: ${cfg.color};">${zone.riskScore ? `${zone.riskScore}%` : "82%"}</span>
            </div>
            <div class="tactical-callout-badge" style="background: ${cfg.color};">
              ${zone.riskCategory}
            </div>
          </div>
          <div class="tactical-hazard-pin critical">
            <span style="font-size: 16px; color: #ffffff; line-height: 1;">⚠️</span>
          </div>
        `
            : `
          <div class="tactical-hazard-pin" style="
            background: ${zone.hazardType === "FLOOD" ? "#0284c7" : cfg.color};
            box-shadow: 0 3px 12px ${zone.hazardType === "FLOOD" ? "rgba(2, 132, 199, 0.5)" : cfg.glow};
          ">
            <span style="font-size: 15px; line-height: 1;">${hazardIcon}</span>
          </div>
        `
        }
      </div>
    `,
    iconSize: isCritical ? [160, 110] : [32, 32],
    iconAnchor: isCritical ? [80, 110] : [16, 16],
    popupAnchor: isCritical ? [0, -110] : [0, -18],
  });

  return (
    <>
      <GeoJSON
        key={`${zone._id || zone.name}-${zone.riskCategory}-${isDark ? "dark" : "light"}`}
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
                <div style={{
                  fontWeight: 800,
                  fontSize: 14,
                  color: isDark ? "#f8fafc" : "#0f172a",
                  lineHeight: 1.2
                }}>
                  {zone.name}
                </div>
                <div style={{ fontSize: 11, color: isDark ? "#94a3b8" : "#64748b" }}>
                  {zoneCode} &bull; {zone.district ? `${zone.district}, Sector` : "Monitored Zone"}
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
              <div style={{
                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                padding: "5px 7px",
                borderRadius: 5
              }}>
                <div style={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: 10 }}>Hazard Classification</div>
                <div style={{ fontWeight: 700, color: isDark ? "#e2e8f0" : "#1e293b" }}>{zone.hazardType}</div>
              </div>
              <div style={{
                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                padding: "5px 7px",
                borderRadius: 5
              }}>
                <div style={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: 10 }}>AI Probability</div>
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
              background: isDark ? "rgba(15, 23, 42, 0.7)" : "#f8fafc",
              borderLeft: `3px solid ${cfg.color}`,
              color: isDark ? "#cbd5e1" : "#334155"
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

      {/* Modern Tactical Centroid Icon Pin */}
      {centroid && (
        <Marker position={centroid} icon={tacticalPinIcon}>
          <Popup>
            <div style={{ minWidth: 220, padding: "6px 8px", fontFamily: "inherit" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>{hazardIcon}</span>
                <span style={{ fontWeight: 800, fontSize: 13, color: isDark ? "#ffffff" : "#0f172a" }}>
                  {zoneCode}: {zone.name}
                </span>
              </div>
              <div style={{ fontSize: 11, color: cfg.color, fontWeight: 700, marginBottom: 4 }}>
                {hazardName} Risk Assessment: {zone.riskScore ? `${zone.riskScore}%` : cfg.label} ({zone.riskCategory})
              </div>
              <div style={{ fontSize: 10.5, color: isDark ? "#94a3b8" : "#64748b" }}>
                District: {zone.district || "Delhi Sector"}
              </div>
            </div>
          </Popup>
        </Marker>
      )}
    </>
  );
};

export default RiskZone;
