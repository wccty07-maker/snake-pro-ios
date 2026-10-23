import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import {
  X,
  Play,
  MapPin,
  Compass,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { LEVEL_MISSIONS, getLocalizedLevel, getWorldByLevelId } from '../utils/levelsData';
import { LevelMission } from '../types';
import { soundEngine } from '../utils/audio';
import { SupportedLanguage } from '../utils/i18n';
import { SnakeAdventureMap, getMapNodeY } from './SnakeAdventureMap';
import { CoinIcon } from './CoinIcon';
import { RedAppleIcon } from './RedAppleIcon';
import { BlueAppleIcon } from './BlueAppleIcon';
import { GreenAppleIcon } from './GreenAppleIcon';
import { GoldenAppleIcon } from './GoldenAppleIcon';

interface LevelSelectModalProps {
  isOpen: boolean;
  unlockedLevel: number;
  currentLevelId?: number;
  completedLevels: number[];
  levelHighScores?: Record<number, number>;
  unlockAllLevels?: boolean;
  onToggleUnlockAll?: () => void;
  onRestoreProgression?: () => void;
  language?: SupportedLanguage;
  onClose: () => void;
  onSelectLevel: (level: LevelMission) => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  isOpen,
  unlockedLevel,
  currentLevelId,
  completedLevels,
  levelHighScores = {},
  unlockAllLevels = false,
  onToggleUnlockAll,
  onRestoreProgression,
  language = 'zh-HK',
  onClose,
  onSelectLevel,
}) => {
  const effectiveUnlocked = unlockedLevel || 1;
  const activeTargetLevel = unlockAllLevels
    ? (currentLevelId || effectiveUnlocked)
    : Math.min(currentLevelId || effectiveUnlocked, effectiveUnlocked);
  const [previewLevel, setPreviewLevel] = useState<LevelMission | null>(null);
  const [lockToast, setLockToast] = useState<string | null>(null);

  const mapScrollRef = useRef<HTMLDivElement | null>(null);
  const currentNodeRef = useRef<HTMLDivElement | null>(null);
  const openTimeRef = useRef<number>(Date.now());

  // Guarantee previewLevel is cleanly cleared whenever isOpen changes, and record open timestamp to block touch ghost clicks
  useLayoutEffect(() => {
    if (isOpen) {
      openTimeRef.current = Date.now();
      setPreviewLevel(null);
    } else {
      setPreviewLevel(null);
    }
  }, [isOpen]);

  // Directly position to player's current active level immediately on open (no scroll from Lv 200 or Lv 1)
  useLayoutEffect(() => {
    if (isOpen && mapScrollRef.current) {
      const targetY = getMapNodeY(activeTargetLevel);
      const containerH =
        mapScrollRef.current.clientHeight ||
        (typeof window !== 'undefined' ? window.innerHeight - 100 : 650);
      mapScrollRef.current.scrollTop = Math.max(0, targetY - containerH / 2);

      const rafId = requestAnimationFrame(() => {
        if (mapScrollRef.current) {
          const h =
            mapScrollRef.current.clientHeight ||
            (typeof window !== 'undefined' ? window.innerHeight - 100 : 650);
          mapScrollRef.current.scrollTop = Math.max(0, targetY - h / 2);
        }
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [isOpen, activeTargetLevel]);

  // Jump smoothly to current active level
  const handleJumpToCurrentLevel = () => {
    soundEngine.playClick();
    if (mapScrollRef.current) {
      const targetY = getMapNodeY(activeTargetLevel);
      const containerH =
        mapScrollRef.current.clientHeight ||
        (typeof window !== 'undefined' ? window.innerHeight - 100 : 650);
      mapScrollRef.current.scrollTo({
        top: Math.max(0, targetY - containerH / 2),
        behavior: 'smooth',
      });
    }
  };

  // Show lock hint toast
  const showLockNotice = (levelNum: number) => {
    soundEngine.playTurn();
    const msg =
      language === 'en'
        ? `🔒 Stage ${levelNum} is locked! Clear Stage ${unlockedLevel} first.`
        : language === 'ja'
        ? `🔒 ステージ ${levelNum} はロック中！先にステージ ${unlockedLevel} をクリアしよう！`
        : language === 'zh-CN'
        ? `🔒 第 ${levelNum} 关已锁定！请先完成前面的第 ${unlockedLevel} 关！`
        : `🔒 第 ${levelNum} 關已鎖定！請先完成前面的第 ${unlockedLevel} 關！`;
    setLockToast(msg);
    setTimeout(() => {
      setLockToast(null);
    }, 2800);
  };

  // Handle clicking on a level node
  const handleNodeClick = (level: LevelMission) => {
    // Ignore synthetic ghost clicks from touch event bleed-through within 500ms of modal opening
    if (Date.now() - openTimeRef.current < 500) {
      return;
    }

    const isCompleted = completedLevels.includes(level.id);
    const isUnlocked = unlockAllLevels || isCompleted || level.id <= effectiveUnlocked;

    if (!isUnlocked) {
      // Locked: player can only see the number, cannot enter!
      showLockNotice(level.id);
      return;
    }

    soundEngine.playClick();
    setPreviewLevel(level);
  };

  // Start selected level from preview dialog
  const handleStartLevel = (level: LevelMission) => {
    soundEngine.playClick();
    setPreviewLevel(null);
    onSelectLevel(level);
  };

  const handleCloseModal = () => {
    soundEngine.playClick();
    setPreviewLevel(null);
    onClose();
  };

  if (!isOpen) return null;

  const headerTitle =
    language === 'en'
      ? 'Adventure Level Map'
      : language === 'ja'
      ? '冒険ステージマップ'
      : language === 'zh-CN'
      ? '冒险关卡地图'
      : '冒險關卡地圖';

  const jumpToCurrentLabel =
    language === 'en'
      ? 'My Progress'
      : language === 'ja'
      ? '現在地へ'
      : language === 'zh-CN'
      ? '回到我的进度'
      : '回到我的進度';

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-2 sm:p-4 pt-[calc(max(env(safe-area-inset-top),0.5rem)+2.85rem)] pb-[max(env(safe-area-inset-bottom),0.5rem)] bg-slate-950/80 backdrop-blur-md animate-fade-in select-none overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
           handleCloseModal();
        }
      }}
    >
      <div className="w-full max-w-lg h-full rounded-2xl sm:rounded-3xl flex flex-col text-slate-100 shadow-2xl overflow-hidden bg-gradient-to-b from-[#1b3d17] via-[#142911] to-[#0c1a0a] border border-emerald-500/30 relative">
        {/* Map Header Bar - Sits comfortably below top unified navigation bar */}
        <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-emerald-500/25 flex items-center justify-between shrink-0 bg-slate-950/85 backdrop-blur-md z-20 gap-2 shadow-sm">
          {/* Left: Compass & Map Title + Progress */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 border border-emerald-300/40 text-white flex items-center justify-center text-sm shrink-0 shadow-sm">
              <Compass className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-black text-white tracking-wide truncate leading-tight">
                {headerTitle}
              </h2>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold truncate mt-0.5">
                <span className="text-emerald-300">
                  📍 {language === 'en' ? `Stage ${activeTargetLevel}` : language === 'ja' ? `ステージ ${activeTargetLevel}` : language === 'zh-CN' ? `第 ${activeTargetLevel} 关` : `第 ${activeTargetLevel} 關`}
                </span>
                {unlockAllLevels && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-400/25 text-amber-300 border border-amber-400/40 text-[9px] font-bold">
                    {language === 'en' ? 'All 200 Unlocked' : language === 'ja' ? '全200解放済' : language === 'zh-CN' ? '全200关已解锁' : '全200關已解鎖'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Quick Jump + Close Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handleJumpToCurrentLevel}
              className="h-7 sm:h-8 px-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm shrink-0"
              title={language === 'en' ? 'Jump to current level' : language === 'ja' ? '現在のステージへ移動' : language === 'zh-CN' ? '定位到我的当前关卡' : '定位到我的當前關卡'}
            >
              <MapPin className="w-3.5 h-3.5 fill-emerald-300 text-emerald-300 shrink-0" />
              <span className="hidden xs:inline text-xs">{jumpToCurrentLabel}</span>
            </button>

            <button
              type="button"
              onClick={handleCloseModal}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md border border-slate-700/80 shrink-0"
              aria-label="Close"
              title={language === 'en' ? 'Close map' : language === 'ja' ? 'マップを閉じる' : language === 'zh-CN' ? '关闭地图' : '關閉地圖'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Test Mode Quick Status & Revert Banner (Only shown if testing mode is active) */}
        {unlockAllLevels && (
          <div className="px-3 py-1.5 bg-gradient-to-r from-amber-950/80 via-yellow-950/70 to-emerald-950/80 border-b border-amber-500/30 flex items-center justify-between text-[11px] shrink-0 z-20 shadow-sm">
            <div className="flex items-center gap-1.5 text-amber-200 font-bold truncate">
              <span className="text-xs">🧪</span>
              <span className="truncate">
                {language === 'en'
                  ? 'Test Mode: All stages unlocked for testing'
                  : language === 'ja'
                  ? '試遊モード：全ステージを試遊中'
                  : language === 'zh-CN'
                  ? '试玩测试中：全关卡已解锁供试玩'
                  : '試玩測試中：全關卡已解鎖供試玩'}
              </span>
            </div>
            {onRestoreProgression && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onRestoreProgression();
                }}
                className="px-2 py-0.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] shrink-0 shadow transition-all active:scale-95 ml-2 cursor-pointer"
                title={
                  language === 'en'
                    ? 'Restore normal sequential progression rules'
                    : language === 'ja'
                    ? '通常ルールに戻す（前ステージクリアで次が解放）'
                    : language === 'zh-CN'
                    ? '还原为先通关前面关卡才能开启后面的关'
                    : '還原為先通關前面關卡才能開啟後面的關'
                }
              >
                {language === 'en' ? 'Restore Normal' : language === 'ja' ? '通常に戻す' : language === 'zh-CN' ? '还原正常规则' : '還原正常規則'}
              </button>
            )}
          </div>
        )}

        {/* Lock Toast Notification */}
        {lockToast && (
          <div className="absolute top-16 inset-x-4 z-40 mx-auto max-w-sm p-3 rounded-2xl bg-slate-900/95 border border-rose-500/80 shadow-2xl text-rose-200 text-xs font-bold text-center animate-bounce-in flex items-center justify-center gap-2 backdrop-blur-md">
            <span>{lockToast}</span>
          </div>
        )}

        {/* ===================== SNAKE ADVENTURE MAP ===================== */}
        <SnakeAdventureMap
          unlockedLevel={unlockedLevel}
          currentLevelId={activeTargetLevel}
          completedLevels={completedLevels}
          unlockAllLevels={unlockAllLevels}
          language={language}
          mapScrollRef={mapScrollRef}
          currentNodeRef={currentNodeRef}
          onNodeClick={handleNodeClick}
        />

        {/* Level Preview / Mission Goal Dialog (When tapping an unlocked/completed level) */}
        {previewLevel && (() => {
          const locLevel = getLocalizedLevel(previewLevel, language);
          const isCompleted = completedLevels.includes(previewLevel.id);
          const isCurrent = previewLevel.id === activeTargetLevel;
          const isZh = language === 'zh-HK' || language === 'zh-CN';
          const levelHeading = language === 'zh-CN' ? `第 ${previewLevel.id} 关` : isZh ? `第 ${previewLevel.id} 關` : `Level ${previewLevel.id}`;
          const stageHighScore = levelHighScores[previewLevel.id] || 0;

          return (
            <div
              className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setPreviewLevel(null);
                }
              }}
            >
              <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-emerald-400/60 p-5 shadow-2xl text-slate-100 flex flex-col relative overflow-hidden animate-scale-up">
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setPreviewLevel(null)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95 shadow-md border border-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Header Tag */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  {/* World Badge */}
                  {(() => {
                    const world = getWorldByLevelId(previewLevel.id);
                    return (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-amber-300 flex items-center gap-1">
                        <span>{world.icon}</span>
                        <span>{world.name[language] || world.name['zh-HK']}</span>
                      </span>
                    );
                  })()}
                  {previewLevel.isBossLevel && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-red-500/30 to-amber-500/30 border border-amber-400 text-amber-300 animate-pulse flex items-center gap-1">
                      <span>👑</span>
                      <span>{language === 'en' ? 'BOSS BATTLE' : language === 'ja' ? 'ボス決戦' : language === 'zh-CN' ? 'BOSS 决战' : 'BOSS 決戰'}</span>
                    </span>
                  )}
                  {previewLevel.gimmick === 'PORTAL' && !previewLevel.isBossLevel && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300">
                      {language === 'en' ? '🌀 Portals' : language === 'ja' ? '🌀 ワープポータル' : language === 'zh-CN' ? '🌀 空间传送门' : '🌀 空間傳送門'}
                    </span>
                  )}
                  {previewLevel.gimmick === 'CHILI' && !previewLevel.isBossLevel && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-400/50 text-orange-300">
                      {language === 'en' ? '🌶️ Chili Boost' : language === 'ja' ? '🌶️ 激辛ブースト' : language === 'zh-CN' ? '🌶️ 烈焰狂飙' : '🌶️ 烈焰狂飆'}
                    </span>
                  )}
                  {previewLevel.gimmick === 'MAGNET' && !previewLevel.isBossLevel && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/50 text-sky-300">
                      {language === 'en' ? '🧲 Magnet Pearl' : language === 'ja' ? '🧲 磁石パール' : language === 'zh-CN' ? '🧲 磁石珍珠' : '🧲 磁石珍珠'}
                    </span>
                  )}
                  {previewLevel.gimmick === 'DRAGON_EGG' && !previewLevel.isBossLevel && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-300">
                      {language === 'en' ? '🥚 Dragon Egg' : language === 'ja' ? '🥚 ドラゴンエッグ' : language === 'zh-CN' ? '🥚 巨龙宝藏' : '🥚 巨龍寶藏'}
                    </span>
                  )}
                  {previewLevel.gimmick === 'BOMB' && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500/20 border border-red-400/50 text-red-300">
                      {language === 'en' ? '💣 Bomb Defusal' : language === 'ja' ? '💣 爆弾解除' : language === 'zh-CN' ? '💣 限时拆弹' : '💣 限時拆彈'}
                    </span>
                  )}
                  {previewLevel.gimmick === 'GHOST' && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/50 text-purple-300">
                      {language === 'en' ? '👻 Ghost Phase' : language === 'ja' ? '👻 ゴースト通過' : language === 'zh-CN' ? '👻 幽灵穿透' : '👻 幽靈穿透'}
                    </span>
                  )}
                  {previewLevel.gimmick === 'ICE' && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300">
                      {language === 'en' ? '❄️ Ice Slide' : language === 'ja' ? '❄️ 氷の滑走' : language === 'zh-CN' ? '❄️ 极速滑冰' : '❄️ 極速滑冰'}
                    </span>
                  )}
                  {previewLevel.gimmick === 'FOG' && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-500/30 border border-slate-400/50 text-slate-300">
                      {language === 'en' ? '🌫️ Night Fog' : language === 'ja' ? '🌫️ 夜の霧' : language === 'zh-CN' ? '🌫️ 夜间迷雾' : '🌫️ 夜間迷霧'}
                    </span>
                  )}
                  {previewLevel.gimmick === 'COLOR_SEQUENCE' && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/50 text-fuchsia-300">
                      {language === 'en' ? '🎯 Color Order' : language === 'ja' ? '🎯 順番採取' : language === 'zh-CN' ? '🎯 三色顺序' : '🎯 三色順序'}
                    </span>
                  )}
                  {previewLevel.gimmick === 'COLOR_GATE' && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300">
                      {language === 'en' ? '🚪 Color Gate' : language === 'ja' ? '🚪 カラーゲート' : language === 'zh-CN' ? '🚪 色彩门禁' : '🚪 色彩門禁'}
                    </span>
                  )}
                  {previewLevel.gimmick === 'TURN_LIMIT' && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300">
                      {language === 'en' ? `🔄 Turns (${previewLevel.maxTurns})` : language === 'ja' ? `🔄 ターン制限 (${previewLevel.maxTurns}回)` : language === 'zh-CN' ? `🔄 限次转向 (${previewLevel.maxTurns}次)` : `🔄 限次轉向 (${previewLevel.maxTurns}次)`}
                    </span>
                  )}
                  {previewLevel.gimmick === 'REVERSE' && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/50 text-indigo-300">
                      {language === 'en' ? '⏪ Reverse Gear' : language === 'ja' ? '⏪ バックギア' : language === 'zh-CN' ? '⏪ 倒退逆转' : '⏪ 倒後逆轉'}
                    </span>
                  )}
                  {previewLevel.gimmick === 'KEY_LOCK' && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-400/50 text-yellow-300">
                      {language === 'en' ? '🗝️ Secret Key' : language === 'ja' ? '🗝️ 鍵と扉' : language === 'zh-CN' ? '🗝️ 秘库钥匙' : '🗝️ 秘庫鑰匙'}
                    </span>
                  )}
                  {previewLevel.timeLimit && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-300">
                      {language === 'en'
                        ? (previewLevel.id === 80 ? '⏳ Hold 60s' : `⏳ ${previewLevel.timeLimit}s Limit`)
                        : language === 'ja'
                        ? (previewLevel.id === 80 ? '⏳ 60秒耐える' : `⏳ ${previewLevel.timeLimit}秒制限`)
                        : language === 'zh-CN'
                        ? (previewLevel.id === 80 ? '⏳ 维持60秒(不加时)' : `⏳ ${previewLevel.timeLimit}s 限时`)
                        : (previewLevel.id === 80 ? '⏳ 維持60秒(不加時)' : `⏳ ${previewLevel.timeLimit}s 限時`)}
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/25 border border-blue-400/50 text-blue-300">
                      ✓ {language === 'en' ? 'Cleared' : language === 'ja' ? 'クリア済' : language === 'zh-CN' ? '已通关' : '已通關'}
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-400/25 border border-yellow-400/50 text-yellow-300 animate-pulse">
                      ⚡ {language === 'en' ? 'Current' : language === 'ja' ? '進行中' : language === 'zh-CN' ? '当前进度' : '當前進度'}
                    </span>
                  )}
                  {previewLevel.snakeSpeed && previewLevel.snakeSpeed !== 'NORMAL' && (
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                        previewLevel.snakeSpeed === 'TURBO' || previewLevel.snakeSpeed === 'EXTREME'
                          ? 'bg-rose-500/25 border-rose-400 text-rose-300 animate-pulse'
                          : previewLevel.snakeSpeed === 'VERY_FAST'
                          ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                          : 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                      }`}
                    >
                      <span>⚡</span>
                      <span>
                        {previewLevel.snakeSpeed === 'TURBO' || previewLevel.snakeSpeed === 'EXTREME'
                          ? (language === 'en' ? 'Turbo Speed' : language === 'ja' ? '爆速チャレンジ' : language === 'zh-CN' ? '狂暴飙速' : '狂暴飆速')
                          : previewLevel.snakeSpeed === 'VERY_FAST'
                          ? (language === 'en' ? 'Speed Rush' : language === 'ja' ? '極速スプリント' : language === 'zh-CN' ? '极速冲刺' : '極速衝刺')
                          : (language === 'en' ? 'Fast Pace' : language === 'ja' ? 'スピードUP' : language === 'zh-CN' ? '疾风速' : '疾風速')}
                      </span>
                    </span>
                  )}
                </div>

                {/* Level Title & Subtitle */}
                <h3 className="text-xl font-black text-white tracking-wide">
                  {levelHeading} · {locLevel.title}
                </h3>
                <p className="text-xs text-emerald-300/90 font-medium mt-0.5">
                  {locLevel.subtitle}
                </p>

                {/* Boss Encounter Highlight Banner */}
                {previewLevel.isBossLevel && (
                  <div className="mt-2.5 p-2.5 rounded-2xl bg-gradient-to-r from-red-950/80 via-amber-950/60 to-red-950/80 border border-amber-400/60 flex items-center gap-2.5 shadow-lg">
                    <span className="text-2xl animate-bounce">{previewLevel.bossAvatar || '👑'}</span>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                        {locLevel.bossTitle || (language === 'en' ? 'World Guardian Boss' : language === 'ja' ? 'ワールド守護ボス' : language === 'zh-CN' ? '世界守护领主' : '世界守護領主')}
                      </span>
                      <span className="text-xs font-black text-white">
                        {locLevel.bossName || locLevel.title}
                      </span>
                    </div>
                  </div>
                )}

                {/* Mission Targets List */}
                <div className="mt-3 p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {language === 'en' ? 'Goals' : language === 'ja' ? 'クリア目標' : language === 'zh-CN' ? '关卡目标' : '關卡目標'}
                  </span>
                  <div className="flex items-center flex-wrap gap-1.5">
                    {previewLevel.targets.normal !== undefined && (
                      <span className="px-2 py-0.5 rounded-lg bg-rose-950/60 border border-rose-700/60 text-xs font-mono font-bold text-rose-300 flex items-center gap-1">
                        <RedAppleIcon className="w-3.5 h-3.5" />
                        <span>{previewLevel.targets.normal}</span>
                      </span>
                    )}
                    {previewLevel.targets.blue !== undefined && (
                      <span className="px-2 py-0.5 rounded-lg bg-blue-950/60 border border-blue-700/60 text-xs font-mono font-bold text-blue-300 flex items-center gap-1">
                        <BlueAppleIcon className="w-3.5 h-3.5" />
                        <span>{previewLevel.targets.blue}</span>
                      </span>
                    )}
                    {previewLevel.targets.green !== undefined && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-700/60 text-xs font-mono font-bold text-emerald-300 flex items-center gap-1">
                        <GreenAppleIcon className="w-3.5 h-3.5" />
                        <span>{previewLevel.targets.green}</span>
                      </span>
                    )}
                    {previewLevel.targets.golden !== undefined && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-950/60 border border-amber-700/60 text-xs font-mono font-bold text-amber-300 flex items-center gap-1">
                        <GoldenAppleIcon className="w-3.5 h-3.5" />
                        <span>{previewLevel.targets.golden}</span>
                      </span>
                    )}
                    {previewLevel.targets.shield !== undefined && (
                      <span className="px-2 py-0.5 rounded-lg bg-sky-950/60 border border-sky-700/60 text-xs font-mono font-bold text-sky-300 flex items-center gap-1">
                        <span>🛡️</span>
                        <span>{previewLevel.targets.shield}</span>
                      </span>
                    )}
                    {previewLevel.targets.length !== undefined && (
                      <span className="px-2 py-0.5 rounded-lg bg-purple-950/60 border border-purple-700/60 text-xs font-mono font-bold text-purple-300 flex items-center gap-1">
                        <span>🐍</span>
                        <span>{previewLevel.targets.length}</span>
                      </span>
                    )}
                    {previewLevel.targets.portals !== undefined && (
                      <span className="px-2 py-0.5 rounded-lg bg-cyan-950/60 border border-cyan-700/60 text-xs font-mono font-bold text-cyan-300 flex items-center gap-1">
                        <span>🌀</span>
                        <span>{previewLevel.targets.portals}</span>
                      </span>
                    )}
                    {previewLevel.targets.chili !== undefined && (
                      <span className="px-2 py-0.5 rounded-lg bg-orange-950/60 border border-orange-700/60 text-xs font-mono font-bold text-orange-300 flex items-center gap-1">
                        <span>🌶️</span>
                        <span>{previewLevel.targets.chili}</span>
                      </span>
                    )}
                    {previewLevel.targets.magnet !== undefined && (
                      <span className="px-2 py-0.5 rounded-lg bg-sky-950/60 border border-sky-700/60 text-xs font-mono font-bold text-sky-300 flex items-center gap-1">
                        <span>🧲</span>
                        <span>{previewLevel.targets.magnet}</span>
                      </span>
                    )}
                    {previewLevel.targets.dragonEgg !== undefined && (
                      <span className="px-2 py-0.5 rounded-lg bg-rose-950/60 border border-rose-700/60 text-xs font-mono font-bold text-rose-300 flex items-center gap-1">
                        <span>🥚</span>
                        <span>{previewLevel.targets.dragonEgg}</span>
                      </span>
                    )}
                    {previewLevel.targets.rainbow !== undefined && (
                      <span className="px-2 py-0.5 rounded-lg bg-pink-950/60 border border-pink-700/60 text-xs font-mono font-bold text-pink-300 flex items-center gap-1">
                        <span>🍭</span>
                        <span>{previewLevel.targets.rainbow}</span>
                      </span>
                    )}
                    {previewLevel.targets.bombs !== undefined && (
                      <span className="px-2 py-0.5 rounded-lg bg-red-950/60 border border-red-700/60 text-xs font-mono font-bold text-red-300 flex items-center gap-1">
                        <span>💣</span>
                        <span>{previewLevel.targets.bombs}</span>
                      </span>
                    )}
                    {previewLevel.targets.colorSequenceCount !== undefined && (
                      <span className="px-2 py-0.5 rounded-lg bg-fuchsia-950/60 border border-fuchsia-700/60 text-xs font-mono font-bold text-fuchsia-300 flex items-center gap-1">
                        <span>🎯</span>
                        <span>{previewLevel.targets.colorSequenceCount} {language === 'en' ? 'sets' : language === 'ja' ? '組' : language === 'zh-CN' ? '组' : '組'}</span>
                      </span>
                    )}
                    {previewLevel.targets.keys !== undefined && (
                      <span className="px-2 py-0.5 rounded-lg bg-yellow-950/60 border border-yellow-700/60 text-xs font-mono font-bold text-yellow-300 flex items-center gap-1">
                        <span>🗝️</span>
                        <span>{previewLevel.targets.keys}</span>
                      </span>
                    )}
                    {previewLevel.targets.surviveSeconds !== undefined && (
                      <span className="px-2 py-0.5 rounded-lg bg-rose-950/60 border border-rose-700/60 text-xs font-mono font-bold text-rose-300 flex items-center gap-1">
                        <span>⏱️</span>
                        <span>
                          {language === 'en'
                            ? `Survive ${previewLevel.targets.surviveSeconds}s`
                            : language === 'ja'
                            ? `${previewLevel.targets.surviveSeconds}秒生存`
                            : language === 'zh-CN'
                            ? `维持生存 ${previewLevel.targets.surviveSeconds}秒`
                            : `維持生存 ${previewLevel.targets.surviveSeconds}秒`}
                        </span>
                      </span>
                    )}
                  </div>
                  {/* Reward Coins */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                    <span className="text-slate-400">
                      {language === 'en'
                        ? 'First Clear Reward'
                        : language === 'ja'
                        ? 'クリア報酬'
                        : language === 'zh-CN'
                        ? '通关奖励'
                        : '通關獎勵'}:
                    </span>
                    <span className="text-amber-300 font-black font-mono flex items-center gap-1">
                      <CoinIcon className="w-3.5 h-3.5" />
                      +{previewLevel.rewardCoins}
                    </span>
                  </div>
                </div>

                {/* Stage High Score Banner if completed/played */}
                {stageHighScore > 0 && (
                  <div className="mt-2.5 p-2 rounded-2xl bg-slate-950/70 border border-amber-400/35 flex items-center justify-between shadow-inner">
                    <div className="flex items-center gap-1.5 text-xs text-pink-200/90 font-bold">
                      <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>
                        {language === 'en'
                          ? 'Stage High Score'
                          : language === 'ja'
                          ? 'ステージ最高スコア'
                          : language === 'zh-CN'
                          ? '本关最高得分'
                          : '本關最高得分'}
                      </span>
                    </div>
                    <div className="text-amber-300 font-mono font-black text-sm">
                      {stageHighScore.toLocaleString()} <span className="text-xs text-pink-300/80 font-normal">{language === 'en' ? 'pts' : language === 'ja' ? '点' : '分'}</span>
                    </div>
                  </div>
                )}

                {/* Big Action Play Button */}
                <button
                  type="button"
                  onClick={() => handleStartLevel(previewLevel)}
                  className="mt-4 w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all border border-emerald-300/80"
                >
                  <Play className="w-5 h-5 fill-slate-950" />
                  <span>
                    {isCompleted
                      ? (language === 'en' ? 'Replay Level' : language === 'ja' ? 'ステージ再挑戦' : language === 'zh-CN' ? '重玩本关' : '重玩本關')
                      : (language === 'en' ? 'Play Now' : language === 'ja' ? '今すぐ挑戦' : language === 'zh-CN' ? '立即挑战' : '立即挑戰')}
                  </span>
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

