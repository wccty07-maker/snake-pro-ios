import React from 'react';

interface CuteMonsterSnakeProps {
  className?: string;
  size?: number;
  mood?: 'happy' | 'excited' | 'curious' | 'wink';
  variant?: 'mikey' | 'sulley' | 'nightfury' | 'dragon' | 'neon_viper' | 'neon_aurora';
}

export const CuteMonsterSnakeArt: React.FC<CuteMonsterSnakeProps> = ({
  className = '',
  size = 120,
  mood = 'happy',
  variant = 'mikey',
}) => {
  // Whimsical Original Fantasy Monster Themes
  const colorMap = {
    neon_viper: {
      primary: '#38bdf8', // Neon electric blue / cyan
      light: '#7dd3fc',
      belly: '#e0f2fe',
      horn: '#818cf8', // Neon indigo / purple horn
      eyeIris: '#0284c7',
      glow: 'rgba(56, 189, 248, 0.65)',
    },
    neon_aurora: {
      primary: '#c084fc', // Neon purple / pink
      light: '#e879f9',
      belly: '#fae8ff',
      horn: '#38bdf8',
      eyeIris: '#9333ea',
      glow: 'rgba(192, 132, 252, 0.6)',
    },
    mikey: {
      primary: '#10b981', // Emerald green
      light: '#34d399',
      belly: '#a7f3d0',
      horn: '#fde047',
      eyeIris: '#059669',
      glow: 'rgba(16, 185, 129, 0.4)',
    },
    sulley: {
      primary: '#06b6d4', // Cyan / Teal
      light: '#67e8f9',
      belly: '#cffafe',
      horn: '#c084fc', // Purple monster horn
      eyeIris: '#0284c7',
      glow: 'rgba(6, 182, 212, 0.4)',
    },
    nightfury: {
      primary: '#1e293b', // Midnight Obsidian
      light: '#334155',
      belly: '#475569',
      horn: '#10b981', // Glowing dragon horns
      eyeIris: '#22c55e', // Glowing emerald eyes
      glow: 'rgba(34, 197, 94, 0.4)',
    },
    dragon: {
      primary: '#f97316', // Fiery cute baby dragon
      light: '#fb923c',
      belly: '#ffedd5',
      horn: '#facc15',
      eyeIris: '#ea580c',
      glow: 'rgba(249, 115, 22, 0.4)',
    },
  };

  const theme = colorMap[variant] || colorMap.mikey;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-lg select-none ${className}`}
    >
      <defs>
        {/* Soft monster body gradient */}
        <radialGradient id={`bodyGrad-${variant}`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="25%" stopColor={theme.light} />
          <stop offset="85%" stopColor={theme.primary} />
          <stop offset="100%" stopColor={theme.primary} stopOpacity="0.95" />
        </radialGradient>

        {/* Belly scales gradient */}
        <linearGradient id={`bellyGrad-${variant}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="100%" stopColor={theme.belly} />
        </linearGradient>

        {/* Horn gradient */}
        <linearGradient id={`hornGrad-${variant}`} x1="0%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor={theme.primary} />
          <stop offset="100%" stopColor={theme.horn} />
        </linearGradient>

        {/* Iris 3D gradient */}
        <radialGradient id={`irisGrad-${variant}`} cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="40%" stopColor={theme.eyeIris} />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>

        {/* Drop shadow filter */}
        <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor={theme.glow} />
        </filter>
      </defs>

      <g filter="url(#glowEffect)">
        {/* Coiled Tail in Background */}
        <path
          d="M 60 145 C 40 160, 40 185, 75 185 C 115 185, 140 170, 160 155 C 180 140, 185 110, 170 95 C 160 85, 145 90, 145 105 C 145 130, 120 155, 80 150"
          fill="none"
          stroke={theme.primary}
          strokeWidth="28"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Tail cute monster tip */}
        <circle cx="170" cy="98" r="13" fill={theme.light} />
        <path d="M 165 90 L 178 86 L 173 98 Z" fill={theme.horn} />

        {/* Soft Spots on tail */}
        <ellipse cx="115" cy="178" rx="8" ry="5" fill="#a855f7" opacity="0.4" />
        <ellipse cx="150" cy="155" rx="6" ry="4" fill="#a855f7" opacity="0.35" />

        {/* Cute Fantasy Monster Little Horns */}
        {/* Left Horn */}
        <path
          d="M 58 55 C 45 35, 48 20, 42 12 C 48 24, 64 36, 72 48 Z"
          fill={`url(#hornGrad-${variant})`}
          stroke="#0f172a"
          strokeWidth="2"
        />
        {/* Right Horn */}
        <path
          d="M 142 55 C 155 35, 152 20, 158 12 C 152 24, 136 36, 128 48 Z"
          fill={`url(#hornGrad-${variant})`}
          stroke="#0f172a"
          strokeWidth="2"
        />

        {/* Chubby Round Head */}
        <ellipse
          cx="100"
          cy="95"
          rx="58"
          ry="54"
          fill={`url(#bodyGrad-${variant})`}
          stroke="#0f172a"
          strokeWidth="3.5"
        />

        {/* Cute Creamy Belly Contour */}
        <path
          d="M 75 115 C 80 140, 120 140, 125 115 C 120 135, 80 135, 75 115 Z"
          fill={`url(#bellyGrad-${variant})`}
          opacity="0.85"
        />

        {/* Monster Freckles / Spots */}
        <circle cx="62" cy="72" r="4.5" fill="#a855f7" opacity="0.4" />
        <circle cx="56" cy="85" r="3.5" fill="#a855f7" opacity="0.3" />
        <circle cx="140" cy="75" r="4" fill="#a855f7" opacity="0.4" />

        {/* Adorable Rosy Monster Cheeks */}
        <ellipse cx="60" cy="112" rx="10" ry="6" fill="#f43f5e" opacity="0.45" />
        <ellipse cx="140" cy="112" rx="10" ry="6" fill="#f43f5e" opacity="0.45" />

        {/* BIG EXPRESSIVE EYES */}
        {/* Left Eye Sclera */}
        <ellipse
          cx="76"
          cy="85"
          rx="18"
          ry="20"
          fill="#ffffff"
          stroke="#0f172a"
          strokeWidth="3"
        />
        {/* Right Eye Sclera */}
        {mood === 'wink' ? (
          <path
            d="M 112 88 Q 124 75 136 88"
            fill="none"
            stroke="#0f172a"
            strokeWidth="4"
            strokeLinecap="round"
          />
        ) : (
          <ellipse
            cx="124"
            cy="85"
            rx="18"
            ry="20"
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="3"
          />
        )}

        {/* Left Eye Iris & Pupil */}
        <circle cx="78" cy="85" r="12" fill={`url(#irisGrad-${variant})`} />
        <circle cx="79" cy="85" r="7.5" fill="#090d16" />

        {/* Right Eye Iris & Pupil (if not winking) */}
        {mood !== 'wink' && (
          <>
            <circle cx="122" cy="85" r="12" fill={`url(#irisGrad-${variant})`} />
            <circle cx="121" cy="85" r="7.5" fill="#090d16" />
          </>
        )}

        {/* Signature Dual Glossy Pupil Reflections */}
        {/* Primary big glossy shine */}
        <circle cx="74" cy="80" r="4.5" fill="#ffffff" />
        <circle cx="83" cy="88" r="2.2" fill="#ffffff" />
        {mood !== 'wink' && (
          <>
            <circle cx="118" cy="80" r="4.5" fill="#ffffff" />
            <circle cx="127" cy="88" r="2.2" fill="#ffffff" />
          </>
        )}

        {/* Happy Cute Monster Mouth */}
        <path
          d="M 85 116 Q 100 132 115 116"
          fill="#be123c"
          stroke="#0f172a"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Cute baby fang */}
        <polygon points="92,116 95,123 98,116" fill="#ffffff" />
        {/* Joyful Pink Tongue */}
        <ellipse cx="100" cy="123" rx="6" ry="4" fill="#fb7185" />
      </g>
    </svg>
  );
};
