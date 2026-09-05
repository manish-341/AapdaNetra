import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  IconButton,
  Tabs,
  Tab,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  AlertTriangle,
  VolumeX,
  ShieldAlert,
  X,
  MapPin,
  BellRing,
  PhoneCall,
  Activity,
  CheckCircle2,
  Eye,
  ShieldCheck,
  ChevronRight,
  Layers,
  Sparkles,
  Search,
  CheckCheck
} from 'lucide-react';
import { getAlerts, dispatchEmergencyAlert } from '../services/api';
import { playEmergencySiren, stopEmergencySiren, isSirenActive } from '../utils/emergencyAudio';
import { triggerDisasterNotification } from '../utils/emergencyNotification';
import { useLocationContext } from '../context/LocationContext';
import { useThemeMode } from '../context/ThemeContext';
import { getCurrentUser } from '../lib/auth';
import { alertMatchesLocation, isTrueCriticalAlert, getAlertRegionName } from '../utils/alertMatcher';
import { isAlertRead, markAlertAsRead, markAllAlertsAsRead } from '../utils/notificationsStore';

const NOTIFICATIONS_STORAGE_KEY = 'aapdanetra_notifications_config';
const ACKNOWLEDGED_ALERTS_KEY = 'an_acknowledged_critical_alerts';

export default function EmergencyAlertSentinel() {
  const navigate = useNavigate();
  const { location, switchLocation } = useLocationContext();
  const { isDark } = useThemeMode();

  const [alerts, setAlerts] = useState([]);
  const [activeCriticalAlert, setActiveCriticalAlert] = useState(null);
  const [activeAreaAlert, setActiveAreaAlert] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toastPopupOpen, setToastPopupOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [sirenPlaying, setSirenPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: Area-Wise Search & Briefing, 1: National Overview
  const [areaSearchQuery, setAreaSearchQuery] = useState('');

  const lastSoundedAlertIdRef = useRef(null);
  const currentUser = getCurrentUser() || {};
  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'ADMINISTRATOR';

  // Listen for global navbar Bell click to open the notification alert popup
  useEffect(() => {
    const handleOpenPopup = () => {
      setModalOpen(true);
      if (alerts && alerts.length > 0) {
        markAllAlertsAsRead(alerts);
      }
    };

    window.addEventListener('open-notifications-popup', handleOpenPopup);
    return () => {
      window.removeEventListener('open-notifications-popup', handleOpenPopup);
    };
  }, [alerts]);

  // Mark alerts as read whenever modal is opened
  useEffect(() => {
    if (modalOpen && alerts.length > 0) {
      markAllAlertsAsRead(alerts);
    }
  }, [modalOpen, alerts]);

  // Listen for siren stop event to automatically sync sirenPlaying state
  useEffect(() => {
    const handleSirenStopped = () => {
      setSirenPlaying(false);
    };
    window.addEventListener('emergency-siren-stopped', handleSirenStopped);
    return () => {
      window.removeEventListener('emergency-siren-stopped', handleSirenStopped);
    };
  }, []);

  // Stop any active siren immediately when user switches active location
  useEffect(() => {
    if (isSirenActive()) {
      stopEmergencySiren();
    }
    setSirenPlaying(false);
  }, [location?.district, location?.name]);

  // Poll alerts and automatically trigger alarm strictly on critical emergencies in active district
  useEffect(() => {
    let isMounted = true;

    const checkEmergencyAlerts = async () => {
      try {
        let notifConfig = { severityThreshold: 70, audioSiren: true, emailAlerts: true };
        try {
          const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
          if (saved) notifConfig = JSON.parse(saved);
        } catch {}

        const res = await getAlerts();
        const alertsList = res.data?.data || [];
        if (!isMounted) return;

        setAlerts(alertsList);

        // 1. Local alerts for current user jurisdiction
        const localAlerts = alertsList.filter((a) => a.isActive !== false && alertMatchesLocation(a, location));
        const rank = { CRITICAL: 4, HIGH: 3, WARNING: 2, INFO: 1 };
        localAlerts.sort((a, b) => (rank[b.severity] || 0) - (rank[a.severity] || 0));

        // 2. Primary most important alert for the searched area
        const primaryAreaAlert = localAlerts[0] || null;

        // 3. Civil defense critical check: MUST BE STRICTLY A VERIFIED CRITICAL ALERT IN THIS REGION
        const localCriticalAlert = localAlerts.find((a) => isTrueCriticalAlert(a)) || null;

        // STRICT LIFE-SAFETY SIREN RULE:
        // If the current location is NOT in a verified critical emergency:
        // - IMMEDIATELY SILENCE ANY SIREN
        // - HIDE CRITICAL EMERGENCY BANNER
        // - DO NOT SOUND ANY ALARM
        if (!localCriticalAlert) {
          if (isSirenActive()) {
            stopEmergencySiren();
          }
          setSirenPlaying(false);
          setActiveCriticalAlert(null);
          setBannerDismissed(true);

          if (primaryAreaAlert && (primaryAreaAlert.severity === 'HIGH' || primaryAreaAlert.severity === 'CRITICAL')) {
            const nonCritId = primaryAreaAlert._id || primaryAreaAlert.id || primaryAreaAlert.title;
            let acknowledgedIds = [];
            try {
              acknowledgedIds = JSON.parse(sessionStorage.getItem(ACKNOWLEDGED_ALERTS_KEY) || '[]');
            } catch {}
            setActiveAreaAlert(primaryAreaAlert);
            if (!acknowledgedIds.includes(nonCritId) && !modalOpen) {
              setToastPopupOpen(true);
            }
          } else {
            setActiveAreaAlert(null);
            setToastPopupOpen(false);
          }
          return;
        }

        // --- CRITICAL REGION EMERGENCY ACTIVE ---
        const critAlertId = localCriticalAlert._id || localCriticalAlert.id || localCriticalAlert.title;
        setActiveAreaAlert(localCriticalAlert);
        setActiveCriticalAlert(localCriticalAlert);
        setBannerDismissed(false);

        let acknowledgedIds = [];
        try {
          acknowledgedIds = JSON.parse(sessionStorage.getItem(ACKNOWLEDGED_ALERTS_KEY) || '[]');
        } catch {}
        const isAcknowledged = acknowledgedIds.includes(critAlertId);

        let soundedIds = [];
        try {
          soundedIds = JSON.parse(sessionStorage.getItem('an_sounded_critical_alerts') || '[]');
        } catch {}
        const hasAlreadySounded = soundedIds.includes(critAlertId);

        if (!isAcknowledged && !modalOpen) {
          setToastPopupOpen(true);
        }

        // Sound acoustic civil defense siren ONLY for verified critical emergencies in this region
        // and only once per session so navigating pages doesn't endlessly blare
        if (!isAcknowledged && !hasAlreadySounded && lastSoundedAlertIdRef.current !== critAlertId) {
          lastSoundedAlertIdRef.current = critAlertId;

          try {
            soundedIds.push(critAlertId);
            sessionStorage.setItem('an_sounded_critical_alerts', JSON.stringify(soundedIds));
          } catch {}

          if (notifConfig.audioSiren !== false) {
            playEmergencySiren(7000);
            setSirenPlaying(true);
          }

          const alertTitle = localCriticalAlert.title || 'Critical Disaster Alert';
          const alertDesc =
            localCriticalAlert.message ||
            localCriticalAlert.description ||
            `Immediate emergency action required in ${location?.district || 'your district'}.`;

          triggerDisasterNotification({
            title: alertTitle,
            body: alertDesc,
            sound: false
          });

          if (notifConfig.emailAlerts !== false) {
            const user = getCurrentUser();
            if (user?.email) {
              dispatchEmergencyAlert({
                recipientEmail: user.email,
                recipientName: user.name || (isAdmin ? 'Disaster Operations Admin' : 'Citizen Resident'),
                title: alertTitle,
                hazardType: localCriticalAlert.hazardType || 'FLOOD',
                severity: 'CRITICAL',
                district: location?.district || 'Active Monitored Zone',
                state: location?.state || 'India',
                instructions: alertDesc
              }).catch(() => {});
            }
          }
        }
      } catch (err) {
        console.warn('[Emergency Sentinel] Alert check error:', err.message);
      }
    };

    checkEmergencyAlerts();
    const interval = setInterval(checkEmergencyAlerts, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (isSirenActive()) {
        stopEmergencySiren();
      }
    };
  }, [location?.district, location?.name]);

  const handleAcknowledgeAndSilence = () => {
    stopEmergencySiren();
    setSirenPlaying(false);
    setModalOpen(false);
    setToastPopupOpen(false);
    markAllAlertsAsRead(alerts);

    if (activeCriticalAlert) {
      try {
        const id = activeCriticalAlert._id || activeCriticalAlert.id || activeCriticalAlert.title;
        let acknowledgedIds = JSON.parse(sessionStorage.getItem(ACKNOWLEDGED_ALERTS_KEY) || '[]');
        if (!acknowledgedIds.includes(id)) {
          acknowledgedIds.push(id);
          sessionStorage.setItem(ACKNOWLEDGED_ALERTS_KEY, JSON.stringify(acknowledgedIds));
        }
      } catch {}
    }
  };

  const handleSilenceOnly = () => {
    stopEmergencySiren();
    setSirenPlaying(false);
  };

  // Local alerts for the current district (clean and sorted by priority)
  const rank = { CRITICAL: 4, HIGH: 3, WARNING: 2, INFO: 1 };
  const districtAlerts = alerts
    .filter((a) => a.isActive !== false && alertMatchesLocation(a, location))
    .sort((a, b) => (rank[b.severity] || 0) - (rank[a.severity] || 0));

  // The single most important alert
  const primaryDistrictAlert = districtAlerts[0] || null;
  // Secondary alerts limited to top 2 to avoid clutter
  const secondaryDistrictAlerts = districtAlerts.slice(1, 3);

  // Group alerts across all regions and pick the single most important alert per region (no duplicates or mess)
  const regionalImportantAlerts = React.useMemo(() => {
    const active = alerts.filter((a) => a.isActive !== false);
    const regionMap = new Map();
    const rankMap = { CRITICAL: 4, HIGH: 3, WARNING: 2, INFO: 1 };

    for (const a of active) {
      const region = getAlertRegionName(a);
      if (!regionMap.has(region)) {
        regionMap.set(region, a);
      } else {
        const existing = regionMap.get(region);
        if ((rankMap[a.severity] || 0) > (rankMap[existing.severity] || 0)) {
          regionMap.set(region, a);
        }
      }
    }

    return Array.from(regionMap.entries())
      .map(([region, alert]) => ({ region, alert }))
      .sort((a, b) => (rankMap[b.alert.severity] || 0) - (rankMap[a.alert.severity] || 0));
  }, [alerts]);

  // Alerts filtered strictly according to what area is being searched / viewed
  const displayedAreaAlerts = React.useMemo(() => {
    if (!areaSearchQuery.trim()) {
      return districtAlerts;
    }
    if (areaSearchQuery === '__ALL__') {
      return [...alerts]
        .filter((a) => a.isActive !== false)
        .sort((a, b) => (rank[b.severity] || 0) - (rank[a.severity] || 0));
    }
    const q = areaSearchQuery.trim().toLowerCase();
    return alerts
      .filter((a) => {
        if (a.isActive === false) return false;
        const title = (a.title || '').toLowerCase();
        const msg = (a.message || a.description || '').toLowerCase();
        const dist = (a.district || '').toLowerCase();
        const region = getAlertRegionName(a).toLowerCase();
        return title.includes(q) || msg.includes(q) || dist.includes(q) || region.includes(q);
      })
      .sort((a, b) => (rank[b.severity] || 0) - (rank[a.severity] || 0));
  }, [alerts, areaSearchQuery, districtAlerts]);

  return (
    <>
      {/* 1. TOP PULSING CRITICAL BANNER (Shown ONLY when a true CRITICAL situation is active in current district) */}
      {activeCriticalAlert && !bannerDismissed && (
        <Box
          sx={{
            mb: 2.5,
            p: 1.5,
            px: 2.5,
            borderRadius: 3,
            bgcolor: '#dc2626',
            background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
            color: '#ffffff',
            boxShadow: '0 10px 30px rgba(220, 38, 38, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            animation: 'pulse 2s infinite'
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: '#ffffff',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                flexShrink: 0
              }}
            >
              <AlertTriangle size={20} />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={900} sx={{ letterSpacing: '0.02em', color: '#fff' }}>
                🚨 CRITICAL EMERGENCY ACTIVE: {activeCriticalAlert.title}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.95)', display: 'block', fontWeight: 600 }}>
                Jurisdiction: <strong>{location?.name || location?.district}</strong> • Automated 7-second civil defense siren dispatched.
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            {sirenPlaying && (
              <Button
                size="small"
                variant="contained"
                onClick={handleSilenceOnly}
                startIcon={<VolumeX size={15} />}
                sx={{
                  bgcolor: '#ffffff',
                  color: '#dc2626',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  borderRadius: 2,
                  '&:hover': { bgcolor: '#fef2f2' }
                }}
              >
                Mute Siren
              </Button>
            )}

            <Button
              size="small"
              variant="outlined"
              onClick={() => setModalOpen(true)}
              sx={{
                borderColor: '#ffffff',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.75rem',
                textTransform: 'none',
                borderRadius: 2,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.15)', borderColor: '#ffffff' }
              }}
            >
              {isAdmin ? 'Open Command Popup' : 'View Safety Protocols'}
            </Button>

            <IconButton
              size="small"
              onClick={() => setBannerDismissed(true)}
              sx={{ color: '#ffffff' }}
              title="Dismiss banner"
            >
              <X size={18} />
            </IconButton>
          </Box>
        </Box>
      )}

      {/* 2. REAL-TIME FLOATING ALERT POPUP TOAST (Shown strictly for the searched / active area) */}
      {toastPopupOpen && activeAreaAlert && !modalOpen && (() => {
        const isCrit = isTrueCriticalAlert(activeAreaAlert);
        const isHigh = activeAreaAlert.severity === 'HIGH';
        const themeColor = isCrit ? '#ef4444' : isHigh ? '#f97316' : '#0284c7';
        const sevLabel = isCrit ? 'CRITICAL EMERGENCY' : isHigh ? 'HIGH ALERT' : 'AREA ADVISORY';
        const areaName = location?.name || location?.district || getAlertRegionName(activeAreaAlert);

        return (
          <Box
            sx={{
              position: 'fixed',
              top: 76,
              right: 20,
              zIndex: 9999,
              width: { xs: 'calc(100vw - 40px)', sm: 400 },
              bgcolor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(16px)',
              border: `2px solid ${themeColor}`,
              borderRadius: 3.5,
              boxShadow: isCrit
                ? '0 20px 40px rgba(239, 68, 68, 0.35)'
                : '0 15px 35px rgba(249, 115, 22, 0.25)',
              p: 2,
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              animation: 'slideInRight 0.4s ease-out'
            }}
          >
            <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1.5} mb={1}>
              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 2,
                    bgcolor: isCrit ? 'rgba(239, 68, 68, 0.18)' : 'rgba(249, 115, 22, 0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: themeColor
                  }}
                >
                  <AlertTriangle size={18} />
                </Box>
                <Chip
                  label={areaName}
                  size="small"
                  sx={{
                    bgcolor: themeColor,
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '0.68rem',
                    height: 22
                  }}
                />
                <Chip
                  label={sevLabel}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: themeColor,
                    color: themeColor,
                    fontWeight: 800,
                    fontSize: '0.62rem',
                    height: 20
                  }}
                />
              </Box>

              <IconButton
                size="small"
                onClick={() => setToastPopupOpen(false)}
                sx={{ color: 'text.secondary', p: 0.5 }}
              >
                <X size={16} />
              </IconButton>
            </Box>

            <Typography variant="subtitle2" fontWeight={800} sx={{ color: 'text.primary', mb: 0.5, lineHeight: 1.3 }}>
              {activeAreaAlert.title}
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                mb: 1.5,
                lineHeight: 1.4
              }}
            >
              {activeAreaAlert.message || activeAreaAlert.description}
            </Typography>

            <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} pt={1} borderTop="1px solid var(--border-color)">
              {sirenPlaying && (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={handleSilenceOnly}
                  startIcon={<VolumeX size={13} />}
                  sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'none', py: 0.3, px: 1, borderRadius: 1.5 }}
                >
                  Mute
                </Button>
              )}

              <Button
                size="small"
                variant="contained"
                onClick={() => {
                  setToastPopupOpen(false);
                  setActiveTab(0);
                  setModalOpen(true);
                }}
                endIcon={<ChevronRight size={14} />}
                sx={{
                  bgcolor: themeColor,
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'none',
                  py: 0.4,
                  px: 1.5,
                  borderRadius: 2,
                  ml: 'auto',
                  '&:hover': { bgcolor: themeColor }
                }}
              >
                View {areaName} Advisories
              </Button>
            </Box>
          </Box>
        );
      })()}

      {/* 3. CLEAN, FOCUSED ALERT CENTER MODAL (Highlights ONLY the most important alert so it never looks messy) */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            border: '1px solid',
            borderColor: activeCriticalAlert && isTrueCriticalAlert(activeCriticalAlert) ? '#ef4444' : 'var(--border-color)',
            boxShadow: activeCriticalAlert && isTrueCriticalAlert(activeCriticalAlert)
              ? '0 25px 60px -15px rgba(239, 68, 68, 0.45)'
              : '0 20px 45px rgba(0, 0, 0, 0.25)',
            bgcolor: isDark ? '#0f172a' : '#ffffff',
            backgroundImage: 'none',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ p: 2.5, pb: 1.5 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2.5,
                  bgcolor: activeCriticalAlert && isTrueCriticalAlert(activeCriticalAlert) ? 'rgba(239, 68, 68, 0.15)' : 'rgba(2, 132, 199, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: activeCriticalAlert && isTrueCriticalAlert(activeCriticalAlert) ? '#ef4444' : '#0284c7'
                }}
              >
                {activeCriticalAlert && isTrueCriticalAlert(activeCriticalAlert) ? <AlertTriangle size={22} /> : <BellRing size={22} />}
              </Box>
              <Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle1" fontWeight={900} sx={{ color: 'text.primary', lineHeight: 1.2 }}>
                    Emergency Intelligence Briefing
                  </Typography>
                  <Chip
                    label={isAdmin ? 'ADMIN' : 'CITIZEN'}
                    size="small"
                    sx={{
                      bgcolor: isAdmin ? '#8b5cf6' : '#0284c7',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '0.65rem',
                      height: 20
                    }}
                  />
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Active Region: <strong>{location?.name || location?.district}</strong>
                </Typography>
              </Box>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              {sirenPlaying && (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={handleSilenceOnly}
                  startIcon={<VolumeX size={15} />}
                  sx={{ fontWeight: 800, textTransform: 'none', borderRadius: 2 }}
                >
                  Mute Siren
                </Button>
              )}

              <Button
                size="small"
                variant="outlined"
                onClick={() => markAllAlertsAsRead(alerts)}
                startIcon={<CheckCheck size={14} />}
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: 2,
                  py: 0.3,
                  px: 1.2,
                  borderColor: 'var(--border-color)',
                  color: 'text.secondary',
                  '&:hover': { color: '#0284c7', borderColor: '#0284c7' }
                }}
              >
                Mark all read
              </Button>

              <IconButton onClick={() => setModalOpen(false)} sx={{ color: 'text.secondary' }}>
                <X size={18} />
              </IconButton>
            </Box>
          </Box>

          {/* Clean Segmented Tabs (Area-Wise Search vs All Monitored Regions) */}
          <Box sx={{ mt: 2, borderBottom: '1px solid var(--border-color)' }}>
            <Tabs
              value={activeTab}
              onChange={(e, val) => setActiveTab(val)}
              sx={{
                minHeight: 36,
                '& .MuiTab-root': {
                  minHeight: 36,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  py: 0.5,
                  px: 1.8
                }
              }}
            >
              <Tab label={`Area-Wise Alerts (${displayedAreaAlerts.length})`} />
              <Tab label={`All Monitored Regions Overview (${regionalImportantAlerts.length})`} />
            </Tabs>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5, pt: 1.5, maxHeight: '60vh', overflowY: 'auto' }}>
          {activeTab === 0 ? (
            /* TAB 0: AREA-WISE SEARCH & FILTERED ALERTS */
            <Box display="flex" flexDirection="column" gap={1.8}>
              {/* Interactive Area Search & Quick Filters */}
              <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: '1px solid var(--border-color)' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search alerts area-wise (e.g. Delhi, Mumbai, Bhopal, Noida, Dehradun)..."
                  value={areaSearchQuery}
                  onChange={(e) => setAreaSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={16} color="#64748b" />
                      </InputAdornment>
                    ),
                    endAdornment: areaSearchQuery ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setAreaSearchQuery('')}>
                          <X size={14} />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                    sx: {
                      borderRadius: 2,
                      fontSize: '0.82rem',
                      bgcolor: isDark ? '#0f172a' : '#ffffff'
                    }
                  }}
                />

                {/* Quick Area Chips */}
                <Box display="flex" alignItems="center" gap={0.8} mt={1.2} flexWrap="wrap">
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.68rem' }}>
                    Quick Select:
                  </Typography>
                  <Chip
                    label={`📍 Current: ${location?.name || location?.district || 'My Area'}`}
                    size="small"
                    onClick={() => setAreaSearchQuery('')}
                    color={!areaSearchQuery ? 'primary' : 'default'}
                    variant={!areaSearchQuery ? 'filled' : 'outlined'}
                    sx={{ fontWeight: 700, fontSize: '0.68rem', cursor: 'pointer', height: 22 }}
                  />
                  {['Delhi', 'Bhopal', 'Mumbai', 'Noida', 'Dehradun'].map((city) => (
                    <Chip
                      key={city}
                      label={city}
                      size="small"
                      onClick={() => setAreaSearchQuery(city)}
                      color={areaSearchQuery.toLowerCase() === city.toLowerCase() ? 'primary' : 'default'}
                      variant={areaSearchQuery.toLowerCase() === city.toLowerCase() ? 'filled' : 'outlined'}
                      sx={{ fontWeight: 700, fontSize: '0.68rem', cursor: 'pointer', height: 22 }}
                    />
                  ))}
                  <Chip
                    label="🌐 All Areas"
                    size="small"
                    onClick={() => setAreaSearchQuery('__ALL__')}
                    color={areaSearchQuery === '__ALL__' ? 'secondary' : 'default'}
                    variant={areaSearchQuery === '__ALL__' ? 'filled' : 'outlined'}
                    sx={{ fontWeight: 700, fontSize: '0.68rem', cursor: 'pointer', height: 22 }}
                  />
                </Box>

                {/* Area scope indicator */}
                <Box display="flex" alignItems="center" justifyContent="space-between" mt={1} pt={0.8} borderTop="1px dashed var(--border-color)">
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.72rem' }}>
                    {areaSearchQuery === '__ALL__' ? (
                      <>Displaying <strong>all active alerts</strong> nationwide ({displayedAreaAlerts.length})</>
                    ) : areaSearchQuery ? (
                      <>Searching alerts for area: <strong>"{areaSearchQuery}"</strong> ({displayedAreaAlerts.length} {displayedAreaAlerts.length === 1 ? 'alert' : 'alerts'})</>
                    ) : (
                      <>Showing alerts for searched area: <strong>{location?.name || location?.district}</strong> ({displayedAreaAlerts.length})</>
                    )}
                  </Typography>
                </Box>
              </Box>

              {/* Area Alerts List */}
              {displayedAreaAlerts.length > 0 ? (
                displayedAreaAlerts.map((item) => {
                  const alertRegion = getAlertRegionName(item);
                  const isTrulyCritical = isTrueCriticalAlert(item);
                  const effectiveSev = isTrulyCritical
                    ? 'CRITICAL'
                    : item.severity === 'CRITICAL'
                    ? 'WARNING'
                    : item.severity || 'INFO';
                  const isHigh = effectiveSev === 'HIGH';
                  const isCrit = effectiveSev === 'CRITICAL';
                  const themeColor = isCrit ? '#ef4444' : isHigh ? '#f97316' : '#0284c7';
                  const bgTint = isDark
                    ? isCrit
                      ? 'rgba(239, 68, 68, 0.12)'
                      : isHigh
                      ? 'rgba(249, 115, 22, 0.1)'
                      : 'rgba(2, 132, 199, 0.08)'
                    : isCrit
                    ? '#fef2f2'
                    : isHigh
                    ? '#fff7ed'
                    : '#f0f9ff';

                  const isCurrentDistrict = alertMatchesLocation(item, location);
                  const isRead = isAlertRead(item);

                  return (
                    <Box
                      key={item._id || item.id || item.title}
                      sx={{
                        p: 2.2,
                        borderRadius: 3,
                        bgcolor: bgTint,
                        border: '1.5px solid',
                        borderColor: isCrit ? '#ef4444' : themeColor,
                        boxShadow: isCrit ? '0 8px 25px rgba(239, 68, 68, 0.22)' : 'none',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: isCrit
                            ? '0 12px 30px rgba(239, 68, 68, 0.32)'
                            : '0 8px 20px rgba(0,0,0,0.06)'
                        }
                      }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1} flexWrap="wrap" gap={1}>
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          <Chip
                            label={`📍 ${alertRegion}`}
                            size="small"
                            sx={{
                              bgcolor: themeColor,
                              color: '#fff',
                              fontWeight: 900,
                              fontSize: '0.68rem',
                              height: 22
                            }}
                          />
                          {!isRead && (
                            <Chip
                              label="UNREAD"
                              size="small"
                              sx={{
                                bgcolor: '#ef4444',
                                color: '#fff',
                                fontWeight: 900,
                                fontSize: '0.62rem',
                                height: 22
                              }}
                            />
                          )}
                          <Chip
                            label={effectiveSev}
                            size="small"
                            variant={isCrit ? 'filled' : 'outlined'}
                            sx={{
                              borderColor: themeColor,
                              bgcolor: isCrit ? '#ef4444' : 'transparent',
                              color: isCrit ? '#fff' : themeColor,
                              fontWeight: 800,
                              fontSize: '0.65rem',
                              height: 22
                            }}
                          />
                          <Chip
                            label={item.hazardType || 'HAZARD'}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 600, fontSize: '0.62rem', height: 22 }}
                          />
                        </Box>

                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          {new Date(item.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>

                      <Typography variant="subtitle2" fontWeight={800} sx={{ color: 'text.primary', mb: 0.6, fontSize: '0.9rem' }}>
                        {item.title}
                      </Typography>

                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5, lineHeight: 1.45, fontSize: '0.82rem' }}>
                        {item.message || item.description}
                      </Typography>

                      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} pt={1} borderTop="1px solid var(--border-color)">
                        {item.affectedRadius && (
                          <Typography variant="caption" sx={{ color: 'text.muted' }}>
                            📍 Radius: <strong>{item.affectedRadius} km</strong>
                          </Typography>
                        )}

                        <Box display="flex" alignItems="center" gap={1} ml="auto">
                          {!isRead && (
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => markAlertAsRead(item)}
                              sx={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                textTransform: 'none',
                                py: 0.3,
                                px: 1,
                                color: '#0284c7'
                              }}
                            >
                              Mark read
                            </Button>
                          )}
                          {!isCurrentDistrict && (
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => {
                                const districtOnly = alertRegion.split('(')[0].trim();
                                switchLocation(districtOnly);
                                setModalOpen(false);
                              }}
                              sx={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                textTransform: 'none',
                                py: 0.3,
                                px: 1,
                                color: 'text.secondary',
                                '&:hover': { color: 'text.primary' }
                              }}
                            >
                              Set as Active Area
                            </Button>
                          )}
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                              setModalOpen(false);
                              navigate('/disaster-map');
                            }}
                            startIcon={<MapPin size={13} />}
                            sx={{
                              bgcolor: themeColor,
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              textTransform: 'none',
                              py: 0.3,
                              px: 1.5,
                              borderRadius: 2,
                              '&:hover': { bgcolor: themeColor }
                            }}
                          >
                            View Threat Map
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  );
                })
              ) : (
                <Box sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px dashed var(--border-color)' }}>
                  <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 8px auto' }} />
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: 'text.primary' }}>
                    All Clear in {areaSearchQuery || location?.name || location?.district}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    No active disaster alerts or critical warnings are in effect for this searched area.
                  </Typography>
                </Box>
              )}

              {/* EMERGENCY PROTOCOL FOOTER HELPLINES */}
              <Box sx={{ mt: 1, p: 1.5, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#f1f5f9', border: '1px solid var(--border-color)' }}>
                <Typography variant="caption" fontWeight={700} sx={{ color: 'text.secondary', display: 'block', textAlign: 'center' }}>
                  Emergency Helplines: NDRF: <strong>1070</strong> | Police/Ambulance: <strong>112</strong> | State Relief: <strong>1077</strong>
                </Typography>
              </Box>
            </Box>
          ) : (
            /* TAB 1: ALL MONITORED REGIONS OVERVIEW (1 PER REGION, CURATED & CLEAN) */
            <Box display="flex" flexDirection="column" gap={1.8}>
              {regionalImportantAlerts.length > 0 ? (
                regionalImportantAlerts.map(({ region, alert: item }) => {
                  const isTrulyCritical = isTrueCriticalAlert(item);
                  const isRead = isAlertRead(item);
                  const effectiveSev = isTrulyCritical
                    ? 'CRITICAL'
                    : item.severity === 'CRITICAL'
                    ? 'WARNING'
                    : item.severity || 'INFO';
                  const isHigh = effectiveSev === 'HIGH';
                  const isCrit = effectiveSev === 'CRITICAL';
                  const themeColor = isCrit ? '#ef4444' : isHigh ? '#f97316' : '#0284c7';
                  const bgTint = isDark
                    ? isCrit
                      ? 'rgba(239, 68, 68, 0.12)'
                      : isHigh
                      ? 'rgba(249, 115, 22, 0.1)'
                      : 'rgba(2, 132, 199, 0.08)'
                    : isCrit
                    ? '#fef2f2'
                    : isHigh
                    ? '#fff7ed'
                    : '#f0f9ff';

                  return (
                    <Box
                      key={item._id || region}
                      sx={{
                        p: 2.2,
                        borderRadius: 3,
                        bgcolor: bgTint,
                        border: '1.5px solid',
                        borderColor: isCrit ? '#ef4444' : themeColor,
                        boxShadow: isCrit ? '0 8px 25px rgba(239, 68, 68, 0.25)' : 'none',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: isCrit
                            ? '0 12px 30px rgba(239, 68, 68, 0.35)'
                            : '0 8px 20px rgba(0,0,0,0.06)'
                        }
                      }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1} flexWrap="wrap" gap={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={region}
                            size="small"
                            sx={{
                              bgcolor: themeColor,
                              color: '#fff',
                              fontWeight: 900,
                              fontSize: '0.68rem',
                              height: 22
                            }}
                          />
                          {!isRead && (
                            <Chip
                              label="UNREAD"
                              size="small"
                              sx={{
                                bgcolor: '#ef4444',
                                color: '#fff',
                                fontWeight: 900,
                                fontSize: '0.62rem',
                                height: 22
                              }}
                            />
                          )}
                          <Chip
                            label={effectiveSev}
                            size="small"
                            variant={isCrit ? 'filled' : 'outlined'}
                            sx={{
                              borderColor: themeColor,
                              bgcolor: isCrit ? '#ef4444' : 'transparent',
                              color: isCrit ? '#fff' : themeColor,
                              fontWeight: 800,
                              fontSize: '0.65rem',
                              height: 22
                            }}
                          />
                          <Chip
                            label={item.hazardType || 'HAZARD'}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 600, fontSize: '0.62rem', height: 22 }}
                          />
                        </Box>

                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          {new Date(item.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>

                      <Typography variant="subtitle2" fontWeight={800} sx={{ color: 'text.primary', mb: 0.6, fontSize: '0.9rem' }}>
                        {item.title}
                      </Typography>

                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5, lineHeight: 1.45, fontSize: '0.82rem' }}>
                        {item.message || item.description}
                      </Typography>

                      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} pt={1} borderTop="1px solid var(--border-color)">
                        {item.affectedRadius && (
                          <Typography variant="caption" sx={{ color: 'text.muted' }}>
                            📍 Radius: <strong>{item.affectedRadius} km</strong>
                          </Typography>
                        )}

                        <Box display="flex" alignItems="center" gap={1} ml="auto">
                          {!isRead && (
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => markAlertAsRead(item)}
                              sx={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                textTransform: 'none',
                                py: 0.3,
                                px: 1,
                                color: '#0284c7'
                              }}
                            >
                              Mark read
                            </Button>
                          )}
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => {
                              const districtOnly = region.split('(')[0].trim();
                              switchLocation(districtOnly);
                              setModalOpen(false);
                            }}
                            sx={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              textTransform: 'none',
                              py: 0.3,
                              px: 1,
                              color: 'text.secondary',
                              '&:hover': { color: 'text.primary' }
                            }}
                          >
                            Switch to {region.split('(')[0].trim()}
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                              setModalOpen(false);
                              navigate('/disaster-map');
                            }}
                            startIcon={<MapPin size={13} />}
                            sx={{
                              bgcolor: themeColor,
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              textTransform: 'none',
                              py: 0.3,
                              px: 1.5,
                              borderRadius: 2,
                              '&:hover': { bgcolor: themeColor }
                            }}
                          >
                            View Threat Map
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  );
                })
              ) : (
                <Box sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px dashed var(--border-color)' }}>
                  <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 8px auto' }} />
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: 'text.primary' }}>
                    All Monitored Regions Clear
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    No active disaster alerts or critical warnings across all national monitoring nodes.
                  </Typography>
                </Box>
              )}

              {/* EMERGENCY PROTOCOL FOOTER HELPLINES */}
              <Box sx={{ mt: 1, p: 1.5, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#f1f5f9', border: '1px solid var(--border-color)' }}>
                <Typography variant="caption" fontWeight={700} sx={{ color: 'text.secondary', display: 'block', textAlign: 'center' }}>
                  National Helplines: NDRF: <strong>1070</strong> | Police/Ambulance: <strong>112</strong> | National Disaster Authority: <strong>1078</strong>
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, px: 2.5, borderTop: '1px solid var(--border-color)', justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ color: 'text.muted' }}>
            AapdaNetra Early Warning Engine
          </Typography>

          <Button
            variant="contained"
            onClick={handleAcknowledgeAndSilence}
            sx={{
              bgcolor: '#0f172a',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.8rem',
              borderRadius: 2,
              textTransform: 'none',
              px: 2.5,
              '&:hover': { bgcolor: '#1e293b' }
            }}
          >
            Dismiss & Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
