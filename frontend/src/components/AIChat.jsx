import React, { useState, useRef, useEffect } from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  Chip,
  Button,
  Stack,
  Card,
  Tooltip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import StopIcon from '@mui/icons-material/Stop';
import NavigationIcon from '@mui/icons-material/Navigation';
import PhoneIcon from '@mui/icons-material/Phone';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import TranslateIcon from '@mui/icons-material/Translate';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BoltIcon from '@mui/icons-material/Bolt';
import { useThemeMode } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const LANGUAGES = [
  { id: 'auto', label: '🌐 Auto-Detect' },
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिन्दी' },
  { id: 'hinglish', label: 'Hinglish' },
  { id: 'as', label: 'অসমীয়া' },
  { id: 'bn', label: 'বাংলা' },
];

function FormattedMessage({ text, isDark }) {
  if (!text) return null;

  const lines = text.split('\n');

  const parseInlineStyles = (line) => {
    const segments = line.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return segments.map((seg, i) => {
      if (seg.startsWith('**') && seg.endsWith('**')) {
        return (
          <Box
            component="span"
            key={i}
            sx={{ fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}
          >
            {seg.slice(2, -2)}
          </Box>
        );
      }
      if (seg.startsWith('*') && seg.endsWith('*')) {
        return (
          <Box
            component="span"
            key={i}
            sx={{ fontStyle: 'italic', color: isDark ? '#94a3b8' : '#475569' }}
          >
            {seg.slice(1, -1)}
          </Box>
        );
      }
      if (seg.startsWith('`') && seg.endsWith('`')) {
        return (
          <Box
            component="span"
            key={i}
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.85em',
              px: 0.6,
              py: 0.2,
              borderRadius: 1,
              backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.1)',
              color: isDark ? '#38bdf8' : '#0284c7'
            }}
          >
            {seg.slice(1, -1)}
          </Box>
        );
      }
      return seg;
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.7, fontSize: '0.9rem', lineHeight: 1.6 }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <Box key={idx} sx={{ height: 4 }} />;
        }

        if (trimmed.startsWith('###')) {
          const headerText = trimmed.replace(/^###\s*/, '');
          return (
            <Typography
              key={idx}
              variant="subtitle2"
              sx={{
                fontWeight: 800,
                fontSize: '0.95rem',
                color: isDark ? '#38bdf8' : '#0284c7',
                mt: idx === 0 ? 0 : 0.8,
                mb: 0.25,
                letterSpacing: '0.01em',
                display: 'flex',
                alignItems: 'center',
                gap: 0.75
              }}
            >
              <BoltIcon sx={{ fontSize: 18, color: '#38bdf8' }} />
              {parseInlineStyles(headerText)}
            </Typography>
          );
        }

        if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
          const bulletText = trimmed.replace(/^[•\-]\s*/, '');
          return (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                pl: 0.5,
                my: 0.15,
              }}
            >
              <Box
                component="span"
                sx={{
                  color: isDark ? '#38bdf8' : '#0284c7',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  lineHeight: 1.4,
                  userSelect: 'none',
                }}
              >
                •
              </Box>
              <Box sx={{ flex: 1 }}>{parseInlineStyles(bulletText)}</Box>
            </Box>
          );
        }

        const numberedMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
        if (numberedMatch) {
          return (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 0.8,
                pl: 0.5,
                my: 0.15,
              }}
            >
              <Box
                component="span"
                sx={{
                  color: isDark ? '#38bdf8' : '#0284c7',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  minWidth: 18,
                }}
              >
                {numberedMatch[1]}.
              </Box>
              <Box sx={{ flex: 1 }}>{parseInlineStyles(numberedMatch[2])}</Box>
            </Box>
          );
        }

        return (
          <Typography
            key={idx}
            variant="body2"
            sx={{
              color: isDark ? '#cbd5e1' : '#334155',
              fontSize: '0.9rem',
              lineHeight: 1.6,
            }}
          >
            {parseInlineStyles(trimmed)}
          </Typography>
        );
      })}
    </Box>
  );
}

/**
 * Interactive Emergency Facilities Action Cards (Hospitals & Shelters)
 */
function EmergencyFacilitiesCards({ facilities, isDark }) {
  const navigate = useNavigate();
  if (!facilities) return null;

  const { hospitals = [], shelters = [], locationName } = facilities;
  if (hospitals.length === 0 && shelters.length === 0) return null;

  const cardBg = isDark ? 'rgba(15, 23, 42, 0.85)' : '#ffffff';

  return (
    <Box sx={{ mt: 2.5, display: 'flex', flexDirection: 'column', gap: 1.75 }}>
      <Box display="flex" alignItems="center" gap={1}>
        <NavigationIcon sx={{ color: '#38bdf8', fontSize: 18 }} />
        <Typography variant="caption" fontWeight="bold" sx={{ color: isDark ? '#38bdf8' : '#0284c7', letterSpacing: '0.04em' }}>
          VERIFIED EMERGENCY FACILITIES & LIVE GPS ROUTING ({locationName || 'YOUR AREA'})
        </Typography>
      </Box>

      {/* Hospital Cards */}
      {hospitals.map((h, i) => (
        <Card
          key={`hosp-${i}`}
          variant="outlined"
          sx={{
            backgroundColor: cardBg,
            borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#fca5a5',
            borderRadius: 2.5,
            p: 1.75,
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            '&:hover': {
              borderColor: '#ef4444',
              transform: 'translateY(-2px)'
            }
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
            <Box display="flex" alignItems="center" gap={1.2}>
              <Box sx={{ p: 0.9, borderRadius: 2, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                <LocalHospitalIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ color: isDark ? '#fff' : '#0f172a' }}>
                  {h.name}
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                  {h.address}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={`${h.distanceKm} km • ~${h.durationMins}m`}
              size="small"
              sx={{
                fontSize: '0.7rem',
                fontWeight: 800,
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
            />
          </Box>

          <Box display="flex" gap={1} mt={1.5} flexWrap="wrap">
            <Button
              variant="contained"
              size="small"
              startIcon={<NavigationIcon />}
              onClick={() => window.open(h.navigationUrl, '_blank')}
              sx={{
                backgroundColor: '#2563eb',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'none',
                py: 0.5,
                px: 1.5,
                borderRadius: 1.5,
                '&:hover': { backgroundColor: '#1d4ed8' }
              }}
            >
              Start GPS Navigation
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PhoneIcon />}
              component="a"
              href={`tel:${h.emergencyContact}`}
              sx={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'none',
                borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#cbd5e1',
                color: isDark ? '#f8fafc' : '#0f172a',
                py: 0.5,
                borderRadius: 1.5
              }}
            >
              Call: {h.emergencyContact}
            </Button>
            <Button
              variant="text"
              size="small"
              startIcon={<OpenInNewIcon />}
              onClick={() => navigate('/disaster-map')}
              sx={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'none',
                color: '#38bdf8',
                py: 0.5
              }}
            >
              View on Live Map
            </Button>
          </Box>
        </Card>
      ))}

      {/* Shelter Cards */}
      {shelters.map((s, i) => (
        <Card
          key={`shelter-${i}`}
          variant="outlined"
          sx={{
            backgroundColor: cardBg,
            borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#86efac',
            borderRadius: 2.5,
            p: 1.75,
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            '&:hover': {
              borderColor: '#10b981',
              transform: 'translateY(-2px)'
            }
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
            <Box display="flex" alignItems="center" gap={1.2}>
              <Box sx={{ p: 0.9, borderRadius: 2, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                <HomeWorkIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ color: isDark ? '#fff' : '#0f172a' }}>
                  {s.name}
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                  {s.address || s.district} • {s.facilities?.slice(0, 3).join(', ') || 'Relief Shelter'}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={`${s.availableBeds} Beds Open`}
              size="small"
              sx={{
                fontSize: '0.7rem',
                fontWeight: 800,
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}
            />
          </Box>

          <Box display="flex" gap={1} mt={1.5} flexWrap="wrap">
            <Button
              variant="contained"
              size="small"
              startIcon={<NavigationIcon />}
              onClick={() => window.open(s.navigationUrl, '_blank')}
              sx={{
                backgroundColor: '#10b981',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'none',
                py: 0.5,
                px: 1.5,
                borderRadius: 1.5,
                '&:hover': { backgroundColor: '#059669' }
              }}
            >
              Start GPS Navigation ({s.distanceKm} km)
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PhoneIcon />}
              component="a"
              href={`tel:${s.contactNumber}`}
              sx={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'none',
                borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#cbd5e1',
                color: isDark ? '#f8fafc' : '#0f172a',
                py: 0.5,
                borderRadius: 1.5
              }}
            >
              Contact Shelter
            </Button>
          </Box>
        </Card>
      ))}
    </Box>
  );
}

export default function AIChat({
  title = 'AapdaNetra AI Emergency Assistant',
  subtitle = 'Live disaster intelligence, verified hospitals, relief shelters & multi-lingual navigation',
  suggestedPrompts = [],
  initialMessages = [],
  onSendMessage,
  isCopilot = false,
  activeLocationName = ''
}) {
  const { isDark } = useThemeMode();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const assistantBubbleBg = isDark ? 'rgba(20, 30, 48, 0.85)' : '#ffffff';
  const assistantBubbleText = isDark ? '#e2e8f0' : '#1e293b';
  const assistantBubbleBorder = isDark ? '1px solid rgba(56, 189, 248, 0.18)' : '1px solid rgba(2, 132, 199, 0.12)';
  const headerBg = isDark ? 'rgba(15, 23, 42, 0.75)' : '#ffffff';
  const headerBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';
  const textMain = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const inputContainerBg = isDark ? 'rgba(11, 17, 33, 0.9)' : '#ffffff';
  const inputContainerBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';
  const inputBg = isDark ? 'rgba(30, 41, 59, 0.65)' : '#f8fafc';
  const promptChipBg = isDark ? 'rgba(30, 41, 59, 0.7)' : '#f1f5f9';
  const promptChipText = isDark ? '#cbd5e1' : '#334155';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Voice output (SpeechSynthesis)
  const handleSpeak = (text, idx) => {
    if (!window.speechSynthesis) return;

    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[#*•_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);

    const isDevanagari = /[\u0900-\u097F]/.test(cleanText);
    if (isDevanagari || selectedLanguage === 'hi' || selectedLanguage === 'hinglish') {
      utterance.lang = 'hi-IN';
    } else if (selectedLanguage === 'bn' || selectedLanguage === 'as') {
      utterance.lang = 'bn-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);

    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utterance);
  };

  // Copy message text
  const handleCopy = (text, idx) => {
    const cleanText = text.replace(/[#*•_`]/g, '');
    navigator.clipboard.writeText(cleanText);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // Reset conversation
  const handleReset = () => {
    setMessages(initialMessages);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingIdx(null);
  };

  // Speech-to-Text (Microphone)
  const toggleListening = () => {
    const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    if (!SpeechRecognition) {
      alert("Voice speech-to-text is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = selectedLanguage === 'hi' ? 'hi-IN' : (selectedLanguage === 'bn' || selectedLanguage === 'as') ? 'bn-IN' : 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? prev + ' ' + transcript : transcript));
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition error:", err);
      setIsListening(false);
    }
  };

  const handleSend = async (textToSend = input) => {
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await onSendMessage(textToSend, { language: selectedLanguage });
      const payload = response?.data?.data || response?.data || response || {};
      const aiMsg = {
        role: 'assistant',
        content: payload.response || payload.message || payload.content || (typeof payload === 'string' ? payload : 'No response generated.'),
        source: payload.source || (isCopilot ? 'AapdaNetra Decision Support Engine' : 'AapdaNetra Live AI Emergency Assistant'),
        context: payload.context,
        actionableFacilities: payload.actionableFacilities,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error retrieving data. Please check connection and try again.',
          source: 'Error Handler',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      className="glass-card"
      sx={{
        p: 0,
        borderRadius: { xs: 2.5, md: 3.5 },
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        boxShadow: isDark
          ? '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(56, 189, 248, 0.08)'
          : '0 12px 36px rgba(15, 23, 42, 0.08), 0 0 20px rgba(2, 132, 199, 0.06)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
        background: isDark
          ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(11, 17, 33, 0.95) 100%)'
          : 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Top Header Bar - Rendered when title is provided */}
      {title && (
        <Box
          sx={{
            p: { xs: 1.5, sm: 2 },
            px: { xs: 2, sm: 2.5 },
            borderBottom: `1px solid ${headerBorder}`,
            backgroundColor: headerBg,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5,
            flexShrink: 0
          }}
        >
          <Box display="flex" alignItems="center" gap={1.75}>
            <Box
              sx={{
                position: 'relative',
                p: 1.1,
                borderRadius: 2.5,
                background: isCopilot
                  ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.25) 0%, rgba(202, 138, 4, 0.15) 100%)'
                  : 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(37, 99, 235, 0.15) 100%)',
                color: isCopilot ? '#eab308' : (isDark ? '#38bdf8' : '#0284c7'),
                border: isCopilot ? '1px solid rgba(234, 179, 8, 0.35)' : '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isCopilot ? '0 0 15px rgba(234, 179, 8, 0.2)' : '0 0 15px rgba(56, 189, 248, 0.2)'
              }}
            >
              {isCopilot ? <SecurityIcon sx={{ fontSize: 24 }} /> : <SmartToyIcon sx={{ fontSize: 24 }} />}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -1,
                  right: -1,
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  bgcolor: '#10b981',
                  border: isDark ? '2px solid #0f172a' : '2px solid #fff'
                }}
              />
            </Box>
            <Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="subtitle1" fontWeight="800" sx={{ color: textMain, lineHeight: 1.25, fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>
                  {title}
                </Typography>
                {activeLocationName && (
                  <Chip
                    icon={<LocationOnIcon sx={{ fontSize: 13, color: '#38bdf8 !important' }} />}
                    label={activeLocationName}
                    size="small"
                    sx={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      height: 20,
                      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.08)',
                      color: isDark ? '#38bdf8' : '#0284c7',
                      border: '1px solid rgba(56, 189, 248, 0.25)'
                    }}
                  />
                )}
              </Box>
              <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.74rem' }}>
                {subtitle}
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Clear chat & reset session" arrow>
              <IconButton
                size="small"
                onClick={handleReset}
                sx={{
                  color: textSecondary,
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #cbd5e1',
                  borderRadius: 2,
                  p: 0.6,
                  '&:hover': {
                    color: isDark ? '#f8fafc' : '#0f172a',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'
                  }
                }}
              >
                <RestartAltIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

            <Chip
              icon={
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    bgcolor: isCopilot ? '#eab308' : '#10b981',
                    boxShadow: isCopilot ? '0 0 8px #eab308' : '0 0 8px #10b981',
                    ml: 0.8
                  }}
                />
              }
              label={isCopilot ? "RESPONDER COPILOT" : "LIVE AI NAVIGATOR"}
              size="small"
              sx={{
                backgroundColor: isCopilot ? 'rgba(234, 179, 8, 0.15)' : (isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.1)'),
                color: isCopilot ? '#eab308' : (isDark ? '#38bdf8' : '#0284c7'),
                border: isCopilot ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(56, 189, 248, 0.25)',
                fontWeight: 800,
                fontSize: '0.68rem',
                letterSpacing: '0.04em'
              }}
            />
          </Stack>
        </Box>
      )}

      {/* Multi-lingual Language Selector */}
      <Box
        sx={{
          px: { xs: 1.5, sm: 2.5 },
          py: 1,
          backgroundColor: isDark ? 'rgba(11, 17, 33, 0.7)' : '#f8fafc',
          borderBottom: `1px solid ${headerBorder}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          overflowX: 'auto',
          flexShrink: 0
        }}
      >
        <Box display="flex" alignItems="center" gap={0.5} mr={0.5} flexShrink={0}>
          <TranslateIcon sx={{ fontSize: 16, color: '#38bdf8' }} />
          <Typography variant="caption" fontWeight="800" sx={{ color: textSecondary, fontSize: '0.7rem', letterSpacing: '0.04em' }}>
            LANGUAGE:
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.75} sx={{ overflowX: 'auto' }}>
          {LANGUAGES.map((l) => (
            <Chip
              key={l.id}
              label={l.label}
              size="small"
              clickable
              onClick={() => setSelectedLanguage(l.id)}
              sx={{
                fontSize: '0.72rem',
                height: 24,
                borderRadius: 1.5,
                fontWeight: selectedLanguage === l.id ? 800 : 500,
                backgroundColor: selectedLanguage === l.id ? '#2563eb' : (isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'),
                color: selectedLanguage === l.id ? '#ffffff' : textSecondary,
                border: selectedLanguage === l.id ? '1px solid #3b82f6' : '1px solid transparent',
                boxShadow: selectedLanguage === l.id ? '0 2px 8px rgba(37, 99, 235, 0.4)' : 'none',
                transition: 'all 0.15s ease',
                '&:hover': {
                  backgroundColor: selectedLanguage === l.id ? '#1d4ed8' : (isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1'),
                  transform: 'translateY(-1px)'
                }
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Suggested Quick Action Prompts */}
      {suggestedPrompts.length > 0 && messages.length <= 1 && (
        <Box
          sx={{
            p: { xs: 1.25, sm: 1.75 },
            px: { xs: 1.5, sm: 2.5 },
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)',
            borderBottom: `1px solid ${headerBorder}`,
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            flexShrink: 0
          }}
        >
          {suggestedPrompts.map((prompt, idx) => (
            <Chip
              key={idx}
              label={prompt}
              onClick={() => handleSend(prompt)}
              size="small"
              clickable
              sx={{
                backgroundColor: promptChipBg,
                color: promptChipText,
                border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                borderRadius: 2,
                fontSize: '0.75rem',
                fontWeight: 600,
                py: 0.5,
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  backgroundColor: isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(2, 132, 199, 0.15)',
                  color: isDark ? '#38bdf8' : '#0284c7',
                  borderColor: isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(2, 132, 199, 0.3)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(56, 189, 248, 0.15)'
                }
              }}
            />
          ))}
        </Box>
      )}

      {/* Primary Message Stream (Expands to Fill Screen Height) */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          p: { xs: 1.75, sm: 2.75 },
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
          scrollBehavior: 'smooth',
          '&::-webkit-scrollbar': {
            width: '6px'
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: isDark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.4)',
            borderRadius: '4px'
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: isDark ? 'rgba(148, 163, 184, 0.45)' : 'rgba(148, 163, 184, 0.6)'
          }
        }}
      >
        {messages.map((msg, idx) => (
          <Box
            key={idx}
            display="flex"
            gap={1.5}
            justifyContent={msg.role === 'user' ? 'flex-end' : 'flex-start'}
            sx={{ animation: 'fadeIn 0.25s ease-out' }}
          >
            {msg.role === 'assistant' && (
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isDark ? '#38bdf8' : '#0284c7',
                  border: isDark ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(2, 132, 199, 0.25)',
                  flexShrink: 0,
                  mt: 0.25
                }}
              >
                <SmartToyIcon sx={{ fontSize: 20 }} />
              </Box>
            )}

            <Box sx={{ maxWidth: { xs: '92%', sm: '85%' } }}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 1.75, sm: 2.25 },
                  borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  backgroundColor: msg.role === 'user' ? '#2563eb' : assistantBubbleBg,
                  backgroundImage: msg.role === 'user'
                    ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                    : 'none',
                  color: msg.role === 'user' ? '#ffffff' : assistantBubbleText,
                  border: msg.role === 'user' ? 'none' : assistantBubbleBorder,
                  borderLeft: msg.role === 'assistant'
                    ? (isDark ? '4px solid #38bdf8' : '4px solid #0284c7')
                    : 'none',
                  boxShadow: msg.role === 'user'
                    ? '0 6px 20px rgba(37, 99, 235, 0.35)'
                    : (isDark ? '0 6px 20px rgba(0, 0, 0, 0.35)' : '0 4px 15px rgba(0, 0, 0, 0.05)'),
                  position: 'relative'
                }}
              >
                {msg.role === 'user' ? (
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.92rem', fontWeight: 500 }}>
                    {msg.content}
                  </Typography>
                ) : (
                  <>
                    <Box display="flex" justifyContent="flex-end" gap={0.5} mb={0.5}>
                      <Tooltip title={copiedIdx === idx ? "Copied!" : "Copy response"} arrow>
                        <IconButton
                          size="small"
                          onClick={() => handleCopy(msg.content, idx)}
                          sx={{ color: copiedIdx === idx ? '#10b981' : (isDark ? '#94a3b8' : '#64748b'), p: 0.35 }}
                        >
                          {copiedIdx === idx ? <CheckIcon sx={{ fontSize: 16 }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={speakingIdx === idx ? "Stop Voice" : "Listen Aloud / बोलकर सुनें"} arrow>
                        <IconButton
                          size="small"
                          onClick={() => handleSpeak(msg.content, idx)}
                          sx={{ color: speakingIdx === idx ? '#ef4444' : (isDark ? '#94a3b8' : '#64748b'), p: 0.35 }}
                        >
                          {speakingIdx === idx ? <StopIcon sx={{ fontSize: 17 }} /> : <VolumeUpIcon sx={{ fontSize: 17 }} />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <FormattedMessage text={msg.content} isDark={isDark} />
                    {msg.actionableFacilities && (
                      <EmergencyFacilitiesCards facilities={msg.actionableFacilities} isDark={isDark} />
                    )}
                  </>
                )}
              </Paper>

              <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.6} px={0.75}>
                <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.68rem', fontWeight: 600 }}>
                  {msg.source || (msg.role === 'user' ? 'You' : 'AapdaNetra')}
                </Typography>
                <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.68rem' }}>
                  {msg.timestamp}
                </Typography>
              </Box>
            </Box>

            {msg.role === 'user' && (
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                  mt: 0.25
                }}
              >
                <PersonIcon sx={{ fontSize: 20 }} />
              </Box>
            )}
          </Box>
        ))}

        {loading && (
          <Box display="flex" gap={1.5} alignItems="center" sx={{ animation: 'fadeIn 0.2s ease-in' }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDark ? '#38bdf8' : '#0284c7',
                border: isDark ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(2, 132, 199, 0.25)'
              }}
            >
              <SmartToyIcon sx={{ fontSize: 20 }} />
            </Box>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '18px 18px 18px 4px',
                backgroundColor: assistantBubbleBg,
                border: assistantBubbleBorder,
                borderLeft: isDark ? '4px solid #38bdf8' : '4px solid #0284c7'
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5}>
                <CircularProgress size={18} sx={{ color: isDark ? '#38bdf8' : '#0284c7' }} />
                <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.85rem' }}>
                  Querying live district trauma centers, shelters & safety protocols...
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}
        <div ref={chatEndRef} />
      </Box>

      {/* Docked Command Input Bar (Pinned Directly to Bottom) */}
      <Box
        sx={{
          p: { xs: 1.5, sm: 2 },
          px: { xs: 2, sm: 2.5 },
          borderTop: `1px solid ${inputContainerBorder}`,
          backgroundColor: inputContainerBg,
          flexShrink: 0,
          boxShadow: isDark ? '0 -10px 25px rgba(0, 0, 0, 0.4)' : '0 -6px 20px rgba(0, 0, 0, 0.03)'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            backgroundColor: inputBg,
            borderRadius: 3.5,
            p: '5px 8px 5px 14px',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
            transition: 'all 0.2s ease',
            '&:focus-within': {
              borderColor: isDark ? '#38bdf8' : '#0284c7',
              boxShadow: isDark ? '0 0 0 3px rgba(56, 189, 248, 0.2)' : '0 0 0 3px rgba(2, 132, 199, 0.15)',
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : '#ffffff'
            }
          }}
        >
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder={
              isListening
                ? "🎙️ Listening... Please speak your question now..."
                : selectedLanguage === 'hi'
                ? "सवाल पूछें जैसे 'भूकंप आया है कहाँ जाएं?', 'निकटतम अस्पताल'..."
                : selectedLanguage === 'hinglish'
                ? "Poochhein jaise 'bhookamp aaya hai pass me kaha jaun', 'nearest hospital'..."
                : selectedLanguage === 'bn'
                ? "জরুরি প্রশ্ন জিজ্ঞাসা করুন যেমন 'নিকটতম হাসপাতাল কোথায়?'..."
                : selectedLanguage === 'as'
                ? "আপৎকালীন প্ৰশ্ন সোধক যেনে 'ওচৰৰ চিকিৎসালয় ক'ত?'..."
                : isCopilot
                ? "Ask operational query e.g. 'Show highest risk areas right now'..."
                : "Ask safety question e.g. 'Earthquake emergency: where can I go?'..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              sx: {
                color: textMain,
                fontSize: { xs: '0.88rem', sm: '0.94rem' },
                lineHeight: 1.5,
                py: 0.5
              }
            }}
          />

          <Stack direction="row" spacing={0.5} alignItems="center">
            {/* Voice Dictation Button */}
            <Tooltip title={isListening ? "Stop Listening" : "Speak your question (Voice Input)"} arrow>
              <IconButton
                size="small"
                onClick={toggleListening}
                sx={{
                  color: isListening ? '#ef4444' : textSecondary,
                  backgroundColor: isListening ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                  p: 1,
                  borderRadius: 2.5,
                  animation: isListening ? 'pulse 1.5s infinite' : 'none',
                  '&:hover': {
                    backgroundColor: isListening ? 'rgba(239, 68, 68, 0.25)' : (isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'),
                    color: isListening ? '#dc2626' : (isDark ? '#38bdf8' : '#0284c7')
                  }
                }}
              >
                {isListening ? <MicOffIcon sx={{ fontSize: 20 }} /> : <MicIcon sx={{ fontSize: 20 }} />}
              </IconButton>
            </Tooltip>

            {/* Send Button */}
            <IconButton
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              sx={{
                background: input.trim() && !loading
                  ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                  : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'),
                color: input.trim() && !loading ? '#ffffff' : textSecondary,
                p: 1,
                borderRadius: 2.5,
                boxShadow: input.trim() && !loading ? '0 4px 14px rgba(37, 99, 235, 0.4)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  background: input.trim() && !loading
                    ? 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)'
                    : undefined,
                  transform: input.trim() && !loading ? 'translateY(-1px) scale(1.05)' : undefined
                },
                '&.Mui-disabled': {
                  color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'
                }
              }}
            >
              <SendIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.8} px={1}>
          <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.67rem' }}>
            🛡️ Live disaster intelligence grounded in official NDMA protocols & verified district database records
          </Typography>
          <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.67rem', display: { xs: 'none', sm: 'block' } }}>
            Press <strong>Enter ↵</strong> to send, <strong>Shift + Enter</strong> for newline
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
