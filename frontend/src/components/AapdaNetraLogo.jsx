import React from 'react';

/**
 * AapdaNetra Shield Emblem matching the design mockup:
 * Shield with mountain crest, orange flame/peak, and blue ocean waves.
 */
export default function AapdaNetraLogo({ size = 42, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <defs>
        <linearGradient id="shieldBorder" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="fireOrange" x1="50" y1="18" x2="50" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff5722" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id="waterBlue" x1="50" y1="55" x2="50" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <filter id="badgeShadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0284c7" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* Outer Shield Container */}
      <path
        d="M50 8 C68 8, 86 16, 88 28 C88 56, 74 80, 50 92 C26 80, 12 56, 12 28 C14 16, 32 8, 50 8 Z"
        fill="#ffffff"
        stroke="url(#shieldBorder)"
        strokeWidth="4"
        filter="url(#badgeShadow)"
      />

      {/* Inner Shield Fill */}
      <clipPath id="shieldInnerClip">
        <path d="M50 12 C66 12, 82 19, 84 30 C84 54, 71 76, 50 87 C29 76, 16 54, 16 30 C18 19, 34 12, 50 12 Z" />
      </clipPath>

      <g clipPath="url(#shieldInnerClip)">
        {/* Upper Background */}
        <rect x="0" y="0" width="100" height="60" fill="#fff7ed" />

        {/* Orange Mountains & Disaster Flame Crest */}
        <path
          d="M50 18 L68 50 L56 46 L62 58 L38 58 L44 46 L32 50 Z"
          fill="url(#fireOrange)"
        />
        <path
          d="M50 24 L60 48 L50 44 L40 48 Z"
          fill="#ffedd5"
          opacity="0.8"
        />

        {/* Lower Ocean Waves (Disaster Water / Flood management) */}
        <path
          d="M10 56 Q30 50, 50 56 T90 56 L90 95 L10 95 Z"
          fill="url(#waterBlue)"
        />
        <path
          d="M10 63 Q30 58, 50 63 T90 63 L90 95 L10 95 Z"
          fill="#1e40af"
        />
        <path
          d="M10 70 Q30 65, 50 70 T90 70 L90 95 L10 95 Z"
          fill="#172554"
        />
      </g>
    </svg>
  );
}
