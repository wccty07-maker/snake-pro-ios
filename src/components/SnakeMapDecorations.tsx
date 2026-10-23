import React from 'react';

// ==========================================
// 1. SNAKE BURROW (Bottom of Map, Start Area)
// ==========================================
interface SnakeBurrowProps {
  snakeColor: 'green' | 'pink';
  flip?: boolean;
}

export const SnakeBurrow: React.FC<SnakeBurrowProps> = ({ snakeColor, flip = false }) => {
  const isPink = snakeColor === 'pink';

  return (
    <svg
      width="96"
      height="80"
      viewBox="0 0 96 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg select-none"
      style={{ transform: flip ? 'scaleX(-1)' : 'none' }}
    >
      <defs>
        {/* Dirt Mound Gradient */}
        <linearGradient id={`dirt-grad-${snakeColor}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a77248" />
          <stop offset="40%" stopColor="#8d5b35" />
          <stop offset="100%" stopColor="#54331a" />
        </linearGradient>

        {/* Cave Opening Dark Shadow */}
        <radialGradient id={`cave-dark-${snakeColor}`} cx="50%" cy="60%" r="50%">
          <stop offset="0%" stopColor="#1e1008" />
          <stop offset="100%" stopColor="#0d0603" />
        </radialGradient>

        {/* Snake body color */}
        <linearGradient id={`burrow-snake-${snakeColor}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={isPink ? '#fbcfe8' : '#86efac'} />
          <stop offset="50%" stopColor={isPink ? '#f472b6' : '#22c55e'} />
          <stop offset="100%" stopColor={isPink ? '#db2777' : '#15803d'} />
        </linearGradient>
      </defs>

      {/* Dirt Mound Base */}
      <path
        d="M 12 75 Q 16 35 48 24 Q 80 35 84 75 Q 48 78 12 75 Z"
        fill={`url(#dirt-grad-${snakeColor})`}
        stroke="#422511"
        strokeWidth="2.5"
      />

      {/* Dark Cave Arch Hole */}
      <ellipse cx="48" cy="56" rx="20" ry="18" fill={`url(#cave-dark-${snakeColor})`} />
      <path
        d="M 28 62 C 28 44 68 44 68 62 C 68 70 28 70 28 62 Z"
        fill="#0d0603"
      />

      {/* Little Friendly Snake Poking Head Out of Cave */}
      <g transform="translate(36, 42)">
        {/* Snake Neck / Body */}
        <path
          d="M 6 18 Q 8 10 12 7 Q 16 10 18 18"
          fill={`url(#burrow-snake-${snakeColor})`}
          stroke={isPink ? '#9d174d' : '#14532d'}
          strokeWidth="1.2"
        />

        {/* Snake Head */}
        <ellipse
          cx="12"
          cy="7"
          rx="10"
          ry="8"
          fill={`url(#burrow-snake-${snakeColor})`}
          stroke={isPink ? '#9d174d' : '#14532d'}
          strokeWidth="1.2"
        />

        {/* Belly patch / chin */}
        <ellipse
          cx="12"
          cy="11"
          rx="6"
          ry="3.5"
          fill={isPink ? '#fdf2f8' : '#dcfce7'}
        />

        {/* Big Cartoon Eyes */}
        <ellipse cx="8" cy="5" rx="2.5" ry="3" fill="#0f172a" />
        <circle cx="7.2" cy="4" r="1" fill="#ffffff" />

        <ellipse cx="16" cy="5" rx="2.5" ry="3" fill="#0f172a" />
        <circle cx="15.2" cy="4" r="1" fill="#ffffff" />

        {/* Cute Rosy Cheeks */}
        <circle cx="5" cy="8" r="1.5" fill={isPink ? '#f43f5e' : '#ec4899'} opacity="0.6" />
        <circle cx="19" cy="8" r="1.5" fill={isPink ? '#f43f5e' : '#ec4899'} opacity="0.6" />

        {/* Little smiling mouth with flicking pink tongue */}
        <path d="M 10 10 Q 12 11.5 14 10" stroke={isPink ? '#831843' : '#14532d'} strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M 12 11 Q 12 14 10.5 16 M 12 14 Q 13.5 16 14 15.5" stroke="#f43f5e" strokeWidth="1" fill="none" strokeLinecap="round" />
      </g>

      {/* Tufts of green grass on top of dirt mound */}
      <path
        d="M 36 26 L 40 16 L 44 25 L 48 14 L 52 24 L 56 17 L 60 26 Z"
        fill="#4ade80"
        stroke="#16a34a"
        strokeWidth="1.2"
      />

      {/* Little red mushroom beside burrow */}
      <g transform={flip ? 'translate(74, 52)' : 'translate(6, 52)'}>
        {/* Stem */}
        <rect x="5" y="10" width="4" height="8" rx="2" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
        {/* Red Cap */}
        <ellipse cx="7" cy="10" rx="7" ry="5" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
        {/* White dots */}
        <circle cx="5" cy="8" r="1" fill="#ffffff" />
        <circle cx="9" cy="9" r="0.8" fill="#ffffff" />
        <circle cx="6" cy="11" r="0.7" fill="#ffffff" />
      </g>

      {/* Small ground pebbles */}
      <ellipse cx="22" cy="73" rx="3.5" ry="2" fill="#78716c" />
      <ellipse cx="72" cy="74" rx="4" ry="2.2" fill="#a8a29e" />
    </svg>
  );
};

// ==========================================
// 2. SNAKE POND (Water Lake with Lily Pads & Swimming Snakes)
// ==========================================
interface SnakePondProps {
  width?: number;
  height?: number;
  hasGoldenSnake?: boolean;
}

export const SnakePond: React.FC<SnakePondProps> = ({
  width = 240,
  height = 150,
  hasGoldenSnake = true,
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 240 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-md select-none overflow-visible"
    >
      <defs>
        {/* Shoreline Sand Gradient */}
        <linearGradient id="pond-shore" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="30%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        {/* Clear Turquoise Water Gradient */}
        <radialGradient id="pond-water" cx="45%" cy="45%" r="65%">
          <stop offset="0%" stopColor="#a5f3fc" />
          <stop offset="35%" stopColor="#38bdf8" />
          <stop offset="75%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#075985" />
        </radialGradient>

        {/* Lily pad green */}
        <linearGradient id="lily-green" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>

        {/* Golden Snake Gradient */}
        <linearGradient id="golden-snake-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="40%" stopColor="#facc15" />
          <stop offset="85%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>

        {/* Swimming Teal Snake Gradient */}
        <linearGradient id="teal-snake-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="50%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>

      {/* Pond Outer Sand Edge / Shoreline */}
      <path
        d="M 28 72 C 24 38 78 18 135 14 C 185 10 226 34 228 65 C 230 102 188 138 130 142 C 68 145 32 108 28 72 Z"
        fill="#7dd3fc"
        stroke="#0369a1"
        strokeWidth="3.5"
      />

      {/* Main Pond Water Body */}
      <path
        d="M 32 72 C 28 42 80 23 134 19 C 182 15 221 37 223 66 C 225 99 184 133 129 137 C 72 140 36 104 32 72 Z"
        fill="url(#pond-water)"
      />

      {/* Water Ripple Highlights */}
      <path
        d="M 52 50 C 72 44 112 44 128 48"
        stroke="#e0f2fe"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />
      <path
        d="M 148 38 C 172 36 195 44 205 52"
        stroke="#e0f2fe"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.75"
      />
      <path
        d="M 68 98 C 88 104 122 106 142 102"
        stroke="#bae6fd"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />

      {/* Smooth River Stones inside pond */}
      <ellipse cx="62" cy="38" rx="8" ry="5" fill="#64748b" stroke="#334155" strokeWidth="1" />
      <ellipse cx="60" cy="36" rx="4" ry="2" fill="#94a3b8" />

      <ellipse cx="178" cy="46" rx="9" ry="5.5" fill="#64748b" stroke="#334155" strokeWidth="1" />
      <ellipse cx="176" cy="44" rx="4" ry="2.2" fill="#94a3b8" />

      <ellipse cx="120" cy="118" rx="8" ry="4" fill="#475569" stroke="#1e293b" strokeWidth="1" />

      {/* Lily Pad 1 (Left - with swimming teal snake nearby) */}
      <g transform="translate(68, 62)">
        <path
          d="M 18 10 A 14 14 0 1 1 8 20 L 15 15 Z"
          fill="url(#lily-green)"
          stroke="#15803d"
          strokeWidth="1.5"
        />
        <circle cx="15" cy="15" r="1.5" fill="#fef08a" />
      </g>

      {/* Swimming Teal Snake (Upper Left Water) */}
      <g transform="translate(74, 52)">
        {/* Snake body ripples */}
        <path
          d="M 0 16 Q 8 10 16 16 Q 24 22 32 16"
          fill="none"
          stroke="url(#teal-snake-grad)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Head */}
        <ellipse cx="28" cy="12" rx="6" ry="5" fill="url(#teal-snake-grad)" stroke="#065f46" strokeWidth="1" />
        <circle cx="26" cy="10" r="1.5" fill="#0f172a" />
        <circle cx="25.5" cy="9.5" r="0.5" fill="#ffffff" />
        {/* Tongue */}
        <path d="M 33 13 L 36 12" stroke="#ef4444" strokeWidth="0.9" strokeLinecap="round" />
      </g>

      {/* Center Giant Lily Pad with Sleeping Golden Snake! */}
      {hasGoldenSnake && (
        <g transform="translate(104, 54)">
          {/* Giant Lily Pad */}
          <path
            d="M 38 18 A 26 22 0 1 1 20 36 L 30 26 Z"
            fill="url(#lily-green)"
            stroke="#166534"
            strokeWidth="2"
          />

          {/* Golden Snake Coiled Happily on the Lily Pad */}
          {/* Outer Coiled Body */}
          <path
            d="M 24 28 C 18 20 28 12 36 15 C 46 18 48 28 40 33 C 32 38 20 35 24 28 Z"
            fill="url(#golden-snake-grad)"
            stroke="#854d0e"
            strokeWidth="1.5"
          />
          {/* Brown spots on snake back */}
          <circle cx="28" cy="17" r="1.8" fill="#a16207" />
          <circle cx="36" cy="19" r="1.8" fill="#a16207" />
          <circle cx="42" cy="27" r="1.8" fill="#a16207" />

          {/* Snake Head resting curled */}
          <ellipse cx="22" cy="18" rx="5.5" ry="4.5" fill="url(#golden-snake-grad)" stroke="#854d0e" strokeWidth="1" />
          {/* Eye (happy / closed or cute open dot) */}
          <circle cx="20" cy="16.5" r="1.4" fill="#0f172a" />
          <circle cx="19.5" cy="16" r="0.5" fill="#ffffff" />
          {/* Cheek */}
          <circle cx="19" cy="19.5" r="1" fill="#f97316" opacity="0.6" />
          {/* Smile */}
          <path d="M 21 19 Q 22 20.5 24 19.5" stroke="#713f12" strokeWidth="0.8" fill="none" strokeLinecap="round" />
        </g>
      )}

      {/* Swimming Green/Teal Snake 2 (Lower Right) */}
      <g transform="translate(150, 78)">
        {/* Rippling body */}
        <path
          d="M 0 12 Q 10 6 18 12 Q 26 18 34 11"
          fill="none"
          stroke="url(#teal-snake-grad)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Head */}
        <ellipse cx="8" cy="8" rx="5.5" ry="4.5" fill="url(#teal-snake-grad)" stroke="#065f46" strokeWidth="1" />
        <circle cx="7" cy="7" r="1.3" fill="#0f172a" />
        <circle cx="6.6" cy="6.6" r="0.5" fill="#ffffff" />
        {/* Tongue */}
        <path d="M 3 7 L 0 6.5" stroke="#ef4444" strokeWidth="0.8" strokeLinecap="round" />
      </g>
    </svg>
  );
};

// ==========================================
// 3. SNAKE FAMILY TRIO (Green, Pink & Teal)
// ==========================================
export const SnakeFamilyTrio: React.FC<{ size?: number }> = ({ size = 68 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-md select-none"
    >
      <defs>
        {/* Snake 1: Green */}
        <linearGradient id="trio-green" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
        {/* Snake 2: Pink */}
        <linearGradient id="trio-pink" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbcfe8" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
        {/* Snake 3: Teal */}
        <linearGradient id="trio-teal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a5f3fc" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>

      {/* Little dirt/grass bed */}
      <ellipse cx="40" cy="62" rx="30" ry="12" fill="#2d5f24" opacity="0.4" />

      {/* Snake 1: Green Papa Snake (Left) */}
      <g>
        <path
          d="M 28 60 C 18 56 16 42 24 34 C 30 28 36 32 38 40 C 40 48 34 58 28 60 Z"
          fill="url(#trio-green)"
          stroke="#14532d"
          strokeWidth="1.5"
        />
        {/* Head */}
        <ellipse cx="26" cy="30" rx="7" ry="6" fill="url(#trio-green)" stroke="#14532d" strokeWidth="1.2" />
        <circle cx="24" cy="28" r="1.6" fill="#0f172a" />
        <circle cx="23.4" cy="27.4" r="0.6" fill="#ffffff" />
        <circle cx="21" cy="31" r="1.2" fill="#ef4444" opacity="0.6" />
      </g>

      {/* Snake 2: Pink Mama Snake (Right) */}
      <g>
        <path
          d="M 50 60 C 60 56 62 42 54 34 C 48 28 42 32 40 40 C 38 48 44 58 50 60 Z"
          fill="url(#trio-pink)"
          stroke="#9d174d"
          strokeWidth="1.5"
        />
        {/* Head */}
        <ellipse cx="52" cy="28" rx="6.5" ry="5.5" fill="url(#trio-pink)" stroke="#9d174d" strokeWidth="1.2" />
        <circle cx="54" cy="26.5" r="1.5" fill="#0f172a" />
        <circle cx="54.5" cy="26" r="0.5" fill="#ffffff" />
        <circle cx="56" cy="29" r="1.2" fill="#f43f5e" opacity="0.6" />
        {/* Tongue */}
        <path d="M 57 28.5 L 61 29" stroke="#ef4444" strokeWidth="0.9" strokeLinecap="round" />
      </g>

      {/* Snake 3: Baby Teal Snake (Front Center) */}
      <g>
        <ellipse cx="38" cy="56" rx="9" ry="7" fill="url(#trio-teal)" stroke="#0e7490" strokeWidth="1.2" />
        <circle cx="36" cy="54" r="1.2" fill="#0f172a" />
        <circle cx="35.6" cy="53.6" r="0.4" fill="#ffffff" />
        <circle cx="41" cy="54" r="1.2" fill="#0f172a" />
        <circle cx="40.6" cy="53.6" r="0.4" fill="#ffffff" />
        <path d="M 37 57 Q 38.5 58.5 40 57" stroke="#0e7490" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
};

// ==========================================
// 4. BABY SNAKE ON LEAF
// ==========================================
export const BabySnakeOnLeaf: React.FC<{ size?: number }> = ({ size = 52 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-md select-none"
    >
      {/* Big Jungle Leaf */}
      <path
        d="M 10 48 C 6 28 32 12 52 14 C 54 36 34 56 10 48 Z"
        fill="#4ade80"
        stroke="#15803d"
        strokeWidth="1.5"
      />
      {/* Leaf vein */}
      <path d="M 12 46 Q 30 32 50 16" stroke="#16a34a" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Tiny coiled green snake */}
      <g transform="translate(18, 16)">
        <path
          d="M 12 18 C 6 18 6 10 14 10 C 22 10 22 18 16 20 Z"
          fill="#86efac"
          stroke="#166534"
          strokeWidth="1.2"
        />
        {/* Head */}
        <ellipse cx="16" cy="10" rx="4" ry="3.5" fill="#86efac" stroke="#166534" strokeWidth="1" />
        <circle cx="15" cy="9" r="1" fill="#0f172a" />
        <circle cx="14.7" cy="8.7" r="0.3" fill="#ffffff" />
      </g>
    </svg>
  );
};

// ==========================================
// 5. PURPLE SNAKE ON VINE-WRAPPED TREE POST
// ==========================================
export const PurpleSnakeVineTree: React.FC<{ size?: number }> = ({ size = 68 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 70 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-md select-none"
    >
      {/* Twisted wooden tree trunk */}
      <path
        d="M 50 75 Q 46 45 52 20 Q 56 10 58 5"
        stroke="#78350f"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Side branch */}
      <path d="M 50 40 Q 36 32 28 30" stroke="#78350f" strokeWidth="5" strokeLinecap="round" fill="none" />

      {/* Hanging vines */}
      <path d="M 52 25 Q 42 34 46 50" stroke="#15803d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 32 30 Q 34 44 32 58" stroke="#16a34a" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Broad leaf */}
      <ellipse cx="26" cy="28" rx="12" ry="7" fill="#22c55e" stroke="#14532d" strokeWidth="1.2" />

      {/* Cute Purple Snake Perched on Leaf */}
      <g transform="translate(18, 14)">
        <path
          d="M 8 16 C 4 14 6 8 12 8 C 18 8 18 16 12 18 Z"
          fill="#c084fc"
          stroke="#6b21a8"
          strokeWidth="1.2"
        />
        <ellipse cx="14" cy="8" rx="4.5" ry="3.8" fill="#c084fc" stroke="#6b21a8" strokeWidth="1" />
        <circle cx="13" cy="7" r="1.1" fill="#0f172a" />
        <circle cx="12.7" cy="6.7" r="0.4" fill="#ffffff" />
      </g>
    </svg>
  );
};

// ==========================================
// 6. SPOTTED GOLDEN PYTHON ON HILL
// ==========================================
export const SpottedSnakeHill: React.FC<{ size?: number }> = ({ size = 70 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 75 75"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-md select-none"
    >
      {/* Grassy Knoll */}
      <ellipse cx="36" cy="58" rx="30" ry="14" fill="#3b7a2d" stroke="#235219" strokeWidth="1.5" />

      {/* Red Mushrooms */}
      <g transform="translate(54, 42)">
        <rect x="3" y="8" width="3" height="6" rx="1.5" fill="#fef08a" />
        <ellipse cx="4.5" cy="8" rx="5" ry="4" fill="#ef4444" stroke="#991b1b" strokeWidth="0.8" />
        <circle cx="3" cy="7" r="0.7" fill="#ffffff" />
        <circle cx="6" cy="8" r="0.6" fill="#ffffff" />
      </g>

      {/* Coiled Golden Snake */}
      <path
        d="M 20 52 C 12 45 15 32 26 28 C 36 24 48 30 46 42 C 44 54 26 56 20 52 Z"
        fill="#eab308"
        stroke="#854d0e"
        strokeWidth="1.5"
      />
      {/* Brown spots */}
      <circle cx="22" cy="38" r="1.6" fill="#713f12" />
      <circle cx="32" cy="30" r="1.8" fill="#713f12" />
      <circle cx="42" cy="36" r="1.6" fill="#713f12" />

      {/* Snake Head */}
      <ellipse cx="24" cy="26" rx="6" ry="5" fill="#eab308" stroke="#854d0e" strokeWidth="1.2" />
      <circle cx="22" cy="24.5" r="1.4" fill="#0f172a" />
      <circle cx="21.5" cy="24" r="0.5" fill="#ffffff" />
      <circle cx="20" cy="27" r="1.2" fill="#ea580c" opacity="0.6" />
    </svg>
  );
};

// ==========================================
// 7. BLUE SNACK NEXT TO MUSHROOM
// ==========================================
export const BlueSnakeMushroom: React.FC<{ size?: number }> = ({ size = 60 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 65 65"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-md select-none"
    >
      {/* Mushroom */}
      <g transform="translate(38, 30)">
        <rect x="4" y="10" width="4" height="8" rx="2" fill="#fef08a" />
        <ellipse cx="6" cy="10" rx="7" ry="5.5" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
        <circle cx="4" cy="8" r="1" fill="#ffffff" />
        <circle cx="8" cy="9" r="0.8" fill="#ffffff" />
      </g>

      {/* Smiling Blue Snake */}
      <path
        d="M 12 50 C 8 38 18 30 26 34 C 32 37 30 46 24 50 Z"
        fill="#38bdf8"
        stroke="#0369a1"
        strokeWidth="1.4"
      />
      <ellipse cx="22" cy="28" rx="5.5" ry="4.5" fill="#38bdf8" stroke="#0369a1" strokeWidth="1.2" />
      <circle cx="20" cy="26.5" r="1.3" fill="#0f172a" />
      <circle cx="19.5" cy="26" r="0.5" fill="#ffffff" />
      <circle cx="18" cy="29" r="1" fill="#ec4899" opacity="0.7" />
    </svg>
  );
};
