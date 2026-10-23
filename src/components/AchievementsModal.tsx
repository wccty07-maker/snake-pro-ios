import React, { useState, useMemo, useEffect } from 'react';
import { Achievement, PlayerProfile } from '../types';
import { soundEngine } from '../utils/audio';
import { getSanitizedHighScore } from '../utils/scoreIsolation';
import { X, Award, CheckCircle2, Trophy, Lock } from 'lucide-react';
import { CuteModalBackground } from './CuteModalBackground';
import { ACHIEVEMENT_TIERS, getAchievementTierForLevel, getAchievementTierBadge } from '../utils/gameData';
import { LOCALIZED_ACHIEVEMENTS } from '../utils/i18n';

interface AchievementsModalProps {
  achievements: Achievement[];
  profile: PlayerProfile;
  isOpen: boolean;
  onClose: () => void;
  onClaimReward: (achId: string) => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  achievements,
  profile,
  isOpen,
  onClose,
  onClaimReward,
}) => {
  const lang = profile.language || 'zh-HK';
  const playerStageTier = useMemo(() => {
    return getAchievementTierForLevel(profile.unlockedLevel || 1);
  }, [profile.unlockedLevel]);

  const [selectedTier, setSelectedTier] = useState<number>(() =>
    getAchievementTierForLevel(profile.unlockedLevel || 1)
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedTier(getAchievementTierForLevel(profile.unlockedLevel || 1));
    }
  }, [isOpen, profile.unlockedLevel]);

  if (!isOpen) return null;

  const currentTierAchievements = achievements.filter((a) => (a.tier || 1) === selectedTier);
  const isTierUnlocked = selectedTier <= playerStageTier;
  const unlockedCount = isTierUnlocked
    ? currentTierAchievements.filter((a) => a.unlocked || a.progress >= a.maxProgress).length
    : 0;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center p-3 sm:p-4 pt-[calc(max(env(safe-area-inset-top),0.5rem)+3rem)] sm:pt-[calc(max(env(safe-area-inset-top),0.5rem)+3.5rem)] pb-3 bg-gradient-to-b from-indigo-950/75 via-purple-950/75 to-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <CuteModalBackground
        theme="rewards"
        className="w-full max-w-md max-h-[calc(100dvh-max(env(safe-area-inset-top),0.5rem)-4.2rem)] flex flex-col text-slate-100"
      >
        {/* Header */}
        <div className="p-4 border-b border-amber-500/20 flex items-center justify-between bg-slate-950/75 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {lang === 'en'
                  ? 'Achievements · 100-Stage Tiers'
                  : lang === 'ja'
                  ? 'アチーブメント・100ステージ制'
                  : lang === 'zh-CN'
                  ? '成就系统 · 100关阶级轮替'
                  : '成就系統 · 100關階級輪替'}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'en'
                  ? `Tier ${selectedTier}: ${unlockedCount} / ${currentTierAchievements.length} unlocked`
                  : lang === 'ja'
                  ? `第 ${selectedTier} 階: ${unlockedCount} / ${currentTierAchievements.length} 達成`
                  : lang === 'zh-CN'
                  ? `第 ${selectedTier} 阶已解锁 ${unlockedCount} / ${currentTierAchievements.length} 项成就`
                  : `第 ${selectedTier} 階已解鎖 ${unlockedCount} / ${currentTierAchievements.length} 項成就`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tier Selector Bar */}
        <div className="p-2.5 bg-slate-950/85 border-b border-slate-800 shrink-0">
          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
            {ACHIEVEMENT_TIERS.map((t) => {
              const isUnlocked = t.tier <= playerStageTier;
              const isSelected = t.tier === selectedTier;
              const isCurrent = t.tier === playerStageTier;

              return (
                <button
                  key={t.tier}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedTier(t.tier);
                  }}
                  className={`py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black shadow-md'
                      : isUnlocked
                      ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold'
                      : 'bg-slate-950/40 text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <div className="text-[11px] font-black truncate">
                    {getAchievementTierBadge(t, lang)}
                  </div>
                  <div className="text-[9px] opacity-80 truncate">
                    {lang === 'en' ? `Lv.${t.stageRange}` : lang === 'ja' ? `${t.stageRange}階` : `${t.stageRange}關`}
                  </div>
                  {isCurrent && !isSelected && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                  )}
                  {!isUnlocked && (
                    <div className="text-[8px] text-amber-500/80">🔒</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Locked tier notice */}
        {selectedTier > playerStageTier && (
          <div className="p-2.5 mx-3 mt-2 rounded-xl bg-amber-950/30 border border-amber-500/40 text-center text-xs text-amber-300">
            {lang === 'en'
              ? `🔒 Clear Stage ${ACHIEVEMENT_TIERS[selectedTier - 1]?.minLevel} to unlock this tier! Preview mode.`
              : lang === 'ja'
              ? `🔒 ステージ ${ACHIEVEMENT_TIERS[selectedTier - 1]?.minLevel} クリアでこの階級が解放されます！（プレビュー中）`
              : lang === 'zh-CN'
              ? `🔒 通关至第 ${ACHIEVEMENT_TIERS[selectedTier - 1]?.minLevel} 关后自动轮替开启此阶级！目前为预览模式。`
              : `🔒 通關至第 ${ACHIEVEMENT_TIERS[selectedTier - 1]?.minLevel} 關後自動輪替開啟此階級！目前為預覽模式。`}
          </div>
        )}

        {/* High Score Stats Bar */}
        <div className="p-3 bg-slate-950/70 border-b border-slate-800 grid grid-cols-3 gap-2 text-center shrink-0">
          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-[11px] text-slate-400">
              {lang === 'en' ? 'Classic Best' : lang === 'ja' ? 'クラシック' : '經典模式高分'}
            </div>
            <div className="text-sm font-bold text-emerald-400 font-mono">
              {getSanitizedHighScore(profile, 'CLASSIC')}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-[11px] text-slate-400">
              {lang === 'en' ? 'Time Attack' : lang === 'ja' ? 'タイムアタック' : '極速計時高分'}
            </div>
            <div className="text-sm font-bold text-amber-400 font-mono">
              {getSanitizedHighScore(profile, 'TIME_ATTACK')}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-[11px] text-slate-400">
              {lang === 'en' ? 'Survival Best' : lang === 'ja' ? 'サバイバル' : '生存模式高分'}
            </div>
            <div className="text-sm font-bold text-rose-400 font-mono">
              {profile.highScores.SURVIVAL}
            </div>
          </div>
        </div>

        {/* List of achievements */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-4 space-y-3">
          {currentTierAchievements.map((ach) => {
            const isCompleted = isTierUnlocked && (ach.progress >= ach.maxProgress || ach.unlocked);
            const isClaimed = Boolean(ach.claimed);
            const percentage = isTierUnlocked
              ? Math.min(100, Math.floor((ach.progress / ach.maxProgress) * 100))
              : 0;
            const achLoc = LOCALIZED_ACHIEVEMENTS[ach.id]?.[lang] || {
              title: ach.title,
              description: ach.description,
            };

            return (
              <div
                key={ach.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isClaimed
                    ? 'bg-purple-950/20 border-purple-500/40 opacity-80'
                    : isCompleted
                    ? 'bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border-amber-400/80 shadow-md shadow-amber-500/10'
                    : !isTierUnlocked
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-80'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-2xl shadow-inner">
                      {ach.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold flex items-center gap-1.5">
                        {achLoc.title}
                        {isClaimed && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        )}
                        {!isTierUnlocked && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-amber-400/90 border border-amber-500/30 flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" />
                            <span>{lang === 'en' ? 'Locked' : lang === 'ja' ? '未開放' : lang === 'zh-CN' ? '未解锁' : '未解鎖'}</span>
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">{achLoc.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 shrink-0">
                    <Award className="w-3.5 h-3.5" />
                    <span>+{ach.rewardCoins}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>{lang === 'en' ? 'Progress' : lang === 'ja' ? '進捗' : '進度'}</span>
                    <span>
                      {isTierUnlocked
                        ? `${Math.min(ach.maxProgress, Math.max(ach.progress, isCompleted ? ach.maxProgress : 0))} / ${ach.maxProgress}`
                        : `0 / ${ach.maxProgress}`}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        !isTierUnlocked
                          ? 'bg-slate-700'
                          : isCompleted
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                      }`}
                      style={{ width: `${!isTierUnlocked ? 0 : isCompleted ? 100 : percentage}%` }}
                    />
                  </div>
                </div>

                {/* Locked hint */}
                {!isTierUnlocked && (
                  <div className="mt-2.5 w-full py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5 select-none">
                    <Lock className="w-3.5 h-3.5 text-amber-500/70" />
                    <span>
                      {lang === 'en'
                        ? `Unlocks at Stage ${ACHIEVEMENT_TIERS[selectedTier - 1]?.minLevel || 101} to start tracking`
                        : lang === 'ja'
                        ? `ステージ ${ACHIEVEMENT_TIERS[selectedTier - 1]?.minLevel || 101} 到達で集計開始`
                        : lang === 'zh-CN'
                        ? `通关至第 ${ACHIEVEMENT_TIERS[selectedTier - 1]?.minLevel || 101} 关后开启计算`
                        : `通關至第 ${ACHIEVEMENT_TIERS[selectedTier - 1]?.minLevel || 101} 關後開啟計算`}
                    </span>
                  </div>
                )}

                {/* Claim reward button */}
                {isTierUnlocked && isCompleted && !isClaimed && (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playSpecialEat();
                      onClaimReward(ach.id);
                    }}
                    className="mt-2.5 w-full py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>
                      {lang === 'en'
                        ? `Claim +${ach.rewardCoins} Coins`
                        : lang === 'ja'
                        ? `報酬受取 +${ach.rewardCoins} コイン`
                        : lang === 'zh-CN'
                        ? `领取奖励 +${ach.rewardCoins} 金币`
                        : `領取獎勵 +${ach.rewardCoins} 金幣`}
                    </span>
                  </button>
                )}

                {/* Claimed badge */}
                {isClaimed && (
                  <div className="mt-2 py-1 text-center text-xs font-bold text-emerald-400/90 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {lang === 'en'
                        ? '✓ Reward Claimed'
                        : lang === 'ja'
                        ? '✓ 受取済み'
                        : lang === 'zh-CN'
                        ? '✓ 成就奖励已领取'
                        : '✓ 成就獎勵已領取'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CuteModalBackground>
    </div>
  );
};
