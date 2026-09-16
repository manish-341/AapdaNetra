import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Box, Stack, Chip, Card, CardContent, InputBase, IconButton,
  LinearProgress, Collapse, Tooltip, Button, Grid, Alert, Snackbar,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import NavigationOutlinedIcon from '@mui/icons-material/NavigationOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import LandscapeOutlinedIcon from '@mui/icons-material/LandscapeOutlined';
import WavesOutlinedIcon from '@mui/icons-material/WavesOutlined';
import DomainDisabledOutlinedIcon from '@mui/icons-material/DomainDisabledOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CloseIcon from '@mui/icons-material/Close';

import Boilerplate from '../layouts/Boilerplate';
import { useThemeMode } from '../context/ThemeContext';

/* ── Enriched Habitation Data with Plain-Language Clarity ─── */
const ENRICHED_HABITATIONS = [
  {
    rank: 1,
    id: 'VH-01',
    cluster: 'Kunda Basti, Ward 7',
    zone: 'Flood Plain R-12',
    hazardType: 'Flash Flood & Inundation',
    hazardCategory: 'FLOOD',
    hazardIcon: WaterDropOutlinedIcon,
    hazardColor: '#ef4444',
    hazardBg: 'rgba(239, 68, 68, 0.12)',
    structureType: 'Kutcha (Mud, Bamboo & Tin)',
    structureCategory: 'KUTCHA',
    structureColor: '#f97316',
    structureNote: 'Extremely fragile unreinforced walls with 95% flood collapse risk.',
    score: 92,
    level: 'CRITICAL',
    statusLabel: 'IMMEDIATE EVACUATION',
    population: 312,
    households: 62,
    vulnerablePeople: '48 (children & elderly)',
    targetShelter: 'Safe Zone S-04 (Govt. Higher Secondary School)',
    shelterDistance: '1.8 km',
    evacuationRoute: 'East Bypass Road (Elevated Embankment)',
    riskFactors: [
      'Located within 40m of active Yamuna/Hindon river drainage corridor',
      'Unreinforced mud & bamboo walls cannot withstand flow velocities > 0.8 m/s',
      'Single access road submerges under 1.2m water during heavy upstream discharge',
    ],
    operationalDirectives: [
      'Pre-position 2 NDRF motorized inflatable rescue boats at Sector 14 staging node',
      'Issue door-to-door audio siren alert via Civil Defence volunteers',
      'Mobilize 3 State Transport evacuation buses at Primary School junction',
    ],
    nodalOfficer: 'Inspector S. K. Verma (M: +91-98765-43210)',
  },
  {
    rank: 2,
    id: 'VH-02',
    cluster: 'Nala Colony',
    zone: 'Landslide Zone L-4',
    hazardType: 'Steep Landslide & Slope Failure',
    hazardCategory: 'LANDSLIDE',
    hazardIcon: LandscapeOutlinedIcon,
    hazardColor: '#f43f5e',
    hazardBg: 'rgba(244, 63, 94, 0.12)',
    structureType: 'Semi-Pucca (Brick & Unreinforced Mortar)',
    structureCategory: 'SEMI_PUCCA',
    structureColor: '#eab308',
    structureNote: 'Brittle brickwork with weak foundation on 38° saturated incline.',
    score: 87,
    level: 'CRITICAL',
    statusLabel: 'IMMEDIATE RELOCATION',
    population: 198,
    households: 39,
    vulnerablePeople: '28 (children & elderly)',
    targetShelter: 'Hill Top Community Centre S-02',
    shelterDistance: '2.3 km',
    evacuationRoute: 'Ridge Highway via Northern Access Spur',
    riskFactors: [
      'Slope incline exceeds 38 degrees with over-saturated shale-clay strata',
      'Heavy rainwater runoff flows through natural drainage cut across settlement',
      'High danger of sudden nighttime mudslide triggered by prolonged rainfall',
    ],
    operationalDirectives: [
      'Issue mandatory night evacuation order before 18:00 IST',
      'Activate slope movement acoustic sensors and trigger local warning beacon',
      'Deploy earth-moving backhoes at Northern Access Spur to keep transit path open',
    ],
    nodalOfficer: 'Dr. R. C. Rawat (M: +91-98112-23344)',
  },
  {
    rank: 3,
    id: 'VH-03',
    cluster: 'Ghat Para',
    zone: 'Riverbank Erosion Zone E-03',
    hazardType: 'Riverbank Erosion & Soil Scour',
    hazardCategory: 'FLOOD',
    hazardIcon: WavesOutlinedIcon,
    hazardColor: '#f97316',
    hazardBg: 'rgba(249, 115, 22, 0.12)',
    structureType: 'Kutcha (Thatch, Tarpaulin & Wood)',
    structureCategory: 'KUTCHA',
    structureColor: '#f97316',
    structureNote: 'Temporary shelters built directly on soft alluvial silt embankment.',
    score: 64,
    level: 'HIGH',
    statusLabel: 'STAGE-2 PLANNED RELOCATION',
    population: 140,
    households: 28,
    vulnerablePeople: '22 (children & elderly)',
    targetShelter: 'New Township Transit Shelter S-01',
    shelterDistance: '3.1 km',
    evacuationRoute: 'South Link Road towards High Ground Ward 4',
    riskFactors: [
      'Riverbank receding at ~0.8m per peak hydro-discharge event',
      'Lack of rip-rap concrete geotextile embankment protection',
      'Erosion channel advancing within 15 meters of frontline dwellings',
    ],
    operationalDirectives: [
      'Barricade frontline erosion perimeter and erect danger signage',
      'Schedule daytime family transit to New Township Transit Shelter S-01',
      'Distribute dry ration packets and clean water jerrycans to pending households',
    ],
    nodalOfficer: 'Officer M. P. Sharma (M: +91-94550-12345)',
  },
  {
    rank: 4,
    id: 'VH-04',
    cluster: 'Station Road Settlement',
    zone: 'Transit Corridor S-08',
    hazardType: 'Urban Waterlogging & Drain Choke',
    hazardCategory: 'MODERATE',
    hazardIcon: DomainDisabledOutlinedIcon,
    hazardColor: '#eab308',
    hazardBg: 'rgba(234, 179, 8, 0.12)',
    structureType: 'Pucca (Reinforced Concrete Frame)',
    structureCategory: 'PUCCA',
    structureColor: '#10b981',
    structureNote: 'Solid masonry structure with concrete roof; minimal structural collapse risk.',
    score: 38,
    level: 'MODERATE',
    statusLabel: 'CONTINUOUS MONITORING',
    population: 85,
    households: 17,
    vulnerablePeople: '11 (children & elderly)',
    targetShelter: 'Multi-Purpose Hall S-05',
    shelterDistance: '0.9 km',
    evacuationRoute: 'Station Feeder Main Road',
    riskFactors: [
      'Depression basin prone to 0.4m street waterlogging during sudden thunderstorms',
      'Solid reinforced concrete construction ensures high structural survivability',
      'Municipal storm drain blockage can temporarily disrupt power & drinking water',
    ],
    operationalDirectives: [
      'Deploy municipal de-watering diesel pump sets at Station Road culvert',
      'Maintain hourly water gauge inspection during peak rain intervals',
      'Keep indoor shelter advisory active; no immediate forced evacuation needed',
    ],
    nodalOfficer: 'Eng. K. Nair (M: +91-97120-99887)',
  },
];

/* ── Color Helper with high-contrast light & dark modes ─── */
const getScoreTheme = (score, isDark) => {
  if (score >= 80) {
    return {
      main: isDark ? '#fb7185' : '#e11d48',
      bg: isDark ? 'rgba(244, 63, 94, 0.18)' : '#ffe4e6',
      border: isDark ? 'rgba(244, 63, 94, 0.45)' : '#fecdd3',
      text: isDark ? '#ffe4e6' : '#9f1239',
      gradient: 'linear-gradient(90deg, #f43f5e, #e11d48)',
      tag: 'Critical Threat',
      urgency: 'Immediate Evacuation',
    };
  }
  if (score >= 60) {
    return {
      main: isDark ? '#fb923c' : '#ea580c',
      bg: isDark ? 'rgba(249, 115, 22, 0.18)' : '#ffedd5',
      border: isDark ? 'rgba(249, 115, 22, 0.45)' : '#fed7aa',
      text: isDark ? '#ffedd5' : '#9a3412',
      gradient: 'linear-gradient(90deg, #f97316, #ea580c)',
      tag: 'High Risk',
      urgency: 'Priority Relocation',
    };
  }
  if (score >= 35) {
    return {
      main: isDark ? '#facc15' : '#ca8a04',
      bg: isDark ? 'rgba(234, 179, 8, 0.18)' : '#fef9c3',
      border: isDark ? 'rgba(234, 179, 8, 0.45)' : '#fef08a',
      text: isDark ? '#fef9c3' : '#854d0e',
      gradient: 'linear-gradient(90deg, #eab308, #ca8a04)',
      tag: 'Moderate Alert',
      urgency: 'Active Monitoring',
    };
  }
  return {
    main: isDark ? '#4ade80' : '#16a34a',
    bg: isDark ? 'rgba(34, 197, 94, 0.18)' : '#dcfce7',
    border: isDark ? 'rgba(34, 197, 94, 0.45)' : '#bbf7d0',
    text: isDark ? '#dcfce7' : '#14532d',
    gradient: 'linear-gradient(90deg, #22c55e, #16a34a)',
    tag: 'Safe Baseline',
    urgency: 'Standard Routine',
  };
};

/* ── Top Stat Card ───────────────────────────────────────── */
function StatCard({ icon: Icon, title, value, subtitle, color, isDark, active, onClick }) {
  return (
    <Card
      onClick={onClick}
      sx={{
        flex: 1,
        minWidth: 200,
        borderRadius: 3,
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        background: isDark
          ? `linear-gradient(145deg, rgba(20,30,52,0.85), rgba(11,18,33,0.95))`
          : '#ffffff',
        border: active
          ? `2px solid ${color}`
          : isDark
          ? '1px solid rgba(255,255,255,0.08)'
          : '1px solid #e2e8f0',
        boxShadow: active
          ? `0 0 20px ${color}35`
          : isDark
          ? '0 6px 20px rgba(0,0,0,0.35)'
          : '0 4px 14px rgba(0,0,0,0.04)',
        transition: 'all 0.25s ease',
        '&:hover': onClick
          ? {
              transform: 'translateY(-3px)',
              borderColor: color,
              boxShadow: `0 8px 24px ${color}25`,
            }
          : {},
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: color,
        },
      }}
    >
      <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: isDark ? '#94a3b8' : '#475569',
                fontWeight: 700,
                fontSize: '0.74rem',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                display: 'block',
                mb: 0.5,
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              fontWeight={800}
              sx={{
                color: isDark ? '#f8fafc' : '#0f172a',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography
                variant="caption"
                sx={{
                  color: isDark ? '#64748b' : '#64748b',
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  mt: 0.5,
                  display: 'block',
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2.5,
              background: `${color}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color,
              flexShrink: 0,
              border: `1px solid ${color}30`,
            }}
          >
            <Icon sx={{ fontSize: 22 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

/* ── Interactive Drill-down Component ─────────────────────── */
function HabitationDetails({ row, isDark, onTriggerAlert, onNavigateRoute }) {
  const st = getScoreTheme(row.score, isDark);
  const HazardIcon = row.hazardIcon;

  return (
    <Box
      sx={{
        py: 2.5,
        px: 3,
        my: 1.5,
        borderRadius: 3,
        background: isDark
          ? 'linear-gradient(180deg, rgba(15,23,42,0.9), rgba(11,18,33,0.95))'
          : 'linear-gradient(180deg, #f8fafc, #f1f5f9)',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #cbd5e1',
        boxShadow: isDark ? 'inset 0 1px 3px rgba(0,0,0,0.4)' : 'inset 0 1px 3px rgba(0,0,0,0.02)',
      }}
    >
      <Grid container spacing={2.5}>
        {/* Column 1: Vulnerability Breakdown & Physical Hazards */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0', height: '100%' }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: isDark ? '#f8fafc' : '#0f172a', display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <HazardIcon sx={{ fontSize: 18, color: row.hazardColor }} />
              Why is this settlement at risk?
            </Typography>
            <Stack spacing={1} mt={1}>
              {row.riskFactors.map((factor, idx) => (
                <Box key={idx} display="flex" alignItems="flex-start" gap={1}>
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: st.main,
                      mt: 0.8,
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#334155', fontSize: '0.8rem', lineHeight: 1.4 }}>
                    {factor}
                  </Typography>
                </Box>
              ))}
            </Stack>

            <Divider sx={{ my: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }} />

            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>
              Housing Fragility Analysis
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? '#e2e8f0' : '#1e293b', fontSize: '0.8rem', fontWeight: 600, mt: 0.5 }}>
              {row.structureNote}
            </Typography>
          </Box>
        </Grid>

        {/* Column 2: Relocation & Safe Shelter Directive */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0', height: '100%' }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: isDark ? '#f8fafc' : '#0f172a', display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <NavigationOutlinedIcon sx={{ fontSize: 18, color: '#38bdf8' }} />
              Designated Evacuation Target
            </Typography>

            <Box mt={1} p={1.5} borderRadius={2} sx={{ bgcolor: isDark ? 'rgba(56,189,248,0.08)' : '#f0f9ff', border: '1px solid rgba(56,189,248,0.25)' }}>
              <Typography variant="caption" sx={{ color: isDark ? '#38bdf8' : '#0284c7', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                Primary Safe Shelter
              </Typography>
              <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? '#f8fafc' : '#0369a1', mt: 0.25 }}>
                {row.targetShelter}
              </Typography>
              <Box display="flex" gap={2} mt={1}>
                <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#475569', fontWeight: 600 }}>
                  Distance: <strong>{row.shelterDistance}</strong>
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#475569', fontWeight: 600 }}>
                  Demographics: <strong>{row.households} Families</strong>
                </Typography>
              </Box>
            </Box>

            <Box mt={1.5}>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                Transit Route
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#334155', fontSize: '0.8rem', mt: 0.25 }}>
                {row.evacuationRoute}
              </Typography>
            </Box>

            <Box mt={1.5}>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                Nodal Field Officer
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#334155', fontSize: '0.8rem', fontWeight: 600, mt: 0.25 }}>
                {row.nodalOfficer}
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Column 3: Operational Directive & Quick Action Buttons */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ color: isDark ? '#f8fafc' : '#0f172a', display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <NotificationsActiveOutlinedIcon sx={{ fontSize: 18, color: st.main }} />
                Tactical Response Directives
              </Typography>

              <Stack spacing={0.75} mt={1}>
                {row.operationalDirectives.map((directive, idx) => (
                  <Box key={idx} display="flex" alignItems="flex-start" gap={1}>
                    <CheckCircleOutlinedIcon sx={{ fontSize: 14, color: '#10b981', mt: 0.3, flexShrink: 0 }} />
                    <Typography variant="caption" sx={{ color: isDark ? '#cbd5e1' : '#334155', fontSize: '0.76rem', lineHeight: 1.35 }}>
                      {directive}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>

            <Box mt={2}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<NavigationOutlinedIcon />}
                  onClick={() => onNavigateRoute(row)}
                  sx={{
                    flex: 1,
                    bgcolor: '#0284c7',
                    fontWeight: 700,
                    fontSize: '0.74rem',
                    textTransform: 'none',
                    py: 0.8,
                    borderRadius: 2,
                    '&:hover': { bgcolor: '#0369a1' },
                  }}
                >
                  Relocation Plan
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color={row.score >= 80 ? 'error' : 'warning'}
                  startIcon={<NotificationsActiveOutlinedIcon />}
                  onClick={() => onTriggerAlert(row)}
                  sx={{
                    flex: 1,
                    fontWeight: 700,
                    fontSize: '0.74rem',
                    textTransform: 'none',
                    py: 0.8,
                    borderRadius: 2,
                  }}
                >
                  Issue SMS Alert
                </Button>
              </Stack>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

/* ── Enhanced Table Row ──────────────────────────────────── */
function HabitationRow({ row, rank, isDark, onTriggerAlert, onNavigateRoute }) {
  const [open, setOpen] = useState(rank === 1); // Expand #1 by default for clear immediate context
  const st = getScoreTheme(row.score, isDark);
  const HazardIcon = row.hazardIcon;

  return (
    <>
      <TableRow
        onClick={() => setOpen(!open)}
        sx={{
          cursor: 'pointer',
          transition: 'all 0.18s ease',
          bgcolor: open
            ? isDark
              ? 'rgba(56,189,248,0.06)'
              : 'rgba(2,132,199,0.04)'
            : 'transparent',
          '&:hover': {
            bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
          },
        }}
      >
        {/* Rank & Indicator */}
        <TableCell sx={{ width: 68, py: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 2,
                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.84rem',
                color: isDark ? '#e2e8f0' : '#1e293b',
              }}
            >
              #{rank}
            </Box>
            {row.score >= 80 && (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: '#f43f5e',
                  boxShadow: '0 0 8px #f43f5e',
                  animation: 'pulse 1.8s infinite',
                }}
              />
            )}
          </Box>
        </TableCell>

        {/* Habitation Name & Zone */}
        <TableCell sx={{ py: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? '#f8fafc' : '#0f172a', fontSize: '0.92rem' }}>
              {row.cluster}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mt={0.3}>
              <Box display="flex" alignItems="center" gap={0.4}>
                <LocationOnIcon sx={{ fontSize: 13, color: isDark ? '#94a3b8' : '#64748b' }} />
                <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#475569', fontWeight: 600, fontSize: '0.74rem' }}>
                  {row.zone}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: isDark ? '#475569' : '#cbd5e1' }}>•</Typography>
              <Typography variant="caption" sx={{ color: isDark ? '#cbd5e1' : '#64748b', fontSize: '0.72rem' }}>
                Shelter: <strong>{row.shelterDistance}</strong>
              </Typography>
            </Box>
          </Box>
        </TableCell>

        {/* Hazard Exposure */}
        <TableCell sx={{ py: 2 }}>
          <Chip
            icon={<HazardIcon style={{ color: row.hazardColor, fontSize: 16 }} />}
            label={row.hazardType}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.75rem',
              bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
              color: isDark ? '#f1f5f9' : '#1e293b',
              py: 0.5,
              '& .MuiChip-label': { px: 1 },
            }}
          />
        </TableCell>

        {/* Housing Type */}
        <TableCell sx={{ py: 2 }}>
          <Tooltip title={row.structureNote} arrow>
            <Chip
              icon={<HomeWorkOutlinedIcon style={{ color: row.structureColor, fontSize: 15 }} />}
              label={row.structureType.split(' ')[0]} // Kutcha, Semi-Pucca, Pucca
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: '0.74rem',
                bgcolor: `${row.structureColor}15`,
                color: row.structureColor,
                border: `1px solid ${row.structureColor}35`,
              }}
            />
          </Tooltip>
        </TableCell>

        {/* Composite Risk Score */}
        <TableCell sx={{ py: 2, minWidth: 150 }}>
          <Box display="flex" alignItems="center" gap={1.2}>
            <Box sx={{ minWidth: 32, textAlign: 'right' }}>
              <Typography variant="body2" fontWeight={900} sx={{ color: st.main, lineHeight: 1, fontSize: '0.96rem' }}>
                {row.score}
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: '0.64rem', fontWeight: 600 }}>
                /100
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <LinearProgress
                variant="determinate"
                value={row.score}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background: st.gradient,
                  },
                }}
              />
              <Typography variant="caption" sx={{ color: st.main, fontSize: '0.68rem', fontWeight: 700, mt: 0.3, display: 'block' }}>
                {st.tag}
              </Typography>
            </Box>
          </Box>
        </TableCell>

        {/* Population & Households */}
        <TableCell sx={{ py: 2 }}>
          <Box>
            <Box display="flex" alignItems="center" gap={0.6}>
              <PeopleAltOutlinedIcon sx={{ fontSize: 16, color: isDark ? '#38bdf8' : '#0284c7' }} />
              <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
                {row.population.toLocaleString()}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.72rem', display: 'block', mt: 0.2 }}>
              {row.households} families ({row.vulnerablePeople.split(' ')[0]} vulnerable)
            </Typography>
          </Box>
        </TableCell>

        {/* Action Priority / Status */}
        <TableCell sx={{ py: 2 }}>
          <Chip
            label={row.statusLabel}
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: '0.7rem',
              bgcolor: st.bg,
              color: st.text,
              border: `1px solid ${st.border}`,
              letterSpacing: '0.02em',
            }}
          />
        </TableCell>

        {/* Expand Action */}
        <TableCell sx={{ py: 2, textAlign: 'right', width: 100 }}>
          <Button
            size="small"
            endIcon={open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            sx={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'none',
              color: open ? (isDark ? '#38bdf8' : '#0284c7') : isDark ? '#94a3b8' : '#64748b',
              bgcolor: open ? (isDark ? 'rgba(56,189,248,0.1)' : '#e0f2fe') : 'transparent',
              borderRadius: 2,
              px: 1,
            }}
          >
            {open ? 'Hide Plan' : 'View Plan'}
          </Button>
        </TableCell>
      </TableRow>

      {/* Expanded Accordion Container */}
      <TableRow>
        <TableCell colSpan={8} sx={{ py: 0, borderBottom: open ? undefined : 'none' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <HabitationDetails
              row={row}
              isDark={isDark}
              onTriggerAlert={onTriggerAlert}
              onNavigateRoute={onNavigateRoute}
            />
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

/* ── Visual Card Grid Item ───────────────────────────────── */
function HabitationCard({ row, rank, isDark, onTriggerAlert, onNavigateRoute }) {
  const [open, setOpen] = useState(false);
  const st = getScoreTheme(row.score, isDark);
  const HazardIcon = row.hazardIcon;

  return (
    <Card
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        background: isDark
          ? 'linear-gradient(145deg, rgba(20,30,52,0.75), rgba(11,18,33,0.9))'
          : '#ffffff',
        border: `1px solid ${open ? st.main : isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
        boxShadow: open
          ? `0 8px 24px ${st.main}20`
          : isDark
          ? '0 4px 16px rgba(0,0,0,0.3)'
          : '0 2px 10px rgba(0,0,0,0.04)',
        transition: 'all 0.25s ease',
      }}
    >
      <Box sx={{ height: 4, background: st.gradient }} />
      <CardContent sx={{ p: 2.5, pb: 1.5 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1.5,
                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.8rem',
                color: isDark ? '#cbd5e1' : '#475569',
              }}
            >
              #{rank}
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? '#f8fafc' : '#0f172a', lineHeight: 1.2 }}>
                {row.cluster}
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                {row.zone}
              </Typography>
            </Box>
          </Box>
          <Box textAlign="right">
            <Typography variant="h5" fontWeight={900} sx={{ color: st.main, lineHeight: 1 }}>
              {row.score}
            </Typography>
            <Typography variant="caption" sx={{ color: st.main, fontWeight: 700, fontSize: '0.68rem' }}>
              {st.tag}
            </Typography>
          </Box>
        </Box>

        {/* Hazard & Housing Badges */}
        <Box display="flex" gap={1} flexWrap="wrap" mt={2}>
          <Chip
            icon={<HazardIcon style={{ color: row.hazardColor, fontSize: 15 }} />}
            label={row.hazardType}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.72rem',
              bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
              color: isDark ? '#f1f5f9' : '#1e293b',
            }}
          />
          <Chip
            icon={<HomeWorkOutlinedIcon style={{ color: row.structureColor, fontSize: 14 }} />}
            label={row.structureType.split(' ')[0]}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.72rem',
              bgcolor: `${row.structureColor}15`,
              color: row.structureColor,
              border: `1px solid ${row.structureColor}30`,
            }}
          />
        </Box>

        {/* Demographics & Shelter */}
        <Box mt={2} p={1.5} borderRadius={2} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', border: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid #f1f5f9' }}>
          <Grid container spacing={1}>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.7rem', display: 'block' }}>
                POPULATION
              </Typography>
              <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
                {row.population} people ({row.households} families)
              </Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.7rem', display: 'block' }}>
                TARGET SHELTER
              </Typography>
              <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? '#38bdf8' : '#0284c7' }}>
                {row.targetShelter.split('(')[0]} ({row.shelterDistance})
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Directive Footer */}
        <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
          <Chip
            label={row.statusLabel}
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: '0.68rem',
              bgcolor: st.bg,
              color: st.text,
              border: `1px solid ${st.border}`,
            }}
          />
          <Button
            size="small"
            endIcon={open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            onClick={() => setOpen(!open)}
            sx={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'none',
              color: open ? (isDark ? '#38bdf8' : '#0284c7') : isDark ? '#94a3b8' : '#64748b',
            }}
          >
            {open ? 'Hide Plan' : 'Evacuation Plan'}
          </Button>
        </Box>

        {/* Collapsed Details */}
        <Collapse in={open} timeout="auto" unmountOnExit>
          <Box mt={2}>
            <HabitationDetails
              row={row}
              isDark={isDark}
              onTriggerAlert={onTriggerAlert}
              onNavigateRoute={onNavigateRoute}
            />
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function VulnerableHabitations() {
  const { isDark } = useThemeMode();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'FLOOD' | 'LANDSLIDE' | 'KUTCHA'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [showGuide, setShowGuide] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const rows = ENRICHED_HABITATIONS;

  /* Filter Logic */
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      // Category filter
      if (activeFilter === 'CRITICAL' && r.level !== 'CRITICAL') return false;
      if (activeFilter === 'FLOOD' && r.hazardCategory !== 'FLOOD') return false;
      if (activeFilter === 'LANDSLIDE' && r.hazardCategory !== 'LANDSLIDE') return false;
      if (activeFilter === 'KUTCHA' && r.structureCategory !== 'KUTCHA') return false;

      // Text Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesCluster = r.cluster.toLowerCase().includes(q);
        const matchesZone = r.zone.toLowerCase().includes(q);
        const matchesHazard = r.hazardType.toLowerCase().includes(q);
        const matchesStructure = r.structureType.toLowerCase().includes(q);
        const matchesShelter = r.targetShelter.toLowerCase().includes(q);
        if (!matchesCluster && !matchesZone && !matchesHazard && !matchesStructure && !matchesShelter) {
          return false;
        }
      }
      return true;
    });
  }, [rows, activeFilter, search]);

  /* Aggregate Stats */
  const totalPop = rows.reduce((s, r) => s + r.population, 0);
  const totalHouseholds = rows.reduce((s, r) => s + r.households, 0);
  const criticalCount = rows.filter((r) => r.level === 'CRITICAL').length;
  const criticalPop = rows.filter((r) => r.level === 'CRITICAL').reduce((s, r) => s + r.population, 0);
  const avgScore = Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length);

  /* Quick Actions */
  const handleTriggerAlert = (row) => {
    setToastMessage(`🚨 Urgent Evacuation SMS broadcast queued for ${row.cluster} (${row.population} residents). Alert dispatched to Civil Defence & Local Nodal Officer.`);
  };

  const handleNavigateRoute = (row) => {
    navigate('/relocation-planning');
  };

  return (
    <Boilerplate>
      {/* Toast Notification */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={5000}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToastMessage(null)}
          severity="warning"
          variant="filled"
          sx={{ width: '100%', fontWeight: 700, borderRadius: 2 }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>

      {/* Breadcrumb & Header */}
      <Box mb={2.5}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1.5}>
          <Box>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
              Operations &amp; Relocation &gt; Vulnerable Habitations Assessment
            </Typography>
            <Typography variant="h5" fontWeight={800} mt={0.25} sx={{ color: isDark ? '#f8fafc' : '#0f172a', letterSpacing: '-0.02em' }}>
              Vulnerable Habitations Assessment
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#475569', mt: 0.5, maxWidth: 840, fontSize: '0.88rem' }}>
              Priority inventory of informal settlements, flood-plain bastis, and unstable hillside habitations ranked by composite vulnerability. Drill down into physical hazards, housing fragility, and designated safe evacuation shelters.
            </Typography>
          </Box>

          {/* Quick Guide Toggle & Map View */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              startIcon={<HelpOutlineOutlinedIcon />}
              onClick={() => setShowGuide(!showGuide)}
              sx={{
                fontWeight: 700,
                fontSize: '0.78rem',
                textTransform: 'none',
                borderRadius: 2,
                color: showGuide ? '#0284c7' : isDark ? '#cbd5e1' : '#475569',
                borderColor: showGuide ? '#0284c7' : isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1',
                bgcolor: showGuide ? (isDark ? 'rgba(2,132,199,0.1)' : '#f0f9ff') : 'transparent',
              }}
            >
              {showGuide ? 'Hide Guide' : 'How Risk is Calculated'}
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<MapOutlinedIcon />}
              onClick={() => navigate('/disaster-map')}
              sx={{
                fontWeight: 700,
                fontSize: '0.78rem',
                textTransform: 'none',
                borderRadius: 2,
                bgcolor: '#0284c7',
                '&:hover': { bgcolor: '#0369a1' },
              }}
            >
              GIS Hazard Map
            </Button>
          </Stack>
        </Box>

        {/* Spacious, Easy-to-Read Explainer Guide */}
        <Collapse in={showGuide} timeout="auto">
          <Paper
            variant="outlined"
            sx={{
              mt: 2,
              p: { xs: 2, md: 3 },
              borderRadius: 3.5,
              bgcolor: isDark ? 'rgba(15,23,42,0.92)' : '#ffffff',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#cbd5e1',
              boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.45)' : '0 6px 20px rgba(0,0,0,0.06)',
            }}
          >
            {/* Guide Header */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2.5} pb={1.5} sx={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0' }}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: isDark ? '#f8fafc' : '#0f172a', display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.05rem' }}>
                  <HelpOutlineOutlinedIcon sx={{ fontSize: 22, color: '#38bdf8' }} />
                  How to Understand &amp; Use Habitation Risk Assessments
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', mt: 0.25, fontSize: '0.84rem' }}>
                  A plain-English operational guide for district relief commissioners, incident commanders, and field officers.
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setShowGuide(false)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  borderRadius: 2,
                  color: isDark ? '#94a3b8' : '#64748b',
                  borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1',
                  flexShrink: 0,
                  ml: 2,
                }}
              >
                Close Guide ✕
              </Button>
            </Box>

            {/* 3 Spacious Feature Cards */}
            <Grid container spacing={2.5}>
              {/* Card 1: Score & Thresholds */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 1, mb: 1, fontSize: '0.92rem' }}>
                      🎯 1. Composite Risk Score (0–100)
                    </Typography>
                    <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#334155', fontSize: '0.85rem', lineHeight: 1.6 }}>
                      Measures overall human danger by evaluating <strong>how close the settlement is to active hazards</strong>, <strong>how easily homes collapse</strong>, and <strong>how many residents need transport</strong>.
                    </Typography>
                  </Box>

                  <Stack spacing={0.75} mt={2} pt={1.5} sx={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0' }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip label="80 – 100" size="small" sx={{ bgcolor: '#ffe4e6', color: '#9f1239', fontWeight: 800, fontSize: '0.72rem', height: 22 }} />
                      <Typography variant="caption" sx={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 700, fontSize: '0.78rem' }}>
                        Critical: Immediate evacuation needed
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip label="60 – 79" size="small" sx={{ bgcolor: '#ffedd5', color: '#9a3412', fontWeight: 800, fontSize: '0.72rem', height: 22 }} />
                      <Typography variant="caption" sx={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 700, fontSize: '0.78rem' }}>
                        High: Prepare buses &amp; safe shelters
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip label="< 60" size="small" sx={{ bgcolor: '#fef9c3', color: '#854d0e', fontWeight: 800, fontSize: '0.72rem', height: 22 }} />
                      <Typography variant="caption" sx={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 700, fontSize: '0.78rem' }}>
                        Moderate/Low: Active monitoring
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Grid>

              {/* Card 2: Housing Types */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                    height: '100%',
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#f97316', display: 'flex', alignItems: 'center', gap: 1, mb: 1, fontSize: '0.92rem' }}>
                    🏚️ 2. Housing Fragility Types
                  </Typography>
                  <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#334155', fontSize: '0.85rem', lineHeight: 1.6, mb: 1.5 }}>
                    The physical structure dictates whether families can shelter in place or face total home destruction:
                  </Typography>

                  <Stack spacing={1.25}>
                    <Box>
                      <Typography variant="caption" fontWeight={800} sx={{ color: '#f43f5e', textTransform: 'uppercase', fontSize: '0.74rem' }}>
                        • Kutcha (Severe Collapse Risk)
                      </Typography>
                      <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#475569', fontSize: '0.8rem', lineHeight: 1.4 }}>
                        Built from mud, bamboo, unmortared stones, or thatch. Water quickly softens foundations, causing rapid structural collapse.
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" fontWeight={800} sx={{ color: '#eab308', textTransform: 'uppercase', fontSize: '0.74rem' }}>
                        • Semi-Pucca (Moderate Risk)
                      </Typography>
                      <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#475569', fontSize: '0.8rem', lineHeight: 1.4 }}>
                        Brick masonry with light mortar. Survives mild rain, but prone to sliding on steep, saturated slopes.
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" fontWeight={800} sx={{ color: '#10b981', textTransform: 'uppercase', fontSize: '0.74rem' }}>
                        • Pucca (High Resilience)
                      </Typography>
                      <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#475569', fontSize: '0.8rem', lineHeight: 1.4 }}>
                        Reinforced concrete (RCC) with solid foundations. Safe from ordinary urban flooding.
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Grid>

              {/* Card 3: Action Directives */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#0284c7', display: 'flex', alignItems: 'center', gap: 1, mb: 1, fontSize: '0.92rem' }}>
                      📋 3. How to Respond
                    </Typography>
                    <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#334155', fontSize: '0.85rem', lineHeight: 1.6 }}>
                      Every settlement includes an end-to-end tactical response plan tailored to local conditions:
                    </Typography>

                    <Stack spacing={1.25} mt={1.5}>
                      <Box display="flex" alignItems="flex-start" gap={1}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#0284c7', mt: 0.8, flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: '0.82rem', lineHeight: 1.4 }}>
                          Click <strong>"View Plan"</strong> to see designated shelters, route distance, and nodal officer contacts.
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="flex-start" gap={1}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#0284c7', mt: 0.8, flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: '0.82rem', lineHeight: 1.4 }}>
                          Click <strong>"Issue SMS Alert"</strong> to immediately broadcast warnings to local Civil Defence volunteers.
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="flex-start" gap={1}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#0284c7', mt: 0.8, flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: '0.82rem', lineHeight: 1.4 }}>
                          Click <strong>"Relocation Plan"</strong> to coordinate buses, shelter beds, and food logistics.
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<MapOutlinedIcon />}
                    onClick={() => navigate('/disaster-map')}
                    sx={{
                      mt: 2,
                      bgcolor: '#0284c7',
                      fontWeight: 700,
                      textTransform: 'none',
                      borderRadius: 2,
                      py: 0.8,
                      '&:hover': { bgcolor: '#0369a1' },
                    }}
                  >
                    Open Live GIS Disaster Map →
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Collapse>
      </Box>

      {/* Top Interactive KPI Cards */}
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 2.5 }}>
        <StatCard
          icon={ShieldOutlinedIcon}
          title="Monitored Clusters"
          value={`${rows.length} Settlements`}
          subtitle="All surveyed habitat zones"
          color="#38bdf8"
          isDark={isDark}
          active={activeFilter === 'ALL'}
          onClick={() => setActiveFilter('ALL')}
        />
        <StatCard
          icon={WarningAmberIcon}
          title="Critical Priority"
          value={`${criticalCount} Settlements`}
          subtitle={`${criticalPop} residents require urgent action`}
          color="#f43f5e"
          isDark={isDark}
          active={activeFilter === 'CRITICAL'}
          onClick={() => setActiveFilter(activeFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
        />
        <StatCard
          icon={PeopleAltOutlinedIcon}
          title="Total Population"
          value={totalPop.toLocaleString()}
          subtitle={`Across ~${totalHouseholds} family households`}
          color="#a855f7"
          isDark={isDark}
        />
        <StatCard
          icon={TrendingUpIcon}
          title="Avg. Vulnerability"
          value={`${avgScore}/100`}
          subtitle="High composite risk tier"
          color="#f97316"
          isDark={isDark}
        />
      </Stack>

      {/* Filter Tabs & Search Bar */}
      <Paper
        variant="outlined"
        sx={{
          mb: 2,
          p: 1.5,
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
          bgcolor: isDark ? 'rgba(17,24,39,0.7)' : '#ffffff',
          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
          boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        {/* Search Input */}
        <Box display="flex" alignItems="center" gap={1.25} flex={1} minWidth={260}>
          <SearchIcon sx={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: 22 }} />
          <InputBase
            placeholder="Search settlement name, ward, hazard zone, or housing type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              flex: 1,
              fontSize: '0.88rem',
              color: isDark ? '#f1f5f9' : '#0f172a',
              '& input::placeholder': { color: isDark ? '#64748b' : '#94a3b8', opacity: 1 },
            }}
          />
          {search && (
            <IconButton size="small" onClick={() => setSearch('')}>
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Box>

        {/* Quick Filter Pills */}
        <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
          {[
            { id: 'ALL', label: `All (${rows.length})` },
            { id: 'CRITICAL', label: `🚨 Critical Only (${criticalCount})`, color: '#f43f5e' },
            { id: 'FLOOD', label: `🌊 Flood Prone (2)` },
            { id: 'LANDSLIDE', label: `⛰️ Landslides (1)` },
            { id: 'KUTCHA', label: `🏚️ Kutcha Housing (2)` },
          ].map((tab) => {
            const isSelected = activeFilter === tab.id;
            return (
              <Chip
                key={tab.id}
                label={tab.label}
                size="small"
                onClick={() => setActiveFilter(tab.id)}
                sx={{
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  bgcolor: isSelected
                    ? tab.color || (isDark ? '#38bdf8' : '#0284c7')
                    : isDark
                    ? 'rgba(255,255,255,0.05)'
                    : '#f1f5f9',
                  color: isSelected
                    ? '#ffffff'
                    : isDark
                    ? '#cbd5e1'
                    : '#475569',
                  border: isSelected
                    ? 'none'
                    : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: isSelected
                      ? undefined
                      : isDark
                      ? 'rgba(255,255,255,0.1)'
                      : '#e2e8f0',
                  },
                }}
              />
            );
          })}
        </Stack>

        {/* Table / Cards View Mode Switcher */}
        <Box display="flex" alignItems="center" gap={0.5} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9', p: 0.5, borderRadius: 2 }}>
          <Tooltip title="Detailed Table View">
            <IconButton
              size="small"
              onClick={() => setViewMode('table')}
              sx={{
                borderRadius: 1.5,
                bgcolor: viewMode === 'table' ? (isDark ? '#0284c7' : '#ffffff') : 'transparent',
                color: viewMode === 'table' ? (isDark ? '#ffffff' : '#0284c7') : isDark ? '#94a3b8' : '#64748b',
                boxShadow: viewMode === 'table' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <ViewListOutlinedIcon sx={{ fontSize: 19 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Card Grid View">
            <IconButton
              size="small"
              onClick={() => setViewMode('cards')}
              sx={{
                borderRadius: 1.5,
                bgcolor: viewMode === 'cards' ? (isDark ? '#0284c7' : '#ffffff') : 'transparent',
                color: viewMode === 'cards' ? (isDark ? '#ffffff' : '#0284c7') : isDark ? '#94a3b8' : '#64748b',
                boxShadow: viewMode === 'cards' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <GridViewOutlinedIcon sx={{ fontSize: 19 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Main Content Area */}
      {viewMode === 'table' ? (
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: isDark ? 'rgba(17,24,39,0.7)' : '#ffffff',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #cbd5e1',
            boxShadow: isDark ? '0 8px 28px rgba(0,0,0,0.35)' : '0 4px 18px rgba(0,0,0,0.04)',
          }}
        >
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  background: isDark
                    ? 'linear-gradient(180deg, rgba(30,41,59,0.9), rgba(17,24,39,0.7))'
                    : 'linear-gradient(180deg, #f8fafc, #f1f5f9)',
                }}
              >
                {[
                  { label: 'Rank', width: 68 },
                  { label: 'Habitation Cluster & Zone' },
                  { label: 'Primary Hazard Exposure' },
                  { label: 'Housing Type' },
                  { label: 'Risk Score (0-100)' },
                  { label: 'Population' },
                  { label: 'Action Priority' },
                  { label: '', align: 'right', width: 100 },
                ].map((col, idx) => (
                  <TableCell
                    key={idx}
                    align={col.align || 'left'}
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.76rem',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: isDark ? '#94a3b8' : '#475569',
                      borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #cbd5e1',
                      py: 1.75,
                      width: col.width,
                    }}
                  >
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((row, i) => (
                  <HabitationRow
                    key={row.id}
                    row={row}
                    rank={i + 1}
                    isDark={isDark}
                    onTriggerAlert={handleTriggerAlert}
                    onNavigateRoute={handleNavigateRoute}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" fontWeight={700} sx={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                      No habitations match your search query
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8', mt: 0.5, display: 'block' }}>
                      Try resetting your search query or switching the category filter tab.
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ mt: 2, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                      onClick={() => {
                        setSearch('');
                        setActiveFilter('ALL');
                      }}
                    >
                      Reset All Filters
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* Card Grid View */
        <Box>
          {filtered.length > 0 ? (
            <Grid container spacing={2}>
              {filtered.map((row, i) => (
                <Grid size={{ xs: 12, md: 6 }} key={row.id}>
                  <HabitationCard
                    row={row}
                    rank={i + 1}
                    isDark={isDark}
                    onTriggerAlert={handleTriggerAlert}
                    onNavigateRoute={handleNavigateRoute}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
              <Typography variant="body1" fontWeight={700} sx={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                No habitations match your search query
              </Typography>
              <Button
                size="small"
                variant="outlined"
                sx={{ mt: 2, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                onClick={() => {
                  setSearch('');
                  setActiveFilter('ALL');
                }}
              >
                Reset All Filters
              </Button>
            </Paper>
          )}
        </Box>
      )}

      {/* Footer Info & Legend */}
      <Box
        mt={2.5}
        p={2}
        borderRadius={2.5}
        sx={{
          bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
          border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem' }}>
            Risk Thresholds:
          </Typography>
          {[
            { label: 'Critical Threat (80–100)', color: '#f43f5e' },
            { label: 'High Priority (60–79)', color: '#f97316' },
            { label: 'Moderate Alert (35–59)', color: '#eab308' },
            { label: 'Safe Baseline (<35)', color: '#22c55e' },
          ].map((item) => (
            <Box key={item.label} display="flex" alignItems="center" gap={0.6}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
              <Typography variant="caption" sx={{ color: isDark ? '#cbd5e1' : '#475569', fontWeight: 600, fontSize: '0.74rem' }}>
                {item.label}
              </Typography>
            </Box>
          ))}
        </Stack>

        <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8', fontWeight: 500 }}>
          Showing {filtered.length} of {rows.length} vulnerable settlements • Telemetry integrated with District Disaster Management Authority
        </Typography>
      </Box>
    </Boilerplate>
  );
}