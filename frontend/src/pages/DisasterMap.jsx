import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Stack, Button, Chip, Divider, CircularProgress } from '@mui/material';
import LayersIcon from '@mui/icons-material/Layers';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Boilerplate from '../layouts/Boilerplate';
import HazardMap from '../components/Map/HazardMap';
import ShelterCard from '../components/ShelterCard';
import { getAlerts, getCitizenReports, getShelterRecommendation, getShelters } from '../services/api';
import { useThemeMode } from '../context/ThemeContext';
import { useLocationContext } from '../context/LocationContext';
import { isItemInActiveLocation } from '../utils/locationHelper';

const FILTER_OPTIONS = [
  { id: 'ALL', label: 'ALL LAYERS' },
  { id: 'FLOOD', label: 'FLOOD RISK' },
  { id: 'LANDSLIDE', label: 'LANDSLIDE RISK' },
  { id: 'WILDFIRE', label: 'WILDFIRE RISK' },
  { id: 'SHELTERS', label: 'SHELTERS' },
  { id: 'REPORTS', label: 'CITIZEN REPORTS' },
  { id: 'HIGH_RISK', label: 'HIGH RISK ONLY' }
];

export default function DisasterMap() {
  const { isDark } = useThemeMode();
  const textMain = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const subCardBg = isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc';
  const subCardBorder = isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0';

  const { location } = useLocationContext();
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [alerts, setAlerts] = useState([]);
  const [reports, setReports] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const targetDistrict = location.district || (location.name ? location.name.split('(')[0].trim() : '');
    Promise.all([
      getAlerts(),
      getCitizenReports(),
      getShelterRecommendation(location.lat, location.lng, targetDistrict),
      getShelters()
    ]).then(([alertRes, reportRes, shelterRes, sheltersListRes]) => {
      setAlerts(alertRes.data?.data || []);
      setReports(reportRes.data?.data || []);
      setRecommendation(shelterRes.data?.data?.recommended || null);
      setShelters(sheltersListRes.data?.data || []);
    }).catch(console.error)
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

  return (
    <Boilerplate>
      <Box mb={2.5}>
        <Typography variant="caption" sx={{ color: textSecondary }}>Home &gt; Dynamic Live Disaster Map</Typography>
        <Typography variant="h5" fontWeight="bold" sx={{ color: textMain, mt: 0.5 }}>
          Dynamic Geospatial Intelligence Map
        </Typography>
        <Typography variant="body2" sx={{ color: textSecondary }}>
          Multi-layer real-time map combining flood/landslide/wildfire risk zones, active citizen reports, verified incidents, and shelter capacity.
        </Typography>
      </Box>

      {/* Filter Bar */}
      <Paper className="glass-card" sx={{ p: 1.5, mb: 3, borderRadius: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Box display="flex" alignItems="center" gap={0.5} mr={1}>
            <FilterAltIcon sx={{ color: isDark ? '#38bdf8' : '#0284c7', fontSize: 20 }} />
            <Typography variant="caption" fontWeight="bold" sx={{ color: textMain }}>
              LAYERS & FILTERS:
            </Typography>
          </Box>
          {FILTER_OPTIONS.map((f) => (
            <Chip
              key={f.id}
              label={f.label}
              onClick={() => setActiveFilter(f.id)}
              color={activeFilter === f.id ? 'primary' : 'default'}
              variant={activeFilter === f.id ? 'filled' : 'outlined'}
              sx={{
                fontWeight: 700,
                fontSize: '0.72rem',
                cursor: 'pointer',
                borderColor: activeFilter === f.id ? '#38bdf8' : 'rgba(255,255,255,0.1)'
              }}
            />
          ))}
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        {/* Main Leaflet Map */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper className="glass-card" sx={{ borderRadius: 3, overflow: 'hidden', height: 600 }}>
            <HazardMap activeFilter={activeFilter} onResetFilter={() => setActiveFilter('ALL')} />
          </Paper>
        </Grid>

        {/* Side Operational Panel */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2.5}>
            {/* Dynamic Context Panel depending on activeFilter */}
            {activeFilter === 'SHELTERS' ? (
              <Paper className="glass-card" sx={{ p: 2.5, borderRadius: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ color: textMain }}>
                    Shelter Vacancies & Capacity ({displayedShelters.length})
                  </Typography>
                  <Chip
                    label="LIVE GRID"
                    size="small"
                    sx={{ fontSize: '0.62rem', height: 18, fontWeight: 700, bgcolor: 'rgba(16,185,129,0.15)', color: '#10b981' }}
                  />
                </Box>
                <Stack spacing={1.5} maxHeight={260} sx={{ overflowY: 'auto' }}>
                  {displayedShelters.length > 0 ? (
                    displayedShelters.map((s) => {
                      const vacant = Math.max(0, s.capacity - s.currentOccupancy);
                      const occPct = Math.round((s.currentOccupancy / s.capacity) * 100) || 0;
                      return (
                        <Box key={s._id} sx={{ p: 1.25, borderRadius: 2, backgroundColor: subCardBg, border: `1px solid ${subCardBorder}` }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" fontWeight="bold" sx={{ color: '#0284c7' }}>
                              {s.district || location.district || 'Local'} • {s.status}
                            </Typography>
                            <Chip
                              label={`${vacant} Beds Open`}
                              size="small"
                              sx={{
                                fontSize: '0.62rem',
                                height: 18,
                                fontWeight: 700,
                                bgcolor: occPct > 80 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                                color: occPct > 80 ? '#ef4444' : '#10b981'
                              }}
                            />
                          </Box>
                          <Typography variant="body2" fontWeight="600" sx={{ color: textMain, mt: 0.5 }}>
                            {s.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: textSecondary, display: 'block', mt: 0.25 }}>
                            Occupancy: {s.currentOccupancy} / {s.capacity} ({occPct}%) • {s.facilities?.slice(0, 3).join(', ') || 'Shelter'}
                          </Typography>
                        </Box>
                      );
                    })
                  ) : (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: textSecondary }}>
                        No designated shelters listed in {location.name || location.district} yet.
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Paper>
            ) : activeFilter === 'REPORTS' ? (
              <Paper className="glass-card" sx={{ p: 2.5, borderRadius: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ color: textMain }}>
                    Citizen Incident Feed ({displayedReports.length})
                  </Typography>
                  <Chip
                    label="FIELD DATA"
                    size="small"
                    sx={{ fontSize: '0.62rem', height: 18, fontWeight: 700, bgcolor: 'rgba(56,189,248,0.15)', color: isDark ? '#38bdf8' : '#0284c7' }}
                  />
                </Box>
                <Stack spacing={1.5} maxHeight={260} sx={{ overflowY: 'auto' }}>
                  {displayedReports.length > 0 ? (
                    displayedReports.map((r, i) => (
                      <Box key={r._id || i} sx={{ p: 1.25, borderRadius: 2, backgroundColor: subCardBg, border: `1px solid ${subCardBorder}` }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" fontWeight="bold" sx={{ color: r.severity === 'CRITICAL' ? '#ef4444' : '#f97316' }}>
                            {r.severity} • {r.disasterType}
                          </Typography>
                          <Chip label={r.status} size="small" sx={{ fontSize: '0.6rem', height: 16, backgroundColor: 'rgba(56,189,248,0.1)', color: isDark ? '#38bdf8' : '#0284c7' }} />
                        </Box>
                        <Typography variant="body2" fontWeight="600" sx={{ color: textMain, mt: 0.5 }}>
                          "{r.description.slice(0, 75)}{r.description.length > 75 ? '...' : ''}"
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: textSecondary }}>
                        No active field incident reports in {location.name || location.district}.
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Paper>
            ) : (
              /* Active Alerts List */
              <Paper className="glass-card" sx={{ p: 2.5, borderRadius: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ color: textMain, mb: 1.5 }}>
                  Active Warnings ({displayedAlerts.length})
                </Typography>
                <Stack spacing={1.5} maxHeight={220} sx={{ overflowY: 'auto' }}>
                  {displayedAlerts.length > 0 ? (
                    displayedAlerts.map((a, i) => (
                      <Box key={a._id || i} sx={{ p: 1.25, borderRadius: 2, backgroundColor: subCardBg, border: `1px solid ${subCardBorder}` }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" fontWeight="bold" sx={{ color: a.severity === 'CRITICAL' ? '#ef4444' : '#f97316' }}>
                            {a.severity} • {a.hazardType}
                          </Typography>
                          <Chip label={a.source || 'OFFICIAL'} size="small" sx={{ fontSize: '0.6rem', height: 16, backgroundColor: 'rgba(56,189,248,0.1)', color: isDark ? '#38bdf8' : '#0284c7' }} />
                        </Box>
                        <Typography variant="body2" fontWeight="600" sx={{ color: textMain, mt: 0.5 }}>
                          {a.title}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: textSecondary }}>
                        No warnings matching current filter ({activeFilter})
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Paper>
            )}

            {/* Smart Shelter Recommendation */}
            {recommendation && (
              <ShelterCard
                shelter={recommendation.shelter}
                distance={`${recommendation.distance} km`}
                estimatedTravelTime={recommendation.estimatedTravelTime}
                isRecommended={true}
              />
            )}
          </Stack>
        </Grid>
      </Grid>
    </Boilerplate>
  );
}
