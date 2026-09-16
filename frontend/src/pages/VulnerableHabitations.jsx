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
import NavigationOutlinedIcon from '@mui/icons-material/NavigationOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CloseIcon from '@mui/icons-material/Close';

import Boilerplate from '../layouts/Boilerplate';
import { useThemeMode } from '../context/ThemeContext';

/* ── Clean & Structured Habitations Data ─────────────────── */
const HABITATIONS_DATA = [
  {
    rank: 1,
    id: 'VH-01',
    cluster: 'Kunda Basti, Ward 7',
    zone: 'Flood Plain R-12',
    hazard: 'Flash Flood & River Inundation',
    hazardCategory: 'FLOOD',
    hazardBadge: '🌊 Flood Plain',
    housing: 'Kutcha (Mud, Bamboo & Tin)',
    housingCategory: 'KUTCHA',
    housingBadge: '🏚️ Kutcha',
    housingDesc: 'Mud and unmortared bamboo walls; 95% collapse probability when submerged.',
    score: 92,
    level: 'CRITICAL',
    population: 312,
    households: 62,
    shelter: 'Govt. Higher Secondary School (Safe Zone S-04)',
    shelterDist: '1.8 km',
    route: 'East Bypass Road (Elevated Embankment)',
    officer: 'Inspector S. K. Verma (+91-98765-43210)',
    reasons: [
      'Located within 40m of active river drainage bed',
      'Unreinforced mud walls cannot withstand river currents > 0.8 m/s',
      'Primary egress path submerges under 1.2m water during heavy rains',
    ],
    directives: [
      'Deploy 2 NDRF motorized inflatable rescue boats at Sector 14 staging point',
      'Sound local siren and initiate door-to-door evacuation',
      'Station 3 State Transport evacuation buses at Primary School junction',
    ],
  },
  {
    rank: 2,
    id: 'VH-02',
    cluster: 'Nala Colony',
    zone: 'Landslide Zone L-4',
    hazard: 'Steep Slope Landslide & Debris Flow',
    hazardCategory: 'LANDSLIDE',
    hazardBadge: '⛰️ Landslide Prone',
    housing: 'Semi-Pucca (Brick with weak mortar)',
    housingCategory: 'SEMI_PUCCA',
    housingBadge: '🧱 Semi-Pucca',
    housingDesc: 'Brittle brickwork on steep 38° saturated shale slope.',
    score: 87,
    level: 'CRITICAL',
    population: 198,
    households: 39,
    shelter: 'Hill Top Community Centre (Safe Zone S-02)',
    shelterDist: '2.3 km',
    route: 'Ridge Highway via Northern Access Spur',
    officer: 'Dr. R. C. Rawat (+91-98112-23344)',
    reasons: [
      'Slope incline exceeds 38° with heavily saturated topsoil',
      'Natural rainwater drainage cut passes directly through settlement homes',
      'High risk of sudden nighttime slope failure during continuous rain',
    ],
    directives: [
      'Issue mandatory night evacuation order before 18:00 IST',
      'Trigger slope movement acoustic sensor warnings',
      'Position backhoes to clear rubble on Northern Access Spur',
    ],
  },
  {
    rank: 3,
    id: 'VH-03',
    cluster: 'Ghat Para',
    zone: 'Riverbank Erosion Zone E-03',
    hazard: 'Riverbank Soil Erosion & Bank Scour',
    hazardCategory: 'FLOOD',
    hazardBadge: '🌊 Bank Erosion',
    housing: 'Kutcha (Thatch, Tarpaulin & Wood)',
    housingCategory: 'KUTCHA',
    housingBadge: '🏚️ Kutcha',
    housingDesc: 'Temporary wood and tarpaulin shelters on active alluvial silt bank.',
    score: 64,
    level: 'HIGH',
    population: 140,
    households: 28,
    shelter: 'New Township Transit Shelter (Safe Zone S-01)',
    shelterDist: '3.1 km',
    route: 'South Link Road towards High Ground Ward 4',
    officer: 'Officer M. P. Sharma (+91-94550-12345)',
    reasons: [
      'Riverbank receding at ~0.8 meters per heavy hydro-discharge cycle',
      'Zero geotextile or concrete embankment protection in this reach',
      'Active erosion edge is now within 15m of frontline dwellings',
    ],
    directives: [
      'Barricade frontline erosion perimeter and post danger warnings',
      'Schedule daytime family bus transit to New Township Shelter',
      'Distribute clean drinking water jerrycans and dry food rations',
    ],
  },
  {
    rank: 4,
    id: 'VH-04',
    cluster: 'Station Road Settlement',
    zone: 'Transit Corridor S-08',
    hazard: 'Urban Waterlogging & Drain Siltation',
    hazardCategory: 'MODERATE',
    hazardBadge: '⚠️ Waterlogging',
    housing: 'Pucca (Reinforced Concrete Frame)',
    housingCategory: 'PUCCA',
    housingBadge: '🏢 Pucca (Safe)',
    housingDesc: 'Reinforced concrete masonry with solid foundation; low collapse risk.',
    score: 38,
    level: 'MODERATE',
    population: 85,
    households: 17,
    shelter: 'Multi-Purpose Hall (Safe Zone S-05)',
    shelterDist: '0.9 km',
    route: 'Station Feeder Main Road',
    officer: 'Eng. K. Nair (+91-97120-99887)',
    reasons: [
      'Street depression prone to 0.4m waterlogging during heavy downpours',
      'Reinforced concrete structure protects residents against collapse',
      'Drainage blockage can temporarily disrupt municipal electricity & water',
    ],
    directives: [
      'Deploy municipal mobile diesel pump sets at Station Road culvert',
      'Inspect drainage flow rates every 2 hours during rain',
      'Maintain indoor advisory; no emergency forced relocation needed',
    ],
  },
];

/* ── Clear, High-Contrast Color Theme ────────────────────── */
const getLevelStyle = (level, isDark) => {
  switch (level) {
    case 'CRITICAL':
      return {
        badgeBg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
        badgeColor: isDark ? '#fca5a5' : '#b91c1c',
        badgeBorder: isDark ? 'rgba(239, 68, 68, 0.4)' : '#fca5a5',
        barColor: '#ef4444',
        text: 'CRITICAL',
      };
    case 'HIGH':
      return {
        badgeBg: isDark ? 'rgba(249, 115, 22, 0.2)' : '#ffedd5',
        badgeColor: isDark ? '#fdba74' : '#c2410c',
        badgeBorder: isDark ? 'rgba(249, 115, 22, 0.4)' : '#fdba74',
        barColor: '#f97316',
        text: 'HIGH RISK',
      };
    default:
      return {
        badgeBg: isDark ? 'rgba(234, 179, 8, 0.2)' : '#fef9c3',
        badgeColor: isDark ? '#fde047' : '#854d0e',
        badgeBorder: isDark ? 'rgba(234, 179, 8, 0.4)' : '#fde047',
        barColor: '#eab308',
        text: 'MODERATE',
      };
  }
};

export default function VulnerableHabitations() {
  const { isDark } = useThemeMode();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState('VH-01'); // First one expanded by default
  const [viewMode, setViewMode] = useState('table');
  const [showGuide, setShowGuide] = useState(false);
  const [toast, setToast] = useState(null);

  /* Filter Logic */
  const filteredRows = useMemo(() => {
    return HABITATIONS_DATA.filter((row) => {
      if (filter === 'CRITICAL' && row.level !== 'CRITICAL') return false;
      if (filter === 'FLOOD' && row.hazardCategory !== 'FLOOD') return false;
      if (filter === 'LANDSLIDE' && row.hazardCategory !== 'LANDSLIDE') return false;
      if (filter === 'KUTCHA' && row.housingCategory !== 'KUTCHA') return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          row.cluster.toLowerCase().includes(q) ||
          row.zone.toLowerCase().includes(q) ||
          row.hazard.toLowerCase().includes(q) ||
          row.shelter.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [filter, search]);

  const totalPop = HABITATIONS_DATA.reduce((acc, r) => acc + r.population, 0);
  const criticalCount = HABITATIONS_DATA.filter((r) => r.level === 'CRITICAL').length;
  const criticalPop = HABITATIONS_DATA.filter((r) => r.level === 'CRITICAL').reduce((acc, r) => acc + r.population, 0);

  return (
    <Boilerplate>
      {/* Toast alert */}
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="warning" variant="filled" onClose={() => setToast(null)} sx={{ fontWeight: 700, borderRadius: 2 }}>
          {toast}
        </Alert>
      </Snackbar>

      {/* Page Header */}
      <Box mb={2.5}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
              Operations &amp; Relocation &gt; Vulnerable Habitations
            </Typography>
            <Typography variant="h5" fontWeight={800} mt={0.25} sx={{ color: isDark ? '#f8fafc' : '#0f172a', letterSpacing: '-0.02em' }}>
              Vulnerable Habitations Assessment
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', mt: 0.5, fontSize: '0.88rem' }}>
              High-risk settlements ranked by flood &amp; landslide threat, housing fragility, and evacuation urgency.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.25} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              startIcon={<HelpOutlineOutlinedIcon />}
              onClick={() => setShowGuide(!showGuide)}
              sx={{
                fontWeight: 700,
                fontSize: '0.8rem',
                textTransform: 'none',
                borderRadius: 2,
                color: showGuide ? '#0284c7' : isDark ? '#cbd5e1' : '#475569',
                borderColor: showGuide ? '#0284c7' : isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1',
                bgcolor: showGuide ? (isDark ? 'rgba(2,132,199,0.1)' : '#f0f9ff') : 'transparent',
              }}
            >
              {showGuide ? 'Hide Guide' : 'How to Read This'}
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<MapOutlinedIcon />}
              onClick={() => navigate('/disaster-map')}
              sx={{
                fontWeight: 700,
                fontSize: '0.8rem',
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

        {/* Clean, Simple Explainer Guide */}
        <Collapse in={showGuide} timeout="auto">
          <Paper
            variant="outlined"
            sx={{
              mt: 2,
              p: 3,
              borderRadius: 3,
              bgcolor: isDark ? 'rgba(15,23,42,0.95)' : '#f8fafc',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1',
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
                📖 Quick Guide: How Habitation Risk is Evaluated
              </Typography>
              <IconButton size="small" onClick={() => setShowGuide(false)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box p={2} borderRadius={2} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0', height: '100%' }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#ef4444', mb: 0.5 }}>
                    1. Risk Score (0–100)
                  </Typography>
                  <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: '0.84rem', lineHeight: 1.5 }}>
                    Calculates how close homes are to water/slopes, how easily walls collapse, and how fast people can escape.
                  </Typography>
                  <Box mt={1.5} display="flex" gap={1} flexWrap="wrap">
                    <Chip label="80-100 Critical" size="small" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 700, fontSize: '0.72rem' }} />
                    <Chip label="60-79 High" size="small" sx={{ bgcolor: '#ffedd5', color: '#c2410c', fontWeight: 700, fontSize: '0.72rem' }} />
                    <Chip label="<60 Moderate" size="small" sx={{ bgcolor: '#fef9c3', color: '#854d0e', fontWeight: 700, fontSize: '0.72rem' }} />
                  </Box>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Box p={2} borderRadius={2} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0', height: '100%' }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#f97316', mb: 0.5 }}>
                    2. Housing Fragility
                  </Typography>
                  <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: '0.84rem', lineHeight: 1.5 }}>
                    • <strong>Kutcha</strong>: Mud, thatch, or tin. Collapses fast in floodwaters.<br />
                    • <strong>Semi-Pucca</strong>: Brick with light mortar. Sliding danger on slopes.<br />
                    • <strong>Pucca</strong>: Concrete &amp; steel (RCC). Highly durable.
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Box p={2} borderRadius={2} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0', height: '100%' }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#0284c7', mb: 0.5 }}>
                    3. Taking Action
                  </Typography>
                  <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: '0.84rem', lineHeight: 1.5 }}>
                    Click <strong>"View Details"</strong> on any row to see designated safe shelters, transit roads, nodal phone numbers, and one-click SMS alerts.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Collapse>
      </Box>

      {/* Simple 4 Stat Cards */}
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 2.5 }}>
        {[
          { icon: ShieldOutlinedIcon, label: 'TOTAL CLUSTERS', value: `${HABITATIONS_DATA.length}`, sub: 'Surveyed habitations', color: '#38bdf8' },
          { icon: WarningAmberIcon, label: 'CRITICAL ZONES', value: `${criticalCount}`, sub: `${criticalPop} residents in danger`, color: '#ef4444' },
          { icon: PeopleAltOutlinedIcon, label: 'TOTAL POPULATION', value: `${totalPop.toLocaleString()}`, sub: 'Across 146 households', color: '#a855f7' },
          { icon: TrendingUpIcon, label: 'AVG. RISK SCORE', value: '70 / 100', sub: 'High risk tier', color: '#f97316' },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card
              key={idx}
              sx={{
                flex: 1,
                minWidth: 190,
                borderRadius: 2.5,
                bgcolor: isDark ? 'rgba(20,30,52,0.85)' : '#ffffff',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.03)',
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                      {item.label}
                    </Typography>
                    <Typography variant="h4" fontWeight={800} mt={0.25} sx={{ color: isDark ? '#f8fafc' : '#0f172a', lineHeight: 1.1 }}>
                      {item.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: '0.72rem', mt: 0.5, display: 'block' }}>
                      {item.sub}
                    </Typography>
                  </Box>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                    <Icon sx={{ fontSize: 22 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      {/* Filter Bar */}
      <Box mb={2} display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
        {/* Search Input */}
        <Paper
          variant="outlined"
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 1.75,
            py: 0.8,
            borderRadius: 2,
            minWidth: 320,
            bgcolor: isDark ? 'rgba(17,24,39,0.7)' : '#ffffff',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
          }}
        >
          <SearchIcon sx={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: 20, mr: 1 }} />
          <InputBase
            placeholder="Search settlement name, ward, or hazard..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, fontSize: '0.88rem', color: isDark ? '#f8fafc' : '#0f172a' }}
          />
          {search && (
            <IconButton size="small" onClick={() => setSearch('')}>
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Paper>

        {/* Filter Pills & View Mode */}
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <Stack direction="row" spacing={1}>
            {[
              { id: 'ALL', label: 'All (4)' },
              { id: 'CRITICAL', label: '🚨 Critical (2)' },
              { id: 'FLOOD', label: '🌊 Flood (2)' },
              { id: 'LANDSLIDE', label: '⛰️ Landslide (1)' },
            ].map((tab) => {
              const active = filter === tab.id;
              return (
                <Chip
                  key={tab.id}
                  label={tab.label}
                  size="small"
                  onClick={() => setFilter(tab.id)}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    bgcolor: active ? (isDark ? '#0284c7' : '#0f172a') : isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                    color: active ? '#ffffff' : isDark ? '#cbd5e1' : '#475569',
                    border: active ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                  }}
                />
              );
            })}
          </Stack>

          <Box display="flex" sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9', p: 0.4, borderRadius: 1.5, ml: 0.5 }}>
            <Tooltip title="Table View">
              <IconButton
                size="small"
                onClick={() => setViewMode('table')}
                sx={{
                  borderRadius: 1.2,
                  bgcolor: viewMode === 'table' ? (isDark ? '#0284c7' : '#ffffff') : 'transparent',
                  color: viewMode === 'table' ? (isDark ? '#ffffff' : '#0284c7') : isDark ? '#94a3b8' : '#64748b',
                }}
              >
                <ViewListOutlinedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Cards View">
              <IconButton
                size="small"
                onClick={() => setViewMode('cards')}
                sx={{
                  borderRadius: 1.2,
                  bgcolor: viewMode === 'cards' ? (isDark ? '#0284c7' : '#ffffff') : 'transparent',
                  color: viewMode === 'cards' ? (isDark ? '#ffffff' : '#0284c7') : isDark ? '#94a3b8' : '#64748b',
                }}
              >
                <GridViewOutlinedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* ── Table View: Simple, Spacious, 4 Clean Columns ── */}
      {viewMode === 'table' ? (
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: isDark ? 'rgba(17,24,39,0.7)' : '#ffffff',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#cbd5e1',
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.03)',
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: isDark ? 'rgba(30,41,59,0.85)' : '#f8fafc' }}>
                <TableCell sx={{ width: 70, py: 1.75, fontWeight: 800, fontSize: '0.76rem', color: isDark ? '#94a3b8' : '#475569', textTransform: 'uppercase' }}>
                  Rank
                </TableCell>
                <TableCell sx={{ py: 1.75, fontWeight: 800, fontSize: '0.76rem', color: isDark ? '#94a3b8' : '#475569', textTransform: 'uppercase' }}>
                  Habitation Settlement
                </TableCell>
                <TableCell sx={{ width: 220, py: 1.75, fontWeight: 800, fontSize: '0.76rem', color: isDark ? '#94a3b8' : '#475569', textTransform: 'uppercase' }}>
                  Risk Score
                </TableCell>
                <TableCell sx={{ width: 160, py: 1.75, fontWeight: 800, fontSize: '0.76rem', color: isDark ? '#94a3b8' : '#475569', textTransform: 'uppercase' }}>
                  Population
                </TableCell>
                <TableCell align="right" sx={{ width: 140, py: 1.75, fontWeight: 800, fontSize: '0.76rem', color: isDark ? '#94a3b8' : '#475569', textTransform: 'uppercase' }}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => {
                  const isExpanded = expandedId === row.id;
                  const st = getLevelStyle(row.level, isDark);

                  return (
                    <React.Fragment key={row.id}>
                      {/* Main Clean Row */}
                      <TableRow
                        onClick={() => setExpandedId(isExpanded ? null : row.id)}
                        sx={{
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                          bgcolor: isExpanded
                            ? isDark
                              ? 'rgba(56,189,248,0.06)'
                              : 'rgba(2,132,199,0.04)'
                            : 'transparent',
                          '&:hover': {
                            bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                          },
                        }}
                      >
                        {/* 1. Rank */}
                        <TableCell sx={{ py: 2 }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box
                              sx={{
                                width: 34,
                                height: 34,
                                borderRadius: 2,
                                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.88rem',
                                color: isDark ? '#f8fafc' : '#0f172a',
                              }}
                            >
                              #{row.rank}
                            </Box>
                            {row.level === 'CRITICAL' && (
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ef4444' }} />
                            )}
                          </Box>
                        </TableCell>

                        {/* 2. Settlement Name & Details */}
                        <TableCell sx={{ py: 2 }}>
                          <Typography variant="body1" fontWeight={800} sx={{ color: isDark ? '#f8fafc' : '#0f172a', fontSize: '0.98rem' }}>
                            {row.cluster}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1} mt={0.5} flexWrap="wrap">
                            <Chip
                              label={row.hazardBadge}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                                color: isDark ? '#cbd5e1' : '#334155',
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                              }}
                            />
                            <Chip
                              label={row.housingBadge}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                                color: isDark ? '#cbd5e1' : '#334155',
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                              }}
                            />
                            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.78rem' }}>
                              📍 {row.zone} • Safe Shelter: <strong>{row.shelterDist}</strong>
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* 3. Risk Score */}
                        <TableCell sx={{ py: 2 }}>
                          <Box display="flex" alignItems="center" gap={1.25}>
                            <Typography variant="h6" fontWeight={900} sx={{ color: st.barColor, lineHeight: 1, fontSize: '1.15rem' }}>
                              {row.score}
                            </Typography>
                            <Chip
                              label={st.text}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                bgcolor: st.badgeBg,
                                color: st.badgeColor,
                                border: `1px solid ${st.badgeBorder}`,
                              }}
                            />
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={row.score}
                            sx={{
                              mt: 1,
                              height: 6,
                              borderRadius: 3,
                              bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
                              '& .MuiLinearProgress-bar': { bgcolor: st.barColor, borderRadius: 3 },
                            }}
                          />
                        </TableCell>

                        {/* 4. Population */}
                        <TableCell sx={{ py: 2 }}>
                          <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? '#f8fafc' : '#0f172a', fontSize: '0.92rem' }}>
                            {row.population.toLocaleString()} people
                          </Typography>
                          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.76rem', display: 'block' }}>
                            {row.households} families
                          </Typography>
                        </TableCell>

                        {/* 5. Action Button */}
                        <TableCell align="right" sx={{ py: 2 }}>
                          <Button
                            size="small"
                            variant={isExpanded ? 'contained' : 'outlined'}
                            endIcon={isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.76rem',
                              textTransform: 'none',
                              borderRadius: 2,
                              py: 0.5,
                              px: 1.5,
                              bgcolor: isExpanded ? '#0284c7' : 'transparent',
                              borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1',
                              color: isExpanded ? '#ffffff' : isDark ? '#cbd5e1' : '#0f172a',
                            }}
                          >
                            {isExpanded ? 'Hide' : 'View Plan'}
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Detailed Drawer Row */}
                      <TableRow>
                        <TableCell colSpan={5} sx={{ py: 0, borderBottom: isExpanded ? undefined : 'none' }}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box
                              sx={{
                                my: 1.5,
                                p: 2.5,
                                borderRadius: 2.5,
                                bgcolor: isDark ? 'rgba(15,23,42,0.9)' : '#f8fafc',
                                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #cbd5e1',
                              }}
                            >
                              <Grid container spacing={2.5}>
                                {/* Left Box: Why at risk */}
                                <Grid size={{ xs: 12, md: 4 }}>
                                  <Box p={2} borderRadius={2} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0', height: '100%' }}>
                                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: isDark ? '#f8fafc' : '#0f172a', mb: 1 }}>
                                      ⚠️ Key Vulnerability Factors
                                    </Typography>
                                    <Stack spacing={0.75}>
                                      {row.reasons.map((r, i) => (
                                        <Box key={i} display="flex" alignItems="flex-start" gap={1}>
                                          <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#ef4444', mt: 0.8, flexShrink: 0 }} />
                                          <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#334155', fontSize: '0.82rem', lineHeight: 1.4 }}>
                                            {r}
                                          </Typography>
                                        </Box>
                                      ))}
                                    </Stack>

                                    <Divider sx={{ my: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0' }} />

                                    <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase' }}>
                                      Structure Note:
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: isDark ? '#e2e8f0' : '#1e293b', fontSize: '0.8rem', mt: 0.25 }}>
                                      {row.housingDesc}
                                    </Typography>
                                  </Box>
                                </Grid>

                                {/* Middle Box: Designated Shelter */}
                                <Grid size={{ xs: 12, md: 4 }}>
                                  <Box p={2} borderRadius={2} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0', height: '100%' }}>
                                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: isDark ? '#f8fafc' : '#0f172a', mb: 1 }}>
                                      🏫 Assigned Evacuation Shelter
                                    </Typography>

                                    <Box p={1.5} borderRadius={1.5} sx={{ bgcolor: isDark ? 'rgba(56,189,248,0.08)' : '#f0f9ff', border: '1px solid rgba(56,189,248,0.2)' }}>
                                      <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? '#38bdf8' : '#0284c7' }}>
                                        {row.shelter}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: isDark ? '#cbd5e1' : '#475569', display: 'block', mt: 0.5 }}>
                                        Distance: <strong>{row.shelterDist}</strong> via {row.route}
                                      </Typography>
                                    </Box>

                                    <Box mt={2}>
                                      <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase' }}>
                                        Field Nodal Officer:
                                      </Typography>
                                      <Typography variant="body2" fontWeight={700} sx={{ color: isDark ? '#cbd5e1' : '#1e293b', fontSize: '0.82rem', mt: 0.25 }}>
                                        {row.officer}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Grid>

                                {/* Right Box: Directives & Quick Actions */}
                                <Grid size={{ xs: 12, md: 4 }}>
                                  <Box p={2} borderRadius={2} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <Box>
                                      <Typography variant="subtitle2" fontWeight={800} sx={{ color: isDark ? '#f8fafc' : '#0f172a', mb: 1 }}>
                                        🚨 Tactical Response Directives
                                      </Typography>
                                      <Stack spacing={0.75}>
                                        {row.directives.map((d, i) => (
                                          <Box key={i} display="flex" alignItems="flex-start" gap={1}>
                                            <CheckCircleOutlinedIcon sx={{ fontSize: 14, color: '#10b981', mt: 0.3, flexShrink: 0 }} />
                                            <Typography variant="caption" sx={{ color: isDark ? '#cbd5e1' : '#334155', fontSize: '0.78rem', lineHeight: 1.35 }}>
                                              {d}
                                            </Typography>
                                          </Box>
                                        ))}
                                      </Stack>
                                    </Box>

                                    <Box mt={2} display="flex" gap={1}>
                                      <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={<NavigationOutlinedIcon />}
                                        onClick={() => navigate('/relocation-planning')}
                                        sx={{
                                          flex: 1,
                                          bgcolor: '#0284c7',
                                          fontWeight: 700,
                                          fontSize: '0.75rem',
                                          textTransform: 'none',
                                          borderRadius: 2,
                                          py: 0.7,
                                          '&:hover': { bgcolor: '#0369a1' },
                                        }}
                                      >
                                        Relocation Route
                                      </Button>
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        color={row.level === 'CRITICAL' ? 'error' : 'warning'}
                                        startIcon={<NotificationsActiveOutlinedIcon />}
                                        onClick={() => setToast(`Evacuation SMS broadcast queued for ${row.cluster} (${row.population} residents).`)}
                                        sx={{
                                          flex: 1,
                                          fontWeight: 700,
                                          fontSize: '0.75rem',
                                          textTransform: 'none',
                                          borderRadius: 2,
                                          py: 0.7,
                                        }}
                                      >
                                        Send SMS Alert
                                      </Button>
                                    </Box>
                                  </Box>
                                </Grid>
                              </Grid>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" fontWeight={700} sx={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                      No habitations match your search
                    </Typography>
                    <Button size="small" sx={{ mt: 1, textTransform: 'none' }} onClick={() => { setSearch(''); setFilter('ALL'); }}>
                      Reset filters
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* ── Cards View ── */
        <Grid container spacing={2}>
          {filteredRows.map((row) => {
            const st = getLevelStyle(row.level, isDark);
            const isExpanded = expandedId === row.id;

            return (
              <Grid size={{ xs: 12, md: 6 }} key={row.id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    p: 2.5,
                    bgcolor: isDark ? 'rgba(20,30,52,0.85)' : '#ffffff',
                    border: `1px solid ${isExpanded ? '#0284c7' : isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                    boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.04)',
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box display="flex" alignItems="center" gap={1.25}>
                      <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>
                        #{row.rank}
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? '#f8fafc' : '#0f172a', lineHeight: 1.2 }}>
                          {row.cluster}
                        </Typography>
                        <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                          📍 {row.zone}
                        </Typography>
                      </Box>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="h5" fontWeight={900} sx={{ color: st.barColor, lineHeight: 1 }}>
                        {row.score}
                      </Typography>
                      <Chip label={st.text} size="small" sx={{ mt: 0.5, height: 20, fontSize: '0.68rem', fontWeight: 800, bgcolor: st.badgeBg, color: st.badgeColor }} />
                    </Box>
                  </Box>

                  <Box display="flex" gap={1} mt={1.5} flexWrap="wrap">
                    <Chip label={row.hazardBadge} size="small" sx={{ fontSize: '0.72rem', fontWeight: 700 }} />
                    <Chip label={row.housingBadge} size="small" sx={{ fontSize: '0.72rem', fontWeight: 700 }} />
                    <Chip label={`👥 ${row.population} people`} size="small" sx={{ fontSize: '0.72rem', fontWeight: 700 }} />
                  </Box>

                  <Box mt={2} p={1.5} borderRadius={2} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f1f5f9' }}>
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', display: 'block' }}>
                      ASSIGNED SAFE SHELTER
                    </Typography>
                    <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? '#38bdf8' : '#0284c7' }}>
                      {row.shelter.split('(')[0]} ({row.shelterDist})
                    </Typography>
                  </Box>

                  <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                    <Button
                      size="small"
                      onClick={() => setExpandedId(isExpanded ? null : row.id)}
                      endIcon={isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                      sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.76rem' }}
                    >
                      {isExpanded ? 'Hide Details' : 'View Action Plan'}
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => navigate('/relocation-planning')}
                      sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.76rem', borderRadius: 2, bgcolor: '#0284c7' }}
                    >
                      Evacuate
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Footer summary */}
      <Box mt={2.5} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8', fontWeight: 600 }}>
          Showing {filteredRows.length} of {HABITATIONS_DATA.length} habitations • Telemetry synced with District Control Room
        </Typography>
      </Box>
    </Boilerplate>
  );
}