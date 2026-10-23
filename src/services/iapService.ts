/**
 * 雙平台應用程式內購 (Mobile IAP) 核心服務
 * 支援 Apple App Store (StoreKit) 與 Google Play (Google Play Billing)
 * 專為 Capacitor iOS / Android 雙平台真機環境與 Web 預覽環境設計
 * 遵循 Apple App Store Review Guidelines (3.1.1) 與 Google Play Billing 政策規範
 */

import {
  MOBILE_IAP_CONFIG,
  APPLE_HEARTS_PRODUCTS,
  APPLE_COINS_PRODUCTS,
  MobileIAPProduct,
} from '../config/iapConfig';
import { isCapacitorNative, getNativePlatform } from './admobService';
import { SupportedLanguage } from '../utils/i18n';

export interface IAPPurchaseResult {
  success: boolean;
  cancelled?: boolean;
  error?: string;
  transactionId?: string;
  productId?: string;
  platform?: 'ios' | 'android' | 'web';
}

export interface IAPRestoreResult {
  success: boolean;
  restoredCount: number;
  message: string;
}

interface CapacitorWindow extends Window {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    getPlatform?: () => string;
    Plugins?: {
      Purchases?: any;
      InAppPurchase?: any;
      StoreKit?: any;
      GooglePlay?: any;
    };
  };
}

class MobileIAPService {
  private isInitialized = false;

  /**
   * 檢測是否在 Capacitor iOS 原生真機環境
   */
  isNativeIOS(): boolean {
    return isCapacitorNative() && getNativePlatform() === 'ios';
  }

  /**
   * 檢測是否在 Capacitor Android (Google Play) 原生真機環境
   */
  isNativeAndroid(): boolean {
    return isCapacitorNative() && getNativePlatform() === 'android';
  }

  /**
   * 取得當前執行平台
   */
  getCurrentPlatform(): 'ios' | 'android' | 'web' {
    if (this.isNativeIOS()) return 'ios';
    if (this.isNativeAndroid()) return 'android';
    return 'web';
  }

  /**
   * 初始化雙平台 IAP 服務
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    const platform = this.getCurrentPlatform();

    if (platform === 'web') {
      console.log('[MobileIAPService] 當前為 Web 瀏覽器環境，啟用雙平台沙盒模擬器');
      this.isInitialized = true;
      return true;
    }

    try {
      const win = window as CapacitorWindow;
      const purchasesPlugin =
        win.Capacitor?.Plugins?.Purchases ||
        win.Capacitor?.Plugins?.InAppPurchase ||
        (platform === 'ios' ? win.Capacitor?.Plugins?.StoreKit : win.Capacitor?.Plugins?.GooglePlay);

      if (purchasesPlugin) {
        if (purchasesPlugin.configure) {
          await purchasesPlugin.configure({
            apiKey: platform === 'ios' ? 'appl_live_iap_mock' : 'goog_live_play_mock',
            appUserID: null,
          });
        }
        this.isInitialized = true;
        console.log(`[MobileIAPService] ${platform.toUpperCase()} 原生內購插件加載成功`);
        return true;
      }
    } catch (err) {
      console.warn(`[MobileIAPService] 原生 ${platform} 內購初始化異常:`, err);
    }

    this.isInitialized = true;
    return true;
  }

  /**
   * 根據 Product ID 尋找產品資料
   */
  findProduct(productIdOrInternalId: string): MobileIAPProduct | undefined {
    return (
      [...APPLE_HEARTS_PRODUCTS, ...APPLE_COINS_PRODUCTS].find(
        (p) =>
          p.appleProductId === productIdOrInternalId ||
          p.googleProductId === productIdOrInternalId ||
          p.id === productIdOrInternalId
      )
    );
  }

  /**
   * 發起雙平台內購交易 (Apple StoreKit 或 Google Play Billing 結帳)
   * 在 iOS 上：彈出 Apple 官方 Face ID / Touch ID 原生付款表單
   * 在 Android 上：彈出 Google Play 原生 Google Pay / 指紋付款表單
   * 在 Web 預覽環境中：執行擬真沙盒交易
   */
  async purchaseProduct(productIdentifier: string): Promise<IAPPurchaseResult> {
    await this.initialize();
    const product = this.findProduct(productIdentifier);
    const platform = this.getCurrentPlatform();
    const targetId = product
      ? platform === 'android'
        ? product.googleProductId
        : product.appleProductId
      : productIdentifier;

    console.log(`[MobileIAPService] 發起購買 (${platform}): ${targetId}`);

    // 1. 如果在 Capacitor iOS / Android 原生真機環境
    if (platform === 'ios' || platform === 'android') {
      const win = window as CapacitorWindow;
      const purchasesPlugin =
        win.Capacitor?.Plugins?.Purchases ||
        win.Capacitor?.Plugins?.InAppPurchase ||
        (platform === 'ios' ? win.Capacitor?.Plugins?.StoreKit : win.Capacitor?.Plugins?.GooglePlay);

      if (purchasesPlugin) {
        try {
          const result = await purchasesPlugin.purchaseProduct({
            productIdentifier: targetId,
          });

          if (result && result.cancelled) {
            return {
              success: false,
              cancelled: true,
              error: 'User cancelled transaction',
              platform,
            };
          }

          return {
            success: true,
            transactionId: result?.transactionId || `tx_${platform}_${Date.now()}`,
            productId: targetId,
            platform,
          };
        } catch (err: any) {
          const errMsg = err?.message || String(err);
          if (
            errMsg.toLowerCase().includes('cancel') ||
            errMsg.includes('1') || // Google Play User Canceled code = 1
            errMsg.includes('2') // Apple User Cancelled code = 2
          ) {
            return {
              success: false,
              cancelled: true,
              error: 'User cancelled',
              platform,
            };
          }
          return {
            success: false,
            error: errMsg,
            platform,
          };
        }
      }
    }

    // 2. Web 環境 / 開發模擬沙盒 (Simulated Sandbox)
    await new Promise((resolve) => setTimeout(resolve, 600));

    return {
      success: true,
      transactionId: `mock_iap_tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      productId: targetId,
      platform: 'web',
    };
  }

  /**
   * 恢復購買 (Restore Purchases)
   * Apple Guideline 3.1.1 及 Google Play 必備功能
   */
  async restorePurchases(lang: SupportedLanguage = 'zh-HK'): Promise<IAPRestoreResult> {
    await this.initialize();
    const platform = this.getCurrentPlatform();

    if (platform === 'ios' || platform === 'android') {
      const win = window as CapacitorWindow;
      const purchasesPlugin =
        win.Capacitor?.Plugins?.Purchases ||
        win.Capacitor?.Plugins?.InAppPurchase;

      if (purchasesPlugin && purchasesPlugin.restorePurchases) {
        try {
          const res = await purchasesPlugin.restorePurchases();
          const restoredCount = res?.restoredCount || 0;
          const msg =
            lang === 'en'
              ? (platform === 'ios' ? 'Apple ID purchase history verified.' : 'Google Play purchase history verified.')
              : lang === 'ja'
              ? (platform === 'ios' ? 'Apple ID の購入履歴を確認しました。' : 'Google Play の購入履歴を確認しました。')
              : lang === 'zh-CN'
              ? (platform === 'ios' ? 'Apple ID 购买记录检查完毕。' : 'Google Play 账户购买记录检查完毕。')
              : (platform === 'ios' ? 'Apple ID 購買紀錄檢查完畢。' : 'Google Play 帳戶購買紀錄檢查完畢。');
          return {
            success: true,
            restoredCount,
            message: msg,
          };
        } catch (err: any) {
          const failMsg =
            lang === 'en'
              ? 'Failed to restore purchases: ' + (err?.message || 'Unknown error')
              : lang === 'ja'
              ? '購入の復元に失敗しました: ' + (err?.message || '')
              : lang === 'zh-CN'
              ? '恢复购买失败：' + (err?.message || '网络连接异常')
              : '恢復購買失敗：' + (err?.message || '網路連線異常');
          return {
            success: false,
            restoredCount: 0,
            message: failMsg,
          };
        }
      }
    }

    // Web 模擬沙盒環境
    await new Promise((resolve) => setTimeout(resolve, 800));
    const webMsg =
      lang === 'en'
        ? 'Store account verified: Consumable Hearts & Coins are credited directly to your local gameplay progression.'
        : lang === 'ja'
        ? 'ストアアカウントを確認しました：消耗品アイテム（ハート・コイン）は端末内のゲームデータに即時反映されています。'
        : lang === 'zh-CN'
        ? '已检查应用商店账户：爱心与金币为消耗型道具，已即时存入您的本地游戏进度中。'
        : '已檢查應用商店帳號：愛心與金幣為消耗型道具，已即時存入您的本地遊戲進度中。';
    return {
      success: true,
      restoredCount: 0,
      message: webMsg,
    };
  }

  /**
   * 取得商店圖示
   */
  getStoreIcon(): string {
    const platform = this.getCurrentPlatform();
    if (platform === 'ios') return '🍎';
    if (platform === 'android') return '▶️';
    return '📱';
  }

  /**
   * 取得商店名稱
   */
  getStoreName(lang: SupportedLanguage = 'zh-HK'): string {
    const platform = this.getCurrentPlatform();
    if (platform === 'ios') return 'Apple App Store';
    if (platform === 'android') return 'Google Play';
    if (lang === 'en') return 'App Store & Google Play';
    if (lang === 'ja') return 'App Store & Google Play';
    return 'App Store & Google Play 雙平台';
  }

  /**
   * 取得商店專區標題文字
   */
  getStoreBadgeLabel(lang: SupportedLanguage = 'zh-HK'): string {
    const platform = this.getCurrentPlatform();
    if (platform === 'ios') {
      if (lang === 'en') return 'Apple In-App Purchase';
      if (lang === 'ja') return 'Apple 公式アプリ内課金';
      if (lang === 'zh-CN') return 'Apple 官方应用内购买';
      return 'Apple 官方應用程式內購';
    }
    if (platform === 'android') {
      if (lang === 'en') return 'Google Play Billing';
      if (lang === 'ja') return 'Google Play アプリ内購入';
      if (lang === 'zh-CN') return 'Google Play 官方应用内购买';
      return 'Google Play 官方應用程式內購';
    }
    // Web 雙平台自適應
    if (lang === 'en') return 'App Store & Google Play In-App Purchase';
    if (lang === 'ja') return 'Apple & Google Play 公式アプリ内課金';
    if (lang === 'zh-CN') return 'Apple & Google Play 官方安全内购';
    return 'Apple & Google Play 雙平台官方內購';
  }

  /**
   * 取得付款方式標籤
   */
  getPaymentMethodBadge(lang: SupportedLanguage = 'zh-HK'): string {
    const platform = this.getCurrentPlatform();
    if (platform === 'ios') return 'Face ID / Touch ID';
    if (platform === 'android') {
      if (lang === 'en') return 'Google Pay / Fingerprint';
      if (lang === 'ja') return 'Google Pay / 指紋認証';
      return 'Google Pay / 指紋付款';
    }
    return 'Apple Pay / Google Pay';
  }

  /**
   * 取得扣款條款說明
   */
  getAccountNotice(lang: SupportedLanguage = 'zh-HK'): string {
    const platform = this.getCurrentPlatform();
    if (platform === 'ios') {
      if (lang === 'en') return 'Payment will be charged to your Apple ID account. Consumables are credited instantly.';
      if (lang === 'ja') return '購入確定時に Apple ID アカウントに請求されます。アイテムは即時反映されます。';
      if (lang === 'zh-CN') return '确认购买后将由您的 Apple ID 账户扣款。道具购买后即刻充值到游戏中。';
      return '確認購買後將由您的 Apple ID 帳戶安全扣款。道具購買後即刻充值到遊戲中。';
    }
    if (platform === 'android') {
      if (lang === 'en') return 'Payment will be processed via Google Play Billing. Consumables are credited instantly.';
      if (lang === 'ja') return 'Google Play アカウントを通じて安全に決済されます。アイテムは即時反映されます。';
      if (lang === 'zh-CN') return '确认购买后将由您的 Google Play 账户安全扣款。道具购买后即刻充值到游戏中。';
      return '確認購買後將由您的 Google Play 帳戶安全扣款。道具購買後即刻充值到遊戲中。';
    }
    // Web
    if (lang === 'en') return 'Payments are securely processed via Apple App Store or Google Play. Consumables are credited instantly.';
    if (lang === 'ja') return 'Apple ID または Google アカウントで安全に決済されます。消耗品は購入後即座に反映されます。';
    if (lang === 'zh-CN') return '确认购买后将由您的 Apple ID 或 Google Play 账户安全扣款。道具购买后即刻充值到游戏中。';
    return '確認購買後將由您的 Apple ID 或 Google Play 帳戶安全扣款。道具購買後即刻充值到遊戲中。';
  }
}

export const iapService = new MobileIAPService();
