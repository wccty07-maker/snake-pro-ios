import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

// Create 1024x500 Feature Graphic SVG
const svg1024x500 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 500" width="1024" height="500">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#051329" />
      <stop offset="50%" stop-color="#02252a" />
      <stop offset="100%" stop-color="#021017" />
    </linearGradient>

    <radialGradient id="glowGlow" cx="35%" cy="50%" r="55%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.5" />
      <stop offset="60%" stop-color="#06b6d4" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#051329" stop-opacity="0" />
    </radialGradient>

    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#34d399" />
      <stop offset="100%" stop-color="#fde047" />
    </linearGradient>

    <!-- Grid Pattern -->
    <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#10b981" stroke-width="0.8" stroke-opacity="0.18" />
    </pattern>
  </defs>

  <!-- Deep Cosmic Background -->
  <rect width="1024" height="500" fill="url(#bgGrad)" />
  <rect width="1024" height="500" fill="url(#gridPattern)" />
  <circle cx="380" cy="250" r="320" fill="url(#glowGlow)" />

  <!-- Background Decorative Apples & Sparkles -->
  <g opacity="0.85">
    <!-- Star sparkles -->
    <circle cx="120" cy="80" r="3" fill="#38bdf8" opacity="0.8" />
    <circle cx="180" cy="140" r="2" fill="#34d399" opacity="0.9" />
    <circle cx="520" cy="70" r="4" fill="#fde047" opacity="0.7" />
    <circle cx="920" cy="120" r="3" fill="#38bdf8" opacity="0.6" />
    <circle cx="850" cy="380" r="3.5" fill="#fde047" opacity="0.8" />
    <circle cx="160" cy="420" r="2.5" fill="#34d399" opacity="0.7" />
  </g>

  <!-- Mascot Center-Left (Mascot scale & translate) -->
  <g transform="translate(140, 45) scale(0.82)">
    <!-- Coiled Body -->
    <ellipse cx="256" cy="320" rx="140" ry="85" fill="#065f46" opacity="0.6" />
    <path d="M 160 320 C 130 380, 260 410, 360 350 C 420 300, 390 230, 330 250 C 270 270, 200 240, 190 290" 
          fill="none" stroke="#10b981" stroke-width="48" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 160 320 C 130 380, 260 410, 360 350 C 420 300, 390 230, 330 250 C 270 270, 200 240, 190 290" 
          fill="none" stroke="#6ee7b7" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" opacity="0.8" />

    <!-- Cute Snake Head -->
    <ellipse cx="256" cy="190" rx="95" ry="85" fill="#10b981" />
    <ellipse cx="256" cy="180" rx="88" ry="76" fill="#34d399" />
    <ellipse cx="230" cy="155" rx="55" ry="35" fill="#a7f3d0" opacity="0.45" />

    <!-- Dragon Horns -->
    <path d="M 195 125 C 185 90, 160 70, 150 75 C 160 100, 180 120, 190 135 Z" fill="#f59e0b" stroke="#fef08a" stroke-width="2" />
    <path d="M 317 125 C 327 90, 352 70, 362 75 C 352 100, 332 120, 322 135 Z" fill="#f59e0b" stroke="#fef08a" stroke-width="2" />

    <!-- Royal Crown -->
    <path d="M 225 110 L 235 70 L 248 95 L 256 60 L 264 95 L 277 70 L 287 110 Z" fill="#fbbf24" stroke="#fef08a" stroke-width="2.5" />
    <circle cx="235" cy="68" r="4" fill="#ef4444" />
    <circle cx="256" cy="58" r="5" fill="#38bdf8" />
    <circle cx="277" cy="68" r="4" fill="#ef4444" />

    <!-- Big Cute Anime Eyes -->
    <!-- Left Eye -->
    <ellipse cx="215" cy="185" rx="22" ry="26" fill="#0f172a" />
    <ellipse cx="215" cy="187" rx="17" ry="20" fill="#0284c7" />
    <ellipse cx="215" cy="188" rx="11" ry="14" fill="#0369a1" />
    <circle cx="210" cy="177" r="8" fill="#ffffff" />
    <circle cx="221" cy="195" r="4" fill="#ffffff" />

    <!-- Right Eye -->
    <ellipse cx="297" cy="185" rx="22" ry="26" fill="#0f172a" />
    <ellipse cx="297" cy="187" rx="17" ry="20" fill="#0284c7" />
    <ellipse cx="297" cy="188" rx="11" ry="14" fill="#0369a1" />
    <circle cx="292" cy="177" r="8" fill="#ffffff" />
    <circle cx="303" cy="195" r="4" fill="#ffffff" />

    <!-- Cute Cheeks -->
    <ellipse cx="185" cy="212" rx="14" ry="9" fill="#f43f5e" opacity="0.6" />
    <ellipse cx="327" cy="212" rx="14" ry="9" fill="#f43f5e" opacity="0.6" />

    <!-- Happy Smile & Little Tooth -->
    <path d="M 238 218 Q 256 238 274 218" fill="none" stroke="#064e3b" stroke-width="4.5" stroke-linecap="round" />
    <polygon points="252,223 260,223 256,229" fill="#ffffff" />

    <!-- Shiny Red Apple Next to Mouth -->
    <g transform="translate(325, 230) scale(0.75)">
      <circle cx="40" cy="40" r="32" fill="#ef4444" />
      <path d="M 40 40 Q 60 15 35 15 Q 15 15 40 40 Z" fill="#dc2626" />
      <circle cx="28" cy="28" r="9" fill="#ffffff" opacity="0.55" />
      <path d="M 40 12 Q 42 2 46 -3" fill="none" stroke="#78350f" stroke-width="4.5" stroke-linecap="round" />
      <ellipse cx="50" cy="5" rx="9" ry="5" fill="#22c55e" transform="rotate(-25, 50, 5)" />
    </g>
  </g>

  <!-- Right Side: Big Bold Title & Tagline -->
  <g transform="translate(560, 160)">
    <!-- Badge -->
    <rect x="0" y="0" width="180" height="34" rx="17" fill="#10b981" fill-opacity="0.2" stroke="#10b981" stroke-width="1.5" />
    <text x="90" y="22" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-size="14" font-weight="900" fill="#34d399" text-anchor="middle" letter-spacing="1.5">ARCADE ADVENTURE</text>

    <!-- Main Game Title -->
    <text x="0" y="90" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-size="64" font-weight="900" fill="url(#textGrad)" letter-spacing="2">SNAKE PRO</text>
    <text x="0" y="140" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-size="32" font-weight="800" fill="#f8fafc" letter-spacing="1">怪獸萌蛇大冒險</text>

    <!-- Features Subtitle -->
    <g transform="translate(0, 180)">
      <circle cx="8" cy="8" r="5" fill="#34d399" />
      <text x="24" y="12" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-size="16" font-weight="700" fill="#94a3b8">Island Maps · Cute Monster Skins · Global Rank</text>
    </g>

    <g transform="translate(0, 215)">
      <circle cx="8" cy="8" r="5" fill="#fde047" />
      <text x="24" y="12" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-size="16" font-weight="700" fill="#94a3b8">60s Dash · Endless Challenge · Daily Rewards</text>
    </g>
  </g>
</svg>`;

const resvg = new Resvg(svg1024x500, {
  fitTo: { mode: 'width', value: 1024 }
});

const pngData = resvg.render().asPng();
fs.writeFileSync('public/feature-graphic-1024x500.png', pngData);
console.log('Generated public/feature-graphic-1024x500.png successfully! Size:', pngData.length);
