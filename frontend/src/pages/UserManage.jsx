import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
  Stack,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CloseIcon from '@mui/icons-material/Close';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import Boilerplate from '../layouts/Boilerplate';
import { getUsers, createUser, updateUser, deleteUser } from '../services/api';

// Matches the backend User schema's role enum exactly.
const ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'DISTRICT_OFFICER', label: 'District Officer' },
  { value: 'FIELD_OFFICER', label: 'Field Officer' },
  { value: 'RESPONDER', label: 'Responder' },
  { value: 'CITIZEN', label: 'Citizen' },
];

const ROLE_LABELS = Object.fromEntries(ROLES.map((r) => [r.value, r.label]));

const ROLE_COLORS = {
  ADMIN: 'error',
  DISTRICT_OFFICER: 'primary',
  FIELD_OFFICER: 'warning',
  RESPONDER: 'info',
  CITIZEN: 'default',
};

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'CITIZEN',
  district: '',
  state: '',
  isActive: true,
};

// Overrides the browser's default autofill highlight (the gray/blue tint
// seen on filled email/password fields) so it matches the field's normal
// background instead of clashing with it.
const AUTOFILL_FIX_SX = {
  '& input:-webkit-autofill': {
    WebkitBoxShadow: '0 0 0 1000px #ffffff inset',
    WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
    caretColor: 'rgba(0, 0, 0, 0.87)',
    borderRadius: 'inherit',
  },
};

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export default function UserManage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUsers();
      setUsers(res?.data?.data || []);
    } catch (err) {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesQuery =
        !query ||
        u.name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.district?.toLowerCase().includes(query) ||
        u.phone?.toLowerCase().includes(query);
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [users, search, roleFilter]);

  const openAddDialog = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowPassword(false);
    setDialogOpen(true);
  };

  const openEditDialog = (user) => {
    setEditingId(user._id);
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '', // never pre-filled; only sent if the admin types a new one
      phone: user.phone || '',
      role: user.role || 'CITIZEN',
      district: user.district || '',
      state: user.state || '',
      isActive: user.isActive !== false,
    });
    setShowPassword(false);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setSnackbar({ open: true, message: 'Name and email are required.', severity: 'error' });
      return;
    }
    if (!editingId && form.password.trim().length < 6) {
      setSnackbar({ open: true, message: 'Password must be at least 6 characters.', severity: 'error' });
      return;
    }

    // Only send a password field when one was actually typed — an empty
    // string would otherwise overwrite the stored hash on update.
    const payload = { ...form };
    if (!payload.password.trim()) {
      delete payload.password;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateUser(editingId, payload);
        setSnackbar({ open: true, message: 'User updated.', severity: 'success' });
      } else {
        await createUser(payload);
        setSnackbar({ open: true, message: 'User added.', severity: 'success' });
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (err) {
      setSnackbar({ open: true, message: 'Save failed. Please try again.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget._id);
      setSnackbar({ open: true, message: 'User removed.', severity: 'success' });
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      setSnackbar({ open: true, message: 'Delete failed. Please try again.', severity: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const isEmpty = !loading && !error && filteredUsers.length === 0;

  return (
    <Boilerplate>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
        <Typography variant="h5" fontWeight="bold">User Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog}>
          Add User
        </Button>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
        <TextField
          size="small"
          placeholder="Search by name, email, phone, or district"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Role</InputLabel>
          <Select label="Role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <MenuItem value="ALL">All Roles</MenuItem>
            {ROLES.map((role) => (
              <MenuItem key={role.value} value={role.value}>{role.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isEmpty && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {search || roleFilter !== 'ALL' ? 'No users match your filters.' : 'No users yet.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {filteredUsers.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>{initials(user.name)}</Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{user.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{user.phone || '—'}</TableCell>
                    <TableCell>
                      {[user.district, user.state].filter(Boolean).join(', ') || '—'}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={ROLE_LABELS[user.role] || user.role} color={ROLE_COLORS[user.role] || 'default'} />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={user.isActive ? 'Active' : 'Inactive'}
                        color={user.isActive ? 'success' : 'default'}
                        variant={user.isActive ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEditDialog(user)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => setDeleteTarget(user)}>
                        <DeleteIcon fontSize="small" color="error" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Add / Edit dialog */}
      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3, maxHeight: '88vh' } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 2.5,
            px: 3,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700} color="text.primary">
              {editingId ? 'Edit User' : 'Add User'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {editingId ? 'Update account details and access.' : 'Create a new account and assign access.'}
            </Typography>
          </Box>
          <IconButton onClick={closeDialog} disabled={saving} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent
          sx={{
            px: 3,
            py: 3,
            scrollbarGutter: 'stable',
            '&::-webkit-scrollbar': { width: 8 },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: 4,
            },
          }}
        >
          <Stack spacing={3}>
            <Box>
              <Typography variant="overline" color="text.secondary" fontWeight={700}>
                Account
              </Typography>
              <Stack spacing={2} mt={1}>
                <TextField
                  label="Full Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  fullWidth
                  autoFocus
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
                  sx={AUTOFILL_FIX_SX}
                />
                <TextField
                  label={editingId ? 'New Password (leave blank to keep current)' : 'Password'}
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  fullWidth
                  helperText={!editingId ? 'Minimum 6 characters' : ' '}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" size="small">
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={AUTOFILL_FIX_SX}
                />
              </Stack>
            </Box>

            <Box>
              <Typography variant="overline" color="text.secondary" fontWeight={700}>
                Contact & Location
              </Typography>
              <Stack spacing={2} mt={1}>
                <TextField
                  label="Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneOutlinedIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="District"
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PlaceOutlinedIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label="State"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    fullWidth
                  />
                </Stack>
              </Stack>
            </Box>

            <Box>
              <Typography variant="overline" color="text.secondary" fontWeight={700}>
                Access
              </Typography>
              <Stack spacing={2} mt={1}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    label="Role"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    {ROLES.map((role) => (
                      <MenuItem key={role.value} value={role.value}>{role.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Paper
                  variant="outlined"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Account Status</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Inactive users can't sign in
                    </Typography>
                  </Box>
                  <FormControlLabel
                    sx={{ m: 0 }}
                    control={
                      <Switch
                        checked={form.isActive}
                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      />
                    }
                    label={form.isActive ? 'Active' : 'Inactive'}
                    labelPlacement="start"
                  />
                </Paper>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeDialog} disabled={saving} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving} sx={{ px: 3 }}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)}>
        <DialogTitle>Remove User</DialogTitle>
        <DialogContent>
          <Typography>
            Remove <strong>{deleteTarget?.name}</strong>? This can't be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Removing…' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>

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
