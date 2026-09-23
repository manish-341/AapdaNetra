import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useThemeMode } from "../../context/ThemeContext";

/**
 * Tactical Shelter Marker
 * Renders an emergency shelter with live vacancy indicator,
 * modern tactical pin design, and rich shelter operational details.
 * Fully adaptive: white badge in light mode, dark badge in dark mode.
 */
const createShelterIcon = (status, availableCapacity, isDark) => {
  const isAvailable = status === "AVAILABLE" || availableCapacity > 0;
  const isFull = status === "FULL" || availableCapacity === 0;

  const statusColor = isAvailable ? "#10b981" : isFull ? "#f97316" : "#ef4444";
  const badgeText = isAvailable ? `${availableCapacity || "Open"}` : "FULL";

  const badgeBg = isDark ? "rgba(15, 23, 42, 0.92)" : "#ffffff";
  const badgeTextColor = isDark ? statusColor : "#0f172a";
  const badgeShadow = isDark ? "0 2px 6px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.15)";

  return L.divIcon({
    className: "shelter-tactical-marker",
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -100%);
      ">
        <!-- Top Vacancy Badge -->
        <div style="
          background: ${badgeBg};
          border: 1.5px solid ${statusColor};
          color: ${badgeTextColor};
          font-size: 9px;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 4px;
          white-space: nowrap;
          margin-bottom: 2px;
          box-shadow: ${badgeShadow};
        ">${badgeText}</div>

        <!-- Shelter Pin Body -->
        <div style="
          width: 28px;
          height: 28px;
          background: #0284c7;
          border: 2px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        ">
          <span style="
            transform: rotate(45deg);
            font-size: 13px;
          ">🏠</span>
        </div>
      </div>
    `,
    iconSize: [40, 48],
    iconAnchor: [20, 48],
    popupAnchor: [0, -48],
  });
};

const ShelterMarker = ({ shelter }) => {
  const { isDark } = useThemeMode();

  if (!shelter || !shelter.location || !Array.isArray(shelter.location.coordinates)) {
    return null;
  }

  const [lng, lat] = shelter.location.coordinates;
  const available = shelter.availableCapacity ?? Math.max(0, (shelter.capacity || 0) - (shelter.currentOccupancy || 0));
  const occupancyPct = shelter.capacity > 0 ? Math.round(((shelter.currentOccupancy || 0) / shelter.capacity) * 100) : 0;
  const isAvailable = shelter.status === "AVAILABLE" || available > 0;

  return (
    <Marker
      position={[lat, lng]}
      icon={createShelterIcon(shelter.status, available, isDark)}
    >
      <Popup>
        <div style={{ minWidth: 230, padding: "8px 10px", fontFamily: "inherit" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{
              fontSize: 20,
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(2, 132, 199, 0.2)",
              border: "1px solid #0284c7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              🏠
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontWeight: 800,
                fontSize: 13,
                color: isDark ? "#f8fafc" : "#0f172a",
                lineHeight: 1.2
              }}>
                {shelter.name}
              </div>
              <div style={{ fontSize: 11, color: isDark ? "#94a3b8" : "#64748b" }}>
                {shelter.district || "Relief Hub"} • {shelter.state || "Delhi"}
              </div>
            </div>
          </div>

          {/* Status Chip */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "4px 8px",
            borderRadius: 6,
            background: isAvailable ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
            border: `1px solid ${isAvailable ? "#10b981" : "#ef4444"}`,
            marginBottom: 8
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: isAvailable ? "#10b981" : "#ef4444" }}>
              {isAvailable ? "● INTAKE AVAILABLE" : "● SHELTER AT CAPACITY"}
            </span>
            <span style={{ fontSize: 11, fontWeight: 800, color: isDark ? "#ffffff" : "#0f172a" }}>
              {available} Beds Open
            </span>
          </div>

          {/* Occupancy Progress Bar */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: isDark ? "#94a3b8" : "#64748b", marginBottom: 3 }}>
              <span>Capacity Utilized</span>
              <span>{shelter.currentOccupancy || 0} / {shelter.capacity || 0} ({occupancyPct}%)</span>
            </div>
            <div style={{
              width: "100%",
              height: 6,
              borderRadius: 3,
              background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
              overflow: "hidden"
            }}>
              <div style={{
                width: `${Math.min(occupancyPct, 100)}%`,
                height: "100%",
                background: occupancyPct > 85 ? "#ef4444" : occupancyPct > 65 ? "#f97316" : "#10b981",
                borderRadius: 3,
                transition: "width 0.3s ease"
              }} />
            </div>
          </div>

          {/* Amenities Chips */}
          {Array.isArray(shelter.facilities) && shelter.facilities.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
              {shelter.facilities.slice(0, 4).map((fac, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: 9.5,
                    padding: "2px 5px",
                    borderRadius: 4,
                    background: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
                    color: isDark ? "#cbd5e1" : "#475569"
                  }}
                >
                  ✓ {fac}
                </span>
              ))}
            </div>
          )}

          {shelter.contactNumber && (
            <div style={{
              fontSize: 10.5,
              color: isDark ? "#38bdf8" : "#0284c7",
              fontWeight: 600,
              paddingTop: 4,
              borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)"
            }}>
              📞 Emergency Desk: {shelter.contactNumber}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default ShelterMarker;
