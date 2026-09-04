import React, { useEffect, useState, useRef } from 'react';
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
  IconButton
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
  BellRing
} from 'lucide-react';
import { getAlerts, dispatchEmergencyAlert } from '../services/api';
import { playEmergencySiren, stopEmergencySiren, isSirenActive } from '../utils/emergencyAudio';
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
  const { location } = useLocationContext();
  const { isDark } = useThemeMode();
  const [activeCriticalAlert, setActiveCriticalAlert] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sirenPlaying, setSirenPlaying] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const lastSoundedAlertIdRef = useRef(null);

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

        // Find active CRITICAL or HIGH alert matching user's current district
        const critical = alertsList.find((a) => {
          const isCriticalSeverity = a.severity === 'CRITICAL' || a.severity === 'HIGH';
          const isCurrentActive = a.isActive !== false;
          const matches = alertMatchesLocation(a, location);
          return isCriticalSeverity && isCurrentActive && matches;
        });

        if (!isMounted) return;

        if (critical) {
          const alertId = critical._id || critical.id || critical.title;

          // Check if acknowledged in this browser session
          let acknowledgedIds = [];
          try {
            acknowledgedIds = JSON.parse(sessionStorage.getItem(ACKNOWLEDGED_ALERTS_KEY) || '[]');
          } catch {}

          const isAcknowledged = acknowledgedIds.includes(alertId);

          setActiveCriticalAlert(critical);

          // If not acknowledged and not yet sounded for this specific alert
          if (!isAcknowledged && lastSoundedAlertIdRef.current !== alertId) {
            lastSoundedAlertIdRef.current = alertId;

            // 1. Play Emergency Siren automatically
            if (notifConfig.audioSiren !== false) {
              playEmergencySiren(16000);
              setSirenPlaying(true);
            }

            // 2. Trigger native OS / browser notification automatically
            const alertTitle = critical.title || 'Critical Disaster Alert';
            const alertDesc = critical.message || critical.description || `Immediate emergency action required in ${location?.district || 'your district'}.`;

            triggerDisasterNotification({
              title: alertTitle,
              body: alertDesc,
              sound: false // Siren handles audio
            });

            // 3. Dispatch automated emergency email alert if enabled
            if (notifConfig.emailAlerts !== false) {
              const user = getCurrentUser();
              if (user?.email) {
                dispatchEmergencyAlert({
                  recipientEmail: user.email,
                  recipientName: user.name || 'Citizen User',
                  title: alertTitle,
                  hazardType: critical.hazardType || 'FLOOD',
                  severity: critical.severity || 'CRITICAL',
                  district: location?.district || 'Active Zone',
                  state: location?.state || 'India',
                  instructions: alertDesc
                }).catch(() => {});
              }
            }

            // 4. Automatically present emergency advisory modal & banner
            setModalOpen(true);
            setBannerDismissed(false);
          }
        } else {
          setActiveCriticalAlert(null);
          // If no critical alert exists for this area, silence any active siren
          if (isSirenActive()) {
            stopEmergencySiren();
            setSirenPlaying(false);
          }
        }
      } catch (err) {
        console.warn('[Emergency Sentinel] Alert polling check:', err.message);
      }
    };

    // Execute immediately on mount or whenever district changes
    checkEmergencyAlerts();

    // Check continuously every 20 seconds
    const interval = setInterval(checkEmergencyAlerts, 20000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [location?.district, location?.name]);

  const handleAcknowledgeAndSilence = () => {
    stopEmergencySiren();
    setSirenPlaying(false);
    setModalOpen(false);

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
    playEmergencySiren(16000);
    setSirenPlaying(true);
  };

  if (!activeCriticalAlert) return null;

  const alertMessage = activeCriticalAlert.message || activeCriticalAlert.description ||
    `Severe hydrological / disaster threshold breached in ${location?.district || 'your active telemetry zone'}. Immediate precautionary action recommended.`;

  return (
    <>
      {/* 1. TOP PULSING EMERGENCY BANNER */}
      {!bannerDismissed && (
        <Box
          sx={{
            mb: 2.5,
            p: 1.5,
            px: 2.5,
            borderRadius: 3,
            bgcolor: '#dc2626',
            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
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
                🚨 CRITICAL EMERGENCY ACTIVE: {activeCriticalAlert.title || 'Disaster Warning'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.95)', display: 'block', fontWeight: 600 }}>
                Jurisdiction: <strong>{location?.name || location?.district || 'Your District'}</strong> • Automatic acoustic siren & emergency alerts active.
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
                Sound Siren
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
              View Protocols & Shelters
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

      {/* 2. CRITICAL DISASTER ADVISORY MODAL */}
      <Dialog
        open={modalOpen}
        onClose={handleAcknowledgeAndSilence}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3.5,
            p: 1.5,
            border: '2px solid #ef4444',
            boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.45)',
            bgcolor: isDark ? '#0f172a' : '#ffffff'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  bgcolor: 'rgba(239, 68, 68, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444'
                }}
              >
                <AlertTriangle size={26} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={900} sx={{ color: '#ef4444', lineHeight: 1.2 }}>
                  CRITICAL DISASTER WARNING
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                  PRIORITY LEVEL 5 • IMMEDIATE PRECAUTIONARY ADVISORY
                </Typography>
              </Box>
            </Box>
            <Chip
              label="AUTOMATIC SENTINEL ACTIVE"
              size="small"
              sx={{
                bgcolor: '#ef4444',
                color: '#fff',
                fontWeight: 900,
                fontSize: '0.68rem'
              }}
            />
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 1.5 }}>
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, fontWeight: 600 }}>
            {alertMessage}
          </Alert>

          <Box sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: '1px solid var(--border-color)', mb: 2 }}>
            <Typography variant="caption" fontWeight={800} sx={{ color: 'text.secondary', textTransform: 'uppercase' }}>
              Designated Safe Evacuation Shelters
            </Typography>
            <Box mt={1} display="flex" flexDirection="column" gap={1}>
              <Box>
                <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
                  📍 Central Relief Camp #4 (District Sports Complex)
                </Typography>
                <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>
                  ✓ 850 Intake Capacity Ready • Medical Aid & Drinking Water Active
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
                  📍 Community Emergency Shelter #1 (Govt Senior Secondary School)
                </Typography>
                <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>
                  ✓ 400 Intake Capacity Ready • Power Backup Online
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? 'rgba(2, 132, 199, 0.1)' : '#f0f9ff', border: '1px dashed #0284c7', textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 700 }}>
              National Disaster Helplines: NDRF: <strong>1070</strong> | Police/Emergency: <strong>112</strong> | State Control: <strong>1077</strong>
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, pt: 0, gap: 1.5 }}>
          {sirenPlaying ? (
            <Button
              variant="outlined"
              color="error"
              startIcon={<VolumeX size={16} />}
              onClick={handleSilenceOnly}
              sx={{ fontWeight: 700, borderRadius: 2, textTransform: 'none' }}
            >
              Silence Siren
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<Volume2 size={16} />}
              onClick={handleReTriggerAlarm}
              sx={{ fontWeight: 700, borderRadius: 2, textTransform: 'none' }}
            >
              Play Siren
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
            Acknowledge & Dismiss
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
