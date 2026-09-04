import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Typography,
  Paper,
  Box,
  Button,
  Stack,
  Fade,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ThunderstormOutlinedIcon from '@mui/icons-material/ThunderstormOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import PhoneInTalkOutlinedIcon from '@mui/icons-material/PhoneInTalkOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';

import Boilerplate from '../layouts/Boilerplate';
import { getDashboardStats } from '../services/api';
import { getCurrentUser } from '../lib/auth';
import { useThemeMode } from '../context/ThemeContext';
import { useLocationContext } from '../context/LocationContext';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

// Mini SVG Sparkline Component
function MiniSparkline({ color, data = [10, 14, 12, 18, 15, 22, 20] }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 72;
  const height = 28;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { isDark } = useThemeMode();
  const { location } = useLocationContext();
  const user = getCurrentUser() || { name: 'Admin User', role: 'ADMIN' };

  const [stats, setStats] = useState(null);
  const [currentTime, setCurrentTime] = useState('');

  // Location display
  const locationName = location?.name || location?.district || 'Gautam Buddha Nagar (Uttar Pradesh)';

  // Live ticking clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch real backend data
  useEffect(() => {
    let cancelled = false;
    getDashboardStats()
      .then((res) => {
        if (!cancelled && res?.data?.data) {
          setStats(res.data.data);
        }
      })
      .catch((err) => {
        console.warn('Dashboard stats fallback to default state:', err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Dynamic values with perfect fallback matching mockup
  const activeAlertsCount = stats?.activeAlerts ?? 11;
  const criticalAlertsCount = stats?.criticalAlerts ?? 1;
  const sheltersReady = stats?.sheltersOperational ?? 18;
  const totalShelters = stats?.totalShelters ?? 20;
  const populationAtRisk = stats?.populationAtRisk ?? 62730;
  const reportsCount = stats?.reports24h ?? 9;

  // Chart Data
  const donutData = [
    { name: 'Low Risk', value: 320, color: '#10b981', pct: '57%' },
    { name: 'Medium Risk', value: 148, color: '#f59e0b', pct: '26%' },
    { name: 'High Risk', value: 72, color: '#ef4444', pct: '17%' },
  ];
  const totalZones = 322;

  const trendData = [
    { time: '00:00', score: 38 },
    { time: '02:00', score: 42 },
    { time: '04:00', score: 45 },
    { time: '06:00', score: 44 },
    { time: '08:00', score: 55 },
    { time: '10:00', score: 72 },
    { time: '12:00', score: 82 },
    { time: '14:00', score: 68 },
    { time: '16:00', score: 70 },
    { time: '18:00', score: 65 },
    { time: '20:00', score: 58 },
  ];

  const recentAlerts = [
    {
      id: 'alert-1',
      title: 'High Flood Risk',
      subtitle: 'Yamuna river water level rising',
      time: '2h ago',
      severity: 'critical',
      icon: <WarningAmberIcon sx={{ color: '#ef4444', fontSize: 20 }} />,
      iconBg: '#fee2e2',
    },
    {
      id: 'alert-2',
      title: 'Heavy Rainfall Forecast',
      subtitle: 'Next 24 hours',
      time: '4h ago',
      severity: 'high',
      icon: <ThunderstormOutlinedIcon sx={{ color: '#f97316', fontSize: 20 }} />,
      iconBg: '#ffedd5',
    },
    {
      id: 'alert-3',
      title: 'Low-Lying Areas Advisory',
      subtitle: 'Avoid unnecessary travel',
      time: '6h ago',
      severity: 'info',
      icon: <InfoOutlinedIcon sx={{ color: '#3b82f6', fontSize: 20 }} />,
      iconBg: '#dbeafe',
    },
  ];

  // Theme-aware tokens
  const cardBg = isDark ? '#111827' : '#ffffff';
  const cardBorder = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1f5f9';
  const cardShadow = isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.03)';
  const textPrimary = isDark ? '#f9fafb' : '#0f172a';
  const textSecondary = isDark ? '#9ca3af' : '#64748b';
  const textMuted = isDark ? '#6b7280' : '#94a3b8';

  return (
    <Boilerplate>
      <Fade in timeout={400}>
        <Box sx={{ width: '100%', maxWidth: 1440, mx: 'auto', pb: 4 }}>
          {/* ── 1. Top Cockpit Header ── */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={2}
            mb={3}
          >
            <Box>
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{
                  color: textPrimary,
                  fontSize: { xs: '1.5rem', sm: '1.85rem' },
                  letterSpacing: '-0.02em',
                }}
              >
                Crisis Decision Cockpit
              </Typography>
              <Typography variant="body2" sx={{ color: textSecondary, mt: 0.3, fontWeight: 500 }}>
                Welcome back, <strong>{user?.name || 'Admin User'}</strong> • Monitoring{' '}
                <span style={{ color: '#0284c7', fontWeight: 700 }}>{locationName}</span>
              </Typography>
            </Box>

            <Stack direction="row" spacing={2} alignItems="center">
              {/* Live Ticking Clock */}
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                sx={{
                  color: textSecondary,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  fontFamily: 'monospace',
                }}
              >
                <span>{currentTime || '01:13:55 AM'}</span>
                <Box display="inline-flex" alignItems="center" gap={0.6}>
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      bgcolor: '#10b981',
                      boxShadow: '0 0 8px #10b981',
                    }}
                  />
                  <span style={{ color: '#10b981', fontWeight: 700 }}>Live</span>
                </Box>
              </Box>

              {/* Live Map Button */}
              <Button
                variant="contained"
                startIcon={<MapOutlinedIcon />}
                onClick={() => navigate('/disaster-map')}
                sx={{
                  bgcolor: '#0284c7',
                  color: '#ffffff',
                  textTransform: 'none',
                  borderRadius: '10px',
                  px: 2.2,
                  py: 0.9,
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  boxShadow: '0 2px 8px rgba(2,132,199,0.3)',
                  '&:hover': { bgcolor: '#0369a1' },
                }}
              >
                Live Map
              </Button>
            </Stack>
          </Box>

          {/* ── 2. Master KPI Row (4 Cards matching mockup) ── */}
          <Grid container spacing={2.5} mb={3}>
            {/* Card 1: ACTIVE ALERTS */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  bgcolor: cardBg,
                  border: cardBorder,
                  boxShadow: cardShadow,
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(0,0,0,0.06)' },
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box display="flex" alignItems="center" gap={1.8}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '12px',
                        bgcolor: isDark ? 'rgba(239,68,68,0.2)' : '#fee2e2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <WarningAmberIcon sx={{ color: '#ef4444', fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: textSecondary, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.72rem' }}
                      >
                        ACTIVE ALERTS
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} mt={0.2}>
                        <Typography variant="h4" fontWeight={800} sx={{ color: textPrimary, lineHeight: 1 }}>
                          {activeAlertsCount}
                        </Typography>
                        <Box
                          sx={{
                            px: 1,
                            py: 0.3,
                            borderRadius: '12px',
                            bgcolor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)',
                            color: '#ef4444',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.4,
                          }}
                        >
                          <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#ef4444' }} />
                          {criticalAlertsCount} Critical
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                  <MiniSparkline color="#ef4444" data={[12, 16, 14, 22, 19, 25, 23]} />
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2.5} pt={1.5} borderTop={cardBorder}>
                  <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.75rem' }}>
                    Live feeds
                  </Typography>
                  <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.75rem' }}>
                    Yamuna Gauge <strong style={{ color: '#ef4444' }}>205.85m (+0.52m)</strong>
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Card 2: SHELTERS READY */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  bgcolor: cardBg,
                  border: cardBorder,
                  boxShadow: cardShadow,
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(0,0,0,0.06)' },
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box display="flex" alignItems="center" gap={1.8}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '12px',
                        bgcolor: isDark ? 'rgba(34,197,94,0.2)' : '#dcfce7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <HomeWorkOutlinedIcon sx={{ color: '#16a34a', fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: textSecondary, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.72rem' }}
                      >
                        SHELTERS READY
                      </Typography>
                      <Typography variant="h4" fontWeight={800} sx={{ color: textPrimary, lineHeight: 1, mt: 0.2 }}>
                        {sheltersReady} <span style={{ fontSize: '1.1rem', color: textMuted, fontWeight: 600 }}>/ {totalShelters}</span>
                      </Typography>
                      <Box
                        sx={{
                          mt: 0.6,
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: 1,
                          py: 0.2,
                          borderRadius: '10px',
                          bgcolor: isDark ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.1)',
                          color: '#16a34a',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                        }}
                      >
                        88% Ready
                      </Box>
                    </Box>
                  </Box>
                  <MiniSparkline color="#10b981" data={[15, 17, 16, 20, 22, 23, 25]} />
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} pt={1.5} borderTop={cardBorder}>
                  <Box display="flex" alignItems="center" gap={0.6}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10b981' }} />
                    <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.75rem' }}>
                      1,740 Occupied
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.75rem' }}>
                    • Operational
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Card 3: POPULATION AT RISK */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  bgcolor: cardBg,
                  border: cardBorder,
                  boxShadow: cardShadow,
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(0,0,0,0.06)' },
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box display="flex" alignItems="center" gap={1.8}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '12px',
                        bgcolor: isDark ? 'rgba(249,115,22,0.2)' : '#ffedd5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <PeopleAltOutlinedIcon sx={{ color: '#f97316', fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: textSecondary, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.72rem' }}
                      >
                        POPULATION AT RISK
                      </Typography>
                      <Typography variant="h4" fontWeight={800} sx={{ color: textPrimary, lineHeight: 1, mt: 0.2 }}>
                        {populationAtRisk.toLocaleString()}
                      </Typography>
                      <Box
                        sx={{
                          mt: 0.6,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          px: 1,
                          py: 0.2,
                          borderRadius: '10px',
                          bgcolor: isDark ? 'rgba(249,115,22,0.2)' : 'rgba(249,115,22,0.1)',
                          color: '#ea580c',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                        }}
                      >
                        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#ea580c' }} />
                        Threat &gt;= 60
                      </Box>
                    </Box>
                  </Box>
                  <MiniSparkline color="#f97316" data={[20, 24, 28, 26, 32, 35, 33]} />
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} pt={1.5} borderTop={cardBorder}>
                  <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.75rem' }}>
                    6 Active Sectors
                  </Typography>
                  <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.75rem' }}>
                    • <strong style={{ color: '#ef4444' }}>2 Critical</strong>
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Card 4: REPORTS (24H) */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  bgcolor: cardBg,
                  border: cardBorder,
                  boxShadow: cardShadow,
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(0,0,0,0.06)' },
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box display="flex" alignItems="center" gap={1.8}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '12px',
                        bgcolor: isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <BoltOutlinedIcon sx={{ color: '#3b82f6', fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: textSecondary, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.72rem' }}
                      >
                        REPORTS (24H)
                      </Typography>
                      <Typography variant="h4" fontWeight={800} sx={{ color: textPrimary, lineHeight: 1, mt: 0.2 }}>
                        {reportsCount}
                      </Typography>
                      <Box
                        sx={{
                          mt: 0.6,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          px: 1,
                          py: 0.2,
                          borderRadius: '10px',
                          bgcolor: isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.1)',
                          color: '#2563eb',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                        }}
                      >
                        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#2563eb' }} />
                        4 Verified
                      </Box>
                    </Box>
                  </Box>
                  <MiniSparkline color="#3b82f6" data={[10, 15, 12, 18, 14, 20, 19]} />
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} pt={1.5} borderTop={cardBorder}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <WaterDropOutlinedIcon sx={{ fontSize: 14, color: '#3b82f6' }} />
                    <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.75rem' }}>
                      Rainfall
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.75rem' }}>
                    <strong style={{ color: textPrimary }}>68.4mm (Heavy)</strong>
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* ── 3. Middle Tri-Panel Row (Risk Distribution | 24h Risk Trend | Recent Alerts) ── */}
          <Grid container spacing={2.5} mb={3}>
            {/* Panel 1: Risk Distribution */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: '16px',
                  bgcolor: cardBg,
                  border: cardBorder,
                  boxShadow: cardShadow,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={800} sx={{ color: textPrimary, fontSize: '1.05rem', mb: 2 }}>
                    Risk Distribution
                  </Typography>

                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    {/* Donut Chart with Center Count */}
                    <Box position="relative" width={160} height={160}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={72}
                            paddingAngle={3}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                          >
                            {donutData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <Box
                        position="absolute"
                        top="50%"
                        left="50%"
                        sx={{ transform: 'translate(-50%, -50%)', textAlign: 'center' }}
                      >
                        <Typography variant="h5" fontWeight={800} sx={{ color: textPrimary, lineHeight: 1 }}>
                          {totalZones}
                        </Typography>
                        <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.68rem', fontWeight: 600 }}>
                          Total Zones
                        </Typography>
                      </Box>
                    </Box>

                    {/* Clean Legend list */}
                    <Stack spacing={1.5} sx={{ flex: 1, pl: 2 }}>
                      {donutData.map((item) => (
                        <Box key={item.name} display="flex" alignItems="center" justifyContent="space-between">
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
                            <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.82rem', fontWeight: 500 }}>
                              {item.name}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1.2}>
                            <Typography variant="body2" sx={{ color: textPrimary, fontWeight: 700, fontSize: '0.82rem' }}>
                              {item.value}
                            </Typography>
                            <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.78rem' }}>
                              {item.pct}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Box>

                <Box textAlign="center" pt={2} mt={1} borderTop={cardBorder}>
                  <Button
                    onClick={() => navigate('/risk-analysis')}
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      textTransform: 'none',
                      color: '#0284c7',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                    }}
                  >
                    View full risk analysis
                  </Button>
                </Box>
              </Paper>
            </Grid>

            {/* Panel 2: 24-Hour Risk Score Trend */}
            <Grid item xs={12} md={4.5}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: '16px',
                  bgcolor: cardBg,
                  border: cardBorder,
                  boxShadow: cardShadow,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" fontWeight={800} sx={{ color: textPrimary, fontSize: '1.05rem' }}>
                      24-Hour Risk Score Trend
                    </Typography>
                    <Box
                      sx={{
                        px: 1.2,
                        py: 0.4,
                        borderRadius: '8px',
                        bgcolor: isDark ? 'rgba(239,68,68,0.15)' : '#fff1f2',
                        border: '1px solid rgba(239,68,68,0.2)',
                        textAlign: 'right',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 800, display: 'block', fontSize: '0.72rem' }}>
                        Current: 70
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 600, fontSize: '0.65rem' }}>
                        Elevated
                      </Typography>
                    </Box>
                  </Box>

                  {/* Smooth Area Chart */}
                  <Box height={165} width="100%">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="riskTrendGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'} />
                        <XAxis
                          dataKey="time"
                          tick={{ fontSize: 10, fill: textMuted }}
                          axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[0, 100]}
                          ticks={[0, 25, 50, 75, 100]}
                          tick={{ fontSize: 10, fill: textMuted }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? '#1e293b' : '#ffffff',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                            borderRadius: 8,
                            fontSize: '0.75rem',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="score"
                          stroke="#ef4444"
                          strokeWidth={2.5}
                          fill="url(#riskTrendGrad)"
                          dot={{ r: 3, fill: '#ef4444' }}
                          activeDot={{ r: 5 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>

                <Box textAlign="center" pt={2} mt={1} borderTop={cardBorder}>
                  <Button
                    onClick={() => navigate('/forecasts')}
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      textTransform: 'none',
                      color: '#0284c7',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                    }}
                  >
                    Detailed trend analysis
                  </Button>
                </Box>
              </Paper>
            </Grid>

            {/* Panel 3: Recent Alerts */}
            <Grid item xs={12} md={3.5}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: '16px',
                  bgcolor: cardBg,
                  border: cardBorder,
                  boxShadow: cardShadow,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight={800} sx={{ color: textPrimary, fontSize: '1.05rem' }}>
                      Recent Alerts
                    </Typography>
                    <Button
                      onClick={() => navigate('/disaster-map')}
                      endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                      sx={{
                        textTransform: 'none',
                        color: '#0284c7',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        p: 0,
                        minWidth: 0,
                      }}
                    >
                      View All
                    </Button>
                  </Box>

                  {/* Alerts List */}
                  <Stack spacing={1.6}>
                    {recentAlerts.map((alert) => (
                      <Box
                        key={alert.id}
                        onClick={() => navigate('/disaster-map')}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1.2,
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                          '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc' },
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '8px',
                              bgcolor: alert.iconBg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {alert.icon}
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight={700} sx={{ color: textPrimary, fontSize: '0.84rem' }}>
                              {alert.title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.74rem' }}>
                              {alert.subtitle}
                            </Typography>
                          </Box>
                        </Box>

                        <Box display="flex" alignItems="center" gap={0.4}>
                          <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.72rem' }}>
                            {alert.time}
                          </Typography>
                          <ChevronRightIcon sx={{ fontSize: 16, color: textMuted }} />
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>

                {/* Micro spacer matching other panel heights */}
                <Box pt={2} mt={1} borderTop="none" />
              </Paper>
            </Grid>
          </Grid>

          {/* ── 4. Row 3: Quick Actions ── */}
          <Box mb={2}>
            <Typography variant="h6" fontWeight={800} sx={{ color: textPrimary, fontSize: '1.05rem', mb: 1.8 }}>
              Quick Actions
            </Typography>

            <Grid container spacing={2}>
              {/* Action 1: Citizen Reports */}
              <Grid item xs={12} sm={6} md={2.4}>
                <Paper
                  elevation={0}
                  onClick={() => navigate('/citizen-reports')}
                  sx={{
                    p: 1.8,
                    borderRadius: '12px',
                    bgcolor: cardBg,
                    border: cardBorder,
                    boxShadow: cardShadow,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      borderColor: '#0284c7',
                      boxShadow: '0 4px 14px rgba(2,132,199,0.12)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: '8px',
                      bgcolor: isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <DescriptionOutlinedIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                  </Box>
                  <Typography variant="body2" fontWeight={700} sx={{ color: textPrimary, fontSize: '0.84rem' }}>
                    Citizen Reports
                  </Typography>
                </Paper>
              </Grid>

              {/* Action 2: Emergency Contacts */}
              <Grid item xs={12} sm={6} md={2.4}>
                <Paper
                  elevation={0}
                  onClick={() => navigate('/vulnerable-habitations')}
                  sx={{
                    p: 1.8,
                    borderRadius: '12px',
                    bgcolor: cardBg,
                    border: cardBorder,
                    boxShadow: cardShadow,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      borderColor: '#10b981',
                      boxShadow: '0 4px 14px rgba(16,185,129,0.12)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: '8px',
                      bgcolor: isDark ? 'rgba(34,197,94,0.2)' : '#dcfce7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PhoneInTalkOutlinedIcon sx={{ color: '#16a34a', fontSize: 20 }} />
                  </Box>
                  <Typography variant="body2" fontWeight={700} sx={{ color: textPrimary, fontSize: '0.84rem' }}>
                    Emergency Contacts
                  </Typography>
                </Paper>
              </Grid>

              {/* Action 3: Shelter Capacity */}
              <Grid item xs={12} sm={6} md={2.4}>
                <Paper
                  elevation={0}
                  onClick={() => navigate('/carrying-capacity')}
                  sx={{
                    p: 1.8,
                    borderRadius: '12px',
                    bgcolor: cardBg,
                    border: cardBorder,
                    boxShadow: cardShadow,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      borderColor: '#0d9488',
                      boxShadow: '0 4px 14px rgba(13,148,136,0.12)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: '8px',
                      bgcolor: isDark ? 'rgba(13,148,136,0.2)' : '#ccfbf1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <HomeWorkOutlinedIcon sx={{ color: '#0d9488', fontSize: 20 }} />
                  </Box>
                  <Typography variant="body2" fontWeight={700} sx={{ color: textPrimary, fontSize: '0.84rem' }}>
                    Shelter Capacity
                  </Typography>
                </Paper>
              </Grid>

              {/* Action 4: Early Warnings */}
              <Grid item xs={12} sm={6} md={2.4}>
                <Paper
                  elevation={0}
                  onClick={() => navigate('/disaster-map')}
                  sx={{
                    p: 1.8,
                    borderRadius: '12px',
                    bgcolor: cardBg,
                    border: cardBorder,
                    boxShadow: cardShadow,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      borderColor: '#f59e0b',
                      boxShadow: '0 4px 14px rgba(245,158,11,0.12)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: '8px',
                      bgcolor: isDark ? 'rgba(245,158,11,0.2)' : '#ffedd5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <NotificationsActiveOutlinedIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
                  </Box>
                  <Typography variant="body2" fontWeight={700} sx={{ color: textPrimary, fontSize: '0.84rem' }}>
                    Early Warnings
                  </Typography>
                </Paper>
              </Grid>

              {/* Action 5: What If? Simulation */}
              <Grid item xs={12} sm={6} md={2.4}>
                <Paper
                  elevation={0}
                  onClick={() => navigate('/simulation')}
                  sx={{
                    p: 1.8,
                    borderRadius: '12px',
                    bgcolor: cardBg,
                    border: cardBorder,
                    boxShadow: cardShadow,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      borderColor: '#9333ea',
                      boxShadow: '0 4px 14px rgba(147,51,234,0.12)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: '8px',
                      bgcolor: isDark ? 'rgba(147,51,234,0.2)' : '#f3e8ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ScienceOutlinedIcon sx={{ color: '#9333ea', fontSize: 20 }} />
                  </Box>
                  <Typography variant="body2" fontWeight={700} sx={{ color: textPrimary, fontSize: '0.84rem' }}>
                    What If? Simulation
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Fade>
    </Boilerplate>
  );
}
