import React from 'react';
import { Chip } from '@mui/material';

const COLOR_CONFIG = {
  CRITICAL: { bg: 'rgba(244, 63, 94, 0.15)', text: '#fb7185', border: 'rgba(244, 63, 94, 0.35)', dot: '#f43f5e' },
  HIGH: { bg: 'rgba(249, 115, 22, 0.15)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.35)', dot: '#f97316' },
  RED: { bg: 'rgba(249, 115, 22, 0.15)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.35)', dot: '#f97316' },
  MODERATE: { bg: 'rgba(234, 179, 8, 0.15)', text: '#facc15', border: 'rgba(234, 179, 8, 0.35)', dot: '#eab308' },
  AMBER: { bg: 'rgba(234, 179, 8, 0.15)', text: '#facc15', border: 'rgba(234, 179, 8, 0.35)', dot: '#eab308' },
  LOW: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.35)', dot: '#10b981' },
  GREEN: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.35)', dot: '#10b981' },
  INFO: { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.35)', dot: '#0284c7' },
  IMMEDIATE: { bg: 'rgba(244, 63, 94, 0.15)', text: '#fb7185', border: 'rgba(244, 63, 94, 0.35)', dot: '#f43f5e' },
  SHORT_TERM: { bg: 'rgba(249, 115, 22, 0.15)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.35)', dot: '#f97316' },
  MEDIUM_TERM: { bg: 'rgba(234, 179, 8, 0.15)', text: '#facc15', border: 'rgba(234, 179, 8, 0.35)', dot: '#eab308' },
  MONITOR: { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.35)', dot: '#0284c7' },
  COMPLETED: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.35)', dot: '#10b981' },
  'IN PROGRESS': { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.35)', dot: '#a855f7' },
};

export default function RiskBadge({ level = 'INFO' }) {
  const key = String(level).toUpperCase();
  const config = COLOR_CONFIG[key] || COLOR_CONFIG.INFO;

  return (
    <Chip
      label={level}
      size="small"
      icon={
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: config.dot,
            boxShadow: `0 0 6px ${config.dot}`,
            marginLeft: 8,
          }}
        />
      }
      sx={{
        fontWeight: 700,
        fontSize: '0.74rem',
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        borderRadius: '6px',
        '& .MuiChip-label': {
          px: 1,
        },
      }}
    />
  );
}

