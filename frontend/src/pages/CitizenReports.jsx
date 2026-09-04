import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, MenuItem,
  Chip, Stack, CircularProgress, Alert as MuiAlert, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import Boilerplate from '../layouts/Boilerplate';
import { getCitizenReports, submitCitizenReport, verifyCitizenReport } from '../services/api';
import { getUserRole } from '../lib/auth';
import { useThemeMode } from '../context/ThemeContext';
import { useLocationContext } from '../context/LocationContext';

const DISASTER_TYPES = ["FLOOD", "LANDSLIDE", "WILDFIRE", "EARTHQUAKE", "HEATWAVE", "OTHER"];

export default function CitizenReports() {
  const role = getUserRole();
  const isResponder = ["ADMIN", "DISTRICT_OFFICER", "FIELD_OFFICER", "RESPONDER"].includes(role);
  const { isDark } = useThemeMode();
  const { location } = useLocationContext();
  const textMain = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const itemBg = isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc';
  const itemBorder = isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0';

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [description, setDescription] = useState('');
  const [disasterType, setDisasterType] = useState('FLOOD');
  const [latitude, setLatitude] = useState(location.lat.toString());
  const [longitude, setLongitude] = useState(location.lng.toString());
  const [detectedAddress, setDetectedAddress] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setMessage({ type: 'warning', text: 'Geolocation is not supported by your browser.' });
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lon = pos.coords.longitude.toFixed(4);
        setLatitude(lat);
        setLongitude(lon);
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const geoData = await geoRes.json();
          const addr = geoData.display_name || `${lat}, ${lon}`;
          setDetectedAddress(addr);
          setMessage({ type: 'info', text: `📍 Live Location Acquired: ${addr}` });
        } catch {
          setDetectedAddress(`Coordinates: ${lat}, ${lon}`);
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        setMessage({ type: 'warning', text: `GPS error (${err.message}). Using manual coordinates.` });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await getCitizenReports();
      setReports(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    setSubmitting(true);
    setMessage(null);
    try {
      const res = await submitCitizenReport({
        description,
        disasterType,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      });

      setMessage({ type: 'success', text: `Report submitted! AI Classified as: ${res.data?.data?.aiClassification?.disasterType || disasterType} (Severity: ${res.data?.data?.aiClassification?.severity})` });
      setDescription('');
      fetchReports();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Report submission failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (id, action) => {
    try {
      await verifyCitizenReport(id, { action });
      fetchReports();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Boilerplate>
      <Box mb={3}>
        <Typography variant="caption" sx={{ color: textSecondary }}>Home &gt; Smart Citizen Reporting</Typography>
        <Typography variant="h5" fontWeight="bold" sx={{ color: textMain, mt: 0.5 }}>
          Smart Citizen Reporting & Verification System
        </Typography>
        <Typography variant="body2" sx={{ color: textSecondary }}>
          Submit disaster observations. AI extracts severity, category, and priority. Responders review and verify reports before official status update.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Submit Report Form */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper className="glass-card" sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: textMain, mb: 2 }}>
              Submit New Disaster Report
            </Typography>

            {message && (
              <MuiAlert severity={message.type} sx={{ mb: 2, borderRadius: 2 }}>
                {message.text}
              </MuiAlert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  select
                  fullWidth
                  label="Disaster Type"
                  value={disasterType}
                  onChange={(e) => setDisasterType(e.target.value)}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { color: textMain } }}
                >
                  {DISASTER_TYPES.map(t => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Observation Description"
                  placeholder="Describe what you see e.g., 'Water covering the road near Sector 12, depth about 2 feet...'"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  size="small"
                  required
                  sx={{ '& .MuiOutlinedInput-root': { color: textMain } }}
                />

                <Box>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={handleDetectLocation}
                    disabled={gpsLoading}
                    startIcon={gpsLoading ? <CircularProgress size={16} /> : <MyLocationIcon />}
                    sx={{ fontWeight: 600, mb: 1, textTransform: 'none', borderColor: '#0284c7', color: '#0284c7' }}
                  >
                    {gpsLoading ? 'Acquiring satellite GPS fix...' : '📍 Detect My Live GPS Location'}
                  </Button>
                  {detectedAddress && (
                    <Typography variant="caption" sx={{ color: isDark ? '#38bdf8' : '#0284c7', display: 'block', mb: 1 }}>
                      {detectedAddress}
                    </Typography>
                  )}
                </Box>

                <Grid container spacing={1}>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      fullWidth
                      label="Latitude"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      fullWidth
                      label="Longitude"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      size="small"
                    />
                  </Grid>
                </Grid>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={18} /> : <CloudUploadIcon />}
                  sx={{ backgroundColor: '#2563eb', fontWeight: 700, py: 1.2 }}
                >
                  {submitting ? 'Submitting & AI Classifying...' : 'Submit Report for Verification'}
                </Button>
              </Stack>
            </form>
          </Paper>
        </Grid>

        {/* Reports Feed */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper className="glass-card" sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: textMain, mb: 2 }}>
              Submitted Reports Feed ({reports.length})
            </Typography>

            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress sx={{ color: isDark ? '#38bdf8' : '#0284c7' }} />
              </Box>
            ) : reports.length === 0 ? (
              <Typography variant="body2" sx={{ color: textSecondary }}>No reports submitted yet.</Typography>
            ) : (
              <Stack spacing={2} maxHeight={550} sx={{ overflowY: 'auto' }}>
                {reports.map((r) => (
                  <Paper key={r._id} sx={{ p: 2, borderRadius: 2, backgroundColor: itemBg, border: `1px solid ${itemBorder}` }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Chip
                          label={r.status}
                          size="small"
                          color={r.status === 'VERIFIED' ? 'success' : r.status === 'REJECTED' ? 'error' : 'warning'}
                          sx={{ fontWeight: 800, fontSize: '0.65rem', mr: 1 }}
                        />
                        <Chip
                          label={r.disasterType}
                          size="small"
                          variant="outlined"
                          sx={{ color: isDark ? '#38bdf8' : '#0284c7', borderColor: isDark ? 'rgba(56,189,248,0.3)' : 'rgba(2,132,199,0.3)', fontSize: '0.65rem' }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: textSecondary }}>
                        {new Date(r.createdAt).toLocaleString()}
                      </Typography>
                    </Box>

                    <Typography variant="body2" sx={{ color: textMain, my: 1 }}>
                      {r.description}
                    </Typography>

                    {/* AI extracted metadata */}
                    {r.aiClassification && (
                      <Box sx={{ p: 1, borderRadius: 1, backgroundColor: 'rgba(56,189,248,0.08)', mt: 1 }}>
                        <Typography variant="caption" display="block" sx={{ color: '#38bdf8', fontWeight: 700 }}>
                          🤖 AI Classification: Category: {r.aiClassification.category} • Severity: {r.aiClassification.severity} • Priority: {r.aiClassification.priority}
                        </Typography>
                      </Box>
                    )}

                    {/* Verification Actions for Responders */}
                    {isResponder && r.status === 'SUBMITTED' && (
                      <Stack direction="row" spacing={1} mt={1.5}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleVerify(r._id, 'verify')}
                          sx={{ fontSize: '0.7rem', fontWeight: 700 }}
                        >
                          Verify Report
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => handleVerify(r._id, 'reject')}
                          sx={{ fontSize: '0.7rem' }}
                        >
                          Reject
                        </Button>
                      </Stack>
                    )}
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Boilerplate>
  );
}
