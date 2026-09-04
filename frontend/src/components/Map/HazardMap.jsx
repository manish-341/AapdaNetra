import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
  LayerGroup,
  ZoomControl,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

import RiskZone from "./RiskZone";
import ShelterMarker from "./ShelterMarker";
import { getHazards, getHabitations, getShelters, getCitizenReports, getEvacuationRoutes } from "../../services/api";
import { useLocationContext } from "../../context/LocationContext";
import { isItemInActiveLocation } from "../../utils/locationHelper";

import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Button
} from "@mui/material";

// ---- Leaflet default marker icon fix -------------------------------
// Vite/webpack break Leaflet's default marker image paths unless the
// icon URLs are re-pointed at the bundled assets. Without this, default
// markers silently render as broken images.
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ---- Map constants ----------------------------------------------------
const DELHI_CENTER = [28.6139, 77.209];
const DEFAULT_ZOOM = 11;
const MAP_HEIGHT = 560; // px — keep non-zero or Leaflet renders blank

// Smooth Leaflet auto-pan component
function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, zoom || 11, { animate: true });
    }
  }, [center?.[0], center?.[1], zoom, map]);
  return null;
}

// Single source of truth for the four risk categories, shared by the
// legend here and the Filters menu in HazardMapping.jsx.
export const RISK_CATEGORIES = [
  { value: "CRITICAL", label: "CRITICAL — Immediate Danger", color: "#b71c1c" },
  { value: "RED", label: "RED — High Risk", color: "#ef6c00" },
  { value: "AMBER", label: "AMBER — Moderate", color: "#f9a825" },
  { value: "GREEN", label: "GREEN — Safe", color: "#2e7d32" },
];

const categoryColor = (riskCategory) =>
  RISK_CATEGORIES.find((c) => c.value === riskCategory)?.color || "#616161";

const habitationIcon = (riskCategory) => {
  const color = categoryColor(riskCategory);
  return L.divIcon({
    className: "habitation-marker-icon",
    html: `
      <div style="
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: ${color};
        border: 2px solid #ffffff;
        box-shadow: 0 0 2px rgba(0,0,0,0.6);
      "></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -7],
  });
};

const citizenReportIcon = (severity) => {
  const color = severity === "CRITICAL" ? "#ef4444" : severity === "HIGH" ? "#f97316" : "#0284c7";
  return L.divIcon({
    className: "citizen-report-marker-icon",
    html: `
      <div style="
        width: 16px;
        height: 16px;
        border-radius: 4px;
        background: ${color};
        border: 2px solid #ffffff;
        box-shadow: 0 0 4px rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 10px;
        font-weight: bold;
        line-height: 1;
      ">!</div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
};

const DEFAULT_EVAC_CORRIDOR = [
  [28.6139, 77.2090],
  [28.6190, 77.2115],
  [28.6250, 77.2160],
  [28.6315, 77.2195]
];

// ---- Legend -------------------------------------------------------
const MapLegend = () => (
  <Paper
    elevation={3}
    sx={{
      position: "absolute",
      bottom: 16,
      right: 16,
      zIndex: 1000, // must sit above Leaflet's own panes
      p: 1.5,
      minWidth: 190,
    }}
  >
    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
      Risk Legend
    </Typography>
    <Stack spacing={0.5}>
      {[...RISK_CATEGORIES].reverse().map((item) => (
        <Stack key={item.value} direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: item.color,
              flexShrink: 0,
            }}
          />
          <Typography variant="caption">{item.label}</Typography>
        </Stack>
      ))}
    </Stack>
  </Paper>
);

/**
 * HazardMap
 * Main Leaflet map for AapdaNetra. Fetches hazard zones, vulnerable
 * habitations, and shelters from the backend and renders them as
 * togglable layers over an OpenStreetMap base layer.
 *
 * Props:
 *   visibleCategories?: string[]  — riskCategory values to show for
 *     hazard zones and habitations (e.g. ["RED", "CRITICAL"]). Omit
 *     or pass all four to show everything. Shelters have no risk
 *     category and are never filtered by this prop.
 *
 * Exposes via ref:
 *   exportAsPNG() — downloads the current map view as a PNG image.
 *   exportAsPDF() — downloads the current map view as a one-page PDF.
 */
const HazardMap = forwardRef(({ visibleCategories, activeFilter = 'ALL', onResetFilter }, ref) => {
  const [hazards, setHazards] = useState([]);
  const [habitations, setHabitations] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [citizenReports, setCitizenReports] = useState([]);
  const [evacuationRoutes, setEvacuationRoutes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [exporting, setExporting] = useState(false);
  const captureRef = useRef(null);
  const { location, detectLiveGPS, gpsLoading } = useLocationContext();
  const currentCenter = [location.lat, location.lng]; // wraps just the map + legend for export

  useEffect(() => {
    let isMounted = true;

    const fetchAll = async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        getHazards(),
        getHabitations(),
        getShelters(),
        getCitizenReports(),
        getEvacuationRoutes(),
      ]);

      if (!isMounted) return;

      const [hazardRes, habitationRes, shelterRes, reportRes, routeRes] = results;
      const nextErrors = {};

      if (routeRes && routeRes.status === "fulfilled") {
        setEvacuationRoutes(routeRes.value?.data?.data || []);
      }

      if (hazardRes.status === "fulfilled") {
        setHazards(hazardRes.value?.data?.data || []);
      } else {
        nextErrors.hazards = "Failed to load hazard zones.";
      }

      if (habitationRes.status === "fulfilled") {
        setHabitations(habitationRes.value?.data?.data || []);
      } else {
        nextErrors.habitations = "Failed to load habitations.";
      }

      if (shelterRes.status === "fulfilled") {
        setShelters(shelterRes.value?.data?.data || []);
      } else {
        nextErrors.shelters = "Failed to load shelters.";
      }

      if (reportRes.status === "fulfilled") {
        setCitizenReports(reportRes.value?.data?.data || []);
      }

      setErrors(nextErrors);
      setLoading(false);
    };

    fetchAll();

    return () => {
      isMounted = false;
    };
  }, [location?.district, location?.lat, location?.lng, location?.name]);

  // ---- Dynamic Layer & Category Filtering ---------------------------------
  const FILTER_TITLES = {
    ALL: 'All Operational Layers',
    FLOOD: 'Flood Hazard Zones & River Inundation',
    LANDSLIDE: 'Landslide & Slope Instability Zones',
    WILDFIRE: 'Wildfire & Scrubland Risk Areas',
    SHELTERS: 'Designated Relief Shelters & Intake Hubs',
    REPORTS: 'Citizen Field Reports & Geo-Incidents',
    HIGH_RISK: 'High & Critical Priority Sectors'
  };

  const isFiltering =
    Array.isArray(visibleCategories) && visibleCategories.length < RISK_CATEGORIES.length;

  // 0. Location Isolation (Restricts data strictly to the selected district/region)
  const localHazards = hazards.filter((z) => isItemInActiveLocation(z, location));
  const localHabitations = habitations.filter((h) => isItemInActiveLocation(h, location));
  const localShelters = shelters.filter((s) => isItemInActiveLocation(s, location));
  const localCitizenReports = citizenReports.filter((r) => isItemInActiveLocation(r, location));
  const localEvacuationRoutes = evacuationRoutes.filter((route) => isItemInActiveLocation(route, location));

  // 1. Filter Hazards
  const filteredHazards = localHazards.filter((z) => {
    if (isFiltering && !visibleCategories.includes(z.riskCategory)) return false;
    if (!activeFilter || activeFilter === 'ALL') return true;
    if (activeFilter === 'FLOOD') return (z.hazardType || '').toUpperCase() === 'FLOOD';
    if (activeFilter === 'LANDSLIDE') return (z.hazardType || '').toUpperCase() === 'LANDSLIDE';
    if (activeFilter === 'WILDFIRE') return (z.hazardType || '').toUpperCase() === 'WILDFIRE';
    if (activeFilter === 'HIGH_RISK') return ['RED', 'CRITICAL'].includes(z.riskCategory);
    if (activeFilter === 'SHELTERS' || activeFilter === 'REPORTS') return false;
    return true;
  });

  // 2. Filter Habitations
  const filteredHabitations = localHabitations.filter((h) => {
    if (isFiltering && !visibleCategories.includes(h.riskCategory)) return false;
    if (!activeFilter || activeFilter === 'ALL') return true;
    if (activeFilter === 'HIGH_RISK') return ['RED', 'CRITICAL'].includes(h.riskCategory);
    if (activeFilter === 'REPORTS' || activeFilter === 'SHELTERS') return false;
    return true;
  });

  // 3. Filter Shelters
  const filteredShelters = localShelters.filter((s) => {
    if (activeFilter === 'REPORTS') return false;
    if (activeFilter === 'HIGH_RISK') {
      return s.status === 'AVAILABLE' || (s.capacity - s.currentOccupancy) > 100;
    }
    return true;
  });

  // 4. Filter Citizen Reports
  const filteredCitizenReports = localCitizenReports.filter((r) => {
    if (!activeFilter || activeFilter === 'ALL' || activeFilter === 'REPORTS') return true;
    if (activeFilter === 'FLOOD') return (r.disasterType || '').toUpperCase() === 'FLOOD';
    if (activeFilter === 'LANDSLIDE') return (r.disasterType || '').toUpperCase() === 'LANDSLIDE';
    if (activeFilter === 'WILDFIRE') return (r.disasterType || '').toUpperCase() === 'WILDFIRE';
    if (activeFilter === 'HIGH_RISK') return ['HIGH', 'CRITICAL'].includes(r.severity);
    if (activeFilter === 'SHELTERS') return false;
    return true;
  });

  // 5. Filter Evacuation Routes
  const filteredEvacuationRoutes = localEvacuationRoutes.filter((route) => {
    if (!activeFilter || activeFilter === 'ALL' || activeFilter === 'SHELTERS' || activeFilter === 'FLOOD') return true;
    if (activeFilter === 'HIGH_RISK') return route.priority === 'IMMEDIATE';
    if (activeFilter === 'REPORTS' || activeFilter === 'WILDFIRE') return false;
    return true;
  });

  // ---- Export (PNG / PDF) --------------------------------------------
  // Captures the map + legend DOM node as a canvas. Tile images are
  // cross-origin (OpenStreetMap), so useCORS is required — this only
  // works if the tile server sends CORS headers, which the public OSM
  // tile servers do. If your deployment proxies tiles through a server
  // that doesn't set Access-Control-Allow-Origin, tiles may render
  // blank in the export; swap in a CORS-enabled tile source in that case.
  const captureMapCanvas = async () => {
    if (!captureRef.current) return null;
    return html2canvas(captureRef.current, {
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
    });
  };

  useImperativeHandle(ref, () => ({
    exportAsPNG: async () => {
      setExporting(true);
      try {
        const canvas = await captureMapCanvas();
        if (!canvas) return;
        const link = document.createElement("a");
        link.download = `hazard-map-${Date.now()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } finally {
        setExporting(false);
      }
    },
    exportAsPDF: async () => {
      setExporting(true);
      try {
        const canvas = await captureMapCanvas();
        if (!canvas) return;
        const imgData = canvas.toDataURL("image/png");
        const margin = 24;
        const pdf = new jsPDF({
          orientation: canvas.width >= canvas.height ? "landscape" : "portrait",
          unit: "px",
          format: [canvas.width + margin * 2, canvas.height + margin * 2 + 28],
        });
        pdf.setFontSize(12);
        pdf.text(
          `AapdaNetra — Hazard Zone Map (${new Date().toLocaleString()})`,
          margin,
          margin
        );
        pdf.addImage(imgData, "PNG", margin, margin + 12, canvas.width, canvas.height);
        pdf.save(`hazard-map-${Date.now()}.pdf`);
      } finally {
        setExporting(false);
      }
    },
  }));

  const hasAnyError = Object.keys(errors).length > 0;
  const noHazards = !loading && filteredHazards.length === 0 && !['SHELTERS', 'REPORTS'].includes(activeFilter) && isFiltering;

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%", minHeight: MAP_HEIGHT }}>
      {/* Active Filter HUD Badge */}
      {activeFilter && activeFilter !== 'ALL' && (
        <Paper
          elevation={4}
          sx={{
            position: "absolute",
            top: 14,
            right: 14,
            zIndex: 1000,
            py: 0.75,
            px: 1.5,
            borderRadius: 2,
            bgcolor: "rgba(15, 23, 42, 0.9)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(56, 189, 248, 0.4)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)"
          }}
        >
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#38bdf8" }} />
          <Box>
            <Typography variant="caption" fontWeight={800} sx={{ color: "#38bdf8", display: "block", lineHeight: 1.2 }}>
              {FILTER_TITLES[activeFilter] || activeFilter}
            </Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.7rem", lineHeight: 1 }}>
              {filteredHazards.length} Zones &bull; {filteredCitizenReports.length} Reports &bull; {filteredShelters.length} Shelters
            </Typography>
          </Box>
          {onResetFilter && (
            <Button
              size="small"
              onClick={onResetFilter}
              sx={{
                fontSize: "0.68rem",
                py: 0.2,
                px: 1,
                minWidth: "auto",
                bgcolor: "rgba(56, 189, 248, 0.2)",
                color: "#38bdf8",
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 1,
                "&:hover": { bgcolor: "rgba(56, 189, 248, 0.35)" }
              }}
            >
              Reset
            </Button>
          )}

          <Button
            size="small"
            onClick={detectLiveGPS}
            disabled={gpsLoading}
            sx={{
              fontSize: "0.68rem",
              py: 0.2,
              px: 1,
              minWidth: "auto",
              bgcolor: "rgba(16, 185, 129, 0.2)",
              color: "#10b981",
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 1,
              "&:hover": { bgcolor: "rgba(16, 185, 129, 0.35)" }
            }}
          >
            {gpsLoading ? "Locating..." : "📍 GPS"}
          </Button>
        </Paper>
      )}

      {(loading || exporting) && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255,255,255,0.6)",
          }}
        >
          <CircularProgress size={32} />
        </Box>
      )}

      {hasAnyError && (
        <Box sx={{ position: "absolute", top: 16, left: 16, zIndex: 1000, maxWidth: 320 }}>
          <Alert severity="warning" variant="filled">
            {Object.values(errors).join(" ")}
          </Alert>
        </Box>
      )}

      {noHazards && !hasAnyError && (
        <Box sx={{ position: "absolute", top: 16, left: 16, zIndex: 1000 }}>
          <Alert severity="info" variant="outlined" sx={{ backgroundColor: "background.paper" }}>
            {isFiltering ? "No hazard zones match the selected filters" : "No hazard zones available"}
          </Alert>
        </Box>
      )}

      <Box ref={captureRef} sx={{ position: "relative", width: "100%", height: "100%" }}>
        <MapContainer
          center={currentCenter}
          zoom={DEFAULT_ZOOM}
          zoomControl={false}
          style={{ width: "100%", height: "100%", borderRadius: 8 }}
        >
          <ChangeMapView center={currentCenter} zoom={DEFAULT_ZOOM} />

          {location.isGPS && (
            <Marker
              position={[location.lat, location.lng]}
              icon={L.divIcon({
                className: "user-gps-pulse",
                html: `<div style="width: 22px; height: 22px; border-radius: 50%; background: #0284c7; border: 3px solid white; box-shadow: 0 0 12px #0284c7;"></div>`,
                iconSize: [22, 22],
                iconAnchor: [11, 11]
              })}
            >
              <Popup>
                <div style={{ fontWeight: 700, color: '#0284c7' }}>📍 Your Current GPS Location</div>
                <div style={{ fontSize: '0.8rem' }}>{location.name}</div>
              </Popup>
            </Marker>
          )}
          <LayersControl position="topleft">
            {/* Real World Base Layer Switcher */}
            <LayersControl.BaseLayer checked name="Standard Street Map">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                crossOrigin="anonymous"
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="High-Res Satellite (Esri Imagery)">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and GIS Community'
                crossOrigin="anonymous"
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="Topographic Relief (OpenTopoMap)">
              <TileLayer
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                attribution='Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)'
                crossOrigin="anonymous"
              />
            </LayersControl.BaseLayer>

            <LayersControl.Overlay checked name="Hazard Zones">
              <LayerGroup>
                {filteredHazards.map((zone) => (
                  <RiskZone key={zone._id} zone={zone} />
                ))}
              </LayerGroup>
            </LayersControl.Overlay>

            <LayersControl.Overlay checked name="Vulnerable Habitations">
              <LayerGroup>
                {filteredHabitations.map((h) => {
                  if (!h.location?.coordinates) return null;
                  const [lng, lat] = h.location.coordinates;
                  return (
                    <Marker
                      key={h._id}
                      position={[lat, lng]}
                      icon={habitationIcon(h.riskCategory)}
                    >
                      <Popup>
                        <div style={{ minWidth: 200 }}>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>{h.name}</div>
                          {h.district && <div>District: {h.district}</div>}
                          <div>Population: {h.population}</div>
                          <div>Vulnerable Population: {h.vulnerablePopulation}</div>
                          <div>Vulnerability Score: {h.vulnerabilityScore}</div>
                          <div>Current Risk Score: {h.currentRiskScore}</div>
                          <div>Risk Category: {h.riskCategory}</div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </LayerGroup>
            </LayersControl.Overlay>

            <LayersControl.Overlay checked name="Shelters">
              <LayerGroup>
                {filteredShelters.map((shelter) => (
                  <ShelterMarker key={shelter._id} shelter={shelter} />
                ))}
              </LayerGroup>
            </LayersControl.Overlay>

            <LayersControl.Overlay checked name="Citizen Field Reports">
              <LayerGroup>
                {filteredCitizenReports.map((report) => {
                  if (!report.location?.coordinates) return null;
                  const [lng, lat] = report.location.coordinates;
                  return (
                    <Marker
                      key={report._id}
                      position={[lat, lng]}
                      icon={citizenReportIcon(report.severity)}
                    >
                      <Popup>
                        <div style={{ minWidth: 210 }}>
                          <div style={{ fontWeight: 800, color: '#0284c7', marginBottom: 4 }}>
                            CITIZEN REPORT • {report.disasterType}
                          </div>
                          <div style={{ fontSize: 13, marginBottom: 6, lineHeight: 1.4 }}>
                            "{report.description}"
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>
                            Severity: <strong style={{ color: report.severity === 'CRITICAL' ? '#ef4444' : '#ea580c' }}>{report.severity}</strong> • Status: <strong>{report.status}</strong>
                          </div>
                          {report.aiClassification && (
                            <div style={{ fontSize: 11, color: '#16a34a', marginTop: 4 }}>
                              🤖 AI NLP: {report.aiClassification.category} ({Math.round((report.aiClassification.confidence || 0.8) * 100)}% conf)
                            </div>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </LayerGroup>
            </LayersControl.Overlay>

            <LayersControl.Overlay checked name="Evacuation Safe Corridors (Turn-by-Turn OSRM)">
              <LayerGroup>
                {filteredEvacuationRoutes && filteredEvacuationRoutes.length > 0 ? (
                  filteredEvacuationRoutes.map((route, idx) => (
                    <Polyline
                      key={route.planId || idx}
                      positions={route.coordinates}
                      pathOptions={{
                        color: route.priority === 'IMMEDIATE' ? '#f43f5e' : '#0284c7',
                        weight: 4.5,
                        dashArray: route.status === 'COMPLETED' ? null : '6, 8',
                        opacity: 0.9
                      }}
                    >
                      <Popup>
                        <div style={{ minWidth: 210 }}>
                          <div style={{ fontWeight: 800, color: '#0284c7', marginBottom: 4 }}>
                            🚑 TURN-BY-TURN EVACUATION CORRIDOR
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                            {route.sourceName} &rarr; {route.destinationName}
                          </div>
                          <div style={{ fontSize: 12, marginTop: 4, color: '#475569' }}>
                            Road Distance: <strong>{route.distanceKm} km</strong> &bull; Transit: <strong>{route.durationMins} mins</strong>
                          </div>
                          <div style={{ fontSize: 12, marginTop: 2 }}>
                            Priority: <span style={{ fontWeight: 700, color: route.priority === 'IMMEDIATE' ? '#f43f5e' : '#ea580c' }}>{route.priority}</span> &bull; Evacuees: <strong>{route.population?.toLocaleString()}</strong>
                          </div>
                          {route.reason && (
                            <div style={{ fontSize: 11, fontStyle: 'italic', color: '#64748b', marginTop: 4 }}>
                              Trigger: {route.reason}
                            </div>
                          )}
                        </div>
                      </Popup>
                    </Polyline>
                  ))
                ) : (
                  <Polyline
                    positions={DEFAULT_EVAC_CORRIDOR}
                    pathOptions={{
                      color: '#0284c7',
                      weight: 4,
                      dashArray: '8, 8',
                      opacity: 0.85
                    }}
                  />
                )}
              </LayerGroup>
            </LayersControl.Overlay>
          </LayersControl>
        </MapContainer>

        <MapLegend />
      </Box>
    </Box>
  );
});

HazardMap.displayName = "HazardMap";

export default HazardMap;
