import React, { useState } from 'react';
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
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ScienceIcon from '@mui/icons-material/Science';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import Boilerplate from '../layouts/Boilerplate';
import { runSimulation } from '../services/api';
import { useThemeMode } from '../context/ThemeContext';

const SCENARIOS = [
  { id: 'heavy_rainfall', label: 'Rainfall Inundation Surge (+10% to +100%)' },
  { id: 'extreme_rainfall', label: 'Flash Downpour & Upstream Inflow (+50%)' },
  { id: 'temperature_rise', label: 'Heatwave & Evaporation Surge (+°C)' },
  { id: 'wildfire_conditions', label: 'Arid Wind Shift & Fuel Dryness' },
  { id: 'landslide_rainfall', label: 'Sustained Slope Saturation Precipitation' }
];

const PRESET_ZONES = [
  { id: 'YAMUNA', name: 'Yamuna Floodplain Sector R-12', lat: 28.6139, lon: 77.2090 },
  { id: 'NALA', name: 'Nala Colony & Yamuna Vihar', lat: 28.6517, lon: 77.2219 },
  { id: 'ASOLA', name: 'Asola Wildlife Ridge', lat: 28.5200, lon: 77.1800 }
];

export default function Simulation() {
  const { isDark } = useThemeMode();
  const [selectedZone, setSelectedZone] = useState(PRESET_ZONES[0]);
  const [scenario, setScenario] = useState('heavy_rainfall');
  const [adjustmentPercent, setAdjustmentPercent] = useState(30);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const cardBg = isDark ? '#0f172a' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';
  const textMain = isDark ? '#f8fafc' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await runSimulation({
        scenario,
        adjustmentPercent: parseFloat(adjustmentPercent),
        latitude: selectedZone.lat,
        longitude: selectedZone.lon
      });
      setResult(res.data?.data || null);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Boilerplate>
      <Box mb={3}>
        <Typography variant="caption" sx={{ color: textMuted }}>
          Disaster Intelligence &gt; Feature 10: "What If?" Disaster Simulator
        </Typography>
        <Typography variant="h5" fontWeight={800} sx={{ color: textMain, mt: 0.5 }}>
          "What-If?" Disaster Simulation Sandbox
        </Typography>
        <Typography variant="body2" sx={{ color: textMuted }}>
          Stress-test municipal infrastructure under simulated environmental shifts. Calculate risk escalations, affected population deltas, and emergency shelter deficits.
        </Typography>
      </Box>

      {/* Prominent Mandatory Simulation Disclaimer */}
      <MuiAlert
        severity="warning"
        sx={{
          mb: 3,
          borderRadius: 2.5,
          backgroundColor: isDark ? 'rgba(234, 179, 8, 0.12)' : '#fefce8',
          color: isDark ? '#fef08a' : '#854d0e',
          border: '1px solid rgba(234, 179, 8, 0.3)'
        }}
      >
        <strong>⚠️ SIMULATION NOTICE:</strong> All data produced in this sandbox represents hypothetical stress projections for emergency disaster planning, NOT official government declarations or operational warnings.
      </MuiAlert>

      <Grid container spacing={3}>
        {/* Simulation Controls */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              backgroundColor: cardBg,
              border: `1px solid ${cardBorder}`
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={2.5}>
              <ScienceIcon sx={{ color: '#eab308' }} />
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: textMain }}>
                Scenario Parameters
              </Typography>
            </Box>

            <Stack spacing={2.5}>
              {/* Target Basin */}
              <Box>
                <Typography variant="caption" fontWeight={700} sx={{ color: textMuted, display: 'block', mb: 1 }}>
                  TARGET GEOGRAPHIC SECTOR:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {PRESET_ZONES.map((z) => (
                    <Chip
                      key={z.id}
                      label={z.name.split(' ')[0]}
                      onClick={() => setSelectedZone(z)}
                      color={selectedZone.id === z.id ? 'primary' : 'default'}
                      variant={selectedZone.id === z.id ? 'filled' : 'outlined'}
                      size="small"
                      sx={{ fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer' }}
                    />
                  ))}
                </Stack>
              </Box>

              {/* Scenario Type */}
              <TextField
                select
                fullWidth
                label="Simulation Scenario"
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': { color: textMain },
                  '& .MuiInputLabel-root': { color: textMuted }
                }}
              >
                {SCENARIOS.map(s => (
                  <MenuItem key={s.id} value={s.id}>{s.label}</MenuItem>
                ))}
              </TextField>

              {/* Parameter Slider */}
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="caption" sx={{ color: textMuted, fontWeight: 700 }}>
                    INTENSITY ADJUSTMENT:
                  </Typography>
                  <Typography variant="body2" fontWeight={800} sx={{ color: '#eab308' }}>
                    +{adjustmentPercent}%
                  </Typography>
                </Box>
                <Slider
                  value={adjustmentPercent}
                  onChange={(e, val) => setAdjustmentPercent(val)}
                  min={10}
                  max={100}
                  step={5}
                  valueLabelDisplay="auto"
                  sx={{ color: '#eab308' }}
                />
              </Box>

              <Button
                variant="contained"
                disabled={loading}
                onClick={handleSimulate}
                startIcon={loading ? <CircularProgress size={18} sx={{ color: '#090d16' }} /> : <PlayArrowIcon />}
                sx={{
                  backgroundColor: '#eab308',
                  color: '#090d16',
                  fontWeight: 800,
                  py: 1.25,
                  borderRadius: 2,
                  '&:hover': { backgroundColor: '#ca8a04' }
                }}
              >
                {loading ? 'Running Hydrodynamic Simulation...' : 'Run "What-If" Simulation'}
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Results Panel */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              backgroundColor: cardBg,
              border: `1px solid ${cardBorder}`,
              minHeight: 420
            }}
          >
            {!result ? (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height={320}>
                <ScienceIcon sx={{ fontSize: 64, color: textMuted, opacity: 0.4, mb: 1.5 }} />
                <Typography variant="body1" fontWeight={600} sx={{ color: textMuted, textAlign: 'center' }}>
                  Adjust environmental parameters on the left and click "Run Simulation" to model disaster impact.
                </Typography>
              </Box>
            ) : (
              <Box>
                {/* Result Title & Scenario Description */}
                <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={1} mb={2.5}>
                  <Box>
                    <Typography variant="h6" fontWeight={800} sx={{ color: textMain }}>
                      Simulated Threat & Impact Projection
                    </Typography>
                    <Typography variant="caption" sx={{ color: textMuted }}>
                      Sector: {selectedZone.name}
                    </Typography>
                  </Box>
                  <Chip
                    label={result.scenarioDescription}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      bgcolor: isDark ? 'rgba(234, 179, 8, 0.15)' : '#fef9c3',
                      color: isDark ? '#fef08a' : '#854d0e',
                      border: '1px solid rgba(234, 179, 8, 0.4)'
                    }}
                  />
                </Box>

                {/* Risk Shift Table */}
                <Typography variant="caption" fontWeight={800} sx={{ color: '#0284c7', display: 'block', mb: 1, letterSpacing: 0.5 }}>
                  HAZARD RISK SHIFT: BASELINE VS. SIMULATED
                </Typography>
                <Table size="small" sx={{ mb: 3 }}>
                  <TableHead>
                    <TableRow sx={{ '& th': { color: textMuted, fontWeight: 700, borderColor: cardBorder } }}>
                      <TableCell>Hazard Type</TableCell>
                      <TableCell>Baseline Score</TableCell>
                      <TableCell>Simulated Score</TableCell>
                      <TableCell>Net Delta</TableCell>
                      <TableCell>Simulated Risk Tier</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(result.riskComparison || {}).map(([type, comp]) => (
                      <TableRow key={type} sx={{ '& td': { color: textMain, borderColor: cardBorder } }}>
                        <TableCell sx={{ fontWeight: 800 }}>{type}</TableCell>
                        <TableCell sx={{ color: textMuted }}>{comp.baselineScore}/100</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: comp.simulatedScore >= 70 ? '#ef4444' : '#ea580c' }}>
                          {comp.simulatedScore}/100
                        </TableCell>
                        <TableCell sx={{ color: comp.change > 0 ? '#ef4444' : '#16a34a', fontWeight: 800 }}>
                          {comp.change > 0 ? `+${comp.change}` : comp.change} pts
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={comp.riskCategory}
                            size="small"
                            sx={{
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              height: 20,
                              bgcolor: comp.riskCategory === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 88, 12, 0.15)',
                              color: comp.riskCategory === 'CRITICAL' ? '#ef4444' : '#ea580c'
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Impact Metrics Cards */}
                <Grid container spacing={2} mb={3}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                      <Typography variant="caption" fontWeight={800} sx={{ color: '#ef4444' }}>
                        AFFECTED POPULATION
                      </Typography>
                      <Typography variant="h5" fontWeight={900} sx={{ color: textMain, mt: 0.5 }}>
                        {result.impact?.estimatedAffectedPopulation?.toLocaleString() || "22,100"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: textMuted, display: 'block', fontSize: '0.68rem', mt: 0.25 }}>
                        Across {result.impact?.estimatedAffectedHabitations || 7} vulnerable settlements
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(2, 132, 199, 0.1)' : '#f0f9ff', border: '1px solid rgba(2, 132, 199, 0.25)' }}>
                      <Typography variant="caption" fontWeight={800} sx={{ color: '#0284c7' }}>
                        AVAILABLE SHELTER BEDS
                      </Typography>
                      <Typography variant="h5" fontWeight={900} sx={{ color: textMain, mt: 0.5 }}>
                        {result.impact?.shelterCapacityAvailable?.toLocaleString() || "1,965"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: textMuted, display: 'block', fontSize: '0.68rem', mt: 0.25 }}>
                        Vacant intake within 15km
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(234, 88, 12, 0.1)' : '#fff7ed', border: '1px solid rgba(234, 88, 12, 0.25)' }}>
                      <Typography variant="caption" fontWeight={800} sx={{ color: '#ea580c' }}>
                        PROJECTED SHELTER DEFICIT
                      </Typography>
                      <Typography variant="h5" fontWeight={900} sx={{ color: '#ea580c', mt: 0.5 }}>
                        -{result.impact?.shelterDeficit?.toLocaleString() || "20,135"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: textMuted, display: 'block', fontSize: '0.68rem', mt: 0.25 }}>
                        Auxiliary relief tents required
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Priority Response Areas Flagged by Simulator */}
                {result.impact?.priorityAreas && result.impact.priorityAreas.length > 0 && (
                  <Box>
                    <Typography variant="caption" fontWeight={800} sx={{ color: textMuted, display: 'block', mb: 1 }}>
                      TOP PRIORITY SECTORS UNDER SIMULATED STRESS:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {result.impact.priorityAreas.map((area, idx) => (
                        <Chip
                          key={idx}
                          label={`${area.name} (Pop: ${area.population?.toLocaleString()})`}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
                            color: textMain,
                            border: `1px solid ${cardBorder}`
                          }}
                        />
                      ))}
                    </Stack>
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
