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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
} from '@mui/material';
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import Boilerplate from '../layouts/Boilerplate';
import { getShelters, updateShelter } from '../services/api';
import { useThemeMode } from '../context/ThemeContext';

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

export default function CarryingCapacity() {
  const { isDark } = useThemeMode();
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

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

  const totals = useMemo(() => {
    const totalCapacity = shelters.reduce((sum, s) => sum + (s.capacity || 0), 0);
    const totalOccupancy = shelters.reduce((sum, s) => sum + (s.currentOccupancy || 0), 0);
    const totalAvailable = shelters.reduce(
      (sum, s) =>
        sum + (typeof s.availableCapacity === 'number'
          ? s.availableCapacity
          : Math.max((s.capacity || 0) - (s.currentOccupancy || 0), 0)),
      0
    );
    const occupancyPercent = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

    return { totalCapacity, totalOccupancy, totalAvailable, occupancyPercent };
  }, [shelters]);

  const chartData = useMemo(
    () =>
      shelters.map((s) => ({
        name: s.name,
        Capacity: s.capacity || 0,
        Occupancy: s.currentOccupancy || 0,
      })),
    [shelters]
  );

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
        status: newStatus
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
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

          {chartData.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mt: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" mb={2}>
                Capacity vs Occupancy by Shelter
              </Typography>
              <Box sx={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Capacity" fill="#90caf9" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Occupancy" fill="#1565c0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          )}

          {shelters.length > 0 && (
            <Paper variant="outlined" sx={{ borderRadius: 2, mt: 2, overflow: 'hidden' }}>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }}>
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
                    {shelters.map((s) => {
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
                    })}
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
