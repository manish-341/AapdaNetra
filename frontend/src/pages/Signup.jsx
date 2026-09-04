import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Divider,
  Container,
  Stack,
  Autocomplete,
  Chip,
  Dialog,
  DialogContent,
  LinearProgress,
  Grid
} from '@mui/material';
import citizenHeroImg from '../assets/citizen_safety_hero.jpg';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Sun,
  Moon,
  ArrowRight,
  Sparkles,
  AlertCircle,
  X
} from 'lucide-react';
import { registerUser, googleDirectLogin } from '../services/api';
import { setAuthToken } from '../lib/auth';
import { useThemeMode } from '../context/ThemeContext';
import AapdaNetraLogo from '../components/AapdaNetraLogo';

// Curated Comprehensive Indian Districts Registry
const DISTRICT_DATA = [
  { district: 'Gautam Buddha Nagar', state: 'Uttar Pradesh', lat: 28.4744, lng: 77.5040 },
  { district: 'Central Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { district: 'North Delhi', state: 'Delhi', lat: 28.6800, lng: 77.1950 },
  { district: 'East Delhi', state: 'Delhi', lat: 28.6280, lng: 77.2800 },
  { district: 'South Delhi', state: 'Delhi', lat: 28.5200, lng: 77.2100 },
  { district: 'Vindhya', state: 'Madhya Pradesh', lat: 24.5362, lng: 81.3038 },
  { district: 'Rewa', state: 'Madhya Pradesh', lat: 24.5362, lng: 81.3038 },
  { district: 'Satna', state: 'Madhya Pradesh', lat: 24.5805, lng: 80.8252 },
  { district: 'Sidhi', state: 'Madhya Pradesh', lat: 24.4033, lng: 81.8791 },
  { district: 'Singrauli', state: 'Madhya Pradesh', lat: 24.1992, lng: 82.6645 },
  { district: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  { district: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  { district: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.1815, lng: 79.9864 },
  { district: 'Gwalior', state: 'Madhya Pradesh', lat: 26.2183, lng: 78.1828 },
  { district: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { district: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { district: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
  { district: 'Thane', state: 'Maharashtra', lat: 19.2183, lng: 72.9781 },
  { district: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { district: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { district: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { district: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
  { district: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { district: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { district: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lng: 80.3319 },
  { district: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739 },
  { district: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lng: 78.0081 },
  { district: 'Prayagraj', state: 'Uttar Pradesh', lat: 25.4358, lng: 81.8463 },
  { district: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376 },
  { district: 'Gaya', state: 'Bihar', lat: 24.7955, lng: 85.0002 },
  { district: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lng: 78.0322 },
  { district: 'Haridwar', state: 'Uttarakhand', lat: 29.9457, lng: 78.1642 },
  { district: 'Shimla', state: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734 },
  { district: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362 },
  { district: 'Kamrup', state: 'Assam', lat: 26.3161, lng: 91.5984 },
  { district: 'Cachar', state: 'Assam', lat: 24.7333, lng: 92.7990 },
  { district: 'Srinagar', state: 'Jammu & Kashmir', lat: 34.0837, lng: 74.7973 },
  { district: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lng: 85.3096 },
  { district: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lng: 85.8245 },
  { district: 'Puri', state: 'Odisha', lat: 19.8135, lng: 85.8312 },
  { district: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lng: 81.6296 },
  { district: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  { district: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { district: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311 },
  { district: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673 },
  { district: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lng: 76.9366 }
];

export default function Signup() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useThemeMode();

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    district: 'Gautam Buddha Nagar',
    state: 'Uttar Pradesh',
    receiveAlerts: true
  });

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Theme design tokens matching Login.jsx
  const pageBg = isDark ? '#080c14' : '#f8fafc';
  const surfaceBg = isDark ? '#0f172a' : '#ffffff';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#475569';
  const textMuted = isDark ? '#64748b' : '#94a3b8';
  const inputBg = isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff';

  // Password Strength Calculator
  const passwordStrength = useMemo(() => {
    const p = formData.password;
    if (!p) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (p.length >= 6) score += 1;
    if (p.length >= 10) score += 1;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score += 1;
    if (/[0-9]/.test(p)) score += 1;
    if (/[^A-Za-z0-9]/.test(p)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: '#ef4444' };
    if (score <= 4) return { score: 2, label: 'Medium', color: '#f59e0b' };
    return { score: 3, label: 'Strong', color: '#10b981' };
  }, [formData.password]);

  // Handle Input Changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));

    // Real-time validation
    setFieldErrors(prev => {
      const errs = { ...prev };
      delete errs[field];

      if (field === 'confirmPassword' || field === 'password') {
        const pwd = field === 'password' ? value : formData.password;
        const confirm = field === 'confirmPassword' ? value : formData.confirmPassword;
        if (confirm && pwd !== confirm) {
          errs.confirmPassword = 'Passwords do not match.';
        } else if (confirm && pwd === confirm) {
          delete errs.confirmPassword;
        }
      }
      return errs;
    });
  };

  // Handle District Selection (Auto-populates State)
  const handleDistrictChange = (event, newValue) => {
    if (typeof newValue === 'string') {
      // User entered custom district name
      setFormData(prev => ({
        ...prev,
        district: newValue,
        state: prev.state || 'India'
      }));
    } else if (newValue && newValue.district) {
      setFormData(prev => ({
        ...prev,
        district: newValue.district,
        state: newValue.state
      }));
    } else {
      setFormData(prev => ({ ...prev, district: '', state: '' }));
    }
  };

  // Validate entire form prior to submission
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Please enter your full name.';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters.';
    }

    if (!formData.email.trim()) {
      errors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (formData.phone.trim() && !/^[+0-9\s-]{10,15}$/.test(formData.phone.trim())) {
      errors.phone = 'Please enter a valid 10-digit mobile number.';
    }

    if (!formData.password) {
      errors.password = 'Please create a password.';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please re-enter your password.';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!formData.district.trim()) {
      errors.district = 'Please select your district.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Registration Submit
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setServerError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Security: Strictly registers normal User / Citizen without sending privileged roles
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
        district: formData.district.trim(),
        state: formData.state.trim() || 'India',
        receiveAlerts: formData.receiveAlerts
      };

      const response = await registerUser(payload);
      const { token, ...user } = response.data.data;

      // Store authentic session token & user info
      setAuthToken(token, user, true);

      // Save initial district coordinates for live maps & disaster dashboard
      const activeLoc = {
        name: `${user.district} (${user.state || 'India'})`,
        district: user.district,
        state: user.state || 'India',
        lat: user.coordinates?.latitude || 28.4744,
        lng: user.coordinates?.longitude || 77.5040,
        isGPS: false
      };
      localStorage.setItem('an_active_location', JSON.stringify(activeLoc));

      // Direct to normal User / Citizen dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Registration error:', err);
      const msg = err.response?.data?.message || err.message;
      if (msg && msg.toLowerCase().includes('email already registered')) {
        setServerError('This email is already registered. Please sign in instead.');
      } else if (err.response?.status >= 500) {
        setServerError('Unable to create your account right now. Please try again.');
      } else {
        setServerError(msg || 'Registration failed. Please check your information.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Google SSO Modal State (Consistent with Login.jsx)
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googlePassword, setGooglePassword] = useState('');
  const [googleShowPassword, setGoogleShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [googleStep, setGoogleStep] = useState('email');

  const handleGoogleSignup = () => {
    setServerError('');
    setGoogleError('');
    setGoogleEmail('citizen.new@gmail.com');
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
      // Security: Google OAuth signup is strictly constrained to standard citizen role
      const res = await googleDirectLogin({
        email: googleEmail,
        password: googlePassword,
        role: 'citizen',
        name: googleEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      });

      const { token, ...userData } = res.data.data;
      setAuthToken(token, userData, true);
      setGoogleModalOpen(false);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setGoogleError(err.response?.data?.message || 'Google sign-in could not be completed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Info Modal State for Navbar Links
  const [infoModal, setInfoModal] = useState(null); // 'about' | 'how-it-works' | 'contact' | null

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
      {/* Clean, Compact Top Navigation Bar */}
      <Box
        component="header"
        sx={{
          py: 1.4,
          px: { xs: 2.5, md: 6 },
          borderBottom: `1px solid ${borderColor}`,
          backgroundColor: surfaceBg,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'background-color 0.25s ease, border-color 0.25s ease',
        }}
      >
        {/* LEFT: Polished Logo + Brand Name Lockup */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AapdaNetraLogo size={36} />
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: textPrimary,
                lineHeight: 1.1,
                fontSize: '1.22rem',
              }}
            >
              AapdaNetra
            </Typography>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '0.62rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: isDark ? '#38bdf8' : '#0284c7',
                lineHeight: 1,
                mt: 0.35,
              }}
            >
              DISASTER INTELLIGENCE
            </Typography>
          </Box>
        </Box>

        {/* RIGHT: Navigation Links + Theme Toggle (Strict Single Row) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2.5 } }}>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2.5 }}>
            <Typography
              onClick={() => setInfoModal('about')}
              sx={{
                fontSize: '0.85rem',
                fontWeight: 550,
                color: textSecondary,
                cursor: 'pointer',
                transition: 'color 0.15s ease',
                '&:hover': { color: isDark ? '#38bdf8' : '#0284c7' },
              }}
            >
              About
            </Typography>
            <Typography
              onClick={() => setInfoModal('how-it-works')}
              sx={{
                fontSize: '0.85rem',
                fontWeight: 550,
                color: textSecondary,
                cursor: 'pointer',
                transition: 'color 0.15s ease',
                '&:hover': { color: isDark ? '#38bdf8' : '#0284c7' },
              }}
            >
              How It Works
            </Typography>
            <Typography
              onClick={() => setInfoModal('contact')}
              sx={{
                fontSize: '0.85rem',
                fontWeight: 550,
                color: textSecondary,
                cursor: 'pointer',
                transition: 'color 0.15s ease',
                '&:hover': { color: isDark ? '#38bdf8' : '#0284c7' },
              }}
            >
              Contact
            </Typography>
          </Box>

          <Divider
            orientation="vertical"
            flexItem
            sx={{ display: { xs: 'none', md: 'block' }, height: 20, my: 'auto', borderColor }}
          />

          {/* Theme Toggle Button */}
          <IconButton
            onClick={toggleTheme}
            size="small"
            id="theme-toggle-button"
            title={isDark ? 'Switch to clean white mode' : 'Switch to dark mode'}
            sx={{
              border: `1px solid ${borderColor}`,
              borderRadius: 2,
              p: 0.85,
              color: isDark ? '#fbbf24' : '#0284c7',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
              },
            }}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
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
          px: { xs: 2, sm: 3, md: 5 },
          py: { xs: 4, sm: 6 },
        }}
      >
        <Container maxWidth="lg" disableGutters>
          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="flex-start" justifyContent="center">
            {/* LEFT COLUMN: Hero Image & Citizen Resilience Benefits */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ pr: { md: 2, lg: 3 }, position: { md: 'sticky' }, top: { md: 90 } }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'inline-block',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: isDark ? '#38bdf8' : '#0284c7',
                    mb: 1,
                  }}
                >
                  CITIZEN RESILIENCE NETWORK
                </Typography>

                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: '-0.025em',
                    color: textPrimary,
                    fontSize: { xs: '2rem', sm: '2.4rem' },
                    lineHeight: 1.15,
                    mb: 1,
                  }}
                >
                  Join AapdaNetra
                </Typography>

                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: textSecondary,
                    fontSize: { xs: '0.94rem', md: '1rem' },
                    lineHeight: 1.5,
                    mb: 2.5,
                  }}
                >
                  Direct Early Warnings & Localized Crisis Support for Every Resident
                </Typography>

                {/* Hero Image Card */}
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: `1px solid ${borderColor}`,
                    boxShadow: isDark
                      ? '0 16px 36px rgba(0, 0, 0, 0.5)'
                      : '0 8px 24px rgba(15, 23, 42, 0.06)',
                    mb: 3,
                    maxHeight: 260,
                  }}
                >
                  <Box
                    component="img"
                    src={citizenHeroImg}
                    alt="Citizen Safety & Emergency Rescue Fleet"
                    sx={{
                      width: '100%',
                      height: '100%',
                      maxHeight: 260,
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                  {/* Status Pill Badge over image */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.8,
                      px: 1.25,
                      py: 0.5,
                      borderRadius: 20,
                      backgroundColor: 'rgba(15, 23, 42, 0.85)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#10b981',
                    }}
                  >
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        boxShadow: '0 0 8px #10b981',
                      }}
                    />
                    <Typography variant="caption" sx={{ fontWeight: 750, fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                      DISTRICT CRISIS RESPONSE FLEET
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      p: 1.25,
                      background: 'linear-gradient(to top, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0) 100%)',
                      color: '#ffffff',
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.76rem', color: '#e2e8f0' }}>
                      Early Warning Alerts • Shelter Priority Triage • Verified Incident Reporting
                    </Typography>
                  </Box>
                </Box>

                {/* Features List */}
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2 }}>
                    <CheckCircle2 size={17} color={isDark ? '#38bdf8' : '#0284c7'} style={{ marginTop: 2, flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.86rem' }}>
                      Instant localized disaster notifications broadcast before hazard escalation
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2 }}>
                    <CheckCircle2 size={17} color={isDark ? '#38bdf8' : '#0284c7'} style={{ marginTop: 2, flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.86rem' }}>
                      Direct geotagged field reports submitted to your nearest Emergency Operations Center
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2 }}>
                    <CheckCircle2 size={17} color={isDark ? '#38bdf8' : '#0284c7'} style={{ marginTop: 2, flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.86rem' }}>
                      Automatic district shelter provisioning and safe route guidance
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Grid>

            {/* RIGHT COLUMN: The Registration Card */}
            <Grid size={{ xs: 12, md: 7 }}>
          {/* Centered Registration Card */}
          <Box
            sx={{
              backgroundColor: surfaceBg,
              borderRadius: 3.5,
              p: { xs: 3, sm: 4.5 },
              border: `1px solid ${borderColor}`,
              boxShadow: isDark
                ? '0 20px 40px -4px rgba(0, 0, 0, 0.6)'
                : '0 10px 30px -4px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(0, 0, 0, 0.02)',
              transition: 'background-color 0.25s ease, border-color 0.25s ease',
            }}
          >
            {/* Card Header */}
            <Box mb={3.5} textAlign="center">
              <Box
                display="inline-flex"
                sx={{
                  p: 1.25,
                  borderRadius: 2.5,
                  backgroundColor: isDark ? 'rgba(56,189,248,0.1)' : 'rgba(2,132,199,0.08)',
                  color: isDark ? '#38bdf8' : '#0284c7',
                  mb: 1.5,
                }}
              >
                <ShieldCheck size={28} />
              </Box>
              <Typography
                variant="h4"
                fontWeight={800}
                letterSpacing="-0.02em"
                sx={{
                  color: textPrimary,
                  fontSize: { xs: '1.5rem', sm: '1.75rem' },
                  mb: 0.75
                }}
              >
                Create your AapdaNetra Account
              </Typography>
              <Typography
                variant="subtitle2"
                fontWeight={650}
                sx={{
                  color: isDark ? '#38bdf8' : '#0284c7',
                  fontSize: '0.92rem',
                  mb: 0.5
                }}
              >
                Stay informed. Stay protected.
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: textSecondary,
                  fontSize: '0.8rem',
                  maxWidth: 420,
                  display: 'block',
                  mx: 'auto'
                }}
              >
                Create your account to receive localized disaster information and emergency alerts.
              </Typography>
            </Box>

            {/* Server Error Banner */}
            {serverError && (
              <Alert
                severity="error"
                onClose={() => setServerError('')}
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  fontSize: '0.84rem',
                }}
              >
                {serverError}
              </Alert>
            )}

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={2.5}>
                {/* 1. Full Name */}
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={650}
                    sx={{ display: 'block', mb: 0.75, color: textPrimary, fontSize: '0.82rem' }}
                  >
                    Full Name <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
                  </Typography>
                  <TextField
                    fullWidth
                    id="signup-name"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    error={Boolean(fieldErrors.name)}
                    helperText={fieldErrors.name}
                    variant="outlined"
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <User size={17} color={textMuted} />
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
                      '& .MuiFormHelperText-root': {
                        marginLeft: 0.5,
                        fontSize: '0.75rem',
                      }
                    }}
                  />
                </Box>

                {/* 2. Email Address */}
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={650}
                    sx={{ display: 'block', mb: 0.75, color: textPrimary, fontSize: '0.82rem' }}
                  >
                    Email Address <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
                  </Typography>
                  <TextField
                    fullWidth
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    error={Boolean(fieldErrors.email)}
                    helperText={fieldErrors.email}
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
                      '& .MuiFormHelperText-root': {
                        marginLeft: 0.5,
                        fontSize: '0.75rem',
                      }
                    }}
                  />
                </Box>

                {/* 3. Mobile Number (Optional) */}
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}>
                    <Typography
                      variant="caption"
                      fontWeight={650}
                      sx={{ color: textPrimary, fontSize: '0.82rem' }}
                    >
                      Mobile Number
                    </Typography>
                    <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.72rem' }}>
                      Optional
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    id="signup-phone"
                    name="phone"
                    placeholder="+91 XXXXX XXXXX"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    error={Boolean(fieldErrors.phone)}
                    helperText={fieldErrors.phone || 'Used for emergency SMS alerts in localized zones.'}
                    variant="outlined"
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone size={17} color={textMuted} />
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
                      '& .MuiFormHelperText-root': {
                        marginLeft: 0.5,
                        fontSize: '0.75rem',
                        color: fieldErrors.phone ? undefined : textMuted,
                      }
                    }}
                  />
                </Box>

                {/* 4. Password */}
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={650}
                    sx={{ display: 'block', mb: 0.75, color: textPrimary, fontSize: '0.82rem' }}
                  >
                    Password <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
                  </Typography>
                  <TextField
                    fullWidth
                    id="signup-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    error={Boolean(fieldErrors.password)}
                    helperText={fieldErrors.password}
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
                      '& .MuiFormHelperText-root': {
                        marginLeft: 0.5,
                        fontSize: '0.75rem',
                      }
                    }}
                  />

                  {/* Subtle Password Strength Bar */}
                  {formData.password && (
                    <Box mt={1} px={0.5}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.7rem' }}>
                          Password strength:
                        </Typography>
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          sx={{ color: passwordStrength.color, fontSize: '0.7rem' }}
                        >
                          {passwordStrength.label}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={0.5}>
                        {[1, 2, 3].map((step) => (
                          <Box
                            key={step}
                            sx={{
                              flex: 1,
                              height: 3.5,
                              borderRadius: 1,
                              backgroundColor:
                                passwordStrength.score >= step
                                  ? passwordStrength.color
                                  : isDark
                                  ? 'rgba(255,255,255,0.08)'
                                  : '#e2e8f0',
                              transition: 'background-color 0.2s ease',
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* 5. Confirm Password */}
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={650}
                    sx={{ display: 'block', mb: 0.75, color: textPrimary, fontSize: '0.82rem' }}
                  >
                    Confirm Password <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
                  </Typography>
                  <TextField
                    fullWidth
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    error={Boolean(fieldErrors.confirmPassword)}
                    helperText={fieldErrors.confirmPassword}
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
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            size="small"
                            sx={{ color: textMuted }}
                          >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                      '& .MuiFormHelperText-root': {
                        marginLeft: 0.5,
                        fontSize: '0.75rem',
                      }
                    }}
                  />
                </Box>

                {/* 6. Location for Emergency Alerts (Searchable District & Readonly State) */}
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={650}
                    sx={{ display: 'block', mb: 0.25, color: textPrimary, fontSize: '0.82rem' }}
                  >
                    Location for Emergency Alerts <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mb: 1, color: textSecondary, fontSize: '0.74rem' }}>
                    We'll use your district to provide relevant disaster alerts and local emergency information.
                  </Typography>

                  <Stack spacing={1.5}>
                    {/* Searchable District Dropdown */}
                    <Autocomplete
                      freeSolo
                      options={DISTRICT_DATA}
                      getOptionLabel={(option) => {
                        if (typeof option === 'string') return option;
                        return `${option.district} (${option.state})`;
                      }}
                      value={
                        DISTRICT_DATA.find(d => d.district === formData.district) || formData.district
                      }
                      onChange={handleDistrictChange}
                      onInputChange={(event, newInputValue) => {
                        // Support custom free-text input
                        if (event && event.type === 'change') {
                          handleInputChange('district', newInputValue);
                          const matched = DISTRICT_DATA.find(
                            d => d.district.toLowerCase() === newInputValue.toLowerCase().trim()
                          );
                          if (matched) {
                            handleInputChange('state', matched.state);
                          }
                        }
                      }}
                      renderInput={(params) => {
                        const existingStartAdornment = params?.slotProps?.input?.startAdornment || params?.InputProps?.startAdornment;
                        const commonSx = {
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
                          '& .MuiFormHelperText-root': {
                            marginLeft: 0.5,
                            fontSize: '0.75rem',
                          }
                        };

                        if (params?.slotProps?.input) {
                          return (
                            <TextField
                              {...params}
                              placeholder="Select or search your district"
                              size="small"
                              error={Boolean(fieldErrors.district)}
                              helperText={fieldErrors.district}
                              slotProps={{
                                ...params.slotProps,
                                input: {
                                  ...params.slotProps.input,
                                  startAdornment: (
                                    <>
                                      <InputAdornment position="start">
                                        <MapPin size={17} color={isDark ? '#38bdf8' : '#0284c7'} />
                                      </InputAdornment>
                                      {existingStartAdornment}
                                    </>
                                  ),
                                },
                              }}
                              sx={commonSx}
                            />
                          );
                        }

                        return (
                          <TextField
                            {...params}
                            placeholder="Select or search your district"
                            size="small"
                            error={Boolean(fieldErrors.district)}
                            helperText={fieldErrors.district}
                            InputProps={{
                              ...(params?.InputProps || {}),
                              startAdornment: (
                                <>
                                  <InputAdornment position="start">
                                    <MapPin size={17} color={isDark ? '#38bdf8' : '#0284c7'} />
                                  </InputAdornment>
                                  {existingStartAdornment}
                                </>
                              ),
                            }}
                            sx={commonSx}
                          />
                        );
                      }}
                    />

                    {/* Auto-populated State (Read-only) */}
                    <Box>
                      <Typography
                        variant="caption"
                        fontWeight={650}
                        sx={{ display: 'block', mb: 0.5, color: textMuted, fontSize: '0.75rem' }}
                      >
                        State (Auto-determined)
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        value={formData.state || 'India'}
                        InputProps={{
                          readOnly: true,
                          startAdornment: (
                            <InputAdornment position="start">
                              <CheckCircle2 size={16} color="#10b981" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
                            borderRadius: 2,
                            color: textSecondary,
                            fontSize: '0.86rem',
                            fontWeight: 600,
                            '& fieldset': { borderColor: borderColor },
                          },
                        }}
                      />
                    </Box>
                  </Stack>
                </Box>

                {/* 7. Emergency Alert Preference Checkbox */}
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2.5,
                    backgroundColor: isDark ? 'rgba(56,189,248,0.06)' : 'rgba(2,132,199,0.04)',
                    border: `1px solid ${isDark ? 'rgba(56,189,248,0.2)' : 'rgba(2,132,199,0.15)'}`,
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.receiveAlerts}
                        onChange={(e) => handleInputChange('receiveAlerts', e.target.checked)}
                        size="small"
                        sx={{
                          color: isDark ? '#38bdf8' : '#0284c7',
                          '&.Mui-checked': { color: isDark ? '#38bdf8' : '#0284c7' },
                          pt: 0.2,
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{ color: textPrimary, fontSize: '0.82rem' }}
                        >
                          Receive emergency alerts for my district
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: textSecondary, fontSize: '0.74rem', display: 'block' }}
                        >
                          Get important disaster alerts and safety information for your selected district.
                        </Typography>
                      </Box>
                    }
                    sx={{ m: 0, alignItems: 'flex-start' }}
                  />
                </Box>

                {/* 8. Primary Create Account CTA */}
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
                    py: 1.35,
                    borderRadius: 2,
                    fontWeight: 700,
                    fontSize: '0.94rem',
                    textTransform: 'none',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%)',
                      boxShadow: '0 6px 18px rgba(2, 132, 199, 0.45)',
                    },
                    '&:disabled': {
                      background: isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1',
                      color: isDark ? '#64748b' : '#94a3b8',
                    },
                    mt: 1,
                  }}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>

                {/* Divider with contained absolute label */}
                <Box sx={{ position: 'relative', textAlign: 'center', my: 2.5 }}>
                  <Divider sx={{ borderColor }} />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: surfaceBg,
                      px: 1.5,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: textMuted,
                        fontSize: '0.72rem',
                        fontWeight: 650,
                        letterSpacing: '0.04em',
                      }}
                    >
                      OR CONTINUE WITH
                    </Typography>
                  </Box>
                </Box>

                {/* Google Sign-in Button */}
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleGoogleSignup}
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
                    py: 1.15,
                    borderColor: borderColor,
                    borderRadius: 2,
                    color: textPrimary,
                    fontWeight: 650,
                    fontSize: '0.88rem',
                    textTransform: 'none',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
                    '&:hover': {
                      borderColor: isDark ? '#38bdf8' : '#0284c7',
                      backgroundColor: isDark ? 'rgba(56,189,248,0.05)' : '#f8fafc',
                    },
                  }}
                >
                  Continue with Google
                </Button>
              </Stack>
            </Box>

            {/* Bottom Link to Sign In */}
            <Box sx={{ textAlign: 'center', mt: 3, pt: 2, borderTop: `1px solid ${borderColor}` }}>
              <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.84rem' }}>
                Already have an account?{' '}
                <Link
                  to="/login"
                  style={{
                    color: isDark ? '#38bdf8' : '#0284c7',
                    textDecoration: 'none',
                    fontWeight: 700,
                  }}
                >
                  Sign In
                </Link>
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Container>
  </Box>

      {/* Google Authentication Dialog Modal (Matching Login.jsx) */}
      <Dialog
        open={googleModalOpen}
        onClose={() => !googleLoading && setGoogleModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: surfaceBg,
            color: textPrimary,
            border: `1px solid ${borderColor}`,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            p: 1,
          },
        }}
      >
        <DialogContent sx={{ p: { xs: 2.5, sm: 3 } }}>
          {googleLoading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <svg width="24" height="24" viewBox="0 0 24 24">
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
              <Typography variant="subtitle1" fontWeight={700}>
                Sign up with Google
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => !googleLoading && setGoogleModalOpen(false)}
              sx={{ color: textMuted }}
            >
              <X size={18} />
            </IconButton>
          </Box>

          <Typography variant="body2" sx={{ color: textSecondary, mb: 2.5, fontSize: '0.84rem' }}>
            Choose an account to continue to <strong>AapdaNetra Crisis Portal</strong> as a Citizen.
          </Typography>

          {googleError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem' }}>
              {googleError}
            </Alert>
          )}

          {googleStep === 'email' ? (
            <Box>
              {/* Quick Click Google Demo Account */}
              <Box
                onClick={() => handleGoogleNextEmail('citizen.delhi@gmail.com')}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: `1px solid ${borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  cursor: 'pointer',
                  mb: 2,
                  '&:hover': {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                    borderColor: isDark ? '#38bdf8' : '#0284c7',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    backgroundColor: '#0284c7',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                  }}
                >
                  C
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={650} sx={{ fontSize: '0.84rem' }}>
                    Citizen User
                  </Typography>
                  <Typography variant="caption" sx={{ color: textMuted, fontSize: '0.74rem' }}>
                    citizen.delhi@gmail.com
                  </Typography>
                </Box>
              </Box>

              <Typography variant="caption" sx={{ color: textMuted, display: 'block', mb: 1 }}>
                Or use your own Google email:
              </Typography>

              <TextField
                fullWidth
                size="small"
                placeholder="Email or phone"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                sx={{
                  mb: 2.5,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: inputBg,
                    borderRadius: 2,
                    color: textPrimary,
                    fontSize: '0.86rem',
                    '& fieldset': { borderColor: borderColor },
                  },
                }}
              />

              <Box display="flex" justifyContent="flex-end" gap={1.5}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setGoogleModalOpen(false)}
                  sx={{ textTransform: 'none', borderRadius: 2, color: textSecondary, borderColor }}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => handleGoogleNextEmail()}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    backgroundColor: '#0284c7',
                    fontWeight: 700,
                  }}
                >
                  Next
                </Button>
              </Box>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleGoogleSubmitPassword}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Typography variant="body2" fontWeight={600} sx={{ color: textPrimary }}>
                  {googleEmail}
                </Typography>
                <Button
                  size="small"
                  onClick={() => setGoogleStep('email')}
                  sx={{ textTransform: 'none', fontSize: '0.75rem', p: 0, minWidth: 0, color: '#0284c7' }}
                >
                  Change
                </Button>
              </Box>

              <TextField
                fullWidth
                size="small"
                type={googleShowPassword ? 'text' : 'password'}
                placeholder="Enter your password (e.g. password123)"
                value={googlePassword}
                onChange={(e) => setGooglePassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setGoogleShowPassword(!googleShowPassword)}
                        sx={{ color: textMuted }}
                      >
                        {googleShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2.5,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: inputBg,
                    borderRadius: 2,
                    color: textPrimary,
                    fontSize: '0.86rem',
                    '& fieldset': { borderColor: borderColor },
                  },
                }}
              />

              <Box display="flex" justifyContent="flex-end" gap={1.5}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setGoogleStep('email')}
                  disabled={googleLoading}
                  sx={{ textTransform: 'none', borderRadius: 2, color: textSecondary, borderColor }}
                >
                  Back
                </Button>
                <Button
                  size="small"
                  type="submit"
                  variant="contained"
                  disabled={googleLoading}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    backgroundColor: '#0284c7',
                    fontWeight: 700,
                  }}
                >
                  {googleLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Information Dialog for Navbar Links (About, How It Works, Contact) */}
      <Dialog
        open={Boolean(infoModal)}
        onClose={() => setInfoModal(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            backgroundColor: surfaceBg,
            color: textPrimary,
            border: `1px solid ${borderColor}`,
          },
        }}
      >
        <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          {infoModal === 'about' && (
            <Box>
              <Typography variant="h5" fontWeight={750} sx={{ color: textPrimary, mb: 0.5 }}>
                About AapdaNetra
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: isDark ? '#38bdf8' : '#0284c7',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  display: 'block',
                  mb: 2,
                }}
              >
                Public Safety & Emergency Decision Support Platform
              </Typography>
              <Typography variant="body2" sx={{ color: textSecondary, lineHeight: 1.7, mb: 2 }}>
                AapdaNetra is a high-availability disaster intelligence and crisis coordination platform built to protect communities during critical environmental emergencies.
              </Typography>
              <Typography variant="body2" sx={{ color: textSecondary, lineHeight: 1.7, mb: 3 }}>
                By integrating early warning sensor telemetry, localized hazard analytics, and district-level automated triage, AapdaNetra empowers both citizens and government administrations to act swiftly when every second counts.
              </Typography>
            </Box>
          )}

          {infoModal === 'how-it-works' && (
            <Box>
              <Typography variant="h5" fontWeight={750} sx={{ color: textPrimary, mb: 0.5 }}>
                How It Works
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: isDark ? '#38bdf8' : '#0284c7',
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
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: textPrimary }}>
                    1. Real-Time Telemetry & Hazard Tracking
                  </Typography>
                  <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.85rem' }}>
                    Continuous tracking of river basin levels, precipitation thresholds, and seismic sensors provides crucial predictive lead time.
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: textPrimary }}>
                    2. Citizen Incident Reporting & Rapid Alerts
                  </Typography>
                  <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.85rem' }}>
                    Registered citizens receive district-tailored notifications and can submit field-level hazard reports with precise coordinates.
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: textPrimary }}>
                    3. Unified Emergency Operations Center (EOC)
                  </Typography>
                  <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.85rem' }}>
                    District and state officers prioritize safe shelter intakes, coordinate evacuation corridors, and manage relief deployment.
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          {infoModal === 'contact' && (
            <Box>
              <Typography variant="h5" fontWeight={750} sx={{ color: textPrimary, mb: 0.5 }}>
                Emergency Operations Desk
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: isDark ? '#38bdf8' : '#0284c7',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  display: 'block',
                  mb: 2,
                }}
              >
                24x7 State Disaster Control Room
              </Typography>
              <Typography variant="body2" sx={{ color: textSecondary, lineHeight: 1.7, mb: 2 }}>
                For emergency assistance and incident escalation, please contact the respective helpline desks:
              </Typography>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                  border: `1px solid ${borderColor}`,
                  mb: 3,
                }}
              >
                <Typography variant="body2" sx={{ color: textPrimary, fontWeight: 650, mb: 0.5 }}>
                  National Emergency: <span style={{ color: '#ef4444' }}>112</span>
                </Typography>
                <Typography variant="body2" sx={{ color: textPrimary, fontWeight: 650, mb: 0.5 }}>
                  NDRF Control Room: <span style={{ color: isDark ? '#38bdf8' : '#0284c7' }}>1078</span>
                </Typography>
                <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.85rem' }}>
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
                backgroundColor: isDark ? '#38bdf8' : '#0284c7',
                color: '#ffffff',
                textTransform: 'none',
                fontWeight: 650,
                borderRadius: 1.5,
                px: 2.5,
                '&:hover': { backgroundColor: isDark ? '#0284c7' : '#0369a1' },
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
