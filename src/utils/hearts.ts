export const HEART_REFILL_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
export const DEFAULT_STARTING_HEARTS = 5;
export const MAX_DAILY_ADS = 5; // 玩家每日最多只可以睇5次免費短片廣告

export interface HeartsState {
  hearts: number;
  maxHearts: number;
  lastHeartRefillTimestamp: number;
  nextRefillSeconds: number;
  totalRefillSeconds: number;
}

/**
 * Calculates current hearts and remaining countdown towards the next heart.
 * Regenerates +1 heart every 15 minutes ONLY when hearts < maxHearts (5).
 * When hearts reach or exceed 5 (via auto-refill, daily check-in, or rewards),
 * the countdown timer stops.
 */
export function calculateHearts(
  hearts: number,
  maxHearts: number = DEFAULT_STARTING_HEARTS,
  lastHeartRefillTimestamp: number = Date.now(),
  currentTime: number = Date.now()
): HeartsState {
  // If already at or above 5 hearts, auto-refill countdown must stop
  if (hearts >= maxHearts) {
    return {
      hearts,
      maxHearts,
      lastHeartRefillTimestamp: lastHeartRefillTimestamp || currentTime,
      nextRefillSeconds: 0,
      totalRefillSeconds: 0,
    };
  }

  const validLastTimestamp =
    typeof lastHeartRefillTimestamp === 'number' && !isNaN(lastHeartRefillTimestamp)
      ? Math.min(lastHeartRefillTimestamp, currentTime)
      : currentTime;

  const elapsed = Math.max(0, currentTime - validLastTimestamp);
  const heartsToRefill = Math.floor(elapsed / HEART_REFILL_INTERVAL_MS);

  if (heartsToRefill > 0) {
    const heartsNeeded = maxHearts - hearts;
    const actualHeartsAdded = Math.min(heartsToRefill, heartsNeeded);
    const newHearts = hearts + actualHeartsAdded;

    if (newHearts >= maxHearts) {
      return {
        hearts: maxHearts,
        maxHearts,
        lastHeartRefillTimestamp: currentTime,
        nextRefillSeconds: 0,
        totalRefillSeconds: 0,
      };
    }

    const updatedTimestamp = validLastTimestamp + actualHeartsAdded * HEART_REFILL_INTERVAL_MS;
    const remainingToNextMs = Math.max(0, HEART_REFILL_INTERVAL_MS - (currentTime - updatedTimestamp));
    const nextRefillSeconds = Math.ceil(remainingToNextMs / 1000);

    return {
      hearts: newHearts,
      maxHearts,
      lastHeartRefillTimestamp: updatedTimestamp,
      nextRefillSeconds,
      totalRefillSeconds: nextRefillSeconds,
    };
  }

  const remainingToNextMs = Math.max(0, HEART_REFILL_INTERVAL_MS - elapsed);
  const nextRefillSeconds = Math.ceil(remainingToNextMs / 1000);

  return {
    hearts,
    maxHearts,
    lastHeartRefillTimestamp: validLastTimestamp,
    nextRefillSeconds,
    totalRefillSeconds: nextRefillSeconds,
  };
}

/**
 * Formats seconds into MM:SS format (e.g., 14:59 or 03:08)
 */
export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats total seconds into a readable string (e.g., "14分 59秒" or "1小時 12分")
 */
export function formatReadableTime(seconds: number): string {
  if (seconds <= 0) return '已回滿';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}小時 ${mins}分`;
  }
  if (mins > 0) {
    return `${mins}分 ${secs}秒`;
  }
  return `${secs}秒`;
}
