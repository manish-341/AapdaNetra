import React from 'react';
import { Box } from '@mui/material';
import Boilerplate from '../layouts/Boilerplate';
import AIChat from '../components/AIChat';
import { postAICopilot } from '../services/api';
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
  const { location } = useLocationContext();

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
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          width: '100%'
        }}
      >
        <AIChat
          title="Operational Decision Support Copilot"
          subtitle="Strictly non-hallucinating engine retrieving live backend statistics and geospatial assessments"
          onSendMessage={handleSend}
          initialMessages={INITIAL_MESSAGES}
          suggestedPrompts={COPILOT_PROMPTS}
          isCopilot={true}
          activeLocationName={location?.district || location?.name}
        />
      </Box>
    </Boilerplate>
  );
}
