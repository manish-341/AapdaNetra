import React from 'react';
import { Box, Typography, Paper, Chip, Stack } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { useThemeMode } from '../context/ThemeContext';

const getLevelColor = (level) => {
  if (level === 'CRITICAL') return '#ef4444';
  if (level === 'RED' || level === 'HIGH') return '#f97316';
  if (level === 'AMBER' || level === 'MEDIUM') return '#eab308';
  return '#22c55e';
};

export default function ForecastTimeline({
  indicatorName = 'Indicator',
  currentValue = 0,
  unit = '',
  forecasts = [],
  provenance = 'AI PREDICTION — Probabilistic Temporal Forecast',
  disclaimer = 'Projections for +2h, +6h, +12h, and +24h are probabilistic AI predictions, not government declarations.'
}) {
  const { isDark } = useThemeMode();

  const cardBg = isDark ? '#0f172a' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';
  const textMain = isDark ? '#f8fafc' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        backgroundColor: cardBg,
        border: `1px solid ${cardBorder}`,
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.05)'
      }}
    >
      {/* Header with Provenance Badge */}
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={1.5} mb={2.5}>
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <ShieldOutlinedIcon sx={{ color: '#0284c7', fontSize: 20 }} />
            <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase' }}>
              Time-Series Predictive Forecasting Engine (GRU Physics-Guided)
            </Typography>
          </Box>
          <Typography variant="h6" fontWeight={800} sx={{ color: textMain }}>
            {indicatorName} Trajectory: Observed vs. Predictive Horizon
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label="OFFICIAL TELEMETRY (0h)"
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: '0.65rem',
              bgcolor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7',
              color: '#16a34a',
              border: '1px solid rgba(34, 197, 94, 0.3)'
            }}
          />
          <Chip
            label="AI PREDICTION (+2h to +24h)"
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: '0.65rem',
              bgcolor: isDark ? 'rgba(234, 88, 12, 0.15)' : '#ffedd5',
              color: '#ea580c',
              border: '1px solid rgba(234, 88, 12, 0.3)'
            }}
          />
        </Stack>
      </Box>

      {/* 5-Column Horizon Grid: CURRENT, +2 HOURS, +6 HOURS, +12 HOURS, +24 HOURS */}
      <Box
        display="grid"
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(5, 1fr)'
        }}
        gap={2}
        mb={2.5}
      >
        {forecasts.map((f, i) => {
          const color = getLevelColor(f.riskLevel);
          const isCurrent = f.horizon === 'CURRENT' || f.horizonHours === 0;
          const isUp = f.value > currentValue;
          const isSame = f.value === currentValue;

          return (
            <Box
              key={i}
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: isCurrent
                  ? (isDark ? 'rgba(2, 132, 199, 0.1)' : '#f0f9ff')
                  : (isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc'),
                border: isCurrent
                  ? '2px solid #0284c7'
                  : `1px solid ${cardBorder}`,
                textAlign: 'center',
                position: 'relative',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: color,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              {/* Top Horizon Badge */}
              <Box display="flex" alignItems="center" justifyContent="center" gap={0.5} mb={1}>
                <AccessTimeIcon sx={{ fontSize: 14, color: isCurrent ? '#0284c7' : textMuted }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    color: isCurrent ? '#0284c7' : textMain,
                    textTransform: 'uppercase'
                  }}
                >
                  {f.horizon}
                </Typography>
              </Box>

              {/* Timestamp / Time formatted */}
              {f.timeFormatted && (
                <Typography variant="caption" sx={{ color: textMuted, display: 'block', fontSize: '0.65rem', mb: 1 }}>
                  {f.timeFormatted}
                </Typography>
              )}

              {/* Primary Metric */}
              <Box display="flex" alignItems="center" justifyContent="center" gap={0.5} my={1}>
                <Typography variant="h4" fontWeight={900} sx={{ color: textMain, lineHeight: 1 }}>
                  {f.value}
                </Typography>
                <Typography variant="caption" sx={{ color: textMuted, fontWeight: 700 }}>
                  {unit}
                </Typography>
                {!isCurrent && (
                  isSame ? (
                    <RemoveIcon sx={{ color: textMuted, fontSize: 18 }} />
                  ) : isUp ? (
                    <TrendingUpIcon sx={{ color: '#ef4444', fontSize: 20 }} />
                  ) : (
                    <TrendingDownIcon sx={{ color: '#22c55e', fontSize: 20 }} />
                  )
                )}
              </Box>

              {/* Risk Level Badge */}
              <Chip
                label={f.riskLevel}
                size="small"
                sx={{
                  backgroundColor: `${color}18`,
                  color,
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  height: 22,
                  border: `1px solid ${color}40`,
                  my: 0.5
                }}
              />

              {/* Confidence & Model Meta */}
              <Typography variant="caption" display="block" sx={{ color: textMuted, mt: 1, fontSize: '0.68rem' }}>
                Confidence: <strong>{Math.round((f.confidence || 0.8) * 100)}%</strong>
              </Typography>
              <Typography variant="caption" display="block" sx={{ color: isCurrent ? '#0284c7' : '#ea580c', fontSize: '0.62rem', fontWeight: 700, mt: 0.25 }}>
                {isCurrent ? "● Observed Reading" : "▲ Labeled Prediction"}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Footer Legal & Scientific Disclaimer */}
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f1f5f9',
          border: `1px solid ${cardBorder}`
        }}
      >
        <Typography variant="caption" sx={{ color: textMuted, display: 'block', lineHeight: 1.5 }}>
          <strong>Notice & Provenance:</strong> {disclaimer} Model: <code>gru-temporal-v2.1</code> physics-guided hydrodynamic loss function.
        </Typography>
      </Box>
    </Paper>
  );
}
