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
  CardContent,
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
    const segments = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
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
      return seg;
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, fontSize: '0.88rem', lineHeight: 1.55 }}>
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
                fontSize: '0.92rem',
                color: isDark ? '#38bdf8' : '#0284c7',
                mt: idx === 0 ? 0 : 0.75,
                mb: 0.25,
                letterSpacing: '0.01em',
              }}
            >
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
                  fontSize: '0.9rem',
                  lineHeight: 1.4,
                  userSelect: 'none',
                }}
              >
                &bull;
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
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  minWidth: 16,
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
              fontSize: '0.88rem',
              lineHeight: 1.55,
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

  const cardBg = isDark ? 'rgba(15, 23, 42, 0.75)' : '#ffffff';
  const cardBorder = isDark ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid #e2e8f0';

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box display="flex" alignItems="center" gap={1}>
        <NavigationIcon sx={{ color: '#38bdf8', fontSize: 18 }} />
        <Typography variant="caption" fontWeight="bold" sx={{ color: isDark ? '#38bdf8' : '#0284c7', letterSpacing: '0.04em' }}>
          ACTUAL EMERGENCY FACILITIES & TURN-BY-TURN GPS ({locationName || 'YOUR AREA'})
        </Typography>
      </Box>

      {/* Hospital Cards */}
      {hospitals.map((h, i) => (
        <Card
          key={`hosp-${i}`}
          variant="outlined"
          sx={{
            backgroundColor: cardBg,
            borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#fca5a5',
            borderRadius: 2.5,
            p: 1.5
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ p: 0.75, borderRadius: 1.5, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
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
                fontSize: '0.68rem',
                fontWeight: 800,
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444'
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
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'none',
                py: 0.4,
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
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'none',
                borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#cbd5e1',
                color: isDark ? '#f8fafc' : '#0f172a',
                py: 0.4
              }}
            >
              Call: {h.emergencyContact}
            </Button>
            <Button
              variant="text"
              size="small"
              startIcon={<OpenInNewIcon />}
              onClick={() => navigate('/map')}
              sx={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'none',
                color: '#38bdf8',
                py: 0.4
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
            borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#86efac',
            borderRadius: 2.5,
            p: 1.5
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ p: 0.75, borderRadius: 1.5, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
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
                fontSize: '0.68rem',
                fontWeight: 800,
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981'
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
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'none',
                py: 0.4,
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
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'none',
                borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#cbd5e1',
                color: isDark ? '#f8fafc' : '#0f172a',
                py: 0.4
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
}) {
  const { isDark } = useThemeMode();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const chatEndRef = useRef(null);

  const assistantBubbleBg = isDark ? 'rgba(30, 41, 59, 0.7)' : '#f1f5f9';
  const assistantBubbleText = isDark ? '#e2e8f0' : '#1e293b';
  const assistantBubbleBorder = isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)';
  const headerBg = isDark ? 'rgba(15, 23, 42, 0.6)' : '#ffffff';
  const headerBorder = isDark ? 'rgba(255, 255, 255, 0.05)' : '#e2e8f0';
  const textMain = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const inputContainerBg = isDark ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc';
  const inputContainerBorder = isDark ? 'rgba(255, 255, 255, 0.05)' : '#e2e8f0';
  const inputBg = isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff';
  const promptChipBg = isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9';
  const promptChipText = isDark ? '#94a3b8' : '#475569';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSpeak = (text, idx) => {
    if (!window.speechSynthesis) return;

    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[#*•_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // If Hindi or Hinglish, pick Hindi voice if available
    const isDevanagari = /[\u0900-\u097F]/.test(cleanText);
    if (isDevanagari || selectedLanguage === 'hi' || selectedLanguage === 'hinglish') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);

    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utterance);
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
        source: payload.source || 'AapdaNetra Live AI Emergency Assistant',
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
    <Paper className="glass-card" sx={{ p: 0, borderRadius: 3, display: 'flex', flexDirection: 'column', height: '680px', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${headerBorder}`, backgroundColor: headerBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box sx={{ p: 1, borderRadius: 2, backgroundColor: isCopilot ? 'rgba(234, 179, 8, 0.15)' : 'rgba(56, 189, 248, 0.15)', color: isCopilot ? '#eab308' : (isDark ? '#38bdf8' : '#0284c7') }}>
            {isCopilot ? <SecurityIcon /> : <SmartToyIcon />}
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: textMain, lineHeight: 1.2 }}>
              {title}
            </Typography>
            <Typography variant="caption" sx={{ color: textSecondary }}>
              {subtitle}
            </Typography>
          </Box>
        </Box>
        <Chip
          label={isCopilot ? "RESPONDER COPILOT" : "LIVE EMERGENCY NAVIGATOR"}
          size="small"
          sx={{ backgroundColor: isCopilot ? 'rgba(234, 179, 8, 0.2)' : (isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(2, 132, 199, 0.15)'), color: isCopilot ? '#eab308' : (isDark ? '#38bdf8' : '#0284c7'), fontWeight: 800, fontSize: '0.65rem' }}
        />
      </Box>

      {/* Multi-lingual Language Selector */}
      <Box sx={{ px: 2, py: 1, backgroundColor: isDark ? 'rgba(0,0,0,0.25)' : '#f8fafc', borderBottom: `1px solid ${headerBorder}`, display: 'flex', alignItems: 'center', gap: 1, overflowX: 'auto' }}>
        <Box display="flex" alignItems="center" gap={0.5} mr={0.5}>
          <TranslateIcon sx={{ fontSize: 16, color: '#38bdf8' }} />
          <Typography variant="caption" fontWeight="bold" sx={{ color: textSecondary, fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
            LANGUAGE:
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.75}>
          {LANGUAGES.map((l) => (
            <Chip
              key={l.id}
              label={l.label}
              size="small"
              clickable
              onClick={() => setSelectedLanguage(l.id)}
              sx={{
                fontSize: '0.68rem',
                height: 22,
                fontWeight: selectedLanguage === l.id ? 800 : 500,
                backgroundColor: selectedLanguage === l.id ? '#2563eb' : (isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'),
                color: selectedLanguage === l.id ? '#ffffff' : textSecondary,
                '&:hover': {
                  backgroundColor: selectedLanguage === l.id ? '#1d4ed8' : (isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1')
                }
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Suggested Prompts */}
      {suggestedPrompts.length > 0 && messages.length <= 1 && (
        <Box sx={{ p: 1.5, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)', borderBottom: `1px solid ${headerBorder}` }} display="flex" gap={1} flexWrap="wrap">
          {suggestedPrompts.map((prompt, idx) => (
            <Chip
              key={idx}
              label={prompt}
              onClick={() => handleSend(prompt)}
              size="small"
              clickable
              sx={{ backgroundColor: promptChipBg, color: promptChipText, '&:hover': { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.15)', color: isDark ? '#38bdf8' : '#0284c7' }, fontSize: '0.72rem', fontWeight: 500 }}
            />
          ))}
        </Box>
      )}

      {/* Message Stream */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {messages.map((msg, idx) => (
          <Box
            key={idx}
            display="flex"
            gap={1.5}
            justifyContent={msg.role === 'user' ? 'flex-end' : 'flex-start'}
          >
            {msg.role === 'assistant' && (
              <Box sx={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#38bdf8' : '#0284c7', flexShrink: 0 }}>
                <SmartToyIcon fontSize="small" />
              </Box>
            )}

            <Box sx={{ maxWidth: '88%' }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  backgroundColor: msg.role === 'user' ? '#2563eb' : assistantBubbleBg,
                  color: msg.role === 'user' ? '#ffffff' : assistantBubbleText,
                  border: msg.role === 'user' ? 'none' : assistantBubbleBorder
                }}
              >
                {msg.role === 'user' ? (
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: '0.88rem' }}>
                    {msg.content}
                  </Typography>
                ) : (
                  <>
                    <Box display="flex" justifyContent="flex-end" mb={0.5}>
                      <Tooltip title={speakingIdx === idx ? "Stop Voice" : "Listen Aloud / बोलकर सुनें"}>
                        <IconButton
                          size="small"
                          onClick={() => handleSpeak(msg.content, idx)}
                          sx={{ color: speakingIdx === idx ? '#ef4444' : (isDark ? '#94a3b8' : '#64748b'), p: 0.25 }}
                        >
                          {speakingIdx === idx ? <StopIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
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

              <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5} px={0.5}>
                <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.65rem' }}>
                  {msg.source || (msg.role === 'user' ? 'You' : 'AapdaNetra')}
                </Typography>
                <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.65rem' }}>
                  {msg.timestamp}
                </Typography>
              </Box>
            </Box>

            {msg.role === 'user' && (
              <Box sx={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                <PersonIcon fontSize="small" />
              </Box>
            )}
          </Box>
        ))}

        {loading && (
          <Box display="flex" gap={1.5} alignItems="center">
            <Box sx={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#38bdf8' : '#0284c7' }}>
              <SmartToyIcon fontSize="small" />
            </Box>
            <Paper elevation={0} sx={{ p: 1.5, borderRadius: '16px 16px 16px 4px', backgroundColor: assistantBubbleBg, border: assistantBubbleBorder }}>
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={16} sx={{ color: isDark ? '#38bdf8' : '#0284c7' }} />
                <Typography variant="caption" sx={{ color: textSecondary }}>
                  Querying live hospital trauma centers, shelters & navigation corridors...
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}
        <div ref={chatEndRef} />
      </Box>

      {/* Input Box */}
      <Box sx={{ p: 2, borderTop: `1px solid ${inputContainerBorder}`, backgroundColor: inputContainerBg }}>
        <Box display="flex" gap={1}>
          <TextField
            fullWidth
            placeholder={
              selectedLanguage === 'hi'
                ? "सवाल पूछें जैसे 'भूकंप आया है कहाँ जाएं?', 'निकटतम अस्पताल'..."
                : selectedLanguage === 'hinglish'
                ? "Poochhein jaise 'bhookamp aaya hai pass me kaha jaun', 'nearest hospital'..."
                : isCopilot
                ? "Ask operational query e.g. 'Show highest risk areas'..."
                : "Ask safety question e.g. 'Earthquake emergency: where can I go?'..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: inputBg,
                borderRadius: 2,
                color: textMain,
                '& fieldset': { borderColor: inputContainerBorder },
                '&:hover fieldset': { borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.3)' }
              }
            }}
          />
          <IconButton
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            sx={{ backgroundColor: '#2563eb', color: '#fff', '&:hover': { backgroundColor: '#1d4ed8' }, '&.Mui-disabled': { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', color: textSecondary } }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
}
