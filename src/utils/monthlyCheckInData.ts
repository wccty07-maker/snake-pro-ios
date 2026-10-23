import { PlayerProfile } from '../types';
import { SupportedLanguage } from './i18n';

export interface MonthlyDayReward {
  day: number;
  coins: number;
  hearts: number;
  isGrandPrize?: boolean;
  isMilestone?: boolean;
  milestoneTitle?: string;
}

/**
 * Returns number of days in given year and month.
 * monthIndex is 0-indexed (0 = Jan, 1 = Feb, ..., 11 = Dec).
 * e.g., 2026/08 (Sep) has 30 days, 2026/01 (Feb) has 28 days, 2026/09 (Oct) has 31 days.
 */
export const getDaysInMonth = (year: number, monthIndex: number): number => {
  return new Date(year, monthIndex + 1, 0).getDate();
};

/**
 * Returns weekday index of 1st day of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
 */
export const getFirstDayOfWeek = (year: number, monthIndex: number): number => {
  return new Date(year, monthIndex, 1).getDay();
};

/**
 * Generates the rewards list specifically tailored for this month's exact total days (28, 29, 30, or 31).
 * The final day of the month is ALWAYS the Grand Prize (大獎 👑)!
 */
export const getMonthlyRewards = (year: number, monthIndex: number): MonthlyDayReward[] => {
  const totalDays = getDaysInMonth(year, monthIndex);
  const rewards: MonthlyDayReward[] = [];

  for (let d = 1; d <= totalDays; d++) {
    const isLastDay = d === totalDays;

    if (isLastDay) {
      // Month-end Ultimate Grand Prize (adapts to whether month has 28, 29, 30, or 31 days)
      rewards.push({
        day: d,
        coins: 1000,
        hearts: 5,
        isGrandPrize: true,
        milestoneTitle: '月底終極大獎',
      });
      continue;
    }

    // Weekly Milestones
    if (d === 7) {
      rewards.push({
        day: d,
        coins: 250,
        hearts: 2,
        isMilestone: true,
        milestoneTitle: '第 1 週大禮包',
      });
    } else if (d === 14) {
      rewards.push({
        day: d,
        coins: 400,
        hearts: 3,
        isMilestone: true,
        milestoneTitle: '第 2 週大禮包',
      });
    } else if (d === 21) {
      rewards.push({
        day: d,
        coins: 550,
        hearts: 3,
        isMilestone: true,
        milestoneTitle: '第 3 週大禮包',
      });
    } else if (d === 28) {
      // If month has 29, 30, or 31 days, day 28 is the 4th week milestone
      rewards.push({
        day: d,
        coins: 700,
        hearts: 4,
        isMilestone: true,
        milestoneTitle: '第 4 週大禮包',
      });
    } else {
      // Regular rotating day rewards with escalating value
      const cycle = d % 6;
      let coins = 0;
      let hearts = 0;

      switch (cycle) {
        case 1:
          coins = 60 + Math.floor(d / 4) * 15;
          break;
        case 2:
          hearts = 1;
          break;
        case 3:
          coins = 90 + Math.floor(d / 4) * 20;
          break;
        case 4:
          hearts = d >= 16 ? 2 : 1;
          break;
        case 5:
          coins = 120 + Math.floor(d / 4) * 25;
          break;
        case 0:
          hearts = 2;
          coins = 50;
          break;
      }

      rewards.push({
        day: d,
        coins,
        hearts,
      });
    }
  }

  return rewards;
};

export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getYesterdayDateString = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCurrentMonthString = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const isDailyCheckInAvailable = (profile: PlayerProfile): boolean => {
  const today = getTodayDateString();
  return profile.lastCheckInDate !== today;
};

export const getCurrentCheckInDay = (profile: PlayerProfile): number => {
  const now = new Date();
  return now.getDate();
};

export const MAKE_UP_CHECK_IN_COST = 30; // Cost in coins to make up a missed past day

export const getClaimedDaysForMonth = (
  profile: PlayerProfile,
  year: number,
  monthIndex: number
): number[] => {
  const targetMonthStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  const currentMonthStr = getCurrentMonthString();

  if (profile.checkInMonth === targetMonthStr && Array.isArray(profile.monthlyCheckIns)) {
    return profile.monthlyCheckIns;
  }

  // Backward compatibility / migration if monthlyCheckIns is not yet set
  if (profile.lastCheckInDate && profile.lastCheckInDate.startsWith(targetMonthStr)) {
    const day = parseInt(profile.lastCheckInDate.split('-')[2], 10);
    if (!isNaN(day)) {
      return [day];
    }
  }

  // If not this month or no records yet
  return [];
};

export const getRewardLabel = (reward: MonthlyDayReward, language: SupportedLanguage): string => {
  if (reward.isGrandPrize) {
    if (language === 'en') return `${reward.coins} Coins + ${reward.hearts} Hearts (Grand Prize)`;
    if (language === 'ja') return `${reward.coins}コイン + ${reward.hearts}ハート (大賞)`;
    if (language === 'zh-CN') return `${reward.coins} 金币 + ${reward.hearts} 爱心 (终极大奖)`;
    return `${reward.coins} 金幣 + ${reward.hearts} 愛心 (終極大獎)`;
  }
  if (reward.coins > 0 && reward.hearts > 0) {
    if (language === 'en') return `${reward.coins} Coins + ${reward.hearts} Hearts`;
    if (language === 'ja') return `${reward.coins}コイン + ${reward.hearts}ハート`;
    if (language === 'zh-CN') return `${reward.coins} 金币 + ${reward.hearts} 爱心`;
    return `${reward.coins} 金幣 + ${reward.hearts} 愛心`;
  }
  if (reward.coins > 0) {
    if (language === 'en') return `${reward.coins} Coins`;
    if (language === 'ja') return `${reward.coins} コイン`;
    if (language === 'zh-CN') return `${reward.coins} 金币`;
    return `${reward.coins} 金幣`;
  }
  if (reward.hearts > 0) {
    if (language === 'en') return `${reward.hearts} Heart${reward.hearts > 1 ? 's' : ''}`;
    if (language === 'ja') return `${reward.hearts} ハート`;
    if (language === 'zh-CN') return `${reward.hearts} 颗爱心`;
    return `${reward.hearts} 顆愛心`;
  }
  return '';
};
