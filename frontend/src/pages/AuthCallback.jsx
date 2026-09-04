import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Paper, Button } from '@mui/material';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { setAuthToken } from '../lib/auth';
import { useThemeMode } from '../context/ThemeContext';
import AapdaNetraLogo from '../components/AapdaNetraLogo';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDark } = useThemeMode();
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const userRaw = searchParams.get('user');
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setStatus('error');
      setErrorMessage(decodeURIComponent(errorParam));
      return;
    }

    // Flow 1: Backend completed exchange and redirected with JWT token
    if (token) {
      try {
        let user = null;
        if (userRaw) {
          user = JSON.parse(decodeURIComponent(userRaw));
        } else {
          user = { email: 'google.user@aapdanetra.in', role: 'CITIZEN' };
        }

        setAuthToken(token, user, true);
        setStatus('success');

        const timer = setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 600);

        return () => clearTimeout(timer);
      } catch (err) {
        console.error('Failed to parse Google OAuth user data:', err);
        setStatus('error');
        setErrorMessage('Failed to parse authenticated session payload.');
        return;
      }
    }

    // Flow 2: Google redirected directly to frontend with auth code
    if (code) {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      fetch(`${apiBase}/auth/google/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          redirectUri: window.location.origin + '/auth/callback'
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data?.token) {
            const { token: jwtToken, ...user } = data.data;
            setAuthToken(jwtToken, user, true);
            setStatus('success');
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 600);
          } else {
            setStatus('error');
            setErrorMessage(data.message || 'Google authentication exchange failed.');
          }
        })
        .catch(err => {
          setStatus('error');
          setErrorMessage(err.message || 'Network error during Google authentication.');
        });
      return;
    }

    setStatus('error');
    setErrorMessage('No authentication credentials or authorization code returned from Google.');
  }, [searchParams, navigate]);

  const pageBg = isDark ? '#080c14' : '#f8fafc';
  const cardBg = isDark ? '#0f172a' : '#ffffff';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#475569';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: pageBg,
        color: textPrimary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Paper
        sx={{
          maxWidth: 440,
          width: '100%',
          p: 4,
          borderRadius: 3.5,
          textAlign: 'center',
          backgroundColor: cardBg,
          border: `1px solid ${borderColor}`,
          boxShadow: isDark
            ? '0 20px 40px rgba(0, 0, 0, 0.6)'
            : '0 10px 30px rgba(15, 23, 42, 0.08)',
        }}
      >
        <Box display="inline-flex" alignItems="center" justifyContent="center" mb={2}>
          <AapdaNetraLogo size={48} />
        </Box>

        {status === 'processing' && (
          <Box>
            <CircularProgress size={36} sx={{ color: '#0284c7', mb: 2 }} />
            <Typography variant="h6" fontWeight={800} sx={{ color: textPrimary, mb: 0.5 }}>
              Authenticating with Google...
            </Typography>
            <Typography variant="body2" sx={{ color: textSecondary }}>
              Verifying credentials and synchronizing disaster command permissions.
            </Typography>
          </Box>
        )}

        {status === 'success' && (
          <Box display="flex" flexDirection="column" alignItems="center">
            <CheckCircle2 size={44} color="#10b981" style={{ marginBottom: 12 }} />
            <Typography variant="h6" fontWeight={800} sx={{ color: textPrimary, mb: 0.5 }}>
              Authentication Successful
            </Typography>
            <Typography variant="body2" sx={{ color: textSecondary }}>
              Redirecting to your AapdaNetra operations dashboard...
            </Typography>
          </Box>
        )}

        {status === 'error' && (
          <Box display="flex" flexDirection="column" alignItems="center">
            <AlertCircle size={44} color="#ef4444" style={{ marginBottom: 12 }} />
            <Typography variant="h6" fontWeight={800} sx={{ color: textPrimary, mb: 0.5 }}>
              Google Sign-In Failed
            </Typography>
            <Typography variant="body2" sx={{ color: textSecondary, mb: 3 }}>
              {errorMessage}
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/login', { replace: true })}
              sx={{
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                fontWeight: 700,
                textTransform: 'none',
              }}
            >
              Return to Sign In
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
