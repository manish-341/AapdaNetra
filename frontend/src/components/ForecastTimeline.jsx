import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Stack,
  Grid,
  Divider,
  LinearProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Shield,
  AlertTriangle,
  Activity,
  Zap,
  CheckCircle2,
  Radio,
  BarChart3,
  Info,
  ChevronRight,
  Waves
} from 'lucide-react';
import { useThemeMode } from '../context/ThemeContext';

const getLevelColor = (level) => {
  if (level === 'CRITICAL') return '#ef4444';
  if (level === 'RED' || level === 'HIGH') return '#f97316';
  if (level === 'AMBER' || level === 'MEDIUM') return '#eab308';
  return '#22c55e';
};

const getLevelBg = (level, isDark) => {
  if (level === 'CRITICAL') return isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2';
  if (level === 'RED' || level === 'HIGH') return isDark ? 'rgba(249, 115, 22, 0.15)' : '#ffedd5';
  if (level === 'AMBER' || level === 'MEDIUM') return isDark ? 'rgba(234, 179, 8, 0.15)' : '#fef9c3';
  return isDark ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7';
};

// Tactical Directives by horizon based on indicator and risk
const getTacticalDirective = (horizonHours, value, indicatorName) => {
  const isFlood = /flood/i.test(indicatorName);
  const isRain = /precip|rain/i.test(indicatorName);
  const isTemp = /temp/i.test(indicatorName);

  if (horizonHours === 0) {
    return {
      stage: 'Current Baseline',
      mechanism: 'Live ground sensor telemetry intake',
      directive: 'Maintain continuous radar sync. Monitor baseline drainage culverts and stage early response units.'
    };
  } else if (horizonHours === 2) {
    return {
      stage: 'Initial Inflow Wave',
      mechanism: isFlood ? 'Upstream runoff reaches catchment perimeter' : isRain ? 'Approaching localized storm cloud cell' : 'Solar radiation diurnal peak',
      directive: isFlood ? 'Pre-arm acoustic sirens. Stage mobile de-watering pumps along low-lying polders.' : 'Issue automated SMS weather advisory to low-elevation wards.'
    };
  } else if (horizonHours === 6) {
    return {
      stage: 'Peak Forecast Crest',
      mechanism: isFlood ? 'Maximum river stage elevation & channel surcharge' : isRain ? 'High-density downpour concentration' : 'Peak thermal stress index',
      directive: isFlood ? 'Mandatory evacuation of vulnerable floodplain pockets. Route traffic away from submerged siphons.' : 'Activate community cooling centers and distribute emergency supplies.'
    };
  } else if (horizonHours === 12) {
    return {
      stage: 'Sustained Saturation',
      mechanism: isFlood ? 'Prolonged inundation & soil infiltration saturation' : isRain ? 'Persistent drizzle over saturated substrate' : 'Nighttime cooling transition',
      directive: isFlood ? 'Operate high-capacity outfall sluice gates. Deploy inflatable rescue craft to isolated settlements.' : 'Inspect power substations for ground-water seepage.'
    };
  } else {
    return {
      stage: 'Recession & Clearance',
      mechanism: isFlood ? 'Natural drainage dissipation through primary outfalls' : isRain ? 'Depression cell dissipates' : 'Ambient temperature baseline resets',
      directive: isFlood ? 'Begin water recedence verification. Conduct structural integrity inspections on roadway culverts.' : 'De-escalate institutional alerts to baseline state.'
    };
  }
};

/* Glassmorphic Chart Tooltip */
const CustomForecastTooltip = ({ active, payload, unit, isDark }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const color = getLevelColor(data.riskLevel);
    return (
      <Box
        sx={{
          p: 1.75,
          borderRadius: 2.5,
          bgcolor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1'}`,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          minWidth: 190
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} mb={0.5}>
          <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase' }}>
            {data.name}
          </Typography>
          <Chip
            size="small"
            label={data.isPrediction ? "AI Prediction" : "Observed"}
            sx={{
              fontWeight: 800,
              fontSize: '0.62rem',
              height: 18,
              bgcolor: data.isPrediction ? 'rgba(234, 88, 12, 0.15)' : 'rgba(34, 197, 94, 0.15)',
              color: data.isPrediction ? '#ea580c' : '#16a34a'
            }}
          />
        </Box>

        <Box display="flex" alignItems="baseline" gap={0.5} my={0.5}>
          <Typography variant="h5" fontWeight={900} sx={{ color: color, lineHeight: 1 }}>
            {data.value}
          </Typography>
          <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? '#cbd5e1' : '#475569' }}>
            {unit}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" justifyContent="space-between" mt={1} pt={0.75} borderTop={`1px dashed ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`}>
          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.68rem' }}>
            Risk Severity:
          </Typography>
          <Typography variant="caption" fontWeight={800} sx={{ color }}>
            {data.riskLevel}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" justifyContent="space-between" mt={0.25}>
          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.68rem' }}>
            Model Confidence:
          </Typography>
          <Typography variant="caption" fontWeight={800} sx={{ color: '#0284c7' }}>
            {Math.round(data.confidence * 100)}%
          </Typography>
        </Box>
      </Box>
    );
  }
  return null;
};

export default function ForecastTimeline({
  indicatorName = 'Indicator',
  currentValue = 0,
  unit = '',
  forecasts = [],
  provenance = 'AI PREDICTION — Probabilistic Temporal Forecast',
  disclaimer = 'Projections for +2h, +6h, +12h, and +24h are probabilistic AI predictions, not government declarations.',
  selectedLocation = null
}) {
  const { isDark } = useThemeMode();
  const [selectedHorizonIndex, setSelectedHorizonIndex] = useState(2); // Default to +6h Peak

  const cardBg = isDark ? '#0f172a' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';
  const textMain = isDark ? '#f8fafc' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';

  // Format chart dataset
  const chartData = forecasts.map((f) => ({
    name: f.horizon === 'CURRENT' ? '0h (Live)' : f.horizon.replace('HOURS', 'h').replace('HOUR', 'h'),
    shortName: f.horizon === 'CURRENT' ? '0h Live' : f.horizon.replace('HOURS', 'h').replace('HOUR', 'h').trim(),
    value: Number(f.value),
    confidence: f.confidence || 0.85,
    riskLevel: f.riskLevel,
    isPrediction: f.isPrediction,
    horizonHours: f.horizonHours
  }));

  // Find peak forecast value and horizon
  const peakForecast = forecasts.reduce((max, f) => (f.value > max.value ? f : max), forecasts[0] || { value: 0 });
  const activeSelectedHorizon = forecasts[selectedHorizonIndex] || forecasts[0];
  const activeDirective = getTacticalDirective(activeSelectedHorizon?.horizonHours || 0, activeSelectedHorizon?.value || 0, indicatorName);

  // Determine chart theme colors based on peak risk
  const isCriticalPeak = peakForecast.value >= 75 || peakForecast.riskLevel === 'CRITICAL';
  const chartStroke = isCriticalPeak ? '#ea580c' : '#0284c7';
  const chartGradientStart = isCriticalPeak ? '#ea580c' : '#0284c7';
  const thresholdVal = indicatorName.includes('/100') ? 70 : indicatorName.includes('mm') ? 35 : 40;

  return (
    <Stack spacing={3}>
      {/* 1. VISUAL TIME-SERIES TRAJECTORY GRAPH CARD */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3 },
          borderRadius: 3,
          backgroundColor: cardBg,
          border: `1px solid ${cardBorder}`,
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.04)'
        }}
      >
        {/* Header with Title & Legend Chips */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2,
            mb: 2.5
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <BarChart3 size={20} color="#0284c7" />
              <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                Hydrodynamic Sequence Curve (+0h to +24h)
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: textMain, letterSpacing: -0.3 }}>
              {indicatorName} Trajectory: Observed vs. Predictive Horizon
            </Typography>
            <Typography variant="caption" sx={{ color: textMuted }}>
              Tracking projected volume progression across {selectedLocation?.name || 'basin'}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
            <Chip
              icon={<Radio size={12} color="#16a34a" />}
              label="Live Telemetry (0h)"
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: '0.68rem',
                bgcolor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7',
                color: '#16a34a',
                border: '1px solid rgba(34, 197, 94, 0.3)'
              }}
            />
            <Chip
              icon={<Zap size={12} color="#ea580c" />}
              label="AI Projected Crest (+2h to +24h)"
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: '0.68rem',
                bgcolor: isDark ? 'rgba(234, 88, 12, 0.15)' : '#ffedd5',
                color: '#ea580c',
                border: '1px solid rgba(234, 88, 12, 0.3)'
              }}
            />
          </Stack>
        </Box>

        {/* The Recharts Area Graph */}
        <Box sx={{ width: '100%', height: 270, mt: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 15, right: 25, left: -15, bottom: 5 }}>
              <defs>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartGradientStart} stopOpacity={isDark ? 0.45 : 0.25} />
                  <stop offset="95%" stopColor={chartGradientStart} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'} vertical={false} />

              <XAxis
                dataKey="shortName"
                tick={{ fill: textMuted, fontSize: 11, fontWeight: 600 }}
                axisLine={{ stroke: cardBorder }}
                tickLine={false}
              />

              <YAxis
                domain={[0, 'auto']}
                tick={{ fill: textMuted, fontSize: 11, fontWeight: 600 }}
                axisLine={{ stroke: cardBorder }}
                tickLine={false}
              />

              <RechartsTooltip content={<CustomForecastTooltip unit={unit} isDark={isDark} />} />

              {/* Threshold Warning Line */}
              <ReferenceLine
                y={thresholdVal}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: 'Critical Threshold',
                  position: 'insideTopRight',
                  fill: '#ef4444',
                  fontSize: 11,
                  fontWeight: 700
                }}
              />

              <Area
                type="monotone"
                dataKey="value"
                stroke={chartStroke}
                strokeWidth={3}
                fill="url(#forecastGrad)"
                activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2, fill: chartStroke }}
                dot={{ r: 4, stroke: chartStroke, strokeWidth: 2, fill: isDark ? '#0f172a' : '#ffffff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>

        {/* Quick Legend & Crest Timing Banner */}
        <Box
          sx={{
            mt: 2,
            pt: 1.5,
            borderTop: `1px solid ${cardBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <AlertTriangle size={15} color="#ea580c" />
            <Typography variant="caption" fontWeight={700} sx={{ color: textMain }}>
              Peak Anticipated Crest: <strong>{peakForecast?.value} {unit}</strong> at <strong>{peakForecast?.horizon}</strong> ({peakForecast?.timeFormatted})
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.72rem' }}>
            Sequence GRU recalibrates every 15 minutes with Doppler Radar & Gauge telemetry.
          </Typography>
        </Box>
      </Paper>

      {/* 2. FIVE-HORIZON INTERACTIVE PROGRESSION CARDS */}
      <Box sx={{ mt: 0.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={800} sx={{ color: textMain }}>
            5-Horizon Temporal Step Progression (Click a card to inspect directives):
          </Typography>
          <Typography variant="caption" sx={{ color: textMuted }}>
            Target: <strong>{selectedLocation?.name}</strong>
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {forecasts.map((f, i) => {
            const color = getLevelColor(f.riskLevel);
            const bg = getLevelBg(f.riskLevel, isDark);
            const isCurrent = f.horizon === 'CURRENT' || f.horizonHours === 0;
            const isSelected = selectedHorizonIndex === i;
            const isPeak = f.value === peakForecast.value;

            // Delta vs baseline
            const delta = currentValue > 0 ? Math.round(((f.value - currentValue) / currentValue) * 100) : 0;
            const isUp = delta > 0;
            const isDown = delta < 0;

            return (
              <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={i}>
                <Box
                  onClick={() => setSelectedHorizonIndex(i)}
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: isSelected
                      ? (isDark ? 'rgba(2, 132, 199, 0.12)' : '#f0f9ff')
                      : (isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc'),
                    border: '1px solid',
                    borderColor: isSelected
                      ? '#0284c7'
                      : isPeak
                      ? '#ea580c'
                      : cardBorder,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.18s ease',
                    boxShadow: isSelected ? '0 4px 14px rgba(2, 132, 199, 0.15)' : 'none',
                    '&:hover': {
                      borderColor: '#0284c7',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  {/* Top Badge: Horizon + Peak Indicator */}
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Clock size={13} color={isCurrent ? '#16a34a' : isPeak ? '#ea580c' : '#0284c7'} />
                      <Typography
                        variant="caption"
                        fontWeight={800}
                        sx={{
                          fontSize: '0.72rem',
                          color: isCurrent ? '#16a34a' : textMain,
                          textTransform: 'uppercase'
                        }}
                      >
                        {f.horizon}
                      </Typography>
                    </Box>

                    {isPeak && (
                      <Chip
                        label="PEAK"
                        size="small"
                        sx={{
                          fontWeight: 900,
                          fontSize: '0.58rem',
                          height: 16,
                          bgcolor: '#ea580c',
                          color: '#ffffff'
                        }}
                      />
                    )}
                  </Box>

                  {/* Subtitle / Timestamp */}
                  <Typography variant="caption" sx={{ color: textMuted, display: 'block', fontSize: '0.66rem', mb: 1 }}>
                    {f.timeFormatted || (isCurrent ? 'Current Reading' : `+${f.horizonHours}h Window`)}
                  </Typography>

                  {/* Primary Large Metric */}
                  <Box display="flex" alignItems="baseline" gap={0.5} my={0.5}>
                    <Typography variant="h4" fontWeight={900} sx={{ color: color, lineHeight: 1 }}>
                      {f.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: textMuted, fontWeight: 700, fontSize: '0.75rem' }}>
                      {unit}
                    </Typography>
                  </Box>

                  {/* Delta & Risk pill */}
                  <Box display="flex" alignItems="center" justifyContent="space-between" gap={0.5} mt={1}>
                    <Chip
                      label={f.riskLevel}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.62rem',
                        height: 20,
                        bgcolor: bg,
                        color: color,
                        border: `1px solid ${color}35`
                      }}
                    />

                    {!isCurrent && (
                      <Box display="flex" alignItems="center" gap={0.25}>
                        {isUp ? (
                          <TrendingUp size={13} color="#ef4444" />
                        ) : isDown ? (
                          <TrendingDown size={13} color="#16a34a" />
                        ) : null}
                        <Typography
                          variant="caption"
                          fontWeight={800}
                          sx={{
                            fontSize: '0.65rem',
                            color: isUp ? '#ef4444' : isDown ? '#16a34a' : textMuted
                          }}
                        >
                          {delta > 0 ? `+${delta}%` : delta < 0 ? `${delta}%` : 'Stable'}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Confidence progress micro-bar */}
                  <Box mt={1.25} pt={1} borderTop={`1px dashed ${cardBorder}`}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.25}>
                      <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.62rem' }}>
                        Confidence
                      </Typography>
                      <Typography variant="caption" fontWeight={800} sx={{ color: '#0284c7', fontSize: '0.65rem' }}>
                        {Math.round((f.confidence || 0.8) * 100)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(f.confidence || 0.8) * 100}
                      sx={{
                        height: 3,
                        borderRadius: 2,
                        bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0',
                        '& .MuiLinearProgress-bar': { bgcolor: '#0284c7' }
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* 3. INCIDENT COMMANDER OPERATIONAL PLAYBOOK (Selected Horizon Directive) */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          backgroundColor: cardBg,
          border: `1px solid ${cardBorder}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Shield size={18} color="#0284c7" />
            <Typography variant="subtitle1" fontWeight={800} sx={{ color: textMain }}>
              Tactical Operational Directive: {activeSelectedHorizon?.horizon} ({activeSelectedHorizon?.timeFormatted})
            </Typography>
          </Box>
          <Chip
            size="small"
            icon={<Radio size={12} color="#0284c7" />}
            label={`Active Inspection: ${activeSelectedHorizon?.horizon}`}
            sx={{
              fontWeight: 800,
              fontSize: '0.68rem',
              bgcolor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe',
              color: '#0284c7'
            }}
          />
        </Box>

        <Grid container spacing={2}>
          {/* Box 1: Hydrologic Mechanism */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
                border: `1px solid ${cardBorder}`,
                height: '100%'
              }}
            >
              <Typography variant="caption" fontWeight={800} sx={{ color: textMuted, display: 'block', mb: 0.5, textTransform: 'uppercase' }}>
                Hydrodynamic Physical Trigger:
              </Typography>
              <Typography variant="subtitle2" fontWeight={800} sx={{ color: textMain, mb: 0.5 }}>
                {activeDirective.stage}
              </Typography>
              <Typography variant="body2" sx={{ color: textMuted, lineHeight: 1.5, fontSize: '0.82rem' }}>
                {activeDirective.mechanism} across {selectedLocation?.terrain?.toLowerCase() || 'the catchment basin'}.
              </Typography>
            </Box>
          </Grid>

          {/* Box 2: Concrete Action Required by SDRF / Authorities */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: isDark ? 'rgba(2, 132, 199, 0.08)' : '#f0f9ff',
                border: '1px solid',
                borderColor: isDark ? 'rgba(2, 132, 199, 0.25)' : '#bae6fd',
                height: '100%'
              }}
            >
              <Typography variant="caption" fontWeight={800} sx={{ color: '#0284c7', display: 'block', mb: 0.5, textTransform: 'uppercase' }}>
                Incident Commander SOP Directive:
              </Typography>
              <Box display="flex" alignItems="flex-start" gap={1}>
                <CheckCircle2 size={18} color="#16a34a" style={{ marginTop: 2, flexShrink: 0 }} />
                <Typography variant="body2" fontWeight={700} sx={{ color: textMain, lineHeight: 1.5, fontSize: '0.88rem' }}>
                  {activeDirective.directive}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 4. FOOTER NOTICE & PROVENANCE */}
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f1f5f9',
          border: `1px solid ${cardBorder}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1.25
        }}
      >
        <Info size={18} color="#0284c7" style={{ flexShrink: 0 }} />
        <Typography variant="caption" sx={{ color: textMuted, lineHeight: 1.5, fontSize: '0.75rem' }}>
          <strong>Notice & Provenance:</strong> {disclaimer} Physics-guided hydrodynamic model version: <code>gru-temporal-v2.2</code> with Saint-Venant hydraulic conservation constraints.
        </Typography>
      </Box>
    </Stack>
  );
}
