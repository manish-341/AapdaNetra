import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

const ThemeContext = createContext();

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeContextProvider');
  }
  return context;
};

export function ThemeContextProvider({ children }) {
  const [themeMode, setThemeMode] = useState(() => {
    try {
      const saved = localStorage.getItem('aapdanetra_theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('aapdanetra_theme', themeMode);
    } catch {
      // ignore
    }
    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const muiTheme = useMemo(() => {
    const isDark = themeMode === 'dark';
    return createTheme({
      palette: {
        mode: themeMode,
        background: {
          default: isDark ? '#080c14' : '#f8fafc',
          paper: isDark ? '#0f172a' : '#ffffff',
        },
        primary: {
          main: '#0284c7',
          light: '#38bdf8',
          dark: '#0369a1',
        },
        secondary: {
          main: '#8b5cf6',
          light: '#a855f7',
          dark: '#7c3aed',
        },
        success: {
          main: '#10b981',
          light: '#34d399',
          dark: '#059669',
        },
        warning: {
          main: '#f59e0b',
          light: '#fbbf24',
          dark: '#d97706',
        },
        error: {
          main: '#f43f5e',
          light: '#fb7185',
          dark: '#e11d48',
        },
        text: {
          primary: isDark ? '#f8fafc' : '#0f172a',
          secondary: isDark ? '#94a3b8' : '#64748b',
        },
        divider: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
      },
      typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      },
      components: {
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              borderRadius: '8px',
              fontWeight: 600,
            },
          },
        },
      },
    });
  }, [themeMode]);

  return (
    <ThemeContext.Provider value={{ themeMode, toggleTheme, setThemeMode, isDark: themeMode === 'dark' }}>
      <MuiThemeProvider theme={muiTheme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
