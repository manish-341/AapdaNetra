import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  TextField,
  Button,
  Divider,
  FormControlLabel,
  Switch,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Boilerplate from '../layouts/Boilerplate';
import { getUserById, updateUser } from '../services/api';

const PRIORITIES = [
  { value: 'IMMEDIATE', label: 'Immediate' },
  { value: 'SHORT_TERM', label: 'Short Term' },
  { value: 'MEDIUM_TERM', label: 'Medium Term' },
  { value: 'MONITOR', label: 'Monitor' },
];

const SETTINGS_STORAGE_KEY = 'aapdanetra_system_settings';

const DEFAULT_SYSTEM_SETTINGS = {
  riskThreshold: 70,
  emailNotifications: true,
  smsNotifications: false,
  defaultRelocationPriority: 'MONITOR',
};

// ---- Profile section --------------------------------------------------
// Assumes the logged-in user's Mongo _id is stored under this key
// (e.g. set at login time). Adjust to match wherever your auth flow
// actually keeps it if it's different — this is the one piece I'm
// guessing at since no auth/login code has been shared yet.
const CURRENT_USER_ID_KEY = 'currentUserId';

function ProfileSection({ onSnackbar }) {
  const [userId] = useState(() => localStorage.getItem(CURRENT_USER_ID_KEY));
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError('No logged-in user found.');
      return;
    }
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getUserById(userId);
        const user = res?.data?.data || res?.data?.user || res?.data;
        setForm({ name: user?.name || '', email: user?.email || '', password: '' });
      } catch (err) {
        setError('Failed to load your profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const payload = { name: form.name, email: form.email };
      if (form.password.trim()) payload.password = form.password;
      await updateUser(userId, payload);
      setForm((f) => ({ ...f, password: '' }));
      onSnackbar('Profile updated.', 'success');
    } catch (err) {
      onSnackbar('Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 3 }}>
      <Typography variant="overline" color="text.secondary" fontWeight={700}>
        Profile
      </Typography>

      {!userId && (
        <Alert severity="info" sx={{ mt: 1.5 }}>
          No logged-in user id found in local storage (key: <code>{CURRENT_USER_ID_KEY}</code>).
          Wire this up to wherever your login flow stores the current user, and this section
          will load and save that account automatically.
        </Alert>
      )}

      {userId && loading && (
        <Box display="flex" justifyContent="center" py={3}>
          <CircularProgress size={28} />
        </Box>
      )}

      {userId && error && <Alert severity="warning" sx={{ mt: 1.5 }}>{error}</Alert>}

      {userId && !loading && !error && (
        <Stack spacing={2} mt={2}>
          <TextField
            label="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlinedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlinedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="New Password (leave blank to keep current)"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
          <Box>
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Profile'}
            </Button>
          </Box>
        </Stack>
      )}
    </Paper>
  );
}

// ---- System settings section ------------------------------------------
// No backend model exists for this yet, so it's stored in localStorage
// for now. If you want these values enforced server-side (e.g. the risk
// threshold actually driving alert generation), this needs a real
// Settings schema + route later — happy to add that when you're ready.
function SystemSettingsSection({ onSnackbar }) {
  const [settings, setSettings] = useState(DEFAULT_SYSTEM_SETTINGS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) setSettings({ ...DEFAULT_SYSTEM_SETTINGS, ...JSON.parse(stored) });
    } catch {
      // ignore malformed storage, fall back to defaults
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    onSnackbar('System settings saved on this device.', 'success');
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 3, mt: 3 }}>
      <Typography variant="overline" color="text.secondary" fontWeight={700}>
        System Settings
      </Typography>
      <Alert severity="info" sx={{ mt: 1.5, mb: 1 }}>
        These are stored locally on this browser only — they aren't shared across
        devices or enforced by the backend yet.
      </Alert>

      <Stack spacing={2} mt={2}>
        <TextField
          label="Risk Alert Threshold (%)"
          type="number"
          value={settings.riskThreshold}
          onChange={(e) =>
            setSettings({ ...settings, riskThreshold: Math.min(100, Math.max(0, Number(e.target.value))) })
          }
          inputProps={{ min: 0, max: 100 }}
          fullWidth
        />
        <TextField
          select
          label="Default Relocation Priority"
          value={settings.defaultRelocationPriority}
          onChange={(e) => setSettings({ ...settings, defaultRelocationPriority: e.target.value })}
          fullWidth
        >
          {PRIORITIES.map((p) => (
            <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
          ))}
        </TextField>

        <Divider />

        <FormControlLabel
          control={
            <Switch
              checked={settings.emailNotifications}
              onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
            />
          }
          label="Email notifications for new alerts"
        />
        <FormControlLabel
          control={
            <Switch
              checked={settings.smsNotifications}
              onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
            />
          }
          label="SMS notifications for new alerts"
        />

        <Box>
          <Button variant="contained" onClick={handleSave}>Save System Settings</Button>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function Settings() {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  return (
    <Boilerplate>
      <Typography variant="h5" fontWeight="bold" mb={2}>Settings</Typography>

      <ProfileSection onSnackbar={showSnackbar} />
      <SystemSettingsSection onSnackbar={showSnackbar} />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Boilerplate>
  );
}
