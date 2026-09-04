import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Grid,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import PhoneInTalkOutlinedIcon from '@mui/icons-material/PhoneInTalkOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import LocalFireDepartmentOutlinedIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import LocalPoliceOutlinedIcon from '@mui/icons-material/LocalPoliceOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import { useThemeMode } from '../context/ThemeContext';
import { useLocationContext } from '../context/LocationContext';

const EMERGENCY_CONTACTS = [
  {
    title: 'National Unified Emergency',
    number: '112',
    desc: 'All-in-one emergency response (Police, Fire, Medical, Rescue)',
    icon: ShieldOutlinedIcon,
    color: '#ef4444',
    bgLight: '#fee2e2',
    bgDark: 'rgba(239, 68, 68, 0.15)'
  },
  {
    title: 'Ambulance & Trauma Care',
    number: '108',
    altNumber: '102',
    desc: '24/7 Medical emergency, trauma transit & patient transport',
    icon: LocalHospitalOutlinedIcon,
    color: '#10b981',
    bgLight: '#dcfce7',
    bgDark: 'rgba(16, 185, 129, 0.15)'
  },
  {
    title: 'NDMA National Disaster Control',
    number: '1078',
    desc: 'National Disaster Management Authority 24x7 emergency desk',
    icon: SupportAgentOutlinedIcon,
    color: '#0284c7',
    bgLight: '#e0f2fe',
    bgDark: 'rgba(2, 132, 199, 0.15)'
  },
  {
    title: 'State Disaster Ops Center (SDMA)',
    number: '1070',
    desc: 'State emergency operations command & flood/cyclone alerts',
    icon: SupportAgentOutlinedIcon,
    color: '#8b5cf6',
    bgLight: '#ede9fe',
    bgDark: 'rgba(139, 92, 246, 0.15)'
  },
  {
    title: 'Fire & Rescue Service',
    number: '101',
    desc: 'Urban fire emergencies, building collapses & water rescues',
    icon: LocalFireDepartmentOutlinedIcon,
    color: '#f97316',
    bgLight: '#ffedd5',
    bgDark: 'rgba(249, 115, 22, 0.15)'
  },
  {
    title: 'Police Emergency Response',
    number: '100',
    desc: 'Law enforcement, public safety & crowd evacuation control',
    icon: LocalPoliceOutlinedIcon,
    color: '#3b82f6',
    bgLight: '#dbeafe',
    bgDark: 'rgba(59, 130, 246, 0.15)'
  },
  {
    title: 'Women Emergency Helpline',
    number: '1091',
    desc: 'Women safety and disaster shelter protection services',
    icon: SupportAgentOutlinedIcon,
    color: '#ec4899',
    bgLight: '#fce7f3',
    bgDark: 'rgba(236, 72, 153, 0.15)'
  },
  {
    title: 'Childline Emergency Support',
    number: '1098',
    desc: 'Child protection and assistance in disaster displacement',
    icon: SupportAgentOutlinedIcon,
    color: '#14b8a6',
    bgLight: '#ccfbf1',
    bgDark: 'rgba(20, 184, 166, 0.15)'
  }
];

export default function EmergencyContactsModal({ open, onClose }) {
  const { isDark } = useThemeMode();
  const { location } = useLocationContext();
  const [copiedNumber, setCopiedNumber] = useState(null);

  const cardBg = isDark ? '#0f172a' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0';
  const textMain = isDark ? '#f8fafc' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';

  const handleCopy = (num) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const districtName = location?.name || location?.district || 'Active District';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: cardBg,
          border: `1px solid ${cardBorder}`,
          boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.6)' : '0 12px 30px rgba(0,0,0,0.12)',
          p: 1
        }
      }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '10px',
              bgcolor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <PhoneInTalkOutlinedIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: textMain }}>
              24x7 Emergency Helplines & Contacts
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="caption" sx={{ color: textMuted }}>
                Direct Toll-Free Dispatch • Region: <strong style={{ color: '#0284c7' }}>{districtName}</strong>
              </Typography>
              <Chip
                label="LIVE 24x7"
                size="small"
                sx={{
                  height: 18,
                  fontWeight: 800,
                  fontSize: '0.62rem',
                  bgcolor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981'
                }}
              />
            </Box>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: textMuted }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 2.5, py: 1.5 }}>
        <Grid container spacing={2}>
          {EMERGENCY_CONTACTS.map((c, i) => {
            const Icon = c.icon;
            const isCopied = copiedNumber === c.number;

            return (
              <Grid key={i} size={{ xs: 12, sm: 6 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                    border: `1px solid ${cardBorder}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '100%',
                    transition: 'all 0.18s ease',
                    '&:hover': {
                      borderColor: c.color,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Box display="flex" alignItems="flex-start" gap={1.5} mb={1.5}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '8px',
                        bgcolor: isDark ? c.bgDark : c.bgLight,
                        color: c.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Icon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box flexGrow={1}>
                      <Typography variant="subtitle2" fontWeight={800} sx={{ color: textMain }}>
                        {c.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: textMuted, display: 'block', lineHeight: 1.3 }}>
                        {c.desc}
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" justifyContent="space-between" pt={1} borderTop={`1px dashed ${cardBorder}`}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6" fontWeight={900} sx={{ color: c.color, letterSpacing: 0.5 }}>
                        {c.number}
                      </Typography>
                      {c.altNumber && (
                        <Typography variant="caption" sx={{ color: textMuted }}>
                          / {c.altNumber}
                        </Typography>
                      )}
                      <Tooltip title={isCopied ? "Copied!" : "Copy Number"}>
                        <IconButton size="small" onClick={() => handleCopy(c.number)} sx={{ color: textMuted }}>
                          {isCopied ? <CheckIcon fontSize="inherit" sx={{ color: '#10b981' }} /> : <ContentCopyIcon fontSize="inherit" />}
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<PhoneInTalkOutlinedIcon sx={{ fontSize: 16 }} />}
                      component="a"
                      href={`tel:${c.number}`}
                      sx={{
                        bgcolor: c.color,
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        textTransform: 'none',
                        borderRadius: '8px',
                        py: 0.4,
                        px: 1.5,
                        '&:hover': { bgcolor: c.color, filter: 'brightness(0.9)' }
                      }}
                    >
                      Call Now
                    </Button>
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2, pt: 1, justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: textMuted }}>
          During disasters, always follow directives issued by local disaster management authorities (NDMA/SDMA).
        </Typography>
        <Button
          onClick={onClose}
          variant="outlined"
          size="small"
          sx={{
            fontWeight: 700,
            textTransform: 'none',
            borderRadius: 2,
            borderColor: cardBorder,
            color: textMain
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
