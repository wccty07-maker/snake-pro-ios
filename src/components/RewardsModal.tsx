import React, { useState, useEffect, useMemo } from 'react';
import { PlayerProfile, Achievement, DailyMission } from '../types';
import { soundEngine } from '../utils/audio';
import { getSanitizedHighScore } from '../utils/scoreIsolation';
import {
  SupportedLanguage,
  getTranslation,
  LOCALIZED_DAILY_MISSIONS,
  LOCALIZED_ACHIEVEMENTS,
  getLocalizedDailyMission,
} from '../utils/i18n';
import {
  ACHIEVEMENT_TIERS,
  getAchievementTierForLevel,
  getAchievementTierBadge,
} from '../utils/gameData';
import {
  Gift,
  Heart,
  Sparkles,
  X,
  Trophy,
  CheckCircle2,
  Target,
  ListTodo,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CuteModalBackground } from './CuteModalBackground';
import { CoinIcon } from './CoinIcon';

export interface DailyReward {
  day: number;
  coins: number;
  hearts: number;
  isGrandPrize?: boolean;
}

export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getYesterdayDateString = (): string => {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCurrentMonthString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const isDailyCheckInAvailable = (profile: PlayerProfile): boolean => {
  const checkInMission = (profile.dailyMissions || []).find((m) => m.id === 'daily_checkin');
  if (checkInMission) {
    return !checkInMission.claimed;
  }
  return profile.lastCheckInDate !== getTodayDateString();
};

export const getCurrentCheckInDay = (profile: PlayerProfile): number => {
  return (profile.checkInStreak || 0) + 1;
};

interface RewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  achievements: Achievement[];
  initialTab?: 'CHECKIN' | 'DAILY_MISSIONS' | 'ACHIEVEMENTS';
  language?: SupportedLanguage;
  onUpdateProfile: React.Dispatch<React.SetStateAction<PlayerProfile>>;
  onClaimAchievementReward: (achId: string) => void;
  onClaimDailyMissionReward?: (missionId: string) => void;
  onClaimAllDailyMissions?: () => void;
  onOpenTutorial?: () => void;
}

export const RewardsModal: React.FC<RewardsModalProps> = ({
  isOpen,
  onClose,
  profile,
  achievements,
  initialTab = 'DAILY_MISSIONS',
  language = 'zh-HK',
  onUpdateProfile,
  onClaimAchievementReward,
  onClaimDailyMissionReward,
  onClaimAllDailyMissions,
  onOpenTutorial,
}) => {
  const [activeTab, setActiveTab] = useState<'DAILY_MISSIONS' | 'ACHIEVEMENTS'>('DAILY_MISSIONS');
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Player's actual stage progression tier based on unlocked level (Every 100 levels)
  const playerStageTier = useMemo(() => {
    return getAchievementTierForLevel(profile.unlockedLevel || 1);
  }, [profile.unlockedLevel]);

  // Selected tab tier (defaults to player's current stage tier)
  const [selectedTier, setSelectedTier] = useState<number>(() =>
    getAchievementTierForLevel(profile.unlockedLevel || 1)
  );

  useEffect(() => {
    if (isOpen) {
      if (initialTab === 'ACHIEVEMENTS') {
        setActiveTab('ACHIEVEMENTS');
      } else {
        setActiveTab('DAILY_MISSIONS');
      }
      setSelectedTier(getAchievementTierForLevel(profile.unlockedLevel || 1));
    }
  }, [isOpen, initialTab, profile.unlockedLevel]);

  const todayStr = getTodayDateString();
  const dailyMissions = profile.dailyMissions || [];

  // Check-in mission is the special daily_checkin item (never scaled!)
  const checkInMission = useMemo(() => {
    return dailyMissions.find((m) => m.id === 'daily_checkin');
  }, [dailyMissions]);

  // Other adventure missions (scaled daily!)
  const otherDailyMissions = useMemo(() => {
    return dailyMissions.filter((m) => m.id !== 'daily_checkin');
  }, [dailyMissions]);

  // Daily missions claimable count (including check-in!)
  const claimableDailyMissionsCount = useMemo(() => {
    return dailyMissions.filter((m) => m.completed && !m.claimed).length;
  }, [dailyMissions]);

  // Achievements filtered by selected tier
  const currentTierAchievements = useMemo(() => {
    return achievements.filter((a) => (a.tier || 1) === selectedTier);
  }, [achievements, selectedTier]);

  const isSelectedTierUnlocked = selectedTier <= playerStageTier;

  // Unclaimed completed achievements count for selected tier (0 if tier is locked)
  const claimableTierAchievementsCount = useMemo(() => {
    if (selectedTier > playerStageTier) return 0;
    return currentTierAchievements.filter(
      (a) => (a.progress >= a.maxProgress || a.unlocked) && !a.claimed
    ).length;
  }, [currentTierAchievements, selectedTier, playerStageTier]);

  const unlockedTierAchievementsCount = useMemo(() => {
    if (selectedTier > playerStageTier) return 0;
    return currentTierAchievements.filter(
      (a) => a.progress >= a.maxProgress || a.unlocked
    ).length;
  }, [currentTierAchievements, selectedTier, playerStageTier]);

  // Total unclaimed achievements count across ALL UNLOCKED tiers (for modal badge)
  const claimableAchievementsCount = useMemo(() => {
    return achievements.filter(
      (a) => (a.tier || 1) <= playerStageTier && (a.progress >= a.maxProgress || a.unlocked) && !a.claimed
    ).length;
  }, [achievements, playerStageTier]);

  const unlockedAchievementsCount = useMemo(() => {
    return achievements.filter(
      (a) => (a.tier || 1) <= playerStageTier && (a.progress >= a.maxProgress || a.unlocked)
    ).length;
  }, [achievements, playerStageTier]);

  // Claim single daily mission (strictly once per mission per day)
  const handleClaimSingleDailyMission = (missionId: string) => {
    if (onClaimDailyMissionReward) {
      onClaimDailyMissionReward(missionId);
      return;
    }
    const target = dailyMissions.find((m) => m.id === missionId);
    if (!target || target.claimed || !target.completed) return;

    soundEngine.playSpecialEat();
    soundEngine.haptic('success');

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    const isCheckIn = target.id === 'daily_checkin';
    const heartsToAdd = isCheckIn ? 0 : (target.rewardHearts || 0);

    onUpdateProfile((prev) => {
      const missions = prev.dailyMissions || [];
      const current = missions.find((m) => m.id === missionId);
      if (!current || current.claimed || !current.completed) return prev;

      const isNewCheckInDay = isCheckIn && prev.lastCheckInDate !== todayStr;
      const nextStreak = isNewCheckInDay ? (prev.checkInStreak || 0) + 1 : (prev.checkInStreak || 0);

      return {
        ...prev,
        coins: prev.coins + (isCheckIn ? 100 : current.rewardCoins),
        hearts: heartsToAdd > 0 ? prev.hearts + heartsToAdd : prev.hearts,
        lastCheckInDate: isCheckIn ? todayStr : prev.lastCheckInDate,
        checkInStreak: nextStreak,
        dailyMissions: missions.map((m) =>
          m.id === missionId ? { ...m, claimed: true, completed: true, progress: m.maxProgress } : m
        ),
      };
    });
  };

  // Claim all claimable daily missions at once (atomic batch operation)
  const handleClaimAllDailyMissions = () => {
    if (onClaimAllDailyMissions) {
      onClaimAllDailyMissions();
      return;
    }

    const claimable = dailyMissions.filter((m) => m.completed && !m.claimed);
    if (claimable.length === 0) return;

    soundEngine.playSpecialEat();
    soundEngine.haptic('success');

    try {
      confetti({
        particleCount: 80,
        spread: 75,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    onUpdateProfile((prev) => {
      const missions = prev.dailyMissions || [];
      const eligible = missions.filter((m) => m.completed && !m.claimed);
      if (eligible.length === 0) return prev;

      let totalCoins = 0;
      let totalHearts = 0;
      let hasCheckIn = false;
      const claimedIds = new Set(eligible.map((m) => m.id));

      eligible.forEach((m) => {
        if (m.id === 'daily_checkin') {
          totalCoins += 100;
          hasCheckIn = true;
        } else {
          totalCoins += m.rewardCoins || 0;
          totalHearts += m.rewardHearts || 0;
        }
      });

      const isNewCheckInDay = hasCheckIn && prev.lastCheckInDate !== todayStr;
      const nextStreak = isNewCheckInDay ? (prev.checkInStreak || 0) + 1 : (prev.checkInStreak || 0);

      return {
        ...prev,
        coins: prev.coins + totalCoins,
        hearts: totalHearts > 0 ? prev.hearts + totalHearts : prev.hearts,
        lastCheckInDate: hasCheckIn ? todayStr : prev.lastCheckInDate,
        checkInStreak: nextStreak,
        dailyMissions: missions.map((m) =>
          claimedIds.has(m.id) ? { ...m, claimed: true, completed: true, progress: m.maxProgress } : m
        ),
      };
    });
  };

  // Claim all claimable achievements
  const handleClaimAllTierAchievements = () => {
    if (selectedTier > playerStageTier) return;
    const claimable = currentTierAchievements.filter(
      (a) => (a.progress >= a.maxProgress || a.unlocked) && !a.claimed
    );
    if (claimable.length === 0) return;

    soundEngine.playSpecialEat();
    soundEngine.haptic('success');

    try {
      confetti({
        particleCount: 80,
        spread: 75,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    claimable.forEach((a) => {
      onClaimAchievementReward(a.id);
    });
  };

  const handleClaimAllAchievements = () => {
    const claimable = achievements.filter(
      (a) => (a.tier || 1) <= playerStageTier && (a.progress >= a.maxProgress || a.unlocked) && !a.claimed
    );
    if (claimable.length === 0) return;

    soundEngine.playSpecialEat();
    soundEngine.haptic('success');

    try {
      confetti({
        particleCount: 80,
        spread: 75,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    claimable.forEach((a) => {
      onClaimAchievementReward(a.id);
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 pt-[calc(max(env(safe-area-inset-top),0.5rem)+3.2rem)] pb-3 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <CuteModalBackground
        theme="rewards"
        className="w-full max-w-lg rounded-3xl bg-slate-900/95 border border-amber-500/30 shadow-2xl shadow-amber-500/10 overflow-hidden flex flex-col max-h-[calc(100dvh-max(env(safe-area-inset-top),0.5rem)-4.5rem)]"
      >
        {/* Header */}
        <div className="relative p-4 pb-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/30 text-slate-950">
              <Target className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>{getTranslation('tabDailyMissions', language)}</span>
                <span className="text-[11px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                  {getTranslation('dailyCheckInMissionTag', language)}
                </span>
              </h2>
              <p className="text-[10px] text-amber-200/80 font-medium mt-0.5">
                {getTranslation('missionsResetHint', language)} · {language === 'en' ? 'Once per day' : language === 'ja' ? '1日1回限定' : '每日限領一次'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher - 2 Clean Tabs */}
        <div className="p-2 sm:px-3 sm:pt-2.5 sm:pb-2 bg-slate-950/80 border-b border-slate-800 shrink-0">
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
            {/* Tab 1: Daily Missions & Check-in */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setActiveTab('DAILY_MISSIONS');
              }}
              className={`relative py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'DAILY_MISSIONS'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListTodo className="w-4 h-4 shrink-0" />
              <span>{getTranslation('tabDailyMissions', language)}</span>
              {claimableDailyMissionsCount > 0 && (
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-rose-500 text-white animate-pulse">
                  {claimableDailyMissionsCount}
                </span>
              )}
            </button>

            {/* Tab 2: Achievements */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setActiveTab('ACHIEVEMENTS');
              }}
              className={`relative py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'ACHIEVEMENTS'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trophy className="w-4 h-4 shrink-0" />
              <span>{getTranslation('tabAchievements', language)}</span>
              {claimableAchievementsCount > 0 && (
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 animate-pulse">
                  {claimableAchievementsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab 1 Content: Daily Missions (Including Daily Check-In) */}
        {activeTab === 'DAILY_MISSIONS' && (
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y flex flex-col">
            <div className="p-3 sm:p-4 space-y-3 flex-1">
              {/* Daily Check-In Hero Card */}
              {checkInMission && (
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    checkInMission.claimed
                      ? 'bg-slate-950/50 border-slate-800 opacity-80'
                      : 'bg-gradient-to-br from-amber-500/20 via-orange-950/30 to-slate-900 border-amber-400/80 shadow-xl shadow-amber-500/15 ring-1 ring-amber-400/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30 shrink-0">
                        🎁
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-black text-white">
                            {LOCALIZED_DAILY_MISSIONS.daily_checkin?.[language]?.title ||
                              (language === 'en'
                                ? 'Daily Login Check-In'
                                : language === 'ja'
                                ? 'デイリーログイン'
                                : language === 'zh-CN'
                                ? '每日登录签到'
                                : '每日登入簽到')}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {getTranslation('dailyCheckInMissionTag', language)}
                          </span>
                        </div>
                        <p className="text-xs text-amber-200/90 mt-0.5 font-medium">
                          {checkInMission.claimed
                            ? getTranslation('checkInRewardClaimed', language)
                            : getTranslation('dailyCheckInAutoCompleted', language)}
                        </p>
                      </div>
                    </div>

                    {/* Rewards Pill */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-xl border border-amber-500/30 font-mono">
                        <span>+{checkInMission.rewardCoins || 100}</span>
                        <CoinIcon className="w-3.5 h-3.5" />
                      </div>
                      {(checkInMission.rewardHearts || 0) > 0 && (
                        <div className="flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/15 px-2 py-1 rounded-xl border border-rose-500/30 font-mono">
                          <span>+{checkInMission.rewardHearts}</span>
                          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Area */}
                  {!checkInMission.claimed ? (
                    <button
                      type="button"
                      onClick={() => handleClaimSingleDailyMission(checkInMission.id)}
                      className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:brightness-110 active:scale-98 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>
                        {getTranslation('claimCheckInReward', language)} (+{checkInMission.rewardCoins || 100} {getTranslation('coins', language)}{(checkInMission.rewardHearts || 0) > 0 ? ` +${checkInMission.rewardHearts}❤️` : ''})
                      </span>
                    </button>
                  ) : (
                    <div className="mt-2.5 py-1.5 px-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{getTranslation('checkInRewardClaimed', language)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Adventure Missions Header Bar */}
              <div className="pt-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Target className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{getTranslation('missionsProgressTitle', language)}</span>
                      <span className="font-mono text-emerald-400 font-black">
                        ({dailyMissions.filter((m) => m.completed).length} / {dailyMissions.length})
                      </span>
                    </div>
                  </div>
                </div>

                {claimableDailyMissionsCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClaimAllDailyMissions}
                    className="py-1 px-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-sm hover:brightness-110 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {getTranslation('claimAll', language).replace(
                        '{n}',
                        String(claimableDailyMissionsCount)
                      )}
                    </span>
                  </button>
                )}
              </div>

              {/* All Completed & Claimed Celebration Banner */}
              {dailyMissions.length > 0 && dailyMissions.every((m) => m.claimed) && (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-teal-950/50 to-slate-900 border border-emerald-500/40 text-center space-y-1 animate-fade-in shadow-lg shadow-emerald-950/30">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-black text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{getTranslation('dailyMissionsAllClaimed', language)}</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/70">
                    {getTranslation('dailyOnceHint', language)}
                  </p>
                </div>
              )}

              {/* Adventure Missions List */}
              <div className="space-y-2.5">
                {otherDailyMissions.map((mission) => {
                  const percentage = Math.min(
                    100,
                    Math.floor((mission.progress / mission.maxProgress) * 100)
                  );
                  const missionLoc = getLocalizedDailyMission(mission, language);

                  return (
                    <div
                      key={mission.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        mission.claimed
                          ? 'bg-slate-950/40 border-slate-800/80 opacity-70'
                          : mission.completed
                          ? 'bg-gradient-to-r from-emerald-500/15 via-slate-900 to-slate-900 border-emerald-400/60 shadow-md shadow-emerald-500/10'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-center text-xl shrink-0 shadow-inner">
                            {mission.icon}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-white truncate">
                              <span>{missionLoc.title}</span>
                              {mission.claimed && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              )}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                              {missionLoc.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 shrink-0 font-mono">
                          <span>+{mission.rewardCoins}</span>
                          <CoinIcon className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-2.5">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>{getTranslation('missionProgressLabel', language)}</span>
                          <span className="font-mono">
                            {mission.progress} / {mission.maxProgress}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              mission.completed
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Claim Button */}
                      {mission.completed && !mission.claimed && (
                        <button
                          type="button"
                          onClick={() => handleClaimSingleDailyMission(mission.id)}
                          className="mt-2 w-full py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          <span>
                            {getTranslation('claimMissionCoins', language).replace(
                              '{n}',
                              String(mission.rewardCoins)
                            )}
                          </span>
                        </button>
                      )}

                      {mission.claimed && (
                        <div className="mt-2 py-1 text-center text-[10px] font-bold text-emerald-400/80 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                          {getTranslation('missionClaimed', language)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Notice */}
            <div className="mt-auto shrink-0 px-4 py-2.5 bg-slate-950/70 border-t border-slate-800 text-[10px] text-slate-400 text-center">
              {getTranslation('dailyMissionsFooterTip', language)}
            </div>
          </div>
        )}

        {/* Tab 2 Content: Achievements */}
        {activeTab === 'ACHIEVEMENTS' && (
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y flex flex-col">
            <div className="flex-1">
              {/* High Score Stats Bar */}
              <div className="p-3 bg-slate-950/70 border-b border-slate-800 grid grid-cols-3 gap-2 text-center shrink-0">
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="text-[10px] text-slate-400">
                    {getTranslation('classicBest', language)}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-emerald-400 font-mono">
                    {getSanitizedHighScore(profile, 'CLASSIC')}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="text-[10px] text-slate-400">
                    {getTranslation('speedBest', language)}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-amber-400 font-mono">
                    {getSanitizedHighScore(profile, 'TIME_ATTACK')}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="text-[10px] text-slate-400">
                    {getTranslation('stagesProgress', language)}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-sky-400 font-mono">
                    {getTranslation('stageN', language).replace(
                      '{n}',
                      String(profile.unlockedLevel || 1)
                    )}
                  </div>
                </div>
              </div>

              {/* Achievement Tier Tabs */}
              <div className="p-3 bg-slate-950/80 border-b border-slate-800 space-y-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black text-white">
                    {getTranslation('achievementTierLabel', language)}
                  </span>
                </div>

                {/* 4 Tiers Tabs (100 Levels Each) */}
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
                          {getAchievementTierBadge(t, language)}
                        </div>
                        <div className="text-[9px] opacity-80 truncate">
                          {language === 'en' ? `Lv.${t.stageRange}` : language === 'ja' ? `${t.stageRange}階` : `${t.stageRange}關`}
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

              {/* Locked Tier Notice (When previewing higher tiers) */}
              {selectedTier > playerStageTier && (
                <div className="p-3 mx-3 sm:mx-4 mt-3 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-center space-y-1">
                  <div className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {getTranslation('tierLockedHint', language).replace(
                        '{lvl}',
                        String(ACHIEVEMENT_TIERS[selectedTier - 1]?.minLevel || 101)
                      )}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {language === 'en'
                      ? `Clear Stage ${ACHIEVEMENT_TIERS[selectedTier - 1]?.minLevel - 1} to unlock this tier and larger coin bounties! (Preview mode)`
                      : language === 'ja'
                      ? `ステージ ${ACHIEVEMENT_TIERS[selectedTier - 1]?.minLevel - 1} クリアでこの階級が解放されます！（プレビュー中）`
                      : language === 'zh-CN'
                      ? `通关第 ${ACHIEVEMENT_TIERS[selectedTier - 1]?.minLevel - 1} 关后将自动轮替开启此阶级成就与更丰厚金币奖励！目前为预览模式。`
                      : `通關第 ${ACHIEVEMENT_TIERS[selectedTier - 1]?.minLevel - 1} 關後將自動輪替開啟此階級成就與更豐厚金幣獎勵！目前為預覽模式。`}
                  </div>
                </div>
              )}

              {/* Progress Summary and Claim All Button for Selected Tier */}
              <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-300">
                    {ACHIEVEMENT_TIERS[selectedTier - 1]?.title[language] || ACHIEVEMENT_TIERS[selectedTier - 1]?.title['zh-HK']}
                    <span className="ml-1.5 text-amber-400 font-mono">
                      ({unlockedTierAchievementsCount} / {currentTierAchievements.length})
                    </span>
                    {!isSelectedTierUnlocked && (
                      <span className="ml-2 text-[10px] text-amber-400/80 font-normal">
                        ({language === 'en' ? 'Preview' : language === 'ja' ? 'プレビュー' : language === 'zh-CN' ? '预览模式' : '預覽模式'})
                      </span>
                    )}
                  </span>
                </div>

                {claimableTierAchievementsCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClaimAllTierAchievements}
                    className="py-1 px-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs shadow-sm hover:brightness-110 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {getTranslation('claimAll', language).replace(
                        '{n}',
                        String(claimableTierAchievementsCount)
                      )}
                    </span>
                  </button>
                )}
              </div>

              {/* List of achievements in Selected Tier */}
              <div className="p-3 sm:p-4 space-y-2.5">
                {currentTierAchievements.map((ach) => {
                  const isTierUnlocked = selectedTier <= playerStageTier;
                  const isCompleted = isTierUnlocked && (ach.progress >= ach.maxProgress || ach.unlocked);
                  const isClaimed = Boolean(ach.claimed);
                  const percentage = isTierUnlocked
                    ? Math.min(100, Math.floor((ach.progress / ach.maxProgress) * 100))
                    : 0;
                  const achLoc = LOCALIZED_ACHIEVEMENTS[ach.id]?.[language] || {
                    title: ach.title,
                    description: ach.description,
                  };

                  return (
                    <div
                      key={ach.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        isClaimed
                          ? 'bg-slate-950/40 border-slate-800/80 opacity-75'
                          : isCompleted
                          ? 'bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 border-amber-400/80 shadow-lg shadow-amber-500/15 ring-1 ring-amber-400/40'
                          : !isTierUnlocked
                          ? 'bg-slate-950/40 border-slate-800/60 opacity-80'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xl shrink-0 shadow-inner ${
                              isCompleted && !isClaimed
                                ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                                : 'bg-slate-800/90 border-slate-700/80'
                            }`}
                          >
                            {ach.icon}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-white truncate">
                              <span>{achLoc.title}</span>
                              {isClaimed && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              )}
                              {isCompleted && !isClaimed && (
                                <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 animate-pulse">
                                  {language === 'en' ? 'Claim' : language === 'ja' ? '受取可能' : language === 'zh-CN' ? '可领取' : '可領取'}
                                </span>
                              )}
                              {!isTierUnlocked && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-amber-400/90 border border-amber-500/30 flex items-center gap-0.5">
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>{language === 'en' ? 'Locked' : language === 'ja' ? '未開放' : language === 'zh-CN' ? '未解锁' : '未解鎖'}</span>
                                </span>
                              )}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                              {achLoc.description}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border shrink-0 font-mono ${
                            isCompleted && !isClaimed
                              ? 'text-amber-300 bg-amber-500/20 border-amber-400/50 shadow-sm'
                              : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                          }`}
                        >
                          <CoinIcon className="w-3.5 h-3.5" />
                          <span>+{ach.rewardCoins}</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2.5">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>{getTranslation('achProgressLabel', language)}</span>
                          <span className="font-mono">
                            {isTierUnlocked
                              ? `${Math.min(
                                  ach.maxProgress,
                                  Math.max(ach.progress, isCompleted ? ach.maxProgress : 0)
                                )} / ${ach.maxProgress}`
                              : `0 / ${ach.maxProgress}`}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
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

                      {/* Locked status banner when tier is not yet unlocked */}
                      {!isTierUnlocked && (
                        <div className="mt-2.5 w-full py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 font-bold text-[11px] flex items-center justify-center gap-1.5 select-none">
                          <Lock className="w-3 h-3 text-amber-500/70" />
                          <span>
                            {language === 'en'
                              ? `Unlocks at Stage ${ACHIEVEMENT_TIERS[selectedTier - 1]?.minLevel || 101} to start tracking`
                              : language === 'ja'
                              ? `ステージ ${ACHIEVEMENT_TIERS[selectedTier - 1]?.minLevel || 101} 到達で集計開始`
                              : language === 'zh-CN'
                              ? `通关至第 ${ACHIEVEMENT_TIERS[selectedTier - 1]?.minLevel || 101} 关后开启计算`
                              : `通關至第 ${ACHIEVEMENT_TIERS[selectedTier - 1]?.minLevel || 101} 關後開啟計算`}
                          </span>
                        </div>
                      )}

                      {/* Claim reward button (Only when tier is unlocked and completed!) */}
                      {isTierUnlocked && isCompleted && !isClaimed && (
                        <button
                          type="button"
                          onClick={() => {
                            onClaimAchievementReward(ach.id);
                          }}
                          className="mt-2.5 w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:brightness-110 active:scale-98 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Gift className="w-4 h-4 text-slate-950" />
                          <span>
                            {getTranslation('claimAchCoins', language).replace(
                              '{n}',
                              String(ach.rewardCoins)
                            )}
                          </span>
                        </button>
                      )}

                      {/* Claimed status badge */}
                      {isTierUnlocked && isClaimed && (
                        <div className="mt-2 py-1 text-center text-[10px] font-bold text-emerald-400/90 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>
                            {getTranslation('achClaimed', language) ||
                              (language === 'en'
                                ? '✓ Reward Claimed'
                                : language === 'ja'
                                ? '✓ 受取済み'
                                : language === 'zh-CN'
                                ? '✓ 成就奖励已领取'
                                : '✓ 成就獎勵已領取')}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Notice */}
            <div className="mt-auto shrink-0 px-4 py-2.5 bg-slate-950/70 border-t border-slate-800 text-[10px] text-slate-400 text-center">
              {getTranslation('achievementsFooterTip', language)}
            </div>
          </div>
        )}
      </CuteModalBackground>
    </div>
  );
};
