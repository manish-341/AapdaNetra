import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Paper, Box, Stack, Chip, Card, CardContent,
  Button, Grid, Alert, Snackbar, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Divider,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CloseIcon from '@mui/icons-material/Close';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import NavigationOutlinedIcon from '@mui/icons-material/NavigationOutlined';

import Boilerplate from '../layouts/Boilerplate';
import { useThemeMode } from '../context/ThemeContext';

/* ── Habitations Data matching reference ──────────────────── */
const HABITATIONS = [
  {
    rank: 1,
    id: 'VH-01',
    cluster: 'Kunda Basti, Ward 7',
    zone: 'Flood Plain R-12',
    tags: [
      { label: 'Flood Plain', icon: '🌊', bg: '#e0f2fe', color: '#0369a1' },
      { label: 'Kutcha', icon: '🏚️', bg: '#ffedd5', color: '#c2410c' },
      { label: 'R-12', icon: '📍', bg: '#fee2e2', color: '#b91c1c' },
    ],
    shelterText: 'Flood Plain R-12 • Safe Shelter: 1.8 km',
    bullets: [
      'Located within 40m of active river drainage bed',
      'Unreinforced mud walls cannot withstand river currents > 0.8 m/s',
      'Primary egress path submerges under 1.2m water during heavy rains',
    ],
    score: 92,
    level: 'CRITICAL',
    scoreColor: '#dc2626',
    scoreBg: '#fee2e2',
    scoreBorder: '#fca5a5',
    population: 312,
    households: 62,
    actions: [
      'Deploy 2 NDRF motorized inflatable rescue boats at Sector 14',
      'Sound local siren and initiate door-to-door evacuation',
      'Station 3 State Transport evacuation buses at Primary School junction',
    ],
    shelterName: 'Govt. Higher Secondary School (Safe Zone S-04)',
    shelterDistance: '1.8 km via East Bypass Road',
    nodalOfficer: 'Inspector S. K. Verma (+91-98765-43210)',
  },
  {
    rank: 2,
    id: 'VH-02',
    cluster: 'Nala Colony',
    zone: 'Landslide Zone L-4',
    tags: [
      { label: 'Landslide Prone', icon: '⛰️', bg: '#ffedd5', color: '#c2410c' },
      { label: 'Semi-Pucca', icon: '🧱', bg: '#f3e8ff', color: '#7e22ce' },
      { label: 'L-4', icon: '📍', bg: '#fef9c3', color: '#a16207' },
    ],
    shelterText: 'Landslide Zone L-4 • Safe Shelter: 2.3 km',
    bullets: [
      'Slope incline exceeds 38° with heavily saturated topsoil',
      'Natural rainwater drainage cut passes directly through settlement homes',
      'High risk of sudden nighttime slope failure during continuous rain',
    ],
    score: 87,
    level: 'CRITICAL',
    scoreColor: '#dc2626',
    scoreBg: '#fee2e2',
    scoreBorder: '#fca5a5',
    population: 198,
    households: 39,
    actions: [
      'Issue mandatory night evacuation order before 18:00 IST',
      'Activate slope movement acoustic sensor warnings',
      'Position backhoes to clear rubble on Northern Access Spur',
    ],
    shelterName: 'Hill Top Community Centre (Safe Zone S-02)',
    shelterDistance: '2.3 km via Ridge Highway Spur',
    nodalOfficer: 'Dr. R. C. Rawat (+91-98112-23344)',
  },
  {
    rank: 3,
    id: 'VH-03',
    cluster: 'Ghat Para',
    zone: 'Riverbank Erosion Zone E-03',
    tags: [
      { label: 'Bank Erosion', icon: '🌊', bg: '#ffedd5', color: '#c2410c' },
      { label: 'Kutcha', icon: '🏚️', bg: '#ffedd5', color: '#c2410c' },
      { label: 'E-03', icon: '📍', bg: '#fee2e2', color: '#b91c1c' },
    ],
    shelterText: 'Riverbank Erosion Zone E-03 • Safe Shelter: 3.1 km',
    bullets: [
      'Riverbank receding at ~0.8 meters per heavy hydro-discharge cycle',
      'Zero geotextile or concrete embankment protection in this reach',
      'Active erosion edge is now within 15m of frontline dwellings',
    ],
    score: 64,
    level: 'HIGH RISK',
    scoreColor: '#ea580c',
    scoreBg: '#ffedd5',
    scoreBorder: '#fdba74',
    population: 140,
    households: 28,
    actions: [
      'Barricade frontline erosion perimeter and post danger warnings',
      'Schedule daytime family bus transit to New Township Shelter',
      'Distribute clean drinking water jerrycans and dry food rations',
    ],
    shelterName: 'New Township Transit Shelter (Safe Zone S-01)',
    shelterDistance: '3.1 km via South Link Road',
    nodalOfficer: 'Officer M. P. Sharma (+91-94550-12345)',
  },
  {
    rank: 4,
    id: 'VH-04',
    cluster: 'Station Road Settlement',
    zone: 'Transit Corridor S-08',
    tags: [
      { label: 'Waterlogging', icon: '⚠️', bg: '#fef9c3', color: '#854d0e' },
      { label: 'Pucca', icon: '🏢', bg: '#dcfce7', color: '#15803d' },
      { label: 'S-08', icon: '📍', bg: '#e0f2fe', color: '#0369a1' },
    ],
    shelterText: 'Transit Corridor S-08 • Safe Shelter: 0.9 km',
    bullets: [
      'Street depression prone to 0.4m waterlogging during heavy downpours',
      'Reinforced concrete structure protects residents against collapse',
      'Drainage blockage can temporarily disrupt municipal electricity & water',
    ],
    score: 38,
    level: 'MODERATE',
    scoreColor: '#ca8a04',
    scoreBg: '#fef9c3',
    scoreBorder: '#fde047',
    population: 85,
    households: 17,
    actions: [
      'Deploy municipal mobile diesel pump sets at Station Road culvert',
      'Inspect drainage flow rates every 2 hours during rain',
      'Maintain indoor advisory; no emergency forced relocation needed',
    ],
    shelterName: 'Multi-Purpose Hall (Safe Zone S-05)',
    shelterDistance: '0.9 km via Station Feeder Main Road',
    nodalOfficer: 'Eng. K. Nair (+91-97120-99887)',
  },
];

export default function VulnerableHabitations() {
  const { isDark } = useThemeMode();
  const navigate = useNavigate();

  const [selectedHabitation, setSelectedHabitation] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const handleSendSMS = (clusterName, pop) => {
    setToastMessage(`🚨 Emergency Evacuation SMS dispatched for ${clusterName} (${pop} residents). Local volunteers notified.`);
  };

  return (
    <Boilerplate>
      {/* Toast Alert */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={4000}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="warning" variant="filled" onClose={() => setToastMessage(null)} sx={{ fontWeight: 700, borderRadius: 2 }}>
          {toastMessage}
        </Alert>
      </Snackbar>

      {/* ── TOP STAT CARDS (5 Cards matching Reference) ───────── */}
      <Stack direction="row" spacing={2} sx={{ mb: 2.5, overflowX: 'auto', pb: 0.5 }}>
        {/* Card 1: High Risk Settlements */}
        <Card
          sx={{
            flex: 1, minWidth: 190, borderRadius: 3,
            bgcolor: isDark ? 'rgba(20,30,52,0.85)' : '#ffffff',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1f5f9',
            boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box display="flex" alignItems="center" gap={1.25} mb={1}>
              <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                <WarningAmberIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? '#f87171' : '#dc2626', fontSize: '0.78rem' }}>
                High Risk Settlements
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={900} sx={{ color: isDark ? '#f87171' : '#dc2626', lineHeight: 1 }}>
              4
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.72rem', mt: 0.75, display: 'block' }}>
              Require immediate attention &gt;
            </Typography>
          </CardContent>
        </Card>

        {/* Card 2: Critical Zones */}
        <Card
          sx={{
            flex: 1, minWidth: 190, borderRadius: 3,
            bgcolor: isDark ? 'rgba(20,30,52,0.85)' : '#ffffff',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1f5f9',
            boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box display="flex" alignItems="center" gap={1.25} mb={1}>
              <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                <PeopleAltOutlinedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? '#38bdf8' : '#0369a1', fontSize: '0.78rem' }}>
                Critical Zones
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={900} sx={{ color: isDark ? '#38bdf8' : '#0284c7', lineHeight: 1 }}>
              2
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.72rem', mt: 0.75, display: 'block' }}>
              Severe risk areas &gt;
            </Typography>
          </CardContent>
        </Card>

        {/* Card 3: Total Population */}
        <Card
          sx={{
            flex: 1, minWidth: 190, borderRadius: 3,
            bgcolor: isDark ? 'rgba(20,30,52,0.85)' : '#ffffff',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1f5f9',
            boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box display="flex" alignItems="center" gap={1.25} mb={1}>
              <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                <PeopleAltOutlinedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? '#4ade80' : '#15803d', fontSize: '0.78rem' }}>
                Total Population
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={900} sx={{ color: isDark ? '#4ade80' : '#16a34a', lineHeight: 1 }}>
              735
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.72rem', mt: 0.75, display: 'block' }}>
              Across 146 households &gt;
            </Typography>
          </CardContent>
        </Card>

        {/* Card 4: Avg. Risk Score */}
        <Card
          sx={{
            flex: 1, minWidth: 190, borderRadius: 3,
            bgcolor: isDark ? 'rgba(20,30,52,0.85)' : '#ffffff',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1f5f9',
            boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box display="flex" alignItems="center" gap={1.25} mb={1}>
              <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea' }}>
                <ShieldOutlinedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? '#c084fc' : '#7e22ce', fontSize: '0.78rem' }}>
                Avg. Risk Score
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={900} sx={{ color: isDark ? '#c084fc' : '#7e22ce', lineHeight: 1 }}>
              70 / 100
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.72rem', mt: 0.75, display: 'block' }}>
              High risk tier &gt;
            </Typography>
          </CardContent>
        </Card>

        {/* Card 5: Active Alerts */}
        <Card
          sx={{
            flex: 1, minWidth: 190, borderRadius: 3,
            bgcolor: isDark ? 'rgba(20,30,52,0.85)' : '#ffffff',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1f5f9',
            boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box display="flex" alignItems="center" gap={1.25} mb={1}>
              <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
                <NotificationsActiveOutlinedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? '#fb923c' : '#c2410c', fontSize: '0.78rem' }}>
                Active Alerts
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={900} sx={{ color: isDark ? '#fb923c' : '#ea580c', lineHeight: 1 }}>
              3
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.72rem', mt: 0.75, display: 'block' }}>
              Monitoring in progress &gt;
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* ── ALERT BANNER (High Vulnerability Detected) ─────────── */}
      <Paper
        variant="outlined"
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 3,
          bgcolor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#fff5f5',
          borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecdd3',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box display="flex" alignItems="center" gap={1.75}>
          <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
            <NotificationsActiveOutlinedIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? '#fca5a5' : '#b91c1c', fontSize: '0.98rem' }}>
              High Vulnerability Detected
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: '0.84rem' }}>
              4 settlements are at high risk due to flood and landslide threats. Immediate monitoring and evacuation planning is advised.
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          size="small"
          endIcon={<ArrowForwardIcon />}
          onClick={() => setSelectedHabitation(HABITATIONS[0])}
          sx={{
            bgcolor: '#e11d48',
            fontWeight: 700,
            textTransform: 'none',
            borderRadius: 2.5,
            px: 2.5,
            py: 0.8,
            fontSize: '0.84rem',
            '&:hover': { bgcolor: '#be123c' },
          }}
        >
          View Details
        </Button>
      </Paper>

      {/* ── SECTION HEADER ────────────────────────────────────── */}
      <Box mb={2.5} display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: isDark ? 'rgba(56,189,248,0.1)' : '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
            <HomeOutlinedIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: isDark ? '#f8fafc' : '#0f172a', fontSize: '1.1rem' }}>
              Vulnerable Habitations Assessment
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.82rem' }}>
              High-risk settlements ranked by flood &amp; landslide threat, housing fragility, and evacuation urgency.
            </Typography>
          </Box>
        </Box>
        <Button
          variant="text"
          endIcon={<ArrowForwardIcon />}
          onClick={() => navigate('/relocation-planning')}
          sx={{ fontWeight: 700, textTransform: 'none', color: '#0284c7', fontSize: '0.84rem' }}
        >
          View All
        </Button>
      </Box>

      {/* ── HABITATIONS CARDS (Matching Reference Layout) ─────── */}
      <Stack spacing={2.5} mb={3}>
        {HABITATIONS.map((row) => (
          <Paper
            key={row.id}
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 3.5,
              bgcolor: isDark ? 'rgba(20,30,52,0.85)' : '#ffffff',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
              boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#0284c7',
                boxShadow: '0 6px 20px rgba(2,132,199,0.12)',
              },
            }}
          >
            <Grid container spacing={3} alignItems="flex-start">
              {/* Left Column: Settlement Details (No Images) */}
              <Grid size={{ xs: 12, md: 5.5 }}>
                <Box>
                  {/* Rank Badge & Cluster Title */}
                  <Box display="flex" alignItems="center" gap={1.25} mb={1}>
                    <Box
                      sx={{
                        px: 1.25,
                        py: 0.4,
                        borderRadius: 1.5,
                        bgcolor: row.rank <= 2 ? '#fee2e2' : '#ffedd5',
                        color: row.rank <= 2 ? '#dc2626' : '#ea580c',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        flexShrink: 0,
                      }}
                    >
                      #{row.rank}
                    </Box>
                    <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? '#f8fafc' : '#0f172a', display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '1.05rem' }}>
                      <LocationOnIcon sx={{ fontSize: 18, color: '#0284c7' }} />
                      {row.cluster}
                    </Typography>
                  </Box>

                  {/* Chips Row */}
                  <Box display="flex" gap={0.75} mt={0.5} flexWrap="wrap">
                      {row.tags.map((t, idx) => (
                        <Chip
                          key={idx}
                          label={`${t.icon} ${t.label}`}
                          size="small"
                          sx={{
                            height: 22,
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            bgcolor: isDark ? 'rgba(255,255,255,0.06)' : t.bg,
                            color: isDark ? '#f1f5f9' : t.color,
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
                          }}
                        />
                      ))}
                    </Box>

                    {/* Subtitle */}
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.76rem', display: 'block', mt: 1 }}>
                      📍 {row.shelterText}
                    </Typography>

                    {/* Reasons Bullet Points */}
                    <Stack spacing={0.5} mt={1}>
                      {row.bullets.map((bullet, i) => (
                        <Box key={i} display="flex" alignItems="flex-start" gap={0.75}>
                          <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#ef4444', mt: 0.7, flexShrink: 0 }} />
                          <Typography variant="caption" sx={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: '0.76rem', lineHeight: 1.35 }}>
                            {bullet}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Grid>

              {/* Middle Column: Risk Score Card */}
              <Grid size={{ xs: 12, sm: 4, md: 2.2 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#fff8f8',
                    border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #fee2e2',
                    textAlign: 'left',
                  }}
                >
                  <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? '#f87171' : '#dc2626', textTransform: 'capitalize', fontSize: '0.74rem' }}>
                    Risk Score
                  </Typography>
                  <Box display="flex" alignItems="baseline" gap={1.25} mt={0.5}>
                    <Typography variant="h4" fontWeight={900} sx={{ color: row.scoreColor, lineHeight: 1 }}>
                      {row.score}
                    </Typography>
                    <Chip
                      label={row.level}
                      size="small"
                      sx={{
                        height: 20,
                        fontWeight: 800,
                        fontSize: '0.66rem',
                        bgcolor: row.scoreBg,
                        color: row.scoreColor,
                        border: `1px solid ${row.scoreBorder}`,
                      }}
                    />
                  </Box>
                  <Box sx={{ width: '100%', height: 5, borderRadius: 2.5, bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#fee2e2', mt: 1.5, overflow: 'hidden' }}>
                    <Box sx={{ width: `${row.score}%`, height: '100%', bgcolor: row.scoreColor, borderRadius: 2.5 }} />
                  </Box>
                </Box>
              </Grid>

              {/* Right Column: Population & Recommended Actions & Action Buttons */}
              <Grid size={{ xs: 12, sm: 8, md: 4.3 }}>
                <Box display="flex" flexDirection="column" justifyContent="space-between" height="100%">
                  <Box>
                    {/* Population */}
                    <Box display="flex" alignItems="center" gap={1} mb={1.25}>
                      <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                        <PeopleAltOutlinedIcon sx={{ fontSize: 16 }} />
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.7rem', display: 'block', lineHeight: 1 }}>
                          Population
                        </Typography>
                        <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
                          {row.population} people <span style={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 500 }}>({row.households} families)</span>
                        </Typography>
                      </Box>
                    </Box>

                    {/* Recommended Actions */}
                    <Typography variant="caption" fontWeight={800} sx={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75, fontSize: '0.78rem' }}>
                      <CheckCircleOutlinedIcon sx={{ fontSize: 15 }} />
                      Recommended Actions
                    </Typography>

                    <Stack spacing={0.6}>
                      {row.actions.map((act, i) => (
                        <Box key={i} display="flex" alignItems="flex-start" gap={0.75}>
                          <CheckCircleOutlinedIcon sx={{ fontSize: 13, color: '#16a34a', mt: 0.3, flexShrink: 0 }} />
                          <Typography variant="caption" sx={{ color: isDark ? '#cbd5e1' : '#334155', fontSize: '0.74rem', lineHeight: 1.35 }}>
                            {act}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>

                  {/* Buttons Row */}
                  <Stack direction="row" spacing={1.25} mt={2}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 16 }} />}
                      onClick={() => setSelectedHabitation(row)}
                      sx={{
                        flex: 1,
                        bgcolor: '#0284c7',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'none',
                        borderRadius: 2,
                        py: 0.8,
                        '&:hover': { bgcolor: '#0369a1' },
                      }}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<NotificationsActiveOutlinedIcon sx={{ fontSize: 16 }} />}
                      onClick={() => handleSendSMS(row.cluster, row.population)}
                      sx={{
                        flex: 1,
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'none',
                        borderRadius: 2,
                        py: 0.8,
                        color: '#0284c7',
                        borderColor: '#0284c7',
                        '&:hover': { bgcolor: 'rgba(2,132,199,0.06)' },
                      }}
                    >
                      Send SMS Alert
                    </Button>
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Stack>

      {/* ── DETAIL MODAL (Opens on View Details click) ─────────── */}
      <Dialog
        open={Boolean(selectedHabitation)}
        onClose={() => setSelectedHabitation(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3.5,
            bgcolor: isDark ? '#0f172a' : '#ffffff',
            backgroundImage: 'none',
            p: 1,
          },
        }}
      >
        {selectedHabitation && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <LocationOnIcon sx={{ color: '#0284c7' }} />
                <Typography variant="h6" fontWeight={800} sx={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
                  {selectedHabitation.cluster}
                </Typography>
                <Chip
                  label={`Score: ${selectedHabitation.score}/100`}
                  size="small"
                  sx={{ bgcolor: selectedHabitation.scoreBg, color: selectedHabitation.scoreColor, fontWeight: 800 }}
                />
              </Box>
              <IconButton size="small" onClick={() => setSelectedHabitation(null)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }}>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: isDark ? '#f8fafc' : '#0f172a', mb: 1 }}>
                    🏫 Evacuation Target &amp; Shelter
                  </Typography>
                  <Box p={2} borderRadius={2} sx={{ bgcolor: isDark ? 'rgba(2,132,199,0.1)' : '#f0f9ff', border: '1px solid #bae6fd' }}>
                    <Typography variant="body1" fontWeight={800} sx={{ color: '#0284c7' }}>
                      {selectedHabitation.shelterName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#475569', mt: 0.5 }}>
                      Transit Route: <strong>{selectedHabitation.shelterDistance}</strong>
                    </Typography>
                  </Box>

                  <Box mt={2}>
                    <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase' }}>
                      Designated Nodal Officer
                    </Typography>
                    <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? '#f8fafc' : '#0f172a', mt: 0.25 }}>
                      {selectedHabitation.nodalOfficer}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: isDark ? '#f8fafc' : '#0f172a', mb: 1 }}>
                    🚨 Incident Command Directives
                  </Typography>
                  <Stack spacing={1}>
                    {selectedHabitation.actions.map((act, i) => (
                      <Box key={i} display="flex" alignItems="flex-start" gap={1}>
                        <CheckCircleOutlinedIcon sx={{ fontSize: 16, color: '#16a34a', mt: 0.2, flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#334155', fontSize: '0.84rem' }}>
                          {act}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/disaster-map')}
                startIcon={<LocationOnIcon />}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
              >
                View On GIS Map
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setSelectedHabitation(null);
                  navigate('/relocation-planning');
                }}
                startIcon={<NavigationOutlinedIcon />}
                sx={{ bgcolor: '#0284c7', textTransform: 'none', fontWeight: 700, borderRadius: 2, '&:hover': { bgcolor: '#0369a1' } }}
              >
                Open Relocation Route Optimizer
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Boilerplate>
  );
}