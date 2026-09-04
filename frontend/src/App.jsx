import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { ThemeContextProvider } from './context/ThemeContext';
import { LocationProvider } from './context/LocationContext';
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

export default function App() {
  return (
    <ThemeContextProvider>
      <LocationProvider>
        <CssBaseline />
        <ErrorBoundary>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ErrorBoundary>
      </LocationProvider>
    </ThemeContextProvider>
  );
}