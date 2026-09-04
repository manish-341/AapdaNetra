import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  Paper,
  Tooltip,
  Slide,
  Chip
} from '@mui/material';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import CloseIcon from '@mui/icons-material/Close';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import RemoveIcon from '@mui/icons-material/Remove';
import { useNavigate } from 'react-router-dom';
import AIChat from './AIChat';
import { postAIChat } from '../services/api';
import { useThemeMode } from '../context/ThemeContext';
import { useLocationContext } from '../context/LocationContext';

const SUGGESTED_PROMPTS = [
  "🏥 Nearest 24x7 Emergency Hospital",
  "⛺ Live Relief Shelter & Open Beds",
  "🌊 Flood / बाढ़ सुरक्षा निर्देश",
  "📞 Emergency Helplines (112, 108)",
  "🎒 72-Hour Emergency Kit checklist"
];

const INITIAL_MESSAGES = [
  {
    role: 'assistant',
    content: "### 🛡️ AAPDANETRA LIVE EMERGENCY & NAVIGATION ASSISTANT\n\nI am connected directly to your active district's **verified 24x7 trauma hospitals**, **live relief shelters**, and **emergency protocols**.\n\n• Ask: *'Pass me hospital batao'*, *'Check open shelters'*, or *'Evacuation route'*\n• Click **'Start GPS Navigation'** on any facility for turn-by-turn guidance\n• Multi-lingual: English, हिन्दी, Hinglish, असमीया, বাংলা",
    source: 'AapdaNetra Live AI Navigation System',
    timestamp: 'Just now'
  }
];

export default function FloatingAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { isDark } = useThemeMode();
  const { location } = useLocationContext();

  // Listen for global custom event to open floating assistant
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-ai-assistant', handleOpen);
    return () => window.removeEventListener('open-ai-assistant', handleOpen);
  }, []);

  const handleSend = async (message, extra = {}) => {
    const coords = {
      latitude: location?.lat,
      longitude: location?.lng,
      district: location?.district || location?.name,
      ...extra
    };
    return await postAIChat({ message, ...coords });
  };

  return (
    <>
      {/* Floating Action Launcher Button (Right Bottom Corner) */}
      {!isOpen && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            animation: 'fadeIn 0.3s ease-in-out'
          }}
        >
          <Tooltip title="Instant Disaster & Safety AI Assistant • Ask questions, find hospitals & shelters" arrow placement="left">
            <Button
              variant="contained"
              onClick={() => setIsOpen(true)}
              startIcon={
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                >
                  <SmartToyOutlinedIcon sx={{ fontSize: 22 }} />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: '#10b981',
                      border: '1.5px solid #fff'
                    }}
                  />
                </Box>
              }
              sx={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.88rem',
                textTransform: 'none',
                py: 1.25,
                px: 2.5,
                borderRadius: 5,
                boxShadow: '0 8px 25px rgba(99, 102, 241, 0.45), 0 0 15px rgba(139, 92, 246, 0.35)',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                letterSpacing: '0.01em',
                '&:hover': {
                  background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)',
                  transform: 'translateY(-3px) scale(1.02)',
                  boxShadow: '0 12px 30px rgba(99, 102, 241, 0.6), 0 0 20px rgba(139, 92, 246, 0.5)'
                }
              }}
            >
              AI Assistant
            </Button>
          </Tooltip>
        </Box>
      )}

      {/* Floating Chat Panel (Right Bottom Corner) */}
      {isOpen && (
        <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
          <Paper
            elevation={24}
            sx={{
              position: 'fixed',
              bottom: { xs: 10, sm: 20 },
              right: { xs: 10, sm: 20 },
              width: { xs: 'calc(100vw - 20px)', sm: 460, md: 480 },
              height: { xs: 'calc(100vh - 20px)', sm: 620 },
              maxHeight: 'calc(100vh - 40px)',
              zIndex: 1350,
              borderRadius: 4,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: isDark ? '#0f172a' : '#ffffff',
              border: isDark ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid rgba(99, 102, 241, 0.25)',
              boxShadow: isDark
                ? '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 30px rgba(139, 92, 246, 0.25)'
                : '0 20px 50px -10px rgba(0, 0, 0, 0.25), 0 0 20px rgba(99, 102, 241, 0.15)'
            }}
          >
            {/* Top Compact Floating Header */}
            <Box
              sx={{
                p: 1.5,
                px: 2,
                background: isDark
                  ? 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)'
                  : 'linear-gradient(135deg, #f5f3ff 0%, #e0e7ff 100%)',
                borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0
              }}
            >
              <Box display="flex" alignItems="center" gap={1.2}>
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 2.5,
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.35)'
                  }}
                >
                  <SmartToyOutlinedIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: isDark ? '#fff' : '#1e1b4b', lineHeight: 1.2 }}>
                      AapdaNetra AI Assistant
                    </Typography>
                    <Chip
                      label="LIVE GPS"
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        bgcolor: '#10b981',
                        color: '#fff'
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.72rem' }}>
                    Active Zone: <strong>{location?.name || location?.district || 'Current Location'}</strong>
                  </Typography>
                </Box>
              </Box>

              {/* Action Icons */}
              <Box display="flex" alignItems="center" gap={0.5}>
                <Tooltip title="Open Full Page Assistant" arrow>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/ai-assistant');
                    }}
                    sx={{ color: isDark ? '#94a3b8' : '#64748b', p: 0.75 }}
                  >
                    <OpenInFullIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Minimize" arrow>
                  <IconButton
                    size="small"
                    onClick={() => setIsOpen(false)}
                    sx={{ color: isDark ? '#94a3b8' : '#64748b', p: 0.75 }}
                  >
                    <RemoveIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Close" arrow>
                  <IconButton
                    size="small"
                    onClick={() => setIsOpen(false)}
                    sx={{ color: isDark ? '#94a3b8' : '#64748b', p: 0.75 }}
                  >
                    <CloseIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Embedded AIChat Container */}
            <Box
              sx={{
                flex: 1,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                '& .glass-card': {
                  border: 'none !important',
                  borderRadius: 0,
                  height: '100% !important',
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: 'transparent !important',
                  boxShadow: 'none !important'
                },
                '& .MuiPaper-root': {
                  bgcolor: 'transparent'
                }
              }}
            >
              <AIChat
                title=""
                subtitle=""
                onSendMessage={handleSend}
                initialMessages={INITIAL_MESSAGES}
                suggestedPrompts={SUGGESTED_PROMPTS}
                isCopilot={false}
              />
            </Box>
          </Paper>
        </Slide>
      )}
    </>
  );
}
