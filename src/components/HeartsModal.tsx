import React, { useState, useEffect } from 'react';
import { Heart, Film, CreditCard, X, Check, Sparkles, Flame, Loader2 } from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { SupportedLanguage, LOCALIZED_HEART_PACKAGES, getTranslation } from '../utils/i18n';
import confetti from 'canvas-confetti';
import { CuteModalBackground } from './CuteModalBackground';
import { CoinIcon } from './CoinIcon';
import { admobService, isCapacitorNative } from '../services/admobService';
import { iapService } from '../services/iapService';
import { APPLE_HEARTS_PRODUCTS } from '../config/iapConfig';

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
    appleProductId: 'com.snake.cutemonster.hearts10',
    name: '基礎愛心袋 (10 顆心)',
    hearts: 10,
    priceTag: '$1.00 USD',
    usdApprox: '$1.00 USD',
  },
  {
    id: 'heart_tier_2',
    appleProductId: 'com.snake.cutemonster.hearts32',
    name: '人氣愛心盒 (贈2心)',
    hearts: 30,
    bonusHearts: 2,
    priceTag: '$2.99 USD',
    usdApprox: '$2.99 USD',
    isPopular: true,
  },
  {
    id: 'heart_tier_3',
    appleProductId: 'com.snake.cutemonster.hearts75',
    name: '超狂愛心箱 (贈15心)',
    hearts: 60,
    bonusHearts: 15,
    priceTag: '$5.99 USD',
    usdApprox: '$5.99 USD',
    isBestValue: true,
  },
  {
    id: 'heart_tier_4',
    appleProductId: 'com.snake.cutemonster.hearts160',
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
  onOpenShop,
}) => {
  const [adWatching, setAdWatching] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [purchasingPkgId, setPurchasingPkgId] = useState<string | null>(null);

  const maxAds = maxDailyAds ?? 5;
  const currentAdCount = dailyAdWatchCount ?? 0;
  const remainingAds = Math.max(0, maxAds - currentAdCount);
  const isAdLimitReached = remainingAds <= 0;

  // Countdown timer for simulated ad (睇一次廣告加 1 個心，每日上限 5 次)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (adWatching && adCountdown > 0) {
      timer = setTimeout(() => {
        setAdCountdown((c) => c - 1);
      }, 1000);
    } else if (adWatching && adCountdown === 0) {
      setAdWatching(false);
      // 睇一次廣告加 1 個心
      let success = false;
      if (onWatchAdReward) {
        success = onWatchAdReward();
      } else {
        success = onAddHearts(1);
      }

      if (success) {
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
        setPurchaseSuccess(msg);
        setTimeout(() => setPurchaseSuccess(null), 3500);
      }
    }
    return () => clearTimeout(timer);
  }, [adWatching, adCountdown, onWatchAdReward, onAddHearts, language, remainingAds, maxAds]);

  if (!isOpen) return null;

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

  const handleWatchAd = async () => {
    if (isAdLimitReached) {
      soundEngine.playTurn();
      return;
    }
    soundEngine.playClick();

    // 如果在原生手機環境 (Capacitor Android / iOS)
    if (isCapacitorNative()) {
      try {
        const isRewarded = await admobService.showRewardedAd();
        if (isRewarded) {
          let success = false;
          if (onWatchAdReward) {
            success = onWatchAdReward();
          } else {
            success = onAddHearts(1);
          }

          if (success) {
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
            setPurchaseSuccess(msg);
            setTimeout(() => setPurchaseSuccess(null), 3500);
          }
        }
      } catch (err) {
        console.error('AdMob 播放異常:', err);
      }
      return;
    }

    // 瀏覽器 / Web 預覽環境下：啟用精美內建模擬廣告倒數
    setAdCountdown(5);
    setAdWatching(true);
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
      setPurchaseSuccess(msg);
      setTimeout(() => setPurchaseSuccess(null), 2500);
    }
  };

  // 購買愛心 (Apple In-App Purchase / StoreKit 原生與沙盒)
  const handleBuyPackage = async (pkg: HeartPackage) => {
    if (purchasingPkgId) return;
    soundEngine.playClick();
    setPurchasingPkgId(pkg.id);

    try {
      const result = await iapService.purchaseProduct(pkg.appleProductId);
      if (result.success) {
        const totalHearts = pkg.hearts + (pkg.bonusHearts || 0);
        onAddHearts(totalHearts);
        soundEngine.playSpecialEat();
        triggerConfetti();

        const msg =
          language === 'en'
            ? `IAP Success! +${totalHearts} Hearts added! ❤️`
            : language === 'ja'
            ? `IAP 購入完了！ハート+${totalHearts}個獲得！❤️`
            : language === 'zh-CN'
            ? `官方内购成功！已获取 +${totalHearts} 颗爱心！❤️`
            : `官方內購成功！已獲取 +${totalHearts} 顆愛心！❤️`;
        setPurchaseSuccess(msg);
        setTimeout(() => setPurchaseSuccess(null), 3500);
      } else if (!result.cancelled && result.error) {
        soundEngine.haptic('collision');
        setPurchaseSuccess(result.error);
        setTimeout(() => setPurchaseSuccess(null), 3500);
      }
    } catch (e: any) {
      console.error('Apple IAP error:', e);
    } finally {
      setPurchasingPkgId(null);
    }
  };

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
      {/* Simulated Ad Playing Overlay (睇一次廣告加 1 個心) */}
      {adWatching && (
        <div className="absolute inset-0 z-70 bg-slate-950 flex flex-col items-center justify-between p-6 animate-fade-in text-center">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-medium">
              {language === 'en' ? 'Sponsor Ad' : language === 'ja' ? 'スポンサー広告' : language === 'zh-CN' ? '赞助商广告' : '贊助商廣告'}
            </span>
            <div className="text-xs font-mono font-bold text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
              {language === 'en' ? `Ad remaining ${adCountdown}s` : language === 'ja' ? `残り ${adCountdown}秒` : language === 'zh-CN' ? `广告剩余 ${adCountdown} 秒` : `廣告剩餘 ${adCountdown} 秒`}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 my-auto">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center shadow-2xl shadow-rose-500/30">
              <Sparkles className="w-10 h-10 text-slate-950" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">SNAKE ENERGY REFILL</h2>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                {language === 'en'
                  ? 'Thank you for supporting! +1 Heart will be added after completion.'
                  : language === 'ja'
                  ? '動画視聴ありがとうございます！視聴後にハート+1個がプレゼントされます。'
                  : language === 'zh-CN'
                  ? '感谢观看赞助短片！播放完成立即补充 +1 颗爱心！'
                  : '感謝觀看贊助短片！播放完成立即補充 +1 顆愛心！'}
              </p>
            </div>
            <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-rose-500 transition-all duration-1000 ease-linear"
                style={{ width: `${((5 - adCountdown) / 5) * 100}%` }}
              />
            </div>
          </div>

          <div className="text-[11px] text-slate-500">
            {language === 'en' ? 'Reward will be granted when finished...' : language === 'ja' ? '広告終了後に自動で付与されます...' : language === 'zh-CN' ? '广告播放完毕后将自动发放奖励 (+1 ❤️)...' : '廣告播放完畢後將自動發放獎勵 (+1 ❤️)...'}
          </div>
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
          {purchaseSuccess && (
            <div className="text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 py-2 px-3 rounded-xl animate-fade-in flex items-center justify-center gap-1.5 shadow-md">
              <Check className="w-4 h-4 shrink-0" />
              <span>{purchaseSuccess}</span>
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
                disabled={isAdLimitReached}
                onClick={handleWatchAd}
                className={`px-3 py-2 rounded-xl font-bold text-xs transition-all shrink-0 active:scale-95 shadow-sm flex items-center gap-1 min-h-[40px] ${
                  isAdLimitReached
                    ? 'bg-slate-800 text-slate-500 border border-slate-700/80 cursor-not-allowed'
                    : 'bg-teal-500 hover:bg-teal-400 text-slate-950 cursor-pointer shadow-teal-500/20'
                }`}
              >
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
              <div className="space-y-1.5">
                {HEART_PACKAGES.map((pkg) => {
                  const totalHearts = pkg.hearts + (pkg.bonusHearts || 0);
                  const isThisPurchasing = purchasingPkgId === pkg.id;

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
                        disabled={purchasingPkgId !== null}
                        onClick={() => handleBuyPackage(pkg)}
                        className={`py-1.5 px-2.5 sm:px-3 rounded-xl font-black text-xs transition-all active:scale-95 shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap min-h-[36px] ${
                          isThisPurchasing
                            ? 'bg-slate-700 text-slate-300 cursor-wait'
                            : pkg.isBestValue
                            ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 hover:brightness-110 shadow-amber-500/20'
                            : pkg.isPopular
                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:brightness-110 shadow-pink-500/20'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                        }`}
                      >
                        {isThisPurchasing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{language === 'en' ? 'Processing...' : '連線中...'}</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-3 h-3 shrink-0" />
                            <span>{pkg.priceTag}</span>
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

