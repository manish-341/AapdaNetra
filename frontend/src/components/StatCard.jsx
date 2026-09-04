import React, { useState, useEffect, useRef } from 'react';
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
    sparkline: '#f43f5e',
  },
  emerald: {
    accent: '#10b981',
    glow: 'rgba(16, 185, 129, 0.25)',
    gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    border: 'rgba(16, 185, 129, 0.3)',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    badgeText: '#059669',
    ambient: 'radial-gradient(circle at 90% 10%, rgba(16, 185, 129, 0.15) 0%, transparent 60%)',
    sparkline: '#10b981',
  },
  amber: {
    accent: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.25)',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    border: 'rgba(245, 158, 11, 0.3)',
    badgeBg: 'rgba(245, 158, 11, 0.12)',
    badgeText: '#d97706',
    ambient: 'radial-gradient(circle at 90% 10%, rgba(245, 158, 11, 0.15) 0%, transparent 60%)',
    sparkline: '#f59e0b',
  },
  cyan: {
    accent: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.25)',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
    border: 'rgba(56, 189, 248, 0.3)',
    badgeBg: 'rgba(56, 189, 248, 0.12)',
    badgeText: '#0284c7',
    ambient: 'radial-gradient(circle at 90% 10%, rgba(56, 189, 248, 0.15) 0%, transparent 60%)',
    sparkline: '#38bdf8',
  },
  purple: {
    accent: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.25)',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
    border: 'rgba(168, 85, 247, 0.3)',
    badgeBg: 'rgba(168, 85, 247, 0.12)',
    badgeText: '#7e22ce',
    ambient: 'radial-gradient(circle at 90% 10%, rgba(168, 85, 247, 0.15) 0%, transparent 60%)',
    sparkline: '#a855f7',
  },
};

/* Tiny inline sparkline drawn via SVG */
function MiniSparkline({ color, data }) {
  const pts = data || [30, 50, 35, 65, 45, 70, 55, 80, 60, 75];
  const max = Math.max(...pts);
  const min = Math.min(...pts);
  const h = 28;
  const w = 80;
  const range = max - min || 1;
  const points = pts
    .map((v, i) => `${(i / (pts.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block', opacity: 0.6 }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* Animated counting number */
function AnimatedNumber({ value, duration = 1200 }) {
  const [display, setDisplay] = useState('0');
  const frameRef = useRef(null);

  useEffect(() => {
    // If value has non-numeric chars (like "18/20" or "62,730"), just set it immediately
    const numericStr = String(value).replace(/,/g, '');
    if (/\//.test(String(value))) {
      // Fraction like "18/20"
      setDisplay(String(value));
      return;
    }
    const target = parseInt(numericStr, 10);
    if (isNaN(target)) {
      setDisplay(String(value));
      return;
    }

    let start = 0;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      setDisplay(current.toLocaleString());
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return <>{display}</>;
}

export default function StatCard({
  title,
  value,
  change,
  subtext,
  telemetry,
  icon: Icon,
  colorScheme = 'cyan',
  sparkData,
  onClick,
}) {
  const scheme = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.cyan;
  const { isDark } = useThemeMode();
  const [hovered, setHovered] = useState(false);

  return (
    <Card
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      sx={{
        borderRadius: 4,
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        background: isDark
          ? `linear-gradient(145deg, rgba(20, 30, 52, 0.75) 0%, rgba(11, 18, 33, 0.9) 100%), ${scheme.ambient}`
          : `linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)`,
        backdropFilter: 'blur(16px)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(226, 232, 240, 0.9)',
        boxShadow: isDark
          ? '0 8px 24px -4px rgba(0, 0, 0, 0.45)'
          : '0 4px 18px -2px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: hovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
        borderColor: hovered ? scheme.border : undefined,
        '&:hover': {
          boxShadow: isDark
            ? `0 20px 40px -8px rgba(0, 0, 0, 0.6), 0 0 30px ${scheme.glow}`
            : `0 16px 32px -8px rgba(0, 0, 0, 0.1), 0 0 20px ${scheme.glow}`,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: scheme.gradient,
          transition: 'height 0.3s ease',
        },
        '&:hover::before': {
          height: 4,
        },
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        {/* Header row: title + icon */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Typography
            variant="body2"
            sx={{
              color: isDark ? '#94a3b8' : '#64748b',
              fontWeight: 700,
              fontSize: '0.72rem',
              letterSpacing: '0.05em',
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
                boxShadow: `0 6px 18px ${scheme.glow}`,
                flexShrink: 0,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                transform: hovered ? 'rotate(-8deg) scale(1.1)' : 'rotate(0) scale(1)',
              }}
            >
              <Icon sx={{ fontSize: 21 }} />
            </Box>
          )}
        </Box>

        {/* Value row with animated number + sparkline */}
        <Box display="flex" alignItems="flex-end" justifyContent="space-between" mb={1.2}>
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{
              color: isDark ? '#f8fafc' : '#0f172a',
              letterSpacing: '-0.03em',
              lineHeight: 1,
              fontSize: '2rem',
            }}
          >
            <AnimatedNumber value={value} />
          </Typography>
          <MiniSparkline color={scheme.sparkline} data={sparkData} />
        </Box>

        {/* Badge row */}
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} flexWrap="nowrap" overflow="hidden">
          {change && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.6,
                px: 1,
                py: 0.35,
                borderRadius: 1.5,
                backgroundColor: scheme.badgeBg,
                border: `1px solid ${scheme.border}`,
                color: isDark ? scheme.accent : scheme.badgeText,
                fontSize: '0.72rem',
                fontWeight: 800,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: scheme.accent,
                  flexShrink: 0,
                  animation: 'pulse-dot 2s infinite',
                  '@keyframes pulse-dot': {
                    '0%': { boxShadow: `0 0 0 0 ${scheme.glow}` },
                    '70%': { boxShadow: `0 0 0 6px transparent` },
                    '100%': { boxShadow: `0 0 0 0 transparent` },
                  },
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
                overflow: 'hidden',
              }}
            >
              {subtext}
            </Typography>
          )}
        </Box>

        {/* Telemetry footer - slides in on hover */}
        {telemetry && (
          <Box
            sx={{
              mt: 1.5,
              pt: 1.2,
              borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid rgba(0, 0, 0, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              opacity: hovered ? 1 : 0.7,
              transform: hovered ? 'translateY(0)' : 'translateY(2px)',
              transition: 'all 0.3s ease',
            }}
          >
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: isDark ? '#94a3b8' : '#64748b',
                fontSize: '0.7rem',
                fontWeight: 600,
              }}
            >
              {telemetry.label}
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: telemetry.highlight ? scheme.accent : (isDark ? '#e2e8f0' : '#1e293b'),
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              {telemetry.value}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}