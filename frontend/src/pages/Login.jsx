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
  Settings,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sun,
  Moon,
  Users,
  Navigation,
  Activity,
  CheckCircle2,
  Building2,
  Droplets,
  AlertTriangle,
  X
} from 'lucide-react';
import { loginUser, googleDirectLogin } from '../services/api';
import { setAuthToken } from '../lib/auth';
import { useThemeMode } from '../context/ThemeContext';
import AapdaNetraLogo from '../components/AapdaNetraLogo';

const ROLE_OPTIONS = [
  {
    id: 'citizen',
    label: 'Citizen',
    sublabel: 'Resident',
    icon: User,
    email: 'citizen@aapdanetra.in',
    password: 'password123'
  },
  {
    id: 'volunteer',
    label: 'Volunteer',
    sublabel: 'Field Support',
    icon: Users,
    email: 'field@aapdanetra.in',
    password: 'password123'
  },
  {
    id: 'responder',
    label: 'Responder',
    sublabel: 'NDRF / SDRF',
    icon: Shield,
    email: 'officer@aapdanetra.in',
    password: 'password123'
  },
  {
    id: 'administrator',
    label: 'Administrator',
    sublabel: 'EOC Command',
    icon: Settings,
    email: 'admin@aapdanetra.in',
    password: 'password123'
  }
];

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDark, toggleTheme } = useThemeMode();

  const [activeRole, setActiveRole] = useState('citizen');
  const [identifier, setIdentifier] = useState('citizen@aapdanetra.in');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Read error parameter if redirected back from Google OAuth
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  // Colors for clean white-first SaaS aesthetic
  const pageBg = isDark ? '#080c14' : '#f8fafc';
  const surfaceBg = isDark ? '#0f172a' : '#ffffff';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#475569';
  const textMuted = isDark ? '#64748b' : '#94a3b8';
  const inputBg = isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff';

  const handleRoleSelect = (role) => {
    setActiveRole(role.id);
    setIdentifier(role.email);
    setPassword(role.password);
    setError('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your email or mobile number and password.');
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

  // Google SSO Modal State (ChatGPT / Swiggy style)
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googlePassword, setGooglePassword] = useState('');
  const [googleShowPassword, setGoogleShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [googleStep, setGoogleStep] = useState('email'); // 'email' or 'password'

  const handleGoogleSignIn = () => {
    setError('');
    setGoogleError('');
    setGoogleEmail(activeRole === 'citizen' ? 'citizen.delhi@gmail.com' : `${activeRole}.delhi@gmail.com`);
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
        role: activeRole,
        name: googleEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
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
      {/* Top Header */}
      <Box
        component="header"
        sx={{
          py: 2,
          px: { xs: 2.5, md: 5 },
          borderBottom: `1px solid ${borderColor}`,
          backgroundColor: surfaceBg,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'background-color 0.25s ease, border-color 0.25s ease',
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <AapdaNetraLogo size={36} />
          <Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography
                variant="h6"
                fontWeight={800}
                letterSpacing="-0.02em"
                sx={{
                  color: isDark ? '#38bdf8' : '#0284c7',
                  lineHeight: 1.1,
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
                  height: 18,
                  backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#e0f2fe',
                  color: isDark ? '#38bdf8' : '#0284c7',
                  border: 'none',
                }}
              />
            </Box>
            <Typography
              variant="caption"
              sx={{ color: textSecondary, display: { xs: 'none', sm: 'block' }, fontSize: '0.75rem' }}
            >
              Public Safety & Emergency Decision Support Platform
            </Typography>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={1.5}>
          {/* Status Indicator */}
          <Box
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 0.6,
              borderRadius: 20,
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5',
              border: isDark ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid #d1fae5',
            }}
          >
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981',
              }}
            />
            <Typography variant="caption" fontWeight={600} sx={{ color: '#059669', fontSize: '0.72rem' }}>
              Telemetry Active
            </Typography>
          </Box>

          {/* Theme Toggle */}
          <IconButton
            onClick={toggleTheme}
            size="small"
            title={isDark ? 'Switch to clean white mode' : 'Switch to dark mode'}
            sx={{
              border: `1px solid ${borderColor}`,
              borderRadius: 2,
              p: 0.9,
              color: isDark ? '#fbbf24' : '#0284c7',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
              },
            }}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </IconButton>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          py: { xs: 4, md: 5 },
          px: { xs: 2.5, md: 5, lg: 8 },
        }}
      >
        <Container maxWidth="xl" disableGutters>
          <Grid container spacing={{ xs: 4, md: 5, lg: 7 }} alignItems="center">
            {/* Left Side: Human-Designed Live Disaster Operations Cockpit UI (Zero AI Images) */}
            <Grid size={{ xs: 12, md: 6, lg: 6.5 }}>
              <Box sx={{ pr: { md: 2, lg: 4 } }}>
                {/* Eyebrow */}
                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: '#0284c7',
                    }}
                  />
                  <Typography
                    variant="caption"
                    fontWeight={800}
                    sx={{
                      color: isDark ? '#38bdf8' : '#0284c7',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                    }}
                  >
                    DISASTER INTELLIGENCE PLATFORM
                  </Typography>
                </Box>

                {/* Main Headline requested by user */}
                <Typography
                  variant="h3"
                  fontWeight={850}
                  letterSpacing="-0.03em"
                  sx={{
                    color: textPrimary,
                    lineHeight: 1.15,
                    fontSize: { xs: '2rem', sm: '2.4rem', lg: '2.75rem' },
                    mb: 1.75,
                  }}
                >
                  One Platform.{' '}
                  <Box
                    component="span"
                    sx={{
                      background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Faster Response.
                  </Box>{' '}
                  Safer Communities.
                </Typography>

                {/* Supporting description requested by user */}
                <Typography
                  variant="body1"
                  sx={{
                    color: textSecondary,
                    fontSize: { xs: '0.92rem', md: '1rem' },
                    lineHeight: 1.6,
                    mb: 3,
                    maxWidth: 580,
                  }}
                >
                  AapdaNetra connects citizens, volunteers, responders, and administrators during disasters — delivering real-time predictive hazard intelligence, priority triage, and safe evacuation corridors when every second counts.
                </Typography>

                {/* Human-Crafted Interactive Tactical Map & Telemetry Dashboard Card */}
                <Box
                  sx={{
                    borderRadius: 3,
                    p: 2.5,
                    backgroundColor: surfaceBg,
                    border: `1px solid ${borderColor}`,
                    boxShadow: isDark
                      ? '0 16px 36px rgba(0, 0, 0, 0.5)'
                      : '0 8px 24px rgba(15, 23, 42, 0.06)',
                    mb: 3,
                  }}
                >
                  {/* Top Bar of the Cockpit */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={1.2}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#ef4444',
                          boxShadow: '0 0 10px #ef4444',
                        }}
                      />
                      <Typography variant="subtitle2" fontWeight={800} sx={{ color: textPrimary, fontSize: '0.86rem' }}>
                        LIVE INCIDENT SECTOR: YAMUNA BASIN R-12
                      </Typography>
                    </Box>
                    <Chip
                      label="PRIORITY 1: CRITICAL"
                      size="small"
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.64rem',
                        height: 20,
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                      }}
                    />
                  </Box>

                  {/* Clean SVG Tactical Geospatial Visualization Canvas */}
                  <Box
                    sx={{
                      height: 180,
                      borderRadius: 2,
                      backgroundColor: isDark ? '#090f1d' : '#f1f5f9',
                      border: `1px solid ${borderColor}`,
                      position: 'relative',
                      overflow: 'hidden',
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {/* SVG Vector Map Elements */}
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 500 180"
                      preserveAspectRatio="none"
                      style={{ position: 'absolute', inset: 0 }}
                    >
                      {/* Grid Lines */}
                      <defs>
                        <pattern id="gridPattern" width="30" height="30" patternUnits="userSpaceOnUse">
                          <path
                            d="M 30 0 L 0 0 0 30"
                            fill="none"
                            stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}
                            strokeWidth="1"
                          />
                        </pattern>
                      </defs>
                      <rect width="500" height="180" fill="url(#gridPattern)" />

                      {/* River Inundation Boundary */}
                      <path
                        d="M -10,95 Q 120,40 240,110 T 520,70 L 520,190 L -10,190 Z"
                        fill={isDark ? 'rgba(2, 132, 199, 0.18)' : 'rgba(2, 132, 199, 0.12)'}
                        stroke={isDark ? '#0284c7' : '#38bdf8'}
                        strokeWidth="1.5"
                      />

                      {/* Severe Flood Hazard Perimeter */}
                      <ellipse
                        cx="170"
                        cy="115"
                        rx="95"
                        ry="40"
                        fill="rgba(239, 68, 68, 0.14)"
                        stroke="#ef4444"
                        strokeWidth="1.5"
                        strokeDasharray="4,4"
                      />

                      {/* Safe Evacuation Route Corridor */}
                      <path
                        d="M 170,115 L 260,75 L 370,45 L 440,35"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeDasharray="6,4"
                      />
                    </svg>

                    {/* Interactive Overlay Markers */}
                    {/* Hotspot Pin */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: '34%',
                        top: '58%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        px: 1,
                        py: 0.3,
                        borderRadius: 1.5,
                        boxShadow: '0 4px 10px rgba(239,68,68,0.4)',
                      }}
                    >
                      <AlertTriangle size={12} />
                      <Typography variant="caption" fontWeight={800} sx={{ fontSize: '0.65rem' }}>
                        Inundated Ward (88/100)
                      </Typography>
                    </Box>

                    {/* Safe Shelter Pin */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: '88%',
                        top: '20%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        backgroundColor: '#10b981',
                        color: '#fff',
                        px: 1,
                        py: 0.3,
                        borderRadius: 1.5,
                        boxShadow: '0 4px 10px rgba(16,185,129,0.4)',
                      }}
                    >
                      <Building2 size={12} />
                      <Typography variant="caption" fontWeight={800} sx={{ fontSize: '0.65rem' }}>
                        Safe Shelter (380 Beds)
                      </Typography>
                    </Box>

                    {/* Evacuation Route Marker */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: '56%',
                        top: '36%',
                        backgroundColor: isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.92)',
                        border: '1px solid #10b981',
                        borderRadius: 1,
                        px: 0.8,
                        py: 0.2,
                        color: '#10b981',
                      }}
                    >
                      <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.62rem' }}>
                        ← Safe Corridor (Ring Road)
                      </Typography>
                    </Box>
                  </Box>

                  {/* Operational Telemetry Metrics 3-Grid */}
                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 4 }}>
                      <Box
                        sx={{
                          p: 1.25,
                          borderRadius: 2,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                          border: `1px solid ${borderColor}`,
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={0.5} mb={0.3}>
                          <Droplets size={13} color="#0284c7" />
                          <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.68rem', fontWeight: 600 }}>
                            RIVER STAGE
                          </Typography>
                        </Box>
                        <Typography variant="subtitle2" fontWeight={800} sx={{ color: textPrimary, fontSize: '0.85rem' }}>
                          205.85m <span style={{ color: '#ef4444', fontSize: '0.72rem' }}>(+0.52m)</span>
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 4 }}>
                      <Box
                        sx={{
                          p: 1.25,
                          borderRadius: 2,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                          border: `1px solid ${borderColor}`,
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={0.5} mb={0.3}>
                          <Activity size={13} color="#ea580c" />
                          <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.68rem', fontWeight: 600 }}>
                            EARLY WARNING
                          </Typography>
                        </Box>
                        <Typography variant="subtitle2" fontWeight={800} sx={{ color: textPrimary, fontSize: '0.85rem' }}>
                          88 Min <span style={{ color: textSecondary, fontSize: '0.72rem' }}>Lead Time</span>
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 4 }}>
                      <Box
                        sx={{
                          p: 1.25,
                          borderRadius: 2,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                          border: `1px solid ${borderColor}`,
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={0.5} mb={0.3}>
                          <Building2 size={13} color="#10b981" />
                          <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.68rem', fontWeight: 600 }}>
                            SHELTER INTAKE
                          </Typography>
                        </Box>
                        <Typography variant="subtitle2" fontWeight={800} sx={{ color: textPrimary, fontSize: '0.85rem' }}>
                          380 Beds <span style={{ color: '#10b981', fontSize: '0.72rem' }}>Ready</span>
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {/* 3 Core Architecture Pillars */}
                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={1}
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 2,
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
                      border: `1px solid ${borderColor}`,
                    }}
                  >
                    <CheckCircle2 size={15} color={isDark ? '#38bdf8' : '#0284c7'} />
                    <Typography variant="caption" fontWeight={650} sx={{ color: textSecondary, fontSize: '0.75rem' }}>
                      Predictive Time-Series Forecasts
                    </Typography>
                  </Box>

                  <Box
                    display="flex"
                    alignItems="center"
                    gap={1}
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 2,
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
                      border: `1px solid ${borderColor}`,
                    }}
                  >
                    <CheckCircle2 size={15} color="#10b981" />
                    <Typography variant="caption" fontWeight={650} sx={{ color: textSecondary, fontSize: '0.75rem' }}>
                      Smart Multi-Criteria Shelter Ranking
                    </Typography>
                  </Box>

                  <Box
                    display="flex"
                    alignItems="center"
                    gap={1}
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 2,
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
                      border: `1px solid ${borderColor}`,
                    }}
                  >
                    <CheckCircle2 size={15} color="#ea580c" />
                    <Typography variant="caption" fontWeight={650} sx={{ color: textSecondary, fontSize: '0.75rem' }}>
                      Grounded AI Copilot
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Grid>

            {/* Right Side: Elegant White-First Login Card */}
            <Grid size={{ xs: 12, md: 6, lg: 5.5 }}>
              <Box
                sx={{
                  backgroundColor: surfaceBg,
                  borderRadius: 3.5,
                  p: { xs: 3, sm: 4, lg: 4.5 },
                  border: `1px solid ${borderColor}`,
                  boxShadow: isDark
                    ? '0 20px 40px -4px rgba(0, 0, 0, 0.6)'
                    : '0 10px 30px -4px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(0, 0, 0, 0.02)',
                  transition: 'background-color 0.25s ease, border-color 0.25s ease',
                }}
              >
                {/* Card Header */}
                <Box mb={3}>
                  <Typography
                    variant="h4"
                    fontWeight={800}
                    letterSpacing="-0.02em"
                    sx={{ color: textPrimary, fontSize: '1.75rem', mb: 0.75 }}
                  >
                    Welcome Back
                  </Typography>
                  <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.88rem' }}>
                    Select your portal role and sign in to access your dashboard.
                  </Typography>
                </Box>

                {/* Role Selector Tabs (4 roles) */}
                <Box mb={3}>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{
                      display: 'block',
                      mb: 1,
                      color: textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontSize: '0.7rem',
                    }}
                  >
                    Select Operating Role
                  </Typography>

                  <Grid container spacing={1}>
                    {ROLE_OPTIONS.map((role) => {
                      const Icon = role.icon;
                      const isSelected = activeRole === role.id;

                      return (
                        <Grid size={{ xs: 6, sm: 3 }} key={role.id}>
                          <Box
                            onClick={() => handleRoleSelect(role)}
                            sx={{
                              p: 1.25,
                              borderRadius: 2.5,
                              cursor: 'pointer',
                              border: isSelected
                                ? `2px solid ${isDark ? '#38bdf8' : '#0284c7'}`
                                : `1px solid ${borderColor}`,
                              backgroundColor: isSelected
                                ? (isDark ? 'rgba(56, 189, 248, 0.1)' : '#f0f9ff')
                                : inputBg,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              textAlign: 'center',
                              gap: 0.5,
                              transition: 'all 0.18s ease',
                              '&:hover': {
                                borderColor: isSelected
                                  ? (isDark ? '#38bdf8' : '#0284c7')
                                  : (isDark ? 'rgba(255, 255, 255, 0.2)' : '#cbd5e1'),
                                transform: 'translateY(-1px)',
                              },
                            }}
                          >
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: isSelected
                                  ? (isDark ? 'rgba(56, 189, 248, 0.2)' : '#e0f2fe')
                                  : (isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9'),
                                color: isSelected
                                  ? (isDark ? '#38bdf8' : '#0284c7')
                                  : textSecondary,
                              }}
                            >
                              <Icon size={16} />
                            </Box>
                            <Typography
                              variant="body2"
                              fontWeight={isSelected ? 750 : 600}
                              sx={{
                                fontSize: '0.78rem',
                                color: isSelected
                                  ? (isDark ? '#38bdf8' : '#0284c7')
                                  : textPrimary,
                              }}
                            >
                              {role.label}
                            </Typography>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
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

                {/* Login Form */}
                <Box component="form" onSubmit={handleSubmit} noValidate>
                  {/* Email or Mobile Field */}
                  <Box mb={2}>
                    <Typography
                      variant="caption"
                      fontWeight={650}
                      sx={{ display: 'block', mb: 0.75, color: textPrimary, fontSize: '0.82rem' }}
                    >
                      Email or Mobile Number
                    </Typography>
                    <TextField
                      fullWidth
                      id="login-identifier"
                      placeholder="name@aapdanetra.in or +91 98765 43210"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      variant="outlined"
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Mail size={17} color={textMuted} />
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
                          '&:hover fieldset': { borderColor: isDark ? '#38bdf8' : '#0284c7' },
                          '&.Mui-focused fieldset': {
                            borderColor: isDark ? '#38bdf8' : '#0284c7',
                            borderWidth: '1.5px',
                          },
                        },
                      }}
                    />
                  </Box>

                  {/* Password Field */}
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
                          '&:hover fieldset': { borderColor: isDark ? '#38bdf8' : '#0284c7' },
                          '&.Mui-focused fieldset': {
                            borderColor: isDark ? '#38bdf8' : '#0284c7',
                            borderWidth: '1.5px',
                          },
                        },
                      }}
                    />
                  </Box>

                  {/* Remember Me & Forgot Password Row */}
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2.5}
                    flexWrap="wrap"
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          size="small"
                          sx={{
                            color: borderColor,
                            '&.Mui-checked': { color: isDark ? '#38bdf8' : '#0284c7' },
                          }}
                        />
                      }
                      label={
                        <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.82rem' }}>
                          Remember me for 30 days
                        </Typography>
                      }
                      sx={{ m: 0 }}
                    />

                    <Typography
                      component={Link}
                      to="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setError('Password reset instructions have been sent to your registered contact.');
                      }}
                      variant="caption"
                      fontWeight={650}
                      sx={{
                        color: isDark ? '#38bdf8' : '#0284c7',
                        textDecoration: 'none',
                        fontSize: '0.82rem',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      Forgot password?
                    </Typography>
                  </Box>

                  {/* Primary Sign In CTA Button */}
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
                      background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                      color: '#ffffff',
                      py: 1.25,
                      borderRadius: 2,
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      textTransform: 'none',
                      boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%)',
                        boxShadow: '0 6px 18px rgba(2, 132, 199, 0.4)',
                      },
                      mb: 2.5,
                    }}
                  >
                    {loading ? 'Authenticating...' : 'Sign In to Portal'}
                  </Button>

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
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                      }}
                    >
                      OR CONTINUE WITH
                    </Typography>
                  </Box>

                  {/* Google SSO Button (Initiates official full-page Google OAuth 2.0 redirect) */}
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
                      fontSize: '0.85rem',
                      fontWeight: 650,
                      textTransform: 'none',
                      backgroundColor: inputBg,
                      '&:hover': {
                        borderColor: isDark ? '#38bdf8' : '#0284c7',
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
                      },
                      mb: 3,
                    }}
                  >
                    Sign in with Google
                  </Button>

                  {/* Secondary Option: Create an account */}
                  <Box textAlign="center">
                    <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.85rem' }}>
                      Don't have an account?{' '}
                      <Typography
                        component={Link}
                        to="/signup"
                        fontWeight={750}
                        sx={{
                          color: isDark ? '#38bdf8' : '#0284c7',
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        Create an account
                      </Typography>
                    </Typography>
                  </Box>
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
          px: { xs: 2.5, md: 5 },
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
          © 2026 AapdaNetra Disaster Management & AI Decision Support Platform.
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
      {/* Authentic Google Accounts Sign-In Dialog (Like ChatGPT & Swiggy) */}
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
        {googleLoading && <LinearProgress sx={{ height: 3, bgcolor: '#e8f0fe', '& .MuiLinearProgress-bar': { bgcolor: '#1a73e8' } }} />}
        
        <DialogContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Google Logo Header */}
          <Box display="flex" justifyContent="center" mb={2}>
            <svg width="32" height="32" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          </Box>

          <Typography variant="h5" align="center" fontWeight={500} sx={{ color: '#202124', mb: 0.5, fontFamily: 'Roboto, sans-serif' }}>
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
                    '&.Mui-focused fieldset': { borderColor: '#1a73e8' }
                  }
                }}
              />

              <Typography
                variant="caption"
                sx={{ color: '#1a73e8', fontWeight: 600, cursor: 'pointer', display: 'inline-block', mb: 2.5 }}
                onClick={() => setGoogleEmail('citizen.delhi@gmail.com')}
              >
                Forgot email?
              </Typography>

              {/* Quick Account Suggestions */}
              <Box sx={{ mb: 3, border: '1px solid #dadce0', borderRadius: 1.5, p: 1.5, bgcolor: '#f8f9fa' }}>
                <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 600, display: 'block', mb: 1 }}>
                  Choose a Google account:
                </Typography>
                <Stack spacing={1}>
                  {[
                    { email: 'manish.disasterops@gmail.com', name: 'Manish (Disaster Operations)' },
                    { email: `${activeRole}.delhi@gmail.com`, name: `Delhi Emergency ${activeRole.charAt(0).toUpperCase() + activeRole.slice(1)}` }
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
                        transition: 'background 0.15s'
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
                          fontSize: '0.8rem'
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
                    '&:hover': { bgcolor: '#1557b0' }
                  }}
                >
                  Next
                </Button>
              </Box>
            </Box>
          ) : (
            /* STEP 2: Enter Password */
            <form onSubmit={handleGoogleSubmitPassword}>
              {/* Selected account pill */}
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
                  '&:hover': { bgcolor: '#f8f9fa' }
                }}
              >
                <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#1a73e8', color: '#fff', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                  {googleEmail.charAt(0).toUpperCase()}
                </Box>
                <Typography variant="caption" sx={{ color: '#3c4043', fontWeight: 600 }}>
                  {googleEmail}
                </Typography>
                <Typography variant="caption" sx={{ color: '#5f6368' }}>▾</Typography>
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
                  )
                }}
                sx={{
                  mb: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    '&.Mui-focused fieldset': { borderColor: googleError ? '#d93025' : '#1a73e8' }
                  },
                  '& .MuiFormHelperText-root': {
                    color: '#d93025',
                    fontSize: '0.78rem',
                    mt: 0.75
                  }
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
                label={<Typography variant="caption" sx={{ color: '#3c4043', fontSize: '0.8rem' }}>Show password</Typography>}
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
                    '&:hover': { bgcolor: '#1557b0' }
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
