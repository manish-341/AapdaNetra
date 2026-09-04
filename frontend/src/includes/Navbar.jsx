import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, ShieldAlert, Sun, Moon, MapPin, Crosshair, ChevronDown, Search } from 'lucide-react';
import { clearAuthToken, getCurrentUser } from '../lib/auth';
import { getAlerts } from '../services/api';
import { useThemeMode } from '../context/ThemeContext';
import { useLocationContext } from '../context/LocationContext';
import { alertMatchesLocation, isTrueCriticalAlert } from '../utils/alertMatcher';

const Navbar = () => {
  const navigate = useNavigate();
  const { themeMode, toggleTheme, isDark } = useThemeMode();
  const { location, switchLocation, detectLiveGPS, gpsLoading, presets } = useLocationContext();
  const user = getCurrentUser() || { name: 'Guest User', role: 'CITIZEN', district: 'Vindhya' };
  const [alerts, setAlerts] = useState([]);
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [searchDistrict, setSearchDistrict] = useState('');
  const locationMenuRef = useRef(null);

  useEffect(() => {
    getAlerts()
      .then(res => setAlerts(res.data?.data || []))
      .catch(() => setAlerts([]));
  }, []);

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

  // Filter alerts specifically for current jurisdiction to prevent overwhelming clutter
  const localAlerts = alerts.filter(a => a.isActive !== false && alertMatchesLocation(a, location));
  const localCriticalAlerts = localAlerts.filter(a => isTrueCriticalAlert(a));
  const hasLocalCritical = localCriticalAlerts.length > 0;
  const localBadgeCount = localAlerts.length;

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
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Operational Jurisdiction
              </div>

              {/* Live GPS Button */}
              <button
                type="button"
                onClick={() => {
                  detectLiveGPS();
                  setShowLocationMenu(false);
                }}
                disabled={gpsLoading}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: 8,
                  border: '1px dashed #10b981',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  marginBottom: '0.75rem',
                }}
              >
                <Crosshair size={16} />
                <span>{gpsLoading ? 'Detecting GPS...' : '📍 Detect Live GPS Location'}</span>
              </button>

              {/* Search input for any Indian district */}
              <form onSubmit={handleCustomSearch} style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Type any district (e.g. Satna, Rewa)..."
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
                    outline: 'none'
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
                    cursor: 'pointer'
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
                        marginBottom: 2
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

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 38,
            height: 38,
            borderRadius: 10,
            border: '1px solid var(--border-color)',
            background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
            color: isDark ? '#fbbf24' : '#0284c7',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.06)';
            e.currentTarget.style.borderColor = isDark ? '#fbbf24' : '#0284c7';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        >
          {isDark ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        {/* Alerts Notification button (Opens Full Alert Popup for both User and Admin) */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-notifications-popup'));
            }}
            title="Open Emergency Alert & Notification Center"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              borderRadius: 10,
              border: hasLocalCritical ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)',
              background: hasLocalCritical
                ? (isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)')
                : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
              color: hasLocalCritical ? '#ef4444' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Bell size={18} />
            {localBadgeCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -4,
                  minWidth: 16,
                  height: 16,
                  padding: '0 4px',
                  borderRadius: 8,
                  backgroundColor: hasLocalCritical ? '#ef4444' : '#0284c7',
                  color: '#ffffff',
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: hasLocalCritical ? '0 0 8px #ef4444' : 'none',
                }}
              >
                {localBadgeCount}
              </span>
            )}
          </button>
        </div>

        {/* User profile */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            borderLeft: '1px solid var(--border-color)',
            paddingLeft: '1.25rem',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: isDark ? '#1e293b' : '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDark ? '#38bdf8' : '#0284c7',
              fontWeight: 'bold',
            }}
          >
            <User size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {user.name}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
              {user.role} • {location.name || location.district || user.district || 'Vindhya (MP)'}
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              marginLeft: '0.5rem',
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
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
