import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { useThemeMode } from '../context/ThemeContext';

const COLOR_SCHEMES = {
  crimson: {
    accent: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.25)',
    gradient: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
    border: 'rgba(244, 63, 94, 0.3)',
    badgeBg: 'rgba(244, 63, 94, 0.12)',
    badgeText: '#f43f5e',
    ambient: 'radial-gradient(circle at 90% 10%, rgba(244, 63, 94, 0.15) 0%, transparent 60%)',
  },
  emerald: {
    accent: '#10b981',
    glow: 'rgba(16, 185, 129, 0.25)',
    gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    border: 'rgba(16, 185, 129, 0.3)',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    badgeText: '#059669',
    ambient: 'radial-gradient(circle at 90% 10%, rgba(16, 185, 129, 0.15) 0%, transparent 60%)',
  },
  amber: {
    accent: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.25)',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    border: 'rgba(245, 158, 11, 0.3)',
    badgeBg: 'rgba(245, 158, 11, 0.12)',
    badgeText: '#d97706',
    ambient: 'radial-gradient(circle at 90% 10%, rgba(245, 158, 11, 0.15) 0%, transparent 60%)',
  },
  cyan: {
    accent: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.25)',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
    border: 'rgba(56, 189, 248, 0.3)',
    badgeBg: 'rgba(56, 189, 248, 0.12)',
    badgeText: '#0284c7',
    ambient: 'radial-gradient(circle at 90% 10%, rgba(56, 189, 248, 0.15) 0%, transparent 60%)',
  },
  purple: {
    accent: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.25)',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
    border: 'rgba(168, 85, 247, 0.3)',
    badgeBg: 'rgba(168, 85, 247, 0.12)',
    badgeText: '#7e22ce',
    ambient: 'radial-gradient(circle at 90% 10%, rgba(168, 85, 247, 0.15) 0%, transparent 60%)',
  },
};

export default function StatCard({
  title,
  value,
  change,
  subtext,
  icon: Icon,
  colorScheme = 'cyan',
}) {
  const scheme = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.cyan;
  const { isDark } = useThemeMode();

  return (
    <Card
      sx={{
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
        background: isDark
          ? `linear-gradient(145deg, rgba(20, 30, 52, 0.75) 0%, rgba(11, 18, 33, 0.9) 100%), ${scheme.ambient}`
          : `linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)`,
        backdropFilter: 'blur(16px)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(226, 232, 240, 0.9)',
        boxShadow: isDark
          ? '0 8px 24px -4px rgba(0, 0, 0, 0.45)'
          : '0 4px 18px -2px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: scheme.border,
          boxShadow: isDark
            ? `0 14px 28px -4px rgba(0, 0, 0, 0.5), 0 0 20px ${scheme.glow}`
            : `0 10px 24px -4px rgba(0, 0, 0, 0.08), 0 0 16px ${scheme.glow}`,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: scheme.gradient,
        },
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Typography
            variant="body2"
            sx={{
              color: isDark ? '#94a3b8' : '#64748b',
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </Typography>
          {Icon && (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.5,
                background: scheme.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: `0 4px 14px ${scheme.glow}`,
                flexShrink: 0,
              }}
            >
              <Icon sx={{ fontSize: 22 }} />
            </Box>
          )}
        </Box>

        <Typography
          variant="h4"
          fontWeight={800}
          sx={{
            color: isDark ? '#f8fafc' : '#0f172a',
            letterSpacing: '-0.03em',
            lineHeight: 1.2,
            mb: 1.2,
          }}
        >
          {value}
        </Typography>

        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} flexWrap="nowrap" overflow="hidden">
          {change && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.6,
                px: 1.1,
                py: 0.35,
                borderRadius: 1.5,
                backgroundColor: scheme.badgeBg,
                border: `1px solid ${scheme.border}`,
                color: scheme.badgeText,
                fontSize: '0.72rem',
                fontWeight: 800,
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: scheme.accent,
                  flexShrink: 0
                }}
              />
              {change}
            </Box>
          )}
          {subtext && (
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: isDark ? '#94a3b8' : '#64748b',
                fontSize: '0.72rem',
                fontWeight: 600,
                textOverflow: 'ellipsis',
                overflow: 'hidden'
              }}
            >
              {subtext}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}