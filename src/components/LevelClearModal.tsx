import React from 'react';
import { Trophy, ArrowRight, RotateCcw, Menu, Sparkles, CheckCircle2, X } from 'lucide-react';
import { LevelMission } from '../types';
import { SupportedLanguage } from '../utils/i18n';
import { soundEngine } from '../utils/audio';
import { CuteModalBackground } from './CuteModalBackground';

interface LevelClearModalProps {
  isOpen: boolean;
  level: LevelMission;
  score?: number;
  highScore?: number;
  isNewRecord?: boolean;
  hasNextLevel: boolean;
  isFirstTimeClear?: boolean;
  coinsEarned?: number;
  language?: SupportedLanguage;
  onNextLevel: () => void;
  onReplay: () => void;
  onOpenLevelSelect: () => void;
}

export const LevelClearModal: React.FC<LevelClearModalProps> = ({
  isOpen,
  level,
  score = 0,
  highScore = 0,
  isNewRecord = false,
  hasNextLevel,
  isFirstTimeClear = true,
  coinsEarned = 0,
  language = 'zh-HK',
  onNextLevel,
  onReplay,
  onOpenLevelSelect,
}) => {
  if (!isOpen) return null;

  const bannerText =
    language === 'en'
      ? '🎉 GOAL ACCOMPLISHED! 🎉'
      : language === 'ja'
      ? '🎉 目標達成！ 🎉'
      : language === 'zh-CN'
      ? '🍭 关卡目标达成 🍬'
      : '🍭 關卡目標達成 🍬';

  const clearTitleText =
    language === 'en'
      ? `Stage ${level.id} Cleared!`
      : language === 'ja'
      ? `ステージ ${level.id} クリア！`
      : language === 'zh-CN'
      ? `恭喜通关 第 ${level.id} 关！`
      : `恭喜通關 第 ${level.id} 關！`;

  const stageScoreLabel =
    language === 'en'
      ? 'Stage Score'
      : language === 'ja'
      ? 'ステージスコア'
      : language === 'zh-CN'
      ? '本关得分'
      : '本關得分';

  const bestScoreLabel =
    language === 'en'
      ? 'Stage Best'
      : language === 'ja'
      ? 'ステージ最高'
      : language === 'zh-CN'
      ? '本关最高'
      : '本關最高';

  const newRecordLabel =
    language === 'en'
      ? 'New Record!'
      : language === 'ja'
      ? '新記録！'
      : language === 'zh-CN'
      ? '刷新本关最高！'
      : '刷新本關最高！';

  const pointsUnit =
    language === 'en'
      ? 'pts'
      : language === 'ja'
      ? '点'
      : '分';

  const rewardCoinsLabel =
    language === 'en'
      ? 'Coins Gained'
      : language === 'ja'
      ? '獲得コイン'
      : language === 'zh-CN'
      ? '获得金币'
      : '獲得金幣';

  const missionStatusLabel =
    language === 'en'
      ? 'Stage Goal'
      : language === 'ja'
      ? 'ステージ目標'
      : language === 'zh-CN'
      ? '关卡目标'
      : '關卡目標';

  const allCompletedLabel =
    language === 'en'
      ? '100% Cleared'
      : language === 'ja'
      ? '完全達成'
      : language === 'zh-CN'
      ? '目标全数达成'
      : '目標全數達成';

  const stageClearTag =
    language === 'en'
      ? 'STAGE CLEAR'
      : language === 'ja'
      ? 'ステージ制覇'
      : language === 'zh-CN'
      ? '顺利过关'
      : '順利過關';

  const nextStageText =
    language === 'en'
      ? `Play Stage ${level.id + 1}`
      : language === 'ja'
      ? `ステージ ${level.id + 1} に挑戦`
      : language === 'zh-CN'
      ? `挑战第 ${level.id + 1} 关`
      : `挑戰第 ${level.id + 1} 關`;

  const allStagesClearedText =
    language === 'en'
      ? '🎉 All Stages Cleared! You are the Legendary Monster Serpent King!'
      : language === 'ja'
      ? '🎉 全ステージ制覇！伝説のモンスターキング！'
      : language === 'zh-CN'
      ? '🎉 恭喜你通关了所有关卡！成为传奇萌怪蛇王！'
      : '🎉 恭喜你通關了所有關卡！成為傳奇萌怪蛇王！';

  const replayText =
    language === 'en'
      ? 'Replay Stage'
      : language === 'ja'
      ? 'もう一度'
      : language === 'zh-CN'
      ? '重玩本关'
      : '重玩本關';

  const pastStagesText =
    language === 'en'
      ? 'Stage Map'
      : language === 'ja'
      ? 'ステージマップ'
      : language === 'zh-CN'
      ? '关卡地图'
      : '關卡地圖';

  const stageBonus = isFirstTimeClear ? Math.min(500, level.rewardCoins) : 0;
  const totalCoinsWon = stageBonus + Math.max(0, coinsEarned);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 pt-[calc(max(env(safe-area-inset-top),0.5rem)+3.2rem)] pb-3 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none overflow-hidden"
    >
      <CuteModalBackground
        theme="victory"
        className="w-full max-w-sm max-h-[calc(100dvh-max(env(safe-area-inset-top),0.5rem)-4.5rem)] flex flex-col text-slate-100 relative shadow-2xl overflow-hidden p-5 sm:p-6 text-center"
      >
        {/* Prominent top-right close button */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onOpenLevelSelect();
          }}
          className="absolute top-3 right-3 w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-95 z-30 cursor-pointer shadow-md touch-manipulation border border-pink-500/40"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-full flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col items-center">
          {/* Celebratory floating icons */}
          <div className="flex items-center justify-center gap-2 mb-2 pr-4">
          <span className="text-3xl animate-bounce [animation-delay:0ms]">🎉</span>
          <span className="text-4xl animate-bounce [animation-delay:150ms]">🏆</span>
          <span className="text-3xl animate-bounce [animation-delay:300ms]">🎊</span>
        </div>

        {/* Title Badge */}
        <div className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1 rounded-full bg-pink-500/30 border border-pink-400/60 text-pink-200 text-xs font-black tracking-wider uppercase mb-2 shadow-md mx-auto">
          <Sparkles className="w-3.5 h-3.5 text-pink-300" />
          <span>{bannerText}</span>
        </div>

        <h2 className="text-2xl font-black text-white tracking-wide drop-shadow-[0_2px_8px_rgba(244,63,94,0.6)]">
          {clearTitleText}
        </h2>

        {/* Stage Score & Rewards Unified Card */}
        <div className="w-full my-3.5 p-3.5 rounded-2xl bg-slate-950/70 border border-pink-400/40 shadow-inner backdrop-blur-sm flex flex-col items-center relative overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-pink-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

          {/* 1. Stage Score Showcase */}
          <div className="w-full flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-xs text-pink-200/90 font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{stageScoreLabel}</span>
            </div>

            <div className="flex items-baseline justify-center gap-1 mt-1 mb-1">
              <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-100 to-pink-300 font-mono tracking-tight drop-shadow-[0_2px_12px_rgba(251,191,36,0.45)]">
                {(score ?? 0).toLocaleString()}
              </span>
              <span className="text-xs font-bold text-pink-300/80 font-mono">
                {pointsUnit}
              </span>
            </div>

            {/* Best score badge or new record tag */}
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-pink-300/90 mb-1">
              {isNewRecord ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/30 to-rose-500/30 border border-amber-400/60 text-amber-200 text-[10px] font-black shadow-sm animate-pulse">
                  <Trophy className="w-3 h-3 text-amber-300" />
                  <span>{newRecordLabel}</span>
                </span>
              ) : (
                <div className="inline-flex items-center gap-1 text-slate-300/90 text-[10.5px] font-semibold bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-pink-500/30 shadow-xs">
                  <Trophy className="w-3 h-3 text-amber-400/80" />
                  <span>{bestScoreLabel}:</span>
                  <span className="text-amber-300 font-mono font-bold">
                    {Math.max(highScore ?? 0, score ?? 0).toLocaleString()} {pointsUnit}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Elegant divider */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-pink-500/30 to-transparent my-2.5" />

          {/* 2. Rewards and Stage Goal 2-Column Row */}
          <div className="w-full flex items-center justify-around gap-2 px-1">
            <div className="flex flex-col items-center min-w-[100px]">
              <span className="text-[11px] text-pink-200/90 font-semibold">{rewardCoinsLabel}</span>
              <div className="mt-0.5 font-black text-2xl font-mono text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">
                {totalCoinsWon}
              </div>
            </div>

            <div className="w-px h-10 bg-pink-500/30" />

            <div className="flex flex-col items-center">
              <span className="text-[11px] text-pink-200/90 font-semibold">{missionStatusLabel}</span>
              <div className="flex items-center gap-1.5 mt-0.5 text-emerald-300 font-bold text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{allCompletedLabel}</span>
              </div>
              <span className="text-[9px] text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full mt-0.5 border border-emerald-400/40">
                {stageClearTag}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          {hasNextLevel ? (
            <button
              type="button"
              id="btn-level-next"
              onClick={(e) => {
                e.stopPropagation();
                onNextLevel();
              }}
              className="w-full py-3.5 px-4 rounded-2xl btn-candy bg-gradient-to-b from-pink-400 to-rose-600 text-white font-black text-base shadow-lg shadow-pink-600/40 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
            >
              <span>{nextStageText}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <div className="py-3 px-4 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-sm flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
              <span>{allStagesClearedText}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mt-0.5">
            <button
              type="button"
              id="btn-level-replay"
              onClick={(e) => {
                e.stopPropagation();
                onReplay();
              }}
              className="py-3 px-3 rounded-xl bg-purple-950/70 hover:bg-purple-900/70 text-purple-200 hover:text-white font-bold text-xs border border-purple-400/40 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer min-h-[44px]"
            >
              <RotateCcw className="w-4 h-4 text-purple-300" />
              <span>{replayText}</span>
            </button>
            <button
              type="button"
              id="btn-level-menu"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                soundEngine.playClick();
                onOpenLevelSelect();
              }}
              className="py-3 px-3 rounded-xl bg-purple-950/70 hover:bg-purple-900/70 text-purple-200 hover:text-white font-bold text-xs border border-purple-400/40 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer min-h-[44px]"
            >
              <Menu className="w-4 h-4 text-purple-300" />
              <span>{pastStagesText}</span>
            </button>
          </div>
        </div>
        </div>
      </CuteModalBackground>
    </div>
  );
};
