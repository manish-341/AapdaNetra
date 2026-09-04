import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Chip
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import { useThemeMode } from '../context/ThemeContext';
import { getUserRole } from '../lib/auth';

export default function AdminOnlyModal({ open, onClose, featureName = 'This feature' }) {
  const { isDark } = useThemeMode();
  const currentRole = getUserRole();

  const cardBg = isDark ? '#0f172a' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0';
  const textMain = isDark ? '#f8fafc' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
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
      <DialogTitle sx={{ textAlign: 'center', pt: 3, pb: 1 }}>
        <Box
          sx={{
            width: 54,
            height: 54,
            borderRadius: '50%',
            bgcolor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 1.5
          }}
        >
          <LockOutlinedIcon sx={{ fontSize: 28 }} />
        </Box>
        <Typography variant="h6" fontWeight={800} sx={{ color: textMain }}>
          Only for Admin uses
        </Typography>
        <Typography variant="caption" sx={{ color: textMuted, display: 'block', mt: 0.5 }}>
          Restricted Administrative Access
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ textAlign: 'center', px: 3, py: 1 }}>
        <Typography variant="body2" sx={{ color: textMuted, lineHeight: 1.6, mb: 2 }}>
          <strong>{featureName}</strong> is strictly restricted to authorized District Administrators, Relief Coordinators, and Emergency Responders.
        </Typography>

        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
            border: `1px solid ${cardBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <AdminPanelSettingsOutlinedIcon sx={{ color: '#0284c7', fontSize: 20 }} />
            <Typography variant="caption" sx={{ color: textMuted, fontWeight: 700 }}>
              Your Current Portal Mode:
            </Typography>
          </Box>
          <Chip
            label={currentRole === 'CITIZEN' ? 'Citizen / User Portal' : currentRole}
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: '0.68rem',
              bgcolor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe',
              color: '#0284c7'
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 2.5, px: 3 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={onClose}
          sx={{
            bgcolor: '#0284c7',
            color: '#fff',
            fontWeight: 700,
            textTransform: 'none',
            borderRadius: 2,
            py: 1,
            '&:hover': { bgcolor: '#0369a1' }
          }}
        >
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
}
