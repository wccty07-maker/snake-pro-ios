import React, { useRef, useEffect, useLayoutEffect, useState, useMemo, useCallback } from 'react';
import { GameMode, PlayerProfile, LevelMission } from '../types';
import { soundEngine } from '../utils/audio';
import { LEVEL_MISSIONS, getWorldByLevelId } from '../utils/levelsData';
import { SupportedLanguage, getTranslation, toSimplifiedChinese } from '../utils/i18n';
import { getSanitizedHighScore } from '../utils/scoreIsolation';
import { CuteMonsterSnakeArt } from './CuteMonsterSnakeArt';
import { SnakeMapNode } from './SnakeMapNode';
import {
  Play,
  Map,
  Sparkles,
  Clock,
  Lock,
  Star,
  Maximize2,
} from 'lucide-react';

interface HomeScreenProps {
  profile: PlayerProfile;
  currentLevelId?: number;
  nextRefillSeconds: number;
  onStartMode: (mode: GameMode, specificLevel?: LevelMission) => void;
  onOpenHearts?: () => void;
  onOpenHeartsModal?: () => void;
  onOpenLevelSelect?: () => void;
  onOpenMobileGuide?: () => void;
  onOpenTutorial?: () => void;
  onOpenSettings?: () => void;
  onOpenPrivacyPolicy?: () => void;
  onOpenTermsOfService?: () => void;
}

const LEVEL_STEP_X = 64;
const MAP_TOTAL_WIDTH = LEVEL_MISSIONS.length * LEVEL_STEP_X + 100;

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  currentLevelId,
  onStartMode,
  onOpenHearts,
  onOpenHeartsModal,
  onOpenLevelSelect,
  onOpenMobileGuide,
  onOpenPrivacyPolicy,
  onOpenTermsOfService,
}) => {
  const lang: SupportedLanguage = profile.language || 'zh-HK';
  const isEn = lang === 'en';
  const isJa = lang === 'ja';

  // Active level: tracks the level the player is currently challenging (e.g. Lv 1)
  const activeLevelId = useMemo(() => {
    const rawTarget = currentLevelId || profile.lastSelectedLevel || profile.unlockedLevel || 1;
    return profile.unlockAllLevels ? rawTarget : Math.min(rawTarget, profile.unlockedLevel || 1);
  }, [currentLevelId, profile.lastSelectedLevel, profile.unlockedLevel, profile.unlockAllLevels]);

  const currentWorld = useMemo(
    () => getWorldByLevelId(activeLevelId),
    [activeLevelId]
  );
  const adventureSlogan = isEn
    ? "Let's Go On An Adventure · Explore the Fantasy Realm!"
    : isJa
    ? "一緒に出発大冒険 · 奇幻の世界を冒険！"
    : lang === 'zh-CN'
    ? "一起出发大冒险 · 探索奇幻世界！"
    : "一齊出發大冒險 · 探索奇幻世界！";

  const isOutOfHearts = profile.hearts <= 0;
  const completedList = profile.completedLevels || [];

  const handleOpenHeartsModal = onOpenHearts || onOpenHeartsModal || (() => {});

  const [lockToast, setLockToast] = useState<string | null>(null);
  const mapScrollRef = useRef<HTMLDivElement | null>(null);

  // Mount timestamp to reject ghost click / touch bleed-through when returning from modals
  const mountTimeRef = useRef<number>(Date.now());
  useEffect(() => {
    mountTimeRef.current = Date.now();
  }, []);

  // Compute (x, y) coordinates along undulating horizontal candy curve
  const levelPositions = useMemo(() => {
    return LEVEL_MISSIONS.map((lvl) => {
      const idx = lvl.id - 1;
      const x = 44 + idx * LEVEL_STEP_X;
      const y = 68 + Math.sin(idx * 0.72) * 20;
      return { id: lvl.id, x, y };
    });
  }, []);

  // Compute smooth Catmull-Rom SVG path for ribbon candy road
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

  // Center on current active level (e.g. Stage 379)
  const scrollToCurrentLevel = useCallback((smooth = false) => {
    if (!mapScrollRef.current) return;
    const currentPos = levelPositions[Math.max(0, activeLevelId - 1)];
    if (!currentPos) return;
    const containerWidth = mapScrollRef.current.clientWidth || 360;
    const targetScroll = Math.max(0, currentPos.x - containerWidth / 2);
    if (smooth) {
      mapScrollRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
    } else {
      mapScrollRef.current.scrollLeft = targetScroll;
    }
  }, [levelPositions, activeLevelId]);

  // Directly position to current level immediately on mount / level change (zero scrolling from level 1)
  useLayoutEffect(() => {
    scrollToCurrentLevel(false);
    // Double-check on next frame once flex container geometry is resolved
    const rafId = requestAnimationFrame(() => {
      scrollToCurrentLevel(false);
    });
    return () => cancelAnimationFrame(rafId);
  }, [scrollToCurrentLevel]);

  // Keep centered on window resize
  useEffect(() => {
    const handleResize = () => {
      scrollToCurrentLevel(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [scrollToCurrentLevel]);

  // Lock message helper
  const showLockHint = (lvlId: number) => {
    soundEngine.playTurn();
    const msg =
      lang === 'en'
        ? `🔒 Stage ${lvlId} is locked! Clear Stage ${profile.unlockedLevel} first.`
        : lang === 'ja'
        ? `🔒 ステージ ${lvlId} はロックされています！まずステージ ${profile.unlockedLevel} をクリアしてください！`
        : lang === 'zh-CN'
        ? `🔒 第 ${lvlId} 关已锁定！请先通关前面的第 ${profile.unlockedLevel} 关！`
        : `🔒 第 ${lvlId} 關已鎖定！請先通關前面的第 ${profile.unlockedLevel} 關！`;
    setLockToast(msg);
    setTimeout(() => {
      setLockToast((prev) => (prev === msg ? null : prev));
    }, 2200);
  };

  // Node click handler
  const handleNodeClick = (level: LevelMission, e: React.MouseEvent) => {
    e.stopPropagation();
    // Guard against ghost clicks or touch event bleed-through right after modal closing
    if (Date.now() - mountTimeRef.current < 450) {
      return;
    }
    const isCompleted = completedList.includes(level.id);
    const isUnlocked = profile.unlockAllLevels || isCompleted || level.id <= (profile.unlockedLevel || 1);

    if (!isUnlocked) {
      showLockHint(level.id);
      return;
    }

    soundEngine.playClick();
    if (isOutOfHearts) {
      handleOpenHeartsModal();
      return;
    }
    onStartMode('LEVELS', level);
  };

  const handleCardClick = (mode: GameMode) => {
    // Guard against ghost clicks or touch event bleed-through right after modal closing
    if (Date.now() - mountTimeRef.current < 450) {
      return;
    }
    soundEngine.playClick();
    if (isOutOfHearts) {
      handleOpenHeartsModal();
      return;
    }
    if (mode === 'LEVELS') {
      const targetLvl = LEVEL_MISSIONS.find((l) => l.id === activeLevelId) || LEVEL_MISSIONS[0];
      onStartMode('LEVELS', targetLvl);
    } else {
      onStartMode(mode);
    }
  };

  return (
    <div className="w-full h-full max-w-[480px] mx-auto px-2.5 sm:px-3 pt-1 pb-[max(env(safe-area-inset-bottom),0.75rem)] flex flex-col justify-between text-slate-100 select-none animate-fade-in flex-1 min-h-0">
      {/* 3大遊戲模式卡片：自適應大小，填滿手機螢幕垂直空間 */}
      <div className="w-full flex-1 min-h-0 flex flex-col gap-2 sm:gap-2.5 py-0.5 justify-between">
        {/* ==================== 1. 任務闖關 (LEVELS) Card with EMBEDDED MAP ==================== */}
        <div
          role="region"
          aria-label="任務闖關與冒險地圖"
          className="w-full flex-[1.6] sm:flex-[1.8] min-h-[185px] p-2.5 sm:p-3 rounded-2xl border-2 text-left shadow-xl relative overflow-hidden flex flex-col justify-between transition-all border-emerald-400/80 bg-gradient-to-br from-[#064e3b]/95 via-[#022c22]/90 to-[#0c1a0a]/95 shadow-emerald-950/50"
        >
          {/* Subtle shimmer top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 opacity-90 z-20 pointer-events-none" />

          {/* Top Header Row of LEVELS Card */}
          <div className="flex items-center justify-between gap-1.5 shrink-0 z-10">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 border border-emerald-300/40 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/40">
                <Map className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                    {getTranslation('startMissionMode', lang)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundEngine.playClick();
                      scrollToCurrentLevel(true);
                    }}
                    className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-emerald-500/35 hover:bg-emerald-500/50 border border-emerald-400/60 text-emerald-200 shrink-0 cursor-pointer transition-all active:scale-95"
                    title={isEn ? 'Jump to current level' : isJa ? '現在のステージへ移動' : lang === 'zh-CN' ? '回到当前关卡' : '回到當前關卡'}
                  >
                    {getTranslation('stageTitle', lang).replace('{n}', String(activeLevelId))}
                  </button>
                  <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-full bg-slate-900/80 border border-amber-400/50 text-amber-300 shrink-0 flex items-center gap-1">
                    <span>{currentWorld.icon}</span>
                    <span className="truncate max-w-[85px] sm:max-w-none">{currentWorld.name[lang] || (lang === 'zh-CN' ? toSimplifiedChinese(currentWorld.name['zh-HK']) : currentWorld.name['zh-HK'])}</span>
                  </span>
                  {profile.unlockAllLevels && (
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-amber-400/25 border border-amber-400/50 text-amber-300 shrink-0">
                      {getTranslation('testModeUnlockedBadge', lang)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Quick Actions: Open 200-Level Full Map, and Play */}
            <div className="flex items-center gap-1.5 shrink-0">
              {onOpenLevelSelect && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundEngine.playClick();
                    onOpenLevelSelect();
                  }}
                  className="px-2 py-1 rounded-lg bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-400/50 text-emerald-200 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all shadow-sm cursor-pointer"
                  title={getTranslation('fullMapTitle', lang)}
                >
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{getTranslation('fullMapBtn', lang)}</span>
                </button>
              )}

              {/* Play Action button */}
              <button
                type="button"
                onClick={() => handleCardClick('LEVELS')}
                className="flex items-center gap-1 px-3 py-1 rounded-xl font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer bg-gradient-to-b from-emerald-400 to-teal-600 text-slate-950 border border-emerald-300/50"
              >
                <Play className="w-3 h-3 fill-slate-950" />
                <span>{getTranslation('playNow', lang)}</span>
              </button>
            </div>
          </div>

          {/* ================= EMBEDDED ADVENTURE MAP VIEWPORT ================= */}
          <div className="relative w-full flex-1 min-h-[110px] sm:min-h-[125px] my-1 rounded-xl overflow-hidden border border-emerald-400/30 bg-gradient-to-b from-[#1b3d17] via-[#142911] to-[#0c1a0a] shadow-inner">
            {/* Lock toast popup */}
            {lockToast && (
              <div className="absolute top-2 inset-x-2 z-30 mx-auto max-w-xs px-2.5 py-1 rounded-lg bg-slate-950/95 border border-rose-500 text-rose-200 text-[11px] font-bold text-center animate-bounce-in shadow-xl backdrop-blur-md">
                {lockToast}
              </div>
            )}

            {/* Horizontal scrollable track with winding road and nodes, vertically centered */}
            <div
              ref={mapScrollRef}
              className="w-full h-full overflow-x-auto overflow-y-hidden relative no-scrollbar select-none cursor-grab active:cursor-grabbing touch-pan-x flex items-center"
            >
              <div
                className="relative shrink-0"
                style={{
                  width: MAP_TOTAL_WIDTH,
                  height: '136px',
                }}
              >
                {/* SVG Cobblestone Pebble Road matching map style */}
                <svg
                  className="absolute inset-0 pointer-events-none z-0"
                  width={MAP_TOTAL_WIDTH}
                  height="136"
                  style={{ overflow: 'visible' }}
                >
                  {/* Road Shadow */}
                  <path
                    d={svgPathData}
                    stroke="#0a1e0b"
                    strokeWidth="30"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.75"
                  />
                  {/* Sandy Outer Border */}
                  <path
                    d={svgPathData}
                    stroke="#caa269"
                    strokeWidth="26"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Inner Earth Path */}
                  <path
                    d={svgPathData}
                    stroke="#ab7d49"
                    strokeWidth="20"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Colorful Pebble dashed accents */}
                  <path
                    d={svgPathData}
                    stroke="#7dd3fc"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray="6 14"
                    strokeLinecap="round"
                  />
                  <path
                    d={svgPathData}
                    stroke="#f472b6"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray="6 14"
                    strokeDashoffset="7"
                    strokeLinecap="round"
                  />
                  <path
                    d={svgPathData}
                    stroke="#fde047"
                    strokeWidth="7"
                    fill="none"
                    strokeDasharray="5 15"
                    strokeDashoffset="12"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Level Nodes */}
                {LEVEL_MISSIONS.map((lvl) => {
                  const pos = levelPositions[lvl.id - 1];
                  if (!pos) return null;

                  const isCompleted = completedList.includes(lvl.id);
                  const isCurrent = lvl.id === activeLevelId;
                  const isUnlocked = profile.unlockAllLevels || isCompleted || isCurrent || lvl.id <= profile.unlockedLevel;

                  return (
                    <div
                      key={`home-map-node-${lvl.id}`}
                      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: pos.x,
                        top: pos.y,
                      }}
                    >
                      {/* Active Player Monster Avatar on Current Stage */}
                      {isCurrent && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-30 animate-bounce">
                          <div className="filter drop-shadow-[0_2px_6px_rgba(16,185,129,0.8)]">
                            <CuteMonsterSnakeArt
                              size={26}
                              variant={
                                profile.selectedSkin === 'neon_viper'
                                  ? 'neon_viper'
                                  : profile.selectedSkin === 'neon_aurora'
                                  ? 'neon_aurora'
                                  : profile.selectedSkin === 'sulley_furry'
                                  ? 'sulley'
                                  : profile.selectedSkin === 'night_fury'
                                  ? 'nightfury'
                                  : 'mikey'
                              }
                              mood="happy"
                            />
                          </div>
                          <span className="text-[8px] font-black px-1 rounded-full bg-amber-400 text-slate-950 leading-none shadow-sm -mt-0.5 border border-white/60">
                            YOU
                          </span>
                        </div>
                      )}

                      {/* Cartoon Snake Node */}
                      <SnakeMapNode
                        level={lvl}
                        isUnlocked={isUnlocked}
                        isCompleted={isCompleted}
                        isCurrent={isCurrent}
                        size={40}
                        onClick={() => {
                          if (!isUnlocked && !isCompleted) {
                            showLockHint(lvl.id);
                            return;
                          }
                          soundEngine.playClick();
                          if (isOutOfHearts) {
                            handleOpenHeartsModal();
                            return;
                          }
                          onStartMode('LEVELS', lvl);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Left and right map gradient shadows indicating scrollability */}
            <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-[#0c1a0a]/80 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-[#0c1a0a]/80 to-transparent pointer-events-none" />
          </div>

          {/* Bottom info of LEVELS card: World & Gimmick Info */}
          <div className="shrink-0 flex items-center justify-between text-[10px] sm:text-[11px] text-emerald-200/90 font-semibold px-0.5 pt-0.5">
            <div className="truncate flex items-center gap-1.5 min-w-0">
              <span className="shrink-0 text-amber-300">{currentWorld.icon}</span>
              <span className="truncate font-bold text-amber-200">
                {currentWorld.name[lang] || (lang === 'zh-CN' ? toSimplifiedChinese(currentWorld.name['zh-HK']) : currentWorld.name['zh-HK'])}
              </span>
              <span className="text-emerald-500/70 font-bold">·</span>
              <span className="truncate text-emerald-300 font-medium">
                {currentWorld.gimmickName[lang] || (lang === 'zh-CN' ? toSimplifiedChinese(currentWorld.gimmickName['zh-HK']) : currentWorld.gimmickName['zh-HK'])}
              </span>
            </div>
            <span className="text-[9.5px] text-emerald-400/90 font-mono font-bold shrink-0 ml-1.5 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30">
              Lv.{currentWorld.startLevel}-{currentWorld.endLevel}
            </span>
          </div>
        </div>

        {/* ==================== 2. 經典無限 (CLASSIC) Card ==================== */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleCardClick('CLASSIC')}
          className="w-full flex-1 min-h-[92px] sm:min-h-[100px] p-2.5 sm:p-3 rounded-2xl border-2 text-left transition-all active:scale-[0.99] cursor-pointer group flex flex-col justify-between shadow-xl relative overflow-hidden border-sky-400/70 bg-gradient-to-br from-[#0c2340]/95 via-[#101f38]/90 to-[#0e1628]/95 hover:border-sky-300 shadow-sky-950/40 hover:shadow-sky-900/40"
        >
          {/* Top shimmer accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-blue-300 to-indigo-300 opacity-90" />

          {/* Top header row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 border border-sky-300/40 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-sky-500/40">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                    {getTranslation('startClassicMode', lang)}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-sky-500/30 border border-sky-400/50 text-sky-200 shrink-0">
                    {getTranslation('classicEndlessTag', lang)}
                  </span>
                </div>
              </div>
            </div>

            {/* High score box */}
            <div className="text-right shrink-0 bg-sky-950/60 border border-sky-500/30 px-2 py-0.5 rounded-xl">
              <div className="text-[9px] font-bold text-sky-300/80 leading-tight">
                {getTranslation('highScore', lang)}
              </div>
              <div className="text-xs font-mono font-black text-sky-200 leading-tight">
                {getSanitizedHighScore(profile, 'CLASSIC')}
              </div>
            </div>
          </div>

          {/* Middle info */}
          <div className="text-[11px] sm:text-xs text-sky-200/90 font-medium truncate my-0.5">
            {getTranslation('classicDesc', lang)}
          </div>

          {/* Bottom row: Feature tag & Play pill */}
          <div className="pt-1 border-t border-sky-500/20 flex items-center justify-between gap-1">
            <span className="text-[10px] text-sky-300/80 font-bold flex items-center gap-1 truncate">
              <span>⭐</span>
              <span className="truncate">{getTranslation('classicEndlessDescTag', lang)}</span>
            </span>
            <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-sky-400 to-blue-600 text-slate-950 font-black text-xs shadow-md">
              <Play className="w-3 h-3 fill-slate-950" />
              <span>{getTranslation('playNow', lang)}</span>
            </div>
          </div>
        </div>

        {/* ==================== 3. 極速計時 (TIME_ATTACK) Card ==================== */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleCardClick('TIME_ATTACK')}
          className="w-full flex-1 min-h-[92px] sm:min-h-[100px] p-2.5 sm:p-3 rounded-2xl border-2 text-left transition-all active:scale-[0.99] cursor-pointer group flex flex-col justify-between shadow-xl relative overflow-hidden border-amber-400/70 bg-gradient-to-br from-[#3b1f06]/95 via-[#2a1708]/90 to-[#1c0f05]/95 hover:border-amber-300 shadow-amber-950/40 hover:shadow-amber-900/40"
        >
          {/* Top shimmer accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-300 to-red-400 opacity-90" />

          {/* Top header row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 border border-amber-300/40 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-amber-500/40">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                    {getTranslation('startTimeAttack', lang)}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/30 border border-amber-400/50 text-amber-200 shrink-0">
                    {getTranslation('speedRushTag', lang)}
                  </span>
                </div>
              </div>
            </div>

            {/* High score box */}
            <div className="text-right shrink-0 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-xl">
              <div className="text-[9px] font-bold text-amber-300/80 leading-tight">
                {getTranslation('highScore', lang)}
              </div>
              <div className="text-xs font-mono font-black text-amber-200 leading-tight">
                {getSanitizedHighScore(profile, 'TIME_ATTACK')}
              </div>
            </div>
          </div>

          {/* Middle info */}
          <div className="text-[11px] sm:text-xs text-amber-200/90 font-medium truncate my-0.5">
            {getTranslation('timeAttackDesc', lang)}
          </div>

          {/* Bottom row: Feature tag & Play pill */}
          <div className="pt-1 border-t border-amber-500/20 flex items-center justify-between gap-1">
            <span className="text-[10px] text-amber-300/80 font-bold flex items-center gap-1 truncate">
              <span>⚡</span>
              <span className="truncate">{getTranslation('speedRushDescTag', lang)}</span>
            </span>
            <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-xs shadow-md">
              <Play className="w-3 h-3 fill-slate-950" />
              <span>{getTranslation('playNow', lang)}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
