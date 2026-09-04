import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import Boilerplate from '../layouts/Boilerplate';
import {
  getHazards,
  getAlerts,
  getRisks,
  getRelocations,
  getCrowdObservations,
} from '../services/api';

// Each entry maps a report type to the API call that fetches it.
// Add more here (e.g. habitations, shelters) if you want them reportable too.
const SOURCES = [
  { key: 'hazards', label: 'Hazards', fetcher: getHazards },
  { key: 'alerts', label: 'Alerts', fetcher: getAlerts },
  { key: 'risks', label: 'Risks', fetcher: getRisks },
  { key: 'relocations', label: 'Relocation Plans', fetcher: getRelocations },
  { key: 'crowd', label: 'Crowd Observations', fetcher: getCrowdObservations },
];

// Fields we never want in an exported/printed report.
const HIDDEN_FIELDS = ['__v'];

// Renders a cell value sensibly whether it's a string, populated ref
// object ({ name: ... }), plain ObjectId string, array, or date.
const formatCell = (value) => {
  if (value === null || value === undefined) return '—';
  if (Array.isArray(value)) return value.length ? value.map(formatCell).join(', ') : '—';
  if (typeof value === 'object') {
    if (value.name) return value.name;
    if (value.$oid) return value.$oid;
    if (value._id) return String(value._id).slice(-6).toUpperCase();
    return JSON.stringify(value);
  }
  return String(value);
};

const escapeCsvValue = (value) => {
  const str = formatCell(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export default function Reports() {
  const [sourceKey, setSourceKey] = useState(SOURCES[0].key);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const source = SOURCES.find((s) => s.key === sourceKey);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await source.fetcher();
        if (!cancelled) setRows(res?.data?.data || []);
      } catch (err) {
        if (!cancelled) setError(`Failed to load ${source.label.toLowerCase()}.`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [sourceKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const columns = useMemo(() => {
    if (!rows.length) return [];
    return Object.keys(rows[0]).filter((key) => !HIDDEN_FIELDS.includes(key));
  }, [rows]);

  const handleExportCsv = () => {
    if (!rows.length) return;
    const header = columns.join(',');
    const body = rows
      .map((row) => columns.map((col) => escapeCsvValue(row[col])).join(','))
      .join('\n');
    const csv = `${header}\n${body}`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${source.key}-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Opens the browser's print dialog, which lets the user "Save as PDF".
  // Only the report area is visible while printing (see the <style> below).
  const handlePrint = () => {
    window.print();
  };

  const isEmpty = !loading && !error && rows.length === 0;

  return (
    <Boilerplate>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <Box className="no-print" display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
        <Typography variant="h5" fontWeight="bold">Reports</Typography>
        <Stack direction="row" spacing={1.5}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Report Type</InputLabel>
            <Select
              label="Report Type"
              value={sourceKey}
              onChange={(e) => setSourceKey(e.target.value)}
            >
              {SOURCES.map((s) => (
                <MenuItem key={s.key} value={s.key}>{s.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportCsv}
            disabled={!rows.length}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            disabled={!rows.length}
          >
            Print / Save as PDF
          </Button>
        </Stack>
      </Box>

      {error && <Alert severity="warning" className="no-print" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box className="no-print" display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper variant="outlined" className="print-area" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ display: 'none', '@media print': { display: 'block', p: 2 } }}>
            <Typography variant="h6" fontWeight="bold">{source.label} Report</Typography>
            <Typography variant="caption" color="text.secondary">
              Generated {new Date().toLocaleString()}
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell key={col} sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {isEmpty && (
                  <TableRow>
                    <TableCell colSpan={columns.length || 1} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No {source.label.toLowerCase()} to report.</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((row) => (
                  <TableRow key={row._id}>
                    {columns.map((col) => (
                      <TableCell key={col}>{formatCell(row[col])}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Boilerplate>
  );
}
