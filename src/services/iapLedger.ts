/**
 * Persistent IAP Transaction ID Ledger & Authoritative iOS Profile Store (V49)
 *
 * Design & Honest Architectural Boundaries:
 * 1. Single Authoritative Source of Truth:
 *    `STORAGE_PROFILE_KEY` (`snake_pro_profile_v2`) stores the player's Hearts/Coins
 *    balances, monotonic `profileRevision`, AND `iapTransactionLedger` in ONE JSON document.
 * 2. Synchronous Serialized iOS Profile Controller (`createIOSAuthoritativeProfileStore`):
 *    - Never depends on React State Updater execution timing or render cycles.
 *    - Every iOS mutation (spending Coins, AdMob +1 Heart, natural Heart refill, IAP grant,
 *      Reset Progress, etc.) executes synchronously against the single authoritative profile
 *      and increments `profileRevision` monotonically.
 *    - Stale React renders or delayed `useEffect` auto-saves CANNOT overwrite a newer
 *      `profileRevision` (even when both snapshots contain the exact same IAP ledger).
 * 3. No `Math.max()` Balance Merge:
 *    Balances are NEVER merged with stale localStorage snapshots via `Math.max()`.
 *    All updates apply strictly to the latest authoritative `PlayerProfile`, so normal
 *    spending (e.g. 100,000 -> spend 30,000 -> buy 50,000 = 120,000) is always exact.
 * 4. Backup-Only Standalone Ledger:
 *    `STORAGE_IAP_LEDGER_KEY` (`snake_pro_iap_ledger_v1`) is a secondary backup mirror ONLY.
 *    It is NEVER treated as standalone proof of fulfillment when the authoritative profile
 *    record lacks that `transactionId`.
 * 5. Read-Back Verification & Partial-Failure Safety:
 *    - Step 1: Write authoritative `STORAGE_PROFILE_KEY` (balance + revision + txId together)
 *      and synchronously read back & verify ALL three. If this fails, return `PERSIST_FAILED`
 *      so StoreKit `finishTransaction()` is withheld.
 *    - Step 2: Mirror to backup `STORAGE_IAP_LEDGER_KEY` and perform read-back verification.
 *      If backup write fails after authoritative profile succeeded, authoritative delivery
 *      is already safely persisted and verified (`backupSyncFailed: true`, self-healing later).
 * 6. Honest Limitation Notice:
 *    Browser/WKWebView `localStorage` does NOT provide true cross-key ACID transactions
 *    or server-side anti-cheat. Server-side receipt verification would require a backend
 *    using Apple App Store Server API v2.
 */

import type { IAPTransactionLedgerEntry, PlayerProfile } from '../types';
import { calculateHearts } from '../utils/hearts';

export const STORAGE_PROFILE_KEY = 'snake_pro_profile_v2';
export const STORAGE_IAP_LEDGER_KEY = 'snake_pro_iap_ledger_v1';

export type LedgerMap = Record<string, IAPTransactionLedgerEntry>;

function isStorageAvailable(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage !== null;
  } catch {
    return false;
  }
}

function isValidLedgerEntry(value: unknown): value is IAPTransactionLedgerEntry {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.transactionId === 'string' &&
    v.transactionId.length > 0 &&
    typeof v.productId === 'string' &&
    v.productId.length > 0 &&
    (v.category === 'HEARTS' || v.category === 'COINS') &&
    typeof v.grantedAmount === 'number' &&
    v.grantedAmount > 0 &&
    typeof v.grantedAt === 'number'
  );
}

/**
 * Safely read the monotonic profileRevision from any PlayerProfile (defaults to 0 for legacy saves).
 */
export function getProfileRevision(
  profile?: Pick<PlayerProfile, 'profileRevision'> | null
): number {
  const rev = profile?.profileRevision;
  if (typeof rev === 'number' && Number.isFinite(rev) && rev >= 0) {
    return Math.floor(rev);
  }
  return 0;
}

/**
 * Sanitize and normalize a raw ledger object from storage or legacy profile.
 */
export function sanitizeLedger(raw: unknown): LedgerMap {
  const result: LedgerMap = {};
  if (!raw || typeof raw !== 'object') return result;
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (isValidLedgerEntry(val)) {
      result[val.transactionId || key] = val;
    }
  }
  return result;
}

/**
 * Load the authoritative persisted PlayerProfile from STORAGE_PROFILE_KEY (if present).
 */
export function loadAuthoritativeProfileFromStorage(): PlayerProfile | null {
  if (!isStorageAvailable()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as PlayerProfile;
  } catch {
    return null;
  }
}

/**
 * Load secondary backup ledger from STORAGE_IAP_LEDGER_KEY.
 * IMPORTANT: Backup-only! Never use this alone as authoritative proof of delivery.
 */
export function loadBackupLedger(): LedgerMap {
  if (!isStorageAvailable()) return {};
  try {
    const raw = localStorage.getItem(STORAGE_IAP_LEDGER_KEY);
    if (!raw) return {};
    return sanitizeLedger(JSON.parse(raw));
  } catch {
    return {};
  }
}

/**
 * Backward-compatible alias for backup ledger inspection.
 */
export const loadStandaloneLedger = loadBackupLedger;

/**
 * Persist and read-back verify the secondary backup ledger mirror.
 */
export function syncBackupLedgerWithVerification(
  ledger: LedgerMap,
  requiredTxId?: string
): { ok: boolean; error?: string } {
  if (!isStorageAvailable()) {
    return { ok: false, error: 'Storage unavailable for backup ledger' };
  }
  try {
    const sanitized = sanitizeLedger(ledger);
    localStorage.setItem(STORAGE_IAP_LEDGER_KEY, JSON.stringify(sanitized));

    const verifiedRaw = localStorage.getItem(STORAGE_IAP_LEDGER_KEY);
    if (!verifiedRaw) {
      return { ok: false, error: 'Backup ledger read-back verification failed (empty)' };
    }
    const verifiedParsed = sanitizeLedger(JSON.parse(verifiedRaw));
    if (requiredTxId && !verifiedParsed[requiredTxId]) {
      return { ok: false, error: `Backup ledger read-back missing txId ${requiredTxId}` };
    }
    for (const txId of Object.keys(sanitized)) {
      if (!verifiedParsed[txId]) {
        return { ok: false, error: `Backup ledger read-back incomplete for txId ${txId}` };
      }
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Backup ledger write failed' };
  }
}

/**
 * Returns the canonical AUTHORITATIVE ledger derived strictly from:
 * - the authoritative in-memory profile's `iapTransactionLedger`, and
 * - the authoritative persisted `STORAGE_PROFILE_KEY` profile's `iapTransactionLedger`.
 *
 * Backup-only `STORAGE_IAP_LEDGER_KEY` entries without authoritative profile evidence
 * are NEVER treated as proof of delivery.
 */
export function getAuthoritativeLedger(
  profile?: Pick<PlayerProfile, 'iapTransactionLedger'> | null
): LedgerMap {
  const fromInMemoryProfile = sanitizeLedger(profile?.iapTransactionLedger);
  const persistedProfile = loadAuthoritativeProfileFromStorage();
  const fromPersistedProfile = sanitizeLedger(persistedProfile?.iapTransactionLedger);
  return {
    ...fromPersistedProfile,
    ...fromInMemoryProfile,
  };
}

/**
 * Canonical ledger helper for profile loading / migration (V47/V48 -> V49 backward compatible).
 * Uses ONLY authoritative profile ledger entries.
 */
export function getMergedLedger(
  profile?: Pick<PlayerProfile, 'iapTransactionLedger'> | null
): LedgerMap {
  return getAuthoritativeLedger(profile);
}

/**
 * Returns true ONLY if the given transactionId has authoritative fulfillment evidence
 * in the authoritative PlayerProfile record (in-memory or persisted STORAGE_PROFILE_KEY).
 *
 * If an entry exists ONLY in the backup ledger without authoritative profile evidence,
 * logs a diagnostic warning and returns false so a paid unfinished transaction is never lost.
 */
export function isTransactionAlreadyGranted(
  transactionId: string,
  profile?: Pick<PlayerProfile, 'iapTransactionLedger'> | null
): boolean {
  if (!transactionId) return false;
  const normalized = String(transactionId).trim();
  if (!normalized) return false;

  const authoritative = getAuthoritativeLedger(profile);
  if (authoritative[normalized]) {
    return true;
  }

  const backup = loadBackupLedger();
  if (backup[normalized]) {
    console.warn(
      `[IAPLedger] Transaction ${normalized} found ONLY in backup ledger without authoritative profile delivery record; will NOT treat backup alone as fulfilled.`
    );
  }
  return false;
}

export interface SafeSaveResult {
  saved: boolean;
  skippedStaleSnapshot?: boolean;
  reason?: 'STALE_LEDGER' | 'STALE_REVISION';
  error?: string;
}

/**
 * Safe persistence helper for iOS PlayerProfile writes (including React `useEffect([profile])`).
 * Guards BOTH:
 * 1. Ledger completeness — refuses to drop any committed IAP transaction ID present in storage.
 * 2. Monotonic `profileRevision` — refuses to let an older revision overwrite a newer revision
 *    EVEN WHEN both snapshots contain the exact same IAP ledger!
 */
export function saveProfileSafelyForIOS(profile: PlayerProfile): SafeSaveResult {
  if (!isStorageAvailable()) {
    return { saved: false, error: 'Storage unavailable' };
  }
  try {
    const persisted = loadAuthoritativeProfileFromStorage();
    const persistedLedger = sanitizeLedger(persisted?.iapTransactionLedger);
    const incomingLedger = sanitizeLedger(profile.iapTransactionLedger);

    // Guard 1: Never drop any committed IAP txId already persisted in STORAGE_PROFILE_KEY
    for (const txId of Object.keys(persistedLedger)) {
      if (!incomingLedger[txId]) {
        console.warn(
          `[IAPLedger] Blocked stale auto-save that would overwrite committed IAP transaction ${txId}.`
        );
        return { saved: false, skippedStaleSnapshot: true, reason: 'STALE_LEDGER' };
      }
    }

    // Guard 2: Never allow a lower monotonic profileRevision to overwrite a higher revision
    // (protects spending, ad rewards, natural refills, and resets even with identical ledgers)
    const persistedRevision = getProfileRevision(persisted);
    const incomingRevision = getProfileRevision(profile);
    if (persisted && incomingRevision < persistedRevision) {
      console.warn(
        `[IAPLedger] Blocked stale auto-save with older profileRevision (${incomingRevision} < ${persistedRevision}).`
      );
      return { saved: false, skippedStaleSnapshot: true, reason: 'STALE_REVISION' };
    }

    localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));

    // Opportunistically heal backup ledger if it fell behind authoritative profile
    if (Object.keys(incomingLedger).length > 0) {
      const backup = loadBackupLedger();
      const backupMissingAny = Object.keys(incomingLedger).some((id) => !backup[id]);
      if (backupMissingAny) {
        syncBackupLedgerWithVerification(incomingLedger);
      }
    }

    return { saved: true };
  } catch (err: any) {
    return { saved: false, error: err?.message || 'Storage write failed' };
  }
}

export interface AtomicGrantResult {
  status: 'GRANTED' | 'DUPLICATE' | 'PERSIST_FAILED';
  nextProfile?: PlayerProfile;
  /** True when authoritative profile persisted & verified, but secondary backup ledger mirror failed */
  backupSyncFailed?: boolean;
  backupError?: string;
  error?: string;
}

/**
 * Persists consumable Hearts or Coins, incremented `profileRevision`, AND the Transaction ID
 * together in the single authoritative `STORAGE_PROFILE_KEY` record, verifies read-back
 * synchronously, and then mirrors & read-back verifies the secondary backup ledger.
 *
 * Strictly uses `currentProfile` as the single authoritative latest profile state
 * (NO `Math.max()` balance merge with stale localStorage snapshots).
 *
 * Only when status === 'GRANTED' (or 'DUPLICATE') is it safe to call StoreKit finishTransaction().
 */
export function commitConsumableGrantAtomically(
  currentProfile: PlayerProfile,
  entry: IAPTransactionLedgerEntry
): AtomicGrantResult {
  const txId = String(entry.transactionId || '').trim();
  if (!txId) {
    return { status: 'PERSIST_FAILED', error: 'Missing transactionId' };
  }
  if (!Number.isFinite(entry.grantedAmount) || entry.grantedAmount <= 0) {
    return { status: 'PERSIST_FAILED', error: 'Invalid grantedAmount' };
  }

  // Check authoritative persisted storage first for an already-committed txId
  // (handles crash between authoritative profile write and finishTransaction / backup write)
  const persistedProfile = loadAuthoritativeProfileFromStorage();
  const persistedLedger = sanitizeLedger(persistedProfile?.iapTransactionLedger);
  const inMemoryLedger = sanitizeLedger(currentProfile.iapTransactionLedger);
  const highestKnownRevision = Math.max(
    getProfileRevision(currentProfile),
    getProfileRevision(persistedProfile)
  );

  if (persistedLedger[txId] || inMemoryLedger[txId]) {
    const authoritativeLedger: LedgerMap = {
      ...persistedLedger,
      ...inMemoryLedger,
    };
    // Ensure backup ledger mirror is healed if a crash happened between profile write & backup write
    syncBackupLedgerWithVerification(authoritativeLedger, txId);

    const authoritativeProfile: PlayerProfile =
      persistedLedger[txId] && !inMemoryLedger[txId] && persistedProfile
        ? {
            ...currentProfile,
            ...persistedProfile,
            iapTransactionLedger: authoritativeLedger,
            profileRevision: highestKnownRevision,
          }
        : {
            ...currentProfile,
            iapTransactionLedger: authoritativeLedger,
            profileRevision: highestKnownRevision,
          };

    return { status: 'DUPLICATE', nextProfile: authoritativeProfile };
  }

  // Single authoritative source of truth: NEVER use Math.max() against stale localStorage!
  // Preserve every non-balance field (levels, skins, arenas, missions, settings, etc.) intact.
  const authoritativeLedger: LedgerMap = {
    ...persistedLedger,
    ...inMemoryLedger,
    [txId]: {
      ...entry,
      transactionId: txId,
    },
  };

  // Never cap/truncate purchased hearts to maxHearts!
  const currentHearts =
    typeof currentProfile.hearts === 'number' && Number.isFinite(currentProfile.hearts)
      ? currentProfile.hearts
      : 5;
  const currentCoins =
    typeof currentProfile.coins === 'number' && Number.isFinite(currentProfile.coins)
      ? currentProfile.coins
      : 0;

  const nextRevision = highestKnownRevision + 1;
  const nextProfile: PlayerProfile = {
    ...currentProfile,
    hearts: entry.category === 'HEARTS' ? currentHearts + entry.grantedAmount : currentHearts,
    coins: entry.category === 'COINS' ? currentCoins + entry.grantedAmount : currentCoins,
    iapTransactionLedger: authoritativeLedger,
    profileRevision: nextRevision,
  };

  if (!isStorageAvailable()) {
    return { status: 'PERSIST_FAILED', error: 'Persistent storage unavailable' };
  }

  try {
    // 1. Write the single AUTHORITATIVE record (updated balance + monotonic revision + txId) FIRST.
    const serializedProfile = JSON.stringify(nextProfile);
    localStorage.setItem(STORAGE_PROFILE_KEY, serializedProfile);

    // 2. Synchronous read-back verification of the authoritative record.
    const verifiedProfileRaw = localStorage.getItem(STORAGE_PROFILE_KEY);
    if (!verifiedProfileRaw) {
      return { status: 'PERSIST_FAILED', error: 'Profile persistence verification failed (empty)' };
    }
    const verifiedProfile = JSON.parse(verifiedProfileRaw) as Partial<PlayerProfile>;
    const verifiedEntry = verifiedProfile?.iapTransactionLedger?.[txId];
    if (
      !verifiedEntry ||
      verifiedEntry.transactionId !== txId ||
      verifiedEntry.productId !== entry.productId ||
      verifiedEntry.grantedAmount !== entry.grantedAmount
    ) {
      return { status: 'PERSIST_FAILED', error: 'Profile ledger verification failed' };
    }
    if (verifiedProfile.hearts !== nextProfile.hearts) {
      return { status: 'PERSIST_FAILED', error: 'Hearts balance verification failed' };
    }
    if (verifiedProfile.coins !== nextProfile.coins) {
      return { status: 'PERSIST_FAILED', error: 'Coins balance verification failed' };
    }
    if (getProfileRevision(verifiedProfile) !== nextRevision) {
      return { status: 'PERSIST_FAILED', error: 'Profile revision verification failed' };
    }

    // 3. Mirror to backup standalone ledger AND verify read-back.
    //    If this secondary backup write fails after the authoritative profile write succeeded,
    //    the player's delivery IS already safely recorded in STORAGE_PROFILE_KEY.
    const backupResult = syncBackupLedgerWithVerification(authoritativeLedger, txId);
    if (!backupResult.ok) {
      console.warn(
        '[IAPLedger] Authoritative profile write verified, but backup ledger sync failed (will self-heal):',
        backupResult.error
      );
      return {
        status: 'GRANTED',
        nextProfile,
        backupSyncFailed: true,
        backupError: backupResult.error,
      };
    }

    return {
      status: 'GRANTED',
      nextProfile,
      backupSyncFailed: false,
    };
  } catch (err: any) {
    return {
      status: 'PERSIST_FAILED',
      error: err?.message || 'Storage write failed',
    };
  }
}

/**
 * Builds the reset PlayerProfile when the user confirms "Reset Local Progress".
 * - iOS: Preserves current Hearts balance (never truncated by maxHearts: 5), current Coins
 *   balance, and authoritative IAP Transaction Ledger, and bumps monotonic `profileRevision`
 *   so purchased items are protected and pre-reset stale snapshots cannot overwrite the reset.
 * - Android / Web: Retains exact existing legacy reset behavior (hearts: 5, coins: 0).
 */
export function buildResetPlayerProfile(
  currentProfile: PlayerProfile,
  resetBase: PlayerProfile,
  isIOS: boolean
): PlayerProfile {
  const preservedLedger = getAuthoritativeLedger(currentProfile);

  if (isIOS) {
    const persisted = loadAuthoritativeProfileFromStorage();
    const nextRevision =
      Math.max(getProfileRevision(currentProfile), getProfileRevision(persisted)) + 1;
    const preservedHearts =
      typeof currentProfile.hearts === 'number' &&
      Number.isFinite(currentProfile.hearts) &&
      currentProfile.hearts >= 0
        ? currentProfile.hearts
        : 5;
    const preservedCoins =
      typeof currentProfile.coins === 'number' &&
      Number.isFinite(currentProfile.coins) &&
      currentProfile.coins >= 0
        ? currentProfile.coins
        : 0;

    return {
      ...resetBase,
      hearts: preservedHearts,
      maxHearts: 5,
      lastHeartRefillTimestamp:
        preservedHearts < 5
          ? currentProfile.lastHeartRefillTimestamp || Date.now()
          : Date.now(),
      coins: preservedCoins,
      iapTransactionLedger: preservedLedger,
      profileRevision: nextRevision,
    };
  }

  // Android / Web: preserve exact existing behavior
  return {
    ...resetBase,
    hearts: 5,
    maxHearts: 5,
    coins: 0,
    iapTransactionLedger: preservedLedger,
  };
}

export type ProfileUpdateAction =
  | PlayerProfile
  | ((prev: PlayerProfile) => PlayerProfile);

export interface IOSAuthoritativeProfileStore {
  /** Synchronously returns the single authoritative latest PlayerProfile */
  getSnapshot(): PlayerProfile;
  /** Synchronously returns the current monotonic profileRevision */
  getRevision(): number;
  /**
   * Synchronously applies a state update against the authoritative profile and increments
   * `profileRevision`. Rejects stale direct-object overwrites that carry a lower revision or
   * drop committed IAP ledger entries.
   */
  applyUpdate(
    action: ProfileUpdateAction,
    options?: { persistImmediately?: boolean }
  ): PlayerProfile;
  /**
   * Synchronously commits a verified consumable IAP grant directly against the authoritative
   * profile and verifies persistence read-back. Does NOT depend on React render cycles.
   */
  commitIAPGrant(entry: IAPTransactionLedgerEntry): AtomicGrantResult;
  /**
   * Synchronously applies a natural heart refill calculation against the authoritative profile
   * without truncating purchased hearts (> maxHearts) or racing with IAP grants.
   */
  applyNaturalHeartRefill(nowMs?: number): PlayerProfile;
  /**
   * Synchronously applies a rewarded ad +1 Heart grant (up to dailyCap, default 5/day)
   * directly against the authoritative profile.
   */
  applyAdRewardHeart(
    todayStr: string,
    dailyCap?: number
  ): { rewarded: boolean; profile: PlayerProfile };
  /**
   * Synchronously resets iOS gameplay progression while preserving current Hearts, Coins,
   * authoritative IAP Transaction Ledger, and advancing `profileRevision`.
   */
  resetProgress(resetBase: PlayerProfile): PlayerProfile;
  /**
   * Guards delayed React `useEffect([profile])` auto-saves: immediately skips any snapshot
   * whose `profileRevision` lags behind the authoritative store, then delegates to
   * `saveProfileSafelyForIOS()`.
   */
  persistIfCurrent(snapshot: PlayerProfile): SafeSaveResult;
}

/**
 * Creates the single authoritative, synchronous, revision-controlled PlayerProfile store
 * used on iOS by `src/App.tsx`.
 *
 * Guarantees:
 * - Zero reliance on React state updater scheduling or re-render timing.
 * - Stale React renders or delayed effects can NEVER downgrade `current` or `STORAGE_PROFILE_KEY`.
 * - All Coins/Hearts spending, AdMob rewards, natural refills, IAP grants, and Reset Progress
 *   execute sequentially on the exact same authoritative object.
 */
export function createIOSAuthoritativeProfileStore(
  initialProfile: PlayerProfile,
  options?: { onChange?: (next: PlayerProfile) => void }
): IOSAuthoritativeProfileStore {
  const persisted = loadAuthoritativeProfileFromStorage();
  const initialRevision = Math.max(
    getProfileRevision(initialProfile),
    getProfileRevision(persisted)
  );

  let current: PlayerProfile = {
    ...initialProfile,
    iapTransactionLedger: getAuthoritativeLedger(initialProfile),
    profileRevision: initialRevision,
  };

  const notify = (next: PlayerProfile) => {
    try {
      options?.onChange?.(next);
    } catch (err) {
      console.warn('[IOSProfileStore] onChange listener error:', err);
    }
  };

  const applyUpdate = (
    action: ProfileUpdateAction,
    updateOpts?: { persistImmediately?: boolean }
  ): PlayerProfile => {
    const prev = current;
    const prevRevision = getProfileRevision(prev);

    if (typeof action !== 'function') {
      const candidate = action;
      const candidateRev = getProfileRevision(candidate);
      const currentLedger = sanitizeLedger(prev.iapTransactionLedger);
      const candidateLedger = sanitizeLedger(candidate.iapTransactionLedger);

      // Block stale direct object overwrites (lower revision or missing committed txId)
      if (candidateRev < prevRevision) {
        console.warn(
          `[IOSProfileStore] Blocked stale direct profile update (rev ${candidateRev} < ${prevRevision}).`
        );
        return prev;
      }
      for (const txId of Object.keys(currentLedger)) {
        if (!candidateLedger[txId]) {
          console.warn(
            `[IOSProfileStore] Blocked direct profile update missing committed txId ${txId}.`
          );
          return prev;
        }
      }
      if (candidate === prev) {
        return prev;
      }

      const persistedNow = loadAuthoritativeProfileFromStorage();
      const nextRevision =
        Math.max(prevRevision, candidateRev, getProfileRevision(persistedNow)) + 1;
      const next: PlayerProfile = {
        ...candidate,
        iapTransactionLedger: {
          ...currentLedger,
          ...candidateLedger,
        },
        profileRevision: nextRevision,
      };
      current = next;
      if (updateOpts?.persistImmediately) {
        saveProfileSafelyForIOS(next);
      }
      notify(next);
      return next;
    }

    const rawNext = action(prev);
    if (rawNext === prev) {
      return prev;
    }

    const currentLedger = sanitizeLedger(prev.iapTransactionLedger);
    const nextLedger = sanitizeLedger(rawNext.iapTransactionLedger);
    const persistedNow = loadAuthoritativeProfileFromStorage();
    const nextRevision =
      Math.max(
        prevRevision,
        getProfileRevision(rawNext),
        getProfileRevision(persistedNow)
      ) + 1;

    const next: PlayerProfile = {
      ...rawNext,
      iapTransactionLedger: {
        ...currentLedger,
        ...nextLedger,
      },
      profileRevision: nextRevision,
    };

    current = next;
    if (updateOpts?.persistImmediately) {
      saveProfileSafelyForIOS(next);
    }
    notify(next);
    return next;
  };

  return {
    getSnapshot: () => current,
    getRevision: () => getProfileRevision(current),
    applyUpdate,

    commitIAPGrant(entry: IAPTransactionLedgerEntry): AtomicGrantResult {
      const result = commitConsumableGrantAtomically(current, entry);
      if ((result.status === 'GRANTED' || result.status === 'DUPLICATE') && result.nextProfile) {
        const nextRev = getProfileRevision(result.nextProfile);
        const curRev = getProfileRevision(current);
        // Never downgrade current in-memory revision on duplicate check
        if (result.status === 'GRANTED' || nextRev >= curRev) {
          current = result.nextProfile;
          notify(result.nextProfile);
        }
      }
      return result;
    },

    applyNaturalHeartRefill(nowMs: number = Date.now()): PlayerProfile {
      return applyUpdate((prev) => {
        const currentHearts = typeof prev.hearts === 'number' ? prev.hearts : 5;
        const maxH = prev.maxHearts || 5;
        const lastTs = prev.lastHeartRefillTimestamp || nowMs;
        const calc = calculateHearts(currentHearts, maxH, lastTs, nowMs);
        const safeHearts = Math.max(currentHearts, calc.hearts);
        if (safeHearts === currentHearts && calc.lastHeartRefillTimestamp === prev.lastHeartRefillTimestamp) {
          return prev;
        }
        return {
          ...prev,
          hearts: safeHearts,
          lastHeartRefillTimestamp: calc.lastHeartRefillTimestamp,
        };
      });
    },

    applyAdRewardHeart(
      todayStr: string,
      dailyCap: number = 5
    ): { rewarded: boolean; profile: PlayerProfile } {
      let rewarded = false;
      const next = applyUpdate((prev) => {
        const isNewDay = prev.dailyAdWatchDate !== todayStr;
        const currentCount = isNewDay ? 0 : prev.dailyAdWatchCount || 0;
        if (currentCount >= dailyCap) {
          return prev;
        }
        rewarded = true;
        return {
          ...prev,
          dailyAdWatchDate: todayStr,
          dailyAdWatchCount: currentCount + 1,
          hearts: (typeof prev.hearts === 'number' ? prev.hearts : 5) + 1,
        };
      });
      return { rewarded, profile: next };
    },

    resetProgress(resetBase: PlayerProfile): PlayerProfile {
      const fresh = buildResetPlayerProfile(current, resetBase, true);
      current = fresh;
      saveProfileSafelyForIOS(fresh);
      notify(fresh);
      return fresh;
    },

    persistIfCurrent(snapshot: PlayerProfile): SafeSaveResult {
      const snapshotRev = getProfileRevision(snapshot);
      const currentRev = getProfileRevision(current);
      if (snapshotRev < currentRev) {
        console.warn(
          `[IOSProfileStore] Skipped stale React auto-save (snapshot rev ${snapshotRev} < authoritative rev ${currentRev}).`
        );
        return { saved: false, skippedStaleSnapshot: true, reason: 'STALE_REVISION' };
      }
      return saveProfileSafelyForIOS(snapshot);
    },
  };
}
