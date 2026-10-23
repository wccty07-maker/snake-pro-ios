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
const getNativeAdMobPlugin = () => {
  if (typeof window === 'undefined') return null;
  const win = window as CapacitorWindow;
  return win.Capacitor?.Plugins?.AdMob || null;
};

class AdMobManager {
  private isInitialized = false;
  private isAdLoading = false;

  /**
   * 初始化 AdMob SDK
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    if (!isCapacitorNative()) {
      console.log('[AdMobService] 當前為 Web 瀏覽器環境，使用內建模擬廣告模式');
      this.isInitialized = true;
      return true;
    }

    try {
      const adMobPlugin = getNativeAdMobPlugin();
      if (adMobPlugin) {
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
   * @returns Promise<boolean> - 若完整觀看並獲得獎勵返回 true；若中途退出或失敗返回 false
   */
  async showRewardedAd(): Promise<boolean> {
    // 1. 如果在 Web / 瀏覽器環境，返回 false 讓 UI 層執行內建精美模擬廣告倒數
    if (!isCapacitorNative()) {
      return false; // 表示非原生 AdMob，交由前端 UI 播放 5 秒倒數
    }

    // 2. 原生平台呼叫真實 AdMob SDK
    if (this.isAdLoading) {
      console.warn('[AdMobService] 廣告載入中，請勿重複點擊');
      return false;
    }

    this.isAdLoading = true;

    try {
      const adMobPlugin = getNativeAdMobPlugin();
      if (!adMobPlugin) {
        this.isAdLoading = false;
        return false;
      }

      await this.initialize();
      const adId = this.getRewardedAdUnitId();

      // 準備廣告
      await adMobPlugin.prepareRewardVideoAd({
        adId: adId,
      });

      return new Promise<boolean>(async (resolve) => {
        let isEarned = false;

        // 監聽是否達成獲得獎勵條件
        const rewardListener = await adMobPlugin.addListener('onRewardedVideoAdReward', () => {
          console.log('[AdMobService] 恭喜！用戶已完成觀看，領取愛心獎勵');
          isEarned = true;
        });

        // 監聽廣告關閉事件
        const dismissListener = await adMobPlugin.addListener('onRewardedVideoAdDismissed', () => {
          console.log('[AdMobService] 廣告已關閉，發放狀態:', isEarned);
          if (rewardListener && rewardListener.remove) rewardListener.remove();
          if (dismissListener && dismissListener.remove) dismissListener.remove();
          this.isAdLoading = false;
          resolve(isEarned);
        });

        // 監聽廣告播放失敗事件
        const failListener = await adMobPlugin.addListener('onRewardedVideoAdFailedToShow', (err: any) => {
          console.error('[AdMobService] 廣告播放失敗:', err);
          if (rewardListener && rewardListener.remove) rewardListener.remove();
          if (dismissListener && dismissListener.remove) dismissListener.remove();
          if (failListener && failListener.remove) failListener.remove();
          this.isAdLoading = false;
          resolve(false);
        });

        // 啟動播放廣告
        await adMobPlugin.showRewardVideoAd();
      });
    } catch (error) {
      console.error('[AdMobService] 呼叫 AdMob 原生播放出錯:', error);
      this.isAdLoading = false;
      return false;
    }
  }
}

export const admobService = new AdMobManager();
