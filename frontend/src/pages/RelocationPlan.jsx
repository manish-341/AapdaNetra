import React, { useEffect, useState, useMemo } from 'react';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Button,
  Stack,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import TransferWithinAStationOutlinedIcon from '@mui/icons-material/TransferWithinAStationOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import Boilerplate from '../layouts/Boilerplate';
import RiskBadge from '../components/RiskBadge';
import { getRelocations } from '../services/api';
import { useThemeMode } from '../context/ThemeContext';

const STATUS_LABELS = {
  PLANNED: 'Planned',
  APPROVED: 'Approved',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const STATUS_COLORS = {
  PLANNED: 'default',
  APPROVED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'error',
};

const progressForStatus = (status) => {
  switch (status) {
    case 'COMPLETED':
      return 100;
    case 'IN_PROGRESS':
      return 60;
    case 'APPROVED':
      return 25;
    case 'CANCELLED':
      return 0;
    case 'PLANNED':
    default:
      return 5;
  }
};

export default function RelocationPlan() {
  const { isDark } = useThemeMode();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRelocations();
      setPlans(res?.data?.data || []);
    } catch (err) {
      setError('Failed to load relocation plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const stats = useMemo(() => {
    const totalPlans = plans.length;
    const inProgress = plans.filter((p) => p.status === 'IN_PROGRESS').length;
    const completed = plans.filter((p) => p.status === 'COMPLETED').length;
    const totalPopulation = plans.reduce((acc, p) => acc + (p.populationToRelocate || 0), 0);
    return { totalPlans, inProgress, completed, totalPopulation };
  }, [plans]);

  const isEmpty = !loading && !error && plans.length === 0;
  const textMain = isDark ? '#f8fafc' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? 'rgba(15, 23, 42, 0.85)' : '#ffffff';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';

  return (
    <Boilerplate>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
        <Box>
          <Typography variant="caption" sx={{ color: isDark ? '#38bdf8' : '#0284c7', fontWeight: 700 }}>
            Incident Command &gt; Evacuation Logistics
          </Typography>
          <Typography variant="h5" fontWeight="bold" sx={{ color: textMain, mt: 0.5 }}>
            Relocation & Evacuation Plans
          </Typography>
          <Typography variant="body2" sx={{ color: textMuted }}>
            Active staged transfers of vulnerable populations to designated safe shelters.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={fetchPlans}
          sx={{ fontWeight: 600 }}
        >
          Refresh Plans
        </Button>
      </Box>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Summary KPI Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2.5, bgcolor: cardBg, border: `1px solid ${borderColor}` }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(2, 132, 199, 0.15)', color: '#0284c7' }}>
                <AssignmentOutlinedIcon />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: textMuted }}>Total Relocation Directives</Typography>
                <Typography variant="h5" fontWeight="bold" sx={{ color: textMain }}>{stats.totalPlans}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2.5, bgcolor: cardBg, border: `1px solid ${borderColor}` }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(249, 115, 22, 0.15)', color: '#f97316' }}>
                <TransferWithinAStationOutlinedIcon />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: textMuted }}>Transfers In Progress</Typography>
                <Typography variant="h5" fontWeight="bold" sx={{ color: '#f97316' }}>{stats.inProgress}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2.5, bgcolor: cardBg, border: `1px solid ${borderColor}` }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                <CheckCircleOutlinedIcon />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: textMuted }}>Completed Relocations</Typography>
                <Typography variant="h5" fontWeight="bold" sx={{ color: '#10b981' }}>{stats.completed}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2.5, bgcolor: cardBg, border: `1px solid ${borderColor}` }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                <PeopleAltOutlinedIcon />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: textMuted }}>Total Evacuees Scheduled</Typography>
                <Typography variant="h5" fontWeight="bold" sx={{ color: '#8b5cf6' }}>
                  {stats.totalPopulation.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Relocation Plans Table */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2.5, bgcolor: cardBg, border: `1px solid ${borderColor}` }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: textMain }}>Plan ID</TableCell>
                <TableCell sx={{ fontWeight: 700, color: textMain }}>Origin Settlement</TableCell>
                <TableCell sx={{ fontWeight: 700, color: textMain }}>Designated Shelter</TableCell>
                <TableCell sx={{ fontWeight: 700, color: textMain }}>Population</TableCell>
                <TableCell sx={{ fontWeight: 700, color: textMain }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 700, color: textMain }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: textMain }}>Trigger / Reason</TableCell>
                <TableCell sx={{ fontWeight: 700, color: textMain, width: 140 }}>Progress</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isEmpty && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">No relocation plans found in the database.</Typography>
                  </TableCell>
                </TableRow>
              )}
              {plans.map((plan) => (
                <TableRow
                  key={plan._id}
                  hover
                  sx={{
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'
                    }
                  }}
                >
                  <TableCell sx={{ fontWeight: 'bold', color: isDark ? '#38bdf8' : '#0284c7' }}>
                    #{plan._id.slice(-6).toUpperCase()}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: textMain }}>
                    {plan.habitation?.name || '—'}
                    {plan.habitation?.district && (
                      <Typography variant="caption" display="block" sx={{ color: textMuted }}>
                        {plan.habitation.district}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ color: textMain }}>
                    {plan.destinationShelter?.name || '—'}
                    {plan.destinationShelter?.address && (
                      <Typography variant="caption" display="block" sx={{ color: textMuted }}>
                        {plan.destinationShelter.address}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: textMain }}>
                    {plan.populationToRelocate?.toLocaleString() || 0}
                  </TableCell>
                  <TableCell>
                    <RiskBadge level={plan.priority} />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={STATUS_LABELS[plan.status] || plan.status}
                      color={STATUS_COLORS[plan.status] || 'default'}
                      sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: textMuted, maxWidth: 280, fontSize: '0.82rem' }}>
                    {plan.reason || '—'}
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <LinearProgress
                        variant="determinate"
                        value={progressForStatus(plan.status)}
                        sx={{
                          height: 7,
                          borderRadius: 3.5,
                          bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
                          '& .MuiLinearProgress-bar': {
                            bgcolor:
                              plan.status === 'COMPLETED'
                                ? '#10b981'
                                : plan.status === 'IN_PROGRESS'
                                ? '#f97316'
                                : '#0284c7'
                          }
                        }}
                      />
                      <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.7rem' }}>
                        {progressForStatus(plan.status)}% ({STATUS_LABELS[plan.status] || plan.status})
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Boilerplate>
  );
}
