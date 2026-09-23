import React from 'react';
import { Box } from '@mui/material';
import Boilerplate from '../layouts/Boilerplate';
import AIChat from '../components/AIChat';
import { postAIChat } from '../services/api';
import { useLocationContext } from '../context/LocationContext';

const SUGGESTED_PROMPTS = [
  "🏚️ Earthquake / भूकंप: Pass me kaha jaun?",
  "🏥 Nearest 24x7 Emergency Hospital",
  "⛺ Live Relief Shelter & Open Beds",
  "🌊 Flood / बाढ़ सुरक्षा निर्देश",
  "📞 Emergency Helplines (112, 108)",
  "🎒 72-Hour Emergency Kit checklist"
];

const INITIAL_MESSAGES = [
  {
    role: 'assistant',
    content: "### 🛡️ AAPDANETRA LIVE EMERGENCY & NAVIGATION ASSISTANT\n\nI am connected directly to your active district's **verified 24x7 emergency trauma hospitals**, **live relief shelters**, and **NDMA emergency protocols**.\n\n• **Earthquake / Flood / Medical**: Ask 'Pass me hospital batao' or 'Earthquake aaya hai kaha jaun'\n• **Live Turn-by-Turn GPS Navigation**: Click 'Start GPS Navigation' on any facility\n• **Voice Assistant**: Click the speaker icon to listen hands-free\n• **Multi-lingual**: Toggle English, हिन्दी, Hinglish, অসমীয়া, or বাংলা above!",
    source: 'AapdaNetra Live AI Navigation System',
    timestamp: 'Just now'
  }
];

export default function AIAssistant() {
  const { location } = useLocationContext();

  const handleSend = async (message, extra = {}) => {
    let coords = {
      latitude: location.lat,
      longitude: location.lng,
      district: location.district || location.name,
      ...extra
    };
    return await postAIChat({ message, ...coords });
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
          title="AapdaNetra Emergency Safety Assistant"
          subtitle="Real-time disaster guidance, live trauma hospitals & verified shelter navigation"
          onSendMessage={handleSend}
          initialMessages={INITIAL_MESSAGES}
          suggestedPrompts={SUGGESTED_PROMPTS}
          isCopilot={false}
          activeLocationName={location?.district || location?.name}
        />
      </Box>
    </Boilerplate>
  );
}
