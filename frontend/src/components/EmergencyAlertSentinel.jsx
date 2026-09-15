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
  Volume2,
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
import { playEmergencySiren, stopEmergencySiren, isSirenActive, unlockAudioContext } from '../utils/emergencyAudio';
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

  // Listen for siren events to automatically sync sirenPlaying state
  useEffect(() => {
    const handleSirenStarted = () => setSirenPlaying(true);
    const handleSirenStopped = () => setSirenPlaying(false);
    window.addEventListener('emergency-siren-started', handleSirenStarted);
    window.addEventListener('emergency-siren-stopped', handleSirenStopped);
    return () => {
      window.removeEventListener('emergency-siren-started', handleSirenStarted);
      window.removeEventListener('emergency-siren-stopped', handleSirenStopped);
    };
  }, []);

  // Stop any active siren immediately when user switches active location and reset sounded ref
  useEffect(() => {
    if (isSirenActive()) {
      stopEmergencySiren();
    }
    setSirenPlaying(false);
    lastSoundedAlertIdRef.current = null;
    try {
      sessionStorage.removeItem('an_last_sounded_hazard_sig');
      sessionStorage.removeItem('an_last_sounded_hazard_loc');
    } catch {}
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

        const currentLocKey = (location?.district || location?.name || '').toLowerCase().trim();

        // 1. MUST strictly match current user's location AND must be severity === 'CRITICAL' AND active
        const localCriticalAlert = alertsList.find((a) =>
          a.isActive !== false &&
          a.severity === 'CRITICAL' &&
          alertMatchesLocation(a, location)
        );

        // Local non-critical alerts for current user jurisdiction (HIGH, WARNING, INFO)
        const localNonCriticals = alertsList.filter((a) =>
          a.isActive !== false &&
          a.severity !== 'CRITICAL' &&
          alertMatchesLocation(a, location)
        );
        const rank = { HIGH: 3, WARNING: 2, INFO: 1 };
        localNonCriticals.sort((a, b) => (rank[b.severity] || 0) - (rank[a.severity] || 0));
        const primaryAreaAlert = localNonCriticals[0] || null;

        // STRICT LIFE-SAFETY SIREN RULE:
        // ONLY sound if the user's active location is in a verified CRITICAL hazard zone.
        // If current location is NOT in a critical hazard zone:
        // - IMMEDIATELY SILENCE ANY SIREN
        // - DO NOT SOUND ANY ALARM
        if (!localCriticalAlert) {
          if (isSirenActive()) {
            stopEmergencySiren();
          }
          setSirenPlaying(false);
          setActiveCriticalAlert(null);
          setBannerDismissed(true);

          if (primaryAreaAlert) {
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

        // --- CURRENT LOCATION IS UNDER CRITICAL HAZARD ZONE ---
        const critAlertId = localCriticalAlert._id || localCriticalAlert.id || localCriticalAlert.title;
        setActiveAreaAlert(localCriticalAlert);
        setActiveCriticalAlert(localCriticalAlert);
        setBannerDismissed(false);

        let acknowledgedIds = [];
        try {
          acknowledgedIds = JSON.parse(sessionStorage.getItem(ACKNOWLEDGED_ALERTS_KEY) || '[]');
        } catch {}
        const isAcknowledged = acknowledgedIds.includes(critAlertId);

        if (!isAcknowledged && !modalOpen) {
          setToastPopupOpen(true);
        }

        // Check if siren already sounded for this alert signature in this session
        const currentAlertSig = `${currentLocKey}_${critAlertId}`;
        const lastSoundedSig = sessionStorage.getItem('an_last_sounded_hazard_sig');

        // Trigger acoustic siren when user enters/changes location into a critical hazard zone or new critical alert arrives
        if (!isAcknowledged && (lastSoundedSig !== currentAlertSig || lastSoundedAlertIdRef.current !== critAlertId)) {
          sessionStorage.setItem('an_last_sounded_hazard_sig', currentAlertSig);
          lastSoundedAlertIdRef.current = critAlertId;

          if (notifConfig.audioSiren !== false) {
            console.log(`[Emergency Sentinel] 🚨 USER LOCATION UNDER HAZARD ZONE: ${localCriticalAlert.district || currentLocKey}. Siren triggered.`);
            playEmergencySiren(8000);
            setSirenPlaying(true);
          }

          const alertTitle = localCriticalAlert.title || 'Critical Disaster Alert';
          const alertDesc =
            localCriticalAlert.message ||
            localCriticalAlert.description ||
            `Immediate emergency evacuation action required in ${location?.district || 'your area'}.`;

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

  const handleSilenceOnly = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    stopEmergencySiren();
    setSirenPlaying(false);
  };

  const handlePlaySiren = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    unlockAudioContext();
    playEmergencySiren(8000, true);
    setSirenPlaying(true);
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
            {sirenPlaying ? (
              <Button
                size="small"
                variant="contained"
                onClick={handleSilenceOnly}
                startIcon={<VolumeX size={15} />}
                sx={{
                  bgcolor: '#ffffff',
                  color: '#dc2626',
                  fontWeight: 900,
                  fontSize: '0.78rem',
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 1.5,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                  '&:hover': { bgcolor: '#fef2f2' }
                }}
              >
                Mute Siren
              </Button>
            ) : (
              <Button
                size="small"
                variant="contained"
                onClick={handlePlaySiren}
                startIcon={<Volume2 size={16} />}
                sx={{
                  bgcolor: '#ffffff',
                  color: '#dc2626',
                  fontWeight: 900,
                  fontSize: '0.78rem',
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 1.8,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
                  animation: 'pulse 1.5s infinite',
                  '&:hover': { bgcolor: '#fef2f2' }
                }}
              >
                🚨 Ring Siren
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
              {isCrit && (
                sirenPlaying ? (
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
                ) : (
                  <Button
                    size="small"
                    variant="contained"
                    color="error"
                    onClick={handlePlaySiren}
                    startIcon={<Volume2 size={13} />}
                    sx={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'none', py: 0.3, px: 1.2, borderRadius: 1.5 }}
                  >
                    🚨 Ring Siren
                  </Button>
                )
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

      {/* 3. SIMPLE, READABLE ALERT CENTER */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: '1px solid',
            borderColor: activeCriticalAlert && isTrueCriticalAlert(activeCriticalAlert) ? '#ef4444' : 'var(--border-color)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.15)',
            bgcolor: isDark ? '#0f172a' : '#ffffff',
            backgroundImage: 'none',
            overflow: 'hidden'
          }
        }}
      >
        {/* Simple Header */}
        <Box sx={{ p: 2.5, pb: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: activeCriticalAlert && isTrueCriticalAlert(activeCriticalAlert) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(2, 132, 199, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: activeCriticalAlert && isTrueCriticalAlert(activeCriticalAlert) ? '#ef4444' : '#0284c7'
              }}
            >
              {activeCriticalAlert && isTrueCriticalAlert(activeCriticalAlert) ? <AlertTriangle size={20} /> : <BellRing size={20} />}
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: 'text.primary', lineHeight: 1.2, fontSize: '1rem' }}>
                Alert Center
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem' }}>
                {location?.name || location?.district || 'Ranchi'} • {isAdmin ? 'Admin' : 'Citizen'}
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={0.5}>
            {activeCriticalAlert && isTrueCriticalAlert(activeCriticalAlert) && (
              sirenPlaying ? (
                <IconButton size="small" onClick={handleSilenceOnly} sx={{ color: '#ef4444' }}>
                  <VolumeX size={18} />
                </IconButton>
              ) : (
                <IconButton size="small" onClick={handlePlaySiren} sx={{ color: '#ef4444', animation: 'pulse 1.5s infinite' }}>
                  <Volume2 size={18} />
                </IconButton>
              )
            )}
            <IconButton onClick={() => setModalOpen(false)} size="small" sx={{ color: 'text.secondary' }}>
              <X size={18} />
            </IconButton>
          </Box>
        </Box>

        {/* Simple Tabs */}
        <Box sx={{ px: 2.5, mt: 1.5, borderBottom: '1px solid var(--border-color)' }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            sx={{
              minHeight: 36,
              '& .MuiTab-root': {
                minHeight: 36,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.8rem',
                py: 0.5,
                px: 1.5,
                minWidth: 'auto'
              }
            }}
          >
            <Tab label={`Local (${displayedAreaAlerts.length})`} />
            <Tab label={`All Regions (${regionalImportantAlerts.length})`} />
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 2.5, pt: 2, maxHeight: '55vh', overflowY: 'auto' }}>
          {activeTab === 0 ? (
            /* TAB 0: LOCAL ALERTS */
            <Box display="flex" flexDirection="column" gap={1.5}>
              {displayedAreaAlerts.length > 0 ? (
                displayedAreaAlerts.map((item) => {
                  const alertRegion = getAlertRegionName(item);
                  const isTrulyCritical = isTrueCriticalAlert(item);
                  const effectiveSev = isTrulyCritical
                    ? 'CRITICAL'
                    : item.severity === 'CRITICAL'
                    ? 'WARNING'
                    : item.severity || 'INFO';
                  const isCrit = effectiveSev === 'CRITICAL';
                  const isHigh = effectiveSev === 'HIGH';
                  const themeColor = isCrit ? '#ef4444' : isHigh ? '#f97316' : '#0284c7';
                  const isCurrentDistrict = alertMatchesLocation(item, location);
                  const isRead = isAlertRead(item);

                  return (
                    <Box
                      key={item._id || item.id || item.title}
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fafafa',
                        borderLeft: `4px solid ${themeColor}`,
                        transition: 'background 0.15s',
                        '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f5f5f5' }
                      }}
                    >
                      {/* Top row: severity + time */}
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.8}>
                        <Box display="flex" alignItems="center" gap={0.8}>
                          <Typography variant="caption" fontWeight={800} sx={{ color: themeColor, fontSize: '0.7rem', textTransform: 'uppercase' }}>
                            {effectiveSev}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem' }}>•</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600 }}>
                            {item.hazardType || 'Hazard'}
                          </Typography>
                          {!isRead && (
                            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#ef4444', flexShrink: 0 }} />
                          )}
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, fontSize: '0.7rem' }}>
                          {new Date(item.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>

                      {/* Title */}
                      <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary', mb: 0.5, lineHeight: 1.3, fontSize: '0.88rem' }}>
                        {item.title}
                      </Typography>

                      {/* Description */}
                      <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.5, fontSize: '0.8rem', mb: 1 }}>
                        {item.message || item.description}
                      </Typography>

                      {/* Location + Actions */}
                      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={0.5}>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, fontSize: '0.7rem' }}>
                          📍 {alertRegion}{item.affectedRadius ? ` • ${item.affectedRadius} km radius` : ''}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          {!isRead && (
                            <Button size="small" onClick={() => markAlertAsRead(item)} sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'none', color: '#0284c7', minWidth: 'auto', px: 0.8 }}>
                              Mark read
                            </Button>
                          )}
                          {!isCurrentDistrict && (
                            <Button
                              size="small"
                              onClick={() => { switchLocation(alertRegion.split('(')[0].trim()); setModalOpen(false); }}
                              sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'none', color: 'text.secondary', minWidth: 'auto', px: 0.8 }}
                            >
                              Switch
                            </Button>
                          )}
                          <Button
                            size="small"
                            onClick={() => { setModalOpen(false); navigate('/disaster-map'); }}
                            sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'none', color: themeColor, minWidth: 'auto', px: 0.8 }}
                          >
                            View Map →
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  );
                })
              ) : (
                /* Clean "All Clear" state */
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      bgcolor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    <CheckCircle2 size={28} />
                  </Box>
                  <Typography variant="h6" fontWeight={800} sx={{ color: 'text.primary', mb: 0.5, fontSize: '1rem' }}>
                    All Clear
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    No active alerts in {location?.name || location?.district || 'your area'}.
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    You're safe — we'll notify you if anything changes.
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            /* TAB 1: ALL REGIONS */
            <Box display="flex" flexDirection="column" gap={1.5}>
              {regionalImportantAlerts.length > 0 ? (
                regionalImportantAlerts.map(({ region, alert: item }) => {
                  const isTrulyCritical = isTrueCriticalAlert(item);
                  const isRead = isAlertRead(item);
                  const effectiveSev = isTrulyCritical
                    ? 'CRITICAL'
                    : item.severity === 'CRITICAL'
                    ? 'WARNING'
                    : item.severity || 'INFO';
                  const isCrit = effectiveSev === 'CRITICAL';
                  const isHigh = effectiveSev === 'HIGH';
                  const themeColor = isCrit ? '#ef4444' : isHigh ? '#f97316' : '#0284c7';

                  return (
                    <Box
                      key={item._id || region}
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fafafa',
                        borderLeft: `4px solid ${themeColor}`,
                        transition: 'background 0.15s',
                        '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f5f5f5' }
                      }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.8}>
                        <Box display="flex" alignItems="center" gap={0.8}>
                          <Typography variant="caption" fontWeight={800} sx={{ color: themeColor, fontSize: '0.7rem', textTransform: 'uppercase' }}>
                            {effectiveSev}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem' }}>•</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600 }}>
                            {item.hazardType || 'Hazard'}
                          </Typography>
                          {!isRead && (
                            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#ef4444', flexShrink: 0 }} />
                          )}
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, fontSize: '0.7rem' }}>
                          {new Date(item.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>

                      <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary', mb: 0.5, lineHeight: 1.3, fontSize: '0.88rem' }}>
                        {item.title}
                      </Typography>

                      <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.5, fontSize: '0.8rem', mb: 1 }}>
                        {item.message || item.description}
                      </Typography>

                      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={0.5}>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, fontSize: '0.7rem' }}>
                          📍 {region}{item.affectedRadius ? ` • ${item.affectedRadius} km radius` : ''}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          {!isRead && (
                            <Button size="small" onClick={() => markAlertAsRead(item)} sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'none', color: '#0284c7', minWidth: 'auto', px: 0.8 }}>
                              Mark read
                            </Button>
                          )}
                          <Button
                            size="small"
                            onClick={() => { switchLocation(region.split('(')[0].trim()); setModalOpen(false); }}
                            sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'none', color: 'text.secondary', minWidth: 'auto', px: 0.8 }}
                          >
                            Switch
                          </Button>
                          <Button
                            size="small"
                            onClick={() => { setModalOpen(false); navigate('/disaster-map'); }}
                            sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'none', color: themeColor, minWidth: 'auto', px: 0.8 }}
                          >
                            View Map →
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  );
                })
              ) : (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      bgcolor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    <CheckCircle2 size={28} />
                  </Box>
                  <Typography variant="h6" fontWeight={800} sx={{ color: 'text.primary', mb: 0.5, fontSize: '1rem' }}>
                    All Regions Clear
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    No active alerts across all monitored regions nationwide.
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        {/* Simple Footer */}
        <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
            NDRF: <strong>1070</strong> • Police: <strong>112</strong> • Relief: <strong>1077</strong>
          </Typography>
          <Button
            size="small"
            onClick={handleAcknowledgeAndSilence}
            sx={{
              fontSize: '0.78rem',
              fontWeight: 700,
              textTransform: 'none',
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' }
            }}
          >
            Close
          </Button>
        </Box>
      </Dialog>
    </>
  );
}
