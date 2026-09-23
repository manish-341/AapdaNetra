import React from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../includes/Sidebar';
import Navbar from '../includes/Navbar';
import Footer from '../includes/Footer';
import EmergencyAlertSentinel from '../components/EmergencyAlertSentinel';
import FloatingAIAssistant from '../components/FloatingAIAssistant';
import { useThemeMode } from '../context/ThemeContext';

const Boilerplate = ({ children }) => {
  const { isDark } = useThemeMode();
  const location = useLocation();
  const isChatPage = location.pathname === '/ai-assistant' || location.pathname === '/ai-copilot';

  return (
    <div
      className="app-container"
      style={isChatPage ? { height: '100vh', maxHeight: '100vh', overflow: 'hidden' } : {}}
    >
      <div className="no-print sidebar-container">
        <Sidebar />
      </div>
      <div
        className="main-content"
        style={isChatPage ? { height: '100vh', maxHeight: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' } : {}}
      >
        <div className="no-print navbar-container">
          <Navbar />
        </div>
        <main
          style={{
            padding: isChatPage ? '0.75rem 1.25rem 0.75rem 1.25rem' : '1.75rem 2rem',
            flex: 1,
            display: isChatPage ? 'flex' : 'block',
            flexDirection: isChatPage ? 'column' : undefined,
            minHeight: isChatPage ? 0 : '100%',
            height: isChatPage ? 'calc(100vh - 65px)' : undefined,
            maxHeight: isChatPage ? 'calc(100vh - 65px)' : undefined,
            overflow: isChatPage ? 'hidden' : 'visible',
            backgroundColor: 'var(--bg-primary)',
            backgroundImage: isDark
              ? 'radial-gradient(at 0% 0%, rgba(56, 189, 248, 0.06) 0px, transparent 50%), radial-gradient(at 100% 20%, rgba(168, 85, 247, 0.05) 0px, transparent 50%)'
              : 'radial-gradient(at 0% 0%, rgba(2, 132, 199, 0.05) 0px, transparent 50%), radial-gradient(at 100% 20%, rgba(139, 92, 246, 0.04) 0px, transparent 50%)',
            boxSizing: 'border-box',
            transition: 'background 0.25s ease',
          }}
        >
          <div className="no-print">
            <EmergencyAlertSentinel />
          </div>
          {children}
          {!isChatPage && (
            <div className="no-print">
              <FloatingAIAssistant />
            </div>
          )}
        </main>
        {!isChatPage && (
          <div className="no-print footer-container">
            <Footer />
          </div>
        )}
      </div>
    </div>
  );
};

export default Boilerplate;