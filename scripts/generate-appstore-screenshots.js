import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

const outDir = path.resolve('public/screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1290 x 2796 iPhone 6.7" screenshot standard
const W = 1290;
const H = 2796;

const screenshots = [
  {
    fileName: 'screenshot-1.png',
    badge: '★ 2026 經典全面升級',
    title: '經典貪吃蛇 · 煥新冒險',
    subtitle: '極致絲滑滑動手感 · 絢麗霓虹科技畫布',
    themeColor: '#10b981',
    accentColor: '#34d399',
    svgContent: `
      <!-- Phone Frame & Canvas Mockup -->
      <g transform="translate(135, 780)">
        <!-- Outer Glow -->
        <rect x="0" y="0" width="1020" height="1860" rx="64" fill="#04161b" stroke="#10b981" stroke-width="6" opacity="0.9" />
        
        <!-- Header Bar Inside Game -->
        <rect x="30" y="30" width="960" height="130" rx="36" fill="#06222b" stroke="#1e4e5f" stroke-width="2" />
        <text x="70" y="105" fill="#fde047" font-size="44" font-weight="900" font-family="-apple-system, BlinkMacSystemFont, sans-serif">❤️ 5/5</text>
        <text x="360" y="105" fill="#f59e0b" font-size="44" font-weight="900" font-family="-apple-system, BlinkMacSystemFont, sans-serif">🪙 12,850</text>
        <text x="720" y="105" fill="#38bdf8" font-size="44" font-weight="900" font-family="-apple-system, BlinkMacSystemFont, sans-serif">得分: 2,480</text>
        
        <!-- Grid Board -->
        <rect x="30" y="190" width="960" height="1420" rx="40" fill="#021118" stroke="#0e3a47" stroke-width="4" />
        
        <!-- Grid Lines -->
        <path d="
          M 30,350 L 990,350 M 30,510 L 990,510 M 30,670 L 990,670 M 30,830 L 990,830 M 30,990 L 990,990 M 30,1150 L 990,1150 M 30,1310 L 990,1310 M 30,1470 L 990,1470
          M 150,190 L 150,1610 M 270,190 L 270,1610 M 390,190 L 390,1610 M 510,190 L 510,1610 M 630,190 L 630,1610 M 750,190 L 750,1610 M 870,190 L 870,1610
        " stroke="#083344" stroke-width="2" opacity="0.6" />

        <!-- Neon Glow Food -->
        <circle cx="750" cy="510" r="42" fill="#ef4444" filter="drop-shadow(0 0 25px #f43f5e)" />
        <circle cx="738" cy="495" r="14" fill="#ffffff" opacity="0.7" />
        <path d="M 750,468 Q 765,445 778,442" stroke="#22c55e" stroke-width="6" fill="none" stroke-linecap="round" />

        <!-- Golden Food -->
        <circle cx="270" cy="1150" r="42" fill="#eab308" filter="drop-shadow(0 0 30px #facc15)" />
        <circle cx="258" cy="1135" r="14" fill="#ffffff" opacity="0.8" />

        <!-- Snake Body Segments -->
        <circle cx="270" cy="670" r="48" fill="#047857" />
        <circle cx="390" cy="670" r="48" fill="#059669" />
        <circle cx="510" cy="670" r="48" fill="#10b981" />
        <circle cx="510" cy="510" r="48" fill="#10b981" />
        <circle cx="630" cy="510" r="50" fill="#34d399" />
        
        <!-- Snake Head (Cute Monster) -->
        <g transform="translate(630, 510)">
          <!-- Head Base -->
          <circle cx="0" cy="0" r="58" fill="#10b981" stroke="#34d399" stroke-width="6" />
          
          <!-- Cute Crown -->
          <polygon points="-24,-52 -32,-82 -12,-66 0,-88 12,-66 32,-82 24,-52" fill="#fbbf24" stroke="#d97706" stroke-width="3" />
          <circle cx="-32" cy="-82" r="5" fill="#f43f5e" />
          <circle cx="0" cy="-88" r="6" fill="#38bdf8" />
          <circle cx="32" cy="-82" r="5" fill="#f43f5e" />

          <!-- Big Cute Eyes -->
          <circle cx="20" cy="-14" r="19" fill="#022c22" />
          <circle cx="20" cy="-14" r="15" fill="#065f46" />
          <circle cx="24" cy="-18" r="6" fill="#ffffff" />
          <circle cx="16" cy="-10" r="2.5" fill="#ffffff" />

          <!-- Blushing Cheeks -->
          <ellipse cx="26" cy="16" rx="14" ry="8" fill="#f43f5e" opacity="0.6" />

          <!-- Smile & cute tooth -->
          <path d="M 28,10 Q 36,24 22,28" stroke="#064e3b" stroke-width="4" fill="none" stroke-linecap="round" />
          <polygon points="26,16 32,22 24,22" fill="#ffffff" />
        </g>

        <!-- Dynamic Touch Gesture Guide -->
        <g transform="translate(510, 1690)">
          <rect x="-380" y="0" width="760" height="110" rx="55" fill="#0f2935" stroke="#38bdf8" stroke-width="3" />
          <text x="0" y="68" fill="#e0f2fe" font-size="36" font-weight="bold" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif">
            👆 任意滑動屏幕 · 暢享零延遲轉向
          </text>
        </g>
      </g>
    `
  },
  {
    fileName: 'screenshot-2.png',
    badge: '🗺️ 沉浸式世界地圖',
    title: '海量關卡 · 探索未知',
    subtitle: '星級挑戰機制 · 森林、熔岩、星空夢幻主題',
    themeColor: '#06b6d4',
    accentColor: '#38bdf8',
    svgContent: `
      <!-- Phone Frame & Map Mockup -->
      <g transform="translate(135, 780)">
        <rect x="0" y="0" width="1020" height="1860" rx="64" fill="#031622" stroke="#0284c7" stroke-width="6" opacity="0.95" />
        
        <!-- Map Title Header -->
        <rect x="40" y="40" width="940" height="130" rx="36" fill="#082b3d" stroke="#0ea5e9" stroke-width="2" />
        <text x="510" y="118" fill="#ffffff" font-size="46" font-weight="900" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif">
          關卡大冒險 · 第 1 章: 螢火綠洲
        </text>

        <!-- Adventure S-Curve Trail -->
        <path d="M 260,1500 C 400,1400 760,1350 760,1150 C 760,950 260,900 260,700 C 260,500 760,450 760,280" 
              stroke="#0369a1" stroke-width="32" stroke-linecap="round" fill="none" opacity="0.6" />
        <path d="M 260,1500 C 400,1400 760,1350 760,1150 C 760,950 260,900 260,700 C 260,500 760,450 760,280" 
              stroke="#38bdf8" stroke-width="12" stroke-dasharray="24 20" stroke-linecap="round" fill="none" />

        <!-- Node 1 (Cleared) -->
        <g transform="translate(260, 1500)">
          <circle cx="0" cy="0" r="75" fill="#059669" stroke="#34d399" stroke-width="8" filter="drop-shadow(0 0 20px #10b981)" />
          <text x="0" y="20" fill="#ffffff" font-size="54" font-weight="900" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif">1</text>
          <!-- Stars -->
          <text x="-40" y="110" font-size="34">⭐</text>
          <text x="0" y="110" font-size="34">⭐</text>
          <text x="40" y="110" font-size="34">⭐</text>
        </g>

        <!-- Node 2 (Cleared) -->
        <g transform="translate(760, 1150)">
          <circle cx="0" cy="0" r="75" fill="#059669" stroke="#34d399" stroke-width="8" filter="drop-shadow(0 0 20px #10b981)" />
          <text x="0" y="20" fill="#ffffff" font-size="54" font-weight="900" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif">2</text>
          <text x="-40" y="110" font-size="34">⭐</text>
          <text x="0" y="110" font-size="34">⭐</text>
          <text x="40" y="110" font-size="34">⭐</text>
        </g>

        <!-- Node 3 (Current / Active) -->
        <g transform="translate(260, 700)">
          <circle cx="0" cy="0" r="88" fill="#f59e0b" stroke="#fde047" stroke-width="10" filter="drop-shadow(0 0 35px #facc15)" />
          <text x="0" y="24" fill="#ffffff" font-size="62" font-weight="900" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif">3</text>
          <polygon points="0,-125 -16,-95 16,-95" fill="#facc15" />
          <text x="0" y="-135" fill="#fef08a" font-size="28" font-weight="900" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif">CURRENT</text>
        </g>

        <!-- Node 4 (Locked) -->
        <g transform="translate(760, 280)">
          <circle cx="0" cy="0" r="70" fill="#1e293b" stroke="#475569" stroke-width="6" />
          <text x="0" y="18" fill="#94a3b8" font-size="46" font-weight="900" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif">🔒</text>
        </g>

        <!-- Chapter Clear Reward Card -->
        <g transform="translate(110, 1640)">
          <rect x="0" y="0" width="800" height="150" rx="36" fill="#0f2b3e" stroke="#0284c7" stroke-width="3" />
          <text x="60" y="70" fill="#38bdf8" font-size="34" font-weight="bold" font-family="-apple-system, BlinkMacSystemFont, sans-serif">通關第 1 章限定獎勵</text>
          <text x="60" y="115" fill="#94a3b8" font-size="28" font-family="-apple-system, BlinkMacSystemFont, sans-serif">解鎖「冰霜藍焰」限定酷炫蛇蛇皮膚</text>
          <circle cx="710" cy="75" r="46" fill="#0284c7" />
          <text x="710" y="93" fill="#ffffff" font-size="42" text-anchor="middle">🎁</text>
        </g>
      </g>
    `
  },
  {
    fileName: 'screenshot-3.png',
    badge: '👑 蛇王專屬榮耀',
    title: '多樣外觀 · 萌寵個性',
    subtitle: '萌怪龍角、閃耀金冠 · 打造你的專屬蛇蛇',
    themeColor: '#f59e0b',
    accentColor: '#fbbf24',
    svgContent: `
      <!-- Phone Frame & Skins Mockup -->
      <g transform="translate(135, 780)">
        <rect x="0" y="0" width="1020" height="1860" rx="64" fill="#180e04" stroke="#d97706" stroke-width="6" opacity="0.95" />

        <!-- Top Showcase Avatar -->
        <g transform="translate(510, 420)">
          <circle cx="0" cy="0" r="220" fill="#2d1a08" stroke="#f59e0b" stroke-width="8" filter="drop-shadow(0 0 50px #d97706)" />
          
          <!-- Giant Mascot Head with Crown & Gold Horns -->
          <circle cx="0" cy="20" r="140" fill="#10b981" stroke="#34d399" stroke-width="8" />
          
          <!-- Golden Horns -->
          <path d="M -80,-50 C -120,-110 -90,-160 -40,-130 C -60,-100 -65,-70 -50,-40 Z" fill="#f59e0b" stroke="#fde047" stroke-width="4" />
          <path d="M 80,-50 C 120,-110 90,-160 40,-130 C 60,-100 65,-70 50,-40 Z" fill="#f59e0b" stroke="#fde047" stroke-width="4" />

          <!-- King Crown -->
          <polygon points="-50,-100 -70,-160 -25,-130 0,-175 25,-130 70,-160 50,-100" fill="#fbbf24" stroke="#b45309" stroke-width="5" />
          <circle cx="0" cy="-175" r="14" fill="#38bdf8" />
          <circle cx="-70" cy="-160" r="10" fill="#ef4444" />
          <circle cx="70" cy="-160" r="10" fill="#ef4444" />

          <!-- Big Sparkling Eyes -->
          <circle cx="-42" cy="0" r="32" fill="#064e3b" />
          <circle cx="-34" cy="-8" r="12" fill="#ffffff" />
          <circle cx="42" cy="0" r="32" fill="#064e3b" />
          <circle cx="50" cy="-8" r="12" fill="#ffffff" />

          <!-- Cute Cheeks -->
          <ellipse cx="-75" cy="45" rx="25" ry="16" fill="#f43f5e" opacity="0.65" />
          <ellipse cx="75" cy="45" rx="25" ry="16" fill="#f43f5e" opacity="0.65" />
          
          <text x="0" y="270" fill="#fef08a" font-size="44" font-weight="900" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif">
            「皇冠龍萌蛇」· 傳說品質
          </text>
        </g>

        <!-- Skin Selector Grid -->
        <g transform="translate(60, 780)">
          <rect x="0" y="0" width="900" height="980" rx="36" fill="#261405" stroke="#78350f" stroke-width="3" />
          <text x="40" y="70" fill="#fde68a" font-size="38" font-weight="bold" font-family="-apple-system, BlinkMacSystemFont, sans-serif">裝扮衣櫥 (Skins Collection)</text>
          
          <!-- Skin 1 -->
          <rect x="40" y="110" width="390" height="380" rx="28" fill="#3b1d07" stroke="#f59e0b" stroke-width="4" />
          <circle cx="235" cy="250" r="70" fill="#10b981" />
          <text x="235" y="420" fill="#ffffff" font-size="32" font-weight="bold" text-anchor="middle">翠綠萌萌龍 (已佩戴)</text>
          
          <!-- Skin 2 -->
          <rect x="470" y="110" width="390" height="380" rx="28" fill="#1e1b4b" stroke="#6366f1" stroke-width="3" />
          <circle cx="665" cy="250" r="70" fill="#38bdf8" />
          <text x="665" y="420" fill="#c7d2fe" font-size="32" font-weight="bold" text-anchor="middle">星際冰晶蛇</text>

          <!-- Skin 3 -->
          <rect x="40" y="530" width="390" height="380" rx="28" fill="#3b0717" stroke="#f43f5e" stroke-width="3" />
          <circle cx="235" cy="670" r="70" fill="#ef4444" />
          <text x="235" y="840" fill="#fecdd3" font-size="32" font-weight="bold" text-anchor="middle">熔岩烈火蛇</text>

          <!-- Skin 4 -->
          <rect x="470" y="530" width="390" height="380" rx="28" fill="#18181b" stroke="#71717a" stroke-width="3" />
          <circle cx="665" cy="670" r="70" fill="#eab308" />
          <text x="665" y="840" fill="#fef08a" font-size="32" font-weight="bold" text-anchor="middle">暗夜黃金皇者</text>
        </g>
      </g>
    `
  },
  {
    fileName: 'screenshot-4.png',
    badge: '🍎 趣味特殊道具',
    title: '神奇蘋果 · 逆轉戰局',
    subtitle: '黃金蘋果倍增積分 · 冰霜蘋果時間減速',
    themeColor: '#ec4899',
    accentColor: '#f472b6',
    svgContent: `
      <!-- Phone Frame & Items Mockup -->
      <g transform="translate(135, 780)">
        <rect x="0" y="0" width="1020" height="1860" rx="64" fill="#1a0717" stroke="#db2777" stroke-width="6" opacity="0.95" />

        <!-- 4 Item Showcase Cards -->
        <g transform="translate(60, 60)">
          <!-- Red Apple -->
          <rect x="0" y="0" width="900" height="380" rx="36" fill="#2d0b28" stroke="#f43f5e" stroke-width="3" />
          <circle cx="160" cy="190" r="90" fill="#e11d48" filter="drop-shadow(0 0 30px #f43f5e)" />
          <circle cx="130" cy="160" r="28" fill="#ffffff" opacity="0.6" />
          <text x="300" y="150" fill="#ffffff" font-size="44" font-weight="900" font-family="-apple-system, BlinkMacSystemFont, sans-serif">經典紅蘋果 (Classic Red)</text>
          <text x="300" y="210" fill="#fda4af" font-size="32" font-family="-apple-system, BlinkMacSystemFont, sans-serif">基礎長度 +1 · 獲取 10 基礎分數</text>
          <text x="300" y="270" fill="#f43f5e" font-size="28" font-weight="bold">最原汁原味的童年回憶</text>

          <!-- Golden Apple -->
          <g transform="translate(0, 420)">
            <rect x="0" y="0" width="900" height="380" rx="36" fill="#2d2207" stroke="#eab308" stroke-width="4" />
            <circle cx="160" cy="190" r="90" fill="#eab308" filter="drop-shadow(0 0 40px #facc15)" />
            <circle cx="130" cy="160" r="28" fill="#ffffff" opacity="0.8" />
            <text x="300" y="150" fill="#ffffff" font-size="44" font-weight="900" font-family="-apple-system, BlinkMacSystemFont, sans-serif">金蘋果 (Golden Apple)</text>
            <text x="300" y="210" fill="#fde047" font-size="32" font-family="-apple-system, BlinkMacSystemFont, sans-serif">限時狂暴高分 · 分數 5 倍暴擊</text>
            <text x="300" y="270" fill="#facc15" font-size="28" font-weight="bold">⚡ 快速衝擊全球第一名必備</text>
          </g>

          <!-- Blue Ice Apple -->
          <g transform="translate(0, 840)">
            <rect x="0" y="0" width="900" height="380" rx="36" fill="#082333" stroke="#0284c7" stroke-width="3" />
            <circle cx="160" cy="190" r="90" fill="#0284c7" filter="drop-shadow(0 0 35px #38bdf8)" />
            <circle cx="130" cy="160" r="28" fill="#ffffff" opacity="0.7" />
            <text x="300" y="150" fill="#ffffff" font-size="44" font-weight="900" font-family="-apple-system, BlinkMacSystemFont, sans-serif">冰霜藍蘋果 (Ice Freeze)</text>
            <text x="300" y="210" fill="#7dd3fc" font-size="32" font-family="-apple-system, BlinkMacSystemFont, sans-serif">時間減速 50% · 密閉空間救命神器</text>
            <text x="300" y="270" fill="#38bdf8" font-size="28" font-weight="bold">❄️ 蛇身太長時精準微操最佳助手</text>
          </g>

          <!-- Green Lucky Apple -->
          <g transform="translate(0, 1260)">
            <rect x="0" y="0" width="900" height="380" rx="36" fill="#08271e" stroke="#10b981" stroke-width="3" />
            <circle cx="160" cy="190" r="90" fill="#059669" filter="drop-shadow(0 0 35px #34d399)" />
            <circle cx="130" cy="160" r="28" fill="#ffffff" opacity="0.7" />
            <text x="300" y="150" fill="#ffffff" font-size="44" font-weight="900" font-family="-apple-system, BlinkMacSystemFont, sans-serif">幸運翡翠果 (Emerald)</text>
            <text x="300" y="210" fill="#a7f3d0" font-size="32" font-family="-apple-system, BlinkMacSystemFont, sans-serif">獲得額外金幣寶箱與神秘加成</text>
            <text x="300" y="270" fill="#34d399" font-size="28" font-weight="bold">🪙 升級與解鎖皮膚的必備來源</text>
          </g>
        </g>
      </g>
    `
  },
  {
    fileName: 'screenshot-5.png',
    badge: '🏆 全球即時榜單',
    title: '金榜題名 · 蛇王爭霸',
    subtitle: '與全球頂尖玩家一較高下 · 登頂榮耀殿堂',
    themeColor: '#8b5cf6',
    accentColor: '#a78bfa',
    svgContent: `
      <!-- Phone Frame & Leaderboard Mockup -->
      <g transform="translate(135, 780)">
        <rect x="0" y="0" width="1020" height="1860" rx="64" fill="#140a28" stroke="#7c3aed" stroke-width="6" opacity="0.95" />

        <!-- Podium Top 3 -->
        <g transform="translate(510, 360)">
          <!-- Rank 2 -->
          <g transform="translate(-260, 50)">
            <rect x="-100" y="0" width="200" height="240" rx="20" fill="#1e163b" stroke="#94a3b8" stroke-width="3" />
            <circle cx="0" cy="-60" r="50" fill="#475569" stroke="#94a3b8" stroke-width="4" />
            <text x="0" y="-45" font-size="46" text-anchor="middle">🥈</text>
            <text x="0" y="70" fill="#e2e8f0" font-size="28" font-weight="bold" text-anchor="middle">DragonKing</text>
            <text x="0" y="130" fill="#94a3b8" font-size="26" text-anchor="middle">88,200 分</text>
          </g>

          <!-- Rank 1 (Champion) -->
          <g transform="translate(0, 0)">
            <rect x="-120" y="0" width="240" height="290" rx="24" fill="#311957" stroke="#fbbf24" stroke-width="5" filter="drop-shadow(0 0 40px #f59e0b)" />
            <circle cx="0" cy="-75" r="62" fill="#78350f" stroke="#fbbf24" stroke-width="5" />
            <text x="0" y="-55" font-size="58" text-anchor="middle">👑</text>
            <text x="0" y="80" fill="#fef08a" font-size="34" font-weight="900" text-anchor="middle">SnakeMaster</text>
            <text x="0" y="145" fill="#facc15" font-size="30" font-weight="bold" text-anchor="middle">129,500 分</text>
          </g>

          <!-- Rank 3 -->
          <g transform="translate(260, 90)">
            <rect x="-100" y="0" width="200" height="200" rx="20" fill="#1e163b" stroke="#b45309" stroke-width="3" />
            <circle cx="0" cy="-55" r="46" fill="#451a03" stroke="#b45309" stroke-width="4" />
            <text x="0" y="-40" font-size="42" text-anchor="middle">🥉</text>
            <text x="0" y="65" fill="#fed7aa" font-size="28" font-weight="bold" text-anchor="middle">SpeedyBoa</text>
            <text x="0" y="125" fill="#b45309" font-size="26" text-anchor="middle">74,100 分</text>
          </g>
        </g>

        <!-- Rank List Rows -->
        <g transform="translate(60, 840)">
          <!-- Row 4 -->
          <rect x="0" y="0" width="900" height="150" rx="28" fill="#1e1238" stroke="#4c1d95" stroke-width="2" />
          <text x="60" y="90" fill="#a78bfa" font-size="42" font-weight="bold">#4</text>
          <text x="180" y="90" fill="#ffffff" font-size="36" font-weight="bold">CyberViper</text>
          <text x="820" y="90" fill="#c4b5fd" font-size="34" font-weight="bold" text-anchor="end">62,800 分</text>

          <!-- Row 5 -->
          <rect x="0" y="180" width="900" height="150" rx="28" fill="#1e1238" stroke="#4c1d95" stroke-width="2" />
          <text x="60" y="270" fill="#a78bfa" font-size="42" font-weight="bold">#5</text>
          <text x="180" y="270" fill="#ffffff" font-size="36" font-weight="bold">GreenPython</text>
          <text x="820" y="270" fill="#c4b5fd" font-size="34" font-weight="bold" text-anchor="end">55,420 分</text>

          <!-- Row 6 (My Rank) -->
          <rect x="0" y="360" width="900" height="170" rx="32" fill="#2e1065" stroke="#a855f7" stroke-width="4" filter="drop-shadow(0 0 25px #9333ea)" />
          <text x="60" y="460" fill="#f0abfc" font-size="42" font-weight="black">#12 (我)</text>
          <text x="240" y="460" fill="#ffffff" font-size="36" font-weight="black">You (Hero)</text>
          <text x="820" y="460" fill="#e879f9" font-size="38" font-weight="black" text-anchor="end">38,900 分</text>
        </g>

        <!-- Achievement Badge footer -->
        <g transform="translate(60, 1500)">
          <rect x="0" y="0" width="900" height="190" rx="36" fill="#241147" stroke="#7c3aed" stroke-width="3" />
          <text x="50" y="80" fill="#f5d0fe" font-size="34" font-weight="bold">🎖️ 成就系統全面解鎖</text>
          <text x="50" y="135" fill="#a78bfa" font-size="28">完成「百果大胃王」、「不死傳奇」獲取海量金幣！</text>
          <circle cx="810" cy="95" r="55" fill="#7c3aed" />
          <text x="810" y="115" font-size="50" text-anchor="middle">🏅</text>
        </g>
      </g>
    `
  }
];

for (let i = 0; i < screenshots.length; i++) {
  const item = screenshots[i];
  
  const fullSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#020914" />
      <stop offset="25%" stop-color="#061826" />
      <stop offset="65%" stop-color="#020d18" />
      <stop offset="100%" stop-color="#01060c" />
    </linearGradient>

    <!-- Header Gradient Banner -->
    <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="70%" stop-color="#f8fafc" />
      <stop offset="100%" stop-color="${item.accentColor}" />
    </linearGradient>

    <radialGradient id="topGlow" cx="50%" cy="15%" r="50%">
      <stop offset="0%" stop-color="${item.themeColor}" stop-opacity="0.35" />
      <stop offset="100%" stop-color="${item.themeColor}" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- Canvas Background -->
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#bgGrad)" />
  <rect x="0" y="0" width="${W}" height="1000" fill="url(#topGlow)" />

  <!-- App Store Marketing Header -->
  <g transform="translate(645, 230)" text-anchor="middle">
    <!-- Tag Capsule -->
    <rect x="-240" y="0" width="480" height="72" rx="36" fill="${item.themeColor}33" stroke="${item.accentColor}88" stroke-width="3" />
    <text x="0" y="48" fill="${item.accentColor}" font-size="34" font-weight="900" font-family="-apple-system, BlinkMacSystemFont, sans-serif">
      ${item.badge}
    </text>

    <!-- Main Title -->
    <text x="0" y="195" fill="url(#titleGrad)" font-size="78" font-weight="900" letter-spacing="2" font-family="-apple-system, BlinkMacSystemFont, sans-serif">
      ${item.title}
    </text>

    <!-- Subtitle -->
    <text x="0" y="280" fill="#94a3b8" font-size="40" font-weight="500" font-family="-apple-system, BlinkMacSystemFont, sans-serif">
      ${item.subtitle}
    </text>
  </g>

  <!-- Illustration Body -->
  ${item.svgContent}
</svg>
`;

  const resvg = new Resvg(fullSvg, {
    fitTo: {
      mode: 'width',
      value: W
    }
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  const outPath = path.join(outDir, item.fileName);
  fs.writeFileSync(outPath, pngBuffer);
  console.log(`Generated ${item.fileName} (${W}x${H}) - ${pngBuffer.length} bytes`);
}

console.log('All 5 App Store 6.7" screenshots generated successfully at 1290x2796!');
