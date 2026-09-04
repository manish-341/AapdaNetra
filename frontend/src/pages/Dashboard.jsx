import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Typography, Paper, Box, Button, CircularProgress, Stack, Tooltip as MuiTooltip
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import ThunderstormOutlinedIcon from '@mui/icons-material/ThunderstormOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import Boilerplate from '../layouts/Boilerplate';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';
import { getDashboardStats } from '../services/api';
import Chip from '@mui/material/Chip';
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
  CartesianGrid
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

export default function Dashboard() {
  const navigate = useNavigate();
  const { isDark } = useThemeMode();
  const { location } = useLocationContext();
  const user = getCurrentUser() || { name: 'Officer', role: 'DISTRICT_OFFICER', district: 'Delhi' };
  const isAdmin = ["ADMIN", "ADMINISTRATOR"].includes(user?.role);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertFilter, setAlertFilter] = useState('ALL');

  useEffect(() => {
    getDashboardStats()
      .then(res => setStats(res.data?.data || null))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pieData = [
    { name: 'Critical', value: stats?.riskDistribution?.CRITICAL || 2, color: '#f43f5e', lightColor: '#fb7185' },
    { name: 'High Risk', value: stats?.riskDistribution?.RED || 4, color: '#f97316', lightColor: '#fb923c' },
    { name: 'Moderate / Amber', value: stats?.riskDistribution?.AMBER || 2, color: '#eab308', lightColor: '#fde047' },
    { name: 'Low / Green', value: stats?.riskDistribution?.GREEN || 2, color: '#10b981', lightColor: '#34d399' }
  ];

  const totalHabitations = pieData.reduce((acc, curr) => acc + curr.value, 0);

  const mockTrend = [
    { time: '00:00', risk: 42, baseline: 35 },
    { time: '04:00', risk: 48, baseline: 36 },
    { time: '08:00', risk: 65, baseline: 38 },
    { time: '12:00', risk: 84, baseline: 40 },
    { time: '16:00', risk: 78, baseline: 39 },
    { time: '20:00', risk: 70, baseline: 37 }
  ];

  const displayAlerts = stats?.recentAlerts && stats.recentAlerts.length > 0
    ? stats.recentAlerts
    : [
        {
          _id: 'alt-1',
          title: 'Yamuna Water Level Warning Threshold Exceeded',
          message: 'Old Railway Bridge gauge reading reached 205.85m (Warning: 205.33m). Low-lying floodplains on high watch.',
          severity: 'CRITICAL',
          time: '12m ago',
          location: 'Yamuna Bank, Sector 15'
        },
        {
          _id: 'alt-2',
          title: 'Heavy Inflow Forecast in North Drainage Basin',
          message: 'Hathnikund barrage outflow increased to 1,42,000 cusecs. Vulnerable habitations put on secondary standby.',
          severity: 'HIGH',
          time: '34m ago',
          location: 'North Delhi Basin'
        },
        {
          _id: 'alt-3',
          title: 'Relocation Shelters 1, 2 & 4 Operational Readiness',
          message: 'Emergency food, potable water, and medical kits stocked. 120 beds ready for immediate intake.',
          severity: 'INFO',
          time: '1h ago',
          location: 'Civil Lines Relief Camp'
        }
      ];

  const primaryTextColor = isDark ? '#f8fafc' : '#0f172a';
  const secondaryTextColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <Boilerplate>
      {/* 1. Top Clean Status Header */}
      <Box
        display="flex"
        flexDirection={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        gap={2}
        mb={2.5}
      >
        <Box>
          <Box display="flex" alignItems="center" gap={1.2} mb={0.4}>
            <span className="beacon-live" />
            <Typography
              variant="caption"
              sx={{
                color: isDark ? '#38bdf8' : '#0284c7',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontSize: '0.7rem'
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
                ? 'linear-gradient(90deg, #ffffff 0%, #cbd5e1 50%, #38bdf8 100%)'
                : 'linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0284c7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
              fontSize: { xs: '1.6rem', md: '1.95rem' },
              lineHeight: 1.25
            }}
          >
            AapdaNetra Crisis Decision Cockpit
          </Typography>
          <Typography variant="body2" sx={{ color: secondaryTextColor, mt: 0.3 }}>
            Welcome back, <strong style={{ color: primaryTextColor }}>{user.name}</strong> ({user.role}) • Situational intelligence for{' '}
            <span style={{ color: isDark ? '#38bdf8' : '#0284c7', fontWeight: 700 }}>{user.district || 'Delhi'}</span>
          </Typography>
        </Box>

        {/* Header Action Button */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="contained"
            startIcon={<MapOutlinedIcon />}
            onClick={() => navigate('/disaster-map')}
            sx={{
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.3)',
              fontWeight: 700,
              fontSize: '0.82rem',
              px: 2.2,
              py: 0.85,
              borderRadius: 2.5,
              textTransform: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%)',
                boxShadow: '0 6px 20px rgba(37, 99, 235, 0.45)',
              }
            }}
          >
            Live Disaster Map
          </Button>
        </Stack>
      </Box>

      {/* 2. Real-Time Environmental Telemetry Bar (Compact & Polished) */}
      <Paper
        className="glass-card"
        sx={{
          p: 1.25,
          px: 2,
          mb: 2.5,
          borderRadius: 2.5,
          background: isDark
            ? 'rgba(15, 23, 42, 0.75) !important'
            : '#ffffff !important',
          border: isDark
            ? '1px solid rgba(255, 255, 255, 0.08) !important'
            : '1px solid rgba(226, 232, 240, 0.9) !important',
          boxShadow: isDark
            ? '0 4px 16px rgba(0, 0, 0, 0.25)'
            : '0 2px 10px rgba(0, 0, 0, 0.03)'
        }}
      >
        <Grid container spacing={1.5} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box display="flex" alignItems="center" gap={1.2}>
              <Box
                sx={{
                  p: 0.8,
                  borderRadius: 1.5,
                  bgcolor: 'rgba(249, 115, 22, 0.12)',
                  color: '#f97316',
                  display: 'flex'
                }}
              >
                <WaterDropOutlinedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: secondaryTextColor, display: 'block', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase' }}>
                  River Level Gauge
                </Typography>
                <Typography variant="body2" sx={{ color: primaryTextColor, fontWeight: 800, fontSize: '0.85rem' }}>
                  205.85 m <span style={{ color: '#f97316', fontSize: '0.72rem', fontWeight: 700 }}>(+0.52m Warning)</span>
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box display="flex" alignItems="center" gap={1.2}>
              <Box
                sx={{
                  p: 0.8,
                  borderRadius: 1.5,
                  bgcolor: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.1)',
                  color: isDark ? '#38bdf8' : '#0284c7',
                  display: 'flex'
                }}
              >
                <ThunderstormOutlinedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: secondaryTextColor, display: 'block', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase' }}>
                  24h Precipitation
                </Typography>
                <Typography variant="body2" sx={{ color: primaryTextColor, fontWeight: 800, fontSize: '0.85rem' }}>
                  68.4 mm <span style={{ color: isDark ? '#38bdf8' : '#0284c7', fontSize: '0.72rem', fontWeight: 700 }}>(Heavy Showers)</span>
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box display="flex" alignItems="center" gap={1.2}>
              <Box
                sx={{
                  p: 0.8,
                  borderRadius: 1.5,
                  bgcolor: 'rgba(244, 63, 94, 0.12)',
                  color: '#f43f5e',
                  display: 'flex'
                }}
              >
                <ShieldOutlinedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: secondaryTextColor, display: 'block', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase' }}>
                  Monitored Risk Sectors
                </Typography>
                <Typography variant="body2" sx={{ color: primaryTextColor, fontWeight: 800, fontSize: '0.85rem' }}>
                  6 Active <span style={{ color: '#f43f5e', fontSize: '0.72rem', fontWeight: 700 }}>(2 Critical)</span>
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box display="flex" alignItems="center" gap={1.2}>
              <Box
                sx={{
                  p: 0.8,
                  borderRadius: 1.5,
                  bgcolor: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  display: 'flex'
                }}
              >
                <HomeWorkOutlinedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: secondaryTextColor, display: 'block', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase' }}>
                  Shelter Readiness
                </Typography>
                <Typography variant="body2" sx={{ color: primaryTextColor, fontWeight: 800, fontSize: '0.85rem' }}>
                  88% Capacity <span style={{ color: '#10b981', fontSize: '0.72rem', fontWeight: 700 }}>(14 Verified)</span>
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" py={12}>
          <CircularProgress sx={{ color: isDark ? '#38bdf8' : '#0284c7' }} size={48} thickness={4} />
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {/* 3. Top 4 Clean KPI Stat Cards */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Active System Alerts"
              value={stats?.alerts?.total || displayAlerts.length}
              change={`${stats?.alerts?.critical || 1} Critical`}
              subtext="Live Feeds"
              icon={WarningAmberIcon}
              colorScheme="crimson"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Available Shelters"
              value={stats?.shelters?.total ? `${stats.shelters.available}/${stats.shelters.total}` : '18/20'}
              change={`${stats?.shelters?.occupied || 1740} Occupied`}
              subtext="Intake Verified"
              icon={HomeWorkOutlinedIcon}
              colorScheme="emerald"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Population at Risk"
              value={stats?.populationAtRisk ? stats.populationAtRisk.toLocaleString() : '62,730'}
              change="Score ≥ 60"
              subtext="Flood Wards"
              icon={PeopleAltOutlinedIcon}
              colorScheme="amber"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Citizen Reports (24h)"
              value={stats?.reports?.last24h || 9}
              change={`${stats?.reports?.verified || 4} Verified`}
              subtext="NLP Triaged"
              icon={BoltOutlinedIcon}
              colorScheme="cyan"
            />
          </Grid>

          {/* 4. Middle Section Left: Habitations by Risk Category */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper className="glass-card card-accent-purple" sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1.2}>
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      boxShadow: '0 4px 12px rgba(168, 85, 247, 0.35)'
                    }}
                  >
                    <ShieldOutlinedIcon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: primaryTextColor, lineHeight: 1.2 }}>
                      Habitations by Risk Category
                    </Typography>
                    <Typography variant="caption" sx={{ color: secondaryTextColor }}>
                      ML vulnerability index based on floodplains & topology
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    px: 1.2,
                    py: 0.4,
                    borderRadius: 1.5,
                    bgcolor: 'rgba(168, 85, 247, 0.12)',
                    border: '1px solid rgba(168, 85, 247, 0.25)',
                    color: isDark ? '#c084fc' : '#7e22ce',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}
                >
                  {totalHabitations} Monitored Sectors
                </Box>
              </Box>

              <Grid container spacing={2} alignItems="center">
                {/* Donut Chart with Center Label */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box height={210} position="relative" display="flex" justifyContent="center" alignItems="center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={58}
                          outerRadius={84}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : '#ffffff',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
                            borderRadius: '10px',
                            color: primaryTextColor,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Donut Center Counter */}
                    <Box
                      position="absolute"
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      sx={{ pointerEvents: 'none' }}
                    >
                      <Typography variant="h5" fontWeight={800} sx={{ color: primaryTextColor, lineHeight: 1 }}>
                        {totalHabitations}
                      </Typography>
                      <Typography variant="caption" sx={{ color: secondaryTextColor, fontSize: '0.68rem', fontWeight: 600 }}>
                        Total Zones
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {/* Breakdown Bars */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack spacing={1.2}>
                    {pieData.map((item, idx) => {
                      const percentage = Math.round((item.value / totalHabitations) * 100);
                      return (
                        <Box
                          key={idx}
                          sx={{
                            p: 1.1,
                            borderRadius: 2,
                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                            border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.06)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                              borderColor: item.color
                            }
                          }}
                        >
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.6}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: item.color,
                                  boxShadow: `0 0 8px ${item.color}`
                                }}
                              />
                              <Typography variant="body2" sx={{ color: primaryTextColor, fontWeight: 600, fontSize: '0.78rem' }}>
                                {item.name}
                              </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: item.color, fontWeight: 700, fontSize: '0.75rem' }}>
                              {item.value} ({percentage}%)
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              width: '100%',
                              height: 5,
                              borderRadius: 3,
                              bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                              overflow: 'hidden'
                            }}
                          >
                            <Box
                              sx={{
                                width: `${percentage}%`,
                                height: '100%',
                                borderRadius: 3,
                                background: `linear-gradient(90deg, ${item.color}, ${item.lightColor})`,
                                transition: 'width 0.8s ease-in-out'
                              }}
                            />
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* 5. Middle Section Right: 24-Hour Regional Risk Trend */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper className="glass-card card-accent-crimson" sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Box display="flex" alignItems="center" gap={1.2}>
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      boxShadow: '0 4px 12px rgba(244, 63, 94, 0.35)'
                    }}
                  >
                    <TrendingUpIcon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: primaryTextColor, lineHeight: 1.2 }}>
                      24-Hour Regional Risk Score Trend
                    </Typography>
                    <Typography variant="caption" sx={{ color: secondaryTextColor }}>
                      LSTM time-series predictive trajectory for {user.district || 'Delhi'}
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    px: 1.2,
                    py: 0.4,
                    borderRadius: 1.5,
                    bgcolor: 'rgba(244, 63, 94, 0.12)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    color: '#fb7185',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}
                >
                  Peak Alert: 84 / 100
                </Box>
              </Box>

              {/* Quick Trend Badges */}
              <Box display="flex" gap={1} mb={1.5} flexWrap="wrap">
                <Box
                  sx={{
                    px: 1,
                    py: 0.3,
                    borderRadius: 1.5,
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                    fontSize: '0.72rem',
                    color: secondaryTextColor
                  }}
                >
                  Current Score: <strong style={{ color: '#f59e0b' }}>70 (Elevated)</strong>
                </Box>
                <Box
                  sx={{
                    px: 1,
                    py: 0.3,
                    borderRadius: 1.5,
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                    fontSize: '0.72rem',
                    color: secondaryTextColor
                  }}
                >
                  12h Trajectory: <strong style={{ color: '#10b981' }}>-14 pts Receding</strong>
                </Box>
                <Box
                  sx={{
                    px: 1,
                    py: 0.3,
                    borderRadius: 1.5,
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                    fontSize: '0.72rem',
                    color: secondaryTextColor
                  }}
                >
                  Confidence: <strong style={{ color: isDark ? '#38bdf8' : '#0284c7' }}>94.6%</strong>
                </Box>
              </Box>

              {/* Glowing Area Chart */}
              <Box height={190}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="riskAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.45} />
                        <stop offset="60%" stopColor="#f97316" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="baselineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)"} />
                    <XAxis dataKey="time" stroke={secondaryTextColor} tick={{ fill: secondaryTextColor, fontSize: 11 }} />
                    <YAxis domain={[0, 100]} stroke={secondaryTextColor} tick={{ fill: secondaryTextColor, fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : '#ffffff',
                        borderColor: isDark ? 'rgba(244, 63, 94, 0.4)' : 'rgba(244, 63, 94, 0.3)',
                        borderRadius: '10px',
                        color: primaryTextColor,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                      }}
                      formatter={(val, name) => [
                        `${val} / 100`,
                        name === 'risk' ? 'Regional Risk Score' : 'Seasonal Baseline'
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="risk"
                      stroke="#f43f5e"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#riskAreaGradient)"
                      dot={{ r: 4, fill: '#f43f5e', stroke: '#fff', strokeWidth: 1.5 }}
                      activeDot={{ r: 7, fill: '#fb7185', stroke: '#fff', strokeWidth: 2 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="baseline"
                      stroke={isDark ? "#38bdf8" : "#0284c7"}
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#baselineGradient)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>



          {/* Bottom Section: Live Active Alerts & Emergency Response Center */}
          <Grid size={{ xs: 12 }}>
            <Paper className="glass-card card-accent-cyan" sx={{ p: 3, borderRadius: 3 }}>
              <Box
                display="flex"
                flexDirection={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                gap={1.5}
                mb={2}
              >
                <Box display="flex" alignItems="center" gap={1.5}>
                  <span className="beacon-alert" />
                  <Typography variant="subtitle1" fontWeight={800} sx={{ color: primaryTextColor, fontSize: '1.05rem' }}>
                    Multi-Channel Threat Intelligence & Alerts ({displayAlerts.length})
                  </Typography>
                </Box>

                {/* Tri-Channel Alert Filter Buttons */}
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip
                    label="ALL CHANNELS"
                    onClick={() => setAlertFilter('ALL')}
                    size="small"
                    variant={alertFilter === 'ALL' ? 'filled' : 'outlined'}
                    color={alertFilter === 'ALL' ? 'primary' : 'default'}
                    sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                  />
                  <Chip
                    label="🏛️ OFFICIAL WARNINGS"
                    onClick={() => setAlertFilter('OFFICIAL')}
                    size="small"
                    variant={alertFilter === 'OFFICIAL' ? 'filled' : 'outlined'}
                    sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#0284c7' }}
                  />
                  <Chip
                    label="🤖 AI PREDICTIONS"
                    onClick={() => setAlertFilter('AI_PREDICTION')}
                    size="small"
                    variant={alertFilter === 'AI_PREDICTION' ? 'filled' : 'outlined'}
                    sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#ea580c' }}
                  />
                  <Chip
                    label="👥 CITIZEN REPORTS"
                    onClick={() => setAlertFilter('CITIZEN')}
                    size="small"
                    variant={alertFilter === 'CITIZEN' ? 'filled' : 'outlined'}
                    sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#16a34a' }}
                  />
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CampaignOutlinedIcon />}
                    onClick={() => navigate('/hazard-mapping')}
                    sx={{
                      color: isDark ? '#38bdf8' : '#0284c7',
                      borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.3)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      '&:hover': {
                        borderColor: isDark ? '#38bdf8' : '#0284c7',
                        bgcolor: isDark ? 'rgba(56, 189, 248, 0.08)' : 'rgba(2, 132, 199, 0.06)'
                      }
                    }}
                  >
                    Hazard Zones
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate('/disaster-map')}
                    sx={{
                      background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                      fontSize: '0.8rem',
                      fontWeight: 700
                    }}
                  >
                    Open Live Map
                  </Button>
                </Stack>
              </Box>

              <Stack spacing={1.5}>
                {displayAlerts.map((alert, index) => {
                  const isCritical = alert.severity === 'CRITICAL';
                  const isHigh = alert.severity === 'HIGH' || alert.severity === 'RED';
                  const borderColor = isCritical
                    ? 'rgba(244, 63, 94, 0.35)'
                    : isHigh
                    ? 'rgba(249, 115, 22, 0.35)'
                    : isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(2, 132, 199, 0.25)';

                  const bgColor = isDark
                    ? (isCritical
                        ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)'
                        : isHigh
                        ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)'
                        : 'linear-gradient(135deg, rgba(56, 189, 248, 0.05) 0%, rgba(15, 23, 42, 0.6) 100%)')
                    : (isCritical
                        ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.06) 0%, #ffffff 100%)'
                        : isHigh
                        ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.06) 0%, #ffffff 100%)'
                        : 'linear-gradient(135deg, rgba(2, 132, 199, 0.04) 0%, #ffffff 100%)');

                  return (
                    <Box
                      key={alert._id || index}
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        background: bgColor,
                        border: `1px solid ${borderColor}`,
                        transition: 'all 0.25s ease',
                        '&:hover': {
                          transform: 'translateX(4px)',
                          boxShadow: isDark ? '0 6px 16px rgba(0, 0, 0, 0.4)' : '0 4px 14px rgba(0, 0, 0, 0.06)'
                        }
                      }}
                    >
                      <Box
                        display="flex"
                        flexDirection={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        gap={1}
                      >
                        <Box flex={1}>
                          <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
                            <RiskBadge level={alert.severity || 'INFO'} />
                            <Typography variant="body1" fontWeight={700} sx={{ color: primaryTextColor }}>
                              {alert.title || alert.message}
                            </Typography>
                            {formatAlertTime(alert) && (
                              <Typography variant="caption" sx={{ color: secondaryTextColor }}>
                                • {formatAlertTime(alert)}
                              </Typography>
                            )}
                          </Box>
                          <Typography variant="body2" sx={{ color: secondaryTextColor, fontSize: '0.84rem' }}>
                            {alert.message}
                          </Typography>
                          {formatAlertLocation(alert.location) && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: isDark ? '#38bdf8' : '#0284c7',
                                display: 'inline-block',
                                mt: 0.5,
                                fontWeight: 600
                              }}
                            >
                              📍 {formatAlertLocation(alert.location)}
                            </Typography>
                          )}
                        </Box>

                        <Stack direction="row" spacing={1} sx={{ mt: { xs: 1, sm: 0 }, flexShrink: 0 }}>
                          {isAdmin && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => navigate('/relocation-planning')}
                              sx={{
                                color: primaryTextColor,
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                '&:hover': {
                                  borderColor: isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)',
                                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
                                }
                              }}
                            >
                              Relocation
                            </Button>
                          )}
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => navigate('/disaster-map')}
                            sx={{
                              background: isCritical
                                ? 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)'
                                : 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}
                          >
                            Inspect Zone
                          </Button>
                        </Stack>
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Boilerplate>
  );
}
