import React, { useState, useMemo } from 'react';
import {
  Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Box, Stack, Chip, Card, CardContent, InputBase, IconButton,
  Select, MenuItem, FormControl, LinearProgress, Collapse, Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Boilerplate from '../layouts/Boilerplate';
import RiskBadge from '../components/RiskBadge';
import { useThemeMode } from '../context/ThemeContext';
import data from '../init/data.json';

/* ── Risk score colour helper ─────────────────────────────── */
const scoreColor = (score) => {
  if (score >= 80) return { main: '#f43f5e', glow: 'rgba(244, 63, 94, 0.35)', gradient: 'linear-gradient(90deg, #f43f5e, #fb7185)' };
  if (score >= 60) return { main: '#f97316', glow: 'rgba(249, 115, 22, 0.35)', gradient: 'linear-gradient(90deg, #f97316, #fb923c)' };
  if (score >= 35) return { main: '#eab308', glow: 'rgba(234, 179, 8, 0.35)', gradient: 'linear-gradient(90deg, #eab308, #facc15)' };
  return { main: '#22c55e', glow: 'rgba(34, 197, 94, 0.35)', gradient: 'linear-gradient(90deg, #22c55e, #4ade80)' };
};

/* ── Mini stat card (top row) ─────────────────────────────── */
function MiniStat({ icon: Icon, label, value, color, isDark }) {
  return (
    <Card
      sx={{
        flex: 1,
        minWidth: 180,
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
        background: isDark
          ? `linear-gradient(145deg, rgba(20,30,52,0.75), rgba(11,18,33,0.9))`
          : 'linear-gradient(145deg, #ffffff, #f8fafc)',
        backdropFilter: 'blur(16px)',
        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(226,232,240,0.9)',
        boxShadow: isDark ? '0 8px 24px -4px rgba(0,0,0,0.45)' : '0 4px 18px -2px rgba(0,0,0,0.05)',
        transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: `${color}55`,
          boxShadow: isDark
            ? `0 14px 28px -4px rgba(0,0,0,0.5), 0 0 20px ${color}40`
            : `0 10px 24px -4px rgba(0,0,0,0.08), 0 0 16px ${color}25`,
        },
        '&::before': {
          content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${color}, ${color}99)`,
        },
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="body2" sx={{
              color: isDark ? '#94a3b8' : '#64748b', fontWeight: 700, fontSize: '0.78rem',
              letterSpacing: '0.04em', textTransform: 'uppercase', mb: 0.5,
            }}>
              {label}
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{
              color: isDark ? '#f8fafc' : '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.2,
            }}>
              {value}
            </Typography>
          </Box>
          <Box sx={{
            width: 40, height: 40, borderRadius: 2.5,
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', boxShadow: `0 4px 14px ${color}40`, flexShrink: 0,
          }}>
            <Icon sx={{ fontSize: 22 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

/* ── Expandable row ───────────────────────────────────────── */
function HabitationRow({ row, rank, isDark }) {
  const [open, setOpen] = useState(false);
  const sc = scoreColor(row.score);

  return (
    <>
      <TableRow
        onClick={() => setOpen(!open)}
        sx={{
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: isDark ? 'rgba(56,189,248,0.06)' : 'rgba(2,132,199,0.04)',
          },
          ...(open && {
            bgcolor: isDark ? 'rgba(56,189,248,0.08)' : 'rgba(2,132,199,0.06)',
          }),
        }}
      >
        {/* Rank */}
        <TableCell sx={{ width: 60, fontWeight: 800, fontSize: '1.1rem', color: isDark ? '#64748b' : '#94a3b8' }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: 2,
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.9rem',
            color: isDark ? '#cbd5e1' : '#475569',
          }}>
            #{rank}
          </Box>
        </TableCell>

        {/* Cluster */}
        <TableCell>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box sx={{
              width: 10, height: 10, borderRadius: '50%', bgcolor: sc.main,
              boxShadow: `0 0 8px ${sc.glow}`,
              animation: row.score >= 80 ? 'pulse-red 2s infinite' : 'none',
            }} />
            <Box>
              <Typography variant="body2" fontWeight={700} sx={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>
                {row.cluster}
              </Typography>
              {row.details && (
                <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: '0.72rem' }}>
                  {row.details}
                </Typography>
              )}
            </Box>
          </Box>
        </TableCell>

        {/* Risk Score bar */}
        <TableCell>
          <Box display="flex" alignItems="center" gap={1.5} minWidth={140}>
            <Typography variant="body2" fontWeight={800} sx={{ color: sc.main, minWidth: 28, textAlign: 'right' }}>
              {row.score}
            </Typography>
            <Box sx={{ flex: 1, position: 'relative' }}>
              <LinearProgress
                variant="determinate"
                value={row.score}
                sx={{
                  height: 8, borderRadius: 4,
                  bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background: sc.gradient,
                    boxShadow: `0 0 10px ${sc.glow}`,
                    transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)',
                  },
                }}
              />
            </Box>
          </Box>
        </TableCell>

        {/* Level */}
        <TableCell>
          <RiskBadge level={row.level} />
        </TableCell>

        {/* Population */}
        <TableCell>
          <Box display="flex" alignItems="center" gap={0.75}>
            <PeopleAltOutlinedIcon sx={{ fontSize: 16, color: isDark ? '#64748b' : '#94a3b8' }} />
            <Typography variant="body2" fontWeight={600} sx={{ color: isDark ? '#e2e8f0' : '#334155' }}>
              {row.population.toLocaleString()}
            </Typography>
          </Box>
        </TableCell>

        {/* Expand */}
        <TableCell sx={{ width: 48 }}>
          <IconButton size="small" sx={{ color: isDark ? '#64748b' : '#94a3b8' }}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
      </TableRow>

      {/* Collapsed details */}
      <TableRow>
        <TableCell colSpan={6} sx={{ py: 0, borderBottom: open ? undefined : 'none' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{
              py: 2, px: 3, my: 1, borderRadius: 2,
              bgcolor: isDark ? 'rgba(17,24,39,0.6)' : 'rgba(241,245,249,0.8)',
              border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(226,232,240,0.6)',
            }}>
              <Stack direction="row" spacing={4} flexWrap="wrap" useFlexGap>
                <Box>
                  <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8', letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 700 }}>
                    Location Details
                  </Typography>
                  <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                    <LocationOnIcon sx={{ fontSize: 14, color: sc.main }} />
                    <Typography variant="body2" fontWeight={600} sx={{ color: isDark ? '#e2e8f0' : '#334155' }}>
                      {row.details || 'Zone details unavailable'}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8', letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 700 }}>
                    Vulnerability Index
                  </Typography>
                  <Box display="flex" alignItems="baseline" gap={0.5} mt={0.5}>
                    <Typography variant="h5" fontWeight={800} sx={{ color: sc.main, lineHeight: 1 }}>
                      {(row.score / 10).toFixed(1)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8' }}>/10</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8', letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 700 }}>
                    Risk Status
                  </Typography>
                  <Box mt={0.75}>
                    <Chip
                      label={row.score >= 80 ? '⚡ IMMEDIATE ACTION REQUIRED' : row.score >= 60 ? '⚠ HIGH PRIORITY' : '🔍 UNDER MONITORING'}
                      size="small"
                      sx={{
                        fontWeight: 700, fontSize: '0.72rem',
                        bgcolor: `${sc.main}20`, color: sc.main,
                        border: `1px solid ${sc.main}40`,
                      }}
                    />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8', letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 700 }}>
                    Affected Population
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="baseline" mt={0.5}>
                    <Typography variant="h5" fontWeight={800} sx={{ color: isDark ? '#f1f5f9' : '#0f172a', lineHeight: 1 }}>
                      {row.population.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8' }}>residents</Typography>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════════ */
export default function VulnerableHabitations() {
  const { isDark } = useThemeMode();
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');

  const rows = data.vulnerableHabitations;

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (levelFilter !== 'ALL' && r.level.toUpperCase() !== levelFilter) return false;
      if (search && !r.cluster.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [rows, search, levelFilter]);

  /* Derived stats */
  const totalPop = rows.reduce((s, r) => s + r.population, 0);
  const criticalCount = rows.filter((r) => r.level.toUpperCase() === 'CRITICAL').length;
  const avgScore = Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length);

  return (
    <Boilerplate>
      {/* Page heading */}
      <Box mb={3}>
        <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8', fontWeight: 600 }}>
          Operations &amp; Relocation &gt; Vulnerable Habitations
        </Typography>
        <Typography variant="h5" fontWeight={800} mt={0.25} sx={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
          Vulnerable Habitations
        </Typography>
        <Typography variant="body2" sx={{ color: isDark ? '#64748b' : '#94a3b8', mt: 0.5 }}>
          Prioritised habitation clusters ranked by composite risk score — monitor, filter, and drill into each settlement.
        </Typography>
      </Box>

      {/* Summary stat cards */}
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
        <MiniStat icon={ShieldOutlinedIcon} label="Total Clusters" value={rows.length} color="#38bdf8" isDark={isDark} />
        <MiniStat icon={WarningAmberIcon} label="Critical Zones" value={criticalCount} color="#f43f5e" isDark={isDark} />
        <MiniStat icon={PeopleAltOutlinedIcon} label="Total Population" value={totalPop.toLocaleString()} color="#a855f7" isDark={isDark} />
        <MiniStat icon={TrendingUpIcon} label="Avg. Risk Score" value={avgScore} color="#f97316" isDark={isDark} />
      </Stack>

      {/* Search + filter bar */}
      <Paper
        variant="outlined"
        sx={{
          mb: 2, px: 2, py: 1.25, borderRadius: 2.5,
          display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
          bgcolor: isDark ? 'rgba(17,24,39,0.5)' : '#ffffff',
          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Box display="flex" alignItems="center" gap={1} flex={1} minWidth={200}>
          <SearchIcon sx={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: 20 }} />
          <InputBase
            placeholder="Search habitations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              flex: 1, fontSize: '0.88rem', color: isDark ? '#e2e8f0' : '#0f172a',
              '& input::placeholder': { color: isDark ? '#475569' : '#94a3b8', opacity: 1 },
            }}
          />
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <FilterListIcon sx={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: 18 }} />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              sx={{
                fontSize: '0.84rem', fontWeight: 600,
                color: isDark ? '#e2e8f0' : '#334155',
                '& .MuiOutlinedInput-notchedOutline': { border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0' },
                borderRadius: 2,
              }}
            >
              <MenuItem value="ALL">All Levels</MenuItem>
              <MenuItem value="CRITICAL">Critical</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
              <MenuItem value="MODERATE">Moderate</MenuItem>
              <MenuItem value="LOW">Low</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Table */}
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: isDark ? 'rgba(17,24,39,0.6)' : '#ffffff',
          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
          backdropFilter: 'blur(16px)',
          boxShadow: isDark ? '0 8px 24px -4px rgba(0,0,0,0.4)' : '0 4px 18px -2px rgba(0,0,0,0.04)',
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{
              background: isDark
                ? 'linear-gradient(180deg, rgba(30,41,59,0.8), rgba(17,24,39,0.6))'
                : 'linear-gradient(180deg, #f8fafc, #f1f5f9)',
            }}>
              {['Rank', 'Habitation Cluster', 'Risk Score', 'Level', 'Population', ''].map((h) => (
                <TableCell
                  key={h || 'expand'}
                  sx={{
                    fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: isDark ? '#94a3b8' : '#64748b',
                    borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0',
                    py: 1.75,
                  }}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((row, i) => (
                <HabitationRow key={row.rank} row={row} rank={i + 1} isDark={isDark} />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: isDark ? '#64748b' : '#94a3b8' }}>
                  <Typography variant="body2" fontWeight={600}>No habitations match your filters</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Legend / info bar */}
      <Box mt={2} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Stack direction="row" spacing={1}>
          {[
            { label: 'Critical (80+)', color: '#f43f5e' },
            { label: 'High (60-79)', color: '#f97316' },
            { label: 'Moderate (35-59)', color: '#eab308' },
            { label: 'Low (<35)', color: '#22c55e' },
          ].map((item) => (
            <Chip
              key={item.label}
              size="small"
              icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color, ml: 0.75 }} />}
              label={item.label}
              sx={{
                fontWeight: 600, fontSize: '0.72rem',
                bgcolor: `${item.color}15`, color: item.color,
                border: `1px solid ${item.color}30`,
              }}
            />
          ))}
        </Stack>
        <Typography variant="caption" sx={{ color: isDark ? '#475569' : '#94a3b8', fontWeight: 500 }}>
          Showing {filtered.length} of {rows.length} habitations • Data refreshed in real-time
        </Typography>
      </Box>
    </Boilerplate>
  );
}