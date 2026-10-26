/**
 * Google AdMob 獎勵影片服務橋接模組
 * 支援 Capacitor 原生雙平台 (Android / iOS) 與 Web 模擬環境
 */
import { ADMOB_CONFIG } from '../config/admobConfig';

interface CapacitorWindow extends Window {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    getPlatform?: () => 'android' | 'ios' | 'web';
    Plugins?: {
      AdMob?: any;
    };
  };
}

// 檢測是否在 Capacitor 原生環境 (Android / iOS)
export const isCapacitorNative = (): boolean => {
  if (typeof window === 'undefined') return false;
  const win = window as CapacitorWindow;
  return !!(win.Capacitor && win.Capacitor.isNativePlatform && win.Capacitor.isNativePlatform());
};

// 取得當前原生平台 ('android' | 'ios' | 'web')
export const getNativePlatform = (): 'android' | 'ios' | 'web' => {
  if (typeof window === 'undefined') return 'web';
  const win = window as CapacitorWindow;
  if (win.Capacitor && win.Capacitor.getPlatform) {
    const platform = win.Capacitor.getPlatform();
    if (platform === 'android' || platform === 'ios') return platform;
  }
  return 'web';
};

// 安全獲取 Capacitor 原生 AdMob 插件物件
export const getNativeAdMobPlugin = () => {
  if (typeof window === 'undefined') return null;
  const win = window as CapacitorWindow;
  return win.Capacitor?.Plugins?.AdMob || null;
};

export interface AdShowResult {
  success: boolean;
  playedNativeAd: boolean;
  reason?: 'SUCCESS' | 'NO_PLUGIN' | 'NOT_NATIVE' | 'FAILED_TO_SHOW' | 'USER_DISMISSED' | 'TIMEOUT';
}

class AdMobManager {
  private isInitialized = false;
  private isAdLoading = false;

  /**
   * 檢查當前是否有可用的原生 AdMob 插件
   */
  hasNativePlugin(): boolean {
    if (!isCapacitorNative()) return false;
    const plugin = getNativeAdMobPlugin();
    return !!(plugin && (typeof plugin.showRewardVideoAd === 'function' || typeof plugin.prepareRewardVideoAd === 'function'));
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

    try {
      const adMobPlugin = getNativeAdMobPlugin();
      if (adMobPlugin && typeof adMobPlugin.initialize === 'function') {
        await adMobPlugin.initialize({
          testingDevices: ['2077ef8a63d528687e0238f802e42094'],
          initializeForTesting: ADMOB_CONFIG.isTesting,
        });
        this.isInitialized = true;
        console.log('[AdMobService] 原生 AdMob 初始化成功');
        return true;
      }
    } catch (err) {
      console.warn('[AdMobService] 原生 AdMob 初始化跳過 (尚未安裝插件或在非原生環境):', err);
    }

    return false;
  }

  /**
   * 取得對應平台的獎勵廣告單元 ID
   */
  getRewardedAdUnitId(): string {
    const platform = getNativePlatform();
    if (platform === 'ios') {
      return ADMOB_CONFIG.ios.rewardedAdUnitId;
    }
    // Android 或 Web 測試
    return ADMOB_CONFIG.android.rewardedAdUnitId;
  }

  /**
   * 播放獎勵影片廣告
   * 若原生環境中 AdMob 插件不可用、無廣告庫存填充或播放失敗，
   * 自動返回 playedNativeAd: false，讓調用層無縫切換到內建模擬贊助商廣告。
   */
  async showRewardedAd(): Promise<AdShowResult> {
    if (!isCapacitorNative()) {
      return { success: false, playedNativeAd: false, reason: 'NOT_NATIVE' };
    }

    const adMobPlugin = getNativeAdMobPlugin();
    if (!adMobPlugin || typeof adMobPlugin.prepareRewardVideoAd !== 'function') {
      return { success: false, playedNativeAd: false, reason: 'NO_PLUGIN' };
    }

    if (this.isAdLoading) {
      console.warn('[AdMobService] 廣告載入中，請勿重複點擊');
      return { success: false, playedNativeAd: false, reason: 'TIMEOUT' };
    }

    this.isAdLoading = true;

    try {
      await this.initialize();
      const adId = this.getRewardedAdUnitId();

      // 準備廣告 (最長等待 5 秒，避免長時間無響應)
      const preparePromise = adMobPlugin.prepareRewardVideoAd({ adId });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AdMob prepare timeout')), 5000)
      );
      await Promise.race([preparePromise, timeoutPromise]);

      return new Promise<AdShowResult>(async (resolve) => {
        let isEarned = false;

        // 監聽是否達成獲得獎勵條件
        const rewardListener = await adMobPlugin.addListener?.('onRewardedVideoAdReward', () => {
          console.log('[AdMobService] 恭喜！用戶已完成觀看，領取愛心獎勵');
          isEarned = true;
        });

        // 監聽廣告關閉事件
        const dismissListener = await adMobPlugin.addListener?.('onRewardedVideoAdDismissed', () => {
          console.log('[AdMobService] 廣告已關閉，發放狀態:', isEarned);
          rewardListener?.remove?.();
          dismissListener?.remove?.();
          this.isAdLoading = false;
          resolve({
            success: isEarned,
            playedNativeAd: true,
            reason: isEarned ? 'SUCCESS' : 'USER_DISMISSED',
          });
        });

        // 監聽廣告播放失敗事件
        const failListener = await adMobPlugin.addListener?.('onRewardedVideoAdFailedToShow', (err: any) => {
          console.warn('[AdMobService] 原生廣告播放失敗:', err);
          rewardListener?.remove?.();
          dismissListener?.remove?.();
          failListener?.remove?.();
          this.isAdLoading = false;
          resolve({
            success: false,
            playedNativeAd: false,
            reason: 'FAILED_TO_SHOW',
          });
        });

        // 啟動播放廣告
        await adMobPlugin.showRewardVideoAd();
      });
    } catch (error) {
      console.warn('[AdMobService] 原生 AdMob 播放異常，平滑切換至備用模擬廣告:', error);
      this.isAdLoading = false;
      return { success: false, playedNativeAd: false, reason: 'FAILED_TO_SHOW' };
    }
  }
}

export const admobService = new AdMobManager();
