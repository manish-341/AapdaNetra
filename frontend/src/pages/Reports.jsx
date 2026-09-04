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
  Chip,
  Divider,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PrintIcon from '@mui/icons-material/Print';
import SecurityIcon from '@mui/icons-material/Security';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import AssessmentIcon from '@mui/icons-material/Assessment';
import Boilerplate from '../layouts/Boilerplate';
import { useThemeMode } from '../context/ThemeContext';
import { useLocationContext } from '../context/LocationContext';
import { getCurrentUser } from '../lib/auth';
import {
  getHazards,
  getAlerts,
  getRisks,
  getRelocations,
  getCrowdObservations,
} from '../services/api';
import { jsPDF } from 'jspdf';

const SOURCES = [
  { key: 'hazards', label: 'Hazards & Vulnerability', fetcher: getHazards },
  { key: 'alerts', label: 'Emergency Alerts', fetcher: getAlerts },
  { key: 'risks', label: 'Risk Assessments', fetcher: getRisks },
  { key: 'relocations', label: 'Relocation & Shelters', fetcher: getRelocations },
  { key: 'crowd', label: 'Citizen Crowd Reports', fetcher: getCrowdObservations },
];

// Columns to permanently exclude from tabular reports (internal mongo/geometry blobs)
const BLACKLISTED_COLUMNS = [
  '_id', '__v', '__t', '__enc_location', 'updatedAt',
  'geometry', 'polygon', 'coordinates', 'bounds', 'password', 'hash', 'tokens', 'raw', 'features'
];

// Preferred column orders per source key
const COLUMN_CONFIG = {
  hazards: [
    { key: 'name', label: 'Zone / Area' },
    { key: 'hazardType', label: 'Hazard Type' },
    { key: 'district', label: 'District' },
    { key: 'riskCategory', label: 'Risk Level' },
    { key: 'riskScore', label: 'Risk Score' },
    { key: 'severity', label: 'Severity' },
    { key: 'status', label: 'Status' },
  ],
  alerts: [
    { key: 'title', label: 'Alert Headline' },
    { key: 'severity', label: 'Severity' },
    { key: 'hazardType', label: 'Hazard' },
    { key: 'district', label: 'Target District' },
    { key: 'affectedRadius', label: 'Radius (km)' },
    { key: 'message', label: 'Summary' },
    { key: 'createdAt', label: 'Issued Date' },
  ],
  risks: [
    { key: 'zone', label: 'Assessment Zone' },
    { key: 'riskLevel', label: 'Risk Category' },
    { key: 'riskScore', label: 'Score (/100)' },
    { key: 'district', label: 'District' },
    { key: 'hazardType', label: 'Primary Threat' },
    { key: 'status', label: 'Mitigation Status' },
  ],
  relocations: [
    { key: 'title', label: 'Relocation Operation' },
    { key: 'fromLocation', label: 'Origin Habitation' },
    { key: 'destinationShelter', label: 'Assigned Shelter' },
    { key: 'priority', label: 'Priority' },
    { key: 'peopleAffected', label: 'Displaced Count' },
    { key: 'status', label: 'Operational Status' },
  ],
  crowd: [
    { key: 'observationType', label: 'Incident Observed' },
    { key: 'severity', label: 'Severity' },
    { key: 'district', label: 'District' },
    { key: 'description', label: 'Field Details' },
    { key: 'verified', label: 'Verification' },
    { key: 'createdAt', label: 'Reported At' },
  ],
};

// Formats any cell value cleanly into human-readable text — NEVER outputs raw JSON brackets!
const formatCell = (value, colKey = '') => {
  if (value === null || value === undefined || value === '') return '—';

  // Booleans
  if (typeof value === 'boolean') return value ? 'Verified' : 'Unverified';

  // Dates
  if (colKey.toLowerCase().includes('date') || colKey.toLowerCase().includes('createdat') || colKey.toLowerCase().includes('time')) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    }
  }

  // Arrays
  if (Array.isArray(value)) {
    if (!value.length) return '—';
    if (typeof value[0] === 'number') {
      return `${value[1]?.toFixed?.(3) || value[1]}°N, ${value[0]?.toFixed?.(3) || value[0]}°E`;
    }
    return value.map((v) => formatCell(v)).join(', ');
  }

  // Objects
  if (typeof value === 'object') {
    if (value.name) return value.name;
    if (value.title) return value.title;
    if (value.district) return value.district;
    if (value.type === 'Point' && Array.isArray(value.coordinates)) {
      const [lon, lat] = value.coordinates;
      return `${Number(lat).toFixed(3)}°N, ${Number(lon).toFixed(3)}°E`;
    }
    if (value.type === 'Polygon') {
      return 'Designated Hazard Zone';
    }
    if (value._id) return `ID-${String(value._id).slice(-4).toUpperCase()}`;
    return 'Detailed Field';
  }

  // Numbers (like scores or percentages)
  if (typeof value === 'number') {
    if (colKey.toLowerCase().includes('score')) return `${Math.round(value)} / 100`;
    if (colKey.toLowerCase().includes('radius')) return `${value} km`;
    return String(value);
  }

  const str = String(value).trim();
  return str.length > 90 ? str.slice(0, 87) + '…' : str;
};

const escapeCsvValue = (val) => {
  const str = String(val ?? '');
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

// Computes executive insights from current dataset
function computeExecutiveInsights(rows, sourceKey, locationName) {
  const total = rows.length;
  let criticalCount = 0;
  let highCount = 0;
  let moderateCount = 0;
  let lowCount = 0;
  const districtCounts = {};
  const hazardCounts = {};

  rows.forEach((row) => {
    // Severity or risk category
    const sev = String(
      row.severity || row.riskCategory || row.riskLevel || row.priority || ''
    ).toUpperCase();

    if (sev === 'CRITICAL' || sev.includes('CRIT') || sev === 'URGENT') criticalCount++;
    else if (sev === 'HIGH' || sev === 'RED') highCount++;
    else if (sev === 'AMBER' || sev === 'MODERATE' || sev === 'MEDIUM' || sev === 'WARNING') moderateCount++;
    else lowCount++;

    // District tallies
    const dist = row.district || row.state || locationName;
    if (dist && typeof dist === 'string') {
      districtCounts[dist] = (districtCounts[dist] || 0) + 1;
    }

    // Hazard type tallies
    const haz = row.hazardType || row.type || row.observationType;
    if (haz && typeof haz === 'string') {
      hazardCounts[haz] = (hazardCounts[haz] || 0) + 1;
    }
  });

  const topDistricts = Object.entries(districtCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([d, c]) => `${d} (${c})`)
    .join(', ') || locationName;

  const topHazard = Object.entries(hazardCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'General Crisis Telemetry';

  const operationalThreat =
    criticalCount > 0
      ? 'CRITICAL THREAT — IMMEDIATE ACTION REQUIRED'
      : highCount > 0
      ? 'ELEVATED VIGILANCE — ACTIVE ADVISORY'
      : 'STANDARD MONITORING — NORMAL READINESS';

  const recommendations = [];
  if (criticalCount > 0) {
    recommendations.push(`Initiate immediate emergency coordination for ${criticalCount} critical incidents in ${topDistricts}.`);
  }
  if (highCount > 0) {
    recommendations.push(`Pre-position relief resources & alert local field teams regarding high-risk ${topHazard}.`);
  }
  if (total > 0) {
    recommendations.push(`Continuous telemetry verification active across ${Object.keys(districtCounts).length || 1} administrative sectors.`);
  }

  return {
    total,
    criticalCount,
    highCount,
    moderateCount,
    lowCount,
    topDistricts,
    topHazard,
    operationalThreat,
    recommendations,
  };
}

// Generates an official National/State Disaster Management grade standalone PDF
function generateExecutivePDF(rows, source, insights, locationName, userName, columns) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginL = 12;
  const marginR = 12;
  const contentW = pageW - marginL - marginR;
  let y = 10;

  // ── Official Deep Navy Header ──
  doc.setFillColor(15, 23, 42); // slate 900
  doc.rect(0, 0, pageW, 26, 'F');

  // Gold accent bar
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 26, pageW, 1.5, 'F');

  // Agency Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('AAPDANETRA CRISIS RESPONSE & DISASTER INTELLIGENCE', marginL, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(
    `OFFICIAL SITUATION REPORT (SITREP)  |  DOMAIN: ${source.label.toUpperCase()}  |  JURISDICTION: ${locationName.toUpperCase()}`,
    marginL,
    18
  );
  doc.text(
    `Generated: ${new Date().toLocaleString('en-IN')}  |  Authorized Officer: ${userName}  |  STATUS: RESTRICTED/OPERATIONAL`,
    marginL,
    23
  );

  // Total Records Badge
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(pageW - marginR - 46, 6, 46, 15, 2, 2, 'F');
  doc.setDrawColor(56, 189, 248);
  doc.setLineWidth(0.4);
  doc.roundedRect(pageW - marginR - 46, 6, 46, 15, 2, 2, 'S');

  doc.setTextColor(56, 189, 248);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`${rows.length} Records`, pageW - marginR - 42, 13);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('ANALYTIC SAMPLE', pageW - marginR - 42, 18);

  y = 33;

  // ── Executive Summary & Threat Insights Banner ──
  doc.setFillColor(248, 250, 252);
  doc.rect(marginL, y, contentW, 26, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(marginL, y, contentW, 26, 'S');

  // Left red/amber status strip
  const threatColor =
    insights.criticalCount > 0
      ? [239, 68, 68]
      : insights.highCount > 0
      ? [249, 115, 22]
      : [34, 197, 94];
  doc.setFillColor(...threatColor);
  doc.rect(marginL, y, 3, 26, 'F');

  // Threat heading
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`EXECUTIVE SUMMARY & SITUATION ASSESSMENT — ${insights.operationalThreat}`, marginL + 7, y + 6);

  // Metrics Bar
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Critical Threats: ${insights.criticalCount}    |    Elevated / High: ${insights.highCount}    |    Moderate: ${insights.moderateCount}    |    Normal / Low: ${insights.lowCount}`,
    marginL + 7,
    y + 12
  );
  doc.text(
    `High-Impact Administrative Sectors: ${insights.topDistricts}    |    Primary Threat Vector: ${insights.topHazard}`,
    marginL + 7,
    y + 17
  );

  // Operational Actionable Recommendation
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const recText = insights.recommendations[0] || 'Standard surveillance operational protocol maintained.';
  doc.text(`ACTION DIRECTIVE: ${recText}`, marginL + 7, y + 22, { maxWidth: contentW - 14 });

  y += 30;

  // ── Data Table ──
  const visibleCols = columns.slice(0, 6);
  const colCount = visibleCols.length;
  const colW = contentW / colCount;
  const headerH = 7.5;
  const rowH = 6.8;

  // Table header
  doc.setFillColor(30, 41, 59);
  doc.rect(marginL, y, contentW, headerH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');

  visibleCols.forEach((col, i) => {
    doc.text(col.label, marginL + i * colW + 2.5, y + 5.2, { maxWidth: colW - 4 });
  });

  y += headerH;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  const maxRows = Math.min(rows.length, 180);

  for (let r = 0; r < maxRows; r++) {
    // Page overflow handler
    if (y + rowH > pageH - 14) {
      // Page Footer
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${doc.getNumberOfPages()}  •  AAPDANETRA SITREP  •  CONFIDENTIAL & TIME-SENSITIVE`,
        marginL,
        pageH - 5
      );
      doc.text(`${new Date().toLocaleDateString('en-IN')}`, pageW - marginR - 25, pageH - 5);

      doc.addPage();
      y = 12;

      // Repeat Table Header
      doc.setFillColor(30, 41, 59);
      doc.rect(marginL, y, contentW, headerH, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      visibleCols.forEach((col, i) => {
        doc.text(col.label, marginL + i * colW + 2.5, y + 5.2, { maxWidth: colW - 4 });
      });
      y += headerH;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
    }

    const row = rows[r];
    const sev = String(
      row.severity || row.riskCategory || row.riskLevel || row.priority || ''
    ).toUpperCase();
    const isCrit = sev === 'CRITICAL' || sev === 'RED' || sev === 'URGENT';
    const isHigh = sev === 'HIGH';

    // Row Background
    if (isCrit) {
      doc.setFillColor(254, 242, 242); // light red
      doc.rect(marginL, y, contentW, rowH, 'F');
      doc.setFillColor(239, 68, 68);
      doc.rect(marginL, y, 2, rowH, 'F');
    } else if (isHigh) {
      doc.setFillColor(255, 247, 237); // light orange
      doc.rect(marginL, y, contentW, rowH, 'F');
      doc.setFillColor(249, 115, 22);
      doc.rect(marginL, y, 1.5, rowH, 'F');
    } else if (r % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginL, y, contentW, rowH, 'F');
    }

    // Row text
    doc.setTextColor(isCrit ? 185 : 30, isCrit ? 28 : 41, isCrit ? 28 : 59);
    visibleCols.forEach((col, i) => {
      const formatted = formatCell(row[col.key], col.key);
      const maxChars = Math.floor(colW / 1.75);
      const cellText = formatted.length > maxChars ? formatted.slice(0, maxChars - 2) + '..' : formatted;
      doc.text(cellText, marginL + i * colW + 2.5, y + 4.7, { maxWidth: colW - 4 });
    });

    // Sub-border
    doc.setDrawColor(226, 232, 240);
    doc.line(marginL, y + rowH, marginL + contentW, y + rowH);
    y += rowH;
  }

  // Final Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Page ${doc.getNumberOfPages()}  •  AAPDANETRA SITUATION REPORT  •  CONFIDENTIAL & TIME-SENSITIVE`,
    marginL,
    pageH - 5
  );
  doc.text(`${new Date().toLocaleDateString('en-IN')}`, pageW - marginR - 25, pageH - 5);

  doc.save(`AapdaNetra_Executive_SITREP_${source.key}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export default function Reports() {
  const [sourceKey, setSourceKey] = useState(SOURCES[0].key);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const { isDark } = useThemeMode();
  const { location } = useLocationContext();
  const user = getCurrentUser() || { name: 'Command Officer' };

  const source = SOURCES.find((s) => s.key === sourceKey);
  const locationName = location?.name || location?.district || 'National Overview';

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await source.fetcher();
        if (!cancelled) setRows(res?.data?.data || []);
      } catch (err) {
        if (!cancelled) setError(`Failed to fetch live ${source.label.toLowerCase()} records.`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [sourceKey]);

  // Compute clean, curated columns
  const visibleColumns = useMemo(() => {
    const predefined = COLUMN_CONFIG[sourceKey];
    if (predefined) return predefined;

    if (!rows.length) return [];
    return Object.keys(rows[0])
      .filter((k) => !BLACKLISTED_COLUMNS.includes(k))
      .slice(0, 6)
      .map((k) => ({
        key: k,
        label: k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim(),
      }));
  }, [sourceKey, rows]);

  // Compute insights
  const insights = useMemo(
    () => computeExecutiveInsights(rows, sourceKey, locationName),
    [rows, sourceKey, locationName]
  );

  const handleDownloadPDF = () => {
    if (!rows.length) return;
    setGenerating(true);
    try {
      generateExecutivePDF(rows, source, insights, locationName, user?.name || 'Authorized Officer', visibleColumns);
    } catch (err) {
      console.error('Executive PDF Generation Error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!rows.length) return;
    const header = visibleColumns.map((c) => c.label).join(',');
    const body = rows
      .map((row) => visibleColumns.map((col) => escapeCsvValue(formatCell(row[col.key], col.key))).join(','))
      .join('\n');
    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AapdaNetra_${source.key}_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const primaryText = isDark ? '#f8fafc' : '#0f172a';
  const secondaryText = isDark ? '#94a3b8' : '#64748b';

  return (
    <Boilerplate>
      {/* ── Top Controls (Hidden on Print) ── */}
      <Box className="no-print" display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ color: primaryText, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssessmentIcon sx={{ color: isDark ? '#38bdf8' : '#0284c7' }} />
            Crisis Intelligence Reports & SITREP
          </Typography>
          <Typography variant="body2" sx={{ color: secondaryText, mt: 0.3 }}>
            Generate official executive disaster reports with threat analysis & action directives
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Intelligence Feed</InputLabel>
            <Select label="Intelligence Feed" value={sourceKey} onChange={(e) => setSourceKey(e.target.value)}>
              {SOURCES.map((s) => (
                <MenuItem key={s.key} value={s.key}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportCsv}
            disabled={!rows.length}
            sx={{ fontWeight: 700, fontSize: '0.8rem', borderRadius: 2 }}
          >
            CSV
          </Button>

          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            disabled={!rows.length}
            sx={{
              fontWeight: 700,
              fontSize: '0.8rem',
              borderRadius: 2,
              borderColor: isDark ? 'rgba(56,189,248,0.4)' : '#0284c7',
              color: isDark ? '#38bdf8' : '#0284c7',
            }}
          >
            Print Clean Report
          </Button>

          <Button
            variant="contained"
            startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdfIcon />}
            onClick={handleDownloadPDF}
            disabled={!rows.length || generating}
            sx={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              fontWeight: 700,
              fontSize: '0.82rem',
              borderRadius: 2,
              px: 2.2,
              boxShadow: '0 4px 14px rgba(2,132,199,0.3)',
              '&:hover': { background: 'linear-gradient(135deg, #0369a1 0%, #075985 100%)' },
            }}
          >
            {generating ? 'Generating SitRep…' : 'Download Official PDF'}
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="warning" className="no-print" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* ── Printable Official Report Container ── */}
      <Box className="printable-report-area">
        {/* Official Report Header Banner */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            mb: 3,
            borderRadius: 3,
            background: isDark
              ? 'linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%)'
              : 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none',
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                <SecurityIcon sx={{ color: '#38bdf8', fontSize: 24 }} />
                <Typography variant="overline" sx={{ letterSpacing: '0.12em', color: '#38bdf8', fontWeight: 800 }}>
                  AAPDANETRA DISASTER INTELLIGENCE & RESPONSE AGENCY
                </Typography>
              </Stack>
              <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
                {source.label.toUpperCase()} — SITUATIONAL REPORT
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.5 }}>
                Jurisdiction: <strong style={{ color: '#f8fafc' }}>{locationName}</strong> &nbsp;|&nbsp;
                Authorized Officer: <strong style={{ color: '#f8fafc' }}>{user?.name || 'Officer On Duty'}</strong> &nbsp;|&nbsp;
                Generated: {new Date().toLocaleString('en-IN')}
              </Typography>
            </Box>

            <Box textAlign={{ xs: 'left', sm: 'right' }}>
              <Chip
                label={insights.operationalThreat}
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  bgcolor:
                    insights.criticalCount > 0
                      ? 'rgba(239, 68, 68, 0.2)'
                      : insights.highCount > 0
                      ? 'rgba(249, 115, 22, 0.2)'
                      : 'rgba(34, 197, 94, 0.2)',
                  color:
                    insights.criticalCount > 0
                      ? '#f87171'
                      : insights.highCount > 0
                      ? '#fb923c'
                      : '#4ade80',
                  border: '1px solid currentColor',
                  mb: 1,
                }}
              />
              <Typography variant="body2" sx={{ color: '#cbd5e1', fontWeight: 600 }}>
                Total Records Analyzed: <strong style={{ color: '#38bdf8', fontSize: '1.1rem' }}>{rows.length}</strong>
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.12)' }} />

          {/* KPI Mini Badges */}
          <Box display="grid" gridTemplateColumns={{ xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }} gap={2}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                Critical Threats
              </Typography>
              <Typography variant="h6" fontWeight={800} sx={{ color: insights.criticalCount > 0 ? '#ef4444' : '#ffffff' }}>
                {insights.criticalCount}
              </Typography>
            </Box>

            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                High / Elevated
              </Typography>
              <Typography variant="h6" fontWeight={800} sx={{ color: insights.highCount > 0 ? '#f97316' : '#ffffff' }}>
                {insights.highCount}
              </Typography>
            </Box>

            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                Moderate / Amber
              </Typography>
              <Typography variant="h6" fontWeight={800} sx={{ color: '#eab308' }}>
                {insights.moderateCount}
              </Typography>
            </Box>

            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                Low / Normal
              </Typography>
              <Typography variant="h6" fontWeight={800} sx={{ color: '#22c55e' }}>
                {insights.lowCount}
              </Typography>
            </Box>
          </Box>

          {/* Action Directives / Key Insights */}
          {insights.recommendations.length > 0 && (
            <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(2, 132, 199, 0.12)', border: '1px solid rgba(2, 132, 199, 0.25)' }}>
              <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <WarningAmberIcon sx={{ fontSize: 16 }} />
                Operational Action Directives & Key Insights
              </Typography>
              {insights.recommendations.map((rec, i) => (
                <Typography key={i} variant="body2" sx={{ color: '#e2e8f0', mt: 0.4, fontSize: '0.78rem', fontWeight: 500 }}>
                  • {rec}
                </Typography>
              ))}
            </Box>
          )}
        </Paper>

        {/* Official Data Table */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress sx={{ color: isDark ? '#38bdf8' : '#0284c7' }} />
          </Box>
        ) : (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              background: isDark
                ? 'linear-gradient(145deg, rgba(17, 26, 46, 0.85) 0%, rgba(10, 16, 30, 0.92) 100%)'
                : '#ffffff',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
            }}
          >
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table size="small" stickyHeader className="report-table-print">
                <TableHead>
                  <TableRow>
                    {visibleColumns.map((col) => (
                      <TableCell
                        key={col.key}
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          letterSpacing: '0.03em',
                          textTransform: 'uppercase',
                          bgcolor: isDark ? 'rgba(30, 41, 59, 0.98)' : '#0f172a',
                          color: '#ffffff',
                          borderBottom: isDark ? '2px solid #38bdf8' : '2px solid #0284c7',
                          py: 1.5,
                        }}
                      >
                        {col.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={visibleColumns.length || 1} align="center" sx={{ py: 6 }}>
                        <CheckCircleOutlinedIcon sx={{ fontSize: 36, color: '#10b981', mb: 1 }} />
                        <Typography variant="body1" fontWeight={700} sx={{ color: primaryText }}>
                          No Incident Telemetry Found
                        </Typography>
                        <Typography variant="body2" sx={{ color: secondaryText }}>
                          All monitored sectors report normal parameters for {source.label}.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row, idx) => {
                      const sev = String(
                        row.severity || row.riskCategory || row.riskLevel || row.priority || ''
                      ).toUpperCase();
                      const isCrit = sev === 'CRITICAL' || sev === 'RED' || sev === 'URGENT';
                      const isHigh = sev === 'HIGH';

                      return (
                        <TableRow
                          key={row._id || idx}
                          sx={{
                            bgcolor: isCrit
                              ? isDark
                                ? 'rgba(239, 68, 68, 0.12)'
                                : '#fff1f2'
                              : isHigh
                              ? isDark
                                ? 'rgba(249, 115, 22, 0.08)'
                                : '#fff7ed'
                              : idx % 2 === 0
                              ? isDark
                                ? 'rgba(255,255,255,0.015)'
                                : '#f8fafc'
                              : 'transparent',
                            '&:hover': {
                              bgcolor: isDark ? 'rgba(56, 189, 248, 0.08)' : 'rgba(2, 132, 199, 0.04)',
                            },
                          }}
                        >
                          {visibleColumns.map((col) => {
                            const val = formatCell(row[col.key], col.key);
                            const isStatusCol =
                              col.key.toLowerCase().includes('severity') ||
                              col.key.toLowerCase().includes('level') ||
                              col.key.toLowerCase().includes('riskcategory') ||
                              col.key.toLowerCase().includes('priority');

                            return (
                              <TableCell
                                key={col.key}
                                sx={{
                                  color: isCrit ? '#ef4444' : primaryText,
                                  fontSize: '0.8rem',
                                  py: 1.2,
                                  fontWeight: isCrit || col.key === 'name' || col.key === 'title' ? 700 : 500,
                                  borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f1f5f9',
                                }}
                              >
                                {isStatusCol ? (
                                  <Chip
                                    label={val}
                                    size="small"
                                    sx={{
                                      fontWeight: 800,
                                      fontSize: '0.68rem',
                                      bgcolor:
                                        val.toUpperCase() === 'CRITICAL' || val.toUpperCase() === 'RED' || val.toUpperCase() === 'URGENT'
                                          ? 'rgba(239, 68, 68, 0.18)'
                                          : val.toUpperCase() === 'HIGH'
                                          ? 'rgba(249, 115, 22, 0.18)'
                                          : val.toUpperCase() === 'AMBER' || val.toUpperCase() === 'MODERATE' || val.toUpperCase() === 'MEDIUM'
                                          ? 'rgba(234, 179, 8, 0.18)'
                                          : 'rgba(34, 197, 94, 0.15)',
                                      color:
                                        val.toUpperCase() === 'CRITICAL' || val.toUpperCase() === 'RED' || val.toUpperCase() === 'URGENT'
                                          ? '#ef4444'
                                          : val.toUpperCase() === 'HIGH'
                                          ? '#f97316'
                                          : val.toUpperCase() === 'AMBER' || val.toUpperCase() === 'MODERATE' || val.toUpperCase() === 'MEDIUM'
                                          ? '#ca8a04'
                                          : '#16a34a',
                                      border: '1px solid currentColor',
                                    }}
                                  />
                                ) : (
                                  val
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>
    </Boilerplate>
  );
}
