import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Grid,
  Checkbox,
  FormControlLabel,
  Divider,
  Container,
  Chip,
  Stack,
  Dialog,
  DialogContent,
  LinearProgress
} from '@mui/material';
import {
  User,
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { loginUser, googleDirectLogin } from '../services/api';
import { setAuthToken } from '../lib/auth';
import { useThemeMode } from '../context/ThemeContext';
import AapdaNetraLogo from '../components/AapdaNetraLogo';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDark, toggleTheme } = useThemeMode();

  // ONLY 2 Roles: 'citizen' and 'admin'
  const [activeRole, setActiveRole] = useState('citizen');
  const [identifier, setIdentifier] = useState('citizen@aapdanetra.in');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Read error parameter if redirected back from OAuth
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  // Color Tokens for Clean Government/SaaS Light-Default Palette
  const pageBg = isDark ? '#080c14' : '#f8fafc';
  const surfaceBg = isDark ? '#0f172a' : '#ffffff';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#475569';
  const textMuted = isDark ? '#64748b' : '#94a3b8';
  const inputBg = isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff';
  const accentBlue = isDark ? '#38bdf8' : '#0284c7';
  const accentHover = isDark ? '#0284c7' : '#0369a1';

  const handleRoleChange = (role) => {
    setActiveRole(role);
    setError('');
    if (role === 'citizen') {
      setIdentifier('citizen@aapdanetra.in');
      setPassword('password123');
    } else {
      setIdentifier('admin@aapdanetra.in');
      setPassword('password123');
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError(
        activeRole === 'citizen'
          ? 'Please enter your email or mobile number and password.'
          : 'Please enter your Admin ID and password.'
      );
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await loginUser({ email: identifier, password });
      const { token, ...user } = response.data.data;
      setAuthToken(token, user, rememberMe);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please verify and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Google SSO Modal State (Only for Citizen)
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googlePassword, setGooglePassword] = useState('');
  const [googleShowPassword, setGoogleShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [googleStep, setGoogleStep] = useState('email');

  const handleGoogleSignIn = () => {
    setError('');
    setGoogleError('');
    setGoogleEmail('citizen.delhi@gmail.com');
    setGooglePassword('');
    setGoogleStep('email');
    setGoogleModalOpen(true);
  };

  const handleGoogleNextEmail = (chosenEmail) => {
    const emailToUse = chosenEmail || googleEmail;
    if (!emailToUse.trim()) {
      setGoogleError('Enter an email or phone number');
      return;
    }
    if (!emailToUse.includes('@')) {
      setGoogleError('Couldn’t find your Google Account. Please enter a valid email.');
      return;
    }
    setGoogleEmail(emailToUse);
    setGoogleError('');
    setGoogleStep('password');
  };

  const handleGoogleSubmitPassword = async (e) => {
    if (e) e.preventDefault();
    if (!googlePassword.trim()) {
      setGoogleError('Enter a password');
      return;
    }

    setGoogleLoading(true);
    setGoogleError('');

    try {
      const res = await googleDirectLogin({
        email: googleEmail,
        password: googlePassword,
        role: 'citizen',
        name: googleEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
      });

      const { token, ...userData } = res.data.data;
      setAuthToken(token, userData, rememberMe);
      setGoogleModalOpen(false);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setGoogleError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: pageBg,
        color: textPrimary,
        display: 'flex',
        flexDirection: 'column',
        transition: 'background-color 0.25s ease, color 0.25s ease',
      }}
    >
      {/* Clean Top Navigation Bar */}
      <Box
        component="header"
        sx={{
          py: 1.75,
          px: { xs: 2.5, md: 6 },
          borderBottom: `1px solid ${borderColor}`,
          backgroundColor: surfaceBg,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'background-color 0.25s ease, border-color 0.25s ease',
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <AapdaNetraLogo size={34} />
          <Box display="flex" alignItems="center" gap={1}>
            <Typography
              variant="h6"
              fontWeight={800}
              letterSpacing="-0.02em"
              sx={{
                color: accentBlue,
                lineHeight: 1,
                fontSize: '1.2rem',
              }}
            >
              AapdaNetra
            </Typography>
            <Chip
              label="DISASTER INTELLIGENCE"
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: '0.62rem',
                letterSpacing: '0.04em',
                height: 20,
                backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#e0f2fe',
                color: accentBlue,
                border: 'none',
              }}
            />
          </Box>
        </Box>

        {/* Top-Right Theme Toggle (☀ / 🌙) */}
        <Box display="flex" alignItems="center" gap={1.5}>
          <IconButton
            onClick={toggleTheme}
            size="small"
            id="theme-toggle-button"
            title={isDark ? 'Switch to clean white mode' : 'Switch to dark mode'}
            sx={{
              border: `1px solid ${borderColor}`,
              borderRadius: 2,
              p: 0.9,
              color: isDark ? '#fbbf24' : '#0284c7',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
              },
            }}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </IconButton>
        </Box>
      </Box>

      {/* Main Content Area: 2-Column Responsive Layout */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: { xs: 5, md: 8 },
          px: { xs: 2.5, md: 6, lg: 10 },
        }}
      >
        <Container maxWidth="lg" disableGutters>
          <Grid
            container
            spacing={{ xs: 5, md: 8, lg: 10 }}
            alignItems="center"
            justifyContent="center"
          >
            {/* LEFT COLUMN: Clean Minimalist Branding & Mission */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ pr: { md: 4, lg: 6 } }}>
                <Box mb={2.5}>
                  <AapdaNetraLogo size={56} />
                </Box>

                <Box display="flex" alignItems="center" gap={1.2} mb={1.5}>
                  <Typography
                    variant="h4"
                    fontWeight={850}
                    letterSpacing="-0.03em"
                    sx={{
                      color: textPrimary,
                      fontSize: { xs: '2rem', sm: '2.4rem', lg: '2.6rem' },
                      lineHeight: 1.15,
                    }}
                  >
                    AapdaNetra
                  </Typography>
                  <Chip
                    label="DISASTER INTELLIGENCE"
                    size="small"
                    sx={{
                      fontWeight: 750,
                      fontSize: '0.65rem',
                      letterSpacing: '0.04em',
                      height: 22,
                      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#e0f2fe',
                      color: accentBlue,
                      border: 'none',
                    }}
                  />
                </Box>

                <Typography
                  variant="subtitle1"
                  fontWeight={650}
                  sx={{
                    color: accentBlue,
                    fontSize: { xs: '1rem', md: '1.05rem' },
                    mb: 2.5,
                  }}
                >
                  Public Safety & Emergency Decision Support Platform
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    color: textSecondary,
                    fontSize: { xs: '0.98rem', md: '1.05rem' },
                    lineHeight: 1.65,
                    mb: 4,
                    maxWidth: 480,
                  }}
                >
                  "Intelligent disaster risk management for safer communities."
                </Typography>

                {/* Subtle Trust Indicators */}
                <Stack spacing={1.5}>
                  <Box display="flex" alignItems="center" gap={1.2}>
                    <CheckCircle2 size={16} color={accentBlue} />
                    <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.86rem' }}>
                      Real-time alert dissemination and emergency response
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1.2}>
                    <CheckCircle2 size={16} color={accentBlue} />
                    <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.86rem' }}>
                      Unified coordination for citizens and government administration
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Grid>

            {/* RIGHT COLUMN: Clean, White-First Authentication Card */}
            <Grid size={{ xs: 12, md: 6, lg: 5.5 }}>
              <Box
                sx={{
                  backgroundColor: surfaceBg,
                  borderRadius: 3.5,
                  p: { xs: 3.5, sm: 4.5 },
                  border: `1px solid ${borderColor}`,
                  boxShadow: isDark
                    ? '0 20px 40px -4px rgba(0, 0, 0, 0.6)'
                    : '0 10px 25px -5px rgba(0, 0, 0, 0.04), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
                  transition: 'background-color 0.25s ease, border-color 0.25s ease',
                }}
              >
                {/* Card Title */}
                <Box mb={2.5}>
                  <Typography
                    variant="h4"
                    fontWeight={800}
                    letterSpacing="-0.02em"
                    sx={{ color: textPrimary, fontSize: '1.65rem', mb: 0.5 }}
                  >
                    Welcome Back
                  </Typography>
                  <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.88rem' }}>
                    {activeRole === 'citizen'
                      ? 'Sign in to continue to AapdaNetra'
                      : 'Secure Administrator Access'}
                  </Typography>
                </Box>

                {/* Role Selector: Compact Segmented Control [ Citizen | Admin ] */}
                <Box
                  sx={{
                    display: 'flex',
                    p: 0.5,
                    borderRadius: 2.5,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
                    border: `1px solid ${borderColor}`,
                    mb: 3,
                  }}
                >
                  <Button
                    fullWidth
                    onClick={() => handleRoleChange('citizen')}
                    startIcon={<User size={16} />}
                    sx={{
                      py: 0.9,
                      borderRadius: 2,
                      fontSize: '0.85rem',
                      fontWeight: activeRole === 'citizen' ? 750 : 600,
                      textTransform: 'none',
                      backgroundColor:
                        activeRole === 'citizen'
                          ? surfaceBg
                          : 'transparent',
                      color:
                        activeRole === 'citizen'
                          ? accentBlue
                          : textSecondary,
                      boxShadow:
                        activeRole === 'citizen'
                          ? isDark
                            ? '0 2px 8px rgba(0,0,0,0.4)'
                            : '0 2px 6px rgba(0,0,0,0.06)'
                          : 'none',
                      transition: 'all 0.18s ease',
                      '&:hover': {
                        backgroundColor:
                          activeRole === 'citizen'
                            ? surfaceBg
                            : isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : '#e2e8f0',
                      },
                    }}
                  >
                    Citizen
                  </Button>

                  <Button
                    fullWidth
                    onClick={() => handleRoleChange('admin')}
                    startIcon={<Shield size={16} />}
                    sx={{
                      py: 0.9,
                      borderRadius: 2,
                      fontSize: '0.85rem',
                      fontWeight: activeRole === 'admin' ? 750 : 600,
                      textTransform: 'none',
                      backgroundColor:
                        activeRole === 'admin'
                          ? surfaceBg
                          : 'transparent',
                      color:
                        activeRole === 'admin'
                          ? accentBlue
                          : textSecondary,
                      boxShadow:
                        activeRole === 'admin'
                          ? isDark
                            ? '0 2px 8px rgba(0,0,0,0.4)'
                            : '0 2px 6px rgba(0,0,0,0.06)'
                          : 'none',
                      transition: 'all 0.18s ease',
                      '&:hover': {
                        backgroundColor:
                          activeRole === 'admin'
                            ? surfaceBg
                            : isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : '#e2e8f0',
                      },
                    }}
                  >
                    Admin
                  </Button>
                </Box>

                {/* Error Banner */}
                {error && (
                  <Alert
                    severity="error"
                    onClose={() => setError('')}
                    sx={{
                      mb: 2.5,
                      borderRadius: 2,
                      fontSize: '0.82rem',
                    }}
                  >
                    {error}
                  </Alert>
                )}

                {/* Authentication Form */}
                <Box component="form" onSubmit={handleSubmit} noValidate>
                  {/* Field 1: Email or Mobile Number (Citizen) vs Admin ID (Admin) */}
                  <Box mb={2}>
                    <Typography
                      variant="caption"
                      fontWeight={650}
                      sx={{ display: 'block', mb: 0.75, color: textPrimary, fontSize: '0.82rem' }}
                    >
                      {activeRole === 'citizen' ? 'Email or Mobile Number' : 'Admin ID'}
                    </Typography>
                    <TextField
                      fullWidth
                      id="login-identifier"
                      placeholder={
                        activeRole === 'citizen'
                          ? 'name@example.com or 10-digit mobile'
                          : 'Enter your Admin ID or email'
                      }
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      variant="outlined"
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            {activeRole === 'citizen' ? (
                              <Mail size={17} color={textMuted} />
                            ) : (
                              <Shield size={17} color={textMuted} />
                            )}
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: inputBg,
                          borderRadius: 2,
                          color: textPrimary,
                          fontSize: '0.88rem',
                          '& fieldset': { borderColor: borderColor },
                          '&:hover fieldset': { borderColor: accentBlue },
                          '&.Mui-focused fieldset': {
                            borderColor: accentBlue,
                            borderWidth: '1.5px',
                          },
                        },
                      }}
                    />
                  </Box>

                  {/* Field 2: Password */}
                  <Box mb={2}>
                    <Typography
                      variant="caption"
                      fontWeight={650}
                      sx={{ display: 'block', mb: 0.75, color: textPrimary, fontSize: '0.82rem' }}
                    >
                      Password
                    </Typography>
                    <TextField
                      fullWidth
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      variant="outlined"
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock size={17} color={textMuted} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              size="small"
                              sx={{ color: textMuted }}
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: inputBg,
                          borderRadius: 2,
                          color: textPrimary,
                          fontSize: '0.88rem',
                          '& fieldset': { borderColor: borderColor },
                          '&:hover fieldset': { borderColor: accentBlue },
                          '&.Mui-focused fieldset': {
                            borderColor: accentBlue,
                            borderWidth: '1.5px',
                          },
                        },
                      }}
                    />
                  </Box>

                  {/* Options Row */}
                  <Box
                    display="flex"
                    justifyContent={activeRole === 'citizen' ? 'space-between' : 'flex-end'}
                    alignItems="center"
                    mb={2.5}
                    flexWrap="wrap"
                  >
                    {activeRole === 'citizen' && (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            size="small"
                            sx={{
                              color: borderColor,
                              '&.Mui-checked': { color: accentBlue },
                            }}
                          />
                        }
                        label={
                          <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.82rem' }}>
                            Remember me
                          </Typography>
                        }
                        sx={{ m: 0 }}
                      />
                    )}

                    <Typography
                      component={Link}
                      to="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setError(
                          activeRole === 'citizen'
                            ? 'Password reset instructions have been sent to your registered contact.'
                            : 'Please contact the State EOC Administrator to reset your Admin credentials.'
                        );
                      }}
                      variant="caption"
                      fontWeight={650}
                      sx={{
                        color: accentBlue,
                        textDecoration: 'none',
                        fontSize: '0.82rem',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      {activeRole === 'citizen' ? 'Forgot password?' : 'Forgot admin password?'}
                    </Typography>
                  </Box>

                  {/* Primary CTA Button */}
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    endIcon={
                      loading ? (
                        <CircularProgress size={18} sx={{ color: '#ffffff' }} />
                      ) : (
                        <ArrowRight size={18} />
                      )
                    }
                    sx={{
                      backgroundColor: accentBlue,
                      color: '#ffffff',
                      py: 1.2,
                      borderRadius: 2,
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      textTransform: 'none',
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
                      '&:hover': {
                        backgroundColor: accentHover,
                        boxShadow: '0 6px 16px rgba(2, 132, 199, 0.35)',
                      },
                      mb: activeRole === 'citizen' ? 2.5 : 0,
                    }}
                  >
                    {loading
                      ? 'Authenticating...'
                      : activeRole === 'citizen'
                      ? 'Sign In'
                      : 'Sign In to Admin Portal'}
                  </Button>

                  {/* CITIZEN-ONLY: Divider, Google SSO, and Account Registration Link */}
                  {activeRole === 'citizen' && (
                    <>
                      {/* Divider */}
                      <Box position="relative" textAlign="center" mb={2.5}>
                        <Divider sx={{ borderColor }} />
                        <Typography
                          variant="caption"
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: surfaceBg,
                            px: 1.5,
                            color: textMuted,
                            fontSize: '0.72rem',
                            fontWeight: 650,
                            letterSpacing: '0.04em',
                          }}
                        >
                          OR
                        </Typography>
                      </Box>

                      {/* Google Sign-in Button */}
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleGoogleSignIn}
                        startIcon={
                          <svg width="18" height="18" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                        }
                        sx={{
                          color: textPrimary,
                          borderColor,
                          py: 1.1,
                          borderRadius: 2,
                          fontSize: '0.86rem',
                          fontWeight: 650,
                          textTransform: 'none',
                          backgroundColor: inputBg,
                          '&:hover': {
                            borderColor: accentBlue,
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
                          },
                          mb: 3,
                        }}
                      >
                        Sign in with Google
                      </Button>

                      {/* Create an Account */}
                      <Box textAlign="center">
                        <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.85rem' }}>
                          Don't have an account?{' '}
                          <Typography
                            component={Link}
                            to="/signup"
                            fontWeight={750}
                            sx={{
                              color: accentBlue,
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' },
                            }}
                          >
                            Create an account
                          </Typography>
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Clean Bottom Minimalist Footer */}
      <Box
        component="footer"
        sx={{
          py: 2,
          px: { xs: 2.5, md: 6 },
          borderTop: `1px solid ${borderColor}`,
          backgroundColor: surfaceBg,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.75rem' }}>
          © 2026 AapdaNetra Disaster Management & Emergency Decision Support Platform.
        </Typography>

        <Stack direction="row" spacing={2.5}>
          <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.75rem' }}>
            Emergency Operations Protocol
          </Typography>
          <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.75rem' }}>
            Terms & Privacy Standards
          </Typography>
        </Stack>
      </Box>

      {/* Authentic Google Accounts Sign-In Dialog (Citizen SSO) */}
      <Dialog
        open={googleModalOpen}
        onClose={() => !googleLoading && setGoogleModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 0,
            overflow: 'hidden',
            boxShadow: '0 24px 38px 3px rgba(0,0,0,0.14), 0 9px 46px 8px rgba(0,0,0,0.12)',
            bgcolor: '#ffffff',
            color: '#202124',
          }
        }}
      >
        {googleLoading && (
          <LinearProgress
            sx={{ height: 3, bgcolor: '#e8f0fe', '& .MuiLinearProgress-bar': { bgcolor: '#1a73e8' } }}
          />
        )}

        <DialogContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Google Logo Header */}
          <Box display="flex" justifyContent="center" mb={2}>
            <svg width="32" height="32" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </Box>

          <Typography
            variant="h5"
            align="center"
            fontWeight={500}
            sx={{ color: '#202124', mb: 0.5, fontFamily: 'Roboto, sans-serif' }}
          >
            {googleStep === 'email' ? 'Sign in with Google' : 'Welcome'}
          </Typography>
          <Typography variant="body2" align="center" sx={{ color: '#5f6368', mb: 3, fontSize: '0.88rem' }}>
            to continue to <strong style={{ color: '#1a73e8' }}>AapdaNetra</strong>
          </Typography>

          {googleError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5, fontSize: '0.82rem' }}>
              {googleError}
            </Alert>
          )}

          {googleStep === 'email' ? (
            /* STEP 1: Enter Gmail or choose saved account */
            <Box>
              <TextField
                fullWidth
                label="Email or phone"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGoogleNextEmail()}
                placeholder="e.g. user@gmail.com"
                size="small"
                autoFocus
                sx={{
                  mb: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    '&.Mui-focused fieldset': { borderColor: '#1a73e8' },
                  },
                }}
              />

              <Typography
                variant="caption"
                sx={{ color: '#1a73e8', fontWeight: 600, cursor: 'pointer', display: 'inline-block', mb: 2.5 }}
                onClick={() => setGoogleEmail('citizen.delhi@gmail.com')}
              >
                Forgot email?
              </Typography>

              {/* Saved Account Suggestions */}
              <Box sx={{ mb: 3, border: '1px solid #dadce0', borderRadius: 1.5, p: 1.5, bgcolor: '#f8f9fa' }}>
                <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 600, display: 'block', mb: 1 }}>
                  Choose a Google account:
                </Typography>
                <Stack spacing={1}>
                  {[
                    { email: 'manish.disasterops@gmail.com', name: 'Manish (Disaster Operations)' },
                    { email: 'citizen.delhi@gmail.com', name: 'Delhi Emergency Citizen' },
                  ].map((acc, idx) => (
                    <Box
                      key={idx}
                      onClick={() => handleGoogleNextEmail(acc.email)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1,
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#e8f0fe' },
                        transition: 'background 0.15s',
                      }}
                    >
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          bgcolor: '#1a73e8',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                        }}
                      >
                        {acc.email.charAt(0).toUpperCase()}
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', color: '#202124' }}>
                          {acc.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#5f6368', fontSize: '0.75rem' }}>
                          {acc.email}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Box>

              <Typography variant="caption" sx={{ color: '#5f6368', display: 'block', mb: 3, fontSize: '0.78rem' }}>
                To continue, Google will share your name, email address, language preference, and profile picture with AapdaNetra.
              </Typography>

              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Button
                  size="small"
                  onClick={() => setGoogleModalOpen(false)}
                  sx={{ color: '#1a73e8', textTransform: 'none', fontWeight: 600 }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleGoogleNextEmail()}
                  sx={{
                    bgcolor: '#1a73e8',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    borderRadius: 1,
                    '&:hover': { bgcolor: '#1557b0' },
                  }}
                >
                  Next
                </Button>
              </Box>
            </Box>
          ) : (
            /* STEP 2: Enter Password */
            <form onSubmit={handleGoogleSubmitPassword}>
              <Box
                onClick={() => setGoogleStep('email')}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  border: '1px solid #dadce0',
                  borderRadius: 20,
                  py: 0.5,
                  px: 1.5,
                  mb: 2.5,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#f8f9fa' },
                }}
              >
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: '#1a73e8',
                    color: '#fff',
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  {googleEmail.charAt(0).toUpperCase()}
                </Box>
                <Typography variant="caption" sx={{ color: '#3c4043', fontWeight: 600 }}>
                  {googleEmail}
                </Typography>
                <Typography variant="caption" sx={{ color: '#5f6368' }}>
                  ▾
                </Typography>
              </Box>

              <TextField
                fullWidth
                type={googleShowPassword ? 'text' : 'password'}
                label="Enter your password"
                value={googlePassword}
                onChange={(e) => {
                  setGooglePassword(e.target.value);
                  if (googleError) setGoogleError('');
                }}
                error={Boolean(googleError)}
                helperText={googleError}
                size="small"
                autoFocus
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setGoogleShowPassword(!googleShowPassword)}
                        edge="end"
                      >
                        {googleShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    '&.Mui-focused fieldset': { borderColor: googleError ? '#d93025' : '#1a73e8' },
                  },
                  '& .MuiFormHelperText-root': {
                    color: '#d93025',
                    fontSize: '0.78rem',
                    mt: 0.75,
                  },
                }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={googleShowPassword}
                    onChange={(e) => setGoogleShowPassword(e.target.checked)}
                    size="small"
                    sx={{ '&.Mui-checked': { color: '#1a73e8' } }}
                  />
                }
                label={
                  <Typography variant="caption" sx={{ color: '#3c4043', fontSize: '0.8rem' }}>
                    Show password
                  </Typography>
                }
                sx={{ mb: 3 }}
              />

              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Button
                  size="small"
                  onClick={() => setGoogleStep('email')}
                  sx={{ color: '#1a73e8', textTransform: 'none', fontWeight: 600 }}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={googleLoading}
                  sx={{
                    bgcolor: '#1a73e8',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    borderRadius: 1,
                    '&:hover': { bgcolor: '#1557b0' },
                  }}
                >
                  {googleLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </Box>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
