import React from 'react';
import { Lock } from 'lucide-react';
import { LevelMission } from '../types';

interface SnakeMapNodeProps {
  level: LevelMission;
  isUnlocked: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
  size?: number;
  onClick: () => void;
}

export type SnakeNodeVariant =
  | 'green_chin'      // Green button with yellow/lime snake face chin (like 18, 23)
  | 'orange_chin'     // Orange/caramel button with cream snake face chin (like 19, 27, 32)
  | 'blue_chin'       // Cyan/blue button with blue/cream snake chin (like 24, 25)
  | 'coiled_blue'     // Special coiled blue snake wrapped around button (like 22)
  | 'teal_double'     // Teal/emerald double-rimmed smooth button (like 26)
  | 'purple_chin'     // Purple button with lilac snake chin (like 28, 33)
  | 'obsidian_chin'   // Obsidian/black button with gold snake chin (like 29)
  | 'pattern_gold';   // Warm honey/gold button with patterned rim (like 31)

// Determine node variant matching the user's image rhythm
export const getNodeVariant = (levelId: number): SnakeNodeVariant => {
  // Matches the exact visual sequence from the reference image:
  // 18: green_chin
  // 19: orange_chin
  // 22: coiled_blue
  // 23: green_chin (with tongue)
  // 24: blue_chin
  // 25: blue_chin
  // 26: teal_double
  // 27: orange_chin
  // 28: purple_chin
  // 29: obsidian_chin
  // 31: pattern_gold
  // 32: orange_chin
  // 33: purple_chin
  const m = levelId % 10;
  if (m === 2) return 'coiled_blue';      // Levels 2, 12, 22, 32 (or 22 style)
  if (m === 6) return 'teal_double';      // Levels 6, 16, 26, 36...
  if (m === 8) return 'purple_chin';      // Levels 8, 18 (alt), 28, 38...
  if (m === 9) return 'obsidian_chin';    // Levels 9, 19 (alt), 29, 39...
  if (m === 1) return 'pattern_gold';     // Levels 1, 11, 21, 31...
  if (m === 3) return 'green_chin';       // Levels 3, 13, 23, 33 (alt)...
  if (m === 4 || m === 5) return 'blue_chin'; // Levels 4, 5, 24, 25...
  if (m === 7 || m === 0) return 'orange_chin';// Levels 7, 10, 17, 20, 27...

  return 'green_chin';
};

export const SnakeMapNode: React.FC<SnakeMapNodeProps> = ({
  level,
  isUnlocked,
  isCompleted,
  isCurrent,
  size = 62,
  onClick,
}) => {
  const isLocked = !isUnlocked;
  const variant = getNodeVariant(level.id);

  // If locked, tone down brightness while keeping the number clearly visible
  return (
    <div
      id={`level-node-${level.id}`}
      onClick={onClick}
      className={`relative cursor-pointer select-none group transition-transform active:scale-95 touch-manipulation ${
        isCurrent ? 'scale-110 z-30' : isLocked ? 'opacity-85 hover:opacity-100 z-10' : 'hover:scale-105 z-20'
      }`}
      style={{ width: size, height: size }}
    >
      {/* Current Level Glowing Pulse Ring */}
      {isCurrent && (
        <div className="absolute -inset-2 rounded-full border-2 border-yellow-400/90 animate-ping opacity-75 pointer-events-none" />
      )}

      {/* Boss Level Crown & Badge */}
      {level.isBossLevel && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex flex-col items-center">
          <span className="text-base drop-shadow-md animate-bounce">👑</span>
          <span className="text-[8px] font-black px-1.5 py-0.2 rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 text-white shadow-md border border-amber-200 -mt-1 tracking-tighter">
            BOSS
          </span>
        </div>
      )}

      {/* Gimmick Icon Badges */}
      {!level.isBossLevel && level.gimmick === 'PORTAL' && (
        <div className="absolute -top-2 -right-1 pointer-events-none z-30 text-xs drop-shadow">
          🌀
        </div>
      )}
      {!level.isBossLevel && level.gimmick === 'CHILI' && (
        <div className="absolute -top-2 -right-1 pointer-events-none z-30 text-xs drop-shadow">
          🌶️
        </div>
      )}
      {!level.isBossLevel && level.gimmick === 'MAGNET' && (
        <div className="absolute -top-2 -right-1 pointer-events-none z-30 text-xs drop-shadow">
          🧲
        </div>
      )}
      {!level.isBossLevel && level.gimmick === 'DRAGON_EGG' && (
        <div className="absolute -top-2 -right-1 pointer-events-none z-30 text-xs drop-shadow">
          🥚
        </div>
      )}
      {!level.isBossLevel && level.gimmick === 'RAINBOW' && (
        <div className="absolute -top-2 -right-1 pointer-events-none z-30 text-xs drop-shadow">
          🍭
        </div>
      )}
      {!level.isBossLevel && (level.snakeSpeed === 'VERY_FAST' || level.snakeSpeed === 'TURBO' || (level.snakeSpeed === 'FAST' && (level.gimmick === 'NONE' || !level.gimmick))) && (
        <div className="absolute -top-2 -right-1 pointer-events-none z-30 text-xs drop-shadow animate-pulse">
          ⚡
        </div>
      )}

      {/* SVG Cartoon Snake Node matching reference image */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md overflow-visible"
      >
        <defs>
          {/* Drop shadow filter */}
          <filter id={`node-shadow-${level.id}`} x="-20%" y="-10%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#082010" floodOpacity="0.6" />
          </filter>

          {/* Gradients for button faces */}
          {/* Green button */}
          <linearGradient id={`btn-green-${level.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="25%" stopColor="#4ade80" />
            <stop offset="80%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>

          {/* Orange/Caramel button */}
          <linearGradient id={`btn-orange-${level.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="25%" stopColor="#fb923c" />
            <stop offset="80%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#7c2d12" />
          </linearGradient>

          {/* Sky Blue button */}
          <linearGradient id={`btn-blue-${level.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bae6fd" />
            <stop offset="25%" stopColor="#38bdf8" />
            <stop offset="80%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#082f49" />
          </linearGradient>

          {/* Teal button */}
          <linearGradient id={`btn-teal-${level.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#99f6e4" />
            <stop offset="25%" stopColor="#2dd4bf" />
            <stop offset="80%" stopColor="#0f766e" />
            <stop offset="100%" stopColor="#042f2e" />
          </linearGradient>

          {/* Purple button */}
          <linearGradient id={`btn-purple-${level.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e9d5ff" />
            <stop offset="25%" stopColor="#c084fc" />
            <stop offset="80%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#3b0764" />
          </linearGradient>

          {/* Obsidian dark button */}
          <linearGradient id={`btn-obsidian-${level.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="25%" stopColor="#334155" />
            <stop offset="80%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          {/* Honey Gold button */}
          <linearGradient id={`btn-gold-${level.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="25%" stopColor="#facc15" />
            <stop offset="80%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#713f12" />
          </linearGradient>

          {/* Locked grey button */}
          <linearGradient id={`btn-locked-${level.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="35%" stopColor="#475569" />
            <stop offset="85%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          {/* Snake skin / Chin gradients */}
          <linearGradient id={`chin-cream-${level.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>

          <linearGradient id={`chin-blue-${level.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          <linearGradient id={`chin-green-${level.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bef264" />
            <stop offset="100%" stopColor="#65a30d" />
          </linearGradient>

          <linearGradient id={`chin-purple-${level.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5d0fe" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>

          {/* Blue snake coiled body */}
          <linearGradient id={`snake-body-blue-${level.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="50%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
        </defs>

        {/* -------------------- VARIANT A: COILED BLUE SNAKE (LIKE LEVEL 22) -------------------- */}
        {variant === 'coiled_blue' && (
          <g filter={`url(#node-shadow-${level.id})`}>
            {/* Outer Snake Body Coiled Around */}
            <path
              d="M 44 14 C 54 22 54 44 42 53 C 32 60 16 57 11 47 C 6 36 10 20 22 14 C 30 10 38 10 44 14 Z"
              fill={isLocked ? `url(#btn-locked-${level.id})` : `url(#snake-body-blue-${level.id})`}
              stroke={isLocked ? '#475569' : '#0369a1'}
              strokeWidth="2.5"
            />
            {/* Inner Belly Scales Highlight */}
            <path
              d="M 15 42 C 18 52 32 55 40 48"
              fill="none"
              stroke={isLocked ? '#64748b' : '#e0f2fe'}
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Inner Circle Disc */}
            <circle
              cx="31"
              cy="31"
              r="17"
              fill={isLocked ? `url(#btn-locked-${level.id})` : `url(#btn-blue-${level.id})`}
              stroke={isLocked ? '#334155' : '#0284c7'}
              strokeWidth="2"
            />
            {/* Snake Head at top right (facing inwards/smiling) */}
            <g transform="translate(43, 10)">
              <ellipse cx="6" cy="6" rx="8" ry="7" fill={isLocked ? '#475569' : '#38bdf8'} />
              <ellipse cx="6" cy="6" rx="8" ry="7" fill="none" stroke={isLocked ? '#334155' : '#0284c7'} strokeWidth="1.5" />
              {/* Cute white belly chin */}
              <ellipse cx="6" cy="9" rx="5" ry="3" fill={isLocked ? '#64748b' : '#e0f2fe'} />
              {/* Eye */}
              <circle cx="5" cy="4" r="2.2" fill="#0f172a" />
              <circle cx="4.2" cy="3.2" r="0.8" fill="#ffffff" />
              {/* Little red tongue */}
              {!isLocked && (
                <path d="M 0 7 Q -3 8 -5 7" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" fill="none" />
              )}
            </g>
          </g>
        )}

        {/* -------------------- VARIANT B: TEAL DUAL-RING (LIKE LEVEL 26) -------------------- */}
        {variant === 'teal_double' && (
          <g filter={`url(#node-shadow-${level.id})`}>
            {/* Outer ring */}
            <circle
              cx="32"
              cy="32"
              r="24"
              fill={isLocked ? `url(#btn-locked-${level.id})` : `url(#btn-teal-${level.id})`}
              stroke={isLocked ? '#475569' : '#14b8a6'}
              strokeWidth="3.5"
            />
            {/* Inner disc */}
            <circle
              cx="32"
              cy="31"
              r="19"
              fill={isLocked ? '#334155' : '#0d9488'}
              stroke={isLocked ? '#1e293b' : '#5eead4'}
              strokeWidth="1.8"
            />
            {/* Bottom smooth rim highlight */}
            <path
              d="M 17 38 C 22 47 42 47 47 38"
              fill="none"
              stroke={isLocked ? '#475569' : '#ccfbf1'}
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.85"
            />
          </g>
        )}

        {/* -------------------- VARIANT C: PATTERNED GOLD (LIKE LEVEL 31) -------------------- */}
        {variant === 'pattern_gold' && (
          <g filter={`url(#node-shadow-${level.id})`}>
            {/* Outer Gold Disc */}
            <circle
              cx="32"
              cy="32"
              r="23"
              fill={isLocked ? `url(#btn-locked-${level.id})` : `url(#btn-gold-${level.id})`}
              stroke={isLocked ? '#475569' : '#eab308'}
              strokeWidth="3"
            />
            {/* Patterned lower bezel */}
            <path
              d="M 14 36 C 18 48 46 48 50 36 C 45 42 19 42 14 36 Z"
              fill={isLocked ? '#334155' : '#ca8a04'}
            />
            {/* Geometric diamond notches */}
            {!isLocked && (
              <g fill="#fef08a" opacity="0.9">
                <polygon points="22,42 24,40 26,42 24,44" />
                <polygon points="30,44 32,42 34,44 32,46" />
                <polygon points="38,42 40,40 42,42 40,44" />
              </g>
            )}
          </g>
        )}

        {/* -------------------- VARIANT D, E, F, G: BUTTON WITH CUTE SNAKE CHIN -------------------- */}
        {variant !== 'coiled_blue' && variant !== 'teal_double' && variant !== 'pattern_gold' && (
          <g filter={`url(#node-shadow-${level.id})`}>
            {/* Base Circle Button */}
            <circle
              cx="32"
              cy="30"
              r="22"
              fill={
                isLocked
                  ? `url(#btn-locked-${level.id})`
                  : variant === 'green_chin'
                  ? `url(#btn-green-${level.id})`
                  : variant === 'orange_chin'
                  ? `url(#btn-orange-${level.id})`
                  : variant === 'purple_chin'
                  ? `url(#btn-purple-${level.id})`
                  : variant === 'obsidian_chin'
                  ? `url(#btn-obsidian-${level.id})`
                  : `url(#btn-blue-${level.id})`
              }
              stroke={
                isLocked
                  ? '#475569'
                  : variant === 'green_chin'
                  ? '#15803d'
                  : variant === 'orange_chin'
                  ? '#c2410c'
                  : variant === 'purple_chin'
                  ? '#7e22ce'
                  : variant === 'obsidian_chin'
                  ? '#090d16'
                  : '#0369a1'
              }
              strokeWidth="2.8"
            />

            {/* Glossy Top Shine Arc */}
            <path
              d="M 16 23 C 20 14 44 14 48 23 C 41 18 23 18 16 23 Z"
              fill="#ffffff"
              opacity={isLocked ? '0.25' : '0.55'}
            />

            {/* Adorable Snake Chin / Face at bottom 6 o'clock position */}
            <g transform="translate(0, 1)">
              {/* Snake Chin Mound */}
              <path
                d="M 21 44 C 23 53 41 53 43 44 C 36 47 28 47 21 44 Z"
                fill={
                  isLocked
                    ? '#334155'
                    : variant === 'green_chin'
                    ? `url(#chin-green-${level.id})`
                    : variant === 'purple_chin'
                    ? `url(#chin-purple-${level.id})`
                    : variant === 'obsidian_chin'
                    ? `url(#chin-cream-${level.id})`
                    : variant === 'blue_chin'
                    ? `url(#chin-blue-${level.id})`
                    : `url(#chin-cream-${level.id})`
                }
                stroke={isLocked ? '#1e293b' : '#78350f'}
                strokeWidth="1.2"
              />

              {/* Two cute snake eyes on chin */}
              <circle cx="28" cy="46" r="1.4" fill="#0f172a" />
              <circle cx="27.6" cy="45.6" r="0.5" fill="#ffffff" />

              <circle cx="36" cy="46" r="1.4" fill="#0f172a" />
              <circle cx="35.6" cy="45.6" r="0.5" fill="#ffffff" />

              {/* Tiny nostrils / smile curve */}
              <path
                d="M 30.5 48.5 Q 32 49.5 33.5 48.5"
                stroke={isLocked ? '#0f172a' : '#78350f'}
                strokeWidth="0.8"
                fill="none"
                strokeLinecap="round"
              />

              {/* Little forked pink tongue for green snake (like 23) */}
              {(variant === 'green_chin' || level.id === 23) && !isLocked && (
                <path
                  d="M 32 49 L 32 52 M 32 52 L 30.5 54 M 32 52 L 33.5 54"
                  stroke="#ef4444"
                  strokeWidth="0.9"
                  strokeLinecap="round"
                  fill="none"
                />
              )}
            </g>
          </g>
        )}

        {/* Gloss highlight edge across all nodes */}
        <circle cx="32" cy="18" r="1.2" fill="#ffffff" opacity={isLocked ? 0.4 : 0.8} />
      </svg>

      {/* Level Number Text - Bold, Crisp, High Contrast with Drop Shadow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-1">
        <span
          className={`font-black text-lg tracking-tight select-none ${
            isUnlocked
              ? 'text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.85)]'
              : 'text-slate-300 font-extrabold drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]'
          }`}
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.75)',
          }}
        >
          {level.id}
        </span>
      </div>

      {/* Lock Icon for Locked Levels */}
      {isLocked && (
        <div className="absolute top-0 right-0 w-4 h-4 rounded-full bg-slate-900/90 border border-slate-500 text-slate-300 flex items-center justify-center shadow-md">
          <Lock className="w-2.5 h-2.5 text-slate-300" />
        </div>
      )}
    </div>
  );
};
