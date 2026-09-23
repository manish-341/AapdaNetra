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
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

import RiskZone from "./RiskZone";
import ShelterMarker from "./ShelterMarker";
import {
  getHazards,
  getHabitations,
  getShelters,
  getCitizenReports,
  getEvacuationRoutes,
} from "../../services/api";
import { useLocationContext } from "../../context/LocationContext";
import { useThemeMode } from "../../context/ThemeContext";
import { isItemInActiveLocation } from "../../utils/locationHelper";

import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import LayersIcon from "@mui/icons-material/Layers";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";

// ---- Map default icons fix ------------------------------------------
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ---- Tactical Basemap Configurations ---------------------------------
const BASEMAP_TILES = {
  dark: {
    id: "dark",
    name: "Dark Cockpit",
    icon: "🌙",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: "abcd",
  },
  voyager: {
    id: "voyager",
    name: "Tactical Street",
    icon: "🗺️",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: "abcd",
  },
  satellite: {
    id: "satellite",
    name: "Satellite Hybrid",
    icon: "🛰️",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    labelsUrl:
      "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
  },
  topo: {
    id: "topo",
    name: "Terrain Topo",
    icon: "🏔️",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM',
  },
};

const DEFAULT_CENTER = [28.6139, 77.209];
const DEFAULT_ZOOM = 11;

// Smooth Leaflet auto-pan component
function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (
      center &&
      Array.isArray(center) &&
      center.length === 2 &&
      !isNaN(center[0]) &&
      !isNaN(center[1])
    ) {
      map.setView(center, zoom || DEFAULT_ZOOM, { animate: true });
    }
  }, [center?.[0], center?.[1], zoom, map]);
  return null;
}

// Single source of truth for risk categories
export const RISK_CATEGORIES = [
  { value: "CRITICAL", label: "CRITICAL", desc: "Immediate Danger", color: "#ef4444" },
  { value: "RED", label: "RED", desc: "High Risk Inundation", color: "#f97316" },
  { value: "AMBER", label: "AMBER", desc: "Moderate Advisory", color: "#eab308" },
  { value: "GREEN", label: "GREEN", desc: "Safe Operational Baseline", color: "#10b981" },
];

const categoryColor = (riskCategory) =>
  RISK_CATEGORIES.find((c) => c.value === riskCategory)?.color || "#64748b";

// Pulsing radar marker for vulnerable habitations
const habitationIcon = (riskCategory, name, population) => {
  const color = categoryColor(riskCategory);
  const isHighRisk = riskCategory === "CRITICAL" || riskCategory === "RED";

  return L.divIcon({
    className: "habitation-radar-marker",
    html: `
      <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
        ${
          isHighRisk
            ? `<div style="
                position: absolute;
                width: 22px;
                height: 22px;
                border-radius: 50%;
                background: ${color};
                animation: ${riskCategory === "CRITICAL" ? "radar-pulse-danger" : "radar-pulse-warning"} 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
              "></div>`
            : ""
        }
        <div style="
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${color};
          border: 2px solid #ffffff;
          box-shadow: 0 0 8px ${color};
          z-index: 2;
        "></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
};

// Citizen Incident Report Marker
const citizenReportIcon = (severity, type) => {
  const color = severity === "CRITICAL" ? "#ef4444" : severity === "HIGH" ? "#f97316" : "#0284c7";
  const iconEmoji =
    type === "FLOOD" ? "🌊" : type === "LANDSLIDE" ? "🏔️" : type === "WILDFIRE" ? "🔥" : "⚠️";

  return L.divIcon({
    className: "citizen-incident-marker",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="
          width: 26px;
          height: 26px;
          border-radius: 8px;
          background: ${color};
          border: 2px solid #ffffff;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
        ">${iconEmoji}</div>
        <div style="
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid ${color};
        "></div>
      </div>
    `,
    iconSize: [26, 31],
    iconAnchor: [13, 31],
    popupAnchor: [0, -31],
  });
};

const DEFAULT_EVAC_CORRIDOR = [
  [28.6139, 77.209],
  [28.619, 77.2115],
  [28.625, 77.216],
  [28.6315, 77.2195],
];

/**
 * Modern Tactical HazardMap Component
 */
const HazardMap = forwardRef(
  ({ visibleCategories, activeFilter = "ALL", onResetFilter }, ref) => {
    const { isDark } = useThemeMode();
    const { location, detectLiveGPS, gpsLoading } = useLocationContext();

    const [hazards, setHazards] = useState([]);
    const [habitations, setHabitations] = useState([]);
    const [shelters, setShelters] = useState([]);
    const [citizenReports, setCitizenReports] = useState([]);
    const [evacuationRoutes, setEvacuationRoutes] = useState([]);

    // Basemap & Layer controls
    const [selectedBasemap, setSelectedBasemap] = useState(() => (isDark ? "dark" : "voyager"));
    const [layersOpen, setLayersOpen] = useState(false);
    const [activeLayers, setActiveLayers] = useState({
      hazards: true,
      habitations: true,
      shelters: true,
      reports: true,
      corridors: true,
    });

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [exporting, setExporting] = useState(false);

    const captureRef = useRef(null);
    const containerRef = useRef(null);

    // Sync default basemap with theme change if user hasn't explicitly changed
    useEffect(() => {
      setSelectedBasemap(isDark ? "dark" : "voyager");
    }, [isDark]);

    const currentCenter = [location.lat || DEFAULT_CENTER[0], location.lng || DEFAULT_CENTER[1]];

    // Real-time data sync
    useEffect(() => {
      let isMounted = true;

      const fetchAll = async (isInitial = false) => {
        if (isInitial) setLoading(true);
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
        } else if (isInitial) {
          nextErrors.hazards = "Failed to load hazard zones.";
        }

        if (habitationRes.status === "fulfilled") {
          setHabitations(habitationRes.value?.data?.data || []);
        } else if (isInitial) {
          nextErrors.habitations = "Failed to load habitations.";
        }

        if (shelterRes.status === "fulfilled") {
          setShelters(shelterRes.value?.data?.data || []);
        } else if (isInitial) {
          nextErrors.shelters = "Failed to load shelters.";
        }

        if (reportRes.status === "fulfilled") {
          setCitizenReports(reportRes.value?.data?.data || []);
        }

        if (isInitial) {
          setErrors(nextErrors);
          setLoading(false);
        }
      };

      fetchAll(true);

      const interval = setInterval(() => {
        fetchAll(false);
      }, 15000);

      const handleRefresh = () => fetchAll(false);
      window.addEventListener("refresh-hazard-map", handleRefresh);

      return () => {
        isMounted = false;
        clearInterval(interval);
        window.removeEventListener("refresh-hazard-map", handleRefresh);
      };
    }, [location?.district, location?.lat, location?.lng, location?.name]);

    // Location Isolation
    const localHazards = hazards.filter((z) => isItemInActiveLocation(z, location));
    const localHabitations = habitations.filter((h) => isItemInActiveLocation(h, location));
    const localShelters = shelters.filter((s) => isItemInActiveLocation(s, location));
    const localCitizenReports = citizenReports.filter((r) => isItemInActiveLocation(r, location));
    const localEvacuationRoutes = evacuationRoutes.filter((route) => isItemInActiveLocation(route, location));

    const isFiltering =
      Array.isArray(visibleCategories) && visibleCategories.length < RISK_CATEGORIES.length;

    // Filter Hazards
    const filteredHazards = localHazards.filter((z) => {
      if (isFiltering && !visibleCategories.includes(z.riskCategory)) return false;
      if (!activeFilter || activeFilter === "ALL") return true;
      if (activeFilter === "FLOOD") return (z.hazardType || "").toUpperCase() === "FLOOD";
      if (activeFilter === "LANDSLIDE") return (z.hazardType || "").toUpperCase() === "LANDSLIDE";
      if (activeFilter === "WILDFIRE") return (z.hazardType || "").toUpperCase() === "WILDFIRE";
      if (activeFilter === "HIGH_RISK") return ["RED", "CRITICAL"].includes(z.riskCategory);
      if (activeFilter === "SHELTERS" || activeFilter === "REPORTS") return false;
      return true;
    });

    // Filter Habitations
    const filteredHabitations = localHabitations.filter((h) => {
      if (isFiltering && !visibleCategories.includes(h.riskCategory)) return false;
      if (!activeFilter || activeFilter === "ALL") return true;
      if (activeFilter === "HIGH_RISK") return ["RED", "CRITICAL"].includes(h.riskCategory);
      if (activeFilter === "REPORTS" || activeFilter === "SHELTERS") return false;
      return true;
    });

    // Filter Shelters
    const filteredShelters = localShelters.filter((s) => {
      if (activeFilter === "REPORTS") return false;
      if (activeFilter === "HIGH_RISK") {
        return s.status === "AVAILABLE" || (s.capacity - s.currentOccupancy) > 100;
      }
      return true;
    });

    // Filter Citizen Reports
    const filteredCitizenReports = localCitizenReports.filter((r) => {
      if (r.status === "RESOLVED" || r.status === "REJECTED") return false;
      if (!activeFilter || activeFilter === "ALL" || activeFilter === "REPORTS") return true;
      if (activeFilter === "FLOOD") return (r.disasterType || "").toUpperCase() === "FLOOD";
      if (activeFilter === "LANDSLIDE") return (r.disasterType || "").toUpperCase() === "LANDSLIDE";
      if (activeFilter === "WILDFIRE") return (r.disasterType || "").toUpperCase() === "WILDFIRE";
      if (activeFilter === "HIGH_RISK") return ["HIGH", "CRITICAL"].includes(r.severity);
      if (activeFilter === "SHELTERS") return false;
      return true;
    });

    // Filter Evacuation Routes
    const filteredEvacuationRoutes = localEvacuationRoutes.filter((route) => {
      if (!activeFilter || activeFilter === "ALL" || activeFilter === "SHELTERS" || activeFilter === "FLOOD") return true;
      if (activeFilter === "HIGH_RISK") return route.priority === "IMMEDIATE";
      if (activeFilter === "REPORTS" || activeFilter === "WILDFIRE") return false;
      return true;
    });

    // Export functions
    const captureMapCanvas = async () => {
      if (!captureRef.current) return null;
      return html2canvas(captureRef.current, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: isDark ? "#090d16" : "#ffffff",
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
          link.download = `aapdanetra-gis-map-${Date.now()}.png`;
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
          const margin = 20;
          const pdf = new jsPDF({
            orientation: canvas.width >= canvas.height ? "landscape" : "portrait",
            unit: "px",
            format: [canvas.width + margin * 2, canvas.height + margin * 2 + 30],
          });
          pdf.setFontSize(12);
          pdf.text(
            `AapdaNetra — Geospatial Intelligence Map (${new Date().toLocaleString()})`,
            margin,
            margin
          );
          pdf.addImage(imgData, "PNG", margin, margin + 12, canvas.width, canvas.height);
          pdf.save(`aapdanetra-gis-map-${Date.now()}.pdf`);
        } finally {
          setExporting(false);
        }
      },
    }));

    const toggleLayer = (layerKey) => {
      setActiveLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
    };

    const toggleFullscreen = () => {
      if (!containerRef.current) return;
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen?.().catch(() => {});
        setIsFullscreen(true);
      } else {
        document.exitFullscreen?.().catch(() => {});
        setIsFullscreen(false);
      }
    };

    useEffect(() => {
      const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
      document.addEventListener("fullscreenchange", handleFsChange);
      return () => document.removeEventListener("fullscreenchange", handleFsChange);
    }, []);

    const activeTile = BASEMAP_TILES[selectedBasemap] || BASEMAP_TILES.dark;
    const hasAnyError = Object.keys(errors).length > 0;

    return (
      <Box
        ref={containerRef}
        sx={{
          position: "relative",
          width: "100%",
          height: isFullscreen ? "100vh" : "100%",
          minHeight: isFullscreen ? "100vh" : 620,
          bgcolor: isDark ? "#090d16" : "#f1f5f9",
          borderRadius: isFullscreen ? 0 : 3,
          overflow: "hidden",
        }}
      >
        {/* Loading Overlay */}
        {(loading || exporting) && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 1200,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
              backgroundColor: isDark ? "rgba(9, 13, 22, 0.75)" : "rgba(255, 255, 255, 0.75)",
              backdropFilter: "blur(6px)",
            }}
          >
            <CircularProgress size={36} sx={{ color: "#38bdf8" }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? "#38bdf8" : "#0284c7" }}>
              {exporting ? "Generating High-Resolution Map Export..." : "Synchronizing Geospatial Intelligence..."}
            </Typography>
          </Box>
        )}

        {/* Error Notification */}
        {hasAnyError && (
          <Box sx={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 1100, maxWidth: 360 }}>
            <Alert severity="warning" variant="filled" sx={{ borderRadius: 2 }}>
              {Object.values(errors).join(" ")}
            </Alert>
          </Box>
        )}

        {/* TOP-LEFT: Sleek Tactical Layers & Basemap Drawer */}
        <Box sx={{ position: "absolute", top: 14, left: 14, zIndex: 1000 }}>
          {!layersOpen ? (
            <Paper
              elevation={4}
              onClick={() => setLayersOpen(true)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                py: 0.75,
                px: 1.5,
                cursor: "pointer",
                borderRadius: 2.5,
                bgcolor: isDark ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.94)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(56, 189, 248, 0.35)",
                color: isDark ? "#f8fafc" : "#0f172a",
                boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                transition: "all 0.2s ease",
                "&:hover": {
                  transform: "scale(1.03)",
                  border: "1px solid rgba(56, 189, 248, 0.7)",
                },
              }}
            >
              <LayersIcon sx={{ color: "#38bdf8", fontSize: 18 }} />
              <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "0.75rem", letterSpacing: 0.3 }}>
                GIS LAYERS & BASEMAP
              </Typography>
              <Box
                sx={{
                  bgcolor: "#38bdf8",
                  color: "#090d16",
                  fontSize: "0.65rem",
                  fontWeight: 900,
                  px: 0.75,
                  py: 0.1,
                  borderRadius: 1,
                }}
              >
                {Object.values(activeLayers).filter(Boolean).length} Active
              </Box>
            </Paper>
          ) : (
            <Paper
              elevation={6}
              sx={{
                width: 280,
                p: 2,
                borderRadius: 3,
                bgcolor: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.97)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(56, 189, 248, 0.4)",
                color: isDark ? "#f8fafc" : "#0f172a",
                boxShadow: "0 16px 36px rgba(0,0,0,0.45)",
              }}
            >
              {/* Header */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Box display="flex" alignItems="center" gap={0.75}>
                  <LayersIcon sx={{ color: "#38bdf8", fontSize: 18 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: "0.8rem", letterSpacing: 0.5 }}>
                    GEOSPATIAL INTEL CONTROLS
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => setLayersOpen(false)} sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* Basemap Switcher */}
              <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? "#94a3b8" : "#64748b", textTransform: "uppercase", fontSize: "0.65rem" }}>
                Tactical Basemap
              </Typography>
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={0.75} mt={0.5} mb={2}>
                {Object.values(BASEMAP_TILES).map((tile) => {
                  const isSelected = selectedBasemap === tile.id;
                  return (
                    <Box
                      key={tile.id}
                      onClick={() => setSelectedBasemap(tile.id)}
                      sx={{
                        p: 0.75,
                        borderRadius: 1.5,
                        cursor: "pointer",
                        border: isSelected ? "1.5px solid #38bdf8" : isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.1)",
                        bgcolor: isSelected ? "rgba(56, 189, 248, 0.15)" : isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                        transition: "all 0.15s ease",
                        "&:hover": {
                          bgcolor: "rgba(56, 189, 248, 0.1)",
                        },
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{tile.icon}</span>
                      <Typography variant="caption" sx={{ fontWeight: isSelected ? 800 : 600, fontSize: "0.7rem", color: isSelected ? "#38bdf8" : "inherit" }}>
                        {tile.name}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              {/* Operational Layers Toggle */}
              <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? "#94a3b8" : "#64748b", textTransform: "uppercase", fontSize: "0.65rem" }}>
                Operational Overlays
              </Typography>
              <Stack spacing={0.75} mt={0.75}>
                {[
                  { key: "hazards", icon: "🌊", label: "Hazard Risk Zones", count: filteredHazards.length, color: "#ef4444" },
                  { key: "habitations", icon: "🏘️", label: "Vulnerable Communities", count: filteredHabitations.length, color: "#eab308" },
                  { key: "shelters", icon: "⛺", label: "Relief Shelters", count: filteredShelters.length, color: "#10b981" },
                  { key: "reports", icon: "🚨", label: "Citizen Field Reports", count: filteredCitizenReports.length, color: "#38bdf8" },
                  { key: "corridors", icon: "🚑", label: "Safe Evacuation Routes", count: filteredEvacuationRoutes.length || 1, color: "#f43f5e" },
                ].map((layer) => {
                  const isActive = activeLayers[layer.key];
                  return (
                    <Box
                      key={layer.key}
                      onClick={() => toggleLayer(layer.key)}
                      sx={{
                        p: 0.75,
                        px: 1,
                        borderRadius: 1.5,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        bgcolor: isActive ? isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" : "transparent",
                        border: isActive ? `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}` : "1px solid transparent",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          bgcolor: "rgba(56, 189, 248, 0.08)",
                        },
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={0.75}>
                        <span style={{ fontSize: 13 }}>{layer.icon}</span>
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.72rem" }}>
                          {layer.label}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.75}>
                        <Typography variant="caption" sx={{ fontSize: "0.68rem", fontWeight: 700, color: layer.color }}>
                          {layer.count}
                        </Typography>
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            bgcolor: isActive ? layer.color : "rgba(148, 163, 184, 0.3)",
                            boxShadow: isActive ? `0 0 6px ${layer.color}` : "none",
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            </Paper>
          )}
        </Box>

        {/* TOP-RIGHT: Tactical HUD Actions (Telemetry, GPS, Fullscreen) */}
        <Box
          sx={{
            position: "absolute",
            top: 14,
            right: 14,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          {/* Live AI Sentinel Badge */}
          <Paper
            elevation={4}
            sx={{
              py: 0.5,
              px: 1.25,
              borderRadius: 2,
              bgcolor: isDark ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.94)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
            }}
          >
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                bgcolor: "#10b981",
                boxShadow: "0 0 8px #10b981",
                animation: "pulse-red 2s infinite",
              }}
            />
            <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "0.68rem", color: "#10b981" }}>
              AI SENTINEL ACTIVE • 80 H3 CELLS
            </Typography>
          </Paper>

          {/* GPS Live Locate Button */}
          <Tooltip title="Recenter to Live GPS Location">
            <Button
              size="small"
              onClick={detectLiveGPS}
              disabled={gpsLoading}
              sx={{
                minWidth: "auto",
                px: 1.25,
                py: 0.5,
                borderRadius: 2,
                bgcolor: isDark ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.94)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(56, 189, 248, 0.35)",
                color: "#38bdf8",
                fontWeight: 700,
                fontSize: "0.7rem",
                textTransform: "none",
                display: "flex",
                gap: 0.5,
                "&:hover": {
                  bgcolor: "rgba(56, 189, 248, 0.2)",
                },
              }}
            >
              {gpsLoading ? (
                <CircularProgress size={12} sx={{ color: "#38bdf8" }} />
              ) : (
                <MyLocationIcon sx={{ fontSize: 14 }} />
              )}
              {gpsLoading ? "Locating..." : "📍 GPS"}
            </Button>
          </Tooltip>

          {/* Fullscreen Toggle */}
          <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Expand Fullscreen Map"}>
            <IconButton
              size="small"
              onClick={toggleFullscreen}
              sx={{
                bgcolor: isDark ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.94)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: isDark ? "#f8fafc" : "#0f172a",
                "&:hover": {
                  bgcolor: "rgba(56, 189, 248, 0.2)",
                },
              }}
            >
              {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* BOTTOM-RIGHT: Tactical Threat Matrix Legend */}
        <Paper
          elevation={4}
          sx={{
            position: "absolute",
            bottom: 16,
            right: 16,
            zIndex: 1000,
            p: 1.25,
            px: 1.5,
            borderRadius: 2.5,
            bgcolor: isDark ? "rgba(15, 23, 42, 0.92)" : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            color: isDark ? "#f8fafc" : "#0f172a",
            minWidth: 180,
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}>
            <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "0.68rem", letterSpacing: 0.5, color: isDark ? "#94a3b8" : "#64748b" }}>
              THREAT MATRIX
            </Typography>
            <Typography variant="caption" sx={{ fontSize: "0.65rem", color: "#38bdf8" }}>
              Live
            </Typography>
          </Box>
          <Stack spacing={0.4}>
            {RISK_CATEGORIES.map((item) => (
              <Box key={item.value} display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={0.75}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: item.color,
                      boxShadow: `0 0 6px ${item.color}`,
                    }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.68rem" }}>
                    {item.label}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ fontSize: "0.62rem", color: isDark ? "#94a3b8" : "#64748b" }}>
                  {item.desc}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Paper>

        {/* BOTTOM-LEFT: Coordinate & Area Telemetry */}
        <Box
          sx={{
            position: "absolute",
            bottom: 16,
            left: 16,
            zIndex: 1000,
            py: 0.4,
            px: 1,
            borderRadius: 1.5,
            bgcolor: isDark ? "rgba(15, 23, 42, 0.85)" : "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: isDark ? "#94a3b8" : "#64748b",
            fontSize: "0.65rem",
            fontFamily: "var(--mono)",
          }}
        >
          {location.name || location.district || "Delhi Sector"} &bull; {currentCenter[0]?.toFixed(4)}° N, {currentCenter[1]?.toFixed(4)}° E
        </Box>

        {/* Leaflet Map Canvas */}
        <Box ref={captureRef} sx={{ width: "100%", height: "100%" }}>
          <MapContainer
            center={currentCenter}
            zoom={DEFAULT_ZOOM}
            zoomControl={false}
            style={{ width: "100%", height: "100%" }}
          >
            <ChangeMapView center={currentCenter} zoom={DEFAULT_ZOOM} />

            {/* Active Base Tile Layer */}
            <TileLayer
              key={activeTile.id}
              url={activeTile.url}
              attribution={activeTile.attribution}
              subdomains={activeTile.subdomains || "abc"}
              crossOrigin="anonymous"
            />

            {/* If Satellite hybrid, also render the Reference Labels on top */}
            {activeTile.id === "satellite" && activeTile.labelsUrl && (
              <TileLayer
                url={activeTile.labelsUrl}
                crossOrigin="anonymous"
              />
            )}

            {/* GPS Live Marker */}
            {location.isGPS && (
              <Marker
                position={[location.lat, location.lng]}
                icon={L.divIcon({
                  className: "user-gps-pulse",
                  html: `
                    <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
                      <div style="
                        position: absolute;
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        background: #0284c7;
                        animation: radar-pulse-danger 2s infinite;
                      "></div>
                      <div style="
                        width: 14px;
                        height: 14px;
                        border-radius: 50%;
                        background: #38bdf8;
                        border: 2px solid #ffffff;
                        box-shadow: 0 0 10px #0284c7;
                        z-index: 2;
                      "></div>
                    </div>
                  `,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                })}
              >
                <Popup>
                  <div style={{ padding: "6px 8px" }}>
                    <div style={{ fontWeight: 800, color: "#38bdf8", fontSize: 13 }}>
                      📍 Verified Live GPS Location
                    </div>
                    <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 2 }}>
                      {location.name || "Your Position"}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* 1. Hazard Zones Layer */}
            {activeLayers.hazards &&
              filteredHazards.map((zone) => (
                <RiskZone key={zone._id || zone.name} zone={zone} />
              ))}

            {/* 2. Vulnerable Habitations Layer */}
            {activeLayers.habitations &&
              filteredHabitations.map((h) => {
                if (!h.location?.coordinates) return null;
                const [lng, lat] = h.location.coordinates;
                const riskColor = categoryColor(h.riskCategory);

                return (
                  <Marker
                    key={h._id}
                    position={[lat, lng]}
                    icon={habitationIcon(h.riskCategory, h.name, h.population)}
                  >
                    <Popup>
                      <div style={{ minWidth: 220, padding: "8px 10px", fontFamily: "inherit" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <span style={{ fontSize: 16 }}>🏘️</span>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 13, color: "#f8fafc" }}>
                              {h.name}
                            </div>
                            <div style={{ fontSize: 10.5, color: "#94a3b8" }}>
                              {h.district || "Sector Community"}
                            </div>
                          </div>
                        </div>

                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "3px 6px",
                          borderRadius: 4,
                          background: "rgba(255,255,255,0.06)",
                          border: `1px solid ${riskColor}`,
                          marginBottom: 8,
                          fontSize: 11
                        }}>
                          <span style={{ fontWeight: 700, color: riskColor }}>
                            {h.riskCategory} RISK
                          </span>
                          <span style={{ fontWeight: 800, color: "#f8fafc" }}>
                            Score: {h.currentRiskScore || h.vulnerabilityScore || 0}/100
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 10.5, color: "#cbd5e1" }}>
                          <div>Total Pop: <strong>{h.population?.toLocaleString() || "N/A"}</strong></div>
                          <div>Vulnerable: <strong style={{ color: "#ef4444" }}>{h.vulnerablePopulation?.toLocaleString() || "N/A"}</strong></div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            {/* 3. Emergency Shelters Layer */}
            {activeLayers.shelters &&
              filteredShelters.map((shelter) => (
                <ShelterMarker key={shelter._id} shelter={shelter} />
              ))}

            {/* 4. Citizen Incident Reports Layer */}
            {activeLayers.reports &&
              filteredCitizenReports.map((report) => {
                if (!report.location?.coordinates) return null;
                const [lng, lat] = report.location.coordinates;
                const isCrit = report.severity === "CRITICAL";

                return (
                  <Marker
                    key={report._id}
                    position={[lat, lng]}
                    icon={citizenReportIcon(report.severity, report.disasterType)}
                  >
                    <Popup>
                      <div style={{ minWidth: 230, padding: "8px 10px", fontFamily: "inherit" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: isCrit ? "#ef4444" : "#f97316" }}>
                            🚨 CITIZEN INCIDENT REPORT
                          </span>
                          <span style={{
                            fontSize: 9.5,
                            fontWeight: 700,
                            padding: "1px 5px",
                            borderRadius: 3,
                            background: "rgba(56, 189, 248, 0.2)",
                            color: "#38bdf8"
                          }}>
                            {report.status}
                          </span>
                        </div>

                        <div style={{ fontSize: 12.5, fontWeight: 500, color: "#f8fafc", fontStyle: "italic", marginBottom: 8, lineHeight: 1.35 }}>
                          "{report.description}"
                        </div>

                        <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", justifyContent: "space-between" }}>
                          <span>Type: <strong>{report.disasterType}</strong></span>
                          <span>Severity: <strong style={{ color: isCrit ? "#ef4444" : "#f97316" }}>{report.severity}</strong></span>
                        </div>

                        {report.aiClassification && (
                          <div style={{
                            fontSize: 10,
                            marginTop: 6,
                            padding: "3px 6px",
                            borderRadius: 4,
                            background: "rgba(16, 185, 129, 0.15)",
                            color: "#10b981",
                            border: "1px solid rgba(16, 185, 129, 0.3)"
                          }}>
                            🤖 AI Verified: {report.aiClassification.category} ({Math.round((report.aiClassification.confidence || 0.85) * 100)}% conf)
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            {/* 5. Safe Evacuation Corridors Layer */}
            {activeLayers.corridors && (
              filteredEvacuationRoutes && filteredEvacuationRoutes.length > 0 ? (
                filteredEvacuationRoutes.map((route, idx) => (
                  <Polyline
                    key={route.planId || idx}
                    positions={route.coordinates}
                    pathOptions={{
                      color: route.priority === "IMMEDIATE" ? "#f43f5e" : "#0284c7",
                      weight: 5,
                      dashArray: "10, 14",
                      className: "evac-corridor-animated",
                      opacity: 0.95,
                    }}
                  >
                    <Popup>
                      <div style={{ minWidth: 230, padding: "8px 10px" }}>
                        <div style={{ fontWeight: 800, color: "#38bdf8", fontSize: 12, marginBottom: 4 }}>
                          🚑 SAFE EVACUATION CORRIDOR
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>
                          {route.sourceName} &rarr; {route.destinationName}
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                          Transit: <strong>{route.durationMins || "15"} mins</strong> &bull; Distance: <strong>{route.distanceKm || "4.5"} km</strong>
                        </div>
                        <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 2 }}>
                          Priority: <strong style={{ color: route.priority === "IMMEDIATE" ? "#f43f5e" : "#38bdf8" }}>{route.priority || "ACTIVE"}</strong> &bull; Evacuees: <strong>{route.population?.toLocaleString() || "1,200"}</strong>
                        </div>
                      </div>
                    </Popup>
                  </Polyline>
                ))
              ) : (
                <Polyline
                  positions={DEFAULT_EVAC_CORRIDOR}
                  pathOptions={{
                    color: "#0284c7",
                    weight: 4.5,
                    dashArray: "8, 12",
                    className: "evac-corridor-animated",
                    opacity: 0.9,
                  }}
                />
              )
            )}
          </MapContainer>
        </Box>
      </Box>
    );
  }
);

HazardMap.displayName = "HazardMap";

export default HazardMap;
