import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Stack,
  Button,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import LayersIcon from '@mui/icons-material/Layers';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import CampaignIcon from '@mui/icons-material/Campaign';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';

import Boilerplate from '../layouts/Boilerplate';
import HazardMap from '../components/Map/HazardMap';
import ShelterCard from '../components/ShelterCard';
import {
  getAlerts,
  getCitizenReports,
  getShelterRecommendation,
  getShelters,
  getRelocations,
} from '../services/api';
import { useThemeMode } from '../context/ThemeContext';
import { useLocationContext } from '../context/LocationContext';
import { isItemInActiveLocation } from '../utils/locationHelper';

const FILTER_OPTIONS = [
  { id: 'ALL', label: 'All Layers', icon: '🛰️' },
  { id: 'FLOOD', label: 'Flood Risk', icon: '🌊' },
  { id: 'LANDSLIDE', label: 'Landslide Risk', icon: '🏔️' },
  { id: 'WILDFIRE', label: 'Wildfire Risk', icon: '🔥' },
  { id: 'SHELTERS', label: 'Shelters', icon: '⛺' },
  { id: 'REPORTS', label: 'Citizen Reports', icon: '🚨' },
  { id: 'HIGH_RISK', label: 'High Threat Only', icon: '🔴' },
];

export default function DisasterMap() {
  const { isDark } = useThemeMode();
  const textMain = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#475569';
  const subCardBg = isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc';
  const subCardBorder = isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0';

  const mapRef = useRef(null);
  const { location } = useLocationContext();
  const [activeFilter, setActiveFilter] = useState('ALL');

  const [alerts, setAlerts] = useState([]);
  const [reports, setReports] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [relocations, setRelocations] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegionalAlerts, setShowRegionalAlerts] = useState(false);

  const fetchData = React.useCallback(() => {
    const targetDistrict =
      location.district || (location.name ? location.name.split('(')[0].trim() : '');

    Promise.all([
      getAlerts(),
      getCitizenReports(),
      getShelterRecommendation(location.lat, location.lng, targetDistrict),
      getShelters(),
      getRelocations().catch(() => ({ data: { data: [] } })),
    ])
      .then(([alertRes, reportRes, shelterRes, sheltersListRes, relocRes]) => {
        setAlerts(alertRes.data?.data || []);
        setReports(reportRes.data?.data || []);
        setRecommendation(shelterRes.data?.data?.recommended || null);
        setShelters(sheltersListRes.data?.data || []);
        setRelocations(relocRes.data?.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [location.lat, location.lng, location.district, location.name]);

  useEffect(() => {
    setLoading(true);
    fetchData();

    // Timely refresh: every 15s to keep live alerts updated
    const interval = setInterval(fetchData, 15000);

    const handleAlertsUpdated = (e) => {
      if (Array.isArray(e.detail) && e.detail.length > 0) {
        setAlerts(e.detail);
      } else {
        fetchData();
      }
    };
    window.addEventListener('alerts-updated', handleAlertsUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('alerts-updated', handleAlertsUpdated);
    };
  }, [fetchData]);

  const locationFilteredAlerts = showRegionalAlerts
    ? alerts
    : alerts.filter((a) => isItemInActiveLocation(a, location));

  const displayedAlerts = locationFilteredAlerts.filter((a) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'FLOOD') return (a.hazardType || '').toUpperCase() === 'FLOOD';
    if (activeFilter === 'LANDSLIDE') return (a.hazardType || '').toUpperCase() === 'LANDSLIDE';
    if (activeFilter === 'WILDFIRE') return (a.hazardType || '').toUpperCase() === 'WILDFIRE';
    if (activeFilter === 'HIGH_RISK') return ['HIGH', 'CRITICAL'].includes(a.severity);
    if (activeFilter === 'REPORTS' || activeFilter === 'SHELTERS') return true;
    return true;
  });

  const displayedShelters = shelters.filter((s) => isItemInActiveLocation(s, location));
  const displayedReports = reports.filter((r) => isItemInActiveLocation(r, location));
  const displayedRelocations = relocations.filter((reloc) =>
    isItemInActiveLocation(reloc, location) || isItemInActiveLocation(reloc.habitation, location)
  );

  return (
    <Boilerplate>
      {/* Header with Title and Actions */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2} mb={2.5}>
        <Box>
          <Typography variant="caption" sx={{ color: textSecondary }}>
            Home &gt; GIS Tactical Operations &gt; Live Disaster Map
          </Typography>
          <Typography variant="h5" fontWeight="bold" sx={{ color: textMain, mt: 0.5 }}>
            Geospatial Threat Cockpit & GIS Map
          </Typography>
          <Typography variant="body2" sx={{ color: textSecondary }}>
            Real-time multi-layer intelligence combining AI flood/landslide risk zones, live citizen alerts, designated shelter capacities, and safe corridors.
          </Typography>
        </Box>

        {/* Export Buttons */}
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => mapRef.current?.exportAsPNG?.()}
            startIcon={<DownloadIcon fontSize="small" />}
            sx={{
              borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.3)',
              color: isDark ? '#38bdf8' : '#0284c7',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.75rem',
              borderRadius: 2,
              '&:hover': {
                bgcolor: isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(2, 132, 199, 0.08)',
              },
            }}
          >
            Export PNG
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => mapRef.current?.exportAsPDF?.()}
            startIcon={<PictureAsPdfIcon fontSize="small" />}
            sx={{
              borderColor: isDark ? 'rgba(244, 63, 94, 0.3)' : 'rgba(225, 29, 72, 0.3)',
              color: isDark ? '#f43f5e' : '#e11d48',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.75rem',
              borderRadius: 2,
              '&:hover': {
                bgcolor: isDark ? 'rgba(244, 63, 94, 0.1)' : 'rgba(225, 29, 72, 0.08)',
              },
            }}
          >
            Export PDF
          </Button>
        </Stack>
      </Box>

      {/* Filter Bar */}
      <Paper className="glass-card" sx={{ p: 1.5, mb: 3, borderRadius: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Box display="flex" alignItems="center" gap={0.75} mr={1}>
            <FilterAltIcon sx={{ color: isDark ? '#38bdf8' : '#0284c7', fontSize: 20 }} />
            <Typography variant="caption" fontWeight="bold" sx={{ color: textMain, letterSpacing: 0.3 }}>
              LAYER FILTERS:
            </Typography>
          </Box>
          {FILTER_OPTIONS.map((f) => {
            const isSelected = activeFilter === f.id;
            return (
              <Chip
                key={f.id}
                label={`${f.icon} ${f.label}`}
                onClick={() => setActiveFilter(f.id)}
                color={isSelected ? 'primary' : 'default'}
                variant={isSelected ? 'filled' : 'outlined'}
                sx={{
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  borderRadius: 2,
                  borderColor: isSelected
                    ? '#38bdf8'
                    : isDark
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.12)',
                  bgcolor: isSelected
                    ? isDark
                      ? 'rgba(56, 189, 248, 0.25)'
                      : '#0284c7'
                    : 'transparent',
                  color: isSelected ? '#ffffff' : textMain,
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.1)',
                  },
                }}
              />
            );
          })}
        </Stack>
      </Paper>

      {/* 1. TOP: FULL-WIDTH EXPANSIVE MAP VIEWPORT (LEFT TO RIGHT) */}
      <Paper
        className="glass-card"
        sx={{
          width: '100%',
          borderRadius: 3,
          overflow: 'hidden',
          height: { xs: 520, md: 620, lg: 680 },
          mb: 3,
          boxShadow: isDark
            ? '0 16px 40px rgba(0,0,0,0.5)'
            : '0 8px 30px rgba(0,0,0,0.08)',
        }}
      >
        <HazardMap
          ref={mapRef}
          activeFilter={activeFilter}
          onResetFilter={() => setActiveFilter('ALL')}
        />
      </Paper>

      {/* 2. BOTTOM: ALERTS & RELOCATIONS / SHELTERS DASHBOARD */}
      <Grid container spacing={3}>
        {/* Left Column: Active Warnings & Alerts Feed */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper className="glass-card" sx={{ p: 2.5, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header & Controls */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5} flexWrap="wrap" gap={1}>
              <Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <WarningAmberIcon sx={{ color: '#ef4444', fontSize: 24 }} />
                  <Typography variant="subtitle1" fontWeight="800" sx={{ color: textMain, letterSpacing: 0.2 }}>
                    Active Warnings & Threat Alerts ({displayedAlerts.length})
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: textSecondary, display: 'block', mt: 0.25 }}>
                  Real-time hydrometric gauges, CWC telemetry & IMD radar directives
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                {displayedAlerts.some((a) => a.severity === 'CRITICAL') && (
                  <Chip
                    label="🚨 CRITICAL ACTIVE"
                    size="small"
                    sx={{
                      fontSize: '0.65rem',
                      height: 22,
                      fontWeight: 900,
                      bgcolor: 'rgba(239,68,68,0.2)',
                      color: '#ef4444',
                      border: '1px solid rgba(239,68,68,0.4)',
                      animation: 'pulse 1.8s infinite',
                    }}
                  />
                )}
                <Button
                  size="small"
                  variant={showRegionalAlerts ? 'contained' : 'outlined'}
                  onClick={() => setShowRegionalAlerts(!showRegionalAlerts)}
                  sx={{
                    fontSize: '0.68rem',
                    py: 0.25,
                    px: 1,
                    minHeight: 24,
                    height: 24,
                    borderRadius: 1.5,
                    textTransform: 'none',
                    fontWeight: 700,
                    borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.3)',
                    color: showRegionalAlerts ? '#ffffff' : (isDark ? '#38bdf8' : '#0284c7'),
                    bgcolor: showRegionalAlerts ? (isDark ? '#0284c7' : '#0369a1') : 'transparent',
                  }}
                >
                  {showRegionalAlerts ? 'Show Local Only' : `Show All State (${alerts.length})`}
                </Button>
              </Stack>
            </Box>

            {/* Severity Breakdown Bar */}
            {displayedAlerts.length > 0 && (
              <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                {displayedAlerts.filter((a) => a.severity === 'CRITICAL').length > 0 && (
                  <Chip
                    size="small"
                    label={`${displayedAlerts.filter((a) => a.severity === 'CRITICAL').length} Critical Emergency`}
                    sx={{
                      fontSize: '0.65rem',
                      height: 20,
                      fontWeight: 800,
                      bgcolor: 'rgba(239,68,68,0.15)',
                      color: '#ef4444',
                      border: '1px solid rgba(239,68,68,0.3)',
                    }}
                  />
                )}
                {displayedAlerts.filter((a) => ['HIGH', 'RED'].includes(a.severity)).length > 0 && (
                  <Chip
                    size="small"
                    label={`${displayedAlerts.filter((a) => ['HIGH', 'RED'].includes(a.severity)).length} High Warning`}
                    sx={{
                      fontSize: '0.65rem',
                      height: 20,
                      fontWeight: 700,
                      bgcolor: 'rgba(249,115,22,0.15)',
                      color: '#f97316',
                      border: '1px solid rgba(249,115,22,0.3)',
                    }}
                  />
                )}
                {displayedAlerts.filter((a) => !['CRITICAL', 'HIGH', 'RED'].includes(a.severity)).length > 0 && (
                  <Chip
                    size="small"
                    label={`${displayedAlerts.filter((a) => !['CRITICAL', 'HIGH', 'RED'].includes(a.severity)).length} Advisory`}
                    sx={{
                      fontSize: '0.65rem',
                      height: 20,
                      fontWeight: 600,
                      bgcolor: 'rgba(234,179,8,0.15)',
                      color: '#eab308',
                      border: '1px solid rgba(234,179,8,0.3)',
                    }}
                  />
                )}
              </Box>
            )}

            {/* Active Critical Banner */}
            {displayedAlerts.some((a) => a.severity === 'CRITICAL') && (
              <Box
                sx={{
                  p: 1.25,
                  mb: 2,
                  borderRadius: 2,
                  bgcolor: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                }}
              >
                <CampaignIcon sx={{ color: '#ef4444', fontSize: 22 }} />
                <Typography variant="caption" sx={{ color: isDark ? '#fca5a5' : '#b91c1c', fontWeight: 700, lineHeight: 1.35 }}>
                  Active flood surge & danger mark breaches detected in river basin gauges. Low-lying habitations must follow evacuation protocols.
                </Typography>
              </Box>
            )}

            {/* Alerts Scrollable Feed */}
            <Stack spacing={1.5} maxHeight={420} sx={{ overflowY: 'auto', pr: 0.5, flex: 1 }}>
              {displayedAlerts.length > 0 ? (
                displayedAlerts.map((a, i) => {
                  const isCritical = a.severity === 'CRITICAL';
                  const isHigh = a.severity === 'HIGH' || a.severity === 'RED';
                  const sevColor = isCritical ? '#ef4444' : isHigh ? '#f97316' : '#eab308';

                  return (
                    <Box
                      key={a._id || i}
                      sx={{
                        p: 1.75,
                        borderRadius: 2.5,
                        backgroundColor: isCritical
                          ? (isDark ? 'rgba(239,68,68,0.06)' : 'rgba(254,242,242,0.85)')
                          : subCardBg,
                        border: `1px solid ${isCritical ? 'rgba(239,68,68,0.35)' : subCardBorder}`,
                        borderLeft: `5px solid ${sevColor}`,
                        boxShadow: isCritical ? '0 2px 12px rgba(239,68,68,0.12)' : 'none',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        '&:hover': {
                          transform: 'translateX(3px)',
                          boxShadow: isCritical
                            ? '0 4px 16px rgba(239,68,68,0.2)'
                            : (isDark ? '0 2px 10px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)'),
                        },
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75} flexWrap="wrap" gap={0.5}>
                        <Box display="flex" alignItems="center" gap={0.75}>
                          <Chip
                            label={a.severity}
                            size="small"
                            sx={{
                              fontSize: '0.62rem',
                              height: 19,
                              fontWeight: 800,
                              bgcolor: isCritical ? '#ef4444' : (isHigh ? '#f97316' : '#eab308'),
                              color: '#ffffff',
                            }}
                          />
                          <Typography variant="caption" fontWeight="700" sx={{ color: sevColor, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                            {a.hazardType || 'DISASTER'}
                          </Typography>
                          {a.district && (
                            <Typography variant="caption" sx={{ color: textSecondary }}>
                              &bull; {a.district.toUpperCase()}
                            </Typography>
                          )}
                        </Box>
                        <Chip
                          label={a.source || 'OFFICIAL BROADCAST'}
                          size="small"
                          sx={{
                            fontSize: '0.58rem',
                            height: 18,
                            backgroundColor: isDark ? 'rgba(56,189,248,0.12)' : 'rgba(2,132,199,0.1)',
                            color: isDark ? '#38bdf8' : '#0284c7',
                            fontWeight: 700,
                          }}
                        />
                      </Box>

                      <Typography variant="body2" fontWeight="800" sx={{ color: textMain, mb: 0.5, lineHeight: 1.35 }}>
                        {a.title}
                      </Typography>

                      {a.description && (
                        <Typography variant="caption" sx={{ color: textSecondary, display: 'block', lineHeight: 1.45, mb: 0.75 }}>
                          {a.description}
                        </Typography>
                      )}

                      {a.instructions && (
                        <Box
                          sx={{
                            mt: 0.75,
                            p: 1,
                            borderRadius: 1.5,
                            bgcolor: isCritical
                              ? (isDark ? 'rgba(239,68,68,0.12)' : 'rgba(254,226,226,0.7)')
                              : (isDark ? 'rgba(249,115,22,0.1)' : 'rgba(255,247,237,0.7)'),
                            border: `1px solid ${isCritical ? 'rgba(239,68,68,0.25)' : 'rgba(249,115,22,0.2)'}`,
                            color: isCritical
                              ? (isDark ? '#fca5a5' : '#b91c1c')
                              : (isDark ? '#fdba74' : '#c2410c'),
                            fontWeight: 600,
                            fontSize: '0.72rem',
                            lineHeight: 1.4,
                          }}
                        >
                          ⚠️ <strong>Action Directive:</strong> {a.instructions}
                        </Box>
                      )}
                    </Box>
                  );
                })
              ) : (
                <Box
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    bgcolor: subCardBg,
                    borderRadius: 2.5,
                    border: `1px dashed ${subCardBorder}`,
                    my: 'auto',
                  }}
                >
                  <CheckCircleOutlinedIcon sx={{ color: '#10b981', fontSize: 40, mb: 1 }} />
                  <Typography variant="subtitle2" fontWeight="700" sx={{ color: textMain }}>
                    Sector Gauges & Drainage Basins Nominal
                  </Typography>
                  <Typography variant="caption" sx={{ color: textSecondary, display: 'block', mt: 0.5, maxWidth: 360, mx: 'auto', lineHeight: 1.45 }}>
                    No active critical warnings matching {location.name || location.district || 'current sector'}. Live river telemetry and IMD rainfall feeds are being continuously monitored.
                  </Typography>
                  {alerts.length > 0 && !showRegionalAlerts && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setShowRegionalAlerts(true)}
                      sx={{
                        mt: 2,
                        fontSize: '0.72rem',
                        color: isDark ? '#38bdf8' : '#0284c7',
                        borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.3)',
                        textTransform: 'none',
                        fontWeight: 700,
                        borderRadius: 2,
                      }}
                    >
                      View All Regional / Basin Alerts ({alerts.length})
                    </Button>
                  )}
                </Box>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Right Column: Relocations, Shelter Recommendation & Capacities */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={2.5}>
            {/* Top Recommended Shelter Card */}
            {recommendation && (
              <ShelterCard
                shelter={recommendation.shelter}
                distance={`${recommendation.distance} km`}
                estimatedTravelTime={recommendation.estimatedTravelTime}
                isRecommended={true}
              />
            )}

            {/* Active Relocations & Shelters Overview */}
            <Paper className="glass-card" sx={{ p: 2.5, borderRadius: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Box display="flex" alignItems="center" gap={1}>
                  <DirectionsWalkIcon sx={{ color: '#0284c7', fontSize: 22 }} />
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: textMain }}>
                    Evacuation Shelters & Relocations ({displayedShelters.length})
                  </Typography>
                </Box>
                <Chip
                  label="INTAKE READY"
                  size="small"
                  sx={{
                    fontSize: '0.62rem',
                    height: 20,
                    fontWeight: 800,
                    bgcolor: 'rgba(16,185,129,0.15)',
                    color: '#10b981',
                  }}
                />
              </Box>

              <Stack spacing={1.5} maxHeight={recommendation ? 230 : 360} sx={{ overflowY: 'auto', pr: 0.5 }}>
                {displayedShelters.length > 0 ? (
                  displayedShelters.map((s) => {
                    const vacant = Math.max(0, s.capacity - s.currentOccupancy);
                    const occPct = Math.round((s.currentOccupancy / s.capacity) * 100) || 0;
                    return (
                      <Box
                        key={s._id}
                        sx={{
                          p: 1.25,
                          borderRadius: 2,
                          backgroundColor: subCardBg,
                          border: `1px solid ${subCardBorder}`,
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" fontWeight="bold" sx={{ color: '#0284c7' }}>
                            {s.district || location.district || 'Local'} &bull; {s.status}
                          </Typography>
                          <Chip
                            label={`${vacant} Beds Open`}
                            size="small"
                            sx={{
                              fontSize: '0.62rem',
                              height: 18,
                              fontWeight: 700,
                              bgcolor: occPct > 80 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                              color: occPct > 80 ? '#ef4444' : '#10b981',
                            }}
                          />
                        </Box>
                        <Typography variant="body2" fontWeight="700" sx={{ color: textMain, mt: 0.5 }}>
                          {s.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: textSecondary, display: 'block', mt: 0.25 }}>
                          Occupancy: {s.currentOccupancy} / {s.capacity} ({occPct}%) &bull;{' '}
                          {s.facilities?.slice(0, 3).join(', ') || 'Relief Intake'}
                        </Typography>
                      </Box>
                    );
                  })
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: textSecondary }}>
                      No designated relief shelters recorded for {location.name || location.district}.
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Paper>

            {/* Optional Field Reports feed if filter is REPORTS */}
            {activeFilter === 'REPORTS' && (
              <Paper className="glass-card" sx={{ p: 2.5, borderRadius: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CampaignIcon sx={{ color: '#38bdf8', fontSize: 20 }} />
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: textMain }}>
                      Citizen Field Reports ({displayedReports.length})
                    </Typography>
                  </Box>
                  <Chip
                    label="FIELD FEED"
                    size="small"
                    sx={{
                      fontSize: '0.62rem',
                      height: 18,
                      fontWeight: 700,
                      bgcolor: 'rgba(56,189,248,0.15)',
                      color: isDark ? '#38bdf8' : '#0284c7',
                    }}
                  />
                </Box>
                <Stack spacing={1.25} maxHeight={220} sx={{ overflowY: 'auto' }}>
                  {displayedReports.length > 0 ? (
                    displayedReports.map((r, i) => (
                      <Box
                        key={r._id || i}
                        sx={{
                          p: 1.25,
                          borderRadius: 2,
                          backgroundColor: subCardBg,
                          border: `1px solid ${subCardBorder}`,
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography
                            variant="caption"
                            fontWeight="bold"
                            sx={{ color: r.severity === 'CRITICAL' ? '#ef4444' : '#f97316' }}
                          >
                            {r.severity} &bull; {r.disasterType}
                          </Typography>
                          <Chip
                            label={r.status}
                            size="small"
                            sx={{
                              fontSize: '0.6rem',
                              height: 16,
                              backgroundColor: 'rgba(56,189,248,0.1)',
                              color: isDark ? '#38bdf8' : '#0284c7',
                            }}
                          />
                        </Box>
                        <Typography variant="body2" fontWeight="600" sx={{ color: textMain, mt: 0.5 }}>
                          "{r.description.slice(0, 90)}{r.description.length > 90 ? '...' : ''}"
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: textSecondary }}>
                        No field incident reports in {location.name || location.district}.
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Paper>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Boilerplate>
  );
}
