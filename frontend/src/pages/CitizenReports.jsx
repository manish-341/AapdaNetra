import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Chip,
  Stack,
  CircularProgress,
  Alert as MuiAlert,
  IconButton,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import SearchIcon from '@mui/icons-material/Search';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import VerifiedIcon from '@mui/icons-material/Verified';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import Boilerplate from '../layouts/Boilerplate';
import { getCitizenReports, submitCitizenReport, verifyCitizenReport } from '../services/api';
import { getUserRole } from '../lib/auth';
import { useThemeMode } from '../context/ThemeContext';
import { useLocationContext } from '../context/LocationContext';

const DISASTER_TYPES = [
  { id: 'FLOOD', label: 'Flood', icon: '🌊', color: '#0284c7' },
  { id: 'LANDSLIDE', label: 'Landslide', icon: '🏔️', color: '#d97706' },
  { id: 'WILDFIRE', label: 'Wildfire', icon: '🔥', color: '#dc2626' },
  { id: 'HEATWAVE', label: 'Heatwave', icon: '☀️', color: '#f59e0b' },
  { id: 'EARTHQUAKE', label: 'Earthquake', icon: '🌍', color: '#7c3aed' },
  { id: 'OTHER', label: 'Other Hazard', icon: '⚠️', color: '#64748b' },
];

const QUICK_TAGS = [
  '🌊 Waist-Deep Water',
  '🚗 Vehicles Stranded',
  '⚡ Electric Lines Down',
  '🏠 Houses Inundated',
  '⛰️ Visible Slope Cracks',
  '🚫 Road Impassable',
  '🏥 Elderly / Children Trapped',
  '💧 Drinking Water Contaminated',
];

export default function CitizenReports() {
  const role = getUserRole();
  const isResponder = ['ADMIN', 'DISTRICT_OFFICER', 'FIELD_OFFICER', 'RESPONDER'].includes(role);
  const { isDark } = useThemeMode();
  const { location } = useLocationContext();

  const textMain = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#475569';
  const itemBg = isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc';
  const itemBorder = isDark ? 'rgba(255,255,255,0.07)' : '#e2e8f0';

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [description, setDescription] = useState('');
  const [disasterType, setDisasterType] = useState('FLOOD');
  const [latitude, setLatitude] = useState(location.lat || 23.2599);
  const [longitude, setLongitude] = useState(location.lng || 77.4126);
  const [detectedAddress, setDetectedAddress] = useState(location.name || '');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [message, setMessage] = useState(null);

  // Filter & Search in reports feed
  const [filterTab, setFilterTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await getCitizenReports();
      setReports(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Sync initial location from context if available
  useEffect(() => {
    if (location?.lat && location?.lng) {
      setLatitude(location.lat);
      setLongitude(location.lng);
      setDetectedAddress(location.name || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
    }
  }, [location]);

  const handleMapLocationSelect = async (lat, lon) => {
    const fixedLat = parseFloat(lat.toFixed(4));
    const fixedLon = parseFloat(lon.toFixed(4));
    setLatitude(fixedLat);
    setLongitude(fixedLon);

    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${fixedLat}&lon=${fixedLon}`
      );
      const geoData = await geoRes.json();
      const addr = geoData.display_name || `${fixedLat}, ${fixedLon}`;
      setDetectedAddress(addr);
    } catch {
      setDetectedAddress(`Coordinates: ${fixedLat}, ${fixedLon}`);
    }
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setMessage({ type: 'warning', text: 'Geolocation is not supported by your browser.' });
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lon = parseFloat(pos.coords.longitude.toFixed(4));
        setLatitude(lat);
        setLongitude(lon);
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
          );
          const geoData = await geoRes.json();
          const addr = geoData.display_name || `${lat}, ${lon}`;
          setDetectedAddress(addr);
          setMessage({ type: 'info', text: `📍 GPS Fix Acquired: ${addr}` });
        } catch {
          setDetectedAddress(`GPS Coordinates: ${lat}, ${lon}`);
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        setMessage({ type: 'warning', text: `GPS error: ${err.message}. Click map to set pin.` });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAppendTag = (tag) => {
    setDescription((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}, ${tag}` : tag;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setMessage({ type: 'error', text: 'Please enter a description of the observation.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const res = await submitCitizenReport({
        description,
        disasterType,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        imageUrl: imagePreview || null,
      });

      const classification = res.data?.data?.aiClassification;
      setMessage({
        type: 'success',
        text: `Report successfully filed! AI Triaged as: ${classification?.disasterType || disasterType} (Severity: ${classification?.severity || 'HIGH'}, Priority: ${classification?.priority || 'URGENT'})`,
      });

      setDescription('');
      setSelectedImage(null);
      setImagePreview(null);
      fetchReports();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Report submission failed. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (id, action) => {
    try {
      await verifyCitizenReport(id, { action });
      fetchReports();
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    // Status tab filter
    if (filterTab === 'CRITICAL' && !['CRITICAL', 'HIGH'].includes(r.severity)) return false;
    if (filterTab === 'UNDER_REVIEW' && r.status !== 'SUBMITTED' && r.status !== 'UNDER_REVIEW') return false;
    if (filterTab === 'VERIFIED' && r.status !== 'VERIFIED') return false;
    if (filterTab === 'RESOLVED' && r.status !== 'RESOLVED') return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const descMatch = (r.description || '').toLowerCase().includes(q);
      const typeMatch = (r.disasterType || '').toLowerCase().includes(q);
      const catMatch = (r.aiClassification?.category || '').toLowerCase().includes(q);
      return descMatch || typeMatch || catMatch;
    }

    return true;
  });

  // KPI telemetry counts
  const totalCount = reports.length;
  const criticalCount = reports.filter((r) => ['CRITICAL', 'HIGH'].includes(r.severity)).length;
  const underReviewCount = reports.filter(
    (r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW'
  ).length;
  const verifiedCount = reports.filter((r) => r.status === 'VERIFIED').length;

  return (
    <Boilerplate>
      {/* Page Header */}
      <Box sx={{ mb: 4.5 }}>
        <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 600 }}>
          Home &gt; Citizen Intelligence &gt; Smart Disaster Reporting
        </Typography>
        <Typography variant="h5" fontWeight="bold" sx={{ color: textMain, mt: 0.75, mb: 1 }}>
          Smart Citizen Reporting & AI Verification Cockpit
        </Typography>
        <Typography variant="body2" sx={{ color: textSecondary, maxWidth: 920, lineHeight: 1.6 }}>
          Report ground-level disaster hazards with interactive map pin-dropping. Real-time AI automatically extracts severity, category, and dispatch priority for responders.
        </Typography>
      </Box>

      {/* KPI Telemetry Header Grid */}
      <Box sx={{ mb: 4.5 }}>
        <Grid container spacing={3}>
          {[
            { label: 'Total Incidents Logged', val: totalCount, icon: '📋', color: '#0284c7' },
            { label: 'High & Critical Threats', val: criticalCount, icon: '🚨', color: '#ef4444' },
            { label: 'Pending AI/Field Review', val: underReviewCount, icon: '⏳', color: '#f59e0b' },
            { label: 'Verified & Dispatched', val: verifiedCount, icon: '✅', color: '#10b981' },
          ].map((kpi, idx) => (
            <Grid key={idx} size={{ xs: 6, sm: 6, md: 3 }}>
              <Paper
                className="glass-card"
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  borderLeft: `5px solid ${kpi.color}`,
                  boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.05)',
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2.5,
                    bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    flexShrink: 0,
                  }}
                >
                  {kpi.icon}
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: textMain, lineHeight: 1.1 }}>
                    {kpi.val}
                  </Typography>
                  <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.72rem', fontWeight: 600 }}>
                    {kpi.label}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Main Form and Feed Grid */}
      <Grid container spacing={3.5}>
        {/* Left Form: Submit New Report (5 columns) */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper
            className="glass-card"
            sx={{
              p: 3.5,
              borderRadius: 3.5,
              boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.35)' : '0 4px 20px rgba(0,0,0,0.06)',
            }}
          >
            <Box display="flex" alignItems="center" gap={1.25} mb={2.5}>
              <ReportProblemIcon sx={{ color: '#0284c7', fontSize: 26 }} />
              <Typography variant="h6" fontWeight="bold" sx={{ color: textMain }}>
                Report Ground Incident
              </Typography>
            </Box>

            {message && (
              <MuiAlert
                severity={message.type}
                onClose={() => setMessage(null)}
                sx={{ mb: 2.5, borderRadius: 2.5 }}
              >
                {message.text}
              </MuiAlert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={2.75}>
                {/* 1. Hazard Type Visual Select Chips */}
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight="700"
                    sx={{ color: textSecondary, display: 'block', mb: 1.25, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}
                  >
                    Select Disaster Classification
                  </Typography>
                  <Grid container spacing={1.25}>
                    {DISASTER_TYPES.map((type) => {
                      const isSelected = disasterType === type.id;
                      return (
                        <Grid key={type.id} size={{ xs: 4, sm: 4 }}>
                          <Box
                            onClick={() => setDisasterType(type.id)}
                            sx={{
                              p: 1.25,
                              borderRadius: 2.5,
                              textAlign: 'center',
                              cursor: 'pointer',
                              border: isSelected
                                ? `2px solid ${type.color}`
                                : `1px solid ${itemBorder}`,
                              bgcolor: isSelected
                                ? isDark
                                  ? 'rgba(56, 189, 248, 0.15)'
                                  : 'rgba(2, 132, 199, 0.1)'
                                : itemBg,
                              transition: 'all 0.15s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                borderColor: type.color,
                              },
                            }}
                          >
                            <Box sx={{ fontSize: 22, mb: 0.5 }}>{type.icon}</Box>
                            <Typography
                              variant="caption"
                              fontWeight={isSelected ? 800 : 600}
                              sx={{
                                color: isSelected ? (isDark ? '#38bdf8' : '#0284c7') : textMain,
                                fontSize: '0.74rem',
                                display: 'block',
                              }}
                            >
                              {type.label}
                            </Typography>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>

                {/* 2. Incident Location & Live GPS */}
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight="700"
                    sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5, display: 'block', mb: 1.25 }}
                  >
                    Incident Location & Live GPS Fix *
                  </Typography>

                  {/* ONLY THE BIGGER PROMINENT AUTO GPS BUTTON */}
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleDetectGPS}
                    disabled={gpsLoading}
                    startIcon={
                      gpsLoading ? (
                        <CircularProgress size={18} sx={{ color: '#ffffff' }} />
                      ) : (
                        <MyLocationIcon sx={{ fontSize: 20 }} />
                      )
                    }
                    sx={{
                      py: 1.35,
                      mb: 1.5,
                      borderRadius: 2.5,
                      fontWeight: 800,
                      fontSize: '0.86rem',
                      textTransform: 'none',
                      letterSpacing: 0.3,
                      background: isDark
                        ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                        : 'linear-gradient(135deg, #047857 0%, #059669 100%)',
                      color: '#ffffff',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      '&:hover': {
                        background: isDark
                          ? 'linear-gradient(135deg, #047857 0%, #059669 100%)'
                          : 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
                        boxShadow: '0 6px 18px rgba(16, 185, 129, 0.45)',
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {gpsLoading ? 'Acquiring Live Satellite / Device GPS Fix...' : '🎯 Auto-Detect My Live GPS Location'}
                  </Button>

                  {/* Location Address Display Card (Strictly bounded, wraps cleanly without overflow) */}
                  <Box
                    sx={{
                      p: 1.75,
                      borderRadius: 2.5,
                      bgcolor: isDark ? 'rgba(56, 189, 248, 0.08)' : 'rgba(2, 132, 199, 0.06)',
                      border: `1.5px solid ${isDark ? 'rgba(56, 189, 248, 0.28)' : 'rgba(2, 132, 199, 0.25)'}`,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1.5,
                      width: '100%',
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                    }}
                  >
                    <LocationOnIcon sx={{ color: '#0284c7', fontSize: 24, flexShrink: 0, mt: 0.2 }} />
                    <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{
                          color: textMain,
                          fontSize: '0.82rem',
                          lineHeight: 1.45,
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere',
                          display: 'block',
                        }}
                      >
                        {detectedAddress || 'Click button above to auto-detect live GPS coordinates'}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: textSecondary,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          display: 'inline-block',
                          mt: 0.5,
                        }}
                      >
                        Lat: {latitude} &bull; Lng: {longitude}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* 3. Eyewitness Observation Description */}
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight="700"
                    sx={{ color: textSecondary, display: 'block', mb: 1, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}
                  >
                    Eyewitness Description *
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Describe water depth, structural damages, trapped persons, road conditions, or fire spread..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    size="small"
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: textMain,
                        bgcolor: itemBg,
                        borderRadius: 2.5,
                      },
                    }}
                  />

                  {/* Quick observation tags */}
                  <Box mt={1.5}>
                    <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.7rem', fontWeight: 600, display: 'block', mb: 0.75 }}>
                      Quick Tags (Click to append):
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.75}>
                      {QUICK_TAGS.map((tag, idx) => (
                        <Chip
                          key={idx}
                          label={tag}
                          size="small"
                          onClick={() => handleAppendTag(tag)}
                          sx={{
                            fontSize: '0.68rem',
                            height: 24,
                            cursor: 'pointer',
                            borderRadius: 1.5,
                            bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                            color: textMain,
                            '&:hover': { bgcolor: isDark ? 'rgba(56,189,248,0.18)' : 'rgba(2,132,199,0.12)' },
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>

                {/* 4. Photo Evidence Upload */}
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight="700"
                    sx={{ color: textSecondary, display: 'block', mb: 1, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}
                  >
                    Attach Photo / Evidence (Optional)
                  </Typography>

                  {!imagePreview ? (
                    <Button
                      component="label"
                      fullWidth
                      variant="outlined"
                      startIcon={<AddPhotoAlternateIcon />}
                      sx={{
                        py: 1.75,
                        borderRadius: 2.5,
                        borderStyle: 'dashed',
                        borderWidth: '1.5px',
                        borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                        color: textSecondary,
                        textTransform: 'none',
                        fontSize: '0.78rem',
                        '&:hover': {
                          borderColor: '#0284c7',
                          color: '#0284c7',
                          bgcolor: isDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(2, 132, 199, 0.04)',
                        },
                      }}
                    >
                      Click or drag photo evidence here (JPG, PNG)
                      <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                    </Button>
                  ) : (
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        height: 110,
                        borderRadius: 2.5,
                        overflow: 'hidden',
                        border: `1px solid ${itemBorder}`,
                      }}
                    >
                      <img
                        src={imagePreview}
                        alt="Evidence Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                        }}
                        sx={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          bgcolor: 'rgba(0,0,0,0.6)',
                          color: '#ffffff',
                          '&:hover': { bgcolor: 'rgba(239,68,68,0.8)' },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>

                {/* 5. Submit Button */}
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                  startIcon={
                    submitting ? (
                      <CircularProgress size={18} sx={{ color: '#ffffff' }} />
                    ) : (
                      <AutoAwesomeIcon />
                    )
                  }
                  sx={{
                    py: 1.35,
                    borderRadius: 2.5,
                    background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    textTransform: 'none',
                    letterSpacing: 0.3,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%)',
                    },
                  }}
                >
                  {submitting
                    ? 'AI Analyzing & Submitting...'
                    : 'Dispatch Report & Trigger AI Triage'}
                </Button>
              </Stack>
            </form>
          </Paper>
        </Grid>

        {/* Right Section: Live Reports Feed (7 columns) */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper
            className="glass-card"
            sx={{
              p: 3.5,
              borderRadius: 3.5,
              boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.35)' : '0 4px 20px rgba(0,0,0,0.06)',
            }}
          >
            {/* Feed Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5} mb={2.5}>
              <Box display="flex" alignItems="center" gap={1.25}>
                <Box
                  sx={{
                    width: 11,
                    height: 11,
                    borderRadius: '50%',
                    bgcolor: '#10b981',
                    boxShadow: '0 0 10px #10b981',
                    animation: 'pulse-red 2s infinite',
                  }}
                />
                <Typography variant="h6" fontWeight="bold" sx={{ color: textMain }}>
                  Field Incident Intelligence Feed ({filteredReports.length})
                </Typography>
              </Box>

              {/* Search Bar */}
              <TextField
                size="small"
                placeholder="Search keywords, hazards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: textSecondary }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  width: { xs: '100%', sm: 240 },
                  '& .MuiOutlinedInput-root': {
                    color: textMain,
                    bgcolor: itemBg,
                    borderRadius: 2.5,
                    fontSize: '0.8rem',
                  },
                }}
              />
            </Box>

            {/* Filter Tabs */}
            <Box sx={{ mb: 3.5, mt: 0.5 }}>
              <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
                {[
                  { id: 'ALL', label: `All (${reports.length})` },
                  { id: 'CRITICAL', label: `🔴 High & Critical (${criticalCount})` },
                  { id: 'UNDER_REVIEW', label: `⏳ Pending Review (${underReviewCount})` },
                  { id: 'VERIFIED', label: `✅ Verified (${verifiedCount})` },
                ].map((tab) => {
                  const isSelected = filterTab === tab.id;
                  return (
                    <Chip
                      key={tab.id}
                      label={tab.label}
                      size="small"
                      onClick={() => setFilterTab(tab.id)}
                      color={isSelected ? 'primary' : 'default'}
                      variant={isSelected ? 'filled' : 'outlined'}
                      sx={{
                        fontSize: '0.72rem',
                        fontWeight: isSelected ? 800 : 600,
                        cursor: 'pointer',
                        borderRadius: 2,
                        py: 0.5,
                        borderColor: isSelected
                          ? '#0284c7'
                          : isDark
                          ? 'rgba(255,255,255,0.12)'
                          : 'rgba(0,0,0,0.12)',
                        bgcolor: isSelected
                          ? isDark
                            ? 'rgba(56, 189, 248, 0.25)'
                            : '#0284c7'
                          : 'transparent',
                        color: isSelected ? '#ffffff' : textMain,
                      }}
                    />
                  );
                })}
              </Stack>
            </Box>

            {/* List of Reports */}
            {loading ? (
              <Box display="flex" justifyContent="center" py={6}>
                <CircularProgress size={36} sx={{ color: '#0284c7' }} />
              </Box>
            ) : filteredReports.length === 0 ? (
              <Box sx={{ p: 5, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: textSecondary }}>
                  No incident reports found matching this criteria.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  maxHeight: 720,
                  overflowY: 'auto',
                  pr: 1,
                  pb: 2,
                  pt: 0.5,
                }}
              >
                {filteredReports.map((r) => {
                  const isCrit = r.severity === 'CRITICAL';
                  const isHigh = r.severity === 'HIGH';
                  const sevColor = isCrit ? '#ef4444' : isHigh ? '#f97316' : '#0284c7';

                  const typeObj =
                    DISASTER_TYPES.find((t) => t.id === (r.disasterType || '').toUpperCase()) ||
                    DISASTER_TYPES[0];

                  return (
                    <Paper
                      key={r._id}
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        backgroundColor: itemBg,
                        border: `1px solid ${itemBorder}`,
                        borderLeft: `5px solid ${sevColor}`,
                        boxShadow: isDark
                          ? '0 4px 20px rgba(0,0,0,0.25)'
                          : '0 2px 10px rgba(0,0,0,0.04)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        '&:hover': {
                          transform: 'translateX(3px)',
                          boxShadow: isDark
                            ? '0 8px 24px rgba(0,0,0,0.45)'
                            : '0 6px 18px rgba(0,0,0,0.08)',
                        },
                      }}
                    >
                      {/* Top Badges Row */}
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          {/* Status Chip */}
                          <Chip
                            label={r.status || 'SUBMITTED'}
                            size="small"
                            sx={{
                              fontSize: '0.65rem',
                              height: 22,
                              fontWeight: 800,
                              borderRadius: 1.5,
                              bgcolor:
                                r.status === 'VERIFIED'
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : r.status === 'REJECTED'
                                  ? 'rgba(239, 68, 68, 0.15)'
                                  : 'rgba(245, 158, 11, 0.15)',
                              color:
                                r.status === 'VERIFIED'
                                  ? '#10b981'
                                  : r.status === 'REJECTED'
                                  ? '#ef4444'
                                  : '#f59e0b',
                            }}
                          />

                          {/* Disaster Type */}
                          <Chip
                            label={`${typeObj.icon} ${r.disasterType || 'FLOOD'}`}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontSize: '0.68rem',
                              height: 22,
                              fontWeight: 700,
                              borderRadius: 1.5,
                              color: typeObj.color,
                              borderColor: `${typeObj.color}40`,
                            }}
                          />

                          {/* Severity */}
                          <Chip
                            label={`Severity: ${r.severity || 'HIGH'}`}
                            size="small"
                            sx={{
                              fontSize: '0.65rem',
                              height: 22,
                              fontWeight: 800,
                              borderRadius: 1.5,
                              bgcolor: `${sevColor}20`,
                              color: sevColor,
                            }}
                          />
                        </Box>

                        {/* Timestamp */}
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <AccessTimeIcon sx={{ fontSize: 14, color: textSecondary }} />
                          <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.7rem', fontWeight: 500 }}>
                            {new Date(r.createdAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Description */}
                      <Typography
                        variant="body2"
                        sx={{ color: textMain, my: 1.25, lineHeight: 1.6, fontSize: '0.86rem', fontWeight: 500 }}
                      >
                        {r.description}
                      </Typography>

                      {/* Attached Image if available */}
                      {r.imageUrl && (
                        <Box
                          sx={{
                            width: '100%',
                            maxHeight: 200,
                            borderRadius: 2,
                            overflow: 'hidden',
                            my: 1.5,
                          }}
                        >
                          <img
                            src={r.imageUrl}
                            alt="Attached Evidence"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </Box>
                      )}

                      {/* AI NLP Extraction Pill Banner */}
                      {r.aiClassification && (
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: isDark
                              ? 'rgba(56, 189, 248, 0.08)'
                              : 'rgba(2, 132, 199, 0.06)',
                            border: `1px solid ${isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(2, 132, 199, 0.18)'}`,
                            mt: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.25,
                          }}
                        >
                          <AutoAwesomeIcon sx={{ color: '#0284c7', fontSize: 18 }} />
                          <Box flex={1}>
                            <Typography
                              variant="caption"
                              fontWeight="700"
                              sx={{ color: isDark ? '#38bdf8' : '#0284c7', display: 'block', fontSize: '0.74rem' }}
                            >
                              AI Classification & NLP Triage
                            </Typography>
                            <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.7rem' }}>
                              Category: <strong>{r.aiClassification.category}</strong> &bull; Priority: <strong>{r.aiClassification.priority}</strong> &bull; Confidence: <strong>{Math.round((r.aiClassification.confidence || 0.88) * 100)}%</strong>
                            </Typography>
                          </Box>
                        </Box>
                      )}

                      {/* Responder Verification Action Buttons */}
                      {isResponder && r.status === 'SUBMITTED' && (
                        <Stack direction="row" spacing={1.25} mt={2} pt={1.5} borderTop={`1px solid ${itemBorder}`}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                            onClick={() => handleVerify(r._id, 'verify')}
                            sx={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              py: 0.4,
                              px: 1.25,
                              textTransform: 'none',
                              borderRadius: 1.5,
                            }}
                          >
                            Verify & Trigger Alert
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<CancelIcon sx={{ fontSize: 14 }} />}
                            onClick={() => handleVerify(r._id, 'reject')}
                            sx={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              py: 0.4,
                              px: 1.25,
                              textTransform: 'none',
                              borderRadius: 1.5,
                            }}
                          >
                            Dismiss
                          </Button>
                        </Stack>
                      )}
                    </Paper>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Boilerplate>
  );
}
