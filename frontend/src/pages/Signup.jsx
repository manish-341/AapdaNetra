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
  Dialog,
  DialogContent,
  LinearProgress,
  Grid
} from '@mui/material';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Sun,
  Moon,
  X
} from 'lucide-react';
import { registerUser, googleDirectLogin } from '../services/api';
import { setAuthToken } from '../lib/auth';
import { useThemeMode } from '../context/ThemeContext';
import aapdaHeroBg from '../assets/aapda_hero_bg.jpg';

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

  // Color Tokens matching exact design mockup & Login.jsx
  const primaryBrandBlue = '#0065ff';
  const brandDarkNavy = isDark ? '#f8fafc' : '#091e42';
  const brandSecondaryNavy = isDark ? '#cbd5e1' : '#42526e';
  const brandMutedText = isDark ? '#94a3b8' : '#5e6c84';
  const cardBg = isDark ? '#0f172a' : '#ffffff';
  const inputBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : '#dfe1e6';
  const inputBg = isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff';

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

  // Info Modal State for Navbar Links
  const [infoModal, setInfoModal] = useState(null);

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

  // Validate form prior to submission
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

      setAuthToken(token, user, true);

      const activeLoc = {
        name: `${user.district} (${user.state || 'India'})`,
        district: user.district,
        state: user.state || 'India',
        lat: user.coordinates?.latitude || 28.4744,
        lng: user.coordinates?.longitude || 77.5040,
        isGPS: false
      };
      localStorage.setItem('an_active_location', JSON.stringify(activeLoc));

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
      {/* 1. TOP NAVBAR MATCHING MOCKUP & LOGIN.JSX */}
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

        {/* Right: Nav Links + Theme Toggle Pill */}
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
            ? `linear-gradient(180deg, rgba(8, 12, 20, 0.25) 0%, rgba(8, 12, 20, 0.3) 55%, rgba(8, 12, 20, 0.75) 85%, #080c14 100%), url(${aapdaHeroBg})`
            : `linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0) 62%, rgba(255, 255, 255, 0.45) 80%, rgba(255, 255, 255, 0.9) 95%, #ffffff 100%), url(${aapdaHeroBg})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center 22%',
          backgroundSize: 'cover',
        }}
      >
        <Container maxWidth="xl" disableGutters sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={{ xs: 4, md: 6, lg: 8 }} alignItems="center">
            {/* LEFT COLUMN: Clean Typography, Brand Identity, Pillars & Floating Sticker */}
            <Grid size={{ xs: 12, md: 6 }}>
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
                    mb: 3.5,
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

                {/* Floating Cursive Brush Sticker: "Together for a Safer Tomorrow" (Mockup-identical 3-line layout) */}
                <Box
                  sx={{
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    transform: 'rotate(-15deg)',
                    transformOrigin: 'left bottom',
                    mt: { xs: 2, md: 3 },
                    mb: 1,
                    filter: isDark
                      ? 'drop-shadow(0 6px 18px rgba(0, 0, 0, 0.8))'
                      : 'drop-shadow(0 3px 10px rgba(255, 255, 255, 0.95))',
                    userSelect: 'none',
                  }}
                >
                  <Box
                    sx={{
                      fontFamily: '"Caveat", cursive',
                      fontSize: { xs: '2rem', sm: '2.5rem', lg: '2.85rem' },
                      fontWeight: 700,
                      lineHeight: 0.92,
                      letterSpacing: '-0.02em',
                      color: isDark ? '#ffffff' : '#0c2340',
                      textShadow: isDark
                        ? '0 2px 8px rgba(0, 0, 0, 0.95), 0 0 25px rgba(0, 101, 255, 0.45)'
                        : '0 2px 4px rgba(255, 255, 255, 0.95), 0 0 12px rgba(255, 255, 255, 0.9)',
                    }}
                  >
                    <Box component="span" sx={{ display: 'block' }}>
                      Together
                    </Box>
                    <Box component="span" sx={{ display: 'block', pl: 1 }}>
                      for a Safer
                    </Box>
                    <Box
                      component="span"
                      sx={{
                        display: 'block',
                        pl: 2,
                        color: isDark ? '#60a5fa' : '#0065ff',
                      }}
                    >
                      Tomorrow
                    </Box>
                  </Box>

                  {/* Hand-drawn double energetic brush swoosh underline */}
                  <Box sx={{ width: '100%', mt: 0.4, pl: 1.5 }}>
                    <svg width="165" height="18" viewBox="0 0 165 18" fill="none">
                      <path
                        d="M 6,7 C 48,15 110,14 160,4"
                        stroke={primaryBrandBlue}
                        strokeWidth="3.4"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 22,14 C 60,18 105,17 148,10"
                        stroke={isDark ? '#38bdf8' : '#0052cc'}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        opacity="0.85"
                      />
                    </svg>
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* RIGHT COLUMN: The Clean White Authentication Card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  backgroundColor: cardBg,
                  borderRadius: 4,
                  p: { xs: 3.5, sm: 4, lg: 4.5 },
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
                    Create Account
                  </Typography>
                  <Typography sx={{ color: brandMutedText, fontSize: '0.88rem' }}>
                    Join the citizen emergency network for your district
                  </Typography>
                </Box>

                {/* Server Error Banner */}
                {serverError && (
                  <Alert
                    severity="error"
                    onClose={() => setServerError('')}
                    sx={{
                      mb: 2.5,
                      borderRadius: 2,
                      fontSize: '0.82rem',
                    }}
                  >
                    {serverError}
                  </Alert>
                )}

                {/* Registration Form */}
                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <Stack spacing={2}>
                    {/* Row 1: Full Name & Email */}
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography
                          sx={{
                            display: 'block',
                            mb: 0.75,
                            color: brandDarkNavy,
                            fontWeight: 700,
                            fontSize: '0.82rem',
                          }}
                        >
                          Full Name <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
                        </Typography>
                        <TextField
                          fullWidth
                          id="signup-name"
                          name="name"
                          placeholder="Full Name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          error={Boolean(fieldErrors.name)}
                          helperText={fieldErrors.name}
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
                            '& .MuiFormHelperText-root': { ml: 0.5, fontSize: '0.72rem' }
                          }}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography
                          sx={{
                            display: 'block',
                            mb: 0.75,
                            color: brandDarkNavy,
                            fontWeight: 700,
                            fontSize: '0.82rem',
                          }}
                        >
                          Email Address <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
                        </Typography>
                        <TextField
                          fullWidth
                          id="signup-email"
                          name="email"
                          type="email"
                          placeholder="name@example.com"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          error={Boolean(fieldErrors.email)}
                          helperText={fieldErrors.email}
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
                            '& .MuiFormHelperText-root': { ml: 0.5, fontSize: '0.72rem' }
                          }}
                        />
                      </Grid>
                    </Grid>

                    {/* Row 2: Mobile Number & District Search */}
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                          <Typography
                            sx={{
                              color: brandDarkNavy,
                              fontWeight: 700,
                              fontSize: '0.82rem',
                            }}
                          >
                            Mobile Number
                          </Typography>
                          <Typography sx={{ color: brandMutedText, fontSize: '0.72rem' }}>
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
                          helperText={fieldErrors.phone}
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
                            '& .MuiFormHelperText-root': { ml: 0.5, fontSize: '0.72rem' }
                          }}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography
                          sx={{
                            display: 'block',
                            mb: 0.75,
                            color: brandDarkNavy,
                            fontWeight: 700,
                            fontSize: '0.82rem',
                          }}
                        >
                          District (Alert Zone) <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
                        </Typography>
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
                            const commonSx = {
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
                              '& .MuiFormHelperText-root': { ml: 0.5, fontSize: '0.72rem' }
                            };

                            const existingAdornment = params?.slotProps?.input?.startAdornment || params?.InputProps?.startAdornment;

                            if (params?.slotProps?.input) {
                              return (
                                <TextField
                                  {...params}
                                  placeholder="Search district"
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
                                            <MapPin size={16} color={primaryBrandBlue} />
                                          </InputAdornment>
                                          {existingAdornment}
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
                                placeholder="Search district"
                                size="small"
                                error={Boolean(fieldErrors.district)}
                                helperText={fieldErrors.district}
                                InputProps={{
                                  ...(params?.InputProps || {}),
                                  startAdornment: (
                                    <>
                                      <InputAdornment position="start">
                                        <MapPin size={16} color={primaryBrandBlue} />
                                      </InputAdornment>
                                      {existingAdornment}
                                    </>
                                  ),
                                }}
                                sx={commonSx}
                              />
                            );
                          }}
                        />
                      </Grid>
                    </Grid>

                    {/* Row 3: Password & Confirm Password */}
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography
                          sx={{
                            display: 'block',
                            mb: 0.75,
                            color: brandDarkNavy,
                            fontWeight: 700,
                            fontSize: '0.82rem',
                          }}
                        >
                          Password <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
                        </Typography>
                        <TextField
                          fullWidth
                          id="signup-password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password (min 6 chars)"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          error={Boolean(fieldErrors.password)}
                          helperText={fieldErrors.password}
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
                            '& .MuiFormHelperText-root': { ml: 0.5, fontSize: '0.72rem' }
                          }}
                        />

                        {/* Password strength mini indicator */}
                        {formData.password && (
                          <Box mt={0.8} px={0.5}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.4 }}>
                              <Typography sx={{ color: brandMutedText, fontSize: '0.68rem' }}>
                                Strength:
                              </Typography>
                              <Typography sx={{ color: passwordStrength.color, fontSize: '0.68rem', fontWeight: 700 }}>
                                {passwordStrength.label}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {[1, 2, 3].map((step) => (
                                <Box
                                  key={step}
                                  sx={{
                                    flex: 1,
                                    height: 3,
                                    borderRadius: 1,
                                    backgroundColor:
                                      passwordStrength.score >= step
                                        ? passwordStrength.color
                                        : isDark ? 'rgba(255,255,255,0.1)' : '#dfe1e6',
                                    transition: 'background-color 0.2s ease',
                                  }}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography
                          sx={{
                            display: 'block',
                            mb: 0.75,
                            color: brandDarkNavy,
                            fontWeight: 700,
                            fontSize: '0.82rem',
                          }}
                        >
                          Confirm Password <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
                        </Typography>
                        <TextField
                          fullWidth
                          id="signup-confirm-password"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Re-enter password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          error={Boolean(fieldErrors.confirmPassword)}
                          helperText={fieldErrors.confirmPassword}
                          variant="outlined"
                          size="small"
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  edge="end"
                                  size="small"
                                  sx={{ color: brandMutedText }}
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
                              color: brandDarkNavy,
                              fontSize: '0.88rem',
                              '& fieldset': { borderColor: inputBorder },
                              '&:hover fieldset': { borderColor: primaryBrandBlue },
                              '&.Mui-focused fieldset': {
                                borderColor: primaryBrandBlue,
                                borderWidth: '1.5px',
                              },
                            },
                            '& .MuiFormHelperText-root': { ml: 0.5, fontSize: '0.72rem' }
                          }}
                        />
                      </Grid>
                    </Grid>

                    {/* Receive Emergency Alerts Checkbox */}
                    <Box
                      sx={{
                        p: 1.25,
                        borderRadius: 2,
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f4f5f7',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #dfe1e6',
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.receiveAlerts}
                            onChange={(e) => handleInputChange('receiveAlerts', e.target.checked)}
                            size="small"
                            sx={{
                              color: inputBorder,
                              '&.Mui-checked': { color: primaryBrandBlue },
                              p: 0.5,
                            }}
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ color: brandDarkNavy, fontSize: '0.82rem', fontWeight: 650 }}>
                              Receive real-time disaster alerts for {formData.district || 'my district'}
                            </Typography>
                            <Typography sx={{ color: brandMutedText, fontSize: '0.72rem' }}>
                              Instant broadcast notifications for localized flood, weather, and civil advisories.
                            </Typography>
                          </Box>
                        }
                        sx={{ m: 0, alignItems: 'flex-start' }}
                      />
                    </Box>

                    {/* Primary CTA Button: Create Account → */}
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
                        mt: 0.5,
                      }}
                    >
                      {loading ? 'Creating Citizen Account...' : 'Create Account'}
                    </Button>

                    {/* Clean Contained OR Divider */}
                    <Box sx={{ position: 'relative', textAlign: 'center', my: 2 }}>
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
                      }}
                    >
                      Continue with Google
                    </Button>

                    {/* Already have an account */}
                    <Box sx={{ textAlign: 'center', pt: 1 }}>
                      <Typography sx={{ color: brandSecondaryNavy, fontSize: '0.86rem' }}>
                        Already have an account?{' '}
                        <Typography
                          component={Link}
                          to="/login"
                          sx={{
                            color: primaryBrandBlue,
                            textDecoration: 'none',
                            fontWeight: 700,
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          Sign In
                        </Typography>
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 3. CLEAN BOTTOM FOOTER MATCHING MOCKUP & LOGIN.JSX */}
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
          <Typography sx={{ fontWeight: 650, fontSize: '0.82rem', color: brandDarkNavy }}>
            Building a safer, more resilient tomorrow.
          </Typography>
          <Typography sx={{ fontSize: '0.76rem', color: brandMutedText }}>
            Empowering communities with data, intelligence, and timely action.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: { xs: 1.5, sm: 2 } }}>
          <Typography
            onClick={() => setInfoModal('about')}
            sx={{
              fontSize: '0.78rem',
              color: brandSecondaryNavy,
              cursor: 'pointer',
              '&:hover': { color: primaryBrandBlue },
            }}
          >
            About
          </Typography>
          <Typography sx={{ color: inputBorder, fontSize: '0.78rem' }}>|</Typography>
          <Typography
            onClick={() => setInfoModal('contact')}
            sx={{
              fontSize: '0.78rem',
              color: brandSecondaryNavy,
              cursor: 'pointer',
              '&:hover': { color: primaryBrandBlue },
            }}
          >
            Contact
          </Typography>
          <Typography sx={{ color: inputBorder, fontSize: '0.78rem' }}>|</Typography>
          <Typography
            onClick={() => setInfoModal('about')}
            sx={{
              fontSize: '0.78rem',
              color: brandSecondaryNavy,
              cursor: 'pointer',
              '&:hover': { color: primaryBrandBlue },
            }}
          >
            Privacy Policy
          </Typography>
          <Typography sx={{ color: inputBorder, fontSize: '0.78rem' }}>|</Typography>
          <Typography
            onClick={() => setInfoModal('about')}
            sx={{
              fontSize: '0.78rem',
              color: brandSecondaryNavy,
              cursor: 'pointer',
              '&:hover': { color: primaryBrandBlue },
            }}
          >
            Terms of Service
          </Typography>
          <Typography sx={{ color: inputBorder, fontSize: '0.78rem' }}>|</Typography>
          <Typography sx={{ fontSize: '0.78rem', color: brandMutedText }}>
            © 2026. All rights reserved.
          </Typography>
        </Box>
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
            backgroundColor: cardBg,
            color: brandDarkNavy,
            border: `1px solid ${inputBorder}`,
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
              sx={{ color: brandMutedText }}
            >
              <X size={18} />
            </IconButton>
          </Box>

          <Typography variant="body2" sx={{ color: brandSecondaryNavy, mb: 2.5, fontSize: '0.84rem' }}>
            Choose an account to continue to <strong>AapdaNetra Platform</strong> as a Citizen.
          </Typography>

          {googleError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem' }}>
              {googleError}
            </Alert>
          )}

          {googleStep === 'email' ? (
            <Box>
              <Box
                onClick={() => handleGoogleNextEmail('citizen.delhi@gmail.com')}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: `1px solid ${inputBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  cursor: 'pointer',
                  mb: 2,
                  '&:hover': {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                    borderColor: primaryBrandBlue,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    backgroundColor: primaryBrandBlue,
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
                  <Typography variant="caption" sx={{ color: brandMutedText, fontSize: '0.74rem' }}>
                    citizen.delhi@gmail.com
                  </Typography>
                </Box>
              </Box>

              <Typography variant="caption" sx={{ color: brandMutedText, display: 'block', mb: 1 }}>
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
                    color: brandDarkNavy,
                    fontSize: '0.86rem',
                    '& fieldset': { borderColor: inputBorder },
                  },
                }}
              />

              <Box display="flex" justifyContent="flex-end" gap={1.5}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setGoogleModalOpen(false)}
                  sx={{ textTransform: 'none', borderRadius: 2, color: brandSecondaryNavy, borderColor: inputBorder }}
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
                    backgroundColor: primaryBrandBlue,
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
                <Typography variant="body2" fontWeight={600} sx={{ color: brandDarkNavy }}>
                  {googleEmail}
                </Typography>
                <Button
                  size="small"
                  onClick={() => setGoogleStep('email')}
                  sx={{ textTransform: 'none', fontSize: '0.75rem', p: 0, minWidth: 0, color: primaryBrandBlue }}
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
                        sx={{ color: brandMutedText }}
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
                    color: brandDarkNavy,
                    fontSize: '0.86rem',
                    '& fieldset': { borderColor: inputBorder },
                  },
                }}
              />

              <Box display="flex" justifyContent="flex-end" gap={1.5}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setGoogleStep('email')}
                  disabled={googleLoading}
                  sx={{ textTransform: 'none', borderRadius: 2, color: brandSecondaryNavy, borderColor: inputBorder }}
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
                    backgroundColor: primaryBrandBlue,
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
                    1. Real-Time Telemetry & Hazard Tracking
                  </Typography>
                  <Typography variant="body2" sx={{ color: brandSecondaryNavy, fontSize: '0.85rem' }}>
                    Continuous tracking of river basin levels, precipitation thresholds, and seismic sensors provides crucial predictive lead time.
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: brandDarkNavy }}>
                    2. Citizen Incident Reporting & Rapid Alerts
                  </Typography>
                  <Typography variant="body2" sx={{ color: brandSecondaryNavy, fontSize: '0.85rem' }}>
                    Registered citizens receive district-tailored notifications and can submit field-level hazard reports with precise coordinates.
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: brandDarkNavy }}>
                    3. Unified Emergency Operations Center (EOC)
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
                color: '#ffffff',
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
