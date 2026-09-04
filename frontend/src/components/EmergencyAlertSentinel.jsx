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
  Divider
} from '@mui/material';
import {
  AlertTriangle,
  Volume2,
  VolumeX,
  ShieldAlert,
  X,
  MapPin,
  ExternalLink,
  Radio,
  BellRing,
  PhoneCall,
  Activity,
  CheckCircle2,
  Eye,
  ShieldCheck,
  ChevronRight,
  Layers,
  Flame,
  Waves
} from 'lucide-react';
import { getAlerts, dispatchEmergencyAlert } from '../services/api';
import { playEmergencySiren, stopEmergencySiren, isSirenActive, playEmergencyChirp } from '../utils/emergencyAudio';
import { triggerDisasterNotification } from '../utils/emergencyNotification';
import { useLocationContext } from '../context/LocationContext';
import { useThemeMode } from '../context/ThemeContext';
import { getCurrentUser } from '../lib/auth';

const NOTIFICATIONS_STORAGE_KEY = 'aapdanetra_notifications_config';
const ACKNOWLEDGED_ALERTS_KEY = 'an_acknowledged_critical_alerts';

// Haversine distance in kilometers
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Geospatial and text intelligence matcher
function alertMatchesLocation(alert, userLoc) {
  if (!userLoc) return true;

  const alertDistrict = (alert.district || '').trim().toLowerCase();
  const alertTitle = (alert.title || '').toLowerCase();
  const alertMsg = (alert.message || alert.description || '').toLowerCase();

  const userDistrict = (userLoc.district || '').trim().toLowerCase();
  const userName = (userLoc.name || '').toLowerCase();

  // 1. Direct district match
  if (alertDistrict && userDistrict && (alertDistrict.includes(userDistrict) || userDistrict.includes(alertDistrict))) {
    return true;
  }

  // 2. Title & Message keyword inspection
  if (userDistrict && (alertTitle.includes(userDistrict) || alertMsg.includes(userDistrict))) {
    return true;
  }

  // Regional aliases (e.g. Bhopal, Delhi/Yamuna, Noida/Hindon, Mumbai, Dehradun)
  if ((userDistrict.includes('delhi') || userName.includes('delhi')) &&
      (alertTitle.includes('delhi') || alertTitle.includes('yamuna') || alertMsg.includes('delhi') || alertMsg.includes('yamuna'))) {
    return true;
  }
  if ((userDistrict.includes('noida') || userDistrict.includes('gautam buddha') || userName.includes('noida')) &&
      (alertTitle.includes('noida') || alertTitle.includes('hindon') || alertMsg.includes('noida') || alertMsg.includes('hindon'))) {
    return true;
  }
  if ((userDistrict.includes('bhopal') || userName.includes('bhopal')) &&
      (alertTitle.includes('bhopal') || alertMsg.includes('bhopal'))) {
    return true;
  }
  if ((userDistrict.includes('mumbai') || userName.includes('mumbai')) &&
      (alertTitle.includes('mumbai') || alertMsg.includes('mumbai'))) {
    return true;
  }
  if ((userDistrict.includes('dehradun') || userName.includes('dehradun')) &&
      (alertTitle.includes('dehradun') || alertMsg.includes('dehradun'))) {
    return true;
  }

  // 3. Coordinate distance check
  if (userLoc.lat && userLoc.lng && alert.location?.coordinates && alert.location.coordinates.length === 2) {
    const [alertLng, alertLat] = alert.location.coordinates;
    const dist = getDistanceKm(userLoc.lat, userLoc.lng, alertLat, alertLng);
    const radius = alert.affectedRadius || 35; // default 35 km
    if (dist <= radius) {
      return true;
    }
  }

  return false;
}

export default function EmergencyAlertSentinel() {
  const navigate = useNavigate();
  const { location } = useLocationContext();
  const { isDark } = useThemeMode();

  const [alerts, setAlerts] = useState([]);
  const [activeCriticalAlert, setActiveCriticalAlert] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toastPopupOpen, setToastPopupOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [sirenPlaying, setSirenPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: All, 1: Critical, 2: My District

  const lastSoundedAlertIdRef = useRef(null);
  const currentUser = getCurrentUser() || {};
  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'ADMINISTRATOR';

  // Listen for global navbar Bell click to open the notification alert popup
  useEffect(() => {
    const handleOpenPopup = () => {
      setModalOpen(true);
    };

    window.addEventListener('open-notifications-popup', handleOpenPopup);
    return () => {
      window.removeEventListener('open-notifications-popup', handleOpenPopup);
    };
  }, []);

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

  // Poll alerts and automatically trigger alarm when a critical emergency occurs
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

        // Find relevant critical or high alert
        // For Admin: alerts matching location OR any CRITICAL alert in system
        // For Citizen: alerts matching active district
        const matchingCritical = alertsList.find((a) => {
          const isCriticalSeverity = a.severity === 'CRITICAL' || a.severity === 'HIGH';
          const isCurrentActive = a.isActive !== false;
          const matches = alertMatchesLocation(a, location);
          return isCriticalSeverity && isCurrentActive && (matches || (isAdmin && a.severity === 'CRITICAL'));
        });

        if (matchingCritical) {
          const alertId = matchingCritical._id || matchingCritical.id || matchingCritical.title;

          let acknowledgedIds = [];
          try {
            acknowledgedIds = JSON.parse(sessionStorage.getItem(ACKNOWLEDGED_ALERTS_KEY) || '[]');
          } catch {}

          const isAcknowledged = acknowledgedIds.includes(alertId);
          setActiveCriticalAlert(matchingCritical);

          // Show floating Alert Popup Toast
          if (!isAcknowledged) {
            setToastPopupOpen(true);
          }

          // Automated audio siren & modal on new unacknowledged critical alert
          if (!isAcknowledged && lastSoundedAlertIdRef.current !== alertId) {
            lastSoundedAlertIdRef.current = alertId;

            // 1. Play Emergency Siren automatically for 7 SECONDS ONLY on CRITICAL severity alerts
            if (notifConfig.audioSiren !== false && matchingCritical.severity === 'CRITICAL') {
              playEmergencySiren(7000);
              setSirenPlaying(true);
            }

            // 2. Trigger native OS / browser notification
            const alertTitle = matchingCritical.title || 'Critical Disaster Alert';
            const alertDesc =
              matchingCritical.message ||
              matchingCritical.description ||
              `Immediate emergency action required in ${location?.district || 'your district'}.`;

            triggerDisasterNotification({
              title: alertTitle,
              body: alertDesc,
              sound: false
            });

            // 3. Dispatch automated emergency email alert if enabled
            if (notifConfig.emailAlerts !== false) {
              const user = getCurrentUser();
              if (user?.email) {
                dispatchEmergencyAlert({
                  recipientEmail: user.email,
                  recipientName: user.name || (isAdmin ? 'Disaster Operations Admin' : 'Citizen Resident'),
                  title: alertTitle,
                  hazardType: matchingCritical.hazardType || 'FLOOD',
                  severity: matchingCritical.severity || 'CRITICAL',
                  district: location?.district || 'Active Monitored Zone',
                  state: location?.state || 'India',
                  instructions: alertDesc
                }).catch(() => {});
              }
            }

            // 4. Automatically present the full alert advisory modal
            setModalOpen(true);
            setBannerDismissed(false);
          }
        } else {
          setActiveCriticalAlert(null);
          if (isSirenActive()) {
            stopEmergencySiren();
            setSirenPlaying(false);
          }
        }
      } catch (err) {
        console.warn('[Emergency Sentinel] Alert polling check:', err.message);
      }
    };

    checkEmergencyAlerts();
    const interval = setInterval(checkEmergencyAlerts, 20000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [location?.district, location?.name, isAdmin]);

  const handleAcknowledgeAndSilence = () => {
    stopEmergencySiren();
    setSirenPlaying(false);
    setModalOpen(false);
    setToastPopupOpen(false);

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

  const handleReTriggerAlarm = () => {
    playEmergencySiren(7000);
    setSirenPlaying(true);
  };

  // Filtered alerts for the Modal
  const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL' || a.severity === 'HIGH');
  const districtAlerts = alerts.filter((a) => alertMatchesLocation(a, location));

  let displayAlerts = alerts;
  if (activeTab === 1) displayAlerts = criticalAlerts;
  if (activeTab === 2) displayAlerts = districtAlerts;

  const currentAlert = activeCriticalAlert || alerts[0];

  return (
    <>
      {/* 1. TOP FLASHING EMERGENCY BANNER (Active when Critical Alert exists in current district) */}
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
                {isAdmin ? '🛡️ [ADMIN DISPATCH] CRITICAL EMERGENCY ACTIVE: ' : '🚨 [CITIZEN WARNING] CRITICAL DISASTER ALERT: '}
                {activeCriticalAlert.title || 'Disaster Warning'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.95)', display: 'block', fontWeight: 600 }}>
                Jurisdiction: <strong>{location?.name || location?.district || 'Active Zone'}</strong> • Acoustic disaster siren & automated advisories active.
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
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  borderRadius: 2,
                  '&:hover': { bgcolor: '#fef2f2' }
                }}
              >
                Mute Siren
              </Button>
            ) : (
              <Button
                size="small"
                variant="contained"
                onClick={handleReTriggerAlarm}
                startIcon={<Volume2 size={15} />}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.4)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' }
                }}
              >
                Sound Siren (7s)
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

      {/* 2. REAL-TIME FLOATING ALERT POPUP TOAST (Top-Right Floating Alert Popup for both User and Admin) */}
      {toastPopupOpen && activeCriticalAlert && (
        <Box
          sx={{
            position: 'fixed',
            top: 76,
            right: 20,
            zIndex: 9999,
            width: { xs: 'calc(100vw - 40px)', sm: 390 },
            bgcolor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(16px)',
            border: '2px solid #ef4444',
            borderRadius: 3.5,
            boxShadow: '0 20px 40px rgba(239, 68, 68, 0.35)',
            p: 2,
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            animation: 'slideInRight 0.4s ease-out'
          }}
        >
          <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1.5} mb={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  bgcolor: 'rgba(239, 68, 68, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444'
                }}
              >
                <AlertTriangle size={18} />
              </Box>
              <Box>
                <Chip
                  label={isAdmin ? 'ADMIN DISPATCH POPUP' : 'CITIZEN EMERGENCY POPUP'}
                  size="small"
                  sx={{
                    bgcolor: '#ef4444',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '0.65rem',
                    height: 20
                  }}
                />
              </Box>
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
            {activeCriticalAlert.title || 'Immediate Disaster Advisory'}
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
            {activeCriticalAlert.message || activeCriticalAlert.description || 'Precautionary action recommended in your monitored jurisdiction.'}
          </Typography>

          <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} pt={1} borderTop="1px solid var(--border-color)">
            <Box display="flex" alignItems="center" gap={1}>
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
            </Box>

            <Button
              size="small"
              variant="contained"
              onClick={() => {
                setToastPopupOpen(false);
                setModalOpen(true);
              }}
              endIcon={<ChevronRight size={14} />}
              sx={{
                bgcolor: '#ef4444',
                color: '#ffffff',
                fontSize: '0.72rem',
                fontWeight: 800,
                textTransform: 'none',
                py: 0.4,
                px: 1.5,
                borderRadius: 2,
                '&:hover': { bgcolor: '#dc2626' }
              }}
            >
              Open Full Popup
            </Button>
          </Box>
        </Box>
      )}

      {/* 3. FULL NOTIFICATION & EMERGENCY ALERT CENTER POPUP MODAL (Both User and Admin) */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            border: '2px solid',
            borderColor: activeCriticalAlert ? '#ef4444' : 'var(--border-color)',
            boxShadow: activeCriticalAlert
              ? '0 25px 60px -15px rgba(239, 68, 68, 0.45)'
              : '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            bgcolor: isDark ? '#0f172a' : '#ffffff',
            backgroundImage: 'none',
            overflow: 'hidden'
          }
        }}
      >
        {/* Modal Header */}
        <DialogTitle sx={{ p: 2.5, pb: 1.5 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 3,
                  bgcolor: activeCriticalAlert ? 'rgba(239, 68, 68, 0.15)' : 'rgba(2, 132, 199, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: activeCriticalAlert ? '#ef4444' : '#0284c7'
                }}
              >
                {activeCriticalAlert ? <AlertTriangle size={24} /> : <BellRing size={24} />}
              </Box>
              <Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6" fontWeight={900} sx={{ color: 'text.primary', lineHeight: 1.2 }}>
                    Emergency Notifications & Alert Center
                  </Typography>
                  <Chip
                    label={isAdmin ? 'ADMIN COMMAND' : 'CITIZEN PORTAL'}
                    size="small"
                    sx={{
                      bgcolor: isAdmin ? '#8b5cf6' : '#0284c7',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '0.68rem',
                      height: 22
                    }}
                  />
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  {isAdmin
                    ? `System Administrator Console • All 9 Jurisdictions Monitored • Active: ${location?.name || 'All Zones'}`
                    : `Citizen Safety Telemetry • Monitoring: ${location?.name || 'Local District'}`}
                </Typography>
              </Box>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              {sirenPlaying ? (
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
              ) : (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleReTriggerAlarm}
                  startIcon={<Volume2 size={15} />}
                  sx={{ fontWeight: 800, textTransform: 'none', borderRadius: 2 }}
                >
                  Test Alarm Siren (7s)
                </Button>
              )}

              <IconButton onClick={() => setModalOpen(false)} sx={{ color: 'text.secondary' }}>
                <X size={20} />
              </IconButton>
            </Box>
          </Box>

          {/* Filter Tabs */}
          <Box sx={{ mt: 2, borderBottom: '1px solid var(--border-color)' }}>
            <Tabs
              value={activeTab}
              onChange={(e, val) => setActiveTab(val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 38,
                '& .MuiTab-root': {
                  minHeight: 38,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  py: 0.5,
                  px: 1.8
                }
              }}
            >
              <Tab label={`All Notifications (${alerts.length})`} />
              <Tab label={`Critical / High Warnings (${criticalAlerts.length})`} />
              <Tab label={`My District (${districtAlerts.length})`} />
            </Tabs>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5, pt: 1.5, maxHeight: '60vh', overflowY: 'auto' }}>
          {/* Active Alert Banner Details */}
          {activeCriticalAlert && (
            <Alert
              severity="error"
              icon={<AlertTriangle size={20} />}
              sx={{
                mb: 2.5,
                borderRadius: 2.5,
                fontWeight: 600,
                border: '1px solid rgba(239, 68, 68, 0.4)'
              }}
            >
              <Typography variant="subtitle2" fontWeight={800} color="error.main">
                {activeCriticalAlert.title}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {activeCriticalAlert.message || activeCriticalAlert.description}
              </Typography>
            </Alert>
          )}

          {/* ROLE-SPECIFIC ACTION CARDS */}
          {isAdmin ? (
            /* ADMIN VIEW: Incident metrics, verified status, and operations shortcuts */
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: isDark ? 'rgba(139, 92, 246, 0.08)' : '#f5f3ff',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                mb: 2.5
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} mb={1.5}>
                <Box display="flex" alignItems="center" gap={1}>
                  <ShieldCheck size={18} color="#8b5cf6" />
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#8b5cf6' }}>
                    ADMINISTRATOR COMMAND SHORTCUTS
                  </Typography>
                </Box>
                <Chip
                  label="AUTHORIZED: DISASTER OPS DISPATCH"
                  size="small"
                  sx={{ bgcolor: '#8b5cf6', color: '#fff', fontWeight: 800, fontSize: '0.65rem' }}
                />
              </Box>

              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
                As an Administrator, you possess live jurisdiction telemetry across all 9 disaster-sensitive zones. Review citizen SOS reports, dispatch field alerts, or assess evacuation shelter capacity.
              </Typography>

              <Box display="flex" flexWrap="wrap" gap={1}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => {
                    setModalOpen(false);
                    navigate('/citizen-reports');
                  }}
                  startIcon={<Activity size={15} />}
                  sx={{ bgcolor: '#8b5cf6', color: '#fff', textTransform: 'none', fontWeight: 700, borderRadius: 2, '&:hover': { bgcolor: '#7c3aed' } }}
                >
                  Citizen SOS Reports
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setModalOpen(false);
                    navigate('/disaster-map');
                  }}
                  startIcon={<MapPin size={15} />}
                  sx={{ borderColor: '#8b5cf6', color: '#8b5cf6', textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                >
                  Geospatial Threat Map
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setModalOpen(false);
                    navigate('/relocation-plan');
                  }}
                  startIcon={<Layers size={15} />}
                  sx={{ borderColor: '#8b5cf6', color: '#8b5cf6', textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                >
                  Shelter Relocation Center
                </Button>
              </Box>
            </Box>
          ) : (
            /* CITIZEN VIEW: Shelters, Helpline Hotlines, and Safety Protocols */
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: isDark ? 'rgba(2, 132, 199, 0.08)' : '#f0f9ff',
                border: '1px solid rgba(2, 132, 199, 0.25)',
                mb: 2.5
              }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <ShieldAlert size={18} color="#0284c7" />
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#0284c7' }}>
                  CITIZEN EVACUATION & SAFETY PROTOCOLS
                </Typography>
              </Box>

              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
                Immediate precautionary steps for residents in <strong>{location?.name || 'your region'}</strong>:
              </Typography>

              <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={1.5} mb={1.5}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: '1px solid var(--border-color)' }}>
                  <Typography variant="body2" fontWeight={800} sx={{ color: 'text.primary' }}>
                    📍 Central Relief Camp #4
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700, display: 'block' }}>
                    ✓ 850 Capacity • Medical Unit Active
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.muted' }}>
                    District Sports Stadium Complex
                  </Typography>
                </Box>

                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: '1px solid var(--border-color)' }}>
                  <Typography variant="body2" fontWeight={800} sx={{ color: 'text.primary' }}>
                    📍 Community Emergency Shelter #1
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700, display: 'block' }}>
                    ✓ 400 Capacity • Power Backup Ready
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.muted' }}>
                    Govt Senior Secondary School Campus
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" flexWrap="wrap" alignItems="center" gap={1}>
                <Button
                  size="small"
                  variant="outlined"
                  href="tel:1070"
                  startIcon={<PhoneCall size={14} />}
                  sx={{ color: '#ef4444', borderColor: '#ef4444', textTransform: 'none', fontWeight: 800, borderRadius: 2 }}
                >
                  NDRF Control (1070)
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  href="tel:112"
                  startIcon={<PhoneCall size={14} />}
                  sx={{ color: '#0284c7', borderColor: '#0284c7', textTransform: 'none', fontWeight: 800, borderRadius: 2 }}
                >
                  Emergency (112)
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => {
                    setModalOpen(false);
                    navigate('/disaster-map');
                  }}
                  startIcon={<MapPin size={14} />}
                  sx={{ bgcolor: '#0284c7', color: '#fff', textTransform: 'none', fontWeight: 800, borderRadius: 2 }}
                >
                  View Shelters on Map
                </Button>
              </Box>
            </Box>
          )}

          {/* LIST OF NOTIFICATIONS / ALERTS */}
          <Typography variant="subtitle2" fontWeight={800} sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1.5 }}>
            Active System Notifications ({displayAlerts.length})
          </Typography>

          {displayAlerts.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px dashed var(--border-color)' }}>
              <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 8px auto' }} />
              <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
                All Clear • No Active Threats
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                No notifications match the selected filter at this moment.
              </Typography>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={1.5}>
              {displayAlerts.map((alertItem) => {
                const isItemCritical = alertItem.severity === 'CRITICAL';
                const isItemHigh = alertItem.severity === 'HIGH';
                const isItemWarning = alertItem.severity === 'WARNING';
                const isLocal = alertMatchesLocation(alertItem, location);

                let badgeColor = '#0284c7';
                if (isItemCritical) badgeColor = '#ef4444';
                else if (isItemHigh) badgeColor = '#f97316';
                else if (isItemWarning) badgeColor = '#eab308';

                return (
                  <Box
                    key={alertItem._id || alertItem.id}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
                      border: '1px solid',
                      borderColor: isItemCritical ? 'rgba(239, 68, 68, 0.35)' : 'var(--border-color)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9',
                        borderColor: badgeColor
                      }
                    }}
                  >
                    <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1.5} mb={1}>
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        <Chip
                          label={alertItem.severity || 'INFO'}
                          size="small"
                          sx={{
                            bgcolor: badgeColor,
                            color: '#ffffff',
                            fontWeight: 900,
                            fontSize: '0.68rem',
                            height: 22
                          }}
                        />
                        <Chip
                          label={alertItem.hazardType || 'DISASTER'}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22 }}
                        />
                        {isLocal && (
                          <Chip
                            label="YOUR JURISDICTION"
                            size="small"
                            sx={{
                              bgcolor: 'rgba(16, 185, 129, 0.15)',
                              color: '#10b981',
                              fontWeight: 800,
                              fontSize: '0.65rem',
                              height: 22
                            }}
                          />
                        )}
                      </Box>

                      <Typography variant="caption" sx={{ color: 'text.muted', fontWeight: 600 }}>
                        {new Date(alertItem.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>

                    <Typography variant="body2" fontWeight={800} sx={{ color: 'text.primary', mb: 0.5 }}>
                      {alertItem.title}
                    </Typography>

                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5, lineHeight: 1.45 }}>
                      {alertItem.message || alertItem.description}
                    </Typography>

                    {/* Metadata & Quick Action */}
                    <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} pt={1} borderTop="1px solid var(--border-color)">
                      <Box display="flex" alignItems="center" gap={1.5}>
                        {alertItem.location?.coordinates && (
                          <Typography variant="caption" sx={{ color: 'text.muted' }}>
                            📍 Lat: {alertItem.location.coordinates[1]?.toFixed(3)}, Lng: {alertItem.location.coordinates[0]?.toFixed(3)}
                          </Typography>
                        )}
                        {alertItem.affectedRadius && (
                          <Typography variant="caption" sx={{ color: 'text.muted' }}>
                            • Radius: {alertItem.affectedRadius} km
                          </Typography>
                        )}
                      </Box>

                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setModalOpen(false);
                          navigate('/disaster-map');
                        }}
                        startIcon={<Eye size={13} />}
                        sx={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'none',
                          borderRadius: 2,
                          py: 0.3
                        }}
                      >
                        Inspect on Map
                      </Button>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, pt: 1.5, borderTop: '1px solid var(--border-color)', gap: 1.5 }}>
          {sirenPlaying && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<VolumeX size={16} />}
              onClick={handleSilenceOnly}
              sx={{ fontWeight: 700, borderRadius: 2, textTransform: 'none' }}
            >
              Mute Siren
            </Button>
          )}

          <Button
            variant="contained"
            onClick={handleAcknowledgeAndSilence}
            sx={{
              bgcolor: '#0f172a',
              color: '#fff',
              fontWeight: 700,
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              '&:hover': { bgcolor: '#1e293b' }
            }}
          >
            Acknowledge & Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
