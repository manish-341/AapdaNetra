import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Distinct icon for shelters (blue) so they read differently from
// habitation markers on the same map. Uses Leaflet's own marker art
// via divIcon so no extra image assets/packages are needed.
const shelterIcon = L.divIcon({
  className: "shelter-marker-icon",
  html: `
    <div style="
      width: 16px;
      height: 16px;
      border-radius: 50% 50% 50% 0;
      background: #1565c0;
      border: 2px solid #ffffff;
      box-shadow: 0 0 2px rgba(0,0,0,0.5);
      transform: rotate(-45deg);
    "></div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 16],
  popupAnchor: [0, -16],
});

const STATUS_LABELS = {
  AVAILABLE: "Available",
  FULL: "Full",
  CLOSED: "Closed",
};

/**
 * ShelterMarker
 * Renders a single shelter as a Leaflet marker with an info popup.
 *
 * Props:
 *   shelter: {
 *     _id, name, district, capacity, currentOccupancy,
 *     availableCapacity, status,
 *     location: { type: "Point", coordinates: [lng, lat] }
 *   }
 */
const ShelterMarker = ({ shelter }) => {
  if (!shelter || !shelter.location || !Array.isArray(shelter.location.coordinates)) {
    return null;
  }

  const [lng, lat] = shelter.location.coordinates;

  return (
    <Marker position={[lat, lng]} icon={shelterIcon}>
      <Popup>
        <div style={{ minWidth: 200, fontFamily: "inherit" }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{shelter.name}</div>
          {shelter.district && <div>District: {shelter.district}</div>}
          <div>Capacity: {shelter.capacity}</div>
          <div>Current Occupancy: {shelter.currentOccupancy}</div>
          <div>Available Capacity: {shelter.availableCapacity}</div>
          <div>Status: {STATUS_LABELS[shelter.status] || shelter.status}</div>
        </div>
      </Popup>
    </Marker>
  );
};

export default ShelterMarker;
