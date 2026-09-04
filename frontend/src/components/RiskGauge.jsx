import React from 'react';
import { Box, Typography } from '@mui/material';

const getCategoryColor = (score) => {
  if (score >= 76) return '#ef4444';
  if (score >= 51) return '#f97316';
  if (score >= 26) return '#eab308';
  return '#22c55e';
};

const getCategoryLabel = (score) => {
  if (score >= 76) return 'CRITICAL';
  if (score >= 51) return 'HIGH';
  if (score >= 26) return 'AMBER';
  return 'GREEN';
};

export default function RiskGauge({ score = 0, title = 'Risk Score', subtitle = '' }) {
  const color = getCategoryColor(score);
  const label = getCategoryLabel(score);
  const strokeDashoffset = 283 - (283 * score) / 100;

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
      <Box position="relative" width={140} height={140} display="flex" alignItems="center" justifyContent="center">
        <svg width="140" height="140" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray="283"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <Box position="absolute" textAlign="center">
          <Typography variant="h4" fontWeight="800" sx={{ color, lineHeight: 1 }}>
            {score}
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>
            / 100
          </Typography>
        </Box>
      </Box>

      <Typography variant="caption" sx={{ mt: 1, px: 1.5, py: 0.25, borderRadius: 1, backgroundColor: `${color}20`, color, fontWeight: 700, letterSpacing: 0.5 }}>
        {label}
      </Typography>

      {title && (
        <Typography variant="body2" fontWeight={600} sx={{ color: '#f8fafc', mt: 1 }}>
          {title}
        </Typography>
      )}
      {subtitle && (
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
