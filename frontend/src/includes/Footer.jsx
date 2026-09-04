import React from 'react';

const Footer = () => {
  return (
    <footer
      style={{
        padding: '0.85rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid var(--border-color)',
        fontSize: '0.78rem',
        color: 'var(--text-secondary)',
        backgroundColor: 'var(--navbar-bg)',
        transition: 'background-color 0.25s ease, border-color 0.25s ease, color 0.25s ease',
      }}
    >
      <div>AapdaNetra • AI-Powered Geospatial Disaster Decision Support</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 8px #10b981',
          }}
        />
        <span style={{ color: 'var(--text-muted)' }}>Real-Time Telemetry Active</span>
      </div>
    </footer>
  );
};

export default Footer;