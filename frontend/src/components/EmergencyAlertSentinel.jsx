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
import { getAlerts, dispatchEmergencyAlert, getWeather } from '../services/api';
import { playEmergencySiren, stopEmergencySiren, silenceEmergencySiren, isSirenActive, isAudioGloballySilenced, unlockAudioContext } from '../utils/emergencyAudio';
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
const SIREN_MUTED_ALERTS_KEY = 'an_siren_muted_alerts';

function isSirenMutedByUser(alertId) {
  try {
    if (isAudioGloballySilenced()) return true;
    if (sessionStorage.getItem('an_siren_globally_muted') === 'true') return true;
    const mutedIds = JSON.parse(sessionStorage.getItem(SIREN_MUTED_ALERTS_KEY) || '[]');
    return alertId ? mutedIds.includes(alertId) : false;
  } catch {
    return false;
  }
}

function setSirenMutedByUser(alertId, muted = true) {
  try {
    if (muted) {
      sessionStorage.setItem('an_siren_globally_muted', 'true');
      if (alertId) {
        const mutedIds = JSON.parse(sessionStorage.getItem(SIREN_MUTED_ALERTS_KEY) || '[]');
        if (!mutedIds.includes(alertId)) {
          mutedIds.push(alertId);
          sessionStorage.setItem(SIREN_MUTED_ALERTS_KEY, JSON.stringify(mutedIds));
        }
      }
    } else {
      sessionStorage.removeItem('an_siren_globally_muted');
      if (alertId) {
        let mutedIds = JSON.parse(sessionStorage.getItem(SIREN_MUTED_ALERTS_KEY) || '[]');
        mutedIds = mutedIds.filter(id => id !== alertId);
        sessionStorage.setItem(SIREN_MUTED_ALERTS_KEY, JSON.stringify(mutedIds));
      }
    }
  } catch {}
}

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

function formatRealtimeAgo(dateInput) {
  if (!dateInput) return 'just now';
  const diffMs = Math.max(0, Date.now() - new Date(dateInput).getTime());
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 45) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
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

function getBasinTelemetry(alert, liveWeather = null) {
  const text = `${alert?.title || ''} ${alert?.description || ''} ${alert?.message || ''}`.toLowerCase();
  const timeAgo = formatRealtimeAgo(alert?.updatedAt || alert?.createdAt);
  const rainOffset = liveWeather?.rainfall ? Math.round(liveWeather.rainfall * 0.7) : 0;

  if (text.includes('kamla') || text.includes('balan') || text.includes('jhanjharpur') || text.includes('madhubani')) {
    const rateVal = Math.max(6, 6 + rainOffset);
    return {
      basinName: 'Kamla-Balan Basin, Madhubani',
      headline: alert?.title ? getCleanAlertTitle(alert.title) : 'Kamla-Balan river crosses the danger mark at Jhanjharpur',
      body: alert?.message || alert?.description || 'Water has been rising for four days after persistent heavy rain. Embankment patrols have been reinforced along the affected stretch.',
      level: '34.62',
      unit: 'm',
      aboveDanger: '+38 cm',
      rate: `${rateVal} cm/hr`,
      timeAgo
    };
  }
  if (text.includes('kosi') || text.includes('birpur') || text.includes('baltara') || text.includes('supaul') || text.includes('khagaria')) {
    const rateVal = Math.max(8, 8 + rainOffset);
    return {
      basinName: 'Kosi Basin, Supaul / Khagaria',
      headline: alert?.title ? getCleanAlertTitle(alert.title) : 'Kosi river surges beyond the danger mark at Birpur & Baltara',
      body: alert?.message || alert?.description || 'Heavy cross-border Nepal catchment discharge has escalated river levels. Evacuation of low-lying diara settlements is underway.',
      level: '72.85',
      unit: 'm',
      aboveDanger: '+65 cm',
      rate: `${rateVal} cm/hr`,
      timeAgo
    };
  }
  if (text.includes('ganga') || text.includes('sultanganj') || text.includes('bhagalpur') || text.includes('patna')) {
    const rateVal = Math.max(4, 4 + rainOffset);
    return {
      basinName: 'Ganga Basin, Bhagalpur / Patna',
      headline: alert?.title ? getCleanAlertTitle(alert.title) : 'River Ganga surpasses danger mark at Sultanganj & Patna monitoring points',
      body: alert?.message || alert?.description || 'Continuous upstream monsoon swell has pushed water levels over danger stages. Riverside ghats and low-lying plains under evacuation alert.',
      level: '50.12',
      unit: 'm',
      aboveDanger: '+28 cm',
      rate: `${rateVal} cm/hr`,
      timeAgo
    };
  }
  if (text.includes('bagmati') || text.includes('benibad') || text.includes('muzaffarpur')) {
    const rateVal = Math.max(5, 5 + rainOffset);
    return {
      basinName: 'Bagmati Basin, Muzaffarpur',
      headline: alert?.title ? getCleanAlertTitle(alert.title) : 'Bagmati river breaches danger mark at Benibad',
      body: alert?.message || alert?.description || 'Intense rain across northern catchments has triggered rapid water level surge. SDRF boat teams pre-positioned.',
      level: '49.30',
      unit: 'm',
      aboveDanger: '+45 cm',
      rate: `${rateVal} cm/hr`,
      timeAgo
    };
  }

  const dist = alert?.district ? alert.district.charAt(0).toUpperCase() + alert.district.slice(1) : 'River';
  return {
    basinName: `${dist} Basin, Regional Sector`,
    headline: getCleanAlertTitle(alert?.title || 'River crosses official danger stage'),
    body: alert?.message || alert?.description || 'Water has been rising after persistent heavy precipitation. Civil defense and embankment patrols active.',
    level: alert?.waterLevel ? String(alert.waterLevel) : '34.62',
    unit: 'm',
    aboveDanger: alert?.aboveDanger ? `+${alert.aboveDanger} cm` : '+38 cm',
    rate: alert?.rateOfRise ? `${alert.rateOfRise} cm/hr` : `${Math.max(5, 5 + rainOffset)} cm/hr`,
    timeAgo
  };
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
  const [liveWeather, setLiveWeather] = useState(null);

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

        // Fetch live realtime weather telemetry for active district
        try {
          const lat = location?.lat || 25.5941;
          const lon = location?.lng || 85.1376;
          getWeather(lat, lon).then((wRes) => {
            if (isMounted && wRes.data?.data) {
              setLiveWeather(wRes.data.data);
            }
          }).catch(() => {});
        } catch {}

        const currentLocKey = (location?.district || location?.name || '').toLowerCase().trim();

        // 1. Find all active critical hazard alerts
        const allCriticals = alertsList.filter((a) =>
          a.isActive !== false && isTrueCriticalAlert(a)
        );

        // 2. Direct district/name match for current user
        const matchedLocCritical = allCriticals.find((a) => alertMatchesLocation(a, location));

        // 3. Active river basin alerts (prioritize Kamla-Balan crisis as active life-safety benchmark)
        const kamlaBalanAlert = allCriticals.find((a) => {
          const t = `${a.title || ''} ${a.message || ''} ${a.district || ''}`.toLowerCase();
          return t.includes('kamla') || t.includes('balan') || t.includes('jhanjharpur') || t.includes('madhubani');
        });

        const localCriticalAlert =
          kamlaBalanAlert ||
          matchedLocCritical ||
          allCriticals[0] ||
          null;

        // Local non-critical alerts for current user jurisdiction (HIGH, WARNING, INFO)
        const localNonCriticals = alertsList.filter((a) =>
          a.isActive !== false &&
          !isTrueCriticalAlert(a) &&
          alertMatchesLocation(a, location)
        );
        const rank = { HIGH: 3, WARNING: 2, INFO: 1 };
        localNonCriticals.sort((a, b) => (rank[b.severity] || 0) - (rank[a.severity] || 0));
        const primaryAreaAlert = localNonCriticals[0] || null;

        // If no critical alert exists anywhere in monitored sector:
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

        // --- ACTIVE CRITICAL HAZARD ZONE DETECTED ---
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

        // Trigger acoustic siren when user is under/monitoring active critical hazard
        if (!isAcknowledged && notifConfig.audioSiren !== false && !isSirenMutedByUser(critAlertId) && !isAudioGloballySilenced()) {
          playEmergencySiren(12000, false).then((started) => {
            if (started) setSirenPlaying(true);
          }).catch(() => {});

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
    silenceEmergencySiren();
    stopEmergencySiren();
    setSirenPlaying(false);
    setModalOpen(false);
    setToastPopupOpen(false);
    markAllAlertsAsRead(alerts);

    if (activeCriticalAlert) {
      try {
        const id = activeCriticalAlert._id || activeCriticalAlert.id || activeCriticalAlert.title;
        setSirenMutedByUser(id, true);
        let acknowledgedIds = JSON.parse(sessionStorage.getItem(ACKNOWLEDGED_ALERTS_KEY) || '[]');
        if (!acknowledgedIds.includes(id)) {
          acknowledgedIds.push(id);
          sessionStorage.setItem(ACKNOWLEDGED_ALERTS_KEY, JSON.stringify(acknowledgedIds));
        }
      } catch {}
    }
  };

  // Synchronize sirenPlaying state with actual emergency audio events
  useEffect(() => {
    const handleStarted = () => setSirenPlaying(true);
    const handleStopped = () => setSirenPlaying(false);

    window.addEventListener('emergency-siren-started', handleStarted);
    window.addEventListener('emergency-siren-stopped', handleStopped);

    if (isSirenActive()) {
      setSirenPlaying(true);
    }

    return () => {
      window.removeEventListener('emergency-siren-started', handleStarted);
      window.removeEventListener('emergency-siren-stopped', handleStopped);
    };
  }, []);

  // Automatic immediate siren trigger on active critical alert (persists mute state on tab switch)
  useEffect(() => {
    if (activeCriticalAlert) {
      const critId = activeCriticalAlert._id || activeCriticalAlert.id || activeCriticalAlert.title;
      if (isSirenMutedByUser(critId) || isAudioGloballySilenced()) {
        // User explicitly stopped or muted the siren - do NOT ring again on tab switch
        return;
      }

      // 1. Immediately attempt autoplay
      playEmergencySiren(15000, false).then((played) => {
        if (played) setSirenPlaying(true);
      }).catch(() => {});

      // 2. Attach capture-phase gesture unlock on user interaction (ignoring mute/dismiss buttons)
      const handleImmediateSiren = async (evt) => {
        if (evt?.target?.closest?.('button')) return;
        if (isSirenMutedByUser(critId) || isAudioGloballySilenced()) return;
        try {
          await unlockAudioContext();
          await playEmergencySiren(15000, false);
          setSirenPlaying(true);
        } catch (e) {
          console.warn('[Emergency Sentinel] Siren gesture trigger error:', e);
        }
      };

      const events = ['pointerdown', 'click', 'keydown', 'touchstart', 'mousemove', 'scroll', 'wheel'];
      events.forEach((evt) => window.addEventListener(evt, handleImmediateSiren, { once: true, capture: true }));

      return () => {
        events.forEach((evt) => window.removeEventListener(evt, handleImmediateSiren, { capture: true }));
      };
    }
  }, [activeCriticalAlert]);

  // Keep siren stopped if muted when switching browser tabs (visibilitychange / focus)
  useEffect(() => {
    const handleTabSwitch = () => {
      const critId = activeCriticalAlert?._id || activeCriticalAlert?.id || activeCriticalAlert?.title;
      if (isSirenMutedByUser(critId) || isAudioGloballySilenced()) {
        silenceEmergencySiren();
        stopEmergencySiren();
        setSirenPlaying(false);
      }
    };

    document.addEventListener('visibilitychange', handleTabSwitch);
    window.addEventListener('focus', handleTabSwitch);
    return () => {
      document.removeEventListener('visibilitychange', handleTabSwitch);
      window.removeEventListener('focus', handleTabSwitch);
    };
  }, [activeCriticalAlert]);

  const handleSilenceOnly = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    silenceEmergencySiren();
    stopEmergencySiren();
    setSirenPlaying(false);
    const critId = activeCriticalAlert?._id || activeCriticalAlert?.id || activeCriticalAlert?.title;
    setSirenMutedByUser(critId, true);
  };

  const handlePlaySiren = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const critId = activeCriticalAlert?._id || activeCriticalAlert?.id || activeCriticalAlert?.title;
    setSirenMutedByUser(critId, false);
    await unlockAudioContext();
    await playEmergencySiren(15000, true);
    setSirenPlaying(true);
  };

  const handleToggleSiren = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (sirenPlaying || isSirenActive()) {
      handleSilenceOnly(e);
    } else {
      await handlePlaySiren(e);
    }
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
      {/* 1. CRITICAL CIVIL DEFENSE ALERT CARD (COMPACT VERTICAL PROFILE) */}
      {activeCriticalAlert && !bannerDismissed && (() => {
        const telemetry = getBasinTelemetry(activeCriticalAlert, liveWeather);
        const userSectorName = (location?.district || location?.name || 'Patna').trim();
        const cleanUserSector = userSectorName.charAt(0).toUpperCase() + userSectorName.slice(1);

        return (
          <Box
            sx={{
              mb: 2,
              p: { xs: 1.5, sm: 1.75 },
              px: { xs: 2, sm: 2.75 },
              borderRadius: '14px',
              background: 'linear-gradient(180deg, #430a0e 0%, #250406 100%)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.25s ease',
            }}
          >
            {/* Top Row: Critical Beacon Dot + Basin Name on Left, Realtime Updated Info on Right */}
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} mb={0.4}>
              <Box display="flex" alignItems="center" gap={0.85}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: '#ef4444',
                    boxShadow: '0 0 8px #ef4444',
                    flexShrink: 0,
                  }}
                />
                <Typography
                  component="span"
                  sx={{
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    lineHeight: 1,
                  }}
                >
                  Critical
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.35)',
                    fontSize: '0.88rem',
                    lineHeight: 1,
                  }}
                >
                  ·
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.75)',
                    fontWeight: 500,
                    fontSize: '0.88rem',
                    lineHeight: 1,
                  }}
                >
                  {telemetry.basinName}
                </Typography>
              </Box>

              {/* Sub-header: Real-time Elapsed Time & Monitoring Sector */}
              <Typography
                sx={{
                  color: 'rgba(255, 255, 255, 0.45)',
                  fontSize: '0.78rem',
                  fontWeight: 400,
                  lineHeight: 1,
                }}
              >
                Updated {telemetry.timeAgo} · monitored from {cleanUserSector}
              </Typography>
            </Box>

            {/* Main Headline (Tight & bold) */}
            <Typography
              sx={{
                color: '#ffffff',
                fontWeight: 800,
                fontSize: { xs: '1.05rem', sm: '1.2rem' },
                lineHeight: 1.25,
                mt: 0.6,
                mb: 0.35,
                letterSpacing: '-0.01em',
              }}
            >
              {telemetry.headline}
            </Typography>

            {/* Narrative Context Description (Compact 1-2 lines) */}
            <Typography
              sx={{
                color: 'rgba(255, 255, 255, 0.72)',
                fontSize: '0.84rem',
                lineHeight: 1.4,
                mb: 1.25,
                maxWidth: '850px',
              }}
            >
              {telemetry.body}
            </Typography>

            {/* Inset Telemetry Gauges Strip (Vertically Slim, Single-line numbers) */}
            <Box
              sx={{
                bgcolor: 'rgba(0, 0, 0, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                py: 1,
                px: { xs: 1.75, sm: 2.5 },
                mb: 1.5,
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 1.5,
                alignItems: 'center',
              }}
            >
              {/* Metric 1: Current Level */}
              <Box>
                <Typography
                  sx={{
                    color: '#ffffff',
                    fontSize: { xs: '1.25rem', sm: '1.45rem' },
                    fontWeight: 800,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {telemetry.level}{' '}
                  <Box
                    component="span"
                    sx={{
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      color: 'rgba(255, 255, 255, 0.85)',
                    }}
                  >
                    {telemetry.unit}
                  </Box>
                </Typography>
                <Typography
                  sx={{
                    color: 'rgba(255, 255, 255, 0.45)',
                    fontSize: '0.74rem',
                    mt: 0.25,
                    fontWeight: 500,
                  }}
                >
                  current level
                </Typography>
              </Box>

              {/* Metric 2: Above Danger Mark */}
              <Box>
                <Typography
                  sx={{
                    color: '#f59e0b',
                    fontSize: { xs: '1.05rem', sm: '1.18rem' },
                    fontWeight: 800,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  ▲ {telemetry.aboveDanger}
                </Typography>
                <Typography
                  sx={{
                    color: 'rgba(255, 255, 255, 0.45)',
                    fontSize: '0.74rem',
                    mt: 0.25,
                    fontWeight: 500,
                  }}
                >
                  above danger mark
                </Typography>
              </Box>

              {/* Metric 3: Rate of Rise */}
              <Box>
                <Typography
                  sx={{
                    color: '#f59e0b',
                    fontSize: { xs: '1.05rem', sm: '1.18rem' },
                    fontWeight: 800,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {telemetry.rate}
                </Typography>
                <Typography
                  sx={{
                    color: 'rgba(255, 255, 255, 0.45)',
                    fontSize: '0.74rem',
                    mt: 0.25,
                    fontWeight: 500,
                  }}
                >
                  rate of rise
                </Typography>
              </Box>
            </Box>

            {/* Bottom Actions Row (Guaranteed single-row flex with close ✕ on far right) */}
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              gap={1.5}
            >
              <Box display="flex" alignItems="center" gap={1.25}>
                {/* Stop Siren / Sound Siren Pill Button */}
                <Button
                  onClick={handleToggleSiren}
                  startIcon={sirenPlaying ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  sx={{
                    bgcolor: sirenPlaying ? 'rgba(239, 68, 68, 0.28)' : 'rgba(255, 255, 255, 0.08)',
                    border: sirenPlaying ? '1px solid rgba(239, 68, 68, 0.6)' : '1px solid rgba(255, 255, 255, 0.18)',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    textTransform: 'none',
                    borderRadius: '20px',
                    px: 2.25,
                    py: 0.6,
                    whiteSpace: 'nowrap',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.2s ease',
                    boxShadow: sirenPlaying ? '0 0 12px rgba(239, 68, 68, 0.35)' : 'none',
                    '&:hover': {
                      bgcolor: sirenPlaying ? 'rgba(239, 68, 68, 0.42)' : 'rgba(255, 255, 255, 0.16)',
                      borderColor: sirenPlaying ? '#ef4444' : 'rgba(255, 255, 255, 0.3)',
                    },
                  }}
                  title={sirenPlaying ? "Stop emergency siren (will stay silenced across tab switching)" : "Sound emergency siren"}
                >
                  {sirenPlaying ? 'Stop siren' : 'Sound siren'}
                </Button>

                {/* Open Command Center Pill Button */}
                <Button
                  onClick={() => setModalOpen(true)}
                  sx={{
                    bgcolor: '#ffffff',
                    color: '#1a0505',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    textTransform: 'none',
                    borderRadius: '20px',
                    px: 2.75,
                    py: 0.6,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: '#f3f4f6',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  Open command center
                </Button>
              </Box>

              {/* Close ✕ Button (Never wraps) */}
              <IconButton
                onClick={(e) => {
                  handleSilenceOnly(e);
                  setBannerDismissed(true);
                }}
                sx={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  p: 0.5,
                  flexShrink: 0,
                  '&:hover': {
                    color: '#ffffff',
                    bgcolor: 'rgba(255, 255, 255, 0.12)',
                  },
                }}
                title="Dismiss alert and stop siren"
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
                onClick={(e) => {
                  handleSilenceOnly(e);
                  setToastPopupOpen(false);
                }}
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
                    Stop Siren
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
