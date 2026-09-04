import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button, Alert, CircularProgress,
  MenuItem, Container, Grid
} from '@mui/material';
import ShieldAlertIcon from '@mui/icons-material/ShieldOutlined';
import { registerUser } from '../services/api';
import { setAuthToken } from '../lib/auth';
import { useThemeMode } from '../context/ThemeContext';

const ROLES = [
  { value: 'CITIZEN', label: 'Citizen / Resident' },
  { value: 'RESPONDER', label: 'Disaster Responder Team' },
  { value: 'FIELD_OFFICER', label: 'Field Officer' },
  { value: 'DISTRICT_OFFICER', label: 'District Officer' },
  { value: 'ADMIN', label: 'System Administrator' }
];

export default function Signup() {
  const navigate = useNavigate();
  const { isDark } = useThemeMode();
  const textMain = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'CITIZEN',
    district: 'Vindhya',
    state: 'Madhya Pradesh'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const setPreset = (district, state) => {
    setFormData(prev => ({ ...prev, district, state }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await registerUser(formData);
      const { token, ...user } = response.data.data;
      setAuthToken(token, user, true);

      // Immediately save active location for map and dashboard
      const activeLoc = {
        name: `${user.district} (${user.state || 'India'})`,
        district: user.district,
        state: user.state || 'India',
        lat: user.coordinates?.latitude || 24.5362,
        lng: user.coordinates?.longitude || 81.3038,
        isGPS: false
      };
      localStorage.setItem('an_active_location', JSON.stringify(activeLoc));

      navigate('/map', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: isDark ? '#090d16' : '#f4f6fb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 2
    }}>
      <Container maxWidth="sm">
        <Paper className="glass-card" sx={{ p: 4, borderRadius: 3, backgroundColor: isDark ? 'rgba(17, 24, 39, 0.85)' : '#ffffff' }}>
          <Box textAlign="center" mb={3}>
            <Box display="inline-flex" sx={{ width: 44, height: 44, borderRadius: 2, backgroundColor: isDark ? 'rgba(56,189,248,0.15)' : 'rgba(2,132,199,0.12)', color: isDark ? '#38bdf8' : '#0284c7', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <ShieldAlertIcon fontSize="large" />
            </Box>
            <Typography variant="h5" fontWeight="bold" sx={{ color: textMain }}>
              Create AapdaNetra Account
            </Typography>
            <Typography variant="caption" sx={{ color: textSecondary }}>
              Register for Disaster Intelligence Portal & Emergency Alerts
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Full Name" name="name" value={formData.name} onChange={handleChange} required size="small" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Email" type="email" name="email" value={formData.email} onChange={handleChange} required size="small" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Password" type="password" name="password" value={formData.password} onChange={handleChange} required size="small" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} size="small" />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField select fullWidth label="Role / Category" name="role" value={formData.role} onChange={handleChange} size="small">
                  {ROLES.map(r => (
                    <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                  <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 600 }}>
                    Select or Type Your District:
                  </Typography>
                </Box>
                <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                  {[
                    { label: '📍 Vindhya (MP)', district: 'Vindhya', state: 'Madhya Pradesh' },
                    { label: 'Rewa (MP)', district: 'Rewa', state: 'Madhya Pradesh' },
                    { label: 'Delhi (NCR)', district: 'Central Delhi', state: 'Delhi' },
                    { label: 'Bhopal (MP)', district: 'Bhopal', state: 'Madhya Pradesh' }
                  ].map(p => (
                    <Chip
                      key={p.district}
                      label={p.label}
                      size="small"
                      clickable
                      onClick={() => setPreset(p.district, p.state)}
                      sx={{
                        fontSize: '0.72rem',
                        fontWeight: formData.district === p.district ? 700 : 500,
                        bgcolor: formData.district === p.district ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.05)',
                        color: formData.district === p.district ? '#38bdf8' : textSecondary,
                        border: '1px solid',
                        borderColor: formData.district === p.district ? '#38bdf8' : 'rgba(255,255,255,0.1)'
                      }}
                    />
                  ))}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="District" name="district" value={formData.district} onChange={handleChange} size="small" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="State" name="state" value={formData.state} onChange={handleChange} size="small" />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              startIcon={loading && <CircularProgress size={18} />}
              sx={{ backgroundColor: '#2563eb', py: 1.2, fontWeight: 700, mt: 3, '&:hover': { backgroundColor: '#1d4ed8' } }}
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </Button>
          </form>

          <Box textAlign="center" mt={3} pt= {2} borderTop="1px solid rgba(255,255,255,0.08)">
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Already registered? <Link to="/login" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
