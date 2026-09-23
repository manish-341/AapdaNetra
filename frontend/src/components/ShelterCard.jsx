import React from 'react';
import { Paper, Box, Typography, Chip, LinearProgress } from '@mui/material';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import PhoneIcon from '@mui/icons-material/Phone';
import { useThemeMode } from '../context/ThemeContext';

export default function ShelterCard({ shelter, distance, estimatedTravelTime, isRecommended = false }) {
  const { isDark } = useThemeMode();
  if (!shelter) return null;

  const textMain = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#475569';
  const subBg = isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9';

  const occupancyRatio = (shelter.currentOccupancy / (shelter.capacity || 1)) * 100;
  const isAvailable = shelter.status === 'AVAILABLE';

  return (
    <Paper
      className="glass-card"
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: isRecommended
          ? '1.5px solid #38bdf8 !important'
          : isDark
          ? '1px solid rgba(255, 255, 255, 0.08) !important'
          : '1px solid #e2e8f0 !important',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {isRecommended && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            backgroundColor: '#38bdf8',
            color: '#090d16',
            px: 1.5,
            py: 0.25,
            borderBottomLeftRadius: 8,
            fontSize: '0.68rem',
            fontWeight: 800,
            letterSpacing: 0.5,
          }}
        >
          TOP RECOMMENDATION
        </Box>
      )}

      <Box display="flex" alignItems="flex-start" gap={1.5} mb={1.5}>
        <Box sx={{ p: 1, borderRadius: 2, backgroundColor: 'rgba(56, 189, 248, 0.12)', color: '#0284c7' }}>
          <HomeWorkIcon fontSize="medium" />
        </Box>
        <Box flex={1}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: textMain, lineHeight: 1.25 }}>
            {shelter.name}
          </Typography>
          <Typography variant="caption" sx={{ color: textSecondary, display: 'block', mt: 0.25 }}>
            {shelter.district}, {shelter.state} {shelter.address ? `• ${shelter.address}` : ''}
          </Typography>
        </Box>
      </Box>

      <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
        <Chip
          label={shelter.status}
          size="small"
          color={isAvailable ? 'success' : 'warning'}
          sx={{ fontWeight: 700, fontSize: '0.68rem' }}
        />
        {distance && (
          <Chip
            icon={<DirectionsRunIcon style={{ fontSize: 14 }} />}
            label={`${distance} • ${estimatedTravelTime || 'mins'}`}
            size="small"
            variant="outlined"
            sx={{
              color: isDark ? '#38bdf8' : '#0284c7',
              borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.3)',
              fontSize: '0.68rem',
              fontWeight: 600,
            }}
          />
        )}
        {shelter.contactNumber && (
          <Chip
            icon={<PhoneIcon style={{ fontSize: 14 }} />}
            label={shelter.contactNumber}
            size="small"
            variant="outlined"
            sx={{ color: textSecondary, fontSize: '0.68rem' }}
          />
        )}
      </Box>

      {/* Occupancy bar */}
      <Box mb={1.5}>
        <Box display="flex" justifyContent="space-between" mb={0.5}>
          <Typography variant="caption" sx={{ color: textSecondary }}>
            Capacity Utilization ({shelter.currentOccupancy} / {shelter.capacity})
          </Typography>
          <Typography
            variant="caption"
            fontWeight="bold"
            sx={{ color: occupancyRatio > 90 ? '#ef4444' : isDark ? '#38bdf8' : '#0284c7' }}
          >
            {shelter.availableCapacity} spots left
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min(occupancyRatio, 100)}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: occupancyRatio > 90 ? '#ef4444' : occupancyRatio > 70 ? '#f97316' : '#22c55e',
            },
          }}
        />
      </Box>

      {/* Facilities */}
      {shelter.facilities && shelter.facilities.length > 0 && (
        <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
          {shelter.facilities.map((fac, idx) => (
            <Typography
              key={idx}
              variant="caption"
              sx={{
                px: 1,
                py: 0.2,
                borderRadius: 1,
                backgroundColor: subBg,
                color: textSecondary,
                fontSize: '0.65rem',
                fontWeight: 600,
              }}
            >
              ✓ {fac}
            </Typography>
          ))}
        </Box>
      )}
    </Paper>
  );
}
