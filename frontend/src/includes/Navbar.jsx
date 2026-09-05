import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, ShieldAlert, Sun, Moon, MapPin, Crosshair, ChevronDown } from 'lucide-react';
import { clearAuthToken, getCurrentUser } from '../lib/auth';
import { getAlerts } from '../services/api';
import { useThemeMode } from '../context/ThemeContext';
import { useLocationContext } from '../context/LocationContext';
import { alertMatchesLocation } from '../utils/alertMatcher';
import { getUnreadAlerts, markAllAlertsAsRead } from '../utils/notificationsStore';

const Navbar = () => {
  const navigate = useNavigate();
  const { toggleTheme, isDark } = useThemeMode();
  const { location, switchLocation, detectLiveGPS, gpsLoading, presets } = useLocationContext();
  const user = getCurrentUser() || { name: 'Guest User', role: 'CITIZEN', district: 'Vindhya' };
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [searchDistrict, setSearchDistrict] = useState('');
  const locationMenuRef = useRef(null);

  const updateUnread = (alertList, loc) => {
    const unread = getUnreadAlerts(alertList, loc, alertMatchesLocation);
    setUnreadCount(unread.length);
  };

  useEffect(() => {
    getAlerts()
      .then((res) => {
        const data = res.data?.data || [];
        setAlerts(data);
        updateUnread(data, location);
      })
      .catch(() => {
        setAlerts([]);
        setUnreadCount(0);
      });
  }, []);

  // Recalculate unread notifications whenever location changes or alerts list updates
  useEffect(() => {
    if (alerts.length > 0) {
      updateUnread(alerts, location);
    }
  }, [location?.district, location?.name, alerts]);

  // Listen for real-time notification read events
  useEffect(() => {
    const handleNotificationsUpdated = () => {
      updateUnread(alerts, location);
    };
    window.addEventListener('notifications-updated', handleNotificationsUpdated);
    return () => {
      window.removeEventListener('notifications-updated', handleNotificationsUpdated);
    };
  }, [alerts, location]);

  // Close location menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (locationMenuRef.current && !locationMenuRef.current.contains(e.target)) {
        setShowLocationMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCustomSearch = (e) => {
    e.preventDefault();
    if (searchDistrict.trim()) {
      switchLocation(searchDistrict.trim());
      setSearchDistrict('');
      setShowLocationMenu(false);
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    navigate('/login', { replace: true });
  };

  const handleOpenNotifications = () => {
    window.dispatchEvent(new CustomEvent('open-notifications-popup'));
    markAllAlertsAsRead(alerts);
    setUnreadCount(0);
  };

  return (
    <header className="top-navbar">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={20} color={isDark ? '#38bdf8' : '#0284c7'} />
          <h1 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--text-primary)', fontWeight: 700 }}>
            AapdaNetra Crisis Decision Support
          </h1>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
          Real-Time Geospatial Intelligence • ML Predictions • Emergency Guidance
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Interactive District Location Switcher */}
        <div style={{ position: 'relative' }} ref={locationMenuRef}>
          <button
            type="button"
            onClick={() => setShowLocationMenu(!showLocationMenu)}
            title="Change Active Location / District"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.85rem',
              borderRadius: 10,
              border: isDark ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(2, 132, 199, 0.3)',
              background: isDark ? 'rgba(56, 189, 248, 0.08)' : 'rgba(2, 132, 199, 0.06)',
              color: isDark ? '#38bdf8' : '#0284c7',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.82rem',
              transition: 'all 0.2s ease',
            }}
          >
            <MapPin size={16} />
            <span>{location.name || location.district || 'Location'}</span>
            <ChevronDown size={14} style={{ opacity: 0.8 }} />
          </button>

          {showLocationMenu && (
            <div
              style={{
                position: 'absolute',
                top: '120%',
                left: 0,
                width: 290,
                backgroundColor: isDark ? '#111827' : '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: 12,
                boxShadow: isDark ? '0 12px 30px rgba(0,0,0,0.6)' : '0 12px 30px rgba(0,0,0,0.12)',
                padding: '0.75rem',
                zIndex: 1000,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                  ACTIVE DISTRICT
                </span>
                <button
                  type="button"
                  onClick={detectLiveGPS}
                  disabled={gpsLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.7rem',
                    color: isDark ? '#38bdf8' : '#0284c7',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  <Crosshair size={12} />
                  {gpsLoading ? 'Locating...' : 'GPS'}
                </button>
              </div>

              <form onSubmit={handleCustomSearch} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.65rem' }}>
                <input
                  type="text"
                  placeholder="Search district (e.g. Pune)..."
                  value={searchDistrict}
                  onChange={(e) => setSearchDistrict(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.4rem 0.6rem',
                    fontSize: '0.78rem',
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '0.4rem 0.6rem',
                    borderRadius: 6,
                    border: 'none',
                    background: '#0284c7',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  Go
                </button>
              </form>

              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
                QUICK SELECT REGIONS
              </div>

              <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                {presets.map((p) => {
                  const isSelected = location.district === p.district;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        switchLocation(p.district, p.state);
                        setShowLocationMenu(false);
                      }}
                      style={{
                        padding: '0.45rem 0.65rem',
                        borderRadius: 6,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.8rem',
                        fontWeight: isSelected ? 700 : 500,
                        backgroundColor: isSelected
                          ? (isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.1)')
                          : 'transparent',
                        color: isSelected ? (isDark ? '#38bdf8' : '#0284c7') : 'var(--text-primary)',
                        marginBottom: 2,
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span>{p.name}</span>
                      {isSelected && <span style={{ fontSize: '0.7rem' }}>✓ Active</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Dual Sun/Moon Pill Theme Toggle */}
        <div
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 6px',
            borderRadius: 20,
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
            background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div
            style={{
              padding: '4px 6px',
              borderRadius: 14,
              backgroundColor: !isDark ? '#ffffff' : 'transparent',
              boxShadow: !isDark ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
            }}
          >
            <Sun size={15} />
          </div>
          <div
            style={{
              padding: '4px 6px',
              borderRadius: 14,
              backgroundColor: isDark ? '#1e293b' : 'transparent',
              boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDark ? '#38bdf8' : '#64748b',
            }}
          >
            <Moon size={15} />
          </div>
        </div>

        {/* Alerts Notification button with Dynamic Red Badge */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={handleOpenNotifications}
            title={unreadCount > 0 ? `${unreadCount} unread emergency alerts - click to read` : 'Emergency Alert & Notification Center'}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              borderRadius: '50%',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
              background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease',
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  minWidth: 16,
                  height: 16,
                  padding: '0 4px',
                  borderRadius: 8,
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)',
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* User profile matching mockup */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            paddingLeft: '0.5rem',
            cursor: 'pointer',
          }}
        >
          <div
            onClick={() => navigate('/settings')}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: isDark ? '#1e293b' : '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7',
              fontWeight: 800,
              fontSize: '0.9rem',
            }}
          >
            {(user?.name || (user?.email ? user.email.split('@')[0] : 'Citizen')).charAt(0).toUpperCase()}
          </div>
          <div onClick={() => navigate('/settings')}>
            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {user?.name || (user?.email ? user.email.split('@')[0] : 'Citizen')}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {((user?.role || 'CITIZEN').toUpperCase() === 'ADMIN'
                ? 'Admin'
                : (user?.role || 'CITIZEN').toUpperCase() === 'DISTRICT_OFFICER'
                ? 'District Officer'
                : (user?.role || 'CITIZEN').toUpperCase() === 'FIELD_OFFICER'
                ? 'Field Officer'
                : (user?.role || 'CITIZEN').toUpperCase() === 'RESPONDER'
                ? 'Responder'
                : 'Citizen')} • {user?.district || location?.name || location?.district || 'Delhi NCR'}
            </div>
          </div>
          <ChevronDown size={14} style={{ color: 'var(--text-muted)', opacity: 0.8 }} />
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              marginLeft: '0.2rem',
              border: 'none',
              borderRadius: 6,
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
