/**
 * Google AdMob 獎勵影片服務橋接模組
 * 支援 Capacitor 原生雙平台 (@capacitor-community/admob)
 *
 * 平台隔離原則：
 * - Android：完全保留既有 AdMob 初始化、預載與播放行為。
 * - iOS：
 *   1. 整合 Google UMP Consent 流程（每次啟動更新 consent info，僅於 canRequestAds === true 時載入廣告）。
 *   2. 支援 Settings 內的 Privacy Options Form（當 privacyOptionsRequirementStatus === REQUIRED）。
 *   3. 統一採用不進行跨 App 追蹤策略：固定傳遞 npa: true（非個人化廣告），絕不主動請求 ATT 授權，
 *      絕不讀取 IDFA 或因 ATT 狀態切換為個人化廣告。
 *   4. 僅接駁 Rewarded Ad（Reward: 1 Heart），嚴格保證每次有效觀看只派發一次，
 *      正確處理 Rewarded / Dismissed 順序競態、提早關閉、No Fill、逾時與完整 Listener 清理。
 */
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import {
  AdMob,
  AdmobConsentDebugGeography,
  AdmobConsentStatus,
  RewardAdPluginEvents,
  type AdmobConsentInfo,
} from '@capacitor-community/admob';
import { ADMOB_CONFIG } from '../config/admobConfig';

// 檢測是否在 Capacitor 原生環境 (Android / iOS)
export const isCapacitorNative = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Capacitor.isNativePlatform();
};

// 取得當前原生平台 ('android' | 'ios' | 'web')
export const getNativePlatform = (): 'android' | 'ios' | 'web' => {
  if (typeof window === 'undefined') return 'web';
  const platform = Capacitor.getPlatform();
  if (platform === 'android' || platform === 'ios') return platform;
  return 'web';
};

export interface AdShowResult {
  success: boolean;
  playedNativeAd: boolean;
  /** Strictly true ONLY when a valid native Rewarded callback / resolution fired for this session */
  rewardEarned?: boolean;
  reason?:
    | 'SUCCESS'
    | 'NO_PLUGIN'
    | 'NOT_NATIVE'
    | 'CONSENT_REQUIRED'
    | 'NO_FILL'
    | 'FAILED_TO_LOAD'
    | 'FAILED_TO_SHOW'
    | 'USER_DISMISSED'
    | 'TIMEOUT'
    | 'ALREADY_LOADING';
}

export interface IOSConsentState {
  checked: boolean;
  canRequestAds: boolean;
  privacyOptionsRequired: boolean;
  status: AdmobConsentStatus;
}

export type IOSConsentListener = (state: IOSConsentState) => void;

const IOS_PREPARE_TIMEOUT_MS = 15000;
const IOS_SHOW_OVERALL_TIMEOUT_MS = 90000;
const IOS_DISMISS_GRACE_AFTER_DISMISS_MS = 250;
const IOS_POST_REWARD_DISMISS_FALLBACK_MS = 5000;

class AdMobManager {
  private isInitialized = false;
  private isAdLoading = false;
  private isAdPrepared = false;
  private prepareInFlight: Promise<boolean> | null = null;
  private lastLoadFailureReason: 'NO_FILL' | 'FAILED_TO_LOAD' | 'TIMEOUT' | null = null;

  // iOS UMP Consent state
  private iosConsentState: IOSConsentState = {
    checked: false,
    canRequestAds: false,
    privacyOptionsRequired: false,
    status: AdmobConsentStatus.UNKNOWN,
  };
  private iosConsentInFlight: Promise<IOSConsentState> | null = null;
  private iosConsentListeners = new Set<IOSConsentListener>();

  isNativeIOS(): boolean {
    return isCapacitorNative() && getNativePlatform() === 'ios';
  }

  /**
   * 檢查當前是否有可用的原生 AdMob 插件
   */
  hasNativePlugin(): boolean {
    if (!isCapacitorNative()) return false;
    return Capacitor.isPluginAvailable('AdMob');
  }

  /**
   * 訂閱 iOS UMP Consent 狀態（供 SettingsModal 決定是否顯示 Privacy Options）
   */
  subscribeIOSConsent(listener: IOSConsentListener): () => void {
    this.iosConsentListeners.add(listener);
    listener(this.iosConsentState);
    return () => {
      this.iosConsentListeners.delete(listener);
    };
  }

  getIOSConsentState(): IOSConsentState {
    return this.iosConsentState;
  }

  isPrivacyOptionsRequired(): boolean {
    return this.isNativeIOS() && this.iosConsentState.privacyOptionsRequired;
  }

  private setIOSConsentState(next: IOSConsentState) {
    this.iosConsentState = next;
    for (const listener of this.iosConsentListeners) {
      try {
        listener(next);
      } catch {
        // ignore
      }
    }
  }

  /**
   * iOS 專用：執行 Google UMP Consent 資訊更新與必要之同意表單流程
   * - 每次 App 啟動更新 consent information
   * - 僅當 SDK 確認 canRequestAds === true 後才允許載入廣告
   * - 任何 UMP 失敗或未設定皆不會阻止玩家進入或遊玩遊戲
   */
  async syncIOSConsent(): Promise<IOSConsentState> {
    if (!this.isNativeIOS() || !this.hasNativePlugin()) {
      return this.iosConsentState;
    }

    if (this.iosConsentInFlight) {
      return this.iosConsentInFlight;
    }

    this.iosConsentInFlight = (async (): Promise<IOSConsentState> => {
      try {
        const requestOptions: {
          debugGeography?: AdmobConsentDebugGeography;
          testDeviceIdentifiers?: string[];
          tagForUnderAgeOfConsent?: boolean;
        } = {
          tagForUnderAgeOfConsent: false,
        };

        if (ADMOB_CONFIG.ios.isTesting) {
          if (ADMOB_CONFIG.ios.testingDevices.length > 0) {
            requestOptions.testDeviceIdentifiers = ADMOB_CONFIG.ios.testingDevices;
          }
          if (ADMOB_CONFIG.ios.umpDebugGeography === 'EEA') {
            requestOptions.debugGeography = AdmobConsentDebugGeography.EEA;
          } else if (ADMOB_CONFIG.ios.umpDebugGeography === 'NOT_EEA') {
            requestOptions.debugGeography = AdmobConsentDebugGeography.NOT_EEA;
          }
        }

        let info: AdmobConsentInfo = await AdMob.requestConsentInfo(requestOptions);

        // 若該地區 (如 EEA/UK) 需要使用者同意且表單可用，自動顯示 UMP 表單
        if (
          info.isConsentFormAvailable &&
          (info.status === AdmobConsentStatus.REQUIRED || !info.canRequestAds)
        ) {
          try {
            info = await AdMob.showConsentForm();
          } catch (formErr) {
            console.warn('[AdMobService] iOS UMP Consent 表單顯示異常:', formErr);
          }
        }

        const nextState: IOSConsentState = {
          checked: true,
          canRequestAds: Boolean(info.canRequestAds),
          privacyOptionsRequired:
            String(info.privacyOptionsRequirementStatus) === 'REQUIRED',
          status: info.status || AdmobConsentStatus.UNKNOWN,
        };
        this.setIOSConsentState(nextState);
        console.log('[AdMobService] iOS UMP Consent 狀態:', nextState);
        return nextState;
      } catch (err) {
        console.warn('[AdMobService] iOS UMP requestConsentInfo 失敗 (不影響遊玩):', err);
        const failState: IOSConsentState = {
          checked: true,
          canRequestAds: false,
          privacyOptionsRequired: this.iosConsentState.privacyOptionsRequired,
          status: AdmobConsentStatus.UNKNOWN,
        };
        this.setIOSConsentState(failState);
        return failState;
      } finally {
        this.iosConsentInFlight = null;
      }
    })();

    return this.iosConsentInFlight;
  }

  /**
   * iOS 專用：在設定頁面中開啟 Google UMP Privacy Options 表單
   */
  async showIOSPrivacyOptionsForm(): Promise<boolean> {
    if (!this.isNativeIOS() || !this.hasNativePlugin()) {
      return false;
    }
    try {
      await AdMob.showPrivacyOptionsForm();
      // 更新最新 consent 狀態
      await this.syncIOSConsent();
      if (this.iosConsentState.canRequestAds) {
        void this.preloadRewardedAd();
      } else {
        this.isAdPrepared = false;
      }
      return true;
    } catch (err) {
      console.warn('[AdMobService] 開啟 iOS Privacy Options 失敗:', err);
      return false;
    }
  }

  /**
   * iOS App 啟動標準入口：先完成 UMP Consent，確認 canRequestAds === true 後才初始化 SDK 與預載廣告
   */
  async initializeConsentAndAdsForIOS(): Promise<boolean> {
    if (!this.isNativeIOS() || !this.hasNativePlugin()) {
      return false;
    }
    const consent = await this.syncIOSConsent();
    if (!consent.canRequestAds) {
      console.log('[AdMobService] iOS UMP 尚未允許請求廣告，暫緩載入 AdMob');
      return false;
    }
    return this.preloadRewardedAd();
  }

  /**
   * V47.1 統一 iOS 不進行跨 App 追蹤策略：
   * - 固定回傳 true（所有 iOS 廣告請求一律攜帶 npa: true）。
   * - 不主動要求 ATT 授權、不讀取 IDFA、亦不因 ATT 狀態為 authorized 而切換至個人化廣告。
   * 注意：npa: true 本身不等同於自動滿足 Apple Tracking 定義或 GDPR 全部要求，仍須搭配 UMP Consent 與 AdMob 後台設定。
   */
  private shouldUseNonPersonalizedAdsForIOS(): boolean {
    return this.isNativeIOS();
  }

  /**
   * 初始化 AdMob SDK
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    if (!isCapacitorNative()) {
      this.isInitialized = true;
      return true;
    }

    if (!this.hasNativePlugin()) {
      return false;
    }

    const platform = getNativePlatform();

    // iOS：必須先由 UMP SDK 確認 canRequestAds === true 才可初始化並請求廣告
    if (platform === 'ios') {
      if (!this.iosConsentState.checked || !this.iosConsentState.canRequestAds) {
        const consent = await this.syncIOSConsent();
        if (!consent.canRequestAds) {
          return false;
        }
      }

      try {
        await AdMob.initialize({
          initializeForTesting: ADMOB_CONFIG.ios.isTesting,
          testingDevices: ADMOB_CONFIG.ios.isTesting ? ADMOB_CONFIG.ios.testingDevices : undefined,
        });
        this.isInitialized = true;
        console.log(
          '[AdMobService] iOS 原生 AdMob 初始化成功 (isTesting:',
          ADMOB_CONFIG.ios.isTesting,
          ')'
        );
        return true;
      } catch (err) {
        console.warn('[AdMobService] iOS 原生 AdMob 初始化失敗:', err);
        return false;
      }
    }

    // Android：完全保留既有初始化行為
    try {
      await AdMob.initialize({
        initializeForTesting: ADMOB_CONFIG.isTesting,
      });
      this.isInitialized = true;
      console.log('[AdMobService] 原生 AdMob 初始化成功 (isTesting:', ADMOB_CONFIG.isTesting, ')');
      return true;
    } catch (err) {
      console.warn('[AdMobService] 原生 AdMob 初始化失敗:', err);
      return false;
    }
  }

  /**
   * 取得對應平台的獎勵廣告單元 ID
   */
  getRewardedAdUnitId(): string {
    const platform = getNativePlatform();
    if (platform === 'ios') {
      return ADMOB_CONFIG.ios.isTesting
        ? ADMOB_CONFIG.ios.testRewardedAdUnitId
        : ADMOB_CONFIG.ios.rewardedAdUnitId;
    }
    return ADMOB_CONFIG.android.rewardedAdUnitId;
  }

  private classifyLoadError(err: unknown): 'NO_FILL' | 'TIMEOUT' | 'FAILED_TO_LOAD' {
    const msg = String((err as any)?.message || err || '').toLowerCase();
    const code = String((err as any)?.code ?? '');
    if (msg.includes('timeout')) return 'TIMEOUT';
    // Google Mobile Ads iOS GADErrorNoFill = 1 / "no ad to show" / "no fill"
    if (
      msg.includes('no fill') ||
      msg.includes('no ad to show') ||
      msg.includes('no ad config') ||
      code === '1' ||
      code === '3'
    ) {
      return 'NO_FILL';
    }
    return 'FAILED_TO_LOAD';
  }

  /**
   * 在 App 啟動時或看完廣告後預先初始化並載入下一段獎勵廣告
   */
  async preloadRewardedAd(timeoutMs = IOS_PREPARE_TIMEOUT_MS): Promise<boolean> {
    if (!isCapacitorNative() || !this.hasNativePlugin()) {
      return false;
    }
    if (this.isAdPrepared) {
      return true;
    }
    if (this.prepareInFlight) {
      return this.prepareInFlight;
    }

    const platform = getNativePlatform();

    this.prepareInFlight = (async () => {
      try {
        const initialized = await this.initialize();
        if (!initialized) {
          this.lastLoadFailureReason = 'FAILED_TO_LOAD';
          return false;
        }

        const adId = this.getRewardedAdUnitId();
        const isTesting = platform === 'ios' ? ADMOB_CONFIG.ios.isTesting : ADMOB_CONFIG.isTesting;
        const npa = platform === 'ios' ? this.shouldUseNonPersonalizedAdsForIOS() : false;

        const attemptPrepare = async () => {
          let timerId: ReturnType<typeof setTimeout> | null = null;
          const preparePromise =
            platform === 'ios'
              ? AdMob.prepareRewardVideoAd({ adId, isTesting, npa })
              : AdMob.prepareRewardVideoAd({ adId });
          const timeoutPromise = new Promise<never>((_, reject) => {
            timerId = setTimeout(() => reject(new Error('AdMob prepare timeout')), timeoutMs);
          });
          try {
            await Promise.race([preparePromise, timeoutPromise]);
          } finally {
            if (timerId !== null) clearTimeout(timerId);
          }
        };

        try {
          await attemptPrepare();
        } catch (firstErr) {
          // 冷啟動首次請求可能因 MobileAds 剛初始化而失敗，短暫等待後重試一次
          console.warn('[AdMobService] 首次預載廣告未就緒，重試一次:', firstErr);
          await new Promise((resolve) => setTimeout(resolve, 800));
          await attemptPrepare();
        }

        this.isAdPrepared = true;
        this.lastLoadFailureReason = null;
        console.log('[AdMobService] 獎勵廣告預載完成:', adId);
        return true;
      } catch (err) {
        this.isAdPrepared = false;
        this.lastLoadFailureReason = this.classifyLoadError(err);
        console.warn('[AdMobService] 獎勵廣告預載失敗:', this.lastLoadFailureReason, err);
        return false;
      } finally {
        this.prepareInFlight = null;
      }
    })();

    return this.prepareInFlight;
  }

  /**
   * 播放獎勵影片廣告
   */
  async showRewardedAd(): Promise<AdShowResult> {
    if (!isCapacitorNative()) {
      return { success: false, playedNativeAd: false, rewardEarned: false, reason: 'NOT_NATIVE' };
    }

    if (!this.hasNativePlugin()) {
      return { success: false, playedNativeAd: false, rewardEarned: false, reason: 'NO_PLUGIN' };
    }

    if (this.isAdLoading) {
      console.warn('[AdMobService] 廣告載入中，請勿重複點擊');
      return {
        success: false,
        playedNativeAd: false,
        rewardEarned: false,
        reason: getNativePlatform() === 'ios' ? 'ALREADY_LOADING' : 'TIMEOUT',
      };
    }

    const platform = getNativePlatform();

    // =========================================================================
    // iOS 專用強化狀態機（防重複 callback、處理 Rewarded/Dismissed 競態、嚴格逾時與清理）
    // =========================================================================
    if (platform === 'ios') {
      return this.showRewardedAdIOS();
    }

    // =========================================================================
    // Android 原生環境（完全保留既有運作邏輯）
    // =========================================================================
    this.isAdLoading = true;

    let rewardListener: PluginListenerHandle | null = null;
    let dismissListener: PluginListenerHandle | null = null;
    let failListener: PluginListenerHandle | null = null;

    const cleanupListeners = async () => {
      try {
        await rewardListener?.remove();
      } catch {
        // ignore
      }
      try {
        await dismissListener?.remove();
      } catch {
        // ignore
      }
      try {
        await failListener?.remove();
      } catch {
        // ignore
      }
    };

    try {
      const prepared = await this.preloadRewardedAd(15000);
      if (!prepared) {
        this.isAdLoading = false;
        return { success: false, playedNativeAd: false, rewardEarned: false, reason: 'FAILED_TO_SHOW' };
      }

      return await new Promise<AdShowResult>(async (resolve) => {
        let isEarned = false;
        let isSettled = false;

        const finish = async (res: AdShowResult) => {
          if (isSettled) return;
          isSettled = true;
          this.isAdLoading = false;
          this.isAdPrepared = false;
          await cleanupListeners();
          resolve(res);
          // 播完或關閉後背景預載下一則廣告
          setTimeout(() => {
            void this.preloadRewardedAd(15000);
          }, 500);
        };

        rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
          console.log('[AdMobService] 用戶已完成觀看，領取愛心獎勵');
          isEarned = true;
        });

        dismissListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
          console.log('[AdMobService] 廣告已關閉，發放狀態:', isEarned);
          void finish({
            success: isEarned,
            playedNativeAd: true,
            rewardEarned: isEarned,
            reason: isEarned ? 'SUCCESS' : 'USER_DISMISSED',
          });
        });

        failListener = await AdMob.addListener(RewardAdPluginEvents.FailedToShow, (err) => {
          console.warn('[AdMobService] 原生廣告播放失敗:', err);
          void finish({
            success: false,
            playedNativeAd: false,
            rewardEarned: false,
            reason: 'FAILED_TO_SHOW',
          });
        });

        try {
          // 消耗已預載的廣告狀態
          this.isAdPrepared = false;
          await AdMob.showRewardVideoAd();
        } catch (showErr) {
          console.warn('[AdMobService] showRewardVideoAd 異常:', showErr);
          await finish({
            success: false,
            playedNativeAd: false,
            rewardEarned: false,
            reason: 'FAILED_TO_SHOW',
          });
        }
      });
    } catch (error) {
      console.warn('[AdMobService] 原生 AdMob 載入或播放異常:', error);
      await cleanupListeners();
      this.isAdPrepared = false;
      this.isAdLoading = false;
      return { success: false, playedNativeAd: false, rewardEarned: false, reason: 'FAILED_TO_SHOW' };
    }
  }

  /**
   * iOS 專用 Rewarded Ad 播放流程
   */
  private async showRewardedAdIOS(): Promise<AdShowResult> {
    this.isAdLoading = true;

    let rewardListener: PluginListenerHandle | null = null;
    let dismissListener: PluginListenerHandle | null = null;
    let failListener: PluginListenerHandle | null = null;
    let showedListener: PluginListenerHandle | null = null;
    let overallTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let dismissGraceTimerId: ReturnType<typeof setTimeout> | null = null;
    let postRewardFallbackTimerId: ReturnType<typeof setTimeout> | null = null;

    const clearAllTimers = () => {
      if (overallTimeoutId !== null) {
        clearTimeout(overallTimeoutId);
        overallTimeoutId = null;
      }
      if (dismissGraceTimerId !== null) {
        clearTimeout(dismissGraceTimerId);
        dismissGraceTimerId = null;
      }
      if (postRewardFallbackTimerId !== null) {
        clearTimeout(postRewardFallbackTimerId);
        postRewardFallbackTimerId = null;
      }
    };

    const cleanupListeners = async () => {
      clearAllTimers();
      const handles = [rewardListener, dismissListener, failListener, showedListener];
      rewardListener = null;
      dismissListener = null;
      failListener = null;
      showedListener = null;
      await Promise.all(
        handles.map(async (h) => {
          try {
            await h?.remove();
          } catch {
            // ignore
          }
        })
      );
    };

    try {
      // 1. 確保 UMP Consent 已允許請求廣告
      if (!this.iosConsentState.checked || !this.iosConsentState.canRequestAds) {
        const consent = await this.syncIOSConsent();
        if (!consent.canRequestAds) {
          this.isAdLoading = false;
          return {
            success: false,
            playedNativeAd: false,
            rewardEarned: false,
            reason: 'CONSENT_REQUIRED',
          };
        }
      }

      // 2. 確保獎勵廣告已預載完成
      const prepared = await this.preloadRewardedAd(IOS_PREPARE_TIMEOUT_MS);
      if (!prepared) {
        this.isAdLoading = false;
        return {
          success: false,
          playedNativeAd: false,
          rewardEarned: false,
          reason: this.lastLoadFailureReason || 'FAILED_TO_LOAD',
        };
      }

      const adId = this.getRewardedAdUnitId();

      return await new Promise<AdShowResult>(async (resolve) => {
        let rewardEarned = false;
        let adDismissed = false;
        let adShowed = false;
        let isSettled = false;

        const settle = async (res: AdShowResult, shouldPreloadNext = true) => {
          if (isSettled) return;
          isSettled = true;
          this.isAdLoading = false;
          this.isAdPrepared = false;
          await cleanupListeners();
          resolve(res);
          if (shouldPreloadNext && this.iosConsentState.canRequestAds) {
            setTimeout(() => {
              void this.preloadRewardedAd(IOS_PREPARE_TIMEOUT_MS);
            }, 800);
          }
        };

        const markRewardEarnedOnce = () => {
          if (rewardEarned || isSettled) return;
          rewardEarned = true;
          console.log('[AdMobService] iOS 收到有效 Rewarded 回調 (單次鎖定)');
          if (adDismissed) {
            // Dismissed 比 Rewarded 先到達的競態：立即結算成功
            void settle({
              success: true,
              playedNativeAd: true,
              rewardEarned: true,
              reason: 'SUCCESS',
            });
          } else if (postRewardFallbackTimerId === null) {
            // 防護：若獲得獎勵後系統未補送 Dismissed，5 秒後自動結算避免卡死
            postRewardFallbackTimerId = setTimeout(() => {
              void settle({
                success: true,
                playedNativeAd: true,
                rewardEarned: true,
                reason: 'SUCCESS',
              });
            }, IOS_POST_REWARD_DISMISS_FALLBACK_MS);
          }
        };

        // 總逾時保護：避免 SDK 異常掛起導致按鈕永久鎖定
        overallTimeoutId = setTimeout(() => {
          console.warn('[AdMobService] iOS 獎勵廣告播放逾時');
          void settle({
            success: false,
            playedNativeAd: adShowed,
            rewardEarned: false,
            reason: 'TIMEOUT',
          });
        }, IOS_SHOW_OVERALL_TIMEOUT_MS);

        showedListener = await AdMob.addListener(RewardAdPluginEvents.Showed, () => {
          adShowed = true;
        });

        rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward) => {
          // 僅接受有效的獎勵回調
          if (reward && (typeof reward.amount !== 'number' || reward.amount > 0)) {
            markRewardEarnedOnce();
          }
        });

        dismissListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
          adDismissed = true;
          if (rewardEarned) {
            void settle({
              success: true,
              playedNativeAd: true,
              rewardEarned: true,
              reason: 'SUCCESS',
            });
            return;
          }
          // 若 Dismissed 先於 Rewarded 到達，給予 250ms 橋接緩衝；未收到 Rewarded 則視為提早關閉
          if (dismissGraceTimerId === null) {
            dismissGraceTimerId = setTimeout(() => {
              void settle({
                success: rewardEarned,
                playedNativeAd: true,
                rewardEarned,
                reason: rewardEarned ? 'SUCCESS' : 'USER_DISMISSED',
              });
            }, IOS_DISMISS_GRACE_AFTER_DISMISS_MS);
          }
        });

        failListener = await AdMob.addListener(RewardAdPluginEvents.FailedToShow, (err) => {
          console.warn('[AdMobService] iOS 原生廣告播放失敗:', err);
          void settle({
            success: false,
            playedNativeAd: false,
            rewardEarned: false,
            reason: 'FAILED_TO_SHOW',
          });
        });

        try {
          // 消耗已預載的廣告狀態
          this.isAdPrepared = false;
          const rewardItem = await AdMob.showRewardVideoAd({ adId });
          // @capacitor-community/admob 8.4.0 在 iOS 獲得獎勵時會 resolve(rewardItem)
          if (rewardItem && typeof rewardItem === 'object' && (typeof rewardItem.amount !== 'number' || rewardItem.amount > 0)) {
            markRewardEarnedOnce();
          }
        } catch (showErr: any) {
          const code = String(showErr?.code ?? '').toUpperCase();
          const msg = String(showErr?.message || showErr || '').toLowerCase();
          // @capacitor-community/admob 8.4.0 在用戶提早關閉未領獎時會 reject("REWARDED_AD_CANCELLED")
          if (
            code === 'REWARDED_AD_CANCELLED' ||
            msg.includes('dismissed before earning') ||
            msg.includes('cancelled')
          ) {
            if (!adDismissed) {
              await settle({
                success: false,
                playedNativeAd: true,
                rewardEarned: false,
                reason: 'USER_DISMISSED',
              });
            }
            return;
          }
          console.warn('[AdMobService] iOS showRewardVideoAd 異常:', showErr);
          await settle({
            success: false,
            playedNativeAd: adShowed,
            rewardEarned: false,
            reason: 'FAILED_TO_SHOW',
          });
        }
      });
    } catch (error) {
      console.warn('[AdMobService] iOS 原生 AdMob 載入或播放異常:', error);
      await cleanupListeners();
      this.isAdPrepared = false;
      this.isAdLoading = false;
      return {
        success: false,
        playedNativeAd: false,
        rewardEarned: false,
        reason: 'FAILED_TO_SHOW',
      };
    }
  }
}

export const admobService = new AdMobManager();
