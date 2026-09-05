import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  InputAdornment,
  Tooltip as MuiTooltip,
} from '@mui/material';
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import SearchIcon from '@mui/icons-material/Search';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import TableRowsIcon from '@mui/icons-material/TableRows';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import Boilerplate from '../layouts/Boilerplate';
import { getShelters, updateShelter } from '../services/api';
import { useThemeMode } from '../context/ThemeContext';
import { useLocationContext } from '../context/LocationContext';

const STATUS_COLORS = {
  AVAILABLE: 'success',
  NEAR_CAPACITY: 'warning',
  FULL: 'error',
  CLOSED: 'default',
};

const StatCard = ({ label, value, color }) => (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="h4" color={color} fontWeight="bold">{value}</Typography>
  </Paper>
);

/* Custom Glassmorphic Tooltip for Recharts */
const CustomShelterTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const capacity = Number(data.Capacity || 0);
    const occupancy = Number(data.Occupancy || 0);
    const occupancyPercent = capacity > 0 ? Math.round((occupancy / capacity) * 100) : 0;
    const available = Math.max(0, capacity - occupancy);

    const statusColor =
      data.status === 'FULL' || occupancyPercent >= 95
        ? '#ef4444'
        : data.status === 'NEAR_CAPACITY' || occupancyPercent >= 75
        ? '#f59e0b'
        : '#10b981';

    return (
      <Box
        sx={{
          bgcolor: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 2,
          p: 1.5,
          color: '#f8fafc',
          boxShadow: '0 12px 28px -4px rgba(0,0,0,0.6)',
          minWidth: 220,
          maxWidth: 300,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#38bdf8', lineHeight: 1.25, mb: 0.5 }}>
          {data.fullName || data.name}
        </Typography>
        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1.2 }}>
          📍 {data.district} {data.state ? `• ${data.state}` : ''}
        </Typography>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}>
          <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600 }}>Occupancy Level:</Typography>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: statusColor }} />
            <Typography variant="caption" sx={{ fontWeight: 800, color: statusColor }}>
              {occupancyPercent}% ({data.status || 'AVAILABLE'})
            </Typography>
          </Box>
        </Box>

        <LinearProgress
          variant="determinate"
          value={Math.min(occupancyPercent, 100)}
          sx={{
            height: 6,
            borderRadius: 3,
            mb: 1.2,
            bgcolor: 'rgba(255,255,255,0.1)',
            '& .MuiLinearProgress-bar': { bgcolor: statusColor }
          }}
        />

        <Box display="flex" justifyContent="space-between" mb={0.4}>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>Occupied:</Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#60a5fa' }}>
            {occupancy.toLocaleString()} evacuees
          </Typography>
        </Box>

        <Box display="flex" justifyContent="space-between" mb={0.4}>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>Total Capacity:</Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#e2e8f0' }}>
            {capacity.toLocaleString()}
          </Typography>
        </Box>

        <Box display="flex" justifyContent="space-between">
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>Safe Vacancies:</Typography>
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#34d399' }}>
            {available.toLocaleString()} slots
          </Typography>
        </Box>
      </Box>
    );
  }
  return null;
};

export default function CarryingCapacity() {
  const { isDark } = useThemeMode();
  const { location } = useLocationContext();

  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filter & Layout Controls
  const [scopeMode, setScopeMode] = useState('CURRENT'); // 'CURRENT', 'TOP', 'CRITICAL', 'DISTRICT', 'ALL'
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [chartLayout, setChartLayout] = useState('horizontal'); // 'horizontal' (Horizontal bars) vs 'vertical' (Vertical columns)
  const [searchQuery, setSearchQuery] = useState('');
  const [syncTableFilter, setSyncTableFilter] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedShelter, setSelectedShelter] = useState(null);
  const [actionType, setActionType] = useState('ADMIT'); // ADMIT or DISCHARGE
  const [changeAmount, setChangeAmount] = useState(25);
  const [updating, setUpdating] = useState(false);

  const fetchShelters = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getShelters();
      setShelters(res?.data?.data || []);
    } catch (err) {
      setError('Failed to load carrying capacity data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShelters();
  }, []);

  // Compute available districts dynamically from the loaded shelters
  const availableDistricts = useMemo(() => {
    const distSet = new Set(shelters.map((s) => s.district).filter(Boolean));
    return Array.from(distSet).sort();
  }, [shelters]);

  // Identify active district matching current context location
  const activeDistrictName = useMemo(() => {
    if (location?.district) {
      const match = availableDistricts.find(
        (d) => d.toLowerCase() === location.district.toLowerCase()
      );
      return match || location.district;
    }
    return availableDistricts[0] || 'Bhopal';
  }, [location, availableDistricts]);

  // Overall Totals
  const totals = useMemo(() => {
    const totalCapacity = shelters.reduce((sum, s) => sum + (s.capacity || 0), 0);
    const totalOccupancy = shelters.reduce((sum, s) => sum + (s.currentOccupancy || 0), 0);
    const totalAvailable = shelters.reduce(
      (sum, s) =>
        sum +
        (typeof s.availableCapacity === 'number'
          ? s.availableCapacity
          : Math.max((s.capacity || 0) - (s.currentOccupancy || 0), 0)),
      0
    );
    const occupancyPercent = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

    return { totalCapacity, totalOccupancy, totalAvailable, occupancyPercent };
  }, [shelters]);

  // Filter shelters for the chart based on active scope and filters
  const chartFilteredShelters = useMemo(() => {
    let list = [...shelters];

    if (scopeMode === 'CURRENT') {
      const target = (activeDistrictName || '').toLowerCase();
      const currentDistrictShelters = list.filter(
        (s) => s.district && s.district.toLowerCase() === target
      );
      if (currentDistrictShelters.length > 0) {
        list = currentDistrictShelters;
      } else {
        // If no shelters in active district, show top occupied
        list = list.sort((a, b) => (b.currentOccupancy || 0) - (a.currentOccupancy || 0)).slice(0, 8);
      }
    } else if (scopeMode === 'TOP') {
      list = list.sort((a, b) => (b.currentOccupancy || 0) - (a.currentOccupancy || 0)).slice(0, 8);
    } else if (scopeMode === 'CRITICAL') {
      list = list
        .filter((s) => {
          const occ = s.currentOccupancy || 0;
          const cap = s.capacity || 1;
          return s.status === 'FULL' || s.status === 'NEAR_CAPACITY' || occ / cap >= 0.7;
        })
        .sort(
          (a, b) =>
            (b.currentOccupancy || 0) / (b.capacity || 1) -
            (a.currentOccupancy || 0) / (a.capacity || 1)
        );
      if (list.length === 0) {
        list = [...shelters].sort((a, b) => (b.currentOccupancy || 0) - (a.currentOccupancy || 0)).slice(0, 8);
      }
    } else if (scopeMode === 'DISTRICT') {
      if (selectedDistrict && selectedDistrict !== 'ALL') {
        list = list.filter(
          (s) => s.district && s.district.toLowerCase() === selectedDistrict.toLowerCase()
        );
      }
    } else if (scopeMode === 'ALL') {
      // Decongest by showing top 12 nationwide by default to keep labels legible
      list = list.sort((a, b) => (b.currentOccupancy || 0) - (a.currentOccupancy || 0)).slice(0, 12);
    }

    // Search query within the chart
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.district?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [shelters, scopeMode, activeDistrictName, selectedDistrict, searchQuery]);

  // Prepare chart data with clean truncated display labels
  const chartData = useMemo(() => {
    return chartFilteredShelters.map((s) => {
      let shortName = s.name || 'Shelter';
      if (chartLayout === 'horizontal') {
        // Horizontal bar (Y-axis label)
        if (shortName.length > 24) {
          shortName = shortName.slice(0, 22) + '…';
        }
      } else {
        // Vertical column (X-axis label)
        if (shortName.length > 14) {
          shortName = shortName.slice(0, 12) + '…';
        }
      }
      return {
        name: shortName,
        fullName: s.name,
        district: s.district,
        state: s.state,
        status: s.status,
        Capacity: s.capacity || 0,
        Occupancy: s.currentOccupancy || 0,
      };
    });
  }, [chartFilteredShelters, chartLayout]);

  // Dynamic height for horizontal bar chart so rows never collide
  const dynamicChartHeight = useMemo(() => {
    if (chartLayout === 'vertical') return 360;
    return Math.max(340, chartData.length * 38);
  }, [chartLayout, chartData.length]);

  // Filtered shelters for the table
  const tableShelters = useMemo(() => {
    if (syncTableFilter) {
      return chartFilteredShelters;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return shelters.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.district?.toLowerCase().includes(q)
      );
    }
    return shelters;
  }, [shelters, syncTableFilter, chartFilteredShelters, searchQuery]);

  const openIntakeModal = (shelter) => {
    setSelectedShelter(shelter);
    setActionType('ADMIT');
    setChangeAmount(25);
    setDialogOpen(true);
  };

  const handleUpdateOccupancy = async () => {
    if (!selectedShelter || changeAmount <= 0) return;
    setUpdating(true);
    try {
      const delta = actionType === 'ADMIT' ? Number(changeAmount) : -Number(changeAmount);
      const newOccupancy = Math.max(0, Math.min(selectedShelter.capacity, (selectedShelter.currentOccupancy || 0) + delta));
      const newAvailable = Math.max(0, selectedShelter.capacity - newOccupancy);
      const newStatus =
        newOccupancy >= selectedShelter.capacity
          ? 'FULL'
          : newOccupancy >= selectedShelter.capacity * 0.8
          ? 'NEAR_CAPACITY'
          : 'AVAILABLE';

      await updateShelter(selectedShelter._id, {
        currentOccupancy: newOccupancy,
        availableCapacity: newAvailable,
        status: newStatus,
      });

      setSuccessMsg(`Successfully updated occupancy for ${selectedShelter.name} (${newOccupancy}/${selectedShelter.capacity} occupied).`);
      setDialogOpen(false);
      fetchShelters();
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err) {
      setError('Failed to update shelter occupancy: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdating(false);
    }
  };

  const isEmpty = !loading && !error && shelters.length === 0;

  return (
    <Boilerplate>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="caption" sx={{ color: isDark ? '#38bdf8' : '#0284c7', fontWeight: 700 }}>
            Incident Command &gt; Shelter Operations
          </Typography>
          <Typography variant="h5" fontWeight="bold">
            Carrying Capacity & Shelter Readiness
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Live occupancy tracking, overflow warnings, and field intake management across designated safe havens.
          </Typography>
        </Box>
        <Button variant="outlined" size="small" onClick={fetchShelters} sx={{ fontWeight: 600 }}>
          Refresh Grid
        </Button>
      </Box>

      {error && <Alert severity="warning" sx={{ my: 2 }}>{error}</Alert>}
      {successMsg && <Alert severity="success" sx={{ my: 2 }}>{successMsg}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : isEmpty ? (
        <Alert severity="info" sx={{ mt: 2 }}>No shelter capacity data found.</Alert>
      ) : (
        <>
          {/* Stat Cards */}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatCard label="Current Occupancy" value={totals.totalOccupancy.toLocaleString()} color="primary" />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatCard label="Max Grid Capacity" value={totals.totalCapacity.toLocaleString()} color="success.main" />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatCard label="Available Vacant Slots" value={totals.totalAvailable.toLocaleString()} color="secondary" />
            </Grid>
          </Grid>

          {/* Progress Bar */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mt: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle2" fontWeight="bold">Overall Grid Occupancy</Typography>
              <Typography variant="subtitle2" fontWeight="bold">{totals.occupancyPercent}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={totals.occupancyPercent}
              color={totals.occupancyPercent >= 90 ? 'error' : totals.occupancyPercent >= 70 ? 'warning' : 'success'}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Paper>

          {/* DECONGESTED & ENHANCED CAPACITY CHART */}
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 2,
              mt: 2,
              bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
            }}
          >
            {/* Chart Toolbar */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1.5}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Capacity vs Occupancy by Shelter
                  <Chip
                    size="small"
                    label={`${chartFilteredShelters.length} Facilities`}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 700, fontSize: '0.7rem', height: 22 }}
                  />
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {scopeMode === 'CURRENT' && `Filtered to active district: ${activeDistrictName}`}
                  {scopeMode === 'TOP' && 'Showing top 8 most loaded shelters nationwide'}
                  {scopeMode === 'CRITICAL' && 'Showing shelters operating near or above critical threshold'}
                  {scopeMode === 'DISTRICT' && `District: ${selectedDistrict || 'All'}`}
                  {scopeMode === 'ALL' && 'Showing top 12 shelters (decongested view)'}
                </Typography>
              </Box>

              {/* Scope Preset Buttons & Layout Switch */}
              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                <ButtonGroup size="small" variant="outlined" sx={{ borderRadius: 2 }}>
                  <Button
                    variant={scopeMode === 'CURRENT' ? 'contained' : 'outlined'}
                    onClick={() => {
                      setScopeMode('CURRENT');
                      setSelectedDistrict('');
                    }}
                    startIcon={<LocationOnOutlinedIcon sx={{ fontSize: 16 }} />}
                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.78rem' }}
                  >
                    Active: {activeDistrictName}
                  </Button>
                  <Button
                    variant={scopeMode === 'TOP' ? 'contained' : 'outlined'}
                    onClick={() => {
                      setScopeMode('TOP');
                      setSelectedDistrict('');
                    }}
                    startIcon={<WhatshotIcon sx={{ fontSize: 16 }} />}
                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.78rem' }}
                  >
                    Top 8
                  </Button>
                  <Button
                    variant={scopeMode === 'CRITICAL' ? 'contained' : 'outlined'}
                    onClick={() => {
                      setScopeMode('CRITICAL');
                      setSelectedDistrict('');
                    }}
                    startIcon={<WarningAmberIcon sx={{ fontSize: 16 }} />}
                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.78rem' }}
                  >
                    Critical
                  </Button>
                  <Button
                    variant={scopeMode === 'ALL' ? 'contained' : 'outlined'}
                    onClick={() => {
                      setScopeMode('ALL');
                      setSelectedDistrict('');
                    }}
                    startIcon={<LayersOutlinedIcon sx={{ fontSize: 16 }} />}
                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.78rem' }}
                  >
                    All Top 12
                  </Button>
                </ButtonGroup>

                {/* District Selector */}
                <TextField
                  select
                  size="small"
                  value={selectedDistrict || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedDistrict(val);
                    setScopeMode(val ? 'DISTRICT' : 'CURRENT');
                  }}
                  displayEmpty
                  sx={{ minWidth: 150, '& .MuiSelect-select': { py: 0.65, fontSize: '0.78rem' } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FilterAltOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.8rem' }}>
                    <em>Choose District...</em>
                  </MenuItem>
                  {availableDistricts.map((dist) => (
                    <MenuItem key={dist} value={dist} sx={{ fontSize: '0.8rem' }}>
                      {dist}
                    </MenuItem>
                  ))}
                </TextField>

                {/* Chart Layout Toggle */}
                <ButtonGroup size="small" variant="outlined" sx={{ borderRadius: 2 }}>
                  <MuiTooltip title="Horizontal Bars (Recommended - Zero label overlap)">
                    <Button
                      variant={chartLayout === 'horizontal' ? 'contained' : 'outlined'}
                      onClick={() => setChartLayout('horizontal')}
                      sx={{ minWidth: 36, px: 1 }}
                    >
                      <TableRowsIcon sx={{ fontSize: 18 }} />
                    </Button>
                  </MuiTooltip>
                  <MuiTooltip title="Vertical Columns">
                    <Button
                      variant={chartLayout === 'vertical' ? 'contained' : 'outlined'}
                      onClick={() => setChartLayout('vertical')}
                      sx={{ minWidth: 36, px: 1 }}
                    >
                      <ViewWeekIcon sx={{ fontSize: 18 }} />
                    </Button>
                  </MuiTooltip>
                </ButtonGroup>
              </Box>
            </Box>

            {/* Live Chart Rendering */}
            {chartData.length === 0 ? (
              <Box py={6} textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  No shelters found for the selected scope or filter.
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => {
                    setScopeMode('ALL');
                    setSelectedDistrict('');
                    setSearchQuery('');
                  }}
                  sx={{ mt: 1, fontWeight: 700 }}
                >
                  Reset Scope to All Shelters
                </Button>
              </Box>
            ) : (
              <Box sx={{ width: '100%', height: dynamicChartHeight, transition: 'height 0.25s ease' }}>
                <ResponsiveContainer width="100%" height="100%">
                  {chartLayout === 'horizontal' ? (
                    /* HORIZONTAL BAR LAYOUT: Shelter names on Y-Axis (zero rotation, perfectly readable) */
                    <BarChart
                      layout="vertical"
                      data={chartData}
                      margin={{ top: 8, right: 30, left: 160, bottom: 8 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke={isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}
                      />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }}
                        stroke={isDark ? '#475569' : '#cbd5e1'}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={150}
                        interval={0}
                        tick={{ fontSize: 11, fontWeight: 600, fill: isDark ? '#cbd5e1' : '#334155' }}
                        stroke={isDark ? '#475569' : '#cbd5e1'}
                      />
                      <RechartsTooltip content={<CustomShelterTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }} />
                      <Legend wrapperStyle={{ paddingTop: 8, fontSize: '0.8rem' }} />
                      <Bar
                        dataKey="Capacity"
                        fill={isDark ? '#38bdf8' : '#93c5fd'}
                        radius={[0, 4, 4, 0]}
                        barSize={14}
                      />
                      <Bar
                        dataKey="Occupancy"
                        fill="#2563eb"
                        radius={[0, 4, 4, 0]}
                        barSize={14}
                      />
                    </BarChart>
                  ) : (
                    /* VERTICAL COLUMN LAYOUT: With spaced ticks and angle */
                    <BarChart
                      layout="horizontal"
                      data={chartData}
                      margin={{ top: 8, right: 20, left: 0, bottom: 65 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: isDark ? '#cbd5e1' : '#334155' }}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                        height={65}
                        stroke={isDark ? '#475569' : '#cbd5e1'}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }}
                        stroke={isDark ? '#475569' : '#cbd5e1'}
                      />
                      <RechartsTooltip content={<CustomShelterTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }} />
                      <Legend wrapperStyle={{ paddingTop: 8, fontSize: '0.8rem' }} />
                      <Bar
                        dataKey="Capacity"
                        fill={isDark ? '#38bdf8' : '#93c5fd'}
                        radius={[4, 4, 0, 0]}
                        barSize={chartData.length > 10 ? 14 : 26}
                      />
                      <Bar
                        dataKey="Occupancy"
                        fill="#2563eb"
                        radius={[4, 4, 0, 0]}
                        barSize={chartData.length > 10 ? 14 : 26}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>

          {/* SHELTER DIRECTORY TABLE & SEARCH */}
          {shelters.length > 0 && (
            <Paper variant="outlined" sx={{ borderRadius: 2, mt: 3, overflow: 'hidden' }}>
              <Box
                p={2}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap={1.5}
                sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', borderBottom: '1px solid', borderColor: 'divider' }}
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Shelter Intake & Operational Roster
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Showing {tableShelters.length} of {shelters.length} registered facilities
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                  <Button
                    size="small"
                    variant={syncTableFilter ? 'contained' : 'outlined'}
                    onClick={() => setSyncTableFilter(!syncTableFilter)}
                    sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    {syncTableFilter ? '✓ Filtered by Chart' : 'Filter by Chart Scope'}
                  </Button>

                  <TextField
                    size="small"
                    placeholder="Search shelter or district..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ width: 220, '& .MuiInputBase-input': { py: 0.6, fontSize: '0.8rem' } }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </Box>

              <TableContainer sx={{ maxHeight: 440 }}>
                <Table size="small" stickyHeader>
                  <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Shelter Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>District</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Capacity</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Occupancy</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Available</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Field Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableShelters.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          No shelters found matching query "{searchQuery}".
                        </TableCell>
                      </TableRow>
                    ) : (
                      tableShelters.map((s) => {
                        const available =
                          typeof s.availableCapacity === 'number'
                            ? s.availableCapacity
                            : Math.max((s.capacity || 0) - (s.currentOccupancy || 0), 0);
                        return (
                          <TableRow key={s._id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                            <TableCell>{s.district}</TableCell>
                            <TableCell align="right">{s.capacity?.toLocaleString()}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>{s.currentOccupancy?.toLocaleString()}</TableCell>
                            <TableCell align="right" sx={{ color: '#16a34a', fontWeight: 700 }}>{available?.toLocaleString()}</TableCell>
                            <TableCell align="center">
                              <Chip
                                size="small"
                                label={s.status}
                                color={STATUS_COLORS[s.status] || 'default'}
                                sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => openIntakeModal(s)}
                                startIcon={<PersonAddAlt1OutlinedIcon />}
                                sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'none' }}
                              >
                                Intake / Dispatch
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </>
      )}

      {/* Field Intake / Discharge Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {actionType === 'ADMIT' ? 'Admit Evacuee Batch' : 'Discharge Evacuee Batch'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Shelter: <strong>{selectedShelter?.name}</strong> (Capacity: {selectedShelter?.capacity})
          </Typography>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Operation Mode"
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
            >
              <MenuItem value="ADMIT">Admit Incoming Evacuees (+)</MenuItem>
              <MenuItem value="DISCHARGE">Discharge / Transferred Out (-)</MenuItem>
            </TextField>

            <TextField
              fullWidth
              size="small"
              type="number"
              label="Number of People"
              value={changeAmount}
              onChange={(e) => setChangeAmount(Math.max(1, Number(e.target.value)))}
              inputProps={{ min: 1 }}
            />

            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Projected New Occupancy:{' '}
              <strong>
                {Math.max(
                  0,
                  Math.min(
                    selectedShelter?.capacity || 1000,
                    (selectedShelter?.currentOccupancy || 0) +
                      (actionType === 'ADMIT' ? Number(changeAmount) : -Number(changeAmount))
                  )
                )}{' '}
                / {selectedShelter?.capacity}
              </strong>
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={updating}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpdateOccupancy}
            disabled={updating}
            sx={{ bgcolor: actionType === 'ADMIT' ? '#16a34a' : '#ea580c', fontWeight: 700 }}
          >
            {updating ? <CircularProgress size={20} /> : 'Confirm Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Boilerplate>
  );
}
