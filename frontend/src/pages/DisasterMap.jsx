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

  useEffect(() => {
    setLoading(true);
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

  const locationFilteredAlerts = alerts.filter((a) => isItemInActiveLocation(a, location));
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
          <Paper className="glass-card" sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <WarningAmberIcon sx={{ color: '#ef4444', fontSize: 22 }} />
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: textMain }}>
                  Active Warnings & Threat Alerts ({displayedAlerts.length})
                </Typography>
              </Box>
              <Chip
                label="LIVE SENTINEL"
                size="small"
                sx={{
                  fontSize: '0.62rem',
                  height: 20,
                  fontWeight: 800,
                  bgcolor: 'rgba(239,68,68,0.15)',
                  color: '#ef4444',
                }}
              />
            </Box>

            <Stack spacing={1.5} maxHeight={420} sx={{ overflowY: 'auto', pr: 0.5 }}>
              {displayedAlerts.length > 0 ? (
                displayedAlerts.map((a, i) => {
                  const isCritical = a.severity === 'CRITICAL';
                  const isHigh = a.severity === 'HIGH' || a.severity === 'RED';
                  const sevColor = isCritical ? '#ef4444' : isHigh ? '#f97316' : '#eab308';

                  return (
                    <Box
                      key={a._id || i}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: subCardBg,
                        border: `1px solid ${subCardBorder}`,
                        borderLeft: `4px solid ${sevColor}`,
                        transition: 'transform 0.15s ease',
                        '&:hover': { transform: 'translateX(3px)' },
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography variant="caption" fontWeight="bold" sx={{ color: sevColor }}>
                          {a.severity} &bull; {a.hazardType || 'DISASTER'}
                        </Typography>
                        <Chip
                          label={a.source || 'OFFICIAL BROADCAST'}
                          size="small"
                          sx={{
                            fontSize: '0.6rem',
                            height: 18,
                            backgroundColor: isDark ? 'rgba(56,189,248,0.12)' : 'rgba(2,132,199,0.1)',
                            color: isDark ? '#38bdf8' : '#0284c7',
                            fontWeight: 700,
                          }}
                        />
                      </Box>
                      <Typography variant="body2" fontWeight="700" sx={{ color: textMain, mb: 0.5 }}>
                        {a.title}
                      </Typography>
                      {a.description && (
                        <Typography variant="caption" sx={{ color: textSecondary, display: 'block', lineHeight: 1.4 }}>
                          {a.description}
                        </Typography>
                      )}
                      {a.instructions && (
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            mt: 0.75,
                            p: 0.75,
                            borderRadius: 1,
                            bgcolor: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)',
                            color: isDark ? '#fca5a5' : '#b91c1c',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                          }}
                        >
                          ⚠️ Directive: {a.instructions}
                        </Typography>
                      )}
                    </Box>
                  );
                })
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: textSecondary }}>
                    No active warnings matching current location ({location.name || location.district || 'Bhopal'}).
                  </Typography>
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
