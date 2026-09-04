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
  Radio
} from 'lucide-react';
import { getAlerts, dispatchEmergencyAlert } from '../services/api';
import { playEmergencySiren, stopEmergencySiren, isSirenActive } from '../utils/emergencyAudio';
import { triggerDisasterNotification } from '../utils/emergencyNotification';
import { useLocationContext } from '../context/LocationContext';
import { useThemeMode } from '../context/ThemeContext';
import { getCurrentUser } from '../lib/auth';

const NOTIFICATIONS_STORAGE_KEY = 'aapdanetra_notifications_config';
const ACKNOWLEDGED_ALERTS_KEY = 'an_acknowledged_critical_alerts';

export default function EmergencyAlertSentinel() {
  const { location } = useLocationContext();
  const { isDark } = useThemeMode();
  const [activeCriticalAlert, setActiveCriticalAlert] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sirenPlaying, setSirenPlaying] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const autoAlarmTriggeredRef = useRef(false);

  // Poll alerts and automatically trigger alarm when a critical emergency occurs
  useEffect(() => {
    let isMounted = true;

    const checkEmergencyAlerts = async () => {
      try {
        // Read user notification preferences
        let notifConfig = { severityThreshold: 70, audioSiren: true, emailAlerts: true };
        try {
          const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
          if (saved) notifConfig = JSON.parse(saved);
        } catch {}

        const res = await getAlerts();
        const alertsList = res.data?.data || [];

        // Find critical alerts matching user's active district or general critical status
        const critical = alertsList.find((a) => {
          const isCriticalSeverity = a.severity === 'CRITICAL' || a.severity === 'HIGH';
          const alertDist = (typeof a.location === 'string' ? a.location : a.location?.name || '').toLowerCase();
          const currentDist = (location?.district || 'Delhi').toLowerCase();
          const matchesLocation = !alertDist || alertDist.includes(currentDist) || currentDist.includes(alertDist);
          return isCriticalSeverity && matchesLocation && a.isActive !== false;
        });

        if (!isMounted) return;

        if (critical) {
          // Check if this alert was already acknowledged by the user in this browser session
          let acknowledgedIds = [];
          try {
            acknowledgedIds = JSON.parse(sessionStorage.getItem(ACKNOWLEDGED_ALERTS_KEY) || '[]');
          } catch {}

          const isNewAlert = !acknowledgedIds.includes(critical._id || critical.id || critical.title);

          setActiveCriticalAlert(critical);

          // AUTOMATIC ALARM EXECUTION
          if (isNewAlert && !autoAlarmTriggeredRef.current) {
            autoAlarmTriggeredRef.current = true;

            // 1. Play Civil Defense Acoustic Disaster Siren automatically
            if (notifConfig.audioSiren !== false) {
              const started = playEmergencySiren(15000);
              if (started) setSirenPlaying(true);
            }

            // 2. Trigger native OS / browser notification automatically
            const alertTitle = critical.title || 'Critical Disaster Alert';
            const alertDesc = critical.description || `Immediate precautionary action required in ${location?.district || 'your area'}.`;

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
                  severity: 'CRITICAL',
                  district: location?.district || 'Delhi NCR',
                  state: location?.state || 'Delhi',
                  instructions: alertDesc
                }).catch(() => {});
              }
            }

            // 4. Automatically open emergency warning modal
            setModalOpen(true);
            setBannerDismissed(false);
          }
        } else {
          setActiveCriticalAlert(null);
        }
      } catch (err) {
        console.warn('[Emergency Sentinel] Polling check:', err.message);
      }
    };

    // Immediate check
    checkEmergencyAlerts();

    // Check continuously every 25 seconds
    const interval = setInterval(checkEmergencyAlerts, 25000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [location?.district]);

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

  if (!activeCriticalAlert) return null;

  return (
    <>
      {/* 1. TOP FLASHING EMERGENCY BANNER */}
      {!bannerDismissed && (
        <Box
          sx={{
            mb: 2.5,
            p: 1.5,
            px: 2.5,
            borderRadius: 3,
            bgcolor: 'rgba(239, 68, 68, 0.92)',
            backdropFilter: 'blur(10px)',
            color: '#ffffff',
            boxShadow: '0 10px 30px rgba(239, 68, 68, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
            border: '1px solid rgba(255, 255, 255, 0.25)',
            animation: 'pulse 2s infinite'
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: '#ffffff',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900
              }}
            >
              <AlertTriangle size={18} />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={800} sx={{ letterSpacing: '0.02em', color: '#fff' }}>
                🚨 CRITICAL EMERGENCY ACTIVE: {activeCriticalAlert.title || 'Disaster Surge Warning'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.9)', display: 'block' }}>
                Region: <strong>{location?.name || 'Your District'}</strong> • Automatic acoustic siren & emergency alerts active.
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
                  color: '#ef4444',
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
              View Shelters & Protocols
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
            {activeCriticalAlert.description ||
              `Severe flood / disaster threshold breached in ${location?.district || 'your active telemetry zone'}. Immediate evacuation advisory is currently in effect.`}
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
          {sirenPlaying && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<VolumeX size={16} />}
              onClick={handleSilenceOnly}
              sx={{ fontWeight: 700, borderRadius: 2, textTransform: 'none' }}
            >
              Silence Siren
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
