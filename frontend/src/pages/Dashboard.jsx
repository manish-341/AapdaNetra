import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Typography, Paper, Box, Button, CircularProgress, Stack, IconButton,
  LinearProgress, Fade, Grow, Slide
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Boilerplate from '../layouts/Boilerplate';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';
import { getDashboardStats } from '../services/api';
import { getCurrentUser } from '../lib/auth';
import { useThemeMode } from '../context/ThemeContext';
import { useLocationContext } from '../context/LocationContext';
import {
  ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, RadialBarChart, RadialBar, Legend
} from 'recharts';

const formatAlertLocation = (loc) => {
  if (!loc) return null;
  if (typeof loc === 'string') return loc;
  if (typeof loc === 'object' && loc.coordinates && Array.isArray(loc.coordinates)) {
    const [lon, lat] = loc.coordinates;
    return `${Number(lat).toFixed(4)}°N, ${Number(lon).toFixed(4)}°E`;
  }
  return null;
};

const formatAlertTime = (alert) => {
  if (alert.time) return alert.time;
  if (alert.createdAt) {
    try {
      const d = new Date(alert.createdAt);
      return !isNaN(d.getTime()) ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
    } catch {
      return null;
    }
  }
  return null;
};

/* Animated progress ring for the risk gauge */
function RiskGaugeRing({ score, maxScore = 100, color, size = 120 }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      const pct = score / maxScore;
      setOffset(circumference - pct * circumference);
    }, 300);
    return () => clearTimeout(timer);
  }, [score, maxScore, circumference]);

  return (
    <Box position="relative" display="inline-flex" alignItems="center" justifyContent="center">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <Box
        position="absolute"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
      >
        <Typography variant="h5" fontWeight={900} sx={{ color, lineHeight: 1, fontSize: '1.5rem' }}>
          {score}
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem', fontWeight: 600 }}>
          / {maxScore}
        </Typography>
      </Box>
    </Box>
  );
}

/* Animated timestamp with pulsing dot */
function LiveTimestamp() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <Box display="flex" alignItems="center" gap={0.8}>
      <FiberManualRecordIcon sx={{ fontSize: 8, color: '#10b981', animation: 'pulse-dot-green 2s infinite',
        '@keyframes pulse-dot-green': {
          '0%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.4, transform: 'scale(1.3)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        }
      }} />
      <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', fontWeight: 600 }}>
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </Typography>
    </Box>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { isDark } = useThemeMode();
  const { location } = useLocationContext();
  const user = getCurrentUser() || { name: 'Officer', role: 'DISTRICT_OFFICER', district: 'Delhi' };
  const isAdmin = ["ADMIN", "ADMINISTRATOR"].includes(user?.role);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    getDashboardStats()
      .then(res => setStats(res.data?.data || null))
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        setTimeout(() => setMounted(true), 100);
      });
  }, []);

  const pieData = [
    { name: 'Critical', value: stats?.riskDistribution?.CRITICAL || 2, color: '#f43f5e', lightColor: '#fb7185' },
    { name: 'High Risk', value: stats?.riskDistribution?.RED || 4, color: '#f97316', lightColor: '#fb923c' },
    { name: 'Moderate', value: stats?.riskDistribution?.AMBER || 2, color: '#eab308', lightColor: '#fde047' },
    { name: 'Low Risk', value: stats?.riskDistribution?.GREEN || 2, color: '#10b981', lightColor: '#34d399' }
  ];

  const totalHabitations = pieData.reduce((acc, curr) => acc + curr.value, 0);

  const mockTrend = [
    { time: '00:00', risk: 42, baseline: 35 },
    { time: '04:00', risk: 48, baseline: 36 },
    { time: '08:00', risk: 65, baseline: 38 },
    { time: '12:00', risk: 84, baseline: 40 },
    { time: '16:00', risk: 78, baseline: 39 },
    { time: '20:00', risk: 70, baseline: 37 },
    { time: 'Now', risk: 68, baseline: 36 },
  ];

  const hourlyActivity = [
    { hour: '6AM', alerts: 2, reports: 4 },
    { hour: '9AM', alerts: 5, reports: 8 },
    { hour: '12PM', alerts: 8, reports: 12 },
    { hour: '3PM', alerts: 6, reports: 9 },
    { hour: '6PM', alerts: 4, reports: 7 },
    { hour: '9PM', alerts: 3, reports: 5 },
  ];

  const displayAlerts = stats?.recentAlerts && stats.recentAlerts.length > 0
    ? stats.recentAlerts
    : [
        {
          _id: 'alt-1',
          title: 'Yamuna Water Level Warning Threshold Exceeded',
          message: 'Old Railway Bridge gauge reading reached 205.85m (Warning: 205.33m).',
          severity: 'CRITICAL',
          time: '12m ago',
          location: 'Yamuna Bank, Sector 15'
        },
        {
          _id: 'alt-2',
          title: 'Heavy Inflow Forecast in North Drainage Basin',
          message: 'Hathnikund barrage outflow increased to 1,42,000 cusecs.',
          severity: 'HIGH',
          time: '34m ago',
          location: 'North Delhi Basin'
        },
        {
          _id: 'alt-3',
          title: 'Relocation Shelters Operational Readiness',
          message: 'Emergency food, potable water, and medical kits stocked. 120 beds ready.',
          severity: 'INFO',
          time: '1h ago',
          location: 'Civil Lines Relief Camp'
        }
      ];

  const primaryText = isDark ? '#f8fafc' : '#0f172a';
  const secondaryText = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark
    ? 'linear-gradient(145deg, rgba(17, 26, 46, 0.85) 0%, rgba(10, 16, 30, 0.92) 100%)'
    : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)';
  const cardBorder = isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(226, 232, 240, 0.9)';

  const glassCard = {
    background: cardBg,
    backdropFilter: 'blur(16px)',
    border: cardBorder,
    borderRadius: 4,
    boxShadow: isDark ? '0 8px 32px -4px rgba(0, 0, 0, 0.5)' : '0 4px 24px -4px rgba(0, 0, 0, 0.06)',
    transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
    '&:hover': {
      boxShadow: isDark
        ? '0 16px 48px -4px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.08)'
        : '0 12px 36px -4px rgba(0, 0, 0, 0.09)',
      transform: 'translateY(-2px)',
    },
  };

  if (loading) {
    return (
      <Boilerplate>
        <Box display="flex" justifyContent="center" alignItems="center" py={16} flexDirection="column" gap={2}>
          <CircularProgress sx={{ color: isDark ? '#38bdf8' : '#0284c7' }} size={48} thickness={4} />
          <Typography variant="body2" sx={{ color: secondaryText, fontWeight: 600 }}>Loading situational intelligence…</Typography>
        </Box>
      </Boilerplate>
    );
  }

  return (
    <Boilerplate>
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SECTION 1: Executive Header                               */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Fade in={mounted} timeout={600}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            mb: 4,
            pb: 3,
            borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={0.8}>
              <Box
                sx={{
                  width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981',
                  animation: 'pulse-dot-green 2s infinite',
                  '@keyframes pulse-dot-green': {
                    '0%': { opacity: 1, transform: 'scale(1)' },
                    '50%': { opacity: 0.4, transform: 'scale(1.4)' },
                    '100%': { opacity: 1, transform: 'scale(1)' },
                  },
                  boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)',
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: isDark ? '#38bdf8' : '#0284c7',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontSize: '0.68rem',
                }}
              >
                Live Command Center • Real-Time AI Telemetry
              </Typography>
            </Box>
            <Typography
              variant="h4"
              fontWeight={900}
              sx={{
                background: isDark
                  ? 'linear-gradient(90deg, #ffffff 0%, #cbd5e1 40%, #38bdf8 100%)'
                  : 'linear-gradient(90deg, #0f172a 0%, #1e293b 40%, #0284c7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
                fontSize: { xs: '1.4rem', sm: '1.7rem', md: '2rem' },
                lineHeight: 1.2,
              }}
            >
              Crisis Decision Cockpit
            </Typography>
            <Typography variant="body2" sx={{ color: secondaryText, mt: 0.5 }}>
              Welcome back, <strong style={{ color: primaryText }}>{user.name}</strong> • Monitoring{' '}
              <span style={{ color: isDark ? '#38bdf8' : '#0284c7', fontWeight: 700 }}>{location?.name || location?.district || 'Delhi'}</span>
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            <LiveTimestamp />
            <Button
              variant="contained"
              startIcon={<MapOutlinedIcon sx={{ fontSize: 17 }} />}
              onClick={() => navigate('/disaster-map')}
              sx={{
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.3)',
                fontWeight: 700,
                fontSize: '0.8rem',
                px: 2.5,
                py: 0.9,
                borderRadius: 2.5,
                textTransform: 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%)',
                  boxShadow: '0 8px 24px rgba(37, 99, 235, 0.45)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Live Map
            </Button>
          </Box>
        </Box>
      </Fade>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SECTION 2: KPI Stat Cards — 4 Column Grid                */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {[
          {
            title: 'Active Alerts',
            value: stats?.alerts?.total || displayAlerts.length,
            change: `${stats?.alerts?.critical || 1} Critical`,
            subtext: 'Live feeds',
            icon: WarningAmberIcon,
            colorScheme: 'crimson',
            spark: [5, 8, 6, 11, 9, 14, 11],
            telemetry: { label: '🌊 Yamuna Gauge', value: '205.85m (+0.52m)', highlight: true },
          },
          {
            title: 'Shelters Ready',
            value: stats?.shelters?.total ? `${stats.shelters.available}/${stats.shelters.total}` : '18/20',
            change: `${stats?.shelters?.occupied || 1740} Occupied`,
            subtext: 'Intake capacity',
            icon: HomeWorkOutlinedIcon,
            colorScheme: 'emerald',
            spark: [14, 15, 16, 18, 17, 18, 18],
            telemetry: { label: '⛺ Readiness', value: '88% Operational', highlight: false },
          },
          {
            title: 'Population at Risk',
            value: stats?.populationAtRisk ? stats.populationAtRisk.toLocaleString() : '62,730',
            change: 'Threat ≥ 60',
            subtext: 'Floodplain wards',
            icon: PeopleAltOutlinedIcon,
            colorScheme: 'amber',
            spark: [50, 55, 58, 62, 60, 63, 62],
            telemetry: { label: '🛡️ Sectors', value: '6 Active (2 Critical)', highlight: true },
          },
          {
            title: 'Reports (24h)',
            value: stats?.reports?.last24h || 9,
            change: `${stats?.reports?.verified || 4} Verified`,
            subtext: 'NLP classified',
            icon: BoltOutlinedIcon,
            colorScheme: 'cyan',
            spark: [3, 5, 4, 7, 6, 8, 9],
            telemetry: { label: '🌧️ Rainfall', value: '68.4mm Heavy', highlight: false },
          },
        ].map((card, idx) => (
          <Grid key={idx} size={{ xs: 12, sm: 6, md: 3 }}>
            <Grow in={mounted} timeout={400 + idx * 150}>
              <Box>
                <StatCard
                  title={card.title}
                  value={card.value}
                  change={card.change}
                  subtext={card.subtext}
                  icon={card.icon}
                  colorScheme={card.colorScheme}
                  sparkData={card.spark}
                  telemetry={card.telemetry}
                />
              </Box>
            </Grow>
          </Grid>
        ))}
      </Grid>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SECTION 3: Two-Column Analytics — Risk Distribution + Trend */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* LEFT: Risk Distribution Donut */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Grow in={mounted} timeout={900}>
            <Paper sx={{ ...glassCard, p: 3, height: '100%' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
                <Box display="flex" alignItems="center" gap={1.2}>
                  <Box
                    sx={{
                      width: 36, height: 36, borderRadius: 2.5,
                      background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', boxShadow: '0 4px 14px rgba(168, 85, 247, 0.35)',
                    }}
                  >
                    <ShieldOutlinedIcon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: primaryText, lineHeight: 1.2 }}>
                      Risk Distribution
                    </Typography>
                    <Typography variant="caption" sx={{ color: secondaryText, fontSize: '0.7rem' }}>
                      ML vulnerability index
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    px: 1.2, py: 0.4, borderRadius: 1.5,
                    bgcolor: 'rgba(168, 85, 247, 0.12)',
                    border: '1px solid rgba(168, 85, 247, 0.25)',
                    color: isDark ? '#c084fc' : '#7e22ce',
                    fontSize: '0.7rem', fontWeight: 700,
                  }}
                >
                  {totalHabitations} Zones
                </Box>
              </Box>

              {/* Donut + Legend side by side */}
              <Box display="flex" alignItems="center" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                <Box height={200} width={200} position="relative" flexShrink={0} mx="auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                        animationBegin={400}
                        animationDuration={1200}
                        animationEasing="ease-out"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : '#ffffff',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
                          borderRadius: '12px', color: primaryText,
                          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box
                    position="absolute"
                    top="50%" left="50%"
                    sx={{ transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}
                  >
                    <Typography variant="h4" fontWeight={900} sx={{ color: primaryText, lineHeight: 1 }}>
                      {totalHabitations}
                    </Typography>
                    <Typography variant="caption" sx={{ color: secondaryText, fontSize: '0.65rem', fontWeight: 600 }}>
                      Total Zones
                    </Typography>
                  </Box>
                </Box>

                <Stack spacing={1.2} flex={1} width="100%">
                  {pieData.map((item, idx) => {
                    const pct = Math.round((item.value / totalHabitations) * 100);
                    return (
                      <Box
                        key={idx}
                        sx={{
                          p: 1.2, borderRadius: 2.5,
                          bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                          border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                          transition: 'all 0.25s ease',
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                            borderColor: item.color,
                            transform: 'translateX(4px)',
                          },
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                          <Box display="flex" alignItems="center" gap={0.8}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color, boxShadow: `0 0 8px ${item.color}` }} />
                            <Typography variant="body2" sx={{ color: primaryText, fontWeight: 600, fontSize: '0.78rem' }}>
                              {item.name}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: item.color, fontWeight: 700, fontSize: '0.75rem' }}>
                            {item.value} ({pct}%)
                          </Typography>
                        </Box>
                        <Box sx={{ width: '100%', height: 4, borderRadius: 3, bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                          <Box sx={{
                            width: `${pct}%`, height: '100%', borderRadius: 3,
                            background: `linear-gradient(90deg, ${item.color}, ${item.lightColor})`,
                            transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          }} />
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            </Paper>
          </Grow>
        </Grid>

        {/* RIGHT: 24h Risk Trend with enhanced styling */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Grow in={mounted} timeout={1100}>
            <Paper sx={{ ...glassCard, p: 3, height: '100%' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1.2}>
                  <Box
                    sx={{
                      width: 36, height: 36, borderRadius: 2.5,
                      background: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', boxShadow: '0 4px 14px rgba(244, 63, 94, 0.35)',
                    }}
                  >
                    <TrendingUpIcon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: primaryText, lineHeight: 1.2 }}>
                      24-Hour Risk Score Trend
                    </Typography>
                    <Typography variant="caption" sx={{ color: secondaryText, fontSize: '0.7rem' }}>
                      LSTM predictive trajectory • {location?.name || location?.district || 'Delhi'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Metric pills row */}
              <Box display="flex" gap={1.2} mb={2} flexWrap="wrap">
                {[
                  { label: 'Current', value: '70', color: '#f59e0b', suffix: ' (Elevated)' },
                  { label: 'Peak', value: '84', color: '#f43f5e', suffix: ' / 100' },
                  { label: '12h Δ', value: '-14', color: '#10b981', suffix: ' pts' },
                  { label: 'Confidence', value: '94.6', color: isDark ? '#38bdf8' : '#0284c7', suffix: '%' },
                ].map((pill, i) => (
                  <Box
                    key={i}
                    sx={{
                      px: 1.2, py: 0.5, borderRadius: 2,
                      bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)',
                      display: 'flex', alignItems: 'center', gap: 0.5,
                      transition: 'all 0.2s ease',
                      '&:hover': { borderColor: pill.color, bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
                    }}
                  >
                    <Typography variant="caption" sx={{ color: secondaryText, fontSize: '0.7rem', fontWeight: 600 }}>
                      {pill.label}:
                    </Typography>
                    <Typography variant="caption" sx={{ color: pill.color, fontSize: '0.72rem', fontWeight: 800 }}>
                      {pill.value}{pill.suffix}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Area Chart */}
              <Box height={220}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="50%" stopColor="#f97316" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'} />
                    <XAxis dataKey="time" stroke={secondaryText} tick={{ fill: secondaryText, fontSize: 11 }} />
                    <YAxis domain={[0, 100]} stroke={secondaryText} tick={{ fill: secondaryText, fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : '#ffffff',
                        borderColor: isDark ? 'rgba(244, 63, 94, 0.4)' : 'rgba(244, 63, 94, 0.3)',
                        borderRadius: '12px', color: primaryText,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                      }}
                      formatter={(val, name) => [`${val}/100`, name === 'risk' ? 'Risk Score' : 'Baseline']}
                    />
                    <Area
                      type="monotone" dataKey="risk" stroke="#f43f5e" strokeWidth={3}
                      fillOpacity={1} fill="url(#riskGrad)"
                      dot={{ r: 4, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 8, fill: '#fb7185', stroke: '#fff', strokeWidth: 2 }}
                      animationDuration={1500} animationEasing="ease-out"
                    />
                    <Area
                      type="monotone" dataKey="baseline" stroke={isDark ? '#38bdf8' : '#0284c7'}
                      strokeWidth={1.5} strokeDasharray="5 5"
                      fillOpacity={1} fill="url(#baseGrad)" dot={false}
                      animationDuration={1500} animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grow>
        </Grid>
      </Grid>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SECTION 4: Activity Overview + Alert Timeline              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Grid container spacing={2.5}>
        {/* LEFT: Hourly Activity Bar Chart */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Grow in={mounted} timeout={1300}>
            <Paper sx={{ ...glassCard, p: 3, height: '100%' }}>
              <Box display="flex" alignItems="center" gap={1.2} mb={2.5}>
                <Box
                  sx={{
                    width: 36, height: 36, borderRadius: 2.5,
                    background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', boxShadow: '0 4px 14px rgba(56, 189, 248, 0.35)',
                  }}
                >
                  <AccessTimeIcon fontSize="small" />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: primaryText, lineHeight: 1.2 }}>
                    Today's Activity
                  </Typography>
                  <Typography variant="caption" sx={{ color: secondaryText, fontSize: '0.7rem' }}>
                    Alerts vs citizen reports
                  </Typography>
                </Box>
              </Box>

              <Box height={260}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyActivity} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'} />
                    <XAxis dataKey="hour" stroke={secondaryText} tick={{ fill: secondaryText, fontSize: 11 }} />
                    <YAxis stroke={secondaryText} tick={{ fill: secondaryText, fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : '#ffffff',
                        borderRadius: '12px', color: primaryText,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                      }}
                    />
                    <Bar dataKey="alerts" fill="#f43f5e" radius={[4, 4, 0, 0]} animationDuration={1200} name="Alerts" />
                    <Bar dataKey="reports" fill="#38bdf8" radius={[4, 4, 0, 0]} animationDuration={1200} name="Reports" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>

              {/* Mini legend */}
              <Box display="flex" gap={2} mt={1.5} justifyContent="center">
                {[{ label: 'System Alerts', color: '#f43f5e' }, { label: 'Citizen Reports', color: '#38bdf8' }].map((l, i) => (
                  <Box key={i} display="flex" alignItems="center" gap={0.6}>
                    <Box sx={{ width: 8, height: 8, borderRadius: 1, bgcolor: l.color }} />
                    <Typography variant="caption" sx={{ color: secondaryText, fontSize: '0.7rem', fontWeight: 600 }}>
                      {l.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grow>
        </Grid>

        {/* RIGHT: Alert Timeline (vertical timeline style) */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Grow in={mounted} timeout={1500}>
            <Paper sx={{ ...glassCard, p: 3 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2.5}
              >
                <Box display="flex" alignItems="center" gap={1.2}>
                  <Box
                    sx={{
                      width: 8, height: 8, borderRadius: '50%', bgcolor: '#f43f5e',
                      animation: 'pulse-red 2s infinite',
                    }}
                  />
                  <Typography variant="subtitle1" fontWeight={800} sx={{ color: primaryText }}>
                    Active Threat Intelligence
                  </Typography>
                  <Box
                    sx={{
                      px: 1, py: 0.3, borderRadius: 1.5,
                      bgcolor: 'rgba(244, 63, 94, 0.12)',
                      border: '1px solid rgba(244, 63, 94, 0.25)',
                      color: '#fb7185', fontSize: '0.7rem', fontWeight: 700,
                    }}
                  >
                    {displayAlerts.length} Active
                  </Box>
                </Box>

                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate('/hazard-mapping')}
                    sx={{
                      color: isDark ? '#38bdf8' : '#0284c7',
                      borderColor: isDark ? 'rgba(56,189,248,0.3)' : 'rgba(2,132,199,0.3)',
                      fontSize: '0.75rem', fontWeight: 700, borderRadius: 2,
                      '&:hover': { borderColor: isDark ? '#38bdf8' : '#0284c7', bgcolor: isDark ? 'rgba(56,189,248,0.08)' : 'rgba(2,132,199,0.06)' },
                    }}
                  >
                    Hazard Zones
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                    onClick={() => navigate('/disaster-map')}
                    sx={{
                      background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                      fontSize: '0.75rem', fontWeight: 700, borderRadius: 2,
                      '&:hover': { background: 'linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%)' },
                    }}
                  >
                    Live Map
                  </Button>
                </Stack>
              </Box>

              {/* Timeline-style alerts */}
              <Stack spacing={0}>
                {displayAlerts.map((alert, index) => {
                  const isCritical = alert.severity === 'CRITICAL';
                  const isHigh = alert.severity === 'HIGH' || alert.severity === 'RED';
                  const dotColor = isCritical ? '#f43f5e' : isHigh ? '#f97316' : '#38bdf8';
                  const isLast = index === displayAlerts.length - 1;

                  return (
                    <Box key={alert._id || index} display="flex" gap={2}>
                      {/* Timeline line + dot */}
                      <Box display="flex" flexDirection="column" alignItems="center" sx={{ pt: 0.5, minWidth: 20 }}>
                        <Box
                          sx={{
                            width: 12, height: 12, borderRadius: '50%',
                            bgcolor: dotColor, flexShrink: 0,
                            boxShadow: `0 0 10px ${dotColor}`,
                            animation: isCritical ? 'pulse-red 2s infinite' : 'none',
                          }}
                        />
                        {!isLast && (
                          <Box sx={{ width: 2, flex: 1, bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', my: 0.5 }} />
                        )}
                      </Box>

                      {/* Alert content */}
                      <Box
                        flex={1}
                        sx={{
                          pb: 2.5, mb: !isLast ? 0 : 0,
                          transition: 'all 0.25s ease',
                        }}
                      >
                        <Box
                          sx={{
                            p: 2, borderRadius: 3,
                            background: isDark
                              ? (isCritical
                                  ? 'linear-gradient(135deg, rgba(244,63,94,0.08) 0%, rgba(15,23,42,0.6) 100%)'
                                  : isHigh
                                  ? 'linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(15,23,42,0.6) 100%)'
                                  : 'linear-gradient(135deg, rgba(56,189,248,0.05) 0%, rgba(15,23,42,0.6) 100%)')
                              : (isCritical
                                  ? 'linear-gradient(135deg, rgba(244,63,94,0.05) 0%, #ffffff 100%)'
                                  : isHigh
                                  ? 'linear-gradient(135deg, rgba(249,115,22,0.05) 0%, #ffffff 100%)'
                                  : 'linear-gradient(135deg, rgba(2,132,199,0.04) 0%, #ffffff 100%)'),
                            border: `1px solid ${isCritical ? 'rgba(244,63,94,0.25)' : isHigh ? 'rgba(249,115,22,0.25)' : isDark ? 'rgba(56,189,248,0.2)' : 'rgba(2,132,199,0.2)'}`,
                            transition: 'all 0.25s ease',
                            '&:hover': {
                              transform: 'translateX(4px)',
                              boxShadow: isDark ? '0 6px 20px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.06)',
                              borderColor: dotColor,
                            },
                          }}
                        >
                          <Box display="flex" alignItems="center" gap={1.2} mb={0.8} flexWrap="wrap">
                            <RiskBadge level={alert.severity || 'INFO'} />
                            <Typography variant="body2" fontWeight={700} sx={{ color: primaryText, fontSize: '0.88rem' }}>
                              {alert.title || alert.message}
                            </Typography>
                            {formatAlertTime(alert) && (
                              <Typography variant="caption" sx={{ color: secondaryText, fontSize: '0.72rem' }}>
                                • {formatAlertTime(alert)}
                              </Typography>
                            )}
                          </Box>
                          <Typography variant="body2" sx={{ color: secondaryText, fontSize: '0.82rem', mb: 0.8 }}>
                            {alert.message}
                          </Typography>
                          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                            {formatAlertLocation(alert.location) && (
                              <Typography variant="caption" sx={{ color: isDark ? '#38bdf8' : '#0284c7', fontWeight: 600, fontSize: '0.72rem' }}>
                                📍 {formatAlertLocation(alert.location)}
                              </Typography>
                            )}
                            <Stack direction="row" spacing={0.8}>
                              {isAdmin && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => navigate('/relocation-planning')}
                                  sx={{
                                    color: primaryText, fontSize: '0.7rem', fontWeight: 600, borderRadius: 1.5, py: 0.3,
                                    borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                                    '&:hover': { borderColor: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' },
                                  }}
                                >
                                  Relocate
                                </Button>
                              )}
                              <Button
                                size="small"
                                variant="contained"
                                endIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />}
                                onClick={() => navigate('/disaster-map')}
                                sx={{
                                  background: isCritical
                                    ? 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)'
                                    : 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                                  fontSize: '0.7rem', fontWeight: 700, borderRadius: 1.5, py: 0.3,
                                }}
                              >
                                Inspect
                              </Button>
                            </Stack>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            </Paper>
          </Grow>
        </Grid>
      </Grid>
    </Boilerplate>
  );
}
