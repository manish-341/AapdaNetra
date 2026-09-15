import React from 'react';
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
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useThemeMode } from '../context/ThemeContext';
import { useLocationContext } from '../context/LocationContext';
import { getUserRole } from '../lib/auth';

export default function QuickActionModal({ open, onClose, action, onNavigate }) {
  const { isDark } = useThemeMode();
  const { location } = useLocationContext();
  const userRole = getUserRole();
  const isAdmin = ["ADMIN", "ADMINISTRATOR"].includes(userRole);

  if (!action) return null;

  const cardBg = isDark ? '#0f172a' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0';
  const textMain = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#cbd5e1' : '#475569';
  const textMuted = isDark ? '#94a3b8' : '#64748b';

  const districtName = location?.name || location?.district || 'Active Sector';

  const handleGoToPage = () => {
    onClose();
    if (onNavigate) {
      onNavigate(action.targetPath, action.adminRequired);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
      {/* Header */}
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center" gap={1.6}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              bgcolor: isDark ? action.bgDark || 'rgba(59, 130, 246, 0.18)' : action.bgLight || '#dbeafe',
              color: action.color || '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {action.icon}
          </Box>
          <Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6" fontWeight={800} sx={{ color: textMain, lineHeight: 1.2 }}>
                {action.title}
              </Typography>
              {action.adminRequired && !isAdmin && (
                <Chip
                  label="ADMIN ONLY"
                  size="small"
                  icon={<LockOutlinedIcon style={{ fontSize: 12, color: '#ef4444' }} />}
                  sx={{
                    height: 20,
                    fontWeight: 800,
                    fontSize: '0.62rem',
                    bgcolor: 'rgba(239, 68, 68, 0.12)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                  }}
                />
              )}
            </Box>
            <Typography variant="caption" sx={{ color: textMuted, display: 'block', mt: 0.3 }}>
              {action.subtitle} • Location: <strong style={{ color: action.color || '#0284c7' }}>{districtName}</strong>
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: textMuted }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ px: 2.5, py: 1.5 }}>
        {/* Key Stats Row */}
        {action.stats && action.stats.length > 0 && (
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            {action.stats.map((stat, idx) => (
              <Grid key={idx} item xs={12 / Math.min(action.stats.length, 3)}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
                    border: `1px solid ${cardBorder}`,
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="caption" sx={{ color: textMuted, fontWeight: 700, display: 'block' }}>
                    {stat.label}
                  </Typography>
                  <Typography variant="h6" fontWeight={800} sx={{ color: stat.color || action.color || textMain, my: 0.2 }}>
                    {stat.value}
                  </Typography>

                </Box>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Details List */}
        <Box
          sx={{
            p: 2,
            borderRadius: 2.5,
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f1f5f9',
            border: `1px solid ${cardBorder}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.2
          }}
        >
          <Typography variant="subtitle2" fontWeight={800} sx={{ color: textMain, mb: 0.5 }}>
            Quick Overview & Status Details:
          </Typography>
          {action.details && action.details.map((item, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 0.8,
                px: 1.2,
                borderRadius: 1.5,
                bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                border: `1px solid ${cardBorder}`
              }}
            >
              <Typography variant="body2" sx={{ color: textSecondary, fontWeight: 600, fontSize: '0.82rem' }}>
                {item.label}
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" fontWeight={700} sx={{ color: item.color || textMain, fontSize: '0.84rem' }}>
                  {item.value}
                </Typography>
                {item.badge && (
                  <Chip
                    label={item.badge}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      bgcolor: item.badgeBg || 'rgba(16, 185, 129, 0.15)',
                      color: item.badgeColor || '#10b981'
                    }}
                  />
                )}
              </Box>
            </Box>
          ))}
        </Box>

        {/* Note if admin required */}
        {action.adminRequired && !isAdmin && (
          <Box
            sx={{
              mt: 2,
              p: 1.2,
              borderRadius: 2,
              bgcolor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#fef2f2',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <LockOutlinedIcon sx={{ color: '#ef4444', fontSize: 18 }} />
            <Typography variant="caption" sx={{ color: isDark ? '#fca5a5' : '#991b1b', fontWeight: 600 }}>
              Full management & modification on this page is restricted to authorized Administrators.
            </Typography>
          </Box>
        )}
      </DialogContent>

      {/* Footer Actions */}
      <DialogActions sx={{ px: 2.5, pb: 2, pt: 1, justifyContent: 'space-between' }}>
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

        {/* "Go to this page" Button (Explicitly required for all quick actions except Emergency Contact) */}
        <Button
          onClick={handleGoToPage}
          variant="contained"
          size="medium"
          endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
          sx={{
            bgcolor: action.color || '#0284c7',
            color: '#ffffff',
            fontWeight: 700,
            textTransform: 'none',
            borderRadius: 2,
            px: 2.5,
            py: 0.8,
            boxShadow: `0 3px 12px ${action.color ? action.color + '40' : 'rgba(2,132,199,0.3)'}`,
            '&:hover': {
              bgcolor: action.color || '#0369a1',
              filter: 'brightness(0.9)'
            }
          }}
        >
          {action.targetLabel || 'Go to this page'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
