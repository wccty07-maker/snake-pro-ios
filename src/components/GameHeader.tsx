import React from 'react';
import { GameMode, LevelMission } from '../types';
import { soundEngine } from '../utils/audio';
import { formatCountdown } from '../utils/hearts';
import { SupportedLanguage, getTranslation } from '../utils/i18n';
import { CoinIcon } from './CoinIcon';
import { RedAppleIcon } from './RedAppleIcon';
import { BlueAppleIcon } from './BlueAppleIcon';
import { GreenAppleIcon } from './GreenAppleIcon';
import { GoldenAppleIcon } from './GoldenAppleIcon';
import {
  Settings,
  Flame,
  Clock,
  Home,
  Target,
  Check,
  Trophy,
  Heart,
} from 'lucide-react';

interface GameHeaderProps {
  score: number;
  highScore?: number;
  combo: number;
  coins: number;
  coinsEarned?: number;
  hearts: number;
  maxHearts: number;
  nextRefillSeconds: number;
  mode: GameMode;
  timeLeft: number;
  isPlaying: boolean;
  isPaused?: boolean;
  soundEnabled?: boolean;
  language?: SupportedLanguage;
  snakeLength?: number;
  currentLevel?: LevelMission;
  levelProgress?: {
    normal: number;
    blue: number;
    green: number;
    golden: number;
    shield: number;
    length: number;
    portals?: number;
    magnet?: number;
    chili?: number;
    dragonEgg?: number;
    rainbow?: number;
    surviveSeconds?: number;
    bombs?: number;
    colorSequenceCount?: number;
    keys?: number;
  };
  turnsLeft?: number;
  colorSequenceIndex?: number;
  snakeColor?: 'NORMAL' | 'RED' | 'BLUE' | 'GREEN';
  isModalOpen?: boolean;
  activeModal?: 'HEARTS' | 'SHOP' | 'REWARDS' | 'LEADERBOARD' | 'SETTINGS' | 'OTHER' | null;
  onTogglePause?: () => void;
  onToggleSound?: () => void;
  onOpenHearts: () => void;
  onOpenSettings: () => void;
  onOpenShop: () => void;
  onOpenAchievements?: () => void;
  onOpenLeaderboard?: () => void;
  onOpenMobileGuide: () => void;
  onGoHome?: () => void;
  onOpenLevelSelect?: () => void;
  onOpenDailyCheckIn?: () => void;
  onOpenRewards?: (tab?: 'CHECKIN' | 'DAILY_MISSIONS' | 'ACHIEVEMENTS') => void;
  hasRewardsNotification?: boolean;
  hasUnclaimedDailyReward?: boolean;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  score,
  highScore: _highScore,
  combo,
  coins,
  coinsEarned = 0,
  hearts,
  maxHearts,
  nextRefillSeconds,
  mode,
  timeLeft,
  isPlaying,
  isPaused,
  soundEnabled,
  language = 'zh-HK',
  snakeLength,
  currentLevel,
  levelProgress,
  turnsLeft,
  colorSequenceIndex = 0,
  snakeColor = 'NORMAL',
  isModalOpen = false,
  activeModal = null,
  onTogglePause,
  onToggleSound,
  onOpenHearts,
  onOpenSettings,
  onOpenShop,
  onOpenAchievements,
  onOpenLeaderboard,
  onOpenMobileGuide,
  onGoHome,
  onOpenLevelSelect,
  onOpenDailyCheckIn,
  onOpenRewards,
  hasRewardsNotification,
  hasUnclaimedDailyReward,
}) => {
  return (
    <header className="sticky top-0 z-50 shrink-0 w-full max-w-[430px] mx-auto px-2 sm:px-3 pt-[max(env(safe-area-inset-top),0.5rem)] pb-1 select-none pointer-events-none touch-none overscroll-none">
      {/* Top Utility Bar */}
      <div className="flex items-center justify-between gap-1 sm:gap-1.5 mb-1 pointer-events-auto overflow-hidden w-full">
        {/* Left Action Buttons: Hearts, Shop/Coins, Daily Check-in & Leaderboard - 永遠統一跟主頁一致 */}
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 shrink-0">
          {/* 1. 愛心生命 (Hearts) */}
          <button
            type="button"
            id="header-btn-hearts"
            onClick={() => {
              soundEngine.playClick();
              onOpenHearts();
            }}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 h-8 rounded-xl border transition-all shadow-md active:scale-95 shrink-0 cursor-pointer ${
              activeModal === 'HEARTS'
                ? 'ring-2 ring-rose-400 bg-rose-900/90 border-rose-300 text-rose-100 shadow-[0_0_12px_rgba(244,63,94,0.6)] scale-[1.03]'
                : 'bg-gradient-to-r from-rose-950/80 via-pink-900/60 to-purple-950/70 hover:from-rose-900/80 border-rose-400/60 text-rose-200 shadow-rose-950/40'
            }`}
            title={
              language === 'en'
                ? 'Hearts Energy: Tap to view or refill'
                : language === 'ja'
                ? 'ハート体力：確認・回復'
                : language === 'zh-CN'
                ? '爱心体力：点击查看或补充'
                : '愛心生命：點擊查看或補充'
            }
          >
            <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all fill-rose-500 text-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
            <span className="font-mono font-black text-xs text-white leading-none">
              {hearts}
            </span>
            {hearts < maxHearts && (
              <span className="font-mono text-[10px] font-bold text-rose-200 bg-rose-500/35 px-1 py-0.5 rounded border border-rose-400/40 leading-none">
                {formatCountdown(nextRefillSeconds)}
              </span>
            )}
          </button>

          {/* 2. 商店/金幣掣 (Shop / Coins) - 統一金幣圖案與數值，位置緊接愛心生命 */}
          <button
            type="button"
            id="header-btn-shop"
            onClick={() => {
              soundEngine.playClick();
              onOpenShop();
            }}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 h-8 rounded-xl border text-xs font-bold transition-all shadow-md shrink-0 active:scale-95 cursor-pointer ${
              activeModal === 'SHOP'
                ? 'ring-2 ring-amber-400 bg-amber-900/95 border-amber-300 text-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.6)] scale-[1.03]'
                : 'bg-gradient-to-r from-amber-950/80 to-yellow-900/60 hover:brightness-110 border-amber-400/60 text-amber-200'
            }`}
            title={getTranslation('shop', language)}
          >
            <CoinIcon className="w-3.5 h-3.5" />
            <span className="font-mono font-bold text-xs">{coins >= 100000 ? `${(coins / 1000).toFixed(0)}k` : coins}</span>
          </button>

          {/* 3. 每日目標與簽到獎勵掣 */}
          <button
            type="button"
            id="header-btn-rewards"
            onClick={() => {
              soundEngine.playClick();
              if (onOpenRewards) {
                onOpenRewards('DAILY_MISSIONS');
              } else if (onOpenDailyCheckIn) {
                onOpenDailyCheckIn();
              } else if (onOpenAchievements) {
                onOpenAchievements();
              }
            }}
            className={`relative w-8 h-8 rounded-xl border flex items-center justify-center transition-all shrink-0 active:scale-95 shadow-md shadow-amber-950/40 cursor-pointer ${
              activeModal === 'REWARDS'
                ? 'ring-2 ring-amber-400 bg-amber-900/95 border-amber-300 text-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.6)] scale-[1.03]'
                : 'bg-gradient-to-r from-amber-950/80 via-yellow-900/60 to-orange-950/70 border-amber-400/60 text-amber-300 hover:text-amber-200'
            }`}
            title={getTranslation('tabDailyMissions', language)}
            aria-label={getTranslation('tabDailyMissions', language)}
          >
            <Target className="w-4 h-4 text-amber-400" />
            {(hasRewardsNotification || hasUnclaimedDailyReward) && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-slate-950 animate-pulse" />
            )}
          </button>

          {/* 4. 排行榜掣 (Leaderboard) - 統一在獎勵掣右側 */}
          {onOpenLeaderboard && (
            <button
              type="button"
              id="header-btn-leaderboard"
              onClick={() => {
                soundEngine.playClick();
                onOpenLeaderboard();
              }}
              className={`w-8 h-8 rounded-xl border flex items-center justify-center font-bold text-xs shadow-md transition-all shrink-0 active:scale-95 cursor-pointer ${
                activeModal === 'LEADERBOARD'
                  ? 'ring-2 ring-amber-400 bg-amber-900/95 border-amber-300 text-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.6)] scale-[1.03]'
                  : 'bg-gradient-to-r from-amber-950/80 to-yellow-900/60 hover:brightness-110 border-amber-400/60 text-amber-200'
              }`}
              title={getTranslation('leaderboardBtn', language)}
              aria-label={getTranslation('leaderboardBtn', language)}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
            </button>
          )}
        </div>

        {/* Right Action Buttons: Home (when playing) & Settings */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* 主頁掣 (Home) - 玩遊戲時顯示在右側，只保留屋仔圖案 */}
          {isPlaying && onGoHome && (
            <button
              type="button"
              id="header-btn-home"
              onClick={() => {
                soundEngine.playClick();
                onGoHome();
              }}
              className="w-8 h-8 rounded-xl border border-purple-400/50 bg-gradient-to-r from-purple-950/80 to-pink-950/70 hover:from-purple-900/80 text-purple-200 hover:text-white flex items-center justify-center transition-all shadow-md shrink-0 active:scale-95 cursor-pointer"
              title={getTranslation('homeBtn', language)}
              aria-label={getTranslation('homeBtn', language)}
            >
              <Home className="w-4 h-4 text-purple-300" />
            </button>
          )}



          {/* 遊戲設定掣 (Settings) - 永遠位於右上角 */}
          <button
            type="button"
            id="header-btn-settings"
            onClick={() => {
              soundEngine.playClick();
              onOpenSettings();
            }}
            className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all shrink-0 active:scale-95 cursor-pointer shadow-md ${
              activeModal === 'SETTINGS'
                ? 'ring-2 ring-pink-400 bg-pink-900/95 border-pink-300 text-pink-100 shadow-[0_0_12px_rgba(244,114,182,0.6)] scale-[1.03]'
                : 'bg-gradient-to-r from-purple-950/80 to-pink-950/80 hover:brightness-110 border-pink-400/60 text-pink-300'
            }`}
            title={getTranslation('settingsBtn', language)}
            aria-label={getTranslation('settingsBtn', language)}
          >
            <Settings className="w-4 h-4 text-pink-300" />
          </button>
        </div>
      </div>

      {/* Main Score & Status Ribbon - only visible during active gameplay and when NO modal is open */}
      {isPlaying && !isModalOpen && (
        <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-b from-[#381045]/90 via-[#270b32]/90 to-[#180520]/90 border-2 border-pink-400/50 backdrop-blur-md flex flex-col gap-1.5 shadow-xl shadow-pink-950/50 animate-fade-in pointer-events-auto">
        <div className="flex items-center justify-between">
          {/* Left: Current Score, Added Coins & Snake Length */}
          <div className="flex items-start gap-2.5 sm:gap-3.5">
            {/* 1. 目前分數 */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-pink-300/80 font-bold">
                {getTranslation('currentScoreLabel', language)}
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono leading-none mt-0.5 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]">
                {score}
              </div>
            </div>

            {/* 2. 局內獲得金幣 */}
            <div className="flex flex-col items-center">
              <div
                className="h-[15px] flex items-center justify-center"
                title={getTranslation('earnedCoinsLabel', language)}
                aria-label={getTranslation('earnedCoinsLabel', language)}
              >
                <CoinIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono leading-none mt-0.5 drop-shadow-[0_0_8px_rgba(251,191,36,0.45)]">
                {coinsEarned}
              </div>
            </div>

            {/* 3. 萌蛇長度 */}
            {typeof snakeLength === 'number' && (
              <div className="px-1.5 sm:px-2 py-0.5 rounded-lg bg-pink-500/20 border border-pink-400/40 flex items-center gap-1 self-center">
                <span className="text-[10px] text-pink-300 font-semibold">
                  {getTranslation('snakeLengthLabel', language)}
                </span>
                <span className="text-xs sm:text-sm font-black text-amber-300 font-mono leading-none">
                  {snakeLength}
                </span>
              </div>
            )}

            {/* 4. 連擊倍率 */}
            {combo > 1 && (
              <div className="flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 text-white font-black text-[10px] sm:text-[11px] shadow-sm animate-pulse border border-pink-300/40 self-center">
                <Flame className="w-3 h-3 fill-white" />
                <span>x{combo}</span>
              </div>
            )}
          </div>

          {/* Right: Mode Indicator & Timer (High score display removed) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {mode === 'LEVELS' && currentLevel ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onOpenLevelSelect}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-pink-500/25 border border-pink-400/50 text-pink-200 hover:bg-pink-500/35 active:scale-95 transition-all shadow-sm"
                  title={
                    language === 'en'
                      ? 'View Stage Goals'
                      : language === 'ja'
                      ? 'ステージ目標を確認'
                      : language === 'zh-CN'
                      ? '查看关卡目标'
                      : '查看關卡目標'
                  }
                >
                  <Target className="w-3.5 h-3.5 text-pink-300 shrink-0" />
                  <span className="font-black text-xs">
                    {getTranslation('stageTitle', language).replace('{n}', String(currentLevel.id))}
                  </span>
                </button>
              </div>
            ) : mode === 'TIME_ATTACK' ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/25 border border-amber-400/50 text-amber-200 shadow-sm">
                <Clock className="w-3.5 h-3.5 animate-spin text-amber-300 shrink-0" />
                <span className="font-mono font-bold text-sm">{timeLeft}s</span>
              </div>
            ) : (
              <div className="text-center">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/20 border border-sky-400/40 text-sky-200">
                  {getTranslation('startClassicMode', language)}
                </span>
              </div>
            )}

            {mode === 'LEVELS' && currentLevel?.timeLimit && (
              <div className="text-right shrink-0 bg-rose-500/20 px-2 py-0.5 rounded-lg border border-rose-400/40">
                <div className="text-[9px] uppercase tracking-wider text-rose-300 font-bold leading-none">
                  {currentLevel.id === 80 || currentLevel.targets?.surviveSeconds !== undefined
                    ? (language === 'en' ? 'SURVIVE' : language === 'ja' ? '残り時間' : language === 'zh-CN' ? '生存倒计时' : '生存倒計時')
                    : (language === 'en' ? 'TIME' : language === 'ja' ? '時間' : language === 'zh-CN' ? '倒计时' : '倒計時')}
                </div>
                <div className="text-xs font-bold text-rose-300 font-mono leading-none mt-0.5">
                  {timeLeft}s
                </div>
              </div>
            )}

            {mode === 'LEVELS' && (currentLevel?.maxTurns !== undefined || currentLevel?.gimmick === 'TURN_LIMIT') && turnsLeft !== undefined && (
              <div
                className={`text-right shrink-0 px-2 py-0.5 rounded-lg border transition-colors isolate relative ${
                  turnsLeft <= 5
                    ? 'bg-rose-950/90 border-rose-500/70 shadow-[0_0_8px_rgba(244,63,94,0.35)]'
                    : 'bg-indigo-950/80 border-indigo-400/40'
                }`}
              >
                <div
                  className={`text-[9px] uppercase tracking-wider font-bold leading-none ${
                    turnsLeft <= 5 ? 'text-rose-300' : 'text-indigo-300'
                  }`}
                >
                  {language === 'en' ? 'TURNS' : language === 'ja' ? 'ターン' : language === 'zh-CN' ? '转向剩余' : '轉向剩餘'}
                </div>
                <div
                  key={`turns-count-${turnsLeft}`}
                  className={`text-xs font-black font-mono leading-none mt-0.5 select-none ${
                    turnsLeft <= 5 ? 'text-rose-400 drop-shadow-[0_0_4px_rgba(244,63,94,0.6)]' : 'text-indigo-200'
                  }`}
                >
                  {turnsLeft}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Level Mission Targets Bar - Wraps to next row if overflowing */}
        {mode === 'LEVELS' && currentLevel && levelProgress && (
          <div className="pt-1.5 border-t border-slate-800/80 flex flex-wrap items-center gap-1 sm:gap-1.5 gap-y-1 sm:gap-y-1.5 text-xs py-0.5">
            <span className="text-[11px] text-pink-200/90 font-bold shrink-0 flex items-center gap-1 pr-0.5 select-none">
              <Target className="w-3.5 h-3.5 text-pink-300 shrink-0" />
              <span>{getTranslation('missions', language)}:</span>
            </span>

            {currentLevel.targets.normal !== undefined && (
              <div
                className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg border font-mono font-bold text-[11px] sm:text-xs shrink-0 transition-colors ${
                  levelProgress.normal >= currentLevel.targets.normal
                    ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                    : 'bg-rose-950/40 border-rose-900/60 text-rose-200'
                }`}
              >
                <RedAppleIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{levelProgress.normal}/{currentLevel.targets.normal}</span>
                {levelProgress.normal >= currentLevel.targets.normal && (
                  <Check className="w-3 h-3 text-rose-400 shrink-0" />
                )}
              </div>
            )}

            {currentLevel.targets.blue !== undefined && (
              <div
                className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg border font-mono font-bold text-[11px] sm:text-xs shrink-0 transition-colors ${
                  levelProgress.blue >= currentLevel.targets.blue
                    ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                    : 'bg-blue-950/40 border-blue-800/60 text-blue-200'
                }`}
              >
                <BlueAppleIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{levelProgress.blue}/{currentLevel.targets.blue}</span>
                {levelProgress.blue >= currentLevel.targets.blue && (
                  <Check className="w-3 h-3 text-blue-400 shrink-0" />
                )}
              </div>
            )}

            {currentLevel.targets.green !== undefined && (
              <div
                className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg border font-mono font-bold text-[11px] sm:text-xs shrink-0 transition-colors ${
                  levelProgress.green >= currentLevel.targets.green
                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                    : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                }`}
              >
                <GreenAppleIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{levelProgress.green}/{currentLevel.targets.green}</span>
                {levelProgress.green >= currentLevel.targets.green && (
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                )}
              </div>
            )}

            {currentLevel.targets.golden !== undefined && (
              <div
                className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg border font-mono font-bold text-[11px] sm:text-xs shrink-0 transition-colors ${
                  levelProgress.golden >= currentLevel.targets.golden
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                }`}
              >
                <GoldenAppleIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{levelProgress.golden}/{currentLevel.targets.golden}</span>
                {levelProgress.golden >= currentLevel.targets.golden && (
                  <Check className="w-3 h-3 text-amber-400 shrink-0" />
                )}
              </div>
            )}

            {currentLevel.targets.shield !== undefined && (
              <div
                className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg border font-mono font-bold text-[11px] sm:text-xs shrink-0 transition-colors ${
                  levelProgress.shield >= currentLevel.targets.shield
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                    : 'bg-sky-950/40 border-sky-800/60 text-sky-200'
                }`}
              >
                <span className="shrink-0 text-xs">🛡️</span>
                <span>{levelProgress.shield}/{currentLevel.targets.shield}</span>
                {levelProgress.shield >= currentLevel.targets.shield && (
                  <Check className="w-3 h-3 text-sky-400 shrink-0" />
                )}
              </div>
            )}

            {currentLevel.targets.length !== undefined && (
              <div
                className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg border font-mono font-bold text-[11px] sm:text-xs shrink-0 transition-colors ${
                  levelProgress.length >= currentLevel.targets.length
                    ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                    : 'bg-purple-950/40 border-purple-800/60 text-purple-200'
                }`}
              >
                <span className="shrink-0 text-xs">🐍</span>
                <span>{levelProgress.length}/{currentLevel.targets.length}</span>
                {levelProgress.length >= currentLevel.targets.length && (
                  <Check className="w-3 h-3 text-purple-400 shrink-0" />
                )}
              </div>
            )}

            {currentLevel.targets.portals !== undefined && (
              <div
                className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg border font-mono font-bold text-[11px] sm:text-xs shrink-0 transition-colors ${
                  (levelProgress.portals || 0) >= currentLevel.targets.portals
                    ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300'
                    : 'bg-cyan-950/40 border-cyan-800/60 text-cyan-200'
                }`}
              >
                <span className="shrink-0 text-xs">🌀</span>
                <span>{levelProgress.portals || 0}/{currentLevel.targets.portals}</span>
                {(levelProgress.portals || 0) >= currentLevel.targets.portals && (
                  <Check className="w-3 h-3 text-cyan-400 shrink-0" />
                )}
              </div>
            )}

            {currentLevel.targets.chili !== undefined && (
              <div
                className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg border font-mono font-bold text-[11px] sm:text-xs shrink-0 transition-colors ${
                  (levelProgress.chili || 0) >= currentLevel.targets.chili
                    ? 'bg-orange-500/25 border-orange-400 text-orange-300'
                    : 'bg-orange-950/40 border-orange-800/60 text-orange-200'
                }`}
              >
                <span className="shrink-0 text-xs">🌶️</span>
                <span>{levelProgress.chili || 0}/{currentLevel.targets.chili}</span>
                {(levelProgress.chili || 0) >= currentLevel.targets.chili && (
                  <Check className="w-3 h-3 text-orange-400 shrink-0" />
                )}
              </div>
            )}

            {currentLevel.targets.magnet !== undefined && (
              <div
                className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg border font-mono font-bold text-[11px] sm:text-xs shrink-0 transition-colors ${
                  (levelProgress.magnet || 0) >= currentLevel.targets.magnet
                    ? 'bg-sky-500/25 border-sky-400 text-sky-300'
                    : 'bg-sky-950/40 border-sky-800/60 text-sky-200'
                }`}
              >
                <span className="shrink-0 text-xs">🧲</span>
                <span>{levelProgress.magnet || 0}/{currentLevel.targets.magnet}</span>
                {(levelProgress.magnet || 0) >= currentLevel.targets.magnet && (
                  <Check className="w-3 h-3 text-sky-400 shrink-0" />
                )}
              </div>
            )}

            {currentLevel.targets.dragonEgg !== undefined && (
              <div
                className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg border font-mono font-bold text-[11px] sm:text-xs shrink-0 transition-colors ${
                  (levelProgress.dragonEgg || 0) >= currentLevel.targets.dragonEgg
                    ? 'bg-rose-500/25 border-rose-400 text-rose-300'
                    : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                }`}
              >
                <span className="shrink-0 text-xs">🥚</span>
                <span>{levelProgress.dragonEgg || 0}/{currentLevel.targets.dragonEgg}</span>
                {(levelProgress.dragonEgg || 0) >= currentLevel.targets.dragonEgg && (
                  <Check className="w-3 h-3 text-rose-400 shrink-0" />
                )}
              </div>
            )}

            {currentLevel.targets.rainbow !== undefined && (
              <div
                className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg border font-mono font-bold text-[11px] sm:text-xs shrink-0 transition-colors ${
                  (levelProgress.rainbow || 0) >= currentLevel.targets.rainbow
                    ? 'bg-pink-500/25 border-pink-400 text-pink-300'
                    : 'bg-pink-950/40 border-pink-800/60 text-pink-200'
                }`}
              >
                <span className="shrink-0 text-xs">🍭</span>
                <span>{levelProgress.rainbow || 0}/{currentLevel.targets.rainbow}</span>
                {(levelProgress.rainbow || 0) >= currentLevel.targets.rainbow && (
                  <Check className="w-3 h-3 text-pink-400 shrink-0" />
                )}
              </div>
            )}

            {currentLevel.targets.surviveSeconds !== undefined && (() => {
              const curSurvive = levelProgress.surviveSeconds ?? 0;
              const isMet = curSurvive >= currentLevel.targets.surviveSeconds;
              return (
                <div
                  className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg border font-mono font-bold text-[11px] sm:text-xs shrink-0 transition-colors ${
                    isMet
                      ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                  }`}
                >
                  <span className="shrink-0 text-xs">⏱️</span>
                  <span>
                    {language === 'en' ? 'Survive' : language === 'ja' ? '生存' : language === 'zh-CN' ? '生存' : '生存'}: {Math.min(currentLevel.targets.surviveSeconds, curSurvive)}/{currentLevel.targets.surviveSeconds}s
                  </span>
                  {isMet && (
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  )}
                </div>
              );
            })()}

            {currentLevel.targets.bombs !== undefined && (
              <div
                className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg border font-mono font-bold text-[11px] sm:text-xs shrink-0 transition-colors ${
                  (levelProgress.bombs || 0) >= currentLevel.targets.bombs
                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                }`}
              >
                <span className="shrink-0 text-xs">💣</span>
                <span>{levelProgress.bombs || 0}/{currentLevel.targets.bombs}</span>
                {(levelProgress.bombs || 0) >= currentLevel.targets.bombs && (
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                )}
              </div>
            )}

            {currentLevel.targets.colorSequenceCount !== undefined && (
              <div
                className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg border font-mono font-bold text-[11px] sm:text-xs shrink-0 transition-colors ${
                  (levelProgress.colorSequenceCount || 0) >= currentLevel.targets.colorSequenceCount
                    ? 'bg-purple-500/25 border-purple-400 text-purple-300'
                    : 'bg-purple-950/40 border-purple-800/60 text-purple-200'
                }`}
              >
                <span className="shrink-0 text-xs">🎨</span>
                <span>{levelProgress.colorSequenceCount || 0}/{currentLevel.targets.colorSequenceCount}</span>
                {(levelProgress.colorSequenceCount || 0) >= currentLevel.targets.colorSequenceCount && (
                  <Check className="w-3 h-3 text-purple-400 shrink-0" />
                )}
              </div>
            )}

            {currentLevel.targets.keys !== undefined && (
              <div
                className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg border font-mono font-bold text-[11px] sm:text-xs shrink-0 transition-colors ${
                  (levelProgress.keys || 0) >= currentLevel.targets.keys
                    ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                    : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                }`}
              >
                <span className="shrink-0 text-xs">🗝️</span>
                <span>{levelProgress.keys || 0}/{currentLevel.targets.keys}</span>
                {(levelProgress.keys || 0) >= currentLevel.targets.keys && (
                  <Check className="w-3 h-3 text-amber-400 shrink-0" />
                )}
              </div>
            )}

            {/* Color sequence guide pills if level has colorSequence */}
            {currentLevel.colorSequence && currentLevel.colorSequence.length > 0 && (currentLevel.targets?.colorSequenceCount ?? 0) > 0 && (
              <div className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-[10px] sm:text-[11px] font-bold shrink-0">
                <span className="text-slate-400">{language === 'en' ? 'Order:' : language === 'ja' ? '順序:' : language === 'zh-CN' ? '顺序:' : '順序:'}</span>
                <div className="flex items-center gap-0.5">
                  {currentLevel.colorSequence.map((c, idx) => (
                    <span
                      key={idx}
                      className={`text-xs px-0.5 rounded ${
                        idx === colorSequenceIndex
                          ? 'bg-white/20 scale-125 transition-transform'
                          : 'opacity-60'
                      }`}
                    >
                      {c === 'RED' ? '🔴' : c === 'BLUE' ? '🔵' : '🟢'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Chameleon gate matching status badge */}
            {((currentLevel.colorGates && currentLevel.colorGates.length > 0) || currentLevel.gimmick === 'COLOR_GATE') && (
              <div className="inline-flex items-center gap-1.5 px-1.5 sm:px-2 py-0.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-[10px] sm:text-[11px] font-bold shadow-sm shrink-0">
                <span className="text-slate-400">🚪 {language === 'en' ? 'Body:' : language === 'ja' ? '体色:' : language === 'zh-CN' ? '体色:' : '體色:'}</span>
                {snakeColor === 'RED' && (
                  <span className="text-rose-400 flex items-center gap-0.5 font-black animate-pulse">
                    🔴 {language === 'en' ? 'RED' : language === 'ja' ? '赤' : language === 'zh-CN' ? '红' : '紅'}
                  </span>
                )}
                {snakeColor === 'BLUE' && (
                  <span className="text-sky-400 flex items-center gap-0.5 font-black animate-pulse">
                    🔵 {language === 'en' ? 'BLUE' : language === 'ja' ? '青' : language === 'zh-CN' ? '蓝' : '藍'}
                  </span>
                )}
                {snakeColor === 'GREEN' && (
                  <span className="text-emerald-400 flex items-center gap-0.5 font-black animate-pulse">
                    🟢 {language === 'en' ? 'GREEN' : language === 'ja' ? '緑' : language === 'zh-CN' ? '绿' : '綠'}
                  </span>
                )}
                {snakeColor === 'NORMAL' && (
                  <span className="text-amber-300 font-semibold">
                    {language === 'en' ? 'Original Skin' : language === 'ja' ? '通常' : language === 'zh-CN' ? '原造型' : '原造型'}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
        </div>
      )}
    </header>
  );
};

