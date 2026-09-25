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
  InputAdornment,
  Stack
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
  CheckCheck,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { getAlerts, dispatchEmergencyAlert } from '../services/api';
import { playEmergencySiren, stopEmergencySiren, isSirenActive, unlockAudioContext } from '../utils/emergencyAudio';
import { triggerDisasterNotification } from '../utils/emergencyNotification';
import { useLocationContext } from '../context/LocationContext';
import { useThemeMode } from '../context/ThemeContext';
import { getCurrentUser } from '../lib/auth';
import { alertMatchesLocation, isTrueCriticalAlert, getAlertRegionName } from '../utils/alertMatcher';
import {
  isAlertRead,
  markAlertAsRead,
  markAllAlertsAsRead,
  clearAlertNotification,
  clearAllAlertNotifications,
  isAlertCleared,
  restoreClearedAlertNotifications
} from '../utils/notificationsStore';

const NOTIFICATIONS_STORAGE_KEY = 'aapdanetra_notifications_config';
const ACKNOWLEDGED_ALERTS_KEY = 'an_acknowledged_critical_alerts';

// Clean formatting helpers for emergency banner & toast
function getCleanAlertTitle(rawTitle = '') {
  if (!rawTitle) return 'Active Disaster Emergency';
  return rawTitle
    .replace(/^[🚨⚠️\s]+/, '')
    .replace(/^CRITICAL\s+(FLOOD|EMERGENCY|DISASTER|WARNING|HAZARD)\s*[-—:]*\s*/i, '')
    .replace(/^STATEWIDE\s+CRITICAL\s+FLOOD\s+EMERGENCY\s*[-—:]*\s*/i, '')
    .replace(/^CRITICAL\s*[-—:]*\s*/i, '')
    .trim();
}

function getAlertBasinInfo(alert) {
  if (!alert) return { district: 'Regional', river: 'River Basin' };
  const d = (alert.district || '').trim();
  const district = d ? d.charAt(0).toUpperCase() + d.slice(1) : 'Bihar';

  const text = `${alert.title || ''} ${alert.description || ''} ${alert.message || ''}`.toLowerCase();
  let river = '';
  if (text.includes('kosi')) river = 'Kosi Basin';
  else if (text.includes('ganga')) river = 'Ganga Basin';
  else if (text.includes('bagmati')) river = 'Bagmati Basin';
  else if (text.includes('gandak')) river = 'Gandak Basin';
  else if (text.includes('kamla') || text.includes('balan')) river = 'Kamla-Balan Basin';
  else if (text.includes('yamuna')) river = 'Yamuna Basin';
  else if (text.includes('mandakini')) river = 'Mandakini Basin';
  else river = `${district} River Basin`;

  return { district, river };
}

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
  const [zoneCategory, setZoneCategory] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'RED' | 'AMBER' | 'GREEN' | 'LOCAL'
  const [selectedRegionZone, setSelectedRegionZone] = useState('ALL');
  const [notificationsVersion, setNotificationsVersion] = useState(0);

  // Sync state when notifications are updated (read, cleared, restored)
  useEffect(() => {
    const handleUpdate = () => {
      setNotificationsVersion((v) => v + 1);
    };
    window.addEventListener('notifications-updated', handleUpdate);
    return () => window.removeEventListener('notifications-updated', handleUpdate);
  }, []);

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
        // Timely sync across Navbar and active map cards
        window.dispatchEvent(new CustomEvent('alerts-updated', { detail: alertsList }));

        const currentLocKey = (location?.district || location?.name || '').toLowerCase().trim();

        // 1. MUST strictly match current user's location AND must be CRITICAL situation AND active
        const localCriticalAlert = alertsList.find((a) =>
          a.isActive !== false &&
          isTrueCriticalAlert(a) &&
          alertMatchesLocation(a, location)
        );

        // Local non-critical alerts for current user jurisdiction (HIGH, WARNING, INFO)
        const localNonCriticals = alertsList.filter((a) =>
          a.isActive !== false &&
          !isTrueCriticalAlert(a) &&
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

          const isLiveAlert = (localCriticalAlert.mode === 'LIVE' || (!localCriticalAlert.mode && localCriticalAlert.source === 'OFFICIAL'));
          const isCriticalEmergency = localCriticalAlert.severity === 'CRITICAL' || localCriticalAlert.canonicalSeverity === 'CRITICAL';

          // Strictly sound siren on CRITICAL alerts only
          if (notifConfig.audioSiren !== false && isLiveAlert && isCriticalEmergency) {
            console.log(`[Emergency Sentinel] 🚨 USER LOCATION UNDER LIVE CRITICAL HAZARD ZONE: ${localCriticalAlert.district || currentLocKey}. Siren triggered.`);
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

  // Local alerts for current district
  const rank = { CRITICAL: 4, HIGH: 3, WARNING: 2, INFO: 1 };
  const districtAlerts = alerts
    .filter((a) => a.isActive !== false && alertMatchesLocation(a, location))
    .sort((a, b) => (rank[b.severity] || 0) - (rank[a.severity] || 0));

  const primaryDistrictAlert = districtAlerts[0] || null;
  const secondaryDistrictAlerts = districtAlerts.slice(1, 3);

  // Uncleared active alerts
  const unclearedAlerts = React.useMemo(() => {
    return (alerts || []).filter((a) => a.isActive !== false && !isAlertCleared(a));
  }, [alerts, notificationsVersion]);

  // Cleared alerts count
  const clearedAlertsCount = React.useMemo(() => {
    return (alerts || []).filter((a) => a.isActive !== false && isAlertCleared(a)).length;
  }, [alerts, notificationsVersion]);

  // All recent alerts sorted by creation time (most recent first)
  const recentAlerts = React.useMemo(() => {
    return [...unclearedAlerts].sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [unclearedAlerts]);

  // 1. CRITICAL Zone Alerts (Immediate Danger — #b71c1c)
  const criticalZoneAlerts = React.useMemo(() => {
    return recentAlerts.filter((a) => a.severity === 'CRITICAL' || a.riskCategory === 'CRITICAL' || isTrueCriticalAlert(a));
  }, [recentAlerts]);

  // 2. RED Zone Alerts (High Risk — #ef6c00)
  const redZoneAlerts = React.useMemo(() => {
    return recentAlerts.filter((a) => 
      !isTrueCriticalAlert(a) && 
      a.severity !== 'CRITICAL' && 
      a.riskCategory !== 'CRITICAL' &&
      (a.severity === 'HIGH' || a.riskCategory === 'RED' || a.severity === 'RED')
    );
  }, [recentAlerts]);

  // 3. AMBER Zone Alerts (Moderate — #f9a825)
  const amberZoneAlerts = React.useMemo(() => {
    return recentAlerts.filter((a) => 
      a.severity === 'WARNING' || 
      a.severity === 'MEDIUM' || 
      a.riskCategory === 'AMBER' || 
      a.severity === 'AMBER'
    );
  }, [recentAlerts]);

  // 4. GREEN Zone Alerts (Safe / Advisory — #2e7d32)
  const greenZoneAlerts = React.useMemo(() => {
    return recentAlerts.filter((a) => 
      a.severity === 'INFO' || 
      a.severity === 'LOW' || 
      a.riskCategory === 'GREEN' || 
      a.severity === 'GREEN' || 
      a.severity === 'SAFE'
    );
  }, [recentAlerts]);

  // 5. Local Zone Alerts (Current jurisdiction)
  const localZoneAlerts = React.useMemo(() => {
    return recentAlerts.filter((a) => alertMatchesLocation(a, location));
  }, [recentAlerts, location?.district, location?.name]);

  // Unique Region Zones
  const uniqueRegionZones = React.useMemo(() => {
    const zones = new Set();
    recentAlerts.forEach((a) => {
      const reg = getAlertRegionName(a);
      if (reg) zones.add(reg);
    });
    return Array.from(zones);
  }, [recentAlerts]);

  // Filtered alerts according to chosen Zone Category & Region Zone
  const filteredAlerts = React.useMemo(() => {
    let list = recentAlerts;
    if (zoneCategory === 'CRITICAL') {
      list = criticalZoneAlerts;
    } else if (zoneCategory === 'RED') {
      list = redZoneAlerts;
    } else if (zoneCategory === 'AMBER') {
      list = amberZoneAlerts;
    } else if (zoneCategory === 'GREEN') {
      list = greenZoneAlerts;
    } else if (zoneCategory === 'LOCAL') {
      list = localZoneAlerts;
    }

    if (selectedRegionZone !== 'ALL') {
      list = list.filter((a) => getAlertRegionName(a) === selectedRegionZone);
    }
    return list;
  }, [recentAlerts, zoneCategory, criticalZoneAlerts, redZoneAlerts, amberZoneAlerts, greenZoneAlerts, localZoneAlerts, selectedRegionZone]);

  return (
    <>
      {/* 1. TOP PULSING CRITICAL CIVIL DEFENSE BANNER */}
      {activeCriticalAlert && !bannerDismissed && (() => {
        const { district: alertDist, river: alertRiver } = getAlertBasinInfo(activeCriticalAlert);
        const cleanTitle = getCleanAlertTitle(activeCriticalAlert.title);
        const userSectorName = location?.name || location?.district || 'Regional Sector';
        const isSameSector = (location?.district || '').toLowerCase().trim() === (activeCriticalAlert.district || '').toLowerCase().trim();
        const directive = activeCriticalAlert.instructions || activeCriticalAlert.directive || activeCriticalAlert.message || activeCriticalAlert.description;

        return (
          <Box
            sx={{
              mb: 2.5,
              p: { xs: 2, sm: 2.25 },
              px: { xs: 2, sm: 2.75 },
              borderRadius: 3.5,
              background: 'linear-gradient(135deg, rgba(185, 28, 28, 0.96) 0%, rgba(127, 29, 29, 0.98) 100%)',
              backdropFilter: 'blur(20px)',
              color: '#ffffff',
              boxShadow: '0 14px 40px rgba(185, 28, 28, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
              border: '1px solid rgba(254, 202, 202, 0.35)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Ambient Background Glow Effect */}
            <Box
              sx={{
                position: 'absolute',
                top: -40,
                left: -40,
                width: 140,
                height: 140,
                borderRadius: '50%',
                bgcolor: 'rgba(239, 68, 68, 0.4)',
                filter: 'blur(45px)',
                pointerEvents: 'none',
              }}
            />

            {/* Left Beacon & Threat Intelligence Content */}
            <Box display="flex" alignItems="flex-start" gap={2} sx={{ flex: '1 1 500px', minWidth: 0, zIndex: 1 }}>
              {/* Pulsing Beacon Icon */}
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  bgcolor: '#ffffff',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  flexShrink: 0,
                  boxShadow: '0 0 20px rgba(255, 255, 255, 0.5), 0 4px 12px rgba(0,0,0,0.2)',
                  position: 'relative',
                  mt: 0.25,
                }}
              >
                <AlertTriangle size={24} />
                <Box
                  sx={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 13,
                    height: 13,
                    borderRadius: '50%',
                    bgcolor: '#ef4444',
                    border: '2px solid #ffffff',
                    animation: 'ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite',
                  }}
                />
              </Box>

              {/* Informational Context */}
              <Box sx={{ minWidth: 0, flex: 1 }}>
                {/* Meta Badges Row */}
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={0.75}>
                  <Chip
                    label="🚨 CRITICAL EMERGENCY"
                    size="small"
                    sx={{
                      bgcolor: '#ffffff',
                      color: '#b91c1c',
                      fontWeight: 900,
                      fontSize: '0.65rem',
                      height: 22,
                      letterSpacing: '0.04em',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    }}
                  />
                  <Chip
                    label={`🌊 ${alertRiver} • ${alertDist}`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.18)',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.65rem',
                      height: 22,
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                    }}
                  />
                  <Chip
                    label={isSameSector ? `📍 Local Sector: ${userSectorName}` : `📍 Monitored from: ${userSectorName}`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(0, 0, 0, 0.2)',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '0.63rem',
                      height: 22,
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                    }}
                  />
                </Box>

                {/* Main Clean Alert Title */}
                <Typography
                  variant="subtitle1"
                  fontWeight={900}
                  sx={{
                    color: '#ffffff',
                    lineHeight: 1.35,
                    fontSize: { xs: '0.95rem', sm: '1.05rem' },
                    textShadow: '0 1px 3px rgba(0,0,0,0.35)',
                    mb: 0.5,
                  }}
                >
                  {cleanTitle}
                </Typography>

                {/* Directive / Telemetry Callout */}
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(254, 226, 226, 0.95)',
                    display: 'block',
                    fontWeight: 600,
                    lineHeight: 1.45,
                    fontSize: '0.78rem',
                  }}
                >
                  {directive ? `⚠️ Directive: ${directive}` : 'Continuous CWC river gauge & IMD precipitation telemetry active. Responders standing by.'}
                </Typography>
              </Box>
            </Box>

            {/* Right Action Controls */}
            <Box display="flex" alignItems="center" gap={1.25} sx={{ zIndex: 1, flexShrink: 0 }}>
              {sirenPlaying ? (
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSilenceOnly}
                  startIcon={<VolumeX size={16} />}
                  sx={{
                    bgcolor: '#ffffff',
                    color: '#b91c1c',
                    fontWeight: 900,
                    fontSize: '0.78rem',
                    textTransform: 'none',
                    borderRadius: 2.5,
                    py: 0.75,
                    px: 1.75,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                    '&:hover': { bgcolor: '#fef2f2', transform: 'scale(1.02)' },
                    transition: 'all 0.15s ease',
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
                    borderRadius: 2.5,
                    py: 0.75,
                    px: 1.75,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
                    animation: 'pulse 1.8s infinite',
                    '&:hover': { bgcolor: '#fef2f2', transform: 'scale(1.02)' },
                    transition: 'all 0.15s ease',
                  }}
                >
                  🚨 Siren Active
                </Button>
              )}

              <Button
                size="small"
                variant="outlined"
                onClick={() => setModalOpen(true)}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  borderColor: 'rgba(255, 255, 255, 0.45)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.76rem',
                  textTransform: 'none',
                  borderRadius: 2.5,
                  py: 0.75,
                  px: 1.75,
                  backdropFilter: 'blur(8px)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.25)',
                    borderColor: '#ffffff',
                    transform: 'scale(1.02)',
                  },
                  transition: 'all 0.15s ease',
                }}
              >
                {isAdmin ? 'Command Center' : 'Safety Protocols'}
              </Button>

              <IconButton
                size="small"
                onClick={() => setBannerDismissed(true)}
                sx={{
                  color: '#ffffff',
                  bgcolor: 'rgba(255, 255, 255, 0.12)',
                  borderRadius: 2,
                  p: 0.75,
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' },
                }}
                title="Dismiss top banner"
              >
                <X size={18} />
              </IconButton>
            </Box>
          </Box>
        );
      })()}

      {/* 2. REAL-TIME FLOATING ALERT POPUP TOAST (Shown when banner is not visible or for area advisories) */}
      {toastPopupOpen && activeAreaAlert && !modalOpen && (!activeCriticalAlert || bannerDismissed) && (() => {
        const isCrit = isTrueCriticalAlert(activeAreaAlert);
        const isHigh = activeAreaAlert.severity === 'HIGH' || activeAreaAlert.severity === 'RED';
        const themeColor = isCrit ? '#ef4444' : isHigh ? '#f97316' : '#0284c7';
        const sevLabel = isCrit ? 'CRITICAL EMERGENCY' : isHigh ? 'HIGH WARNING' : 'AREA ADVISORY';
        const { district: alertDist, river: alertRiver } = getAlertBasinInfo(activeAreaAlert);
        const cleanTitle = getCleanAlertTitle(activeAreaAlert.title);
        const areaName = location?.name || location?.district || alertDist;

        return (
          <Box
            sx={{
              position: 'fixed',
              bottom: { xs: 16, sm: 24 },
              right: { xs: 16, sm: 24 },
              zIndex: 9999,
              width: { xs: 'calc(100vw - 32px)', sm: 420 },
              bgcolor: isDark ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              border: `1.5px solid ${themeColor}`,
              borderRadius: 3.5,
              boxShadow: isCrit
                ? '0 20px 48px rgba(239, 68, 68, 0.3), 0 0 0 1px rgba(239, 68, 68, 0.2)'
                : '0 16px 36px rgba(0, 0, 0, 0.2)',
              p: 2.25,
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              animation: 'slideInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Header */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.25}>
              <Box display="flex" alignItems="center" gap={0.75} flexWrap="wrap">
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 1.5,
                    bgcolor: isCrit ? 'rgba(239, 68, 68, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: themeColor,
                  }}
                >
                  <AlertTriangle size={16} />
                </Box>
                <Chip
                  label={sevLabel}
                  size="small"
                  sx={{
                    bgcolor: themeColor,
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '0.62rem',
                    height: 22,
                  }}
                />
                <Chip
                  label={`🌊 ${alertDist} (${alertRiver})`}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                    color: isDark ? '#ffffff' : '#0f172a',
                    fontWeight: 700,
                    fontSize: '0.62rem',
                    height: 22,
                  }}
                />
              </Box>

              <IconButton
                size="small"
                onClick={() => setToastPopupOpen(false)}
                sx={{ color: 'text.secondary', p: 0.5, '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' } }}
              >
                <X size={16} />
              </IconButton>
            </Box>

            {/* Title */}
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: isDark ? '#f8fafc' : '#0f172a', mb: 0.75, lineHeight: 1.35 }}>
              {cleanTitle}
            </Typography>

            {/* Body Message */}
            <Typography
              variant="caption"
              sx={{
                color: isDark ? '#94a3b8' : '#64748b',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                mb: 1.5,
                lineHeight: 1.45,
              }}
            >
              {activeAreaAlert.instructions || activeAreaAlert.message || activeAreaAlert.description}
            </Typography>

            {/* Footer Buttons */}
            <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} pt={1.25} borderTop={isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)'}>
              {isCrit && (
                sirenPlaying ? (
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={handleSilenceOnly}
                    startIcon={<VolumeX size={13} />}
                    sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'none', py: 0.4, px: 1.25, borderRadius: 2 }}
                  >
                    Mute Siren
                  </Button>
                ) : (
                  <Button
                    size="small"
                    variant="contained"
                    color="error"
                    onClick={handlePlaySiren}
                    startIcon={<Volume2 size={13} />}
                    sx={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'none', py: 0.4, px: 1.25, borderRadius: 2 }}
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
                  setZoneCategory('LOCAL');
                  setModalOpen(true);
                }}
                endIcon={<ChevronRight size={14} />}
                sx={{
                  bgcolor: themeColor,
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'none',
                  py: 0.45,
                  px: 1.75,
                  borderRadius: 2,
                  ml: 'auto',
                  '&:hover': { bgcolor: themeColor },
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

          <Box display="flex" alignItems="center" gap={1}>
            {/* Clear All Notifications Button */}
            {recentAlerts.length > 0 && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => clearAllAlertNotifications(recentAlerts)}
                startIcon={<Trash2 size={13} />}
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  py: 0.3,
                  px: 1,
                  borderRadius: 2,
                  borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                  color: 'text.secondary',
                  '&:hover': {
                    borderColor: '#ef4444',
                    color: '#ef4444',
                    bgcolor: 'rgba(239, 68, 68, 0.08)'
                  }
                }}
              >
                Clear All
              </Button>
            )}

            {clearedAlertsCount > 0 && recentAlerts.length === 0 && (
              <Button
                size="small"
                variant="text"
                onClick={restoreClearedAlertNotifications}
                startIcon={<RotateCcw size={13} />}
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  color: '#0284c7',
                  py: 0.3,
                  px: 1
                }}
              >
                Restore ({clearedAlertsCount})
              </Button>
            )}

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

        {/* Zone Category Tabs - Aligned to AapdaNetra Official Risk Legend */}
        <Box sx={{ px: 2.5, mt: 1.5, borderBottom: '1px solid var(--border-color)' }}>
          <Tabs
            value={zoneCategory}
            onChange={(e, val) => setZoneCategory(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 38,
              '& .MuiTab-root': {
                minHeight: 38,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.78rem',
                py: 0.5,
                px: 1.4,
                minWidth: 'auto'
              }
            }}
          >
            <Tab value="ALL" label={`All Zones (${recentAlerts.length})`} />
            <Tab value="CRITICAL" label={`🔴 Critical (${criticalZoneAlerts.length})`} />
            <Tab value="RED" label={`🛑 Red (${redZoneAlerts.length})`} />
            <Tab value="AMBER" label={`🟡 Amber (${amberZoneAlerts.length})`} />
            <Tab value="LOCAL" label={`📍 Local (${localZoneAlerts.length})`} />
            {greenZoneAlerts.length > 0 && (
              <Tab value="GREEN" label={`🟢 Green (${greenZoneAlerts.length})`} />
            )}
          </Tabs>
        </Box>

        {/* Region Zone Quick Filter Chips (if multiple region zones exist) */}
        {uniqueRegionZones.length > 1 && (
          <Box sx={{ px: 2.5, pt: 1.2, pb: 0.2, display: 'flex', alignItems: 'center', gap: 0.8, overflowX: 'auto' }}>
            <Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.secondary', flexShrink: 0 }}>
              REGION:
            </Typography>
            <Chip
              label="All Regions"
              size="small"
              onClick={() => setSelectedRegionZone('ALL')}
              variant={selectedRegionZone === 'ALL' ? 'filled' : 'outlined'}
              sx={{
                fontSize: '0.7rem',
                fontWeight: 700,
                height: 22,
                cursor: 'pointer',
                bgcolor: selectedRegionZone === 'ALL' ? '#0284c7' : 'transparent',
                color: selectedRegionZone === 'ALL' ? '#fff' : 'text.secondary'
              }}
            />
            {uniqueRegionZones.map((reg) => (
              <Chip
                key={reg}
                label={reg}
                size="small"
                onClick={() => setSelectedRegionZone(reg === selectedRegionZone ? 'ALL' : reg)}
                variant={selectedRegionZone === reg ? 'filled' : 'outlined'}
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  height: 22,
                  cursor: 'pointer',
                  bgcolor: selectedRegionZone === reg ? '#0284c7' : 'transparent',
                  color: selectedRegionZone === reg ? '#fff' : 'text.secondary'
                }}
              />
            ))}
          </Box>
        )}

        <DialogContent sx={{ p: 2.5, pt: 1.5, maxHeight: '55vh', overflowY: 'auto' }}>
          <Box display="flex" flexDirection="column" gap={1.5}>
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((item) => {
                const alertRegion = getAlertRegionName(item);
                const isTrulyCritical = isTrueCriticalAlert(item);
                
                // Determine risk category according to AapdaNetra Risk Legend
                let riskCategoryKey = 'GREEN';
                let themeColor = '#2e7d32';
                let zoneBadge = 'GREEN ZONE';
                let zoneBadgeBg = 'rgba(46, 125, 50, 0.12)';

                if (isTrulyCritical || item.severity === 'CRITICAL' || item.riskCategory === 'CRITICAL') {
                  riskCategoryKey = 'CRITICAL';
                  themeColor = '#b71c1c';
                  zoneBadge = 'CRITICAL ZONE';
                  zoneBadgeBg = 'rgba(183, 28, 28, 0.12)';
                } else if (item.severity === 'HIGH' || item.riskCategory === 'RED' || item.severity === 'RED') {
                  riskCategoryKey = 'RED';
                  themeColor = '#ef6c00';
                  zoneBadge = 'RED ZONE';
                  zoneBadgeBg = 'rgba(239, 108, 0, 0.12)';
                } else if (item.severity === 'WARNING' || item.severity === 'MEDIUM' || item.riskCategory === 'AMBER' || item.severity === 'AMBER') {
                  riskCategoryKey = 'AMBER';
                  themeColor = '#f9a825';
                  zoneBadge = 'AMBER ZONE';
                  zoneBadgeBg = 'rgba(249, 168, 37, 0.14)';
                }

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
                      border: '1px solid',
                      borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                      borderLeftColor: `${themeColor} !important`,
                      transition: 'background 0.15s',
                      '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f5f5f5' }
                    }}
                  >
                    {/* Top row: Zone Badge + Severity + Hazard + Time */}
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.8} flexWrap="wrap" gap={0.5}>
                      <Box display="flex" alignItems="center" gap={0.8} flexWrap="wrap">
                        <Box
                          sx={{
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            color: themeColor,
                            bgcolor: zoneBadgeBg,
                            px: 0.8,
                            py: 0.2,
                            borderRadius: 1,
                            letterSpacing: '0.04em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.4
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: themeColor, display: 'inline-block' }}></span>
                          {zoneBadge}
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem' }}>•</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontWeight: 700 }}>
                          {item.hazardType || 'Hazard'}
                        </Typography>
                        {item.mode && item.mode !== 'LIVE' && (
                          <Box
                            sx={{
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              color: item.mode === 'TEST' ? '#3b82f6' : '#8b5cf6',
                              bgcolor: item.mode === 'TEST' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(139, 92, 246, 0.12)',
                              px: 0.7,
                              py: 0.15,
                              borderRadius: 1,
                              letterSpacing: '0.04em'
                            }}
                          >
                            [{item.mode}]
                          </Box>
                        )}
                        {!isRead && (
                          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#ef4444', flexShrink: 0 }} title="Unread" />
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
                    <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={0.8} pt={0.5}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 0.4 }}>
                        <MapPin size={12} style={{ color: themeColor }} /> {alertRegion}{item.affectedRadius ? ` • ${item.affectedRadius} km radius` : ''}
                      </Typography>

                      <Box display="flex" alignItems="center" gap={0.6}>
                        {/* Clear notification button */}
                        <Button
                          size="small"
                          onClick={() => clearAlertNotification(item)}
                          sx={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            textTransform: 'none',
                            color: 'text.secondary',
                            minWidth: 'auto',
                            px: 0.8,
                            py: 0.2,
                            borderRadius: 1.5,
                            border: '1px solid var(--border-color)',
                            '&:hover': {
                              color: '#ef4444',
                              borderColor: '#ef4444',
                              bgcolor: 'rgba(239, 68, 68, 0.08)'
                            }
                          }}
                          title="Clear this alert from notifications"
                        >
                          ✕ Clear
                        </Button>

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
              /* Empty State */
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    bgcolor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 1.5
                  }}
                >
                  <CheckCircle2 size={26} />
                </Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: 'text.primary', mb: 0.5, fontSize: '0.95rem' }}>
                  {clearedAlertsCount > 0 ? 'All Notifications Cleared' : 'All Clear in this Category'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', lineHeight: 1.5 }}>
                  {clearedAlertsCount > 0
                    ? 'You have cleared notifications. New alerts will appear here when issued.'
                    : zoneCategory === 'LOCAL'
                    ? `No active hazard alerts in ${location?.name || location?.district || 'your district'}.`
                    : `No alerts currently registered in this zone category.`}
                </Typography>
                {clearedAlertsCount > 0 && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={restoreClearedAlertNotifications}
                    startIcon={<RotateCcw size={13} />}
                    sx={{
                      mt: 2,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'none',
                      borderRadius: 2
                    }}
                  >
                    Restore Cleared Alerts ({clearedAlertsCount})
                  </Button>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>

        {/* Simple Footer */}
        <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
            NDRF: <strong>1070</strong> • Police: <strong>112</strong> • Relief: <strong>1077</strong>
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            {clearedAlertsCount > 0 && recentAlerts.length > 0 && (
              <Button
                size="small"
                onClick={restoreClearedAlertNotifications}
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  color: 'text.secondary'
                }}
              >
                Restore ({clearedAlertsCount})
              </Button>
            )}
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
        </Box>
      </Dialog>
    </>
  );
}
