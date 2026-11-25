import React, { useState, useEffect, useRef } from 'react';
import { Heart, Film, CreditCard, X, Check, Sparkles, Flame, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { SupportedLanguage, getTranslation } from '../utils/i18n';
import confetti from 'canvas-confetti';
import { CuteModalBackground } from './CuteModalBackground';
import { CoinIcon } from './CoinIcon';
import { admobService, isCapacitorNative } from '../services/admobService';
import { iapService, type IOSCatalogState } from '../services/iapService';

export interface HeartPackage {
  id: string;
  appleProductId: string;
  name: string;
  hearts: number;
  bonusHearts?: number;
  priceTag: string;
  usdApprox: string;
  isPopular?: boolean;
  isBestValue?: boolean;
}

export const HEART_PACKAGES: HeartPackage[] = [
  {
    id: 'heart_tier_1',
    appleProductId: 'com.elemall.snakegame.hearts10',
    name: '基礎愛心袋 (10 顆心)',
    hearts: 10,
    priceTag: '$1.00 USD',
    usdApprox: '$1.00 USD',
  },
  {
    id: 'heart_tier_2',
    appleProductId: 'com.elemall.snakegame.hearts32',
    name: '人氣愛心盒 (贈2心)',
    hearts: 30,
    bonusHearts: 2,
    priceTag: '$2.99 USD',
    usdApprox: '$2.99 USD',
    isPopular: true,
  },
  {
    id: 'heart_tier_3',
    appleProductId: 'com.elemall.snakegame.hearts75',
    name: '超狂愛心箱 (贈15心)',
    hearts: 60,
    bonusHearts: 15,
    priceTag: '$5.99 USD',
    usdApprox: '$5.99 USD',
    isBestValue: true,
  },
  {
    id: 'heart_tier_4',
    appleProductId: 'com.elemall.snakegame.hearts160',
    name: '皇家至尊寶庫 (贈40心)',
    hearts: 120,
    bonusHearts: 40,
    priceTag: '$11.99 USD',
    usdApprox: '$11.99 USD',
  },
];

interface HeartsModalProps {
  isOpen: boolean;
  hearts: number;
  maxHearts: number;
  coins: number;
  dailyAdWatchCount?: number;
  maxDailyAds?: number;
  nextRefillSeconds: number;
  totalRefillSeconds: number;
  language?: SupportedLanguage;
  onClose: () => void;
  onAddHearts: (amount: number, coinCost?: number) => boolean;
  onWatchAdReward?: () => boolean;
  onOpenShop?: (tab?: 'SKINS' | 'ARENAS' | 'COINS') => void;
}

export const HeartsModal: React.FC<HeartsModalProps> = ({
  isOpen,
  hearts,
  maxHearts: _maxHearts,
  coins,
  dailyAdWatchCount = 0,
  maxDailyAds = 5,
  nextRefillSeconds: _nextRefillSeconds,
  language = 'zh-HK',
  onClose,
  onAddHearts,
  onWatchAdReward,
}) => {
  const isIOS = iapService.isNativeIOS();
  const [adWatching, setAdWatching] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [purchaseNotice, setPurchaseNotice] = useState<{ text: string; tone: 'success' | 'error' | 'info' } | null>(null);
  const [purchasingPkgId, setPurchasingPkgId] = useState<string | null>(null);
  const [iosCatalog, setIosCatalog] = useState<IOSCatalogState>(() => iapService.getIOSCatalogState());

  const purchasingRef = useRef(false);
  const adActionLockRef = useRef(false);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotice = (text: string, tone: 'success' | 'error' | 'info' = 'success', durationMs = 3500) => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setPurchaseNotice({ text, tone });
    noticeTimerRef.current = setTimeout(() => {
      setPurchaseNotice(null);
      noticeTimerRef.current = null;
    }, durationMs);
  };

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  // iOS 專用：訂閱 StoreKit 真實商品目錄並在開啟視窗時載入本地化價格
  useEffect(() => {
    if (!isIOS) return;
    const unsubscribe = iapService.subscribeIOSCatalog(setIosCatalog);
    return unsubscribe;
  }, [isIOS]);

  useEffect(() => {
    if (isOpen && isIOS) {
      void iapService.loadIOSProducts();
    }
  }, [isOpen, isIOS]);

  const maxAds = maxDailyAds ?? 5;
  const currentAdCount = dailyAdWatchCount ?? 0;
  const remainingAds = Math.max(0, maxAds - currentAdCount);
  const isAdLimitReached = remainingAds <= 0;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  // 發放看廣告獎勵
  const grantReward = () => {
    let success = false;
    if (onWatchAdReward) {
      success = onWatchAdReward();
    } else {
      success = onAddHearts(1);
    }

    if (success) {
      soundEngine.playSpecialEat();
      triggerConfetti();
      const nextRemaining = Math.max(0, remainingAds - 1);
      const msg =
        language === 'en'
          ? `Ad Reward: +1 Heart received! ❤️ (${nextRemaining}/${maxAds} ads left today)`
          : language === 'ja'
          ? `広告リワード：ハート+1個獲得！❤️ (本日残り ${nextRemaining}/${maxAds}回)`
          : language === 'zh-CN'
          ? `看广告奖励：已获取 +1 颗爱心！❤️ (今日剩余 ${nextRemaining}/${maxAds} 次)`
          : `看廣告獎勵：已獲取 +1 顆愛心！❤️ (今日剩餘 ${nextRemaining}/${maxAds} 次)`;
      showNotice(msg, 'success');
    }
    return success;
  };

  // 僅限明確開發預覽環境 (Vite DEV 且非原生裝置) 之 5 秒模擬短片倒數；Production / iOS Release Build 編譯期完全剔除
  useEffect(() => {
    if (!import.meta.env.DEV || isCapacitorNative()) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (adWatching && adCountdown > 0) {
      timer = setTimeout(() => {
        setAdCountdown((c) => {
          if (c > 1) {
            soundEngine.playTurn();
          }
          return c - 1;
        });
      }, 1000);
    } else if (adWatching && adCountdown === 0) {
      setAdWatching(false);
      grantReward();
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [adWatching, adCountdown]);

  if (!isOpen) return null;

  const getAdUnavailableMessage = () =>
    language === 'en'
      ? 'Ad is currently unavailable. Please try again later.'
      : language === 'ja'
      ? '広告は現在利用できません。しばらくしてからもう一度お試しください。'
      : language === 'zh-CN'
      ? '广告暂时不可用，请稍后再试！'
      : '廣告暫時不可用，請稍後再試！';

  const handleWatchAd = async () => {
    if (isAdLimitReached || isAdLoading || adWatching || adActionLockRef.current) {
      soundEngine.playTurn();
      return;
    }
    soundEngine.playClick();
    adActionLockRef.current = true;
    setIsAdLoading(true);

    try {
      // 1. 原生手機環境 (Capacitor iOS / Android)：嚴格禁止任何模擬廣告 fallback 或免費派發
      if (isCapacitorNative()) {
        if (!admobService.hasNativePlugin()) {
          showNotice(getAdUnavailableMessage(), 'info');
          return;
        }

        const result = await admobService.showRewardedAd();
        if (result.success && result.playedNativeAd && result.rewardEarned !== false) {
          grantReward();
          return;
        }

        if (result.reason !== 'USER_DISMISSED' && result.reason !== 'ALREADY_LOADING') {
          if (result.reason !== 'CONSENT_REQUIRED') {
            void admobService.preloadRewardedAd();
          }
          showNotice(getAdUnavailableMessage(), 'info');
        }
        return;
      }

      // 2. Web 瀏覽器：僅在明確的開發預覽環境 (import.meta.env.DEV) 允許模擬廣告；
      //    Production / iOS Release Build 中此分支編譯期完全剔除，絕不可觸發。
      if (import.meta.env.DEV) {
        setAdCountdown(5);
        setAdWatching(true);
        return;
      }

      showNotice(getAdUnavailableMessage(), 'info');
    } catch (err) {
      console.warn('[HeartsModal] 調用原生 AdMob 異常:', err);
      showNotice(getAdUnavailableMessage(), 'info');
    } finally {
      setIsAdLoading(false);
      adActionLockRef.current = false;
    }
  };

  // 要 5000 個金幣先可以換一個心
  const handleBuyWithCoins = (amount: number, cost: number) => {
    soundEngine.playClick();
    const success = onAddHearts(amount, cost);
    if (success) {
      triggerConfetti();
      const msg =
        language === 'en'
          ? `Exchange success! +${amount} Heart${amount > 1 ? 's' : ''} received (-${cost} Coins)!`
          : language === 'ja'
          ? `交換成功！ハート+${amount}個獲得 (-${cost} コイン)！`
          : language === 'zh-CN'
          ? `兑换成功！已获得 +${amount} 颗爱心 (消耗 ${cost} 金币)！`
          : `兌換成功！已獲得 +${amount} 顆愛心 (消耗 ${cost} 金幣)！`;
      showNotice(msg, 'success', 2500);
    }
  };

  // 購買愛心 (Apple StoreKit 2 / Google Play Billing)
  const handleBuyPackage = async (pkg: HeartPackage) => {
    if (purchasingPkgId || purchasingRef.current) return;

    // iOS：商品未載入或不可用時禁止發起購買（不得模擬）
    if (isIOS && !iosCatalog.products[pkg.appleProductId]) {
      soundEngine.haptic('collision');
      showNotice(
        language === 'en'
          ? 'Product unavailable from App Store. Please tap Retry.'
          : language === 'ja'
          ? 'App Store から商品情報を取得できません。再試行してください。'
          : language === 'zh-CN'
          ? '此商品暂时不可用，请点击重试重新加载。'
          : '此商品暫時不可用，請點擊重試重新載入。',
        'error'
      );
      return;
    }

    soundEngine.playClick();
    purchasingRef.current = true;
    setPurchasingPkgId(pkg.id);

    try {
      const result = await iapService.purchaseProduct(pkg.appleProductId, language);
      if (result.success) {
        const totalHearts = result.grantedAmount || pkg.hearts + (pkg.bonusHearts || 0);
        // iOS 交易已在 iapService + App 層原子派發並寫入持久化 Ledger，避免重複派發；
        // Android / Web DEV 維持既有 onAddHearts 呼叫。
        if (!result.fulfilledAtomically) {
          onAddHearts(totalHearts);
        }
        soundEngine.playSpecialEat();
        triggerConfetti();

        const msg =
          language === 'en'
            ? `Purchase complete! +${totalHearts} Hearts added! ❤️`
            : language === 'ja'
            ? `IAP 購入完了！ハート+${totalHearts}個獲得！❤️`
            : language === 'zh-CN'
            ? `官方内购成功！已获取 +${totalHearts} 颗爱心！❤️`
            : `官方內購成功！已獲取 +${totalHearts} 顆愛心！❤️`;
        showNotice(msg, 'success');
      } else if (result.pending && result.error) {
        showNotice(result.error, 'info', 5000);
      } else if (!result.cancelled && !result.duplicate && result.error) {
        soundEngine.haptic('collision');
        showNotice(result.error, 'error');
      }
    } catch (e: any) {
      console.error('IAP Hearts error:', e);
    } finally {
      purchasingRef.current = false;
      setPurchasingPkgId(null);
    }
  };

  const iosHeartProductsAvailableCount = isIOS
    ? HEART_PACKAGES.filter((p) => Boolean(iosCatalog.products[p.appleProductId])).length
    : HEART_PACKAGES.length;
  const showIOSRetryBanner =
    isIOS &&
    iosCatalog.status !== 'loading' &&
    iosCatalog.status !== 'idle' &&
    iosHeartProductsAvailableCount < HEART_PACKAGES.length;

  const isOutOfHearts = hearts <= 0;

  // Localized title (愛心補給站)
  const modalTitle = isOutOfHearts
    ? language === 'en'
      ? '💔 Out of Hearts'
      : language === 'ja'
      ? '💔 ハート補給所'
      : language === 'zh-CN'
      ? '💔 爱心补给站'
      : '💔 愛心補給站'
    : language === 'en'
    ? 'Heart Refill Station'
    : language === 'ja'
    ? 'ハート補給所'
    : language === 'zh-CN'
    ? '爱心补给站'
    : '愛心補給站';

  const watchAdTitle =
    language === 'en'
      ? 'Watch Short Video (Free)'
      : language === 'ja'
      ? '動画広告を見る (無料)'
      : language === 'zh-CN'
      ? '看短片广告 (免费)'
      : '看短片廣告 (免費)';

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 pt-[calc(max(env(safe-area-inset-top),0.5rem)+3.2rem)] pb-3 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          soundEngine.playClick();
          onClose();
        }
      }}
    >
      {/* Sponsor Video Ad Overlay — 僅限本機開發預覽 (Vite DEV + 非原生環境)，iOS Release Build 會在編譯期完全移除 */}
      {import.meta.env.DEV && !isCapacitorNative() && adWatching && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-between p-6 animate-fade-in text-center select-none">
          {/* Header Spacer (circled elements removed per request) */}
          <div className="w-full max-w-md pt-safe" />

          {/* Central Animated Content */}
          <div className="flex flex-col items-center gap-4 my-auto max-w-xs">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 flex items-center justify-center shadow-2xl shadow-rose-500/40 animate-pulse">
                <Sparkles className="w-12 h-12 text-slate-950" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-slate-950 font-black shadow-lg">
                <Heart className="w-4 h-4 fill-slate-950" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-black text-white tracking-wide">
                SNAKE ENERGY REFILL
              </h2>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                {language === 'en'
                  ? 'Watching sponsor message... +1 Heart will be awarded immediately!'
                  : language === 'ja'
                  ? '動画を視聴中... 終了後にハート+1個を自動付與！'
                  : language === 'zh-CN'
                  ? '正在播放赞助短片... 播放完成后立即获得 +1 颗爱心！'
                  : '正在播放贊助短片... 播放完成後立即獲得 +1 顆愛心！'}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-teal-400 via-rose-500 to-amber-400 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${((5 - adCountdown) / 5) * 100}%` }}
              />
            </div>

            <div className="text-[11px] font-mono text-slate-400">
              {adCountdown > 0 ? `${5 - adCountdown} / 5 sec` : '100%'}
            </div>
          </div>

          {/* Footer Spacer (circled elements removed per request) */}
          <div className="pb-safe" />
        </div>
      )}

      {/* Main Modal Card */}
      <CuteModalBackground
        theme="hearts"
        className="w-full max-w-sm sm:max-w-md flex flex-col max-h-[calc(100dvh-max(env(safe-area-inset-top),0.5rem)-4.5rem)] text-slate-100 shadow-2xl overflow-hidden"
      >
        {/* Sticky Header */}
        <div className="p-3.5 sm:p-4 border-b border-rose-500/20 bg-slate-950/75 flex items-center justify-between shrink-0 z-10 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
              <Heart className="w-5 h-5 fill-rose-500" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-white truncate">
                {modalTitle}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-95 shrink-0 cursor-pointer shadow-md touch-manipulation"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-3">
          {purchaseNotice && (
            <div
              className={`text-xs font-bold py-2 px-3 rounded-xl animate-fade-in flex items-center justify-center gap-1.5 shadow-md border ${
                purchaseNotice.tone === 'error'
                  ? 'text-rose-300 bg-rose-500/15 border-rose-500/30'
                  : purchaseNotice.tone === 'info'
                  ? 'text-amber-300 bg-amber-500/15 border-amber-500/30'
                  : 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
              }`}
            >
              {purchaseNotice.tone === 'error' || purchaseNotice.tone === 'info' ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <Check className="w-4 h-4 shrink-0" />
              )}
              <span>{purchaseNotice.text}</span>
            </div>
          )}

          {/* Refill Options */}
          <div className="space-y-2 pt-0.5">
            {/* 1. 睇一次廣告可以加1個心 (每日最多 5 次) */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-teal-950/40 to-slate-900 border border-teal-500/30 flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center shrink-0">
                  <Film className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-teal-200 truncate">{watchAdTitle}</span>
                  {isAdLimitReached && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full border bg-rose-500/20 text-rose-300 border-rose-500/30">
                      {language === 'en'
                        ? `Limit (${maxAds}/${maxAds})`
                        : language === 'ja'
                        ? `本日上限 (${maxAds}/${maxAds})`
                        : language === 'zh-CN'
                        ? `今日已达上限 (${maxAds}/${maxAds})`
                        : `今日已達上限 (${maxAds}/${maxAds})`}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={isAdLimitReached || isAdLoading || adWatching}
                onClick={handleWatchAd}
                className={`px-3 py-2 rounded-xl font-bold text-xs transition-all shrink-0 active:scale-95 shadow-sm flex items-center gap-1 min-h-[40px] touch-manipulation min-w-[65px] justify-center ${
                  isAdLimitReached
                    ? 'bg-slate-800 text-slate-500 border border-slate-700/80 cursor-not-allowed'
                    : isAdLoading
                    ? 'bg-teal-600 text-teal-100 cursor-wait'
                    : 'bg-teal-500 hover:bg-teal-400 text-slate-950 cursor-pointer shadow-teal-500/20'
                }`}
              >
                {isAdLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{language === 'en' ? 'Loading...' : '連線中...'}</span>
                  </>
                ) : (
                  <>
                    <Heart className={`w-3.5 h-3.5 ${isAdLimitReached ? 'text-slate-500' : 'fill-slate-950'}`} />
                    <span>
                      {isAdLimitReached
                        ? language === 'en'
                          ? 'Limit Reached'
                          : language === 'ja'
                          ? '上限到達'
                          : language === 'zh-CN'
                          ? '今日已达上限'
                          : '今日已達上限'
                        : '+1'}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* 2. 金幣換心 (+1 心 = 5000 金幣) */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/30 to-slate-900 border border-amber-500/30 flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                </div>
                <span className="text-xs font-black text-white">+1</span>
              </div>

              <button
                type="button"
                disabled={coins < 5000}
                onClick={() => handleBuyWithCoins(1, 5000)}
                className={`py-2 px-3.5 rounded-xl font-black text-xs transition-all active:scale-95 shadow-sm flex items-center gap-1.5 shrink-0 min-h-[40px] ${
                  coins >= 5000
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 hover:brightness-110 shadow-amber-500/20 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-slate-700/80 cursor-not-allowed'
                }`}
              >
                <span>5000</span>
                <CoinIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3. 購買愛心 (雙平台官方應用程式內購專區) */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/50 to-slate-900 border border-indigo-500/40 flex flex-col gap-2.5 shadow-md">
              {showIOSRetryBanner && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-between gap-2 text-xs text-amber-200">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-300" />
                    <span className="leading-snug">
                      {language === 'en'
                        ? 'Unable to load App Store prices. Please retry.'
                        : language === 'ja'
                        ? 'App Store の価格情報を読み込めませんでした。再試行してください。'
                        : language === 'zh-CN'
                        ? '无法从 App Store 载入商品价格，请重试。'
                        : '無法從 App Store 載入商品價格，請重試。'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      void iapService.loadIOSProducts(true);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] flex items-center gap-1 shrink-0 active:scale-95 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>
                      {language === 'en'
                        ? 'Retry'
                        : language === 'ja'
                        ? '再試行'
                        : language === 'zh-CN'
                        ? '重试'
                        : '重試'}
                    </span>
                  </button>
                </div>
              )}

              <div className="space-y-1.5">
                {HEART_PACKAGES.map((pkg) => {
                  const totalHearts = pkg.hearts + (pkg.bonusHearts || 0);
                  const isThisPurchasing = purchasingPkgId === pkg.id;
                  const storeProduct = isIOS ? iosCatalog.products[pkg.appleProductId] : undefined;
                  const isCatalogLoading =
                    isIOS && (iosCatalog.status === 'idle' || iosCatalog.status === 'loading');
                  const isProductUnavailable = isIOS && !isCatalogLoading && !storeProduct;
                  const isButtonDisabled =
                    purchasingPkgId !== null || isCatalogLoading || isProductUnavailable;
                  const displayPrice = isIOS ? storeProduct?.priceString : pkg.priceTag;

                  return (
                    <div
                      key={pkg.id}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                        pkg.isBestValue
                          ? 'bg-gradient-to-r from-amber-950/50 to-indigo-950/60 border-amber-400/60 shadow-sm'
                          : pkg.isPopular
                          ? 'bg-gradient-to-r from-rose-950/40 to-indigo-950/50 border-rose-400/50 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                          <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <div className="text-xs font-black text-white flex items-center gap-1.5 flex-wrap">
                            <span className="shrink-0">+{totalHearts}</span>
                            {pkg.bonusHearts && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0 whitespace-nowrap">
                                {getTranslation('bonusHeartsTag', language).replace('{n}', String(pkg.bonusHearts))}
                              </span>
                            )}
                            {pkg.isBestValue && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 inline-flex items-center gap-0.5 shrink-0 whitespace-nowrap">
                                <Flame className="w-2.5 h-2.5 fill-slate-950 shrink-0" />
                                <span>{getTranslation('bestValueBadgeShort', language)}</span>
                              </span>
                            )}
                            {pkg.isPopular && !pkg.isBestValue && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-pink-500 text-white shrink-0 whitespace-nowrap">
                                {getTranslation('popularBadgeShort', language)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isButtonDisabled}
                        onClick={() => handleBuyPackage(pkg)}
                        className={`py-1.5 px-2.5 sm:px-3 rounded-xl font-black text-xs transition-all active:scale-95 shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap min-h-[36px] ${
                          isThisPurchasing || isCatalogLoading
                            ? 'bg-slate-700 text-slate-300 cursor-wait'
                            : isProductUnavailable
                            ? 'bg-slate-800 text-slate-500 border border-slate-700/80 cursor-not-allowed'
                            : pkg.isBestValue
                            ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 hover:brightness-110 shadow-amber-500/20 cursor-pointer'
                            : pkg.isPopular
                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:brightness-110 shadow-pink-500/20 cursor-pointer'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 cursor-pointer'
                        }`}
                      >
                        {isThisPurchasing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{language === 'en' ? 'Processing...' : '連線中...'}</span>
                          </>
                        ) : isCatalogLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>
                              {language === 'en'
                                ? 'Loading...'
                                : language === 'ja'
                                ? '読込中...'
                                : language === 'zh-CN'
                                ? '载入中...'
                                : '載入中...'}
                            </span>
                          </>
                        ) : isProductUnavailable ? (
                          <span>
                            {language === 'en'
                              ? 'Unavailable'
                              : language === 'ja'
                              ? '利用不可'
                              : language === 'zh-CN'
                              ? '暂不可用'
                              : '暫不可用'}
                          </span>
                        ) : (
                          <>
                            <CreditCard className="w-3 h-3 shrink-0" />
                            <span>{displayPrice}</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </CuteModalBackground>
    </div>
  );
};

