import React from "react";
import { GeoJSON, Popup } from "react-leaflet";

// Maps riskCategory -> stroke/fill color for the zone polygon.
const RISK_COLORS = {
  GREEN: "#2e7d32",
  AMBER: "#f9a825",
  RED: "#ef6c00",
  CRITICAL: "#b71c1c",
};

const getRiskColor = (category) => RISK_COLORS[category] || "#757575";

/**
 * RiskZone
 * Renders a single hazard zone's GeoJSON geometry (Polygon or MultiPolygon)
 * on the Leaflet map, styled by riskCategory, with an info popup.
 *
 * Props:
 *   zone: {
 *     _id, name, hazardType, district, severity,
 *     riskScore, riskCategory, probability,
 *     geometry: { type: "Polygon" | "MultiPolygon", coordinates: [...] }
 *   }
 */
const RiskZone = ({ zone }) => {
  if (!zone || !zone.geometry) return null;

  const zoneStyle = () => ({
    color: getRiskColor(zone.riskCategory),
    weight: 3,
    opacity: 0.95,
    fillColor: getRiskColor(zone.riskCategory),
    fillOpacity: 0.45,
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
      probability: zone.probability
    },
    geometry: zone.geometry
  };

  return (
    <GeoJSON key={`${zone._id || zone.name}-${zone.riskCategory}`} data={feature} style={zoneStyle}>
      <Popup>
        <div style={{ minWidth: 200, fontFamily: "inherit" }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{zone.name}</div>
          <div>Hazard Type: {zone.hazardType}</div>
          {zone.district && <div>District: {zone.district}</div>}
          <div>Risk Score: {zone.riskScore}</div>
          <div>
            Risk Category:{" "}
            <span
              style={{
                color: getRiskColor(zone.riskCategory),
                fontWeight: 600,
              }}
            >
              {zone.riskCategory}
            </span>
          </div>
          {typeof zone.probability === "number" && (
            <div>Probability: {(zone.probability * 100).toFixed(0)}%</div>
          )}
          {typeof zone.severity === "number" && (
            <div>Severity: {zone.severity}</div>
          )}
        </div>
      </Popup>
    </GeoJSON>
  );
};

export default RiskZone;
