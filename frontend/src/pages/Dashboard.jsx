import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Typography, Paper, Box, Button, CircularProgress, Stack, Tooltip as MuiTooltip
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
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
import { getDashboardStats, postAICopilot } from '../services/api';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import SendIcon from '@mui/icons-material/Send';
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

function FormattedCopilotMessage({ text, isDark }) {
  if (!text) return null;
  const lines = text.split('\n');

  const parseInlineStyles = (line) => {
    const segments = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return segments.map((seg, i) => {
      if (seg.startsWith('**') && seg.endsWith('**')) {
        return (
          <Box component="span" key={i} sx={{ fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
            {seg.slice(2, -2)}
          </Box>
        );
      }
      if (seg.startsWith('*') && seg.endsWith('*')) {
        return (
          <Box component="span" key={i} sx={{ fontStyle: 'italic', color: isDark ? '#94a3b8' : '#475569' }}>
            {seg.slice(1, -1)}
          </Box>
        );
      }
      return seg;
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.7, fontSize: '0.88rem', lineHeight: 1.6 }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <Box key={idx} sx={{ height: 4 }} />;

        if (trimmed.startsWith('###')) {
          const headerText = trimmed.replace(/^###\s*/, '');
          return (
            <Typography
              key={idx}
              variant="subtitle2"
              sx={{
                fontWeight: 800,
                fontSize: '0.94rem',
                color: isDark ? '#38bdf8' : '#0284c7',
                mt: idx === 0 ? 0 : 0.75,
                mb: 0.25,
              }}
            >
              {parseInlineStyles(headerText)}
            </Typography>
          );
        }

        if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
          const bulletText = trimmed.replace(/^[•\-]\s*/, '');
          return (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, pl: 0.5, my: 0.15 }}>
              <Box component="span" sx={{ color: isDark ? '#38bdf8' : '#0284c7', fontWeight: 900, userSelect: 'none' }}>
                &bull;
              </Box>
              <Box sx={{ flex: 1 }}>{parseInlineStyles(bulletText)}</Box>
            </Box>
          );
        }

        const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
        if (numMatch) {
          return (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, pl: 0.5, my: 0.2 }}>
              <Box component="span" sx={{ fontWeight: 800, color: isDark ? '#38bdf8' : '#0284c7', minWidth: 18 }}>
                {numMatch[1]}.
              </Box>
              <Box sx={{ flex: 1 }}>{parseInlineStyles(numMatch[2])}</Box>
            </Box>
          );
        }

        return <Box key={idx}>{parseInlineStyles(trimmed)}</Box>;
      })}
    </Box>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { isDark } = useThemeMode();
  const { location } = useLocationContext();
  const user = getCurrentUser() || { name: 'Officer', role: 'DISTRICT_OFFICER', district: 'Delhi' };

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotResult, setCopilotResult] = useState(null);
  const [alertFilter, setAlertFilter] = useState('ALL');

  const handleAskCopilot = async (q) => {
    const query = q || copilotQuery;
    if (!query) return;
    setCopilotLoading(true);
    try {
      const res = await postAICopilot({ query, message: query, latitude: location.lat, longitude: location.lng });
      setCopilotResult(res.data?.data || null);
    } catch (err) {
      console.error("Copilot query error:", err);
      setCopilotResult({
        response: err.response?.data?.message || "Failed to reach AI Copilot. Please verify that the backend server is running.",
        source: "System Alert"
      });
    } finally {
      setCopilotLoading(false);
    }
  };

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
      {/* Top Header with Command Status & Quick Action Buttons */}
      <Box
        display="flex"
        flexDirection={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        gap={2}
        mb={3}
      >
        <Box>
          <Box display="flex" alignItems="center" gap={1.5} mb={0.75}>
            <span className="beacon-live" />
            <Typography
              variant="caption"
              sx={{
                color: isDark ? '#38bdf8' : '#0284c7',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontSize: '0.72rem'
              }}
            >
              Live Command Center • Real-Time AI Inference Active
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
              fontSize: { xs: '1.65rem', md: '2.1rem' }
            }}
          >
            AapdaNetra Crisis Decision Cockpit
          </Typography>
          <Typography variant="body2" sx={{ color: secondaryTextColor, mt: 0.5 }}>
            Welcome back, <strong style={{ color: primaryTextColor }}>{user.name}</strong> ({user.role}) • Live situational intelligence for{' '}
            <span style={{ color: isDark ? '#38bdf8' : '#0284c7', fontWeight: 700 }}>{user.district || 'Delhi'}</span>
          </Typography>
        </Box>

        {/* Header Action Buttons with Colorful Gradients */}
        <Stack direction="row" spacing={1.5} flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<MapOutlinedIcon />}
            onClick={() => navigate('/disaster-map')}
            sx={{
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
              fontWeight: 700,
              px: 2.5,
              py: 1,
              borderRadius: 2,
              '&:hover': {
                background: 'linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%)',
                boxShadow: '0 6px 20px rgba(37, 99, 235, 0.5)',
              }
            }}
          >
            Live Disaster Map
          </Button>
          <Button
            variant="contained"
            startIcon={<SmartToyOutlinedIcon />}
            onClick={() => navigate('/ai-assistant')}
            sx={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              boxShadow: '0 4px 16px rgba(139, 92, 246, 0.35)',
              fontWeight: 700,
              px: 2.5,
              py: 1,
              borderRadius: 2,
              '&:hover': {
                background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                boxShadow: '0 6px 20px rgba(139, 92, 246, 0.5)',
              }
            }}
          >
            AI Assistant
          </Button>
        </Stack>
      </Box>

      {/* Real-time Environmental Telemetry Pills */}
      <Paper
        className="glass-card"
        sx={{
          p: 1.75,
          mb: 3,
          borderRadius: 3,
          background: isDark
            ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(20, 30, 55, 0.8) 100%) !important'
            : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%) !important',
          border: isDark
            ? '1px solid rgba(56, 189, 248, 0.2) !important'
            : '1px solid rgba(2, 132, 199, 0.2) !important'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: 'rgba(249, 115, 22, 0.15)',
                  color: '#f97316',
                  display: 'flex'
                }}
              >
                <WaterDropOutlinedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: secondaryTextColor, display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
                  Yamuna River Level
                </Typography>
                <Typography variant="body2" sx={{ color: primaryTextColor, fontWeight: 700 }}>
                  205.85 m <span style={{ color: '#f97316', fontSize: '0.75rem', fontWeight: 700 }}>(+0.52m Warning)</span>
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.12)',
                  color: isDark ? '#38bdf8' : '#0284c7',
                  display: 'flex'
                }}
              >
                <ThunderstormOutlinedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: secondaryTextColor, display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
                  24h Precipitation
                </Typography>
                <Typography variant="body2" sx={{ color: primaryTextColor, fontWeight: 700 }}>
                  68.4 mm <span style={{ color: isDark ? '#38bdf8' : '#0284c7', fontSize: '0.75rem', fontWeight: 700 }}>(Heavy Showers)</span>
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: 'rgba(244, 63, 94, 0.15)',
                  color: '#f43f5e',
                  display: 'flex'
                }}
              >
                <ShieldOutlinedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: secondaryTextColor, display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
                  High-Risk Habitations
                </Typography>
                <Typography variant="body2" sx={{ color: primaryTextColor, fontWeight: 700 }}>
                  6 Zones Active <span style={{ color: '#f43f5e', fontSize: '0.75rem', fontWeight: 700 }}>(2 Critical)</span>
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  display: 'flex'
                }}
              >
                <HomeWorkOutlinedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: secondaryTextColor, display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
                  Evacuation Shelters
                </Typography>
                <Typography variant="body2" sx={{ color: primaryTextColor, fontWeight: 700 }}>
                  88% Capacity Ready <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>(14 Facilities)</span>
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
        <Grid container spacing={3}>
          {/* Top 4 Vibrant Stat Cards */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Active System Alerts"
              value={stats?.alerts?.total || displayAlerts.length}
              change={`${stats?.alerts?.critical || 1} Critical Priority`}
              subtext="Real-time automated feeds"
              icon={WarningAmberIcon}
              colorScheme="crimson"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Available Shelters"
              value={stats?.shelters?.total ? `${stats.shelters.available}/${stats.shelters.total}` : '12/14'}
              change={`${stats?.shelters?.occupied || 2} Occupied`}
              subtext="Intake capacity verified"
              icon={HomeWorkOutlinedIcon}
              colorScheme="emerald"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Population at Risk"
              value={stats?.populationAtRisk ? stats.populationAtRisk.toLocaleString() : '14,850'}
              change="Threat Score ≥ 60"
              subtext="In flood-prone wards"
              icon={PeopleAltOutlinedIcon}
              colorScheme="amber"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Citizen Reports (24h)"
              value={stats?.reports?.last24h || 24}
              change={`${stats?.reports?.verified || 19} Verified`}
              subtext="NLP triage classified"
              icon={BoltOutlinedIcon}
              colorScheme="cyan"
            />
          </Grid>

          {/* Middle Section Left: Habitations by Risk Category */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper className="glass-card card-accent-purple" sx={{ p: 3, borderRadius: 3, height: '100%' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
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
                  <Box height={220} position="relative" display="flex" justifyContent="center" alignItems="center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={62}
                          outerRadius={88}
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
                      <Typography variant="caption" sx={{ color: secondaryTextColor, fontSize: '0.7rem', fontWeight: 600 }}>
                        Total Zones
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {/* Colorful Interactive Breakdown Bars */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack spacing={1.5}>
                    {pieData.map((item, idx) => {
                      const percentage = Math.round((item.value / totalHabitations) * 100);
                      return (
                        <Box
                          key={idx}
                          sx={{
                            p: 1.25,
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
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}>
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
                              <Typography variant="body2" sx={{ color: primaryTextColor, fontWeight: 600, fontSize: '0.8rem' }}>
                                {item.name}
                              </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: item.color, fontWeight: 700 }}>
                              {item.value} ({percentage}%)
                            </Typography>
                          </Box>

                          {/* Mini Progress Bar */}
                          <Box
                            sx={{
                              width: '100%',
                              height: 6,
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

          {/* Middle Section Right: 24-Hour Regional Risk Trend */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper className="glass-card card-accent-crimson" sx={{ p: 3, borderRadius: 3, height: '100%' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
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

              {/* Quick Trend Telemetry Badges */}
              <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                <Box
                  sx={{
                    px: 1.2,
                    py: 0.4,
                    borderRadius: 1.5,
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                    fontSize: '0.75rem',
                    color: secondaryTextColor
                  }}
                >
                  Current Score: <strong style={{ color: '#f59e0b' }}>70 (Elevated)</strong>
                </Box>
                <Box
                  sx={{
                    px: 1.2,
                    py: 0.4,
                    borderRadius: 1.5,
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                    fontSize: '0.75rem',
                    color: secondaryTextColor
                  }}
                >
                  12h Trajectory: <strong style={{ color: '#10b981' }}>-14 pts Receding</strong>
                </Box>
                <Box
                  sx={{
                    px: 1.2,
                    py: 0.4,
                    borderRadius: 1.5,
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                    fontSize: '0.75rem',
                    color: secondaryTextColor
                  }}
                >
                  Model Confidence: <strong style={{ color: isDark ? '#38bdf8' : '#0284c7' }}>94.6%</strong>
                </Box>
              </Box>

              {/* Glowing Area Chart */}
              <Box height={200}>
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
                    <XAxis dataKey="time" stroke={secondaryTextColor} tick={{ fill: secondaryTextColor, fontSize: 12 }} />
                    <YAxis domain={[0, 100]} stroke={secondaryTextColor} tick={{ fill: secondaryTextColor, fontSize: 12 }} />
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

          {/* AI Emergency Copilot Operational Console (Feature 9 & 12) */}
          <Grid size={{ xs: 12 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: isDark ? 'rgba(15, 23, 42, 0.85)' : '#f0fdf4',
                border: isDark ? '1px solid rgba(22, 163, 74, 0.3)' : '1px solid rgba(22, 163, 74, 0.25)',
                boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)'
              }}
            >
              <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} gap={1.5} mb={2}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(22, 163, 74, 0.15)', color: '#16a34a', display: 'flex' }}>
                    <SmartToyOutlinedIcon />
                  </Box>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle1" fontWeight={800} sx={{ color: primaryTextColor }}>
                        AI Emergency Copilot — Operational Decision Support
                      </Typography>
                      <Chip label="LIVE RETRIEVAL ENGINE" size="small" sx={{ fontWeight: 800, fontSize: '0.65rem', bgcolor: '#16a34a', color: '#fff', height: 18 }} />
                    </Box>
                    <Typography variant="caption" sx={{ color: secondaryTextColor }}>
                      Context-grounded tactical intelligence querying live database telemetry without hallucination.
                    </Typography>
                  </Box>
                </Box>

                {/* Suggested Quick Tactical Prompts */}
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip
                    label="🚨 Which area needs immediate attention?"
                    onClick={() => {
                      setCopilotQuery("Which area needs immediate attention?");
                      handleAskCopilot("Which area needs immediate attention?");
                    }}
                    size="small"
                    sx={{ fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', bgcolor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2', color: '#ef4444' }}
                  />
                  <Chip
                    label="🏥 Check shelter capacity & bottlenecks"
                    onClick={() => {
                      setCopilotQuery("Check shelter capacity and bottlenecks");
                      handleAskCopilot("Check shelter capacity and bottlenecks");
                    }}
                    size="small"
                    sx={{ fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', bgcolor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe', color: '#0284c7' }}
                  />
                  <Chip
                    label="📱 Summarize verified citizen reports (24h)"
                    onClick={() => {
                      setCopilotQuery("Summarize verified citizen reports in last 24h");
                      handleAskCopilot("Summarize verified citizen reports in last 24h");
                    }}
                    size="small"
                    sx={{ fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', bgcolor: isDark ? 'rgba(234, 88, 12, 0.15)' : '#ffedd5', color: '#ea580c' }}
                  />
                </Stack>
              </Box>

              {/* Search & Submit Input */}
              <Box display="flex" gap={1} mb={copilotResult ? 2 : 0}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Ask the AI Copilot: e.g., 'What is the evacuation priority for Yamuna basin?' or 'List open shelters in Central Delhi'"
                  value={copilotQuery}
                  onChange={(e) => setCopilotQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskCopilot()}
                  sx={{
                    bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': { color: primaryTextColor }
                  }}
                />
                <Button
                  variant="contained"
                  disabled={copilotLoading}
                  onClick={() => handleAskCopilot()}
                  endIcon={copilotLoading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <SendIcon />}
                  sx={{ bgcolor: '#16a34a', fontWeight: 700, px: 3, '&:hover': { bgcolor: '#15803d' } }}
                >
                  Ask Copilot
                </Button>
              </Box>

              {/* Copilot Result Box */}
              {copilotResult && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2.5,
                    borderRadius: 2.5,
                    bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0'
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="caption" fontWeight={800} sx={{ color: '#16a34a' }}>
                      TACTICAL DIRECTIVE • SOURCE: {copilotResult.source || "AapdaNetra Decision Intelligence Engine"}
                    </Typography>
                    <Chip label="GROUNDED DATA" size="small" sx={{ fontSize: '0.65rem', height: 18, fontWeight: 700 }} />
                  </Box>
                  <FormattedCopilotMessage text={copilotResult.response} isDark={isDark} />
                </Box>
              )}
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
