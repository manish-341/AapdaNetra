import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import Boilerplate from '../layouts/Boilerplate';
import AIChat from '../components/AIChat';
import { postAICopilot } from '../services/api';
import { useThemeMode } from '../context/ThemeContext';
import { useLocationContext } from '../context/LocationContext';

const COPILOT_PROMPTS = [
  "Show me the highest-risk areas right now.",
  "Which shelters still have available capacity?",
  "Which incidents need immediate attention?",
  "Summarize today's disaster situation.",
  "Which locations have multiple citizen reports?",
  "Which area should responders prioritize?"
];

const INITIAL_MESSAGES = [
  {
    role: 'assistant',
    content: "Operational Command Center ready. I am AapdaNetra Emergency Copilot. Ask me to summarize ongoing incidents, check shelter capacities, prioritize high-vulnerability habitations, or aggregate citizen field reports.",
    source: 'Operational Intelligence Engine',
    timestamp: 'Just now'
  }
];

export default function AICopilot() {
  const { isDark } = useThemeMode();
  const { location } = useLocationContext();
  const textMain = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';

  const handleSend = async (message, extra = {}) => {
    let coords = {
      latitude: location.lat,
      longitude: location.lng,
      district: location.district || location.name,
      ...extra
    };
    return await postAICopilot({ message, query: message, ...coords });
  };

  return (
    <Boilerplate>
      <Box mb={3}>
        <Typography variant="caption" sx={{ color: isDark ? '#eab308' : '#d97706', fontWeight: 600 }}>Responder Command Portal &gt; Emergency Copilot</Typography>
        <Typography variant="h5" fontWeight="bold" sx={{ color: textMain, mt: 0.5 }}>
          AapdaNetra Emergency Copilot
        </Typography>
        <Typography variant="body2" sx={{ color: textSecondary }}>
          Decision-support AI for responders. Queries live MongoDB databases, ML model scores, and field report streams.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <AIChat
            title="Operational Decision Support Copilot"
            subtitle="Strictly non-hallucinating engine retrieving live backend statistics and geospatial assessments"
            onSendMessage={handleSend}
            initialMessages={INITIAL_MESSAGES}
            suggestedPrompts={COPILOT_PROMPTS}
            isCopilot={true}
          />
        </Grid>
      </Grid>
    </Boilerplate>
  );
}
