import React from 'react';
import Sidebar from '../includes/Sidebar';
import Navbar from '../includes/Navbar';
import Footer from '../includes/Footer';
import { useThemeMode } from '../context/ThemeContext';

const Boilerplate = ({ children }) => {
  const { isDark } = useThemeMode();

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main
          style={{
            padding: '1.75rem 2rem',
            flex: 1,
            backgroundColor: 'var(--bg-primary)',
            backgroundImage: isDark
              ? 'radial-gradient(at 0% 0%, rgba(56, 189, 248, 0.06) 0px, transparent 50%), radial-gradient(at 100% 20%, rgba(168, 85, 247, 0.05) 0px, transparent 50%)'
              : 'radial-gradient(at 0% 0%, rgba(2, 132, 199, 0.05) 0px, transparent 50%), radial-gradient(at 100% 20%, rgba(139, 92, 246, 0.04) 0px, transparent 50%)',
            minHeight: '100%',
            boxSizing: 'border-box',
            transition: 'background 0.25s ease',
          }}
        >
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Boilerplate;