import React from 'react';

export type CuteModalTheme =
  | 'victory'
  | 'defeat'
  | 'shop'
  | 'rewards'
  | 'hearts'
  | 'leaderboard'
  | 'stages'
  | 'settings'
  | 'tutorial'
  | 'mobile'
  | 'pause'
  | 'default';

interface CuteModalBackgroundProps {
  theme?: CuteModalTheme;
  className?: string;
  children?: React.ReactNode;
}

export const CuteModalBackground: React.FC<CuteModalBackgroundProps> = ({
  theme = 'default',
  className = '',
  children,
}) => {
  // Color themes for card background gradients and borders
  const themeStyles: Record<
    CuteModalTheme,
    {
      gradient: string;
      border: string;
      glow: string;
      accentColor: string;
    }
  > = {
    victory: {
      gradient: 'from-[#4a0d4e] via-[#2f083b] to-[#190422]',
      border: 'border-pink-400/70',
      glow: 'shadow-[0_0_35px_rgba(244,63,94,0.35)]',
      accentColor: '#f43f5e',
    },
    defeat: {
      gradient: 'from-[#381045] via-[#230933] to-[#14041f]',
      border: 'border-purple-400/60',
      glow: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]',
      accentColor: '#a855f7',
    },
    shop: {
      gradient: 'from-[#3a1a05] via-[#261005] to-[#150702]',
      border: 'border-amber-400/70',
      glow: 'shadow-[0_0_35px_rgba(245,158,11,0.35)]',
      accentColor: '#f59e0b',
    },
    rewards: {
      gradient: 'from-[#341145] via-[#200832] to-[#12041d]',
      border: 'border-amber-400/60',
      glow: 'shadow-[0_0_30px_rgba(251,191,36,0.3)]',
      accentColor: '#fbbf24',
    },
    hearts: {
      gradient: 'from-[#4a0a2a] via-[#2c051a] to-[#17030e]',
      border: 'border-rose-400/70',
      glow: 'shadow-[0_0_35px_rgba(244,63,94,0.35)]',
      accentColor: '#f43f5e',
    },
    leaderboard: {
      gradient: 'from-[#321703] via-[#210e02] to-[#130701]',
      border: 'border-amber-400/70',
      glow: 'shadow-[0_0_35px_rgba(245,158,11,0.35)]',
      accentColor: '#fbbf24',
    },
    stages: {
      gradient: 'from-[#063b2f] via-[#03231c] to-[#011410]',
      border: 'border-emerald-400/70',
      glow: 'shadow-[0_0_35px_rgba(16,185,129,0.35)]',
      accentColor: '#10b981',
    },
    settings: {
      gradient: 'from-[#2b104c] via-[#1b0833] to-[#0f041e]',
      border: 'border-pink-400/60',
      glow: 'shadow-[0_0_30px_rgba(236,72,153,0.3)]',
      accentColor: '#ec4899',
    },
    tutorial: {
      gradient: 'from-[#12284c] via-[#091834] to-[#040e21]',
      border: 'border-sky-400/70',
      glow: 'shadow-[0_0_35px_rgba(56,189,248,0.35)]',
      accentColor: '#38bdf8',
    },
    mobile: {
      gradient: 'from-[#0e2c38] via-[#071d26] to-[#031016]',
      border: 'border-teal-400/70',
      glow: 'shadow-[0_0_35px_rgba(20,184,166,0.35)]',
      accentColor: '#14b8a6',
    },
    pause: {
      gradient: 'from-[#0d3b37] via-[#062422] to-[#021312]',
      border: 'border-emerald-400/70',
      glow: 'shadow-[0_0_35px_rgba(52,211,153,0.35)]',
      accentColor: '#34d399',
    },
    default: {
      gradient: 'from-[#361042] via-[#22092e] to-[#13041c]',
      border: 'border-pink-400/60',
      glow: 'shadow-[0_0_30px_rgba(244,63,94,0.3)]',
      accentColor: '#f43f5e',
    },
  };

  const currentTheme = themeStyles[theme] || themeStyles.default;

  return (
    <div
      className={`relative rounded-3xl border-2 ${currentTheme.border} ${currentTheme.glow} bg-gradient-to-b ${currentTheme.gradient} overflow-hidden flex flex-col ${className}`}
    >
      {/* Cute SVG illustrated background wallpaper layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        {/* Soft Radial Ambient Glow */}
        <div
          className="absolute -top-12 -left-12 w-64 h-64 rounded-full blur-3xl opacity-35"
          style={{ backgroundColor: currentTheme.accentColor }}
        />
        <div
          className="absolute -bottom-16 -right-12 w-64 h-64 rounded-full blur-3xl opacity-30"
          style={{ backgroundColor: currentTheme.accentColor }}
        />

        {/* Cute Polka Dot & Candy Star Grid Pattern */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id={`candy-pattern-${theme}`}
              x="0"
              y="0"
              width="44"
              height="44"
              patternUnits="userSpaceOnUse"
            >
              {/* Cute mini candy / stars / polka dots */}
              <circle cx="8" cy="8" r="2" fill="#ffffff" opacity="0.6" />
              <circle cx="30" cy="30" r="1.5" fill="#fde047" opacity="0.7" />
              <circle cx="22" cy="10" r="1" fill="#ffffff" opacity="0.4" />
              {/* Tiny star */}
              <path
                d="M 22 24 L 23 26 L 25 26 L 23.5 27.5 L 24 29.5 L 22 28.5 L 20 29.5 L 20.5 27.5 L 19 26 L 21 26 Z"
                fill="#f472b6"
                opacity="0.6"
              />
              {/* Soft candy ring */}
              <circle
                cx="36"
                cy="12"
                r="3"
                fill="none"
                stroke="#67e8f9"
                strokeWidth="1"
                opacity="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#candy-pattern-${theme})`} />
        </svg>

        {/* Top Playful Candy Clouds SVG */}
        <svg
          className="absolute top-0 left-0 right-0 w-full h-16 opacity-30 text-white"
          viewBox="0 0 400 60"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M 0 0 L 400 0 L 400 20 C 370 32, 340 18, 310 26 C 270 36, 240 18, 200 28 C 160 38, 130 18, 90 26 C 50 34, 25 20, 0 25 Z" />
        </svg>

        {/* Bottom Dreamy Cloud Wave */}
        <svg
          className="absolute bottom-0 left-0 right-0 w-full h-14 opacity-25 text-pink-300"
          viewBox="0 0 400 50"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M 0 50 L 400 50 L 400 24 C 360 12, 330 32, 290 18 C 250 8, 210 28, 170 14 C 130 5, 90 26, 50 16 C 25 10, 10 22, 0 18 Z" />
        </svg>

        {/* Theme-Specific Cute Mascot / Deco Art in Corner */}
        {theme === 'victory' && (
          <div className="absolute -top-2 right-4 text-3xl opacity-40 animate-bounce pointer-events-none">
            👑
          </div>
        )}
        {theme === 'shop' && (
          <div className="absolute top-2 right-4 text-2xl opacity-40 pointer-events-none">
            🛍️
          </div>
        )}
        {theme === 'rewards' && (
          <div className="absolute top-2 right-4 text-2xl opacity-40 pointer-events-none">
            🎁
          </div>
        )}
        {theme === 'hearts' && (
          <div className="absolute top-2 right-4 text-2xl opacity-40 pointer-events-none">
            💖
          </div>
        )}
        {theme === 'leaderboard' && (
          <div className="absolute top-2 right-4 text-2xl opacity-40 pointer-events-none">
            🏆
          </div>
        )}
        {theme === 'stages' && (
          <div className="absolute top-2 right-4 text-2xl opacity-40 pointer-events-none">
            🗺️
          </div>
        )}
        {theme === 'settings' && (
          <div className="absolute top-2 right-4 text-2xl opacity-40 pointer-events-none">
            ⚙️
          </div>
        )}
        {theme === 'tutorial' && (
          <div className="absolute top-2 right-4 text-2xl opacity-40 pointer-events-none">
            🎓
          </div>
        )}
        {theme === 'pause' && (
          <div className="absolute top-2 right-4 text-2xl opacity-40 pointer-events-none">
            🐾
          </div>
        )}

        {/* Cute Floating Bubbles & Candies */}
        <div className="absolute top-10 left-3 w-5 h-5 rounded-full border border-pink-300/40 bg-pink-400/10" />
        <div className="absolute top-28 right-2 w-3.5 h-3.5 rounded-full border border-amber-300/40 bg-amber-400/10" />
        <div className="absolute bottom-16 left-4 w-4 h-4 rounded-full border border-cyan-300/40 bg-cyan-400/10" />
        <div className="absolute bottom-24 right-5 w-6 h-6 rounded-full border border-purple-300/40 bg-purple-400/10" />
      </div>

      {/* Content wrapper with relative z-index so controls remain responsive */}
      <div className="relative z-10 w-full h-full flex-1 min-h-0 flex flex-col overflow-hidden">{children}</div>
    </div>
  );
};
