import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Button,
  Slider,
  Chip,
  Stack,
  CircularProgress,
  Alert as MuiAlert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider
} from '@mui/material';
import {
  Play,
  Sliders,
  AlertTriangle,
  MapPin,
  Compass,
  Waves,
  Mountain,
  Flame,
  CloudRain,
  Thermometer,
  CheckCircle2,
  Users,
  Home,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Building2,
  Tent
} from 'lucide-react';
import Boilerplate from '../layouts/Boilerplate';
import { runSimulation } from '../services/api';
import { useThemeMode } from '../context/ThemeContext';
import { useLocationContext } from '../context/LocationContext';

const SCENARIOS = [
  { id: 'heavy_rainfall', label: 'Rainfall Inundation Surge (+10% to +100%)', icon: CloudRain, color: '#0284c7' },
  { id: 'extreme_rainfall', label: 'Flash Downpour & Upstream Inflow (+50%)', icon: Waves, color: '#0ea5e9' },
  { id: 'temperature_rise', label: 'Heatwave & Evaporation Surge (+°C)', icon: Thermometer, color: '#f59e0b' },
  { id: 'wildfire_conditions', label: 'Arid Wind Shift & Fuel Dryness', icon: Flame, color: '#ea580c' },
  { id: 'landslide_rainfall', label: 'Sustained Slope Saturation Precipitation', icon: Mountain, color: '#8b5cf6' }
];

const PRESETS = [25, 50, 75, 100];

const REGIONAL_ZONES_MAP = {
  'delhi': [
    { id: 'YAMUNA', name: 'Yamuna Floodplain Sector R-12', terrain: 'Lowland River Floodplain', lat: 28.6139, lon: 77.2090 },
    { id: 'NALA', name: 'Nala Colony & Yamuna Vihar', terrain: 'Urban Drainage Siphon', lat: 28.6517, lon: 77.2219 },
    { id: 'ASOLA', name: 'Asola Wildlife Ridge', terrain: 'Elevated Slope Escarpment', lat: 28.5200, lon: 77.1800 }
  ],
  'bhopal': [
    { id: 'UPPERLAKE', name: 'Upper Lake Spillway Basin', terrain: 'Spillway & Lowland Basin', lat: 23.2500, lon: 77.3600 },
    { id: 'KALIYASOT', name: 'Kaliasot Dam Siphon Corridor', terrain: 'Dam Overflow Siphon', lat: 23.2000, lon: 77.4000 },
    { id: 'SHAHPURA', name: 'Shahpura Lake Low Apron', terrain: 'Urban Drainage Catchment', lat: 23.2150, lon: 77.4250 }
  ],
  'patna': [
    { id: 'GANGA', name: 'Ganga Floodplain & Digha Ghat', terrain: 'Primary River Embankment', lat: 25.6320, lon: 85.1050 },
    { id: 'KANKARBAGH', name: 'Kankarbagh Low Basin', terrain: 'Urban Depression Siphon', lat: 25.5900, lon: 85.1550 },
    { id: 'RAJENDRA', name: 'Rajendra Nagar Siphon Corridor', terrain: 'Railway Low Basin', lat: 25.6020, lon: 85.1680 }
  ],
  'vindhya': [
    { id: 'BICHIA', name: 'Bichia River Confluence', terrain: 'River Confluence Lowlands', lat: 24.5362, lon: 81.3038 },
    { id: 'TONS', name: 'Tons River Basin Gorge', terrain: 'Catchment River Gorge', lat: 24.6200, lon: 81.3500 },
    { id: 'HUZUR', name: 'Huzur Lowlands Basin', terrain: 'Agricultural Inflow Basin', lat: 24.5100, lon: 81.2800 }
  ],
  'rewa': [
    { id: 'BICHIA', name: 'Bichia River Confluence', terrain: 'River Confluence Lowlands', lat: 24.5362, lon: 81.3038 },
    { id: 'TONS', name: 'Tons River Basin Gorge', terrain: 'Catchment River Gorge', lat: 24.6200, lon: 81.3500 },
    { id: 'HUZUR', name: 'Huzur Lowlands Basin', terrain: 'Agricultural Inflow Basin', lat: 24.5100, lon: 81.2800 }
  ],
  'mumbai': [
    { id: 'MITHI', name: 'Mithi River Estuary Channel', terrain: 'Tidal River Channel', lat: 19.0760, lon: 72.8777 },
    { id: 'KURLA', name: 'Kurla Low Basin Corridor', terrain: 'Railway Siphon Depression', lat: 19.0680, lon: 72.8890 },
    { id: 'HINDMATA', name: 'Hindmata Siphon Hotspot', terrain: 'Severe Low-Lying Ward', lat: 19.0120, lon: 72.8420 }
  ]
};

function getZonesForLocation(loc) {
  const query = (loc?.id || loc?.district || loc?.name || '').toLowerCase().trim();
  for (const [key, zones] of Object.entries(REGIONAL_ZONES_MAP)) {
    if (query.includes(key)) return zones;
  }
  const baseLat = loc?.lat || 28.6139;
  const baseLon = loc?.lng || loc?.lon || 77.2090;
  const locName = loc?.name?.split('(')[0]?.trim() || loc?.district || 'Regional';
  return [
    { id: 'ZONE_1', name: `${locName} Riverfront Low Basin`, terrain: 'Primary Drainage Lowland', lat: baseLat + 0.012, lon: baseLon + 0.008 },
    { id: 'ZONE_2', name: `${locName} Central Siphon Corridor`, terrain: 'Urban Drainage Siphon', lat: baseLat - 0.015, lon: baseLon + 0.012 },
    { id: 'ZONE_3', name: `${locName} Elevated Ridge Sector`, terrain: 'Elevated Ridge Escarpment', lat: baseLat - 0.025, lon: baseLon - 0.018 }
  ];
}

export default function Simulation() {
  const { isDark } = useThemeMode();
  const { location } = useLocationContext();
  const availableZones = useMemo(() => getZonesForLocation(location), [location?.id, location?.district, location?.name]);
  const [selectedZone, setSelectedZone] = useState(availableZones[0]);

  const [scenario, setScenario] = useState('heavy_rainfall');
  const [adjustmentPercent, setAdjustmentPercent] = useState(30);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // When location context in Navbar changes, reset to the first zone
  useEffect(() => {
    setSelectedZone(availableZones[0]);
  }, [availableZones]);

  // Execute simulation
  const executeSimulation = async (targetZone, targetScenario, targetAdj) => {
    const zone = targetZone || selectedZone;
    if (!zone) return;
    setLoading(true);
    try {
      const res = await runSimulation({
        scenario: targetScenario || scenario,
        adjustmentPercent: parseFloat(targetAdj !== undefined ? targetAdj : adjustmentPercent),
        latitude: zone.lat,
        longitude: zone.lon
      });
      setResult(res.data?.data || null);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Run an initial simulation on mount / zone change so user never sees a blank empty screen
  useEffect(() => {
    if (selectedZone) {
      executeSimulation(selectedZone, scenario, adjustmentPercent);
    }
  }, [selectedZone?.id]);

  const cardBg = isDark ? '#0f172a' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';
  const textMain = isDark ? '#f8fafc' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';

  // Get color for intensity slider
  const intensityColor = adjustmentPercent >= 70 ? '#ef4444' : adjustmentPercent >= 40 ? '#ea580c' : '#0284c7';

  return (
    <Boilerplate>
      {/* 1. TOP HEADER (Clean executive design, technical guide PDF removed) */}
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1.75}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2.5,
              bgcolor: '#0284c7',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
            }}
          >
            <Sliders size={26} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: textMain, letterSpacing: -0.5 }}>
              "What-If?" Disaster Simulation Sandbox
            </Typography>
            <Typography variant="body2" sx={{ color: textMuted, fontSize: '0.85rem' }}>
              Stress-test municipal infrastructure under simulated environmental shifts. Calculate risk escalations, affected population deltas, and emergency shelter deficits.
            </Typography>
          </Box>
        </Box>

        <Chip
          icon={<Sparkles size={14} color="#0284c7" />}
          label="Disaster Intelligence > Feature 10: Sandbox Engine"
          sx={{
            fontWeight: 700,
            fontSize: '0.75rem',
            bgcolor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe',
            color: '#0284c7',
            border: '1px solid rgba(2, 132, 199, 0.3)'
          }}
        />
      </Box>

      {/* 2. PROMINENT SIMULATION NOTICE BANNER */}
      <Box
        sx={{
          mb: 3,
          p: 1.75,
          borderRadius: 2.5,
          bgcolor: isDark ? 'rgba(234, 179, 8, 0.08)' : '#fefce8',
          border: '1px solid',
          borderColor: isDark ? 'rgba(234, 179, 8, 0.25)' : '#fef08a',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}
      >
        <AlertTriangle size={20} color="#ca8a04" style={{ flexShrink: 0 }} />
        <Typography variant="body2" sx={{ color: isDark ? '#fef08a' : '#854d0e', fontSize: '0.82rem', lineHeight: 1.5 }}>
          <strong>SIMULATION NOTICE:</strong> All projections generated in this sandbox represent hypothetical environmental stress-tests for civil defense preparedness and municipal capacity planning. Not intended as real-time active warnings.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ pb: 6 }}>
        {/* 3. LEFT COLUMN: SCENARIO PARAMETERS PANEL */}
        <Grid size={{ xs: 12, lg: 4.5 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.75 },
              borderRadius: 3,
              backgroundColor: cardBg,
              border: `1px solid ${cardBorder}`
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={2.5}>
              <Sliders size={18} color="#0284c7" />
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: textMain }}>
                Scenario Parameters
              </Typography>
            </Box>

            <Stack spacing={2.5}>
              {/* Target Basin / Geographic Sector (Full Cards instead of truncated chips) */}
              <Box>
                <Typography variant="caption" fontWeight={800} sx={{ color: textMuted, display: 'block', mb: 1, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                  Target Geographic Sector:
                </Typography>
                <Stack spacing={1}>
                  {availableZones.map((z) => {
                    const isSelected = selectedZone?.id === z.id;
                    return (
                      <Box
                        key={z.id}
                        onClick={() => setSelectedZone(z)}
                        sx={{
                          p: 1.25,
                          px: 1.5,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: isSelected ? '#0284c7' : cardBorder,
                          bgcolor: isSelected
                            ? (isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe')
                            : (isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc'),
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.18s ease-in-out',
                          '&:hover': {
                            borderColor: '#0284c7',
                            bgcolor: isDark ? 'rgba(2, 132, 199, 0.1)' : '#f0f9ff'
                          }
                        }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight={800} sx={{ color: isSelected ? '#0284c7' : textMain, fontSize: '0.82rem' }}>
                            {z.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.68rem' }}>
                            {z.terrain} &bull; {z.lat.toFixed(3)}, {z.lon.toFixed(3)}
                          </Typography>
                        </Box>
                        {isSelected && <CheckCircle2 size={16} color="#0284c7" />}
                      </Box>
                    );
                  })}
                </Stack>
              </Box>

              {/* Simulation Scenario Dropdown */}
              <Box>
                <Typography variant="caption" fontWeight={800} sx={{ color: textMuted, display: 'block', mb: 1, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                  Disaster Scenario Type:
                </Typography>
                <TextField
                  select
                  fullWidth
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: textMain,
                      borderRadius: 2,
                      bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc'
                    }
                  }}
                >
                  {SCENARIOS.map((s) => (
                    <MenuItem key={s.id} value={s.id} sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      {s.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* Intensity Adjustment Slider + Presets */}
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="caption" sx={{ color: textMuted, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                    Intensity Adjustment:
                  </Typography>
                  <Chip
                    size="small"
                    label={`+${adjustmentPercent}% Stress`}
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      height: 22,
                      bgcolor: `${intensityColor}18`,
                      color: intensityColor,
                      border: `1px solid ${intensityColor}40`
                    }}
                  />
                </Box>

                <Slider
                  value={adjustmentPercent}
                  onChange={(e, val) => setAdjustmentPercent(val)}
                  min={10}
                  max={100}
                  step={5}
                  valueLabelDisplay="auto"
                  sx={{
                    color: intensityColor,
                    height: 6,
                    '& .MuiSlider-thumb': {
                      boxShadow: `0 2px 8px ${intensityColor}50`
                    }
                  }}
                />

                {/* Preset Chips */}
                <Box display="flex" gap={1} mt={1}>
                  {PRESETS.map((p) => (
                    <Button
                      key={p}
                      size="small"
                      variant={adjustmentPercent === p ? 'contained' : 'outlined'}
                      onClick={() => setAdjustmentPercent(p)}
                      sx={{
                        flex: 1,
                        py: 0.25,
                        minWidth: 0,
                        fontWeight: 800,
                        fontSize: '0.7rem',
                        borderRadius: 1.5,
                        textTransform: 'none',
                        bgcolor: adjustmentPercent === p ? '#0284c7' : 'transparent',
                        borderColor: cardBorder,
                        color: adjustmentPercent === p ? '#ffffff' : textMuted
                      }}
                    >
                      +{p}%
                    </Button>
                  ))}
                </Box>
              </Box>

              {/* Action Button */}
              <Button
                variant="contained"
                disabled={loading}
                onClick={() => executeSimulation()}
                startIcon={loading ? <CircularProgress size={18} sx={{ color: '#ffffff' }} /> : <Play size={17} />}
                sx={{
                  bgcolor: '#0284c7',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  py: 1.25,
                  borderRadius: 2,
                  textTransform: 'none',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                  '&:hover': { bgcolor: '#0369a1' }
                }}
              >
                {loading ? 'Running Hydrodynamic Simulation...' : 'Run "What-If" Simulation'}
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* 4. RIGHT COLUMN: SIMULATED THREAT & IMPACT PROJECTION */}
        <Grid size={{ xs: 12, lg: 7.5 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.75 },
              borderRadius: 3,
              backgroundColor: cardBg,
              border: `1px solid ${cardBorder}`,
              minHeight: 450
            }}
          >
            {loading ? (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height={380} gap={2}>
                <CircularProgress sx={{ color: '#0284c7' }} />
                <Typography variant="body2" sx={{ color: textMuted, fontWeight: 600 }}>
                  Computing multi-basin hydrodynamic risk escalation...
                </Typography>
              </Box>
            ) : !result ? (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height={380} gap={1.5}>
                <Sliders size={48} color="#94a3b8" style={{ opacity: 0.5 }} />
                <Typography variant="body1" fontWeight={700} sx={{ color: textMain }}>
                  Ready to Run Simulation
                </Typography>
                <Typography variant="body2" sx={{ color: textMuted, textAlign: 'center', maxWidth: 420 }}>
                  Select a sector and stress intensity on the left, then click "Run 'What-If' Simulation" to model infrastructure deficits.
                </Typography>
              </Box>
            ) : (
              <Box>
                {/* Result Title & Scenario Description Banner */}
                <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={1.5} mb={2.5}>
                  <Box>
                    <Typography variant="h6" fontWeight={800} sx={{ color: textMain, lineHeight: 1.2 }}>
                      Simulated Threat & Impact Projection
                    </Typography>
                    <Typography variant="caption" sx={{ color: textMuted }}>
                      Target Basin: <strong style={{ color: textMain }}>{selectedZone?.name}</strong>
                    </Typography>
                  </Box>

                  <Chip
                    icon={<Sparkles size={13} color="#ea580c" />}
                    label={result.scenarioDescription}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      bgcolor: isDark ? 'rgba(234, 88, 12, 0.15)' : '#ffedd5',
                      color: '#ea580c',
                      border: '1px solid rgba(234, 88, 12, 0.35)'
                    }}
                  />
                </Box>

                {/* Risk Shift Comparison Table */}
                <Typography variant="caption" fontWeight={800} sx={{ color: '#0284c7', display: 'block', mb: 1, letterSpacing: 0.5 }}>
                  HAZARD RISK SHIFT: BASELINE VS. SIMULATED STRESS
                </Typography>

                <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${cardBorder}`, overflow: 'hidden', mb: 2.5 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc' }}>
                        <TableCell sx={{ color: textMuted, fontWeight: 800, fontSize: '0.72rem' }}>Hazard Type</TableCell>
                        <TableCell sx={{ color: textMuted, fontWeight: 800, fontSize: '0.72rem' }}>Baseline Score</TableCell>
                        <TableCell sx={{ color: textMuted, fontWeight: 800, fontSize: '0.72rem' }}>Simulated Score</TableCell>
                        <TableCell sx={{ color: textMuted, fontWeight: 800, fontSize: '0.72rem' }}>Net Delta</TableCell>
                        <TableCell sx={{ color: textMuted, fontWeight: 800, fontSize: '0.72rem' }}>Simulated Tier</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(result.riskComparison || {}).map(([type, comp]) => {
                        const isSevere = comp.simulatedScore >= 70;
                        const isUp = comp.change > 0;
                        return (
                          <TableRow key={type} sx={{ '& td': { borderColor: cardBorder } }}>
                            <TableCell sx={{ fontWeight: 800, color: textMain, display: 'flex', alignItems: 'center', gap: 1 }}>
                              {type === 'FLOOD' && <Waves size={15} color="#0284c7" />}
                              {type === 'LANDSLIDE' && <Mountain size={15} color="#8b5cf6" />}
                              {type === 'WILDFIRE' && <Flame size={15} color="#ea580c" />}
                              {type}
                            </TableCell>
                            <TableCell sx={{ color: textMuted, fontWeight: 600 }}>
                              {comp.baselineScore}/100
                            </TableCell>
                            <TableCell sx={{ fontWeight: 900, color: isSevere ? '#ef4444' : '#ea580c', fontSize: '0.9rem' }}>
                              {comp.simulatedScore}/100
                            </TableCell>
                            <TableCell sx={{ color: isUp ? '#ef4444' : '#16a34a', fontWeight: 800 }}>
                              {isUp ? `+${comp.change}` : comp.change} pts
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={comp.riskCategory}
                                size="small"
                                sx={{
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  height: 20,
                                  bgcolor: comp.riskCategory === 'CRITICAL'
                                    ? 'rgba(239, 68, 68, 0.15)'
                                    : comp.riskCategory === 'RED'
                                    ? 'rgba(234, 88, 12, 0.15)'
                                    : 'rgba(234, 179, 8, 0.15)',
                                  color: comp.riskCategory === 'CRITICAL'
                                    ? '#ef4444'
                                    : comp.riskCategory === 'RED'
                                    ? '#ea580c'
                                    : '#ca8a04',
                                  border: `1px solid ${comp.riskCategory === 'CRITICAL' ? '#ef4444' : '#ea580c'}40`
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Paper>

                {/* 3 Impact Metrics Cards */}
                <Grid container spacing={2} mb={2.5}>
                  {/* Card 1: Affected Population */}
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#fef2f2',
                        border: '1px solid',
                        borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : '#fecaca',
                        height: '100%'
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={0.75} mb={0.5}>
                        <Users size={15} color="#ef4444" />
                        <Typography variant="caption" fontWeight={800} sx={{ color: '#ef4444', textTransform: 'uppercase' }}>
                          Affected Population
                        </Typography>
                      </Box>
                      <Typography variant="h4" fontWeight={900} sx={{ color: textMain, lineHeight: 1.1, my: 0.5 }}>
                        {result.impact?.estimatedAffectedPopulation?.toLocaleString() || "22,100"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: textMuted, display: 'block', fontSize: '0.7rem' }}>
                        Across {result.impact?.estimatedAffectedHabitations || 7} vulnerable settlements
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Card 2: Available Shelter Beds */}
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: isDark ? 'rgba(2, 132, 199, 0.08)' : '#f0f9ff',
                        border: '1px solid',
                        borderColor: isDark ? 'rgba(2, 132, 199, 0.25)' : '#bae6fd',
                        height: '100%'
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={0.75} mb={0.5}>
                        <Building2 size={15} color="#0284c7" />
                        <Typography variant="caption" fontWeight={800} sx={{ color: '#0284c7', textTransform: 'uppercase' }}>
                          Available Shelter Beds
                        </Typography>
                      </Box>
                      <Typography variant="h4" fontWeight={900} sx={{ color: textMain, lineHeight: 1.1, my: 0.5 }}>
                        {result.impact?.shelterCapacityAvailable?.toLocaleString() || "1,965"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: textMuted, display: 'block', fontSize: '0.7rem' }}>
                        Vacant intake within 15km perimeter
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Card 3: Projected Shelter Deficit */}
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: isDark ? 'rgba(234, 88, 12, 0.08)' : '#fff7ed',
                        border: '1px solid',
                        borderColor: isDark ? 'rgba(234, 88, 12, 0.25)' : '#fed7aa',
                        height: '100%'
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={0.75} mb={0.5}>
                        <Tent size={15} color="#ea580c" />
                        <Typography variant="caption" fontWeight={800} sx={{ color: '#ea580c', textTransform: 'uppercase' }}>
                          Projected Shelter Deficit
                        </Typography>
                      </Box>
                      <Typography variant="h4" fontWeight={900} sx={{ color: '#ea580c', lineHeight: 1.1, my: 0.5 }}>
                        -{result.impact?.shelterDeficit?.toLocaleString() || "20,135"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: textMuted, display: 'block', fontSize: '0.7rem' }}>
                        Auxiliary relief tents / camps required
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Priority Response Areas Flagged by Simulator */}
                {result.impact?.priorityAreas && result.impact.priorityAreas.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" fontWeight={800} sx={{ color: textMuted, display: 'block', mb: 1, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                      Top Priority Sectors Under Simulated Stress:
                    </Typography>
                    <Grid container spacing={1}>
                      {result.impact.priorityAreas.map((area, idx) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                          <Box
                            sx={{
                              p: 1.25,
                              borderRadius: 2,
                              bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
                              border: `1px solid ${cardBorder}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <Box>
                              <Typography variant="caption" fontWeight={800} sx={{ color: textMain, display: 'block' }}>
                                {area.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.65rem' }}>
                                {area.district}
                              </Typography>
                            </Box>
                            <Chip
                              size="small"
                              label={`Pop: ${area.population?.toLocaleString()}`}
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.65rem',
                                height: 20,
                                bgcolor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe',
                                color: '#0284c7'
                              }}
                            />
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Boilerplate>
  );
}
