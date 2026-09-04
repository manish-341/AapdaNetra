import React from 'react';
import { Paper, Box, Typography, Chip, LinearProgress } from '@mui/material';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import PhoneIcon from '@mui/icons-material/Phone';

export default function ShelterCard({ shelter, distance, estimatedTravelTime, isRecommended = false }) {
  if (!shelter) return null;

  const occupancyRatio = (shelter.currentOccupancy / (shelter.capacity || 1)) * 100;
  const isAvailable = shelter.status === 'AVAILABLE';

  return (
    <Paper
      className="glass-card"
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: isRecommended ? '1.5px solid #38bdf8 !important' : '1px solid rgba(255, 255, 255, 0.08) !important',
        position: 'relative',
        overflow: 'hidden'
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
            letterSpacing: 0.5
          }}
        >
          TOP RECOMMENDATION
        </Box>
      )}

      <Box display="flex" alignItems="flex-start" gap={1.5} mb={1.5}>
        <Box sx={{ p: 1, borderRadius: 2, backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>
          <HomeWorkIcon fontSize="medium" />
        </Box>
        <Box flex={1}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#f8fafc', lineHeight: 1.2 }}>
            {shelter.name}
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
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
            sx={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)', fontSize: '0.68rem', fontWeight: 600 }}
          />
        )}
        {shelter.contactNumber && (
          <Chip
            icon={<PhoneIcon style={{ fontSize: 14 }} />}
            label={shelter.contactNumber}
            size="small"
            variant="outlined"
            sx={{ color: '#94a3b8', fontSize: '0.68rem' }}
          />
        )}
      </Box>

      {/* Occupancy bar */}
      <Box mb={1.5}>
        <Box display="flex" justifyContent="space-between" mb={0.5}>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            Capacity Utilization ({shelter.currentOccupancy} / {shelter.capacity})
          </Typography>
          <Typography variant="caption" fontWeight="bold" sx={{ color: occupancyRatio > 90 ? '#ef4444' : '#38bdf8' }}>
            {shelter.availableCapacity} spots left
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min(occupancyRatio, 100)}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: occupancyRatio > 90 ? '#ef4444' : occupancyRatio > 70 ? '#f97316' : '#22c55e'
            }
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
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#cbd5e1',
                fontSize: '0.65rem'
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
