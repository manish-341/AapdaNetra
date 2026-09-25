import React, { useState, useRef, useEffect } from 'react';
import { Languages, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useThemeMode } from '../context/ThemeContext';

export default function LanguageSelector({ compact = false }) {
  const { language, setLanguage, languages } = useLanguage();
  const { isDark } = useThemeMode();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title="Change Language / भाषा बदलें"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: compact ? '0.35rem 0.65rem' : '0.45rem 0.75rem',
          borderRadius: 8,
          border: isDark ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid #dfe1e6',
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#ffffff',
          color: isDark ? '#F5F8FF' : '#0B2347',
          cursor: 'pointer',
          fontWeight: 650,
          fontSize: compact ? '0.78rem' : '0.82rem',
          transition: 'all 0.18s ease',
          boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.06)',
          userSelect: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#0B6BFF';
          e.currentTarget.style.backgroundColor = isDark ? 'rgba(11, 107, 255, 0.12)' : 'rgba(11, 107, 255, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.14)' : '#dfe1e6';
          e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.06)' : '#ffffff';
        }}
      >
        <Languages size={15} style={{ color: '#0B6BFF' }} />
        <span>{currentLang.nativeName}</span>
        <ChevronDown
          size={13}
          style={{
            opacity: 0.75,
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(180deg)' : 'none'
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: 210,
            maxHeight: 320,
            overflowY: 'auto',
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e2e8f0',
            borderRadius: 10,
            boxShadow: isDark ? '0 16px 36px rgba(0,0,0,0.7)' : '0 12px 28px rgba(0,0,0,0.12)',
            padding: '0.4rem',
            zIndex: 2000,
          }}
        >
          <div
            style={{
              padding: '0.4rem 0.6rem',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: isDark ? '#94a3b8' : '#64748b',
              borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1f5f9',
              marginBottom: '0.3rem'
            }}
          >
            Indian Languages (भारतीय भाषाएं)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {languages.map((l) => {
              const active = l.code === language;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    setLanguage(l.code);
                    setOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.45rem 0.65rem',
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: active
                      ? (isDark ? 'rgba(11, 107, 255, 0.22)' : 'rgba(11, 107, 255, 0.09)')
                      : 'transparent',
                    color: active ? '#0B6BFF' : (isDark ? '#F5F8FF' : '#0B2347'),
                    fontWeight: active ? 750 : 550,
                    fontSize: '0.82rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.06)' : '#f8fafc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem' }}>
                    <span style={{ fontSize: '0.86rem' }}>{l.nativeName}</span>
                    <span style={{ fontSize: '0.7rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                      ({l.name})
                    </span>
                  </span>
                  {active && <Check size={14} style={{ color: '#0B6BFF' }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
