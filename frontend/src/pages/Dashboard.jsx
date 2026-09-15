import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Paper,
  Box,
  Button,
  Fade,
  Select,
  MenuItem
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ThunderstormOutlinedIcon from '@mui/icons-material/ThunderstormOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import PhoneInTalkOutlinedIcon from '@mui/icons-material/PhoneInTalkOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';

import Boilerplate from '../layouts/Boilerplate';
import { getDashboardStats } from '../services/api';
import { getCurrentUser, getUserRole } from '../lib/auth';
import { useThemeMode } from '../context/ThemeContext';
import { useLocationContext, PRESET_DISTRICTS } from '../context/LocationContext';
import AdminOnlyModal from '../components/AdminOnlyModal';
import EmergencyContactsModal from '../components/EmergencyContactsModal';
import QuickActionModal from '../components/QuickActionModal';

// Pixel-perfect SVG Donut Chart that NEVER collapses
function RiskDonutChart({ isDark, total = 322, low = 184, med = 84, high = 54 }) {
  const r = 48;
  const c = 2 * Math.PI * r; // ~301.59
  const sum = (low + med + high) || total || 1;
  const greenLen = c * (low / sum);
  const amberLen = c * (med / sum);
  const redLen = c * (high / sum);

  return (
    <Box sx={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <g transform="rotate(-90 70 70)">
          {/* Base background ring */}
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke={isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}
            strokeWidth="16"
          />
          {/* Green Segment (Low Risk) */}
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke="#10b981"
            strokeWidth="16"
            strokeDasharray={`${greenLen} ${c}`}
            strokeDashoffset="0"
          />
          {/* Amber Segment (Medium Risk) */}
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="16"
            strokeDasharray={`${amberLen} ${c}`}
            strokeDashoffset={-greenLen}
          />
          {/* Red Segment (High Risk) */}
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke="#ef4444"
            strokeWidth="16"
            strokeDasharray={`${redLen} ${c}`}
            strokeDashoffset={-(greenLen + amberLen)}
          />
        </g>
        {/* Center Numbers */}
        <text
          x="70"
          y="68"
          textAnchor="middle"
          fill={isDark ? '#f8fafc' : '#0f172a'}
          fontSize="22"
          fontWeight="800"
          fontFamily="inherit"
        >
          {total}
        </text>
        <text
          x="70"
          y="84"
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="10.5"
          fontWeight="600"
          fontFamily="inherit"
        >
          Total Zones
        </text>
      </svg>
    </Box>
  );
}

// Pixel-perfect SVG Area Chart that NEVER collapses
function RiskTrendAreaChart({ isDark }) {
  const points = [
    { x: 30, y: 110 },
    { x: 65, y: 98 },
    { x: 105, y: 102 },
    { x: 145, y: 88 },
    { x: 180, y: 55 },
    { x: 215, y: 38 },
    { x: 250, y: 62 },
    { x: 285, y: 60 },
    { x: 325, y: 72 },
  ];

  const linePath = `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`;
  const areaPath = `M ${points[0].x},130 L ${points.map((p) => `${p.x},${p.y}`).join(' L ')} L ${points[points.length - 1].x},130 Z`;

  const gridLines = [
    { label: '100', y: 30 },
    { label: '75', y: 55 },
    { label: '50', y: 80 },
    { label: '25', y: 105 },
    { label: '0', y: 130 },
  ];

  return (
    <Box sx={{ width: '100%', height: 160, overflow: 'hidden' }}>
      <svg width="100%" height="160" viewBox="0 0 350 160" preserveAspectRatio="none">
        <defs>
          <linearGradient id="redAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid lines & Y Axis */}
        {gridLines.map((g) => (
          <g key={g.label}>
            <text x="5" y={g.y + 3.5} fill="#94a3b8" fontSize="9.5" fontFamily="inherit">
              {g.label}
            </text>
            <line
              x1="26"
              y1={g.y}
              x2="345"
              y2={g.y}
              stroke={isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'}
              strokeDasharray="2 2"
            />
          </g>
        ))}

        {/* Gradient fill area */}
        <path d={areaPath} fill="url(#redAreaGrad)" />

        {/* Red Curve line */}
        <path
          d={linePath}
          fill="none"
          stroke="#ef4444"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Point dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#ef4444" stroke="#ffffff" strokeWidth="1.2" />
        ))}

        {/* X Axis time labels */}
        <text x="30" y="148" fill="#94a3b8" fontSize="9.5" textAnchor="middle" fontFamily="inherit">
          00:00
        </text>
        <text x="125" y="148" fill="#94a3b8" fontSize="9.5" textAnchor="middle" fontFamily="inherit">
          06:00
        </text>
        <text x="225" y="148" fill="#94a3b8" fontSize="9.5" textAnchor="middle" fontFamily="inherit">
          12:00
        </text>
        <text x="315" y="148" fill="#94a3b8" fontSize="9.5" textAnchor="middle" fontFamily="inherit">
          18:00
        </text>
      </svg>
    </Box>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { isDark } = useThemeMode();
  const { location, switchLocation, presets } = useLocationContext();
  const user = getCurrentUser() || { name: 'Admin User', role: 'ADMIN' };
  const role = getUserRole();
  const isAdmin = ["ADMIN", "ADMINISTRATOR"].includes(role);

  const [openAdminModal, setOpenAdminModal] = useState(false);
  const [adminFeatureName, setAdminFeatureName] = useState('');
  const [openEmergencyModal, setOpenEmergencyModal] = useState(false);
  const [openQuickModal, setOpenQuickModal] = useState(false);
  const [selectedQuickAction, setSelectedQuickAction] = useState(null);

  const [stats, setStats] = useState(null);
  const [currentTime, setCurrentTime] = useState('');

  const locationName = location?.name || location?.district || 'Gautam Buddha Nagar (Uttar Pradesh)';

  const matchedPreset = (presets || PRESET_DISTRICTS).find(
    (p) =>
      p.id === location?.id ||
      (location?.district && p.district.toLowerCase() === location.district.toLowerCase()) ||
      (location?.name && location.name.toLowerCase().includes(p.district.toLowerCase())) ||
      (location?.district && location.district.toLowerCase().includes(p.district.toLowerCase())) ||
      (location?.name && location.name.toLowerCase().includes(p.id))
  );
  const activePresetId = matchedPreset?.id || (location?.id && (presets || PRESET_DISTRICTS).some(p => p.id === location.id) ? location.id : PRESET_DISTRICTS[0]?.id);

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

  useEffect(() => {
    let cancelled = false;
    const targetDistrict = location?.district || (location?.name ? location.name.split('(')[0].trim() : '');
    const targetState = location?.state || '';

    getDashboardStats({
      district: targetDistrict,
      state: targetState,
      lat: location?.lat,
      lng: location?.lng
    })
      .then((res) => {
        if (!cancelled && res?.data?.data) {
          setStats(res.data.data);
        }
      })
      .catch((err) => {
        console.warn('Failed to load localized dashboard stats:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [location?.district, location?.name, location?.state, location?.lat, location?.lng]);

  const activeAlertsCount = stats?.alerts?.total ?? stats?.activeAlerts ?? 0;
  const criticalAlertsCount = stats?.alerts?.critical ?? stats?.criticalAlerts ?? 0;
  const sheltersReady = stats?.shelters?.available ?? stats?.sheltersOperational ?? 0;
  const totalShelters = stats?.shelters?.total ?? stats?.totalShelters ?? 0;
  const shelterOccupied = stats?.shelters?.occupied ?? stats?.telemetry?.occupiedShelterCount ?? 0;
  const shelterReadyPercent = totalShelters > 0 ? Math.round((sheltersReady / totalShelters) * 100) : 0;
  const populationAtRisk = stats?.populationAtRisk ?? 0;
  const reportsCount = stats?.reports?.last24h ?? stats?.reports24h ?? 0;
  const verifiedReportsCount = stats?.reports?.verified ?? 0;

  const riverName = stats?.telemetry?.riverName || 'River Basin Gauge';
  const riverLevel = stats?.telemetry?.riverLevel || 'Normal Level';
  const riverTrend = stats?.telemetry?.riverTrend || '(Steady)';
  const riverStatus = stats?.telemetry?.riverStatus || 'Normal';
  const isRiverCritical = riverStatus === 'Critical' || riverStatus === 'Warning' || riverStatus === 'Danger';
  const activeSectors = stats?.telemetry?.activeSectors ?? 2;
  const criticalSectors = stats?.telemetry?.criticalSectors ?? 0;
  const rainfall = stats?.telemetry?.rainfall || '0.0mm (None)';

  const totalHazardZones = stats?.hazards?.total ?? (criticalAlertsCount > 0 ? 4 : 8);
  const highRiskZones = stats?.hazards?.critical ?? (criticalAlertsCount > 0 ? 1 : 0);
  const medRiskZones = stats?.hazards?.medium ?? (criticalAlertsCount > 0 ? 1 : 2);
  const lowRiskZones = stats?.hazards?.low ?? Math.max(0, totalHazardZones - highRiskZones - medRiskZones);

  const lowPercent = totalHazardZones > 0 ? Math.min(100, Math.round((lowRiskZones / totalHazardZones) * 100)) : 0;
  const medPercent = totalHazardZones > 0 ? Math.min(100, Math.round((medRiskZones / totalHazardZones) * 100)) : 0;
  const highPercent = totalHazardZones > 0 ? Math.min(100, Math.round((highRiskZones / totalHazardZones) * 100)) : 0;

  const cardBg = isDark ? '#111827' : '#ffffff';
  const cardBorder = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1f5f9';
  const cardShadow = isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.03)';
  const textPrimary = isDark ? '#f9fafb' : '#0f172a';
  const textSecondary = isDark ? '#9ca3af' : '#64748b';
  const textMuted = isDark ? '#6b7280' : '#94a3b8';

  const quickActionsList = [
    {
      id: 'citizen-reports',
      title: 'Citizen Reports Overview',
      cardTitle: 'Citizen Reports',
      subtitle: 'Crowdsourced field observations & incident telemetry',
      icon: <DescriptionOutlinedIcon sx={{ color: '#3b82f6', fontSize: 22 }} />,
      color: '#3b82f6',
      bgLight: '#dbeafe',
      bgDark: 'rgba(59,130,246,0.18)',
      targetPath: '/citizen-reports',
      targetLabel: 'Go to Citizen Reports Page',
      adminRequired: false,
      stats: [
        { label: '24h Total Reports', value: reportsCount, color: '#3b82f6' },
        { label: 'Verified Reports', value: verifiedReportsCount, color: '#10b981' },
        { label: 'Active Sectors', value: activeSectors, color: '#f59e0b' }
      ],
      details: [
        { label: 'Waterlogging & Inundation', value: '45% of total reports', badge: 'High Activity', badgeColor: '#ef4444', badgeBg: 'rgba(239, 68, 68, 0.15)' },
        { label: 'Infrastructure & Road Obstructions', value: '25% of total reports', badge: 'Active Desk', badgeColor: '#f97316', badgeBg: 'rgba(249, 115, 22, 0.15)' },
        { label: 'Emergency Medical & Power Deficit', value: '30% of total reports', badge: 'Dispatched', badgeColor: '#10b981', badgeBg: 'rgba(16, 185, 129, 0.15)' },
        { label: 'Latest Incident Verification', value: `${locationName} Telemetry Sync Verified`, color: '#0284c7' }
      ]
    },
    {
      id: 'emergency-contacts',
      cardTitle: 'Emergency Contacts',
      icon: <PhoneInTalkOutlinedIcon sx={{ color: '#16a34a', fontSize: 22 }} />,
      color: '#10b981',
      bgLight: '#dcfce7',
      bgDark: 'rgba(34,197,94,0.18)',
      isEmergency: true,
    },
    {
      id: 'shelter-capacity',
      title: 'Shelter Capacity & Relief Operations',
      cardTitle: 'Shelter Capacity',
      subtitle: 'Relief center readiness, bed occupancy & supply intake',
      icon: <HomeWorkOutlinedIcon sx={{ color: '#0d9488', fontSize: 22 }} />,
      color: '#0d9488',
      bgLight: '#ccfbf1',
      bgDark: 'rgba(13,148,136,0.18)',
      targetPath: '/carrying-capacity',
      targetLabel: 'Go to Shelter Capacity Page',
      adminRequired: true,
      stats: [
        { label: 'Shelters Ready', value: `${sheltersReady} / ${totalShelters}`, color: '#0d9488' },
        { label: 'Occupancy Rate', value: `${shelterReadyPercent}%`, color: '#10b981' },
        { label: 'Current Occupied', value: shelterOccupied.toLocaleString(), color: '#ea580c' }
      ],
      details: [
        { label: 'District Central Relief Shelter', value: '120 Beds Occupied / 250 Capacity', badge: 'Operational', badgeColor: '#10b981', badgeBg: 'rgba(16, 185, 129, 0.15)' },
        { label: 'North Community Center Shelter', value: '60 Beds Occupied / 150 Capacity', badge: 'Available', badgeColor: '#0284c7', badgeBg: 'rgba(2, 132, 199, 0.15)' },
        { label: 'Emergency Rations & Food Supplies', value: 'Sufficient for 7 Days Intake', badge: 'Stocked', badgeColor: '#10b981', badgeBg: 'rgba(16, 185, 129, 0.15)' },
        { label: 'Medical First-Aid & Hygiene Kits', value: '100% Deployed across all active shelters', color: '#0d9488' }
      ]
    },
    {
      id: 'early-warnings',
      title: 'Early Warnings & Active Alerts',
      cardTitle: 'Early Warnings',
      subtitle: 'Hydrological telemetry, severe weather & risk level advisories',
      icon: <NotificationsActiveOutlinedIcon sx={{ color: '#f59e0b', fontSize: 22 }} />,
      color: '#f59e0b',
      bgLight: '#ffedd5',
      bgDark: 'rgba(245,158,11,0.18)',
      targetPath: '/disaster-map',
      targetLabel: 'Go to Early Warnings Page',
      adminRequired: false,
      stats: [
        { label: 'Active Alerts', value: activeAlertsCount, color: '#ef4444' },
        { label: 'Critical Level', value: criticalAlertsCount, color: '#ea580c' },
        { label: 'Risk Score', value: '70 (Elevated)', color: '#f59e0b' }
      ],
      details: [
        { label: `${riverName} Gauge Status`, value: `${riverLevel} ${riverTrend}`, badge: 'Surge Warning', badgeColor: '#ef4444', badgeBg: 'rgba(239, 68, 68, 0.15)' },
        { label: 'Rainfall & Cloudburst Telemetry', value: rainfall, badge: 'Watch Active', badgeColor: '#f59e0b', badgeBg: 'rgba(245, 158, 11, 0.15)' },
        { label: 'Critical Hazard Sectors', value: `${criticalSectors} Sectors High Threat`, color: '#ef4444' },
        { label: 'Automatic Siren Broadcast System', value: 'Live Telemetry Stream Active', badge: 'ONLINE', badgeColor: '#10b981', badgeBg: 'rgba(16, 185, 129, 0.15)' }
      ]
    },
    {
      id: 'simulation',
      title: '"What-If?" Disaster Risk Simulation',
      cardTitle: 'What If? Simulation',
      subtitle: 'Hydrodynamic inundation models & predictive evacuation scenarios',
      icon: <ScienceOutlinedIcon sx={{ color: '#9333ea', fontSize: 22 }} />,
      color: '#9333ea',
      bgLight: '#f3e8ff',
      bgDark: 'rgba(147,51,234,0.18)',
      targetPath: '/simulation',
      targetLabel: 'Go to Simulation Page',
      adminRequired: true,
      stats: [
        { label: 'Model Accuracy', value: '96.4%', color: '#9333ea' },
        { label: 'Simulated Inundation', value: '+2.8m Surge', color: '#ef4444' },
        { label: 'Evacuation Lead Time', value: '45 Mins', color: '#0284c7' }
      ],
      details: [
        { label: 'Active Hydro Dynamic Scenario Engine', value: 'Multi-Factor Cloudburst & Dam Breach', badge: 'Ready', badgeColor: '#9333ea', badgeBg: 'rgba(147, 51, 234, 0.15)' },
        { label: 'Projected Population at Risk', value: `${populationAtRisk.toLocaleString()} Citizens`, color: '#ef4444' },
        { label: 'High-Vulnerability Sectors', value: 'Sector 3 & Ramghat Basin Lowlands', badge: 'Critical', badgeColor: '#ef4444', badgeBg: 'rgba(239, 68, 68, 0.15)' },
        { label: 'Relocation Strategy Optimizer', value: 'Automated Evacuation Route Calculation', badge: 'Enabled', badgeColor: '#10b981', badgeBg: 'rgba(16, 185, 129, 0.15)' }
      ]
    }
  ];

  const handleOpenQuickAction = (act) => {
    if (act.isEmergency) {
      setOpenEmergencyModal(true);
    } else {
      setSelectedQuickAction(act);
      setOpenQuickModal(true);
    }
  };

  const handleNavigateFromQuickAction = (targetPath, adminRequired) => {
    if (adminRequired && !isAdmin) {
      setAdminFeatureName(selectedQuickAction?.title || 'This feature');
      setOpenAdminModal(true);
    } else {
      navigate(targetPath);
    }
  };

  const recentAlerts = (stats?.recentAlerts && stats.recentAlerts.length > 0)
    ? stats.recentAlerts.map((alert) => {
        let icon = <WarningAmberIcon sx={{ color: '#ef4444', fontSize: 20 }} />;
        let iconBg = isDark ? 'rgba(239,68,68,0.2)' : '#fee2e2';
        if (alert.severity === 'WARNING' || alert.severity === 'HIGH') {
          icon = <ThunderstormOutlinedIcon sx={{ color: '#f97316', fontSize: 20 }} />;
          iconBg = isDark ? 'rgba(249,115,22,0.2)' : '#ffedd5';
        } else if (alert.severity === 'INFO' || alert.severity === 'LOW') {
          icon = <InfoOutlinedIcon sx={{ color: '#3b82f6', fontSize: 20 }} />;
          iconBg = isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe';
        }
        return {
          id: alert.id || alert._id,
          title: alert.title,
          subtitle: alert.subtitle,
          time: alert.time || '1h ago',
          icon,
          iconBg,
        };
      })
    : [
        {
          id: 'alert-1',
          title: 'High Flood Risk',
          subtitle: `${riverName} telemetry monitored in ${locationName}`,
          time: '2h ago',
          icon: <WarningAmberIcon sx={{ color: '#ef4444', fontSize: 20 }} />,
          iconBg: isDark ? 'rgba(239,68,68,0.2)' : '#fee2e2',
        },
        {
          id: 'alert-2',
          title: 'Heavy Rainfall Forecast',
          subtitle: `${rainfall} in active sectors`,
          time: '4h ago',
          icon: <ThunderstormOutlinedIcon sx={{ color: '#f97316', fontSize: 20 }} />,
          iconBg: isDark ? 'rgba(249,115,22,0.2)' : '#ffedd5',
        },
        {
          id: 'alert-3',
          title: 'Low-Lying Areas Advisory',
          subtitle: `${sheltersReady} shelters operational`,
          time: '6h ago',
          icon: <InfoOutlinedIcon sx={{ color: '#3b82f6', fontSize: 20 }} />,
          iconBg: isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe',
        },
      ];

  return (
    <Boilerplate>
      <Fade in timeout={300}>
        <Box sx={{ width: '100%', mx: 'auto', pb: 3 }}>
          {/* ── 1. Top Cockpit Header ── */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 2.2,
              gap: 2,
            }}
          >
            {/* Left title & subtitle */}
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="h4"
                sx={{
                  color: textPrimary,
                  fontSize: { xs: '1.5rem', sm: '1.85rem' },
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                Crisis Decision Cockpit
              </Typography>
              <Typography
                variant="body2"
                component="div"
                sx={{
                  color: textSecondary,
                  mt: 0.6,
                  fontWeight: 500,
                  fontSize: '0.86rem',
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 0.8
                }}
              >
                <span>Welcome back, <strong style={{ color: textPrimary }}>{user?.name || 'Admin User'}</strong> • Monitoring</span>
                <Select
                  size="small"
                  value={activePresetId}
                  onChange={(e) => {
                    const p = (presets || PRESET_DISTRICTS).find((item) => item.id === e.target.value);
                    if (p) {
                      switchLocation(p.district, p.state);
                    } else {
                      switchLocation(e.target.value);
                    }
                  }}
                  variant="standard"
                  disableUnderline
                  sx={{
                    color: '#0284c7',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    bgcolor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe',
                    borderRadius: 1.5,
                    px: 1,
                    py: 0.2,
                    border: '1px solid rgba(2, 132, 199, 0.3)',
                    '& .MuiSelect-select': { py: 0.1, pr: '22px !important' },
                    '& .MuiSvgIcon-root': { color: '#0284c7', right: 2 }
                  }}
                >
                  {(presets || PRESET_DISTRICTS).map((p) => (
                    <MenuItem key={p.id} value={p.id} sx={{ fontSize: '0.84rem', fontWeight: 600 }}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
              </Typography>
            </Box>

            {/* Right side live clock & button */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexShrink: 0,
                pt: 0.5,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.8,
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: textSecondary,
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{currentTime || '01:13:55 AM'}</span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    color: '#10b981',
                    fontWeight: 700,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: '#10b981',
                      boxShadow: '0 0 6px #10b981',
                    }}
                  />
                  Live
                </span>
              </Box>

              <Button
                variant="contained"
                startIcon={<MapOutlinedIcon sx={{ fontSize: 18 }} />}
                onClick={() => navigate('/disaster-map')}
                sx={{
                  bgcolor: '#0284c7',
                  color: '#ffffff',
                  textTransform: 'none',
                  borderRadius: '10px',
                  px: 2.2,
                  py: 0.85,
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(2,132,199,0.3)',
                  '&:hover': { bgcolor: '#0369a1' },
                }}
              >
                Live Map
              </Button>
            </Box>
          </Box>

          {/* ── 2. Quick Actions (Refined Spacing) ── */}
          <Box mb={2.8}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: textPrimary, mb: 1.2 }}>
              Quick Actions
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
                gap: 1.6,
              }}
            >
              {quickActionsList.map((act) => (
                <Paper
                  key={act.id}
                  elevation={0}
                  onClick={() => handleOpenQuickAction(act)}
                  sx={{
                    p: 1.4,
                    borderRadius: '12px',
                    bgcolor: cardBg,
                    border: cardBorder,
                    boxShadow: cardShadow,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.2,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      borderColor: act.color || '#0284c7',
                      boxShadow: `0 4px 14px ${act.color ? act.color + '25' : 'rgba(2,132,199,0.12)'}`,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '8px',
                      bgcolor: isDark ? act.bgDark : act.bgLight,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {act.icon}
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.8}>
                    <Typography sx={{ fontSize: '0.84rem', fontWeight: 700, color: textPrimary }}>
                      {act.cardTitle}
                    </Typography>
                    {act.adminRequired && !isAdmin && (
                      <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '1px 5px', borderRadius: 4, background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                        ADMIN
                      </span>
                    )}
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>

          {/* ── 3. Master KPI Row (3 Clean, Ready-To-Read Cards Without Sparkline Graphs) ── */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 2.2,
              mb: 3,
            }}
          >
            {/* Card 1: ACTIVE ALERTS */}
            <Paper
              elevation={0}
              sx={{
                p: 2.2,
                borderRadius: '16px',
                bgcolor: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: '12px',
                    bgcolor: isDark ? 'rgba(239,68,68,0.18)' : '#fee2e2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <WarningAmberIcon sx={{ color: '#ef4444', fontSize: 26 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    ACTIVE ALERTS
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
                    <Typography sx={{ fontSize: '1.85rem', fontWeight: 800, color: textPrimary, lineHeight: 1 }}>
                      {activeAlertsCount}
                    </Typography>
                    <Box
                      sx={{
                        px: 1,
                        py: 0.3,
                        borderRadius: '10px',
                        bgcolor: 'rgba(239,68,68,0.1)',
                        color: '#ef4444',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                      {criticalAlertsCount} Critical
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  mt: 2,
                  pt: 1.4,
                  borderTop: cardBorder,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography sx={{ fontSize: '0.76rem', color: textMuted, fontWeight: 500 }}>
                  River Telemetry:
                </Typography>
                <Typography sx={{ fontSize: '0.76rem', color: textSecondary, fontWeight: 700 }}>
                  {riverName} <span style={{ color: isRiverCritical ? '#ef4444' : '#10b981' }}>{riverLevel} {riverTrend}</span>
                </Typography>
              </Box>
            </Paper>

            {/* Card 2: SHELTERS READY */}
            <Paper
              elevation={0}
              sx={{
                p: 2.2,
                borderRadius: '16px',
                bgcolor: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: '12px',
                    bgcolor: isDark ? 'rgba(34,197,94,0.18)' : '#dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <HomeWorkOutlinedIcon sx={{ color: '#16a34a', fontSize: 26 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    SHELTERS READY
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8, mt: 0.3 }}>
                    <Typography sx={{ fontSize: '1.85rem', fontWeight: 800, color: textPrimary, lineHeight: 1 }}>
                      {sheltersReady}
                    </Typography>
                    <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, color: textMuted }}>
                      / {totalShelters} Operational
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    px: 1,
                    py: 0.4,
                    borderRadius: '10px',
                    bgcolor: 'rgba(34,197,94,0.12)',
                    color: '#16a34a',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                  }}
                >
                  {shelterReadyPercent}% Ready
                </Box>
              </Box>

              <Box
                sx={{
                  mt: 2,
                  pt: 1.4,
                  borderTop: cardBorder,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography sx={{ fontSize: '0.76rem', color: textSecondary, display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
                  <strong>{shelterOccupied.toLocaleString()}</strong> Bed Occupancy
                </Typography>
                <Typography sx={{ fontSize: '0.76rem', color: textMuted }}>Operational Desk</Typography>
              </Box>
            </Paper>

            {/* Card 3: POPULATION AT RISK */}
            <Paper
              elevation={0}
              sx={{
                p: 2.2,
                borderRadius: '16px',
                bgcolor: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: '12px',
                    bgcolor: isDark ? 'rgba(249,115,22,0.18)' : '#ffedd5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <PeopleAltOutlinedIcon sx={{ color: '#f97316', fontSize: 26 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    POPULATION AT RISK
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
                    <Typography sx={{ fontSize: '1.85rem', fontWeight: 800, color: textPrimary, lineHeight: 1 }}>
                      {populationAtRisk.toLocaleString()}
                    </Typography>
                    <Box
                      sx={{
                        px: 0.9,
                        py: 0.3,
                        borderRadius: '10px',
                        bgcolor: 'rgba(249,115,22,0.1)',
                        color: '#ea580c',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.4,
                      }}
                    >
                      <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#ea580c' }} />
                      Threat &gt;= 60
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  mt: 2,
                  pt: 1.4,
                  borderTop: cardBorder,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography sx={{ fontSize: '0.76rem', color: textSecondary }}>
                  <strong>{activeSectors}</strong> Active Sectors
                </Typography>
                <Typography sx={{ fontSize: '0.76rem', color: textSecondary }}>
                  • <strong style={{ color: '#ef4444' }}>{criticalSectors} Critical</strong>
                </Typography>
              </Box>
            </Paper>
          </Box>

          {/* ── 4. Middle Tri-Panel Analytics (3 Clean Balanced Cards) ── */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1fr 1.2fr 1fr' },
              gap: 2.2,
              mb: 3,
            }}
          >
            {/* Panel 1: Risk Distribution */}
            <Paper
              elevation={0}
              sx={{
                p: 2.6,
                borderRadius: '16px',
                bgcolor: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: 275,
              }}
            >
              <Box>
                <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: textPrimary, mb: 2 }}>
                  Risk Distribution
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1 }}>
                  <RiskDonutChart
                    isDark={isDark}
                    total={totalHazardZones}
                    low={lowRiskZones}
                    med={medRiskZones}
                    high={highRiskZones}
                  />

                  <Box sx={{ flex: 1, pl: 3, display: 'flex', flexDirection: 'column', gap: 1.4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
                        <Typography sx={{ fontSize: '0.82rem', color: textSecondary, fontWeight: 500 }}>
                          Low Risk
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Typography sx={{ fontSize: '0.84rem', fontWeight: 800, color: textPrimary }}>
                          {lowRiskZones}
                        </Typography>
                        <Typography sx={{ fontSize: '0.78rem', color: textMuted }}>
                          {lowPercent}%
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                        <Typography sx={{ fontSize: '0.82rem', color: textSecondary, fontWeight: 500 }}>
                          Medium Risk
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Typography sx={{ fontSize: '0.84rem', fontWeight: 800, color: textPrimary }}>
                          {medRiskZones}
                        </Typography>
                        <Typography sx={{ fontSize: '0.78rem', color: textMuted }}>
                          {medPercent}%
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                        <Typography sx={{ fontSize: '0.82rem', color: textSecondary, fontWeight: 500 }}>
                          High Risk
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Typography sx={{ fontSize: '0.84rem', fontWeight: 800, color: textPrimary }}>
                          {highRiskZones}
                        </Typography>
                        <Typography sx={{ fontSize: '0.78rem', color: textMuted }}>
                          {highPercent}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ textAlign: 'center', pt: 1, borderTop: cardBorder }}>
                <Button
                  onClick={() => navigate('/risk-analysis')}
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
                  sx={{
                    textTransform: 'none',
                    color: '#0284c7',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    p: 0,
                    '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                  }}
                >
                  View full risk analysis
                </Button>
              </Box>
            </Paper>

            {/* Panel 2: 24-Hour Risk Score Trend */}
            <Paper
              elevation={0}
              sx={{
                p: 2.6,
                borderRadius: '16px',
                bgcolor: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: 275,
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: textPrimary }}>
                    24-Hour Risk Score Trend
                  </Typography>
                  <Box
                    sx={{
                      px: 1.2,
                      py: 0.35,
                      borderRadius: '8px',
                      bgcolor: isDark ? 'rgba(239,68,68,0.18)' : '#fff1f2',
                      border: '1px solid rgba(239,68,68,0.2)',
                      textAlign: 'right',
                    }}
                  >
                    <Typography sx={{ color: '#ef4444', fontWeight: 800, fontSize: '0.74rem', lineHeight: 1.1 }}>
                      Current: 70
                    </Typography>
                    <Typography sx={{ color: '#ef4444', fontWeight: 600, fontSize: '0.65rem' }}>
                      Elevated
                    </Typography>
                  </Box>
                </Box>

                <RiskTrendAreaChart isDark={isDark} />
              </Box>

              <Box sx={{ textAlign: 'center', pt: 1, borderTop: cardBorder }}>
                <Button
                  onClick={() => navigate('/forecasts')}
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
                  sx={{
                    textTransform: 'none',
                    color: '#0284c7',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    p: 0,
                    '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                  }}
                >
                  Detailed trend analysis
                </Button>
              </Box>
            </Paper>

            {/* Panel 3: Recent Alerts */}
            <Paper
              elevation={0}
              sx={{
                p: 2.6,
                borderRadius: '16px',
                bgcolor: cardBg,
                border: cardBorder,
                boxShadow: cardShadow,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: 275,
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.6 }}>
                  <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: textPrimary }}>
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

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                  {recentAlerts.map((alert) => (
                    <Box
                      key={alert.id}
                      onClick={() => navigate('/disaster-map')}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 0.9,
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                        '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc' },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4 }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '8px',
                            bgcolor: alert.iconBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {alert.icon}
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: '0.84rem', fontWeight: 700, color: textPrimary, lineHeight: 1.2 }}>
                            {alert.title}
                          </Typography>
                          <Typography sx={{ fontSize: '0.74rem', color: textSecondary }}>
                            {alert.subtitle}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                        <Typography sx={{ fontSize: '0.72rem', color: textMuted }}>
                          {alert.time}
                        </Typography>
                        <ChevronRightIcon sx={{ fontSize: 16, color: textMuted }} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box sx={{ pt: 1, borderTop: 'none' }} />
            </Paper>
          </Box>
        </Box>
      </Fade>

      {/* Admin Only Modal Popup */}
      <AdminOnlyModal
        open={openAdminModal}
        onClose={() => setOpenAdminModal(false)}
        featureName={adminFeatureName}
      />

      {/* Emergency Contacts Modal Popup */}
      <EmergencyContactsModal
        open={openEmergencyModal}
        onClose={() => setOpenEmergencyModal(false)}
      />

      {/* Quick Action Details Modal Popup with "Go to this page" Navigation */}
      <QuickActionModal
        open={openQuickModal}
        onClose={() => setOpenQuickModal(false)}
        action={selectedQuickAction}
        onNavigate={handleNavigateFromQuickAction}
      />
    </Boilerplate>
  );
}
