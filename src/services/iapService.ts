/**
 * 雙平台應用程式內購 (Mobile IAP) 核心服務 (V47.1)
 * 使用 @capgo/native-purchases (8.9.16) 對接 Google Play Billing (Android) 與 Apple StoreKit 2 (iOS)
 *
 * 平台隔離原則：
 * - Android：完全保留既有 Google Play Billing 行為 (autoFinishTransactions: true, autoAcknowledgePurchases: true)。
 * - iOS：
 *   1. 使用 StoreKit 2 本地化價格查詢（禁止硬編碼價格與手動匯率換算）。
 *   2. 手動交易驗證與完成 (autoFinishTransactions: false, autoAcknowledgePurchases: false)，
 *      僅在單一權威持久化紀錄寫入並讀回驗證成功後才呼叫 finishTransaction()。
 *   3. 分離 180 秒 UI 等待逾時與原生 StoreKit 交易生命週期：UI 可停止載入並提示狀態檢查，
 *      但保留原始原生 purchaseProduct() Promise 處理延遲成功／失敗，不允許重疊發起新購買。
 *   4. 未驗證交易絕不派發、絕不視為已交付、亦不盲目以 allowUnverified: true 清理可能可恢復之交易；
 *      區分永久無效與可能恢復的驗證錯誤，記錄診斷日誌並支援安全重新檢查。
 * - Web：僅於明確開發預覽環境 (import.meta.env.DEV) 允許模擬付款，Production / iOS Release Build 編譯期完全剔除。
 */

import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import {
  NativePurchases,
  PURCHASE_TYPE,
  type Product as StoreProduct,
  type Transaction as StoreTransaction,
} from '@capgo/native-purchases';
import {
  APPLE_HEARTS_PRODUCTS,
  APPLE_COINS_PRODUCTS,
  ALL_APPLE_IAP_PRODUCTS,
  ALL_APPLE_PRODUCT_IDS,
  getProductTotalGrant,
  type MobileIAPProduct,
} from '../config/iapConfig';
import { isCapacitorNative, getNativePlatform } from './admobService';
import type { SupportedLanguage } from '../utils/i18n';
import type { IAPTransactionLedgerEntry } from '../types';
import { isTransactionAlreadyGranted } from './iapLedger';

export type IAPPurchaseStatus =
  | 'verified'
  | 'cancelled'
  | 'pending'
  | 'unverified'
  | 'duplicate'
  | 'failed'
  | 'unavailable';

export interface IAPPurchaseResult {
  success: boolean;
  cancelled?: boolean;
  pending?: boolean;
  duplicate?: boolean;
  status?: IAPPurchaseStatus;
  error?: string;
  transactionId?: string;
  productId?: string;
  grantedAmount?: number;
  category?: 'HEARTS' | 'COINS';
  /** True when the transaction was already fulfilled & persisted by the authoritative handler (iOS StoreKit 2 flow) */
  fulfilledAtomically?: boolean;
  platform?: 'ios' | 'android' | 'web';
}

export interface IAPRestoreResult {
  success: boolean;
  restoredCount: number;
  message: string;
}

export type IOSCatalogStatus = 'idle' | 'loading' | 'ready' | 'partial' | 'error' | 'unavailable';

export interface IOSCatalogState {
  status: IOSCatalogStatus;
  products: Record<string, StoreProduct>;
  error?: string;
  lastUpdatedAt?: number;
}

export interface AtomicFulfillmentOutcome {
  status: 'GRANTED' | 'DUPLICATE' | 'PERSIST_FAILED';
  error?: string;
  backupSyncFailed?: boolean;
}

export type IOSFulfillmentHandler = (
  entry: IAPTransactionLedgerEntry
) => AtomicFulfillmentOutcome;

export interface IOSRecoveryEvent {
  transactionId: string;
  productId: string;
  category: 'HEARTS' | 'COINS';
  grantedAmount: number;
}

export type UnverifiedClassification = 'POTENTIALLY_RECOVERABLE' | 'PERMANENTLY_INVALID';

export interface UnverifiedTransactionRecord {
  transactionId: string;
  productId: string;
  reason: string;
  classification: UnverifiedClassification;
  source: 'purchase' | 'updates' | 'recovery' | 'verification_event';
  firstSeenAt: number;
  lastSeenAt: number;
  retryCount: number;
}

export type IOSRecoveryListener = (event: IOSRecoveryEvent) => void;
export type IOSCatalogListener = (state: IOSCatalogState) => void;

const STOREKIT_QUERY_TIMEOUT_MS = 15000;
const STOREKIT_UI_WAIT_TIMEOUT_MS = 180000;
const NUMERIC_TRANSACTION_ID_RE = /^\d+$/;

export type ActiveIOSPurchasePhase =
  | 'NATIVE_SHEET_IN_PROGRESS'
  | 'UI_TIMED_OUT_WAITING_NATIVE';

interface ActiveIOSPurchaseState {
  productId: string;
  startedAt: number;
  uiTimedOut: boolean;
  settled: boolean;
  phase: ActiveIOSPurchasePhase;
  lang: SupportedLanguage;
  nativeFlowPromise: Promise<IAPPurchaseResult>;
}

/**
 * Decode a StoreKit 2 JWS payload (middle segment) purely for cross-checking product/tx fields.
 * Note: Local cryptographic JWS verification is performed natively by Apple StoreKit 2
 * (VerificationResult.verified) before the plugin resolves the transaction.
 * Zero Apple private keys exist on the client.
 */
export function decodeStoreKitJWSPayload(
  jws?: string
): Record<string, unknown> | null {
  if (!jws || typeof jws !== 'string') return null;
  const parts = jws.split('.');
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    let jsonStr: string;
    if (typeof atob === 'function') {
      jsonStr = atob(padded);
    } else if (typeof Buffer !== 'undefined') {
      jsonStr = Buffer.from(padded, 'base64').toString('utf8');
    } else {
      return null;
    }
    const parsed = JSON.parse(jsonStr);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export interface IOSTransactionValidationResult {
  valid: boolean;
  reason?: string;
  classification?: UnverifiedClassification;
  /** True ONLY when StoreKit verified the transaction itself and reported an Apple revocationDate */
  isVerifiedRevocation?: boolean;
  product?: MobileIAPProduct;
  transactionId?: string;
  quantity?: number;
}

/**
 * Classify whether a StoreKit verificationError is likely permanent vs potentially recoverable
 * (e.g., transient device clock skew, certificate chain refresh, or offline StoreKit cache).
 */
export function classifyUnverifiedReason(reason: string): UnverifiedClassification {
  const lower = String(reason || '').toLowerCase();
  if (
    lower.includes('revoked') ||
    lower.includes('unknown_product') ||
    lower.includes('product_mismatch') ||
    lower.includes('jws_product_mismatch') ||
    lower.includes('jws_tx_id_mismatch') ||
    lower.includes('invalid_transaction_id') ||
    lower.includes('empty_transaction') ||
    lower.includes('missing_product_id') ||
    lower.includes('malformed_jws') ||
    lower.includes('forged') ||
    lower.includes('tamper') ||
    lower.includes('bundle')
  ) {
    return 'PERMANENTLY_INVALID';
  }
  return 'POTENTIALLY_RECOVERABLE';
}

/**
 * Validate a StoreKit 2 transaction before granting consumables on iOS.
 * Never trusts bare transactionId alone.
 */
export function validateIOSTransaction(
  transaction: StoreTransaction | null | undefined,
  expectedProductId?: string
): IOSTransactionValidationResult {
  if (!transaction || typeof transaction !== 'object') {
    return {
      valid: false,
      reason: 'EMPTY_TRANSACTION',
      classification: 'PERMANENTLY_INVALID',
    };
  }

  const txId = String(transaction.transactionId || '').trim();
  if (!txId || !NUMERIC_TRANSACTION_ID_RE.test(txId)) {
    return {
      valid: false,
      reason: 'INVALID_TRANSACTION_ID',
      classification: 'PERMANENTLY_INVALID',
    };
  }

  if (transaction.verificationError) {
    const reason = `UNVERIFIED:${transaction.verificationError}`;
    return {
      valid: false,
      reason,
      classification: classifyUnverifiedReason(transaction.verificationError),
      transactionId: txId,
    };
  }

  if (transaction.revocationDate) {
    return {
      valid: false,
      reason: 'REVOKED_TRANSACTION',
      classification: 'PERMANENTLY_INVALID',
      isVerifiedRevocation: true,
      transactionId: txId,
    };
  }

  // Require StoreKit 2 JWS or StoreKit receipt payload (never accept bare transactionId alone)
  const hasJws = typeof transaction.jwsRepresentation === 'string' && transaction.jwsRepresentation.length > 0;
  const hasReceipt = typeof transaction.receipt === 'string' && transaction.receipt.length > 0;
  if (!hasJws && !hasReceipt) {
    return {
      valid: false,
      reason: 'MISSING_STOREKIT_PROOF',
      classification: 'POTENTIALLY_RECOVERABLE',
      transactionId: txId,
    };
  }

  const productId = String(transaction.productIdentifier || '').trim();
  if (!productId) {
    return {
      valid: false,
      reason: 'MISSING_PRODUCT_ID',
      classification: 'PERMANENTLY_INVALID',
      transactionId: txId,
    };
  }

  if (expectedProductId && productId !== expectedProductId) {
    return {
      valid: false,
      reason: `PRODUCT_MISMATCH:${productId}!==${expectedProductId}`,
      classification: 'PERMANENTLY_INVALID',
      transactionId: txId,
    };
  }

  const matchedProduct = ALL_APPLE_IAP_PRODUCTS.find((p) => p.appleProductId === productId);
  if (!matchedProduct) {
    return {
      valid: false,
      reason: `UNKNOWN_PRODUCT:${productId}`,
      classification: 'PERMANENTLY_INVALID',
      transactionId: txId,
    };
  }

  // If JWS is present, cross-check decoded payload against reported transaction fields
  if (hasJws) {
    const payload = decodeStoreKitJWSPayload(transaction.jwsRepresentation);
    if (!payload) {
      return {
        valid: false,
        reason: 'MALFORMED_JWS',
        classification: 'PERMANENTLY_INVALID',
        transactionId: txId,
      };
    }
    if (payload.productId && String(payload.productId) !== productId) {
      return {
        valid: false,
        reason: 'JWS_PRODUCT_MISMATCH',
        classification: 'PERMANENTLY_INVALID',
        transactionId: txId,
      };
    }
    if (payload.transactionId !== undefined && String(payload.transactionId) !== txId) {
      return {
        valid: false,
        reason: 'JWS_TX_ID_MISMATCH',
        classification: 'PERMANENTLY_INVALID',
        transactionId: txId,
      };
    }
    if (payload.revocationDate) {
      return {
        valid: false,
        reason: 'JWS_REVOKED',
        classification: 'PERMANENTLY_INVALID',
        isVerifiedRevocation: true,
        transactionId: txId,
      };
    }
  }

  const rawQty = Number(transaction.quantity ?? 1);
  const quantity = Number.isFinite(rawQty) && rawQty >= 1 ? Math.floor(rawQty) : 1;

  return {
    valid: true,
    product: matchedProduct,
    transactionId: txId,
    quantity,
  };
}

function getLocalizedIOSError(
  kind:
    | 'no_plugin'
    | 'billing_unsupported'
    | 'product_unavailable'
    | 'pending'
    | 'still_processing'
    | 'still_processing_restart'
    | 'unverified'
    | 'persist_failed'
    | 'in_progress'
    | 'network'
    | 'generic',
  lang: SupportedLanguage = 'en',
  detail?: string
): string {
  switch (kind) {
    case 'no_plugin':
      if (lang === 'en') return 'App Store billing service is temporarily unavailable. Please restart the app and try again.';
      if (lang === 'ja') return 'App Store 課金サービスが一時的に利用できません。アプリを再起動してお試しください。';
      if (lang === 'zh-CN') return 'App Store 付款服务暂时不可用，请重启应用后再试。';
      return 'App Store 付款服務暫時無法使用，請重新啟動 App 後再試。';
    case 'billing_unsupported':
      if (lang === 'en') return 'In-App Purchases are disabled on this device. Please check Screen Time & App Store settings.';
      if (lang === 'ja') return 'この端末ではアプリ内課金が無効になっています。設定をご確認ください。';
      if (lang === 'zh-CN') return '此设备当前未启用 App Store 内购功能，请检查系统设置。';
      return '此裝置目前未啟用 App Store 內購功能，請檢查系統設定。';
    case 'product_unavailable':
      if (lang === 'en') return 'This item is currently unavailable from the App Store. Please tap Retry.';
      if (lang === 'ja') return 'この商品は現在 App Store から取得できません。再試行してください。';
      if (lang === 'zh-CN') return '此商品暂时无法从 App Store 加载，请点击重试。';
      return '此商品暫時無法從 App Store 載入，請點擊重試。';
    case 'pending':
      if (lang === 'en') return 'Purchase is pending approval (e.g., Ask to Buy). Items will be delivered automatically once approved.';
      if (lang === 'ja') return '購入は承認待ちです（承認と購入のリクエスト等）。承認後に自動で付与されます。';
      if (lang === 'zh-CN') return '付款等待批准中（例如家人共享审批）。批准完成后道具将自动发放。';
      return '付款正等待核准（例如購買前詢問）。核准完成後道具將自動派發。';
    case 'still_processing':
      if (lang === 'en') return 'Your purchase is still being processed. Please wait while we check its status.';
      if (lang === 'ja') return '購入処理を引き続き確認中です。ステータス確認が完了するまでしばらくお待ちください。';
      if (lang === 'zh-CN') return '您的购买仍在处理中，请稍候，我们正在检查交易状态。';
      return '您的購買仍在處理中，請稍候，我們正在檢查交易狀態。';
    case 'still_processing_restart':
      if (lang === 'en') {
        return 'Your previous App Store purchase is still being processed. To avoid duplicate charges, please wait for it to finish, or close and reopen the app to safely recover any completed purchase.';
      }
      if (lang === 'ja') {
        return '前回の App Store 購入がまだ処理中です。重複課金を防ぐため完了までお待ちいただくか、アプリを再起動して完了済みの購入を安全に復元してください。';
      }
      if (lang === 'zh-CN') {
        return '您上一笔 App Store 购买仍在处理中。为避免重复扣款，请稍候，或关闭并重新打开应用以安全恢复已完成的购买。';
      }
      return '您上一筆 App Store 購買仍在處理中。為避免重複扣款，請稍候，或關閉並重新開啟 App 以安全恢復已完成的購買。';
    case 'unverified':
      if (lang === 'en') return 'App Store could not verify this transaction right now. No items were granted. Please check your connection or reopen the app to re-verify.';
      if (lang === 'ja') return '現在 App Store で取引を検証できませんでした。アイテムは付与されていません。通信状況を確認するかアプリを再起動して再確認してください。';
      if (lang === 'zh-CN') return 'App Store 暂时无法验证此交易，未发放商品。请检查网络或重新打开应用以重新验证。';
      return 'App Store 暫時無法驗證此交易，未派發商品。請檢查網絡或重新開啟 App 以重新驗證。';
    case 'persist_failed':
      if (lang === 'en') return 'Could not save your purchase locally. Please ensure storage space is available and reopen the app to recover your items.';
      if (lang === 'ja') return '購入データの保存に失敗しました。空き容量を確認し、アプリを再起動して受け取ってください。';
      if (lang === 'zh-CN') return '本地存档失败，请确保设备空间充足并重新打开应用以自动恢复商品。';
      return '本機存檔失敗，請確保裝置空間充足並重新開啟 App 以自動恢復商品。';
    case 'in_progress':
      if (lang === 'en') return 'Your purchase is still being processed. Please wait while we check its status.';
      if (lang === 'ja') return '購入処理を引き続き確認中です。ステータス確認が完了するまでしばらくお待ちください。';
      if (lang === 'zh-CN') return '您的购买仍在处理中，请稍候，我们正在检查交易状态。';
      return '您的購買仍在處理中，請稍候，我們正在檢查交易狀態。';
    case 'network':
      if (lang === 'en') return 'Network connection interrupted. If you were charged, items will be delivered automatically when reconnected.';
      if (lang === 'ja') return '通信が中断されました。決済が完了している場合は再接続時に自動付与されます。';
      if (lang === 'zh-CN') return '网络连接中断。若已扣款，恢复网络后将自动补发商品。';
      return '網絡連線中斷。如已完成扣款，恢復連線後將自動補發商品。';
    default:
      if (lang === 'en') return detail ? `App Store purchase could not be completed: ${detail}` : 'App Store purchase could not be completed.';
      if (lang === 'ja') return detail ? `App Store の購入を完了できませんでした: ${detail}` : 'App Store の購入を完了できませんでした。';
      if (lang === 'zh-CN') return detail ? `App Store 付款未完成：${detail}` : 'App Store 付款未完成，请稍后再试。';
      return detail ? `App Store 付款未完成：${detail}` : 'App Store 付款未完成，請稍後再試。';
  }
}

class MobileIAPService {
  private isInitialized = false;
  private iosListenersAttached = false;
  private iosUpdateListener: PluginListenerHandle | null = null;
  private iosVerificationFailedListener: PluginListenerHandle | null = null;

  private iosCatalogState: IOSCatalogState = {
    status: 'idle',
    products: {},
  };
  private iosCatalogInFlight: Promise<IOSCatalogState> | null = null;
  private iosCatalogListeners = new Set<IOSCatalogListener>();

  // Separate native StoreKit purchase lifecycle from 180s UI waiting timeout.
  // Lock is released ONLY when the actual NativePurchases.purchaseProduct() Promise settles.
  private activeIOSPurchase: ActiveIOSPurchaseState | null = null;
  private iosPurchaseUiTimeoutMs = STOREKIT_UI_WAIT_TIMEOUT_MS;

  private iosRecoveryInFlight: Promise<number> | null = null;
  // Per-transaction serialization map prevents Purchase / Transaction.updates / Recovery races
  private inFlightTxPromises = new Map<string, Promise<IAPPurchaseResult>>();
  // Diagnostic log for unverified transactions (NEVER written to fulfilled ledger!)
  private unverifiedDiagnostics = new Map<string, UnverifiedTransactionRecord>();

  private fulfillmentHandler: IOSFulfillmentHandler | null = null;
  private recoveryListeners = new Set<IOSRecoveryListener>();

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
   * 是否存在尚未確認結算的原生 iOS 購買流程
   */
  hasPendingIOSPurchase(): boolean {
    return Boolean(this.activeIOSPurchase && !this.activeIOSPurchase.settled);
  }

  /**
   * 取得未驗證交易診斷紀錄（僅供診斷與重試，絕非已派發憑證）
   */
  getUnverifiedTransactionDiagnostics(): UnverifiedTransactionRecord[] {
    return Array.from(this.unverifiedDiagnostics.values());
  }

  private recordUnverifiedDiagnostic(
    transactionId: string,
    productId: string,
    reason: string,
    classification: UnverifiedClassification,
    source: UnverifiedTransactionRecord['source']
  ) {
    const key = transactionId || `unknown_${productId}_${Date.now()}`;
    const now = Date.now();
    const existing = this.unverifiedDiagnostics.get(key);
    this.unverifiedDiagnostics.set(key, {
      transactionId: transactionId || 'unknown',
      productId: productId || 'unknown',
      reason,
      classification,
      source,
      firstSeenAt: existing?.firstSeenAt ?? now,
      lastSeenAt: now,
      retryCount: (existing?.retryCount ?? 0) + 1,
    });
  }

  private clearUnverifiedDiagnostic(transactionId: string) {
    if (transactionId) {
      this.unverifiedDiagnostics.delete(transactionId);
    }
  }

  /**
   * 註冊 iOS 權威派發處理器 (由 App.tsx 在啟動時掛載，負責更新單一權威 PlayerProfile 與驗寫)
   */
  registerFulfillmentHandler(handler: IOSFulfillmentHandler): () => void {
    this.fulfillmentHandler = handler;
    return () => {
      if (this.fulfillmentHandler === handler) {
        this.fulfillmentHandler = null;
      }
    };
  }

  /**
   * 訂閱 iOS 未完成交易自動恢復／延遲派發事件 (讓 UI 顯示通知)
   */
  onIOSRecoveryGrant(listener: IOSRecoveryListener): () => void {
    this.recoveryListeners.add(listener);
    return () => {
      this.recoveryListeners.delete(listener);
    };
  }

  private emitIOSRecoveryGrant(event: IOSRecoveryEvent) {
    for (const listener of this.recoveryListeners) {
      try {
        listener(event);
      } catch {
        // ignore listener errors
      }
    }
  }

  /**
   * 訂閱 iOS StoreKit 商品目錄載入狀態
   */
  subscribeIOSCatalog(listener: IOSCatalogListener): () => void {
    this.iosCatalogListeners.add(listener);
    listener(this.iosCatalogState);
    return () => {
      this.iosCatalogListeners.delete(listener);
    };
  }

  getIOSCatalogState(): IOSCatalogState {
    return this.iosCatalogState;
  }

  getIOSProduct(productId: string): StoreProduct | undefined {
    return this.iosCatalogState.products[productId];
  }

  private setIOSCatalogState(next: IOSCatalogState) {
    this.iosCatalogState = next;
    for (const listener of this.iosCatalogListeners) {
      try {
        listener(next);
      } catch {
        // ignore listener errors
      }
    }
  }

  /**
   * 初始化雙平台 IAP 服務
   * - Android: 嚴格保留原有 autoFinishTransactions: true 行為
   * - iOS: 啟用 autoFinishTransactions: false + StoreKit 2 Transaction.updates 監聽
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    const platform = this.getCurrentPlatform();

    if (platform === 'web') {
      this.isInitialized = true;
      return true;
    }

    if (!Capacitor.isPluginAvailable('NativePurchases')) {
      console.warn(`[MobileIAPService] NativePurchases 插件不可用 (${platform})`);
      return false;
    }

    try {
      if (platform === 'android') {
        // Android 保持原有 Google Play Billing 設定不變
        await NativePurchases.configure({ autoFinishTransactions: true });
        this.isInitialized = true;
        console.log('[MobileIAPService] ANDROID 原生內購插件加載成功');
        return true;
      }

      // iOS StoreKit 2: 手動完成交易，確保成功派發並通過權威持久化驗寫後才 finishTransaction()
      await NativePurchases.configure({ autoFinishTransactions: false });
      await this.attachIOSListeners();
      this.isInitialized = true;
      console.log('[MobileIAPService] IOS StoreKit 2 原生內購插件加載成功 (manual finish)');
      return true;
    } catch (err) {
      console.warn(`[MobileIAPService] 原生 ${platform} 內購初始化異常:`, err);
      return false;
    }
  }

  private async attachIOSListeners(): Promise<void> {
    if (this.iosListenersAttached || !this.isNativeIOS()) return;
    if (!Capacitor.isPluginAvailable('NativePurchases')) return;

    this.iosListenersAttached = true;

    try {
      this.iosUpdateListener = await NativePurchases.addListener(
        'transactionUpdated',
        (transaction: StoreTransaction) => {
          void this.handleIncomingIOSTransaction(transaction, 'updates');
        }
      );

      this.iosVerificationFailedListener = await NativePurchases.addListener(
        'transactionVerificationFailed',
        (payload) => {
          const txId = String(payload?.transactionId || '').trim();
          const errMsg = String(payload?.error || 'StoreKit verification failed');
          const classification = classifyUnverifiedReason(errMsg);
          this.recordUnverifiedDiagnostic(
            txId,
            'unknown',
            `UNVERIFIED:${errMsg}`,
            classification,
            'verification_event'
          );
          console.warn(
            `[MobileIAPService] StoreKit transactionVerificationFailed (${classification}) — 拒絕派發且不自動 allowUnverified finish:`,
            txId,
            errMsg
          );
        }
      );
    } catch (err) {
      this.iosListenersAttached = false;
      console.warn('[MobileIAPService] 註冊 iOS StoreKit 監聽器失敗:', err);
    }
  }

  /**
   * 查詢全部 8 款 Apple StoreKit 商品的真實本地化價格 (iOS 專用)
   * - 不進行任何手動匯率換算
   * - 不使用任何 hardcoded USD 價格替代
   */
  async loadIOSProducts(forceRefresh = false): Promise<IOSCatalogState> {
    if (!this.isNativeIOS()) {
      return this.iosCatalogState;
    }

    if (
      !forceRefresh &&
      this.iosCatalogState.status === 'ready' &&
      Object.keys(this.iosCatalogState.products).length === ALL_APPLE_PRODUCT_IDS.length
    ) {
      return this.iosCatalogState;
    }

    if (this.iosCatalogInFlight) {
      return this.iosCatalogInFlight;
    }

    this.iosCatalogInFlight = (async (): Promise<IOSCatalogState> => {
      const initialized = await this.initialize();
      if (!initialized || !Capacitor.isPluginAvailable('NativePurchases')) {
        const unavailableState: IOSCatalogState = {
          status: 'unavailable',
          products: {},
          error: 'App Store plugin unavailable',
          lastUpdatedAt: Date.now(),
        };
        this.setIOSCatalogState(unavailableState);
        return unavailableState;
      }

      this.setIOSCatalogState({
        ...this.iosCatalogState,
        status: 'loading',
        error: undefined,
      });

      try {
        const billingCheck = await NativePurchases.isBillingSupported();
        if (!billingCheck.isBillingSupported) {
          const unsupportedState: IOSCatalogState = {
            status: 'unavailable',
            products: {},
            error: 'App Store billing unsupported on this device',
            lastUpdatedAt: Date.now(),
          };
          this.setIOSCatalogState(unsupportedState);
          return unsupportedState;
        }

        let queryTimer: ReturnType<typeof setTimeout> | null = null;
        const queryPromise = NativePurchases.getProducts({
          productIdentifiers: ALL_APPLE_PRODUCT_IDS,
          productType: PURCHASE_TYPE.INAPP,
        });
        const timeoutPromise = new Promise<never>((_, reject) => {
          queryTimer = setTimeout(
            () => reject(new Error('StoreKit product query timeout')),
            STOREKIT_QUERY_TIMEOUT_MS
          );
        });

        const response = await Promise.race([queryPromise, timeoutPromise]).finally(() => {
          if (queryTimer) {
            clearTimeout(queryTimer);
            queryTimer = null;
          }
        });
        const returnedProducts = Array.isArray(response?.products) ? response.products : [];

        const productMap: Record<string, StoreProduct> = {};
        for (const p of returnedProducts) {
          if (p && p.identifier && p.priceString) {
            productMap[p.identifier] = p;
          }
        }

        const count = Object.keys(productMap).length;
        const nextStatus: IOSCatalogStatus =
          count === ALL_APPLE_PRODUCT_IDS.length
            ? 'ready'
            : count > 0
            ? 'partial'
            : 'error';

        const nextState: IOSCatalogState = {
          status: nextStatus,
          products: productMap,
          error:
            nextStatus === 'error'
              ? 'No StoreKit products returned'
              : nextStatus === 'partial'
              ? `Loaded ${count}/${ALL_APPLE_PRODUCT_IDS.length} products`
              : undefined,
          lastUpdatedAt: Date.now(),
        };

        this.setIOSCatalogState(nextState);
        return nextState;
      } catch (err: any) {
        const errorState: IOSCatalogState = {
          status: 'error',
          products: this.iosCatalogState.products,
          error: String(err?.message || err || 'Failed to load App Store products'),
          lastUpdatedAt: Date.now(),
        };
        this.setIOSCatalogState(errorState);
        return errorState;
      } finally {
        this.iosCatalogInFlight = null;
      }
    })();

    return this.iosCatalogInFlight;
  }

  /**
   * 處理單筆已收到的 iOS StoreKit 2 交易（來自 purchaseProduct / transactionUpdated / getUnfinishedTransactions）
   * 嚴格順序：
   * 1. 交易驗證（區分未驗證、永久無效與 Apple 驗證撤銷；絕不盲目 allowUnverified: true 清理）
   * 2. 同筆 transactionId 並發序列化（防止 Purchase / Updates / Recovery 同時處理）
   * 3. 檢查權威持久化紀錄防重（絕不單憑備份 Ledger 略過派發）
   * 4. 寫入權威持久化紀錄並同步讀回驗證 -> 僅成功後才呼叫 finishTransaction()
   */
  private async handleIncomingIOSTransaction(
    transaction: StoreTransaction,
    source: 'purchase' | 'updates' | 'recovery',
    expectedProductId?: string,
    lang: SupportedLanguage = 'en'
  ): Promise<IAPPurchaseResult> {
    const rawTxId = String(transaction?.transactionId || '').trim();
    const rawProductId = String(transaction?.productIdentifier || '').trim();

    // 1. 嚴格驗證 StoreKit 交易結構、Product ID、JWS / Receipt 憑證及撤銷狀態
    const validation = validateIOSTransaction(transaction, expectedProductId);
    if (!validation.valid || !validation.product || !validation.transactionId) {
      const reason = validation.reason || 'UNKNOWN_VALIDATION_FAILURE';
      const classification: UnverifiedClassification =
        validation.classification || classifyUnverifiedReason(reason);

      this.recordUnverifiedDiagnostic(
        rawTxId,
        rawProductId || expectedProductId || 'unknown',
        reason,
        classification,
        source
      );

      console.warn(
        `[MobileIAPService] iOS 交易驗證未通過 (${source}, ${classification}):`,
        rawTxId,
        reason
      );

      // 僅對 Apple StoreKit 已通過簽章驗證且明確標記 revocationDate 的已退款/撤銷交易，
      // 在不使用 allowUnverified 的情況下完成隊列清理（絕不派發商品）。
      // 對所有未驗證 (verificationError / 缺憑證) 交易：嚴禁自動呼叫 allowUnverified: true！
      if (validation.isVerifiedRevocation && rawTxId && NUMERIC_TRANSACTION_ID_RE.test(rawTxId)) {
        try {
          await NativePurchases.finishTransaction({
            transactionId: rawTxId,
          });
        } catch (finishErr) {
          console.warn('[MobileIAPService] 完成已驗證撤銷交易異常:', finishErr);
        }
      }

      return {
        success: false,
        status: 'unverified',
        error: getLocalizedIOSError('unverified', lang),
        transactionId: rawTxId || undefined,
        productId: rawProductId || expectedProductId || undefined,
        platform: 'ios',
      };
    }

    const txId = validation.transactionId;
    const product = validation.product;
    const quantity = validation.quantity || 1;
    const grantedAmount = getProductTotalGrant(product, quantity);

    // 若此筆交易先前曾進入未驗證診斷紀錄，現在已成功通過 StoreKit 2 驗證，移除診斷紀錄
    this.clearUnverifiedDiagnostic(txId);

    // 2. 交易級並發序列化鎖：防止 purchaseProduct / transactionUpdated / recovery 同時處理同一交易
    const existingInFlight = this.inFlightTxPromises.get(txId);
    if (existingInFlight) {
      await existingInFlight.catch(() => {});
      return {
        success: false,
        duplicate: true,
        status: 'duplicate',
        transactionId: txId,
        productId: product.appleProductId,
        grantedAmount,
        category: product.category,
        fulfilledAtomically: true,
        platform: 'ios',
      };
    }

    const workPromise = (async (): Promise<IAPPurchaseResult> => {
      // 3. 檢查權威持久化紀錄：若先前已派發（例如寫入權威 Profile 後、finishTransaction 前閃退），
      //    不得重複派發，只需安全呼叫 finishTransaction() 完成隊列
      if (isTransactionAlreadyGranted(txId)) {
        console.log(
          `[MobileIAPService] 偵測到權威紀錄已派發 Transaction ID (${txId})，略過重複派發並完成 StoreKit 交易`
        );
        try {
          await NativePurchases.finishTransaction({ transactionId: txId });
        } catch (finishErr) {
          console.warn('[MobileIAPService] 完成已入帳交易異常:', finishErr);
        }
        // 注意：絕不因其他同 Product ID 交易的恢復事件提前解除 activeIOSPurchase 鎖定！
        // activeIOSPurchase 僅能由原始 NativePurchases.purchaseProduct() Promise 實際結束後釋放。
        return {
          success: false,
          duplicate: true,
          status: 'duplicate',
          transactionId: txId,
          productId: product.appleProductId,
          grantedAmount,
          category: product.category,
          fulfilledAtomically: true,
          platform: 'ios',
        };
      }

      // 4. 必須已掛載權威派發處理器，否則絕不呼叫 finishTransaction()
      if (!this.fulfillmentHandler) {
        console.warn('[MobileIAPService] 尚未註冊 fulfillmentHandler，暫緩完成交易:', txId);
        return {
          success: false,
          status: 'failed',
          error: getLocalizedIOSError('persist_failed', lang),
          transactionId: txId,
          productId: product.appleProductId,
          platform: 'ios',
        };
      }

      const ledgerEntry: IAPTransactionLedgerEntry = {
        transactionId: txId,
        productId: product.appleProductId,
        category: product.category,
        grantedAmount,
        quantity,
        platform: 'ios',
        grantedAt: Date.now(),
        purchaseDate: transaction.purchaseDate,
        environment: transaction.environment,
      };

      const outcome = this.fulfillmentHandler(ledgerEntry);

      if (outcome.status === 'PERSIST_FAILED') {
        // 權威持久化寫入或讀回驗證失敗：嚴禁呼叫 finishTransaction()，保留未完成狀態等待重試
        console.error('[MobileIAPService] 商品派發權威存檔失敗，保留未完成交易:', txId, outcome.error);
        return {
          success: false,
          status: 'failed',
          error: getLocalizedIOSError('persist_failed', lang),
          transactionId: txId,
          productId: product.appleProductId,
          platform: 'ios',
        };
      }

      // 5. 僅在商品已寫入權威紀錄並通過讀回驗寫（或確認為已入帳重複單）後，才呼叫 StoreKit finishTransaction()
      try {
        await NativePurchases.finishTransaction({ transactionId: txId });
      } catch (finishErr) {
        // 權威紀錄已安全寫入與驗寫；若此時 finishTransaction 失敗，下次開啟檢查權威紀錄會避免重發並再次完成
        console.warn('[MobileIAPService] finishTransaction 呼叫失敗，將在下次啟動自動清理:', txId, finishErr);
      }

      if (outcome.status === 'DUPLICATE') {
        return {
          success: false,
          duplicate: true,
          status: 'duplicate',
          transactionId: txId,
          productId: product.appleProductId,
          grantedAmount,
          category: product.category,
          fulfilledAtomically: true,
          platform: 'ios',
        };
      }

      // 若是背景恢復、Pending 核准或 UI 超時後才結算的延遲成功，通知 App UI 顯示到帳提示
      if (source !== 'purchase') {
        this.emitIOSRecoveryGrant({
          transactionId: txId,
          productId: product.appleProductId,
          category: product.category,
          grantedAmount,
        });
      }

      return {
        success: true,
        status: 'verified',
        transactionId: txId,
        productId: product.appleProductId,
        grantedAmount,
        category: product.category,
        fulfilledAtomically: true,
        platform: 'ios',
      };
    })();

    this.inFlightTxPromises.set(txId, workPromise);
    try {
      return await workPromise;
    } finally {
      this.inFlightTxPromises.delete(txId);
    }
  }

  /**
   * 查詢目前 iOS 原生付款生命週期狀態（區分進行中、UI 逾時等待中與空閒）
   */
  getActiveIOSPurchaseState(): {
    active: boolean;
    phase: ActiveIOSPurchasePhase | 'IDLE';
    productId?: string;
    startedAt?: number;
    uiTimedOut: boolean;
  } {
    if (!this.activeIOSPurchase || this.activeIOSPurchase.settled) {
      return { active: false, phase: 'IDLE', uiTimedOut: false };
    }
    return {
      active: true,
      phase: this.activeIOSPurchase.phase,
      productId: this.activeIOSPurchase.productId,
      startedAt: this.activeIOSPurchase.startedAt,
      uiTimedOut: this.activeIOSPurchase.uiTimedOut,
    };
  }

  private classifyIOSPurchaseError(err: any, lang: SupportedLanguage): IAPPurchaseResult {
    const errMsg = String(err?.message || err || 'Purchase failed');
    const lower = errMsg.toLowerCase();

    // User cancelled -> 不扣資源、不派發、不顯示錯誤警報
    if (
      lower.includes('cancel') ||
      lower.includes('user_canceled') ||
      err?.code === '1' ||
      err?.code === 1 ||
      err?.code === '2' ||
      err?.code === 2
    ) {
      return {
        success: false,
        cancelled: true,
        status: 'cancelled',
        error: 'User cancelled transaction',
        platform: 'ios',
      };
    }

    // Pending / Deferred (例如 Ask to Buy / SCA) -> 禁止提前派發，核准後透過 Transaction.updates 自動補發
    if (lower.includes('pending') || lower.includes('deferred') || lower.includes('ask to buy')) {
      return {
        success: false,
        pending: true,
        status: 'pending',
        error: getLocalizedIOSError('pending', lang),
        platform: 'ios',
      };
    }

    // Verification failed (StoreKit .unverified) -> 記錄診斷且絕不派發
    if (lower.includes('verif') || lower.includes('unverified') || lower.includes('signature')) {
      this.recordUnverifiedDiagnostic(
        '',
        this.activeIOSPurchase?.productId || 'unknown',
        `UNVERIFIED:${errMsg}`,
        classifyUnverifiedReason(errMsg),
        'purchase'
      );
      return {
        success: false,
        status: 'unverified',
        error: getLocalizedIOSError('unverified', lang),
        platform: 'ios',
      };
    }

    // Network interruption
    if (
      lower.includes('network') ||
      lower.includes('internet') ||
      lower.includes('offline') ||
      lower.includes('timed out') ||
      lower.includes('connection')
    ) {
      return {
        success: false,
        status: 'failed',
        error: getLocalizedIOSError('network', lang),
        platform: 'ios',
      };
    }

    return {
      success: false,
      status: 'failed',
      error: getLocalizedIOSError('generic', lang, errMsg),
      platform: 'ios',
    };
  }

  /**
   * 恢復並重新檢查所有尚未完成的 iOS StoreKit 2 交易 (App 啟動 / 崩潰重啟 / 從背景切回前景時呼叫)
   * 注意：僅處理 StoreKit 2 `Transaction.unfinished`，絕不透過 `Transaction.all` 重複派發已消耗商品！
   */
  async recoverUnfinishedIOSTransactions(lang: SupportedLanguage = 'en'): Promise<number> {
    if (!this.isNativeIOS()) return 0;

    if (this.iosRecoveryInFlight) {
      return this.iosRecoveryInFlight;
    }

    this.iosRecoveryInFlight = (async (): Promise<number> => {
      const initialized = await this.initialize();
      if (!initialized || !Capacitor.isPluginAvailable('NativePurchases')) {
        return 0;
      }

      try {
        const { transactions } = await NativePurchases.getUnfinishedTransactions({
          includeUnverified: true,
        });
        if (!Array.isArray(transactions) || transactions.length === 0) {
          // V49 安全原則：Transaction.unfinished 為空絕不代表原始 NativePurchases.purchaseProduct()
          // Promise 已結束、取消或失敗！嚴禁依時間或空白未完成清單提前解除 activeIOSPurchase 鎖定。
          return 0;
        }

        let newlyGrantedCount = 0;
        for (const tx of transactions) {
          const res = await this.handleIncomingIOSTransaction(tx, 'recovery', undefined, lang);
          if (res.success && !res.duplicate) {
            newlyGrantedCount += 1;
          }
        }
        return newlyGrantedCount;
      } catch (err) {
        console.warn('[MobileIAPService] 檢查 iOS 未完成交易異常:', err);
        return 0;
      } finally {
        this.iosRecoveryInFlight = null;
      }
    })();

    return this.iosRecoveryInFlight;
  }

  /**
   * 安全重新檢查進行中或已 UI 逾時的 iOS 購買狀態
   */
  async checkPendingIOSPurchaseStatus(lang: SupportedLanguage = 'en'): Promise<{
    stillPending: boolean;
    recoveredCount: number;
  }> {
    if (!this.isNativeIOS()) {
      return { stillPending: false, recoveredCount: 0 };
    }
    const recoveredCount = await this.recoverUnfinishedIOSTransactions(lang);
    return {
      stillPending: this.hasPendingIOSPurchase(),
      recoveredCount,
    };
  }

  /**
   * 根據 Product ID 尋找產品資料
   */
  findProduct(productIdOrInternalId: string): MobileIAPProduct | undefined {
    const allProducts = [...APPLE_HEARTS_PRODUCTS, ...APPLE_COINS_PRODUCTS];
    const exactMatch = allProducts.find(
      (p) =>
        p.appleProductId === productIdOrInternalId ||
        p.googleProductId === productIdOrInternalId ||
        p.id === productIdOrInternalId
    );
    if (exactMatch) return exactMatch;

    const suffix = productIdOrInternalId.split('.').pop();
    if (!suffix) return undefined;
    return allProducts.find(
      (p) =>
        p.googleProductId.endsWith(`.${suffix}`) ||
        p.appleProductId.endsWith(`.${suffix}`)
    );
  }

  /**
   * 發起雙平台內購交易
   * - Android：完全保留原有 Google Play Billing 流程
   * - iOS：分離 UI 180 秒等待與原生 StoreKit 2 購買狀態，保留延遲成功／失敗處理，嚴禁重疊發起購買
   * - Web：僅於明確的開發預覽環境 (import.meta.env.DEV) 允許模擬付款
   */
  async purchaseProduct(
    productIdentifier: string,
    lang: SupportedLanguage = 'en'
  ): Promise<IAPPurchaseResult> {
    const product = this.findProduct(productIdentifier);
    const platform = this.getCurrentPlatform();
    const targetId = product
      ? platform === 'android'
        ? product.googleProductId
        : product.appleProductId
      : productIdentifier;

    // =========================================================================
    // 1. iOS 原生環境 (Apple StoreKit 2 正式安全流程)
    // =========================================================================
    if (platform === 'ios') {
      // 若前次原生付款尚未確認結束（包含已觸發 180 秒 UI 逾時但原始 Promise 仍未 settle 者）：
      // 先觸發一次安全未完成交易恢復檢查，但絕不依空白結果解除鎖定，亦絕不重疊發起第二筆購買！
      if (this.activeIOSPurchase && !this.activeIOSPurchase.settled) {
        await this.checkPendingIOSPurchaseStatus(lang);
        if (this.activeIOSPurchase && !this.activeIOSPurchase.settled) {
          const msgKey = this.activeIOSPurchase.uiTimedOut
            ? 'still_processing_restart'
            : 'still_processing';
          return {
            success: false,
            pending: true,
            status: 'pending',
            error: getLocalizedIOSError(msgKey, lang),
            platform: 'ios',
          };
        }
      }

      const initialized = await this.initialize();
      if (!initialized || !Capacitor.isPluginAvailable('NativePurchases')) {
        return {
          success: false,
          status: 'unavailable',
          error: getLocalizedIOSError('no_plugin', lang),
          platform: 'ios',
        };
      }

      let billingSupported = false;
      try {
        const billingCheck = await NativePurchases.isBillingSupported();
        billingSupported = Boolean(billingCheck?.isBillingSupported);
      } catch (err) {
        return this.classifyIOSPurchaseError(err, lang);
      }

      if (!billingSupported) {
        return {
          success: false,
          status: 'unavailable',
          error: getLocalizedIOSError('billing_unsupported', lang),
          platform: 'ios',
        };
      }

      // 確認目標商品在 StoreKit 中可用（如尚未載入則即時查詢一次）
      if (!this.getIOSProduct(targetId)) {
        await this.loadIOSProducts(true);
      }
      if (!this.getIOSProduct(targetId)) {
        return {
          success: false,
          status: 'unavailable',
          error: getLocalizedIOSError('product_unavailable', lang),
          platform: 'ios',
        };
      }

      // 再次檢查併發狀態（防止等待 loadIOSProducts 期間已有另一筆啟動）
      if (this.activeIOSPurchase && !this.activeIOSPurchase.settled) {
        return {
          success: false,
          pending: true,
          status: 'pending',
          error: getLocalizedIOSError('still_processing', lang),
          platform: 'ios',
        };
      }

      // 建立原生交易狀態追蹤物件（與 UI 180 秒等待分離）
      const activeState: ActiveIOSPurchaseState = {
        productId: targetId,
        startedAt: Date.now(),
        uiTimedOut: false,
        settled: false,
        phase: 'NATIVE_SHEET_IN_PROGRESS',
        lang,
        nativeFlowPromise: Promise.resolve({ success: false, platform: 'ios' }),
      };

      // 保留並完整處理原始 NativePurchases.purchaseProduct() 的所有延遲結果；
      // activeIOSPurchase 鎖定僅由此原始原生 Promise 結束 (.finally) 時釋放！
      const nativeFlowPromise: Promise<IAPPurchaseResult> = NativePurchases.purchaseProduct({
        productIdentifier: targetId,
        productType: PURCHASE_TYPE.INAPP,
        quantity: 1,
        autoAcknowledgePurchases: false,
      })
        .then(async (transaction) => {
          // 若 UI 已經先 180 秒逾時，切換為 'updates' 來源以主動觸發 App 到帳提示！
          const deliverySource = activeState.uiTimedOut ? 'updates' : 'purchase';
          return await this.handleIncomingIOSTransaction(
            transaction,
            deliverySource,
            targetId,
            activeState.lang
          );
        })
        .catch((err) => {
          return this.classifyIOSPurchaseError(err, activeState.lang);
        })
        .finally(() => {
          activeState.settled = true;
          if (this.activeIOSPurchase === activeState) {
            this.activeIOSPurchase = null;
          }
        });

      activeState.nativeFlowPromise = nativeFlowPromise;
      this.activeIOSPurchase = activeState;

      // UI 等待上限 180 秒：超時僅結束 UI Loading，不視交易為取消，亦不提前釋放原生鎖！
      let uiTimer: ReturnType<typeof setTimeout> | null = null;
      const uiTimeoutPromise = new Promise<'UI_TIMEOUT'>((resolve) => {
        uiTimer = setTimeout(() => resolve('UI_TIMEOUT'), this.iosPurchaseUiTimeoutMs);
      });

      const raceResult = await Promise.race([nativeFlowPromise, uiTimeoutPromise]).finally(() => {
        if (uiTimer) {
          clearTimeout(uiTimer);
          uiTimer = null;
        }
      });

      if (raceResult === 'UI_TIMEOUT') {
        if (!activeState.settled) {
          activeState.uiTimedOut = true;
          activeState.phase = 'UI_TIMED_OUT_WAITING_NATIVE';
        }
        // 背景安全檢查一次未完成交易（絕不解除尚未結束的原生鎖）
        void this.recoverUnfinishedIOSTransactions(lang);
        return {
          success: false,
          pending: true,
          status: 'pending',
          error: getLocalizedIOSError('still_processing', lang),
          platform: 'ios',
        };
      }

      return raceResult;
    }

    // =========================================================================
    // 2. Android 原生環境 (完全保留原有 Google Play Billing 運作邏輯，不作更動)
    // =========================================================================
    if (platform === 'android') {
      await this.initialize();
      console.log(`[MobileIAPService] 發起購買 (android): ${targetId}`);

      if (!Capacitor.isPluginAvailable('NativePurchases')) {
        return {
          success: false,
          error: 'Google Play 付款服務暫時無法使用，請確認已從 Google Play 安裝並登入帳號。',
          platform: 'android',
        };
      }

      try {
        const billingCheck = await NativePurchases.isBillingSupported();
        if (!billingCheck.isBillingSupported) {
          return {
            success: false,
            error: '此裝置目前不支援 Google Play 付款，請確認已登入 Google 帳號。',
            platform: 'android',
          };
        }

        // 先查詢商店商品確保 Product ID 已在 Google Play 商店上架並啟用
        const { products } = await NativePurchases.getProducts({
          productIdentifiers: [targetId],
          productType: PURCHASE_TYPE.INAPP,
        });

        if (!products || products.length === 0) {
          return {
            success: false,
            error: '此商品尚未於 Google Play 商店啟用，請稍後再試。',
            platform: 'android',
          };
        }

        const transaction = await NativePurchases.purchaseProduct({
          productIdentifier: targetId,
          productType: PURCHASE_TYPE.INAPP,
          isConsumable: true,
          autoAcknowledgePurchases: true,
        });

        if (!transaction || !transaction.transactionId) {
          return {
            success: false,
            error: '未收到商店付款憑證，交易未完成。',
            platform: 'android',
          };
        }

        return {
          success: true,
          transactionId: transaction.transactionId,
          productId: transaction.productIdentifier || targetId,
          platform: 'android',
        };
      } catch (err: any) {
        const errMsg = String(err?.message || err || 'Purchase failed');
        const lower = errMsg.toLowerCase();
        if (
          lower.includes('cancel') ||
          lower.includes('user_canceled') ||
          err?.code === '1' ||
          err?.code === 1 ||
          err?.code === '2' ||
          err?.code === 2
        ) {
          return {
            success: false,
            cancelled: true,
            error: 'User cancelled transaction',
            platform: 'android',
          };
        }
        return {
          success: false,
          error: `Google Play 付款未完成：${errMsg}`,
          platform: 'android',
        };
      }
    }

    // =========================================================================
    // 3. Web 預覽環境：僅允許明確的開發模式 (import.meta.env.DEV)
    //    Vite Production / iOS Release Build 編譯期會將 DEV 分支完全剔除！
    // =========================================================================
    if (import.meta.env.DEV && !isCapacitorNative()) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return {
        success: true,
        status: 'verified',
        transactionId: `web_dev_tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        productId: targetId,
        platform: 'web',
      };
    }

    return {
      success: false,
      status: 'unavailable',
      error: getLocalizedIOSError('no_plugin', lang),
      platform: 'web',
    };
  }

  /**
   * 恢復與重新驗證未完成交易 (Check / Re-verify Purchases)
   * - iOS：全部 8 款皆為 Consumable，絕不透過 Restore Purchases 重複派發已消耗商品；
   *   若存在可能可恢復的未驗證交易，在用戶主動觸發時才呼叫 AppStore.sync() (NativePurchases.restorePurchases)
   *   再重新查詢 getUnfinishedTransactions({ includeUnverified: true })。
   * - Android：完全保留既有行為。
   */
  async restorePurchases(lang: SupportedLanguage = 'en'): Promise<IAPRestoreResult> {
    await this.initialize();
    const platform = this.getCurrentPlatform();

    if (platform === 'ios') {
      if (!Capacitor.isPluginAvailable('NativePurchases')) {
        return {
          success: false,
          restoredCount: 0,
          message: getLocalizedIOSError('no_plugin', lang),
        };
      }

      try {
        // 僅於存在可能可恢復之未驗證交易時，於用戶明確手動請求下同步 AppStore.sync() 以利 StoreKit 重新校驗
        const hasRecoverableUnverified = Array.from(this.unverifiedDiagnostics.values()).some(
          (rec) => rec.classification === 'POTENTIALLY_RECOVERABLE'
        );
        if (hasRecoverableUnverified) {
          try {
            await NativePurchases.restorePurchases();
          } catch (syncErr) {
            console.warn('[MobileIAPService] AppStore.sync() 重新驗證嘗試異常:', syncErr);
          }
        }

        // 僅恢復未完成且通過驗證的交易，絕不重發已消耗商品
        const recoveredCount = await this.recoverUnfinishedIOSTransactions(lang);
        const msg =
          recoveredCount > 0
            ? lang === 'en'
              ? `Delivered ${recoveredCount} unfinished purchase(s). Note: Already-consumed Hearts & Coins cannot be restored.`
              : lang === 'ja'
              ? `未完了の購入 ${recoveredCount} 件を付与しました。消費済みアイテムは復元対象外です。`
              : lang === 'zh-CN'
              ? `已补发 ${recoveredCount} 笔未完成交易。提示：已消耗的爱心与金币不支持重复恢复。`
              : `已補發 ${recoveredCount} 筆未完成交易。提示：已消耗的愛心與金幣不支援重複恢復。`
            : lang === 'en'
            ? 'No pending purchases found. Consumable Hearts & Coins are credited immediately upon purchase and are non-restorable once consumed.'
            : lang === 'ja'
            ? '未処理の購入はありません。消耗品（ハート・コイン）は購入時に即時付与され、消費後の復元対象外です。'
            : lang === 'zh-CN'
            ? '没有待处理的未完成交易。爱心与金币为消耗型商品，购买后即刻发放，已消耗商品不支持恢复购买。'
            : '沒有待處理的未完成交易。愛心與金幣為消耗型商品，購買後即刻派發，已消耗商品不支援恢復購買。';

        return {
          success: true,
          restoredCount: recoveredCount,
          message: msg,
        };
      } catch (err: any) {
        const failMsg =
          lang === 'en'
            ? 'Failed to check unfinished purchases: ' + (err?.message || 'Unknown error')
            : lang === 'ja'
            ? '未完了の購入確認に失敗しました: ' + (err?.message || '')
            : lang === 'zh-CN'
            ? '检查未完成交易失败：' + (err?.message || '网络连接异常')
            : '檢查未完成交易失敗：' + (err?.message || '網路連線異常');
        return {
          success: false,
          restoredCount: 0,
          message: failMsg,
        };
      }
    }

    if (platform === 'android') {
      if (!Capacitor.isPluginAvailable('NativePurchases')) {
        return {
          success: false,
          restoredCount: 0,
          message:
            lang === 'en'
              ? 'Store billing service unavailable.'
              : '商店付款服務暫時無法使用。',
        };
      }

      try {
        await NativePurchases.restorePurchases();
        const { purchases } = await NativePurchases.getPurchases({
          productType: PURCHASE_TYPE.INAPP,
        });
        const restoredCount = purchases?.length || 0;
        const msg =
          lang === 'en'
            ? 'Google Play purchase history verified.'
            : lang === 'ja'
            ? 'Google Play の購入履歴を確認しました。'
            : lang === 'zh-CN'
            ? 'Google Play 账户购买记录检查完毕。'
            : 'Google Play 帳戶購買紀錄檢查完畢。';
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

    // Web 環境
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
   * 清理 iOS 監聽器 (測試或卸載用)
   */
  async cleanupListeners(): Promise<void> {
    try {
      await this.iosUpdateListener?.remove();
    } catch {
      // ignore
    }
    try {
      await this.iosVerificationFailedListener?.remove();
    } catch {
      // ignore
    }
    this.iosUpdateListener = null;
    this.iosVerificationFailedListener = null;
    this.iosListenersAttached = false;
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
  getStoreName(lang: SupportedLanguage = 'en'): string {
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
  getStoreBadgeLabel(lang: SupportedLanguage = 'en'): string {
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
    if (lang === 'en') return 'App Store & Google Play In-App Purchase';
    if (lang === 'ja') return 'Apple & Google Play 公式アプリ内課金';
    if (lang === 'zh-CN') return 'Apple & Google Play 官方安全内购';
    return 'Apple & Google Play 雙平台官方內購';
  }

  /**
   * 取得付款方式標籤
   */
  getPaymentMethodBadge(lang: SupportedLanguage = 'en'): string {
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
  getAccountNotice(lang: SupportedLanguage = 'en'): string {
    const platform = this.getCurrentPlatform();
    if (platform === 'ios') {
      if (lang === 'en') return 'Payment will be charged to your Apple ID account. Consumables are credited instantly.';
      if (lang === 'ja') return '購入代金は Apple ID アカウントに請求されます。消耗品は即時付与されます。';
      if (lang === 'zh-CN') return '款项将从您的 Apple ID 账户扣除，消耗型商品立即发放。';
      return '款項將從您的 Apple ID 帳戶扣除，消耗型商品立即派發。';
    }
    if (platform === 'android') {
      if (lang === 'en') return 'Payment will be charged to your Google Play account.';
      if (lang === 'ja') return '購入代金は Google Play アカウントに請求されます。';
      if (lang === 'zh-CN') return '款项将从您的 Google Play 账户扣除。';
      return '款項將從您的 Google Play 帳戶扣除。';
    }
    return lang === 'en'
      ? 'Processed securely by Apple App Store or Google Play.'
      : '透過 Apple App Store 或 Google Play 官方安全結帳。';
  }
}

export const iapService = new MobileIAPService();
