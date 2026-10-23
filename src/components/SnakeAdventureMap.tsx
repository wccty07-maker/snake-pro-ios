import React, { useMemo, useLayoutEffect } from 'react';
import { LevelMission } from '../types';
import { LEVEL_MISSIONS, WORLDS } from '../utils/levelsData';
import { SupportedLanguage, toSimplifiedChinese } from '../utils/i18n';
import { SnakeMapNode } from './SnakeMapNode';
import {
  SnakeBurrow,
  SnakePond,
  SnakeFamilyTrio,
  BabySnakeOnLeaf,
  PurpleSnakeVineTree,
  SpottedSnakeHill,
  BlueSnakeMushroom,
} from './SnakeMapDecorations';
import { CuteMonsterSnakeArt } from './CuteMonsterSnakeArt';

interface SnakeAdventureMapProps {
  unlockedLevel: number;
  currentLevelId?: number;
  completedLevels: number[];
  unlockAllLevels?: boolean;
  language?: SupportedLanguage;
  mapScrollRef: React.RefObject<HTMLDivElement | null>;
  currentNodeRef: React.RefObject<HTMLDivElement | null>;
  onNodeClick: (level: LevelMission) => void;
}

export const MAP_STEP_Y = 88;
export const WORLD_TRANSITION_GAP = 60;
export const MAP_CANVAS_WIDTH = 380;
export const MAP_CANVAS_HEIGHT = 400 * MAP_STEP_Y + 19 * WORLD_TRANSITION_GAP + 460;

export const getMapNodeY = (levelId: number): number => {
  const clampedId = Math.max(1, Math.min(400, levelId));
  const idx = clampedId - 1; // 0 to 399
  const worldIndex = Math.floor(idx / 20); // 0 to 19
  return MAP_CANVAS_HEIGHT - 280 - (idx * MAP_STEP_Y + worldIndex * WORLD_TRANSITION_GAP);
};

// Pastel pebble colors matching the user's reference image
const PEBBLE_COLORS = [
  { fill: '#7dd3fc', highlight: '#e0f2fe' }, // Light Sky Blue
  { fill: '#86efac', highlight: '#dcfce7' }, // Mint Green
  { fill: '#f472b6', highlight: '#fdf2f8' }, // Rose Pink
  { fill: '#fde047', highlight: '#fefce8' }, // Warm Yellow
  { fill: '#c084fc', highlight: '#fae8ff' }, // Soft Lilac
  { fill: '#fb923c', highlight: '#fff7ed' }, // Peach Orange
  { fill: '#5eead4', highlight: '#f0fdfa' }, // Soft Turquoise
  { fill: '#fdba74', highlight: '#ffedd5' }, // Amber Tan
];

export const SnakeAdventureMap: React.FC<SnakeAdventureMapProps> = ({
  unlockedLevel,
  currentLevelId,
  completedLevels,
  unlockAllLevels = false,
  language = 'zh-HK',
  mapScrollRef,
  currentNodeRef,
  onNodeClick,
}) => {
  const effectiveUnlocked = unlockedLevel || 1;
  const activeLevel = unlockAllLevels
    ? (currentLevelId || effectiveUnlocked)
    : Math.min(currentLevelId || effectiveUnlocked, effectiveUnlocked);
  // 1. Calculate Level Node Positions along organic S-curve
  const levelPositions = useMemo(() => {
    return LEVEL_MISSIONS.map((level) => {
      const idx = level.id - 1; // 0 to 199
      const y = getMapNodeY(level.id);
      // Smooth sinusoidal oscillation (X between ~75 and ~305)
      const angle = idx * 0.52;
      const x = 190 + Math.sin(angle) * 115;
      return { id: level.id, x, y, angle };
    });
  }, []);

  // Quick lookup map for positions by level id
  const posMap = useMemo(() => {
    const map = new Map<number, { x: number; y: number; angle: number }>();
    levelPositions.forEach((p) => map.set(p.id, p));
    return map;
  }, [levelPositions]);

  // 2. Compute SVG smooth spline path for the road
  const svgPathData = useMemo(() => {
    if (levelPositions.length === 0) return '';
    let d = `M ${levelPositions[0].x.toFixed(1)} ${levelPositions[0].y.toFixed(1)}`;
    for (let i = 0; i < levelPositions.length - 1; i++) {
      const p0 = levelPositions[Math.max(0, i - 1)];
      const p1 = levelPositions[i];
      const p2 = levelPositions[i + 1];
      const p3 = levelPositions[Math.min(levelPositions.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  }, [levelPositions]);

  // 4. Milestone treasure chests
  const milestoneLevels = [20, 40, 60, 80, 100, 120, 140, 160, 180, 200];

  // 5. Scenic zones rhythm (placing ponds, snake families, leaf snakes, vine trees)
  // We place a water pond every ~25 levels (levels 22, 50, 78, 105, 132, 160, 188)
  const pondLevels = [22, 52, 82, 112, 142, 172];
  const trioLevels = [23, 33, 53, 63, 83, 93, 113, 123, 143, 153, 173, 183];
  const babyLeafLevels = [23, 53, 83, 113, 143, 173];
  const vineTreeLevels = [21, 51, 81, 111, 141, 171];
  const spottedSnakeLevels = [25, 55, 85, 115, 145, 175];

  // Immediately center on current active level before paint, eliminating scroll from Lv 200 down to Lv 1
  useLayoutEffect(() => {
    if (mapScrollRef.current) {
      const targetY = getMapNodeY(activeLevel);
      const containerH =
        mapScrollRef.current.clientHeight ||
        (typeof window !== 'undefined' ? window.innerHeight - 100 : 650);
      mapScrollRef.current.scrollTop = Math.max(0, targetY - containerH / 2);
    }
  }, [activeLevel, mapScrollRef]);

  return (
    <div
      ref={mapScrollRef}
      className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y relative no-scrollbar"
      style={{
        background: 'linear-gradient(180deg, #1c4318 0%, #2f6526 25%, #3d7e32 50%, #2e6425 75%, #183e15 100%)',
      }}
    >
      {/* Map Inner Container */}
      <div
        className="relative mx-auto overflow-hidden"
        style={{
          width: MAP_CANVAS_WIDTH,
          height: MAP_CANVAS_HEIGHT,
        }}
      >
        {/* Layer 0: Natural Grassy Terrain Contours */}
        <div className="absolute inset-0 pointer-events-none opacity-45 overflow-hidden">
          {/* Alternating soft jungle grass contours */}
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={`contour-${i}`}
              className="absolute rounded-full blur-2xl"
              style={{
                top: i * 600,
                left: i % 2 === 0 ? -40 : 180,
                width: 240,
                height: 240,
                backgroundColor: i % 3 === 0 ? '#4ade80' : i % 3 === 1 ? '#22c55e' : '#15803d',
                opacity: 0.22,
              }}
            />
          ))}
        </div>

        {/* Layer 1: Left and Right Lush Tropical Foliage Edges */}
        <div className="absolute inset-y-0 left-0 w-14 pointer-events-none z-10 opacity-80 overflow-hidden">
          {Array.from({ length: 45 }).map((_, i) => (
            <div
              key={`foliage-left-${i}`}
              className="absolute"
              style={{
                top: i * 400 + (i % 2) * 50,
                left: -10,
              }}
            >
              <svg width="70" height="90" viewBox="0 0 70 90" fill="none">
                <path
                  d="M 0 45 C 20 20 60 25 65 45 C 55 60 20 65 0 45 Z"
                  fill="#1b4d1b"
                  stroke="#143d14"
                  strokeWidth="1.5"
                />
                <path d="M 0 45 Q 35 44 63 45" stroke="#2a6d2a" strokeWidth="1.2" fill="none" />
                {i % 2 === 0 && (
                  <path
                    d="M 5 65 Q 18 55 18 42 Q 18 32 10 32 Q 5 32 6 38"
                    stroke="#a855f7"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </div>
          ))}
        </div>

        <div className="absolute inset-y-0 right-0 w-14 pointer-events-none z-10 opacity-80 overflow-hidden">
          {Array.from({ length: 45 }).map((_, i) => (
            <div
              key={`foliage-right-${i}`}
              className="absolute"
              style={{
                top: i * 400 + ((i + 1) % 2) * 60,
                right: -10,
              }}
            >
              <svg width="70" height="90" viewBox="0 0 70 90" fill="none" style={{ transform: 'scaleX(-1)' }}>
                <path
                  d="M 0 45 C 20 20 60 25 65 45 C 55 60 20 65 0 45 Z"
                  fill="#184318"
                  stroke="#123512"
                  strokeWidth="1.5"
                />
                <path d="M 0 45 Q 35 44 63 45" stroke="#255c25" strokeWidth="1.2" fill="none" />
                {i % 3 === 0 && (
                  <path
                    d="M 5 65 Q 18 55 18 42 Q 18 32 10 32 Q 5 32 6 38"
                    stroke="#c084fc"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </div>
          ))}
        </div>

        {/* Layer 2: Scenic Water Ponds (Placed between loop bends) */}
        {pondLevels.map((lvl) => {
          const pos = posMap.get(lvl);
          if (!pos) return null;
          // Position pond inside the hollow of the loop
          const pondX = pos.x > 190 ? 40 : 160;
          const pondY = pos.y - 45;

          return (
            <div
              key={`pond-${lvl}`}
              className="absolute pointer-events-none z-0"
              style={{
                left: pondX,
                top: pondY,
              }}
            >
              <SnakePond width={210} height={135} hasGoldenSnake={lvl % 2 === 0} />
            </div>
          );
        })}

        {/* Layers 3-8: Vector decorations & pebble road */}
        {/* Layer 3: Snake Family Trios & Baby Snakes on Leaves */}
        {trioLevels.map((lvl) => {
          const pos = posMap.get(lvl);
          if (!pos) return null;
          const trioX = pos.x > 190 ? pos.x - 120 : pos.x + 65;
          const trioY = pos.y + 12;

          return (
            <div
              key={`trio-${lvl}`}
              className="absolute pointer-events-none z-10"
              style={{
                left: trioX,
                top: trioY,
              }}
            >
              <SnakeFamilyTrio size={64} />
            </div>
          );
        })}

        {babyLeafLevels.map((lvl) => {
          const pos = posMap.get(lvl);
          if (!pos) return null;
          const leafX = pos.x > 190 ? pos.x - 55 : pos.x + 40;
          const leafY = pos.y + 6;

          return (
            <div
              key={`baby-leaf-${lvl}`}
              className="absolute pointer-events-none z-10"
              style={{
                left: leafX,
                top: leafY,
              }}
            >
              <BabySnakeOnLeaf size={48} />
            </div>
          );
        })}

        {/* Layer 4: Vine Tree & Purple Snake */}
        {vineTreeLevels.map((lvl) => {
          const pos = posMap.get(lvl);
          if (!pos) return null;
          const treeX = pos.x > 190 ? 300 : 20;
          const treeY = pos.y - 25;

          return (
            <div
              key={`vine-tree-${lvl}`}
              className="absolute pointer-events-none z-10"
              style={{
                left: treeX,
                top: treeY,
              }}
            >
              <PurpleSnakeVineTree size={64} />
            </div>
          );
        })}

        {/* Layer 5: Spotted Python on Hill */}
        {spottedSnakeLevels.map((lvl) => {
          const pos = posMap.get(lvl);
          if (!pos) return null;
          const hillX = pos.x > 190 ? 25 : 290;
          const hillY = pos.y - 10;

          return (
            <div
              key={`spotted-${lvl}`}
              className="absolute pointer-events-none z-10"
              style={{
                left: hillX,
                top: hillY,
              }}
            >
              <SpottedSnakeHill size={65} />
            </div>
          );
        })}

        {/* Layer 6: BOTTOM START AREA (Snake Burrows for Level 1) */}
        {/* Left Burrow (Green Snake peeking out) */}
        <div
          className="absolute pointer-events-none z-10"
          style={{
            left: 20,
            top: MAP_CANVAS_HEIGHT - 130,
          }}
        >
          <SnakeBurrow snakeColor="green" />
        </div>

        {/* Right Burrow (Pink Snake peeking out) */}
        <div
          className="absolute pointer-events-none z-10"
          style={{
            left: 260,
            top: MAP_CANVAS_HEIGHT - 130,
          }}
        >
          <SnakeBurrow snakeColor="pink" flip />
        </div>

        {/* Blue snake smiling by mushroom at start area */}
        <div
          className="absolute pointer-events-none z-10"
          style={{
            left: 135,
            top: MAP_CANVAS_HEIGHT - 145,
          }}
        >
          <BlueSnakeMushroom size={55} />
        </div>

        {/* Layer 7: Milestone Treasure Chests */}
        {milestoneLevels.map((lvl) => {
          const pos = posMap.get(lvl);
          if (!pos) return null;
          const chestX = pos.x > 190 ? pos.x - 72 : pos.x + 65;
          const chestY = pos.y - 12;

          return (
            <div
              key={`chest-${lvl}`}
              className="absolute pointer-events-none z-15"
              style={{
                left: chestX,
                top: chestY,
              }}
            >
              <div className="flex flex-col items-center">
                <span className="text-2xl animate-bounce drop-shadow-md">🎁</span>
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 shadow-md border border-white/80">
                  Lv.{lvl}
                </span>
              </div>
            </div>
          );
        })}

        {/* World Gateway Landmark Archways (世界入口大拱門與專屬機制牌 - 包含第1世界與所有世界) */}
        {WORLDS.map((w) => {
          let archY: number;
          if (w.id === 1) {
            // World 1 Entrance Archway Banner (placed below Level 1)
            archY = getMapNodeY(1) + 74;
          } else {
            // World 2-10 Gateway Banners (cleanly centered in the extra transition gap between worlds)
            const yPrev = getMapNodeY(w.startLevel - 1);
            const yNext = getMapNodeY(w.startLevel);
            archY = (yPrev + yNext) / 2;
          }

          return (
            <div
              key={`world-gateway-${w.id}`}
              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-15 pointer-events-none w-[340px] flex flex-col items-center"
              style={{ top: archY }}
            >
              <div
                className="w-full px-3 py-1.5 rounded-2xl bg-gradient-to-r from-slate-950/95 via-slate-900/95 to-slate-950/95 shadow-2xl flex items-center justify-between backdrop-blur-md"
                style={{
                  border: `1.5px solid ${w.accentColor || '#fbbf24'}88`,
                  boxShadow: `0 8px 24px -4px ${w.accentColor || '#fbbf24'}33`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl drop-shadow-sm">{w.icon}</span>
                  <div className="flex flex-col">
                    <span
                      className="text-[11px] font-black tracking-wide"
                      style={{ color: w.accentColor || '#fde047' }}
                    >
                      {w.name[language] || (language === 'zh-CN' ? toSimplifiedChinese(w.name['zh-HK']) : w.name['zh-HK'])}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-400">
                      {w.gimmickName[language] || (language === 'zh-CN' ? toSimplifiedChinese(w.gimmickName['zh-HK']) : w.gimmickName['zh-HK'])}
                    </span>
                  </div>
                </div>
                <span
                  className="text-[9px] font-black px-2 py-0.5 rounded-full border shadow-sm font-mono"
                  style={{
                    backgroundColor: `${w.accentColor || '#fbbf24'}25`,
                    color: w.accentColor || '#fde047',
                    borderColor: `${w.accentColor || '#fbbf24'}60`,
                  }}
                >
                  Lv.{w.startLevel}-{w.endLevel}
                </span>
              </div>
            </div>
          );
        })}

        {/* Layer 8: SVG COBBLESTONE PEBBLE ROAD (鵝卵石小路) */}
        <svg
          className="absolute inset-0 pointer-events-none z-0"
          width={MAP_CANVAS_WIDTH}
          height={MAP_CANVAS_HEIGHT}
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Road earth shadow */}
            <filter id="road-drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0c220a" floodOpacity="0.7" />
            </filter>
          </defs>

          {/* 1. Road Ground Shadow Trench */}
          <path
            d={svgPathData}
            stroke="#132c0f"
            strokeWidth="42"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.65"
          />

          {/* 2. Sandy / Earth Outer Border of the Pebble Trail */}
          <path
            d={svgPathData}
            stroke="#caa269"
            strokeWidth="36"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 3. Darker sand inner trench */}
          <path
            d={svgPathData}
            stroke="#ab7d49"
            strokeWidth="30"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 4. Colorful Rounded River Pebbles (鵝卵石) Stepping-Stones Texture */}
          {/* Subtle darker pebble shadow trail */}
          <path
            d={svgPathData}
            stroke="#54381e"
            strokeWidth="20"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="9 16"
            opacity="0.45"
          />
          {/* Pastel Sky Blue & Turquoise river stones */}
          <path
            d={svgPathData}
            stroke="#7dd3fc"
            strokeWidth="16"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="8 17"
            strokeDashoffset="2"
            opacity="0.9"
          />
          {/* Warm Sand & Sunlit Rose accent stones */}
          <path
            d={svgPathData}
            stroke="#fde047"
            strokeWidth="11"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="6 26"
            strokeDashoffset="10"
            opacity="0.8"
          />
          {/* Gentle specular pebble highlights */}
          <path
            d={svgPathData}
            stroke="#f0f9ff"
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="5 19"
            strokeDashoffset="3"
            opacity="0.75"
          />
        </svg>

        {/* 200 LEVEL NODES (Exact cartoon snake buttons from user's image) */}
        {LEVEL_MISSIONS.map((level) => {
          const pos = posMap.get(level.id);
          if (!pos) return null;

          const isCompleted = completedLevels.includes(level.id);
          const isCurrent = level.id === activeLevel;
          const isUnlocked = unlockAllLevels || isCompleted || level.id <= effectiveUnlocked;

          return (
            <div
              key={`node-wrapper-${level.id}`}
              ref={isCurrent ? currentNodeRef : null}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
              style={{
                left: pos.x,
                top: pos.y,
              }}
            >
              {/* Cute Animated Snake Mascot Sitting on Current Active Level */}
              {isCurrent && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-30 animate-bounce">
                  <CuteMonsterSnakeArt size={40} variant="mikey" mood="happy" />
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-[9px] shadow-md border border-white/80 -mt-1 tracking-wider">
                    YOU
                  </span>
                </div>
              )}

              {/* Cartoon Snake Node */}
              <SnakeMapNode
                level={level}
                isUnlocked={isUnlocked}
                isCompleted={isCompleted}
                isCurrent={isCurrent}
                onClick={() => onNodeClick(level)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
