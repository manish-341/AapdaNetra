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
  Tab
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
  Sparkles
} from 'lucide-react';
import { getAlerts, dispatchEmergencyAlert } from '../services/api';
import { playEmergencySiren, stopEmergencySiren, isSirenActive } from '../utils/emergencyAudio';
import { triggerDisasterNotification } from '../utils/emergencyNotification';
import { useLocationContext } from '../context/LocationContext';
import { useThemeMode } from '../context/ThemeContext';
import { getCurrentUser } from '../lib/auth';
import { alertMatchesLocation, isTrueCriticalAlert, getAlertRegionName } from '../utils/alertMatcher';

const NOTIFICATIONS_STORAGE_KEY = 'aapdanetra_notifications_config';
const ACKNOWLEDGED_ALERTS_KEY = 'an_acknowledged_critical_alerts';

export default function EmergencyAlertSentinel() {
  const navigate = useNavigate();
  const { location, switchLocation } = useLocationContext();
  const { isDark } = useThemeMode();

  const [alerts, setAlerts] = useState([]);
  const [activeCriticalAlert, setActiveCriticalAlert] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toastPopupOpen, setToastPopupOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [sirenPlaying, setSirenPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: Local Jurisdiction (Default), 1: All National

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

        // 2. Identify local critical alert (if any)
        const localCriticalAlert = localAlerts.find((a) => isTrueCriticalAlert(a)) || null;

        // 3. Identify top national critical alert across all regions (if any)
        const nationalCriticalAlert = alertsList.find((a) => a.isActive !== false && isTrueCriticalAlert(a)) || null;

        // 4. Featured alert for the real-time popup toast: prioritize local, or show top national critical alert
        const topCritical = localCriticalAlert || nationalCriticalAlert || null;

        if (topCritical) {
          const alertId = topCritical._id || topCritical.id || topCritical.title;

          let acknowledgedIds = [];
          try {
            acknowledgedIds = JSON.parse(sessionStorage.getItem(ACKNOWLEDGED_ALERTS_KEY) || '[]');
          } catch {}

          const isAcknowledged = acknowledgedIds.includes(alertId);
          setActiveCriticalAlert(topCritical);

          // Show floating Alert Popup Toast across all regions (when modal is closed)
          if (!isAcknowledged && !modalOpen) {
            setToastPopupOpen(true);
          }

          // STRICT CIVIL DEFENSE SIREN RULE:
          // Siren rings automatically for 7 seconds ONLY IF the user is in the affected district!
          // If the critical alert is in another region, the toast popup informs them visually, but siren stays silent!
          const isLocallyCritical = !!localCriticalAlert;

          if (isLocallyCritical && !isAcknowledged && lastSoundedAlertIdRef.current !== alertId) {
            lastSoundedAlertIdRef.current = alertId;

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

          if (isLocallyCritical) {
            setBannerDismissed(false);
          } else {
            setBannerDismissed(true); // Don't show local red flashing banner if emergency is in another state
          }
        } else {
          // When no critical alerts are active, silence any siren immediately and do NOT show critical banner or toast
          setActiveCriticalAlert(null);
          setBannerDismissed(true);
          setToastPopupOpen(false);

          if (isSirenActive()) {
            stopEmergencySiren();
          }
          setSirenPlaying(false);
        }
      } catch (err) {
        console.warn('[Emergency Sentinel] Alert check error:', err.message);
      }
    };

    checkEmergencyAlerts();
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

      {/* 2. REAL-TIME FLOATING ALERT POPUP TOAST (Shown ONLY when a true CRITICAL situation is active AND modal is closed) */}
      {toastPopupOpen && activeCriticalAlert && !modalOpen && (
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
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
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
              <Chip
                label={getAlertRegionName(activeCriticalAlert)}
                size="small"
                sx={{
                  bgcolor: '#ef4444',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '0.68rem',
                  height: 22
                }}
              />
              <Chip
                label="CRITICAL EMERGENCY"
                size="small"
                variant="outlined"
                sx={{
                  borderColor: '#ef4444',
                  color: '#ef4444',
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
            {activeCriticalAlert.title}
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
            {activeCriticalAlert.message || activeCriticalAlert.description}
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
                bgcolor: '#ef4444',
                color: '#ffffff',
                fontSize: '0.72rem',
                fontWeight: 800,
                textTransform: 'none',
                py: 0.4,
                px: 1.5,
                borderRadius: 2,
                ml: 'auto',
                '&:hover': { bgcolor: '#dc2626' }
              }}
            >
              View All Regional Advisories
            </Button>
          </Box>
        </Box>
      )}

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

              <IconButton onClick={() => setModalOpen(false)} sx={{ color: 'text.secondary' }}>
                <X size={18} />
              </IconButton>
            </Box>
          </Box>

          {/* Clean Segmented Tabs (All Regions vs Active Jurisdiction) */}
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
              <Tab label={`All Regions — Important (${regionalImportantAlerts.length})`} />
              <Tab label={`My Jurisdiction: ${location?.district || location?.name || 'Local'} (${districtAlerts.length})`} />
            </Tabs>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5, pt: 1.5, maxHeight: '60vh', overflowY: 'auto' }}>
          {activeTab === 0 ? (
            /* TAB 0: ALL REGIONS (CURATED SINGLE MOST IMPORTANT ALERT PER REGION) */
            <Box display="flex" flexDirection="column" gap={1.8}>
              {regionalImportantAlerts.length > 0 ? (
                regionalImportantAlerts.map(({ region, alert: item }) => {
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
          ) : (
            /* TAB 1: LOCAL JURISDICTION */
            <>
              {primaryDistrictAlert ? (
                <>
                  {/* FEATURED: SINGLE MOST IMPORTANT ALERT FOR LOCAL DISTRICT */}
                  {(() => {
                    const isTrulyCritical = isTrueCriticalAlert(primaryDistrictAlert);
                    const effectiveSev = isTrulyCritical
                      ? 'CRITICAL'
                      : primaryDistrictAlert.severity === 'CRITICAL'
                      ? 'WARNING'
                      : primaryDistrictAlert.severity || 'INFO';
                    const isHigh = effectiveSev === 'HIGH';
                    const isCrit = effectiveSev === 'CRITICAL';
                    const themeColor = isCrit ? '#ef4444' : isHigh ? '#f97316' : '#0284c7';
                    const bgTint = isDark
                      ? isCrit
                        ? 'rgba(239, 68, 68, 0.12)'
                        : isHigh
                        ? 'rgba(249, 115, 22, 0.1)'
                        : 'rgba(2, 132, 199, 0.1)'
                      : isCrit
                      ? '#fef2f2'
                      : isHigh
                      ? '#fff7ed'
                      : '#f0f9ff';

                    return (
                      <Box
                        sx={{
                          p: 2.2,
                          borderRadius: 3,
                          bgcolor: bgTint,
                          border: '1.5px solid',
                          borderColor: themeColor,
                          mb: 2
                        }}
                      >
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              label={`MOST IMPORTANT: ${effectiveSev}`}
                              size="small"
                              sx={{
                                bgcolor: themeColor,
                                color: '#fff',
                                fontWeight: 900,
                                fontSize: '0.68rem',
                                height: 22
                              }}
                            />
                            <Chip
                              label={primaryDistrictAlert.hazardType || 'HAZARD'}
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 700, fontSize: '0.65rem', height: 22 }}
                            />
                          </Box>

                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            {new Date(primaryDistrictAlert.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>

                        <Typography variant="subtitle2" fontWeight={800} sx={{ color: 'text.primary', mb: 0.8 }}>
                          {primaryDistrictAlert.title}
                        </Typography>

                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5, lineHeight: 1.5 }}>
                          {primaryDistrictAlert.message || primaryDistrictAlert.description}
                        </Typography>

                        {primaryDistrictAlert.affectedRadius && (
                          <Typography variant="caption" sx={{ color: 'text.muted', display: 'block', mb: 1.5 }}>
                            📍 Threat Radius: <strong>{primaryDistrictAlert.affectedRadius} km</strong> around monitored zone.
                          </Typography>
                        )}

                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => {
                            setModalOpen(false);
                            navigate('/disaster-map');
                          }}
                          startIcon={<MapPin size={14} />}
                          sx={{
                            bgcolor: themeColor,
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            textTransform: 'none',
                            borderRadius: 2,
                            '&:hover': {
                              bgcolor: themeColor
                            }
                          }}
                        >
                          View Safe Routes on Threat Map
                        </Button>
                      </Box>
                    );
                  })()}

                  {/* SECONDARY LOCAL ADVISORIES (MAX 2 ITEMS TO PREVENT CLUTTER) */}
                  {secondaryDistrictAlerts.length > 0 && (
                    <>
                      <Typography variant="caption" fontWeight={800} sx={{ color: 'text.muted', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', mb: 1 }}>
                        Secondary Regional Advisories ({secondaryDistrictAlerts.length})
                      </Typography>

                      <Box display="flex" flexDirection="column" gap={1}>
                        {secondaryDistrictAlerts.map((subAlert) => (
                          <Box
                            key={subAlert._id || subAlert.id}
                            sx={{
                              p: 1.5,
                              borderRadius: 2.5,
                              bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
                              border: '1px solid var(--border-color)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: 1.5
                            }}
                          >
                            <Box>
                              <Box display="flex" alignItems="center" gap={1} mb={0.3}>
                                <Chip
                                  label={subAlert.severity || 'ADVISORY'}
                                  size="small"
                                  sx={{
                                    bgcolor: subAlert.severity === 'HIGH' ? '#f97316' : '#eab308',
                                    color: '#fff',
                                    fontSize: '0.62rem',
                                    fontWeight: 800,
                                    height: 18
                                  }}
                                />
                                <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
                                  {subAlert.title}
                                </Typography>
                              </Box>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {subAlert.message || subAlert.description}
                              </Typography>
                            </Box>

                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                setModalOpen(false);
                                navigate('/disaster-map');
                              }}
                              sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'none', borderRadius: 1.5, whiteSpace: 'nowrap' }}
                            >
                              Map
                            </Button>
                          </Box>
                        ))}
                      </Box>
                    </>
                  )}
                </>
              ) : (
                /* ALL CLEAR STATE FOR LOCAL DISTRICT */
                <Box sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px dashed var(--border-color)' }}>
                  <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 8px auto' }} />
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: 'text.primary' }}>
                    All Clear in {location?.name || location?.district}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    No active disaster alerts or critical warnings are in effect for your selected jurisdiction.
                  </Typography>
                </Box>
              )}

              {/* EMERGENCY PROTOCOL FOOTER HELPLINES */}
              <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#f1f5f9', border: '1px solid var(--border-color)' }}>
                <Typography variant="caption" fontWeight={700} sx={{ color: 'text.secondary', display: 'block', textAlign: 'center' }}>
                  Emergency Helplines: NDRF: <strong>1070</strong> | Police/Ambulance: <strong>112</strong> | State Relief: <strong>1077</strong>
                </Typography>
              </Box>
            </>
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
