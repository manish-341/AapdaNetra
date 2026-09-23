import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

/**
 * Tactical Shelter Marker
 * Renders an emergency shelter with live vacancy indicator,
 * modern tactical pin design, and rich shelter operational details.
 */
const createShelterIcon = (status, availableCapacity) => {
  const isAvailable = status === "AVAILABLE" || availableCapacity > 0;
  const isFull = status === "FULL" || availableCapacity === 0;
  
  const statusColor = isAvailable ? "#10b981" : isFull ? "#f97316" : "#ef4444";
  const badgeText = isAvailable ? `${availableCapacity || "Open"}` : "FULL";

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
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid ${statusColor};
          color: ${statusColor};
          font-size: 9px;
          font-weight: 800;
          padding: 1px 5px;
          border-radius: 4px;
          white-space: nowrap;
          margin-bottom: 2px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
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
      icon={createShelterIcon(shelter.status, available)}
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
              <div style={{ fontWeight: 800, fontSize: 13, color: "#f8fafc", lineHeight: 1.2 }}>
                {shelter.name}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>
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
            <span style={{ fontSize: 11, fontWeight: 800, color: "#ffffff" }}>
              {available} Beds Open
            </span>
          </div>

          {/* Occupancy Progress Bar */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", marginBottom: 3 }}>
              <span>Capacity Utilized</span>
              <span>{shelter.currentOccupancy || 0} / {shelter.capacity || 0} ({occupancyPct}%)</span>
            </div>
            <div style={{
              width: "100%",
              height: 6,
              borderRadius: 3,
              background: "rgba(255, 255, 255, 0.1)",
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
                    background: "rgba(255, 255, 255, 0.08)",
                    color: "#cbd5e1"
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
              color: "#38bdf8",
              fontWeight: 600,
              paddingTop: 4,
              borderTop: "1px solid rgba(255,255,255,0.08)"
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
