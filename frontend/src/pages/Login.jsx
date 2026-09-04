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
  Stack,
  Dialog,
  DialogContent,
  LinearProgress
} from '@mui/material';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react';
import { loginUser, googleDirectLogin } from '../services/api';
import { setAuthToken } from '../lib/auth';
import { useThemeMode } from '../context/ThemeContext';
import aapdaHeroBg from '../assets/aapda_hero_bg.jpg';

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

  // Info Modal State for Navbar Links
  const [infoModal, setInfoModal] = useState(null); // 'about' | 'how-it-works' | 'contact' | null

  // Read error parameter if redirected back from OAuth
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  // Color Tokens matching exact design mockup
  const primaryBrandBlue = '#0065ff';
  const brandDarkNavy = isDark ? '#f8fafc' : '#091e42';
  const brandSecondaryNavy = isDark ? '#cbd5e1' : '#42526e';
  const brandMutedText = isDark ? '#94a3b8' : '#5e6c84';
  const cardBg = isDark ? '#0f172a' : '#ffffff';
  const inputBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : '#dfe1e6';
  const inputBg = isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff';

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
        fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
        backgroundColor: isDark ? '#080c14' : '#ffffff',
        color: brandDarkNavy,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* 1. TOP NAVBAR MATCHING MOCKUP */}
      <Box
        component="header"
        sx={{
          py: 1.6,
          px: { xs: 2.5, md: 6, lg: 8 },
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #ebecf0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        {/* Left: AapdaNetra Brand Lockup + Separator + Description */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography
              component="div"
              sx={{
                fontWeight: 850,
                letterSpacing: '-0.03em',
                fontSize: { xs: '1.35rem', sm: '1.5rem' },
                lineHeight: 1,
                color: brandDarkNavy,
              }}
            >
              Aapda<Box component="span" sx={{ color: primaryBrandBlue }}>Netra</Box>
            </Typography>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '0.62rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: brandMutedText,
                lineHeight: 1,
                mt: 0.4,
              }}
            >
              DISASTER INTELLIGENCE
            </Typography>
          </Box>

          {/* Thin Vertical Separator */}
          <Box
            sx={{
              display: { xs: 'none', md: 'block' },
              width: '1px',
              height: 28,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#dfe1e6',
              mx: 2.5,
            }}
          />

          {/* 2-line Subtitle in Navbar */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column' }}>
            <Typography
              sx={{
                fontSize: '0.76rem',
                fontWeight: 600,
                color: brandSecondaryNavy,
                lineHeight: 1.25,
              }}
            >
              Public Safety & Emergency
            </Typography>
            <Typography
              sx={{
                fontSize: '0.76rem',
                fontWeight: 600,
                color: brandSecondaryNavy,
                lineHeight: 1.25,
              }}
            >
              Decision Support Platform
            </Typography>
          </Box>
        </Box>

        {/* Right: Nav Links (Home, About, How It Works, Contact) + Theme Toggle Pill */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 4 } }}>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 3.5 }}>
            <Typography
              component={Link}
              to="/"
              sx={{
                fontSize: '0.86rem',
                fontWeight: 650,
                color: primaryBrandBlue,
                textDecoration: 'none',
                position: 'relative',
                pb: 0.6,
                borderBottom: `2.5px solid ${primaryBrandBlue}`,
              }}
            >
              Home
            </Typography>

            <Typography
              onClick={() => setInfoModal('about')}
              sx={{
                fontSize: '0.86rem',
                fontWeight: 550,
                color: brandSecondaryNavy,
                cursor: 'pointer',
                transition: 'color 0.15s ease',
                '&:hover': { color: primaryBrandBlue },
              }}
            >
              About
            </Typography>

            <Typography
              onClick={() => setInfoModal('how-it-works')}
              sx={{
                fontSize: '0.86rem',
                fontWeight: 550,
                color: brandSecondaryNavy,
                cursor: 'pointer',
                transition: 'color 0.15s ease',
                '&:hover': { color: primaryBrandBlue },
              }}
            >
              How It Works
            </Typography>

            <Typography
              onClick={() => setInfoModal('contact')}
              sx={{
                fontSize: '0.86rem',
                fontWeight: 550,
                color: brandSecondaryNavy,
                cursor: 'pointer',
                transition: 'color 0.15s ease',
                '&:hover': { color: primaryBrandBlue },
              }}
            >
              Contact
            </Typography>
          </Box>

          {/* Clean Rounded Pill Theme Toggle */}
          <Box
            onClick={toggleTheme}
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f4f5f7',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #dfe1e6',
              borderRadius: 20,
              p: '3px',
              cursor: 'pointer',
              gap: '2px',
              transition: 'all 0.2s ease',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 26,
                height: 26,
                borderRadius: '50%',
                backgroundColor: !isDark ? '#ffffff' : 'transparent',
                boxShadow: !isDark ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                color: !isDark ? '#f59e0b' : '#94a3b8',
                transition: 'all 0.2s ease',
              }}
            >
              <Sun size={15} />
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 26,
                height: 26,
                borderRadius: '50%',
                backgroundColor: isDark ? '#1e293b' : 'transparent',
                boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                color: isDark ? '#38bdf8' : '#94a3b8',
                transition: 'all 0.2s ease',
              }}
            >
              <Moon size={15} />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* 2. FULL-BLEED HERO BACKGROUND & MAIN CONTENT */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          py: { xs: 4, md: 6, lg: 8 },
          px: { xs: 2.5, md: 6, lg: 8 },
          backgroundImage: isDark
            ? `linear-gradient(180deg, rgba(8, 12, 20, 0.72) 0%, rgba(8, 12, 20, 0.88) 55%, #080c14 100%), url(${aapdaHeroBg})`
            : `linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.45) 50%, rgba(255, 255, 255, 0.95) 85%, #ffffff 100%), url(${aapdaHeroBg})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'top center',
          backgroundSize: 'cover',
        }}
      >
        <Container maxWidth="xl" disableGutters sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={{ xs: 4, md: 6, lg: 8 }} alignItems="center">
            {/* LEFT COLUMN: Clean Typography, Brand Identity, Pillars & Floating Sticker */}
            <Grid size={{ xs: 12, md: 6.5 }}>
              <Box sx={{ pr: { md: 2, lg: 5 } }}>
                {/* Eyebrow */}
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.74rem',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: primaryBrandBlue,
                    mb: 1.5,
                  }}
                >
                  SAFER PEOPLE &nbsp;|&nbsp; STRONGER COMMUNITIES
                </Typography>

                {/* Primary Brand Headline */}
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 850,
                    letterSpacing: '-0.035em',
                    color: brandDarkNavy,
                    fontSize: { xs: '2.5rem', sm: '3.4rem', lg: '4rem' },
                    lineHeight: 1.05,
                    mb: 1.5,
                  }}
                >
                  Aapda<Box component="span" sx={{ color: primaryBrandBlue }}>Netra</Box>
                </Typography>

                {/* Platform Subtitle */}
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 750,
                    color: brandDarkNavy,
                    fontSize: { xs: '1.15rem', sm: '1.35rem', lg: '1.5rem' },
                    lineHeight: 1.25,
                    mb: 1.5,
                  }}
                >
                  Public Safety & Emergency Decision Support Platform
                </Typography>

                {/* Mission Statement */}
                <Typography
                  sx={{
                    color: brandSecondaryNavy,
                    fontSize: { xs: '0.98rem', md: '1.1rem' },
                    lineHeight: 1.5,
                    maxWidth: 520,
                    mb: 2,
                  }}
                >
                  Intelligent disaster risk management for a safer, more resilient India.
                </Typography>

                {/* Blue Accent Bar */}
                <Box
                  sx={{
                    width: 42,
                    height: 3.5,
                    backgroundColor: primaryBrandBlue,
                    borderRadius: 2,
                    mb: 3,
                  }}
                />

                {/* 3 Value Pillars Side-by-Side */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: { xs: 2, sm: 2.5 },
                    mb: 4,
                  }}
                >
                  {/* Pillar 1 */}
                  <Box>
                    <Typography sx={{ fontWeight: 750, fontSize: '0.86rem', color: brandDarkNavy }}>
                      Anticipate Risks
                    </Typography>
                    <Typography sx={{ fontSize: '0.78rem', color: brandMutedText }}>
                      Data-driven insights
                    </Typography>
                  </Box>

                  <Box sx={{ width: '1px', height: 26, backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#dfe1e6' }} />

                  {/* Pillar 2 */}
                  <Box>
                    <Typography sx={{ fontWeight: 750, fontSize: '0.86rem', color: brandDarkNavy }}>
                      Enable Faster Response
                    </Typography>
                    <Typography sx={{ fontSize: '0.78rem', color: brandMutedText }}>
                      Coordinated action
                    </Typography>
                  </Box>

                  <Box sx={{ width: '1px', height: 26, backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#dfe1e6' }} />

                  {/* Pillar 3 */}
                  <Box>
                    <Typography sx={{ fontWeight: 750, fontSize: '0.86rem', color: brandDarkNavy }}>
                      Build Safer Communities
                    </Typography>
                    <Typography sx={{ fontSize: '0.78rem', color: brandMutedText }}>
                      A more resilient tomorrow
                    </Typography>
                  </Box>
                </Box>

                {/* Floating Cursive Brush Sticker: "Together for a Safer Tomorrow" */}
                <Box
                  sx={{
                    display: 'inline-flex',
                    flexDirection: 'column',
                    transform: 'rotate(-4deg)',
                    mt: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Caveat", cursive',
                      fontSize: { xs: '1.65rem', sm: '2rem' },
                      fontWeight: 700,
                      color: primaryBrandBlue,
                      lineHeight: 1.1,
                      textShadow: '0 2px 10px rgba(255, 255, 255, 0.8)',
                    }}
                  >
                    Together for a Safer Tomorrow
                  </Typography>
                  <svg width="150" height="12" viewBox="0 0 150 12" fill="none">
                    <path
                      d="M 5,6 Q 75,12 145,5"
                      stroke={primaryBrandBlue}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </Box>
              </Box>
            </Grid>

            {/* RIGHT COLUMN: The Clean White Authentication Card */}
            <Grid size={{ xs: 12, md: 5.5 }}>
              <Box
                sx={{
                  backgroundColor: cardBg,
                  borderRadius: 4,
                  p: { xs: 3.5, sm: 4.5, lg: 5 },
                  boxShadow: isDark
                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                    : '0 20px 45px -10px rgba(9, 30, 66, 0.15), 0 0 1px 1px rgba(9, 30, 66, 0.05)',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #ebecf0',
                  backdropFilter: 'blur(16px)',
                }}
              >
                {/* Card Title */}
                <Box mb={2.5}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      letterSpacing: '-0.025em',
                      color: brandDarkNavy,
                      fontSize: '1.85rem',
                      mb: 0.5,
                    }}
                  >
                    Welcome Back
                  </Typography>
                  <Typography sx={{ color: brandMutedText, fontSize: '0.88rem' }}>
                    {activeRole === 'citizen'
                      ? 'Sign in to continue to AapdaNetra'
                      : 'Secure Administrator Access'}
                  </Typography>
                </Box>

                {/* Role Selector: Compact Segmented Control [ Citizen | Admin ] */}
                <Box
                  sx={{
                    display: 'flex',
                    p: '4px',
                    borderRadius: 2.5,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f4f5f7',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #dfe1e6',
                    mb: 3,
                  }}
                >
                  <Button
                    fullWidth
                    onClick={() => handleRoleChange('citizen')}
                    sx={{
                      py: 0.9,
                      borderRadius: 2,
                      fontSize: '0.88rem',
                      fontWeight: activeRole === 'citizen' ? 700 : 600,
                      textTransform: 'none',
                      backgroundColor: activeRole === 'citizen' ? primaryBrandBlue : 'transparent',
                      color: activeRole === 'citizen' ? '#ffffff' : brandMutedText,
                      boxShadow: activeRole === 'citizen' ? '0 2px 6px rgba(0, 101, 255, 0.3)' : 'none',
                      transition: 'all 0.18s ease',
                      '&:hover': {
                        backgroundColor: activeRole === 'citizen' ? '#0052cc' : isDark ? 'rgba(255,255,255,0.08)' : '#ebecf0',
                      },
                    }}
                  >
                    Citizen
                  </Button>

                  <Button
                    fullWidth
                    onClick={() => handleRoleChange('admin')}
                    sx={{
                      py: 0.9,
                      borderRadius: 2,
                      fontSize: '0.88rem',
                      fontWeight: activeRole === 'admin' ? 700 : 600,
                      textTransform: 'none',
                      backgroundColor: activeRole === 'admin' ? primaryBrandBlue : 'transparent',
                      color: activeRole === 'admin' ? '#ffffff' : brandMutedText,
                      boxShadow: activeRole === 'admin' ? '0 2px 6px rgba(0, 101, 255, 0.3)' : 'none',
                      transition: 'all 0.18s ease',
                      '&:hover': {
                        backgroundColor: activeRole === 'admin' ? '#0052cc' : isDark ? 'rgba(255,255,255,0.08)' : '#ebecf0',
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
                  {/* Field 1: Email or Mobile Number / Admin ID */}
                  <Box mb={2}>
                    <Typography
                      sx={{
                        display: 'block',
                        mb: 0.75,
                        color: brandDarkNavy,
                        fontWeight: 700,
                        fontSize: '0.82rem',
                      }}
                    >
                      {activeRole === 'citizen' ? 'Email or Mobile Number' : 'Admin ID'}
                    </Typography>
                    <TextField
                      fullWidth
                      id="login-identifier"
                      placeholder={
                        activeRole === 'citizen'
                          ? 'Enter your email or mobile number'
                          : 'Enter your Admin ID or email'
                      }
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      variant="outlined"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: inputBg,
                          borderRadius: 2,
                          color: brandDarkNavy,
                          fontSize: '0.88rem',
                          '& fieldset': { borderColor: inputBorder },
                          '&:hover fieldset': { borderColor: primaryBrandBlue },
                          '&.Mui-focused fieldset': {
                            borderColor: primaryBrandBlue,
                            borderWidth: '1.5px',
                          },
                        },
                      }}
                    />
                  </Box>

                  {/* Field 2: Password */}
                  <Box mb={2}>
                    <Typography
                      sx={{
                        display: 'block',
                        mb: 0.75,
                        color: brandDarkNavy,
                        fontWeight: 700,
                        fontSize: '0.82rem',
                      }}
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
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              size="small"
                              sx={{ color: brandMutedText }}
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
                          color: brandDarkNavy,
                          fontSize: '0.88rem',
                          '& fieldset': { borderColor: inputBorder },
                          '&:hover fieldset': { borderColor: primaryBrandBlue },
                          '&.Mui-focused fieldset': {
                            borderColor: primaryBrandBlue,
                            borderWidth: '1.5px',
                          },
                        },
                      }}
                    />
                  </Box>

                  {/* Options Row: Remember Me & Forgot Password */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: activeRole === 'citizen' ? 'space-between' : 'flex-end',
                      alignItems: 'center',
                      width: '100%',
                      mb: 2.5,
                    }}
                  >
                    {activeRole === 'citizen' && (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            size="small"
                            sx={{
                              color: inputBorder,
                              '&.Mui-checked': { color: primaryBrandBlue },
                              p: 0.5,
                            }}
                          />
                        }
                        label={
                          <Typography sx={{ color: brandSecondaryNavy, fontSize: '0.82rem', fontWeight: 500 }}>
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
                      sx={{
                        color: primaryBrandBlue,
                        textDecoration: 'none',
                        fontSize: '0.82rem',
                        fontWeight: 650,
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      {activeRole === 'citizen' ? 'Forgot password?' : 'Forgot admin password?'}
                    </Typography>
                  </Box>

                  {/* Primary CTA Button: Sign In → */}
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
                      backgroundColor: primaryBrandBlue,
                      color: '#ffffff',
                      py: 1.3,
                      borderRadius: 2,
                      fontWeight: 700,
                      fontSize: '0.94rem',
                      textTransform: 'none',
                      boxShadow: '0 4px 14px rgba(0, 101, 255, 0.3)',
                      '&:hover': {
                        backgroundColor: '#0052cc',
                        boxShadow: '0 6px 18px rgba(0, 101, 255, 0.4)',
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

                  {/* CITIZEN-ONLY: OR Divider, Google SSO, and Create Account */}
                  {activeRole === 'citizen' && (
                    <>
                      {/* Clean Contained OR Divider */}
                      <Box sx={{ position: 'relative', textAlign: 'center', my: 2.5 }}>
                        <Divider sx={{ borderColor: inputBorder }} />
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: cardBg,
                            px: 1.5,
                          }}
                        >
                          <Typography
                            sx={{
                              color: brandMutedText,
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              letterSpacing: '0.04em',
                            }}
                          >
                            OR
                          </Typography>
                        </Box>
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
                          color: brandDarkNavy,
                          borderColor: inputBorder,
                          py: 1.15,
                          borderRadius: 2,
                          fontSize: '0.88rem',
                          fontWeight: 650,
                          textTransform: 'none',
                          backgroundColor: inputBg,
                          '&:hover': {
                            borderColor: primaryBrandBlue,
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
                          },
                          mb: 3,
                        }}
                      >
                        Sign in with Google
                      </Button>

                      {/* Create an account */}
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ color: brandSecondaryNavy, fontSize: '0.86rem' }}>
                          Don't have an account?{' '}
                          <Typography
                            component={Link}
                            to="/signup"
                            sx={{
                              color: primaryBrandBlue,
                              textDecoration: 'none',
                              fontWeight: 700,
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

      {/* 3. CLEAN BOTTOM FOOTER MATCHING MOCKUP */}
      <Box
        component="footer"
        sx={{
          py: 2.5,
          px: { xs: 2.5, md: 6, lg: 8 },
          backgroundColor: isDark ? '#080c14' : '#ffffff',
          borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #ebecf0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography sx={{ color: brandDarkNavy, fontSize: '0.8rem', fontWeight: 650 }}>
            Building a safer, more resilient tomorrow.
          </Typography>
          <Typography sx={{ color: brandMutedText, fontSize: '0.74rem' }}>
            Empowering communities with data, intelligence, and timely action.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography
              onClick={() => setInfoModal('about')}
              sx={{ color: brandSecondaryNavy, fontSize: '0.76rem', cursor: 'pointer', '&:hover': { color: primaryBrandBlue } }}
            >
              About
            </Typography>
            <Typography sx={{ color: brandMutedText, fontSize: '0.74rem' }}>|</Typography>
            <Typography
              onClick={() => setInfoModal('contact')}
              sx={{ color: brandSecondaryNavy, fontSize: '0.76rem', cursor: 'pointer', '&:hover': { color: primaryBrandBlue } }}
            >
              Contact
            </Typography>
            <Typography sx={{ color: brandMutedText, fontSize: '0.74rem' }}>|</Typography>
            <Typography sx={{ color: brandSecondaryNavy, fontSize: '0.76rem' }}>
              Privacy Policy
            </Typography>
            <Typography sx={{ color: brandMutedText, fontSize: '0.74rem' }}>|</Typography>
            <Typography sx={{ color: brandSecondaryNavy, fontSize: '0.76rem' }}>
              Terms of Service
            </Typography>
          </Stack>

          <Box sx={{ display: { xs: 'none', sm: 'block' }, width: '1px', height: 16, backgroundColor: '#dfe1e6', mx: 1 }} />

          <Typography sx={{ color: brandMutedText, fontSize: '0.76rem' }}>
            © 2026. All rights reserved.
          </Typography>
        </Box>
      </Box>

      {/* Google SSO Dialog Modal */}
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
          },
        }}
      >
        {googleLoading && (
          <LinearProgress
            sx={{ height: 3, bgcolor: '#e8f0fe', '& .MuiLinearProgress-bar': { bgcolor: '#1a73e8' } }}
          />
        )}

        <DialogContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box display="flex" justifyContent="center" mb={2}>
            <svg width="32" height="32" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
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

      {/* Information Dialog for Navbar Links */}
      <Dialog
        open={Boolean(infoModal)}
        onClose={() => setInfoModal(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            backgroundColor: cardBg,
            color: brandDarkNavy,
            border: `1px solid ${inputBorder}`,
          },
        }}
      >
        <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          {infoModal === 'about' && (
            <Box>
              <Typography variant="h5" fontWeight={750} sx={{ color: brandDarkNavy, mb: 0.5 }}>
                About AapdaNetra
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: primaryBrandBlue,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  display: 'block',
                  mb: 2,
                }}
              >
                Public Safety & Emergency Decision Support Platform
              </Typography>
              <Typography variant="body2" sx={{ color: brandSecondaryNavy, lineHeight: 1.7, mb: 2 }}>
                AapdaNetra is a high-availability disaster intelligence and crisis coordination platform built to protect communities during critical environmental emergencies.
              </Typography>
              <Typography variant="body2" sx={{ color: brandSecondaryNavy, lineHeight: 1.7, mb: 3 }}>
                By integrating early warning sensor telemetry, localized hazard analytics, and district-level automated triage, AapdaNetra empowers both citizens and government administrations to act swiftly when every second counts.
              </Typography>
            </Box>
          )}

          {infoModal === 'how-it-works' && (
            <Box>
              <Typography variant="h5" fontWeight={750} sx={{ color: brandDarkNavy, mb: 0.5 }}>
                How It Works
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: primaryBrandBlue,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  display: 'block',
                  mb: 2.5,
                }}
              >
                Three Pillars of Disaster Intelligence
              </Typography>
              <Stack spacing={2} sx={{ mb: 3 }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: brandDarkNavy }}>
                    1. Anticipate Risks
                  </Typography>
                  <Typography variant="body2" sx={{ color: brandSecondaryNavy, fontSize: '0.85rem' }}>
                    Continuous tracking of river basin levels, precipitation thresholds, and seismic sensors provides crucial predictive lead time.
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: brandDarkNavy }}>
                    2. Enable Faster Response
                  </Typography>
                  <Typography variant="body2" sx={{ color: brandSecondaryNavy, fontSize: '0.85rem' }}>
                    Registered citizens receive district-tailored notifications and can submit field-level hazard reports with precise coordinates.
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: brandDarkNavy }}>
                    3. Build Safer Communities
                  </Typography>
                  <Typography variant="body2" sx={{ color: brandSecondaryNavy, fontSize: '0.85rem' }}>
                    District and state officers prioritize safe shelter intakes, coordinate evacuation corridors, and manage relief deployment.
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          {infoModal === 'contact' && (
            <Box>
              <Typography variant="h5" fontWeight={750} sx={{ color: brandDarkNavy, mb: 0.5 }}>
                Emergency Operations Desk
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: primaryBrandBlue,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  display: 'block',
                  mb: 2,
                }}
              >
                24x7 State Disaster Control Room
              </Typography>
              <Typography variant="body2" sx={{ color: brandSecondaryNavy, lineHeight: 1.7, mb: 2 }}>
                For emergency assistance and incident escalation, please contact the respective helpline desks:
              </Typography>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                  border: `1px solid ${inputBorder}`,
                  mb: 3,
                }}
              >
                <Typography variant="body2" sx={{ color: brandDarkNavy, fontWeight: 650, mb: 0.5 }}>
                  National Emergency: <span style={{ color: '#ef4444' }}>112</span>
                </Typography>
                <Typography variant="body2" sx={{ color: brandDarkNavy, fontWeight: 650, mb: 0.5 }}>
                  NDRF Control Room: <span style={{ color: primaryBrandBlue }}>1078</span>
                </Typography>
                <Typography variant="body2" sx={{ color: brandSecondaryNavy, fontSize: '0.85rem' }}>
                  Operations Support: support@aapdanetra.in
                </Typography>
              </Box>
            </Box>
          )}

          <Box display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              size="small"
              onClick={() => setInfoModal(null)}
              sx={{
                backgroundColor: primaryBrandBlue,
                textTransform: 'none',
                fontWeight: 650,
                borderRadius: 1.5,
                px: 2.5,
                '&:hover': { backgroundColor: '#0052cc' },
              }}
            >
              Close
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
