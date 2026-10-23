import React, { useState, useMemo } from 'react';
import { PlayerProfile } from '../types';
import { soundEngine } from '../utils/audio';
import { Calendar, Check, Gift, Heart, Sparkles, X, Clock, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CuteModalBackground } from './CuteModalBackground';
import { CoinIcon } from './CoinIcon';
import {
  MonthlyDayReward,
  getDaysInMonth,
  getFirstDayOfWeek,
  getMonthlyRewards,
  getTodayDateString,
  getCurrentMonthString,
  isDailyCheckInAvailable,
  getCurrentCheckInDay,
  getClaimedDaysForMonth,
  getRewardLabel,
  MAKE_UP_CHECK_IN_COST,
} from '../utils/monthlyCheckInData';

import { SupportedLanguage, toSimplifiedChinese } from '../utils/i18n';

export type DailyReward = MonthlyDayReward;

export {
  getTodayDateString,
  isDailyCheckInAvailable,
  getCurrentCheckInDay,
  getDaysInMonth,
  getMonthlyRewards,
  getRewardLabel,
};

export const DAILY_REWARDS: DailyReward[] = getMonthlyRewards(
  new Date().getFullYear(),
  new Date().getMonth()
);

interface DailyCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  language?: SupportedLanguage;
  onUpdateProfile: React.Dispatch<React.SetStateAction<PlayerProfile>>;
}

export const DailyCheckInModal: React.FC<DailyCheckInModalProps> = ({
  isOpen,
  onClose,
  profile,
  language: propLang,
  onUpdateProfile,
}) => {
  const language = propLang || profile.language || 'zh-HK';
  const realToday = new Date();
  const [viewYear, setViewYear] = useState<number>(() => realToday.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => realToday.getMonth());
  const [claimedReward, setClaimedReward] = useState<DailyReward | null>(null);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [makeUpTargetDay, setMakeUpTargetDay] = useState<number | null>(null);

  if (!isOpen) return null;

  const todayStr = getTodayDateString();
  const realCurrentMonthStr = getCurrentMonthString(realToday);
  const viewMonthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const isViewingCurrentMonth = viewMonthStr === realCurrentMonthStr;

  const daysInViewMonth = getDaysInMonth(viewYear, viewMonth);
  const firstWeekday = getFirstDayOfWeek(viewYear, viewMonth);
  const monthlyRewards = getMonthlyRewards(viewYear, viewMonth);

  const realTodayDay = realToday.getDate();
  const claimedDaysInViewMonth = getClaimedDaysForMonth(profile, viewYear, viewMonth);
  const isClaimedToday = isViewingCurrentMonth
    ? profile.lastCheckInDate === todayStr || claimedDaysInViewMonth.includes(realTodayDay)
    : profile.lastCheckInDate === todayStr;

  const currentMonthRewards = getMonthlyRewards(realToday.getFullYear(), realToday.getMonth());
  const todayReward = currentMonthRewards[realTodayDay - 1] || currentMonthRewards[0];

  const handleClaim = (targetDay = realTodayDay) => {
    if (isClaimedToday) return;

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

    const reward = currentMonthRewards[targetDay - 1] || currentMonthRewards[0];
    setClaimedReward(reward);

    const prevMonthDays =
      profile.checkInMonth === realCurrentMonthStr && Array.isArray(profile.monthlyCheckIns)
        ? profile.monthlyCheckIns
        : [];
    const newClaimedDays = Array.from(new Set([...prevMonthDays, targetDay]));
    const nextStreak = (profile.checkInStreak || 0) + 1;

    onUpdateProfile((prev) => ({
      ...prev,
      coins: prev.coins + reward.coins,
      hearts: prev.hearts + reward.hearts,
      lastCheckInDate: todayStr,
      checkInMonth: realCurrentMonthStr,
      monthlyCheckIns: newClaimedDays,
      checkInStreak: nextStreak,
    }));

    setTimeout(() => {
      setClaimedReward(null);
    }, 3500);
  };

  const handleMakeUp = (dayNum: number) => {
    if (!isViewingCurrentMonth || dayNum >= realTodayDay || claimedDaysInViewMonth.includes(dayNum)) return;
    if (profile.coins < MAKE_UP_CHECK_IN_COST) {
      soundEngine.playHeartLoss();
      const notEnoughMsg =
        language === 'en'
          ? `Need ${MAKE_UP_CHECK_IN_COST} coins to makeup check-in!`
          : language === 'ja'
          ? `コインが${MAKE_UP_CHECK_IN_COST}枚不足しているため補填できません！`
          : language === 'zh-CN'
          ? `金币不足 ${MAKE_UP_CHECK_IN_COST} 枚，无法补签！`
          : `金幣不足 ${MAKE_UP_CHECK_IN_COST} 枚，無法補簽！`;
      setStatusToast(notEnoughMsg);
      setTimeout(() => setStatusToast(null), 2500);
      return;
    }

    soundEngine.playSpecialEat();
    soundEngine.haptic('success');

    const reward = monthlyRewards[dayNum - 1];
    if (!reward) return;

    setClaimedReward(reward);
    const prevMonthDays =
      profile.checkInMonth === realCurrentMonthStr && Array.isArray(profile.monthlyCheckIns)
        ? profile.monthlyCheckIns
        : [];
    const newClaimedDays = Array.from(new Set([...prevMonthDays, dayNum]));

    onUpdateProfile((prev) => ({
      ...prev,
      coins: prev.coins - MAKE_UP_CHECK_IN_COST + reward.coins,
      hearts: prev.hearts + reward.hearts,
      checkInMonth: realCurrentMonthStr,
      monthlyCheckIns: newClaimedDays,
    }));

    setMakeUpTargetDay(null);
    const successMakeupMsg =
      language === 'en'
        ? `Checked in for Day ${dayNum} successfully!`
        : language === 'ja'
        ? `${dayNum}日目の補填チェックイン成功！`
        : language === 'zh-CN'
        ? `补签成功！已补领第 ${dayNum} 天奖励`
        : `補簽成功！已補領第 ${dayNum} 天獎勵`;
    setStatusToast(successMakeupMsg);
    setTimeout(() => setStatusToast(null), 2500);
  };

  const headerTitle =
    language === 'en'
      ? 'Daily Check-In'
      : language === 'ja'
      ? '毎日ログイン'
      : language === 'zh-CN'
      ? '每日签到'
      : '每日簽到';

  const monthSubtitle =
    language === 'en'
      ? `${daysInViewMonth} Days this month · Monthly dynamic calendar`
      : language === 'ja'
      ? `今月全 ${daysInViewMonth} 日 · 月別カレンダー報酬`
      : language === 'zh-CN'
      ? `本月共 ${daysInViewMonth} 天 · 根据每月实际天数动态计算`
      : `本月共 ${daysInViewMonth} 日 · 根據每月實際日數動態計算`;

  const weekdayLabels =
    language === 'en'
      ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      : language === 'ja'
      ? ['日', '月', '火', '水', '木', '金', '土']
      : ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center p-3 sm:p-4 pt-[calc(max(env(safe-area-inset-top),0.5rem)+3rem)] sm:pt-[calc(max(env(safe-area-inset-top),0.5rem)+3.5rem)] pb-3 bg-gradient-to-b from-indigo-950/75 via-purple-950/75 to-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900/95 border border-amber-500/30 shadow-2xl shadow-amber-500/10 overflow-hidden flex flex-col max-h-[calc(100dvh-max(env(safe-area-inset-top),0.5rem)-4.2rem)]">
        <CuteModalBackground />

        {/* Header */}
        <div className="relative p-4 pb-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/30 text-slate-950">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-1.5">
                <span>{headerTitle}</span>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                  {viewYear} / {viewMonth + 1}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                {monthSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-3">
          {/* Success Banner */}
          {claimedReward && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border border-emerald-500/50 flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-200">
                  {language === 'en'
                    ? `Checked in! Received ${getRewardLabel(claimedReward, language)}`
                    : language === 'ja'
                    ? `チェックイン成功！${getRewardLabel(claimedReward, language)} を獲得`
                    : language === 'zh-CN'
                    ? `签到成功！获得 ${getRewardLabel(claimedReward, language)}`
                    : `簽到成功！獲得 ${getRewardLabel(claimedReward, language)}`}
                </span>
              </div>
              <span className="text-xs font-black text-emerald-400">
                {language === 'en' ? '✓ Claimed' : language === 'ja' ? '✓ 獲得済' : language === 'zh-CN' ? '✓ 已领取' : '✓ 已領取'}
              </span>
            </div>
          )}

          {/* Toast */}
          {statusToast && (
            <div className="p-2 rounded-xl bg-slate-800 border border-amber-400 text-amber-200 text-xs font-bold text-center">
              {statusToast}
            </div>
          )}

          {/* Month Switcher */}
          <div className="p-2 rounded-xl bg-slate-950/70 border border-amber-500/20 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 0) {
                  setViewYear((y) => y - 1);
                  setViewMonth(11);
                } else {
                  setViewMonth((m) => m - 1);
                }
              }}
              className="p-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <span>{viewYear}年 {viewMonth + 1}月</span>
              <span className="text-[10px] text-amber-300 font-mono">（{daysInViewMonth} {language === 'en' ? 'days' : language === 'ja' ? '日' : '天'}）</span>
            </span>
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 11) {
                  setViewYear((y) => y + 1);
                  setViewMonth(0);
                } else {
                  setViewMonth((m) => m + 1);
                }
              }}
              className="p-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 border-b border-slate-800 pb-1">
            {weekdayLabels.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <div key={`p-${i}`} className="h-11 rounded-lg bg-slate-950/20" />
            ))}

            {monthlyRewards.map((reward) => {
              const d = reward.day;
              const isClaimed = claimedDaysInViewMonth.includes(d);
              const isToday = isViewingCurrentMonth && d === realTodayDay;
              const isPastMissed = isViewingCurrentMonth && d < realTodayDay && !isClaimed;

              return (
                <button
                  key={`day-${d}`}
                  type="button"
                  onClick={() => {
                    if (isToday && !isClaimed) handleClaim(d);
                    else if (isPastMissed) setMakeUpTargetDay(d);
                  }}
                  className={`h-11 rounded-lg border p-0.5 flex flex-col items-center justify-between text-[9px] ${
                    reward.isGrandPrize
                      ? 'bg-amber-950/40 border-amber-400 text-amber-300'
                      : isClaimed
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : isToday && !isClaimed
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="font-bold">{d}</span>
                  {reward.isGrandPrize ? (
                    <span>👑</span>
                  ) : reward.hearts > 0 ? (
                    <span className="text-rose-400">❤️</span>
                  ) : (
                    <CoinIcon className="w-3 h-3" />
                  )}
                  <span className="font-mono text-[8px]">
                    {isClaimed
                      ? '✓'
                      : reward.isGrandPrize
                      ? (language === 'en' ? 'Grand' : language === 'ja' ? '大賞' : language === 'zh-CN' ? '大奖' : '大獎')
                      : reward.coins > 0
                      ? `+${reward.coins}`
                      : '+1❤️'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Make Up Confirmation */}
          {makeUpTargetDay !== null && (
            <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-400 flex items-center justify-between text-xs">
              <span className="text-white">
                {language === 'en'
                  ? `Make up Day ${makeUpTargetDay} for 30 Coins?`
                  : language === 'ja'
                  ? `${makeUpTargetDay}日目を補填（30コイン）しますか？`
                  : language === 'zh-CN'
                  ? `补签第 ${makeUpTargetDay} 天（花费 30 金币）？`
                  : `補簽第 ${makeUpTargetDay} 日（花費 30 金幣）？`}
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setMakeUpTargetDay(null)}
                  className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[11px]"
                >
                  {language === 'en' ? 'Cancel' : language === 'ja' ? 'キャンセル' : '取消'}
                </button>
                <button
                  type="button"
                  onClick={() => handleMakeUp(makeUpTargetDay)}
                  className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-bold text-[11px]"
                >
                  {language === 'en' ? 'Confirm' : language === 'ja' ? '補填する' : language === 'zh-CN' ? '确定补签' : '確定補簽'}
                </button>
              </div>
            </div>
          )}

          {/* Bottom Action Button */}
          {isViewingCurrentMonth ? (
            !isClaimedToday ? (
              <button
                type="button"
                onClick={() => handleClaim(realTodayDay)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Gift className="w-4 h-4" />
                <span>
                  {language === 'en'
                    ? `Claim Day ${realTodayDay} Reward Now`
                    : language === 'ja'
                    ? `本日 ${realTodayDay} 日目の報酬を受け取る`
                    : language === 'zh-CN'
                    ? `立即领取今日第 ${realTodayDay} 天奖励`
                    : `立即領取今日第 ${realTodayDay} 天獎勵`}
                </span>
              </button>
            ) : (
              <div className="w-full py-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center gap-2 text-xs text-emerald-400 font-bold">
                <Check className="w-4 h-4" />
                <span>
                  {language === 'en'
                    ? 'Checked in for today · Next unlocks at 00:00'
                    : language === 'ja'
                    ? '本日のログイン完了 · 明日 00:00 解放'
                    : language === 'zh-CN'
                    ? '今日已完成签到 · 明日 00:00 解锁'
                    : '今日已完成簽到 · 明日 00:00 解鎖'}
                </span>
              </div>
            )
          ) : (
            <button
              type="button"
              onClick={() => {
                setViewYear(realToday.getFullYear());
                setViewMonth(realToday.getMonth());
              }}
              className="w-full py-2 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-300 text-xs font-bold cursor-pointer"
            >
              {language === 'en' ? 'Back to Current Month' : language === 'ja' ? '今月に戻る' : language === 'zh-CN' ? '回到当月签到' : '回到當月簽到'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
