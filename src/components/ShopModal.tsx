import React, { useState, useEffect } from 'react';
import { SnakeSkin, ArenaTheme, PlayerProfile } from '../types';
import { SNAKE_SKINS, ARENA_THEMES } from '../utils/gameData';
import { soundEngine } from '../utils/audio';
import {
  SupportedLanguage,
  getTranslation,
  LOCALIZED_SKINS,
  LOCALIZED_ARENAS,
  LOCALIZED_COIN_PACKAGES,
} from '../utils/i18n';
import { X, Check, Lock, Sparkles, Palette, Shield, CreditCard, Flame, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CuteModalBackground } from './CuteModalBackground';
import { CoinIcon } from './CoinIcon';
import { iapService } from '../services/iapService';
import { APPLE_COINS_PRODUCTS } from '../config/iapConfig';

export interface CoinPackage {
  id: string;
  appleProductId: string;
  name: string;
  coins: number;
  bonusCoins?: number;
  priceTag: string;
  isPopular?: boolean;
  isBestValue?: boolean;
}

export const COIN_PACKAGES: CoinPackage[] = [
  {
    id: 'coin_pack_mini',
    appleProductId: 'com.snake.cutemonster.coins50k',
    name: '金幣小錢包 (50000 金幣)',
    coins: 50000,
    priceTag: '$1.00 USD',
  },
  {
    id: 'coin_pack_medium',
    appleProductId: 'com.snake.cutemonster.coins180k',
    name: '豐盛金幣箱 (180000 金幣)',
    coins: 160000,
    bonusCoins: 20000,
    priceTag: '$2.99 USD',
    isPopular: true,
  },
  {
    id: 'coin_pack_large',
    appleProductId: 'com.snake.cutemonster.coins400k',
    name: '巨額金幣寶庫 (400000 金幣)',
    coins: 350000,
    bonusCoins: 50000,
    priceTag: '$5.99 USD',
    isBestValue: true,
  },
  {
    id: 'coin_pack_vault',
    appleProductId: 'com.snake.cutemonster.coins1m',
    name: '皇家至尊金庫 (1000000 金幣)',
    coins: 800000,
    bonusCoins: 200000,
    priceTag: '$11.99 USD',
  },
];

interface ShopModalProps {
  profile: PlayerProfile;
  isOpen: boolean;
  initialTab?: 'SKINS' | 'ARENAS' | 'COINS';
  language?: SupportedLanguage;
  onClose: () => void;
  onUpdateProfile: (updater: (prev: PlayerProfile) => PlayerProfile) => void;
  onOpenHearts?: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  profile,
  isOpen,
  initialTab = 'SKINS',
  language = 'zh-HK',
  onClose,
  onUpdateProfile,
  onOpenHearts,
}) => {
  const [tab, setTab] = useState<'SKINS' | 'ARENAS' | 'COINS'>(initialTab);
  const [purchaseNotice, setPurchaseNotice] = useState<string | null>(null);
  const [purchasingCoinPkgId, setPurchasingCoinPkgId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab || 'SKINS');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const currentSkinRaw = SNAKE_SKINS.find((s) => s.id === profile.selectedSkin) || SNAKE_SKINS[0];
  const currentArenaRaw = ARENA_THEMES.find((a) => a.id === profile.selectedArena) || ARENA_THEMES[0];

  const currentSkinLoc = LOCALIZED_SKINS[currentSkinRaw.id]?.[language] || {
    name: currentSkinRaw.name,
    description: currentSkinRaw.description,
  };
  const currentArenaLoc = LOCALIZED_ARENAS[currentArenaRaw.id]?.[language] || {
    name: currentArenaRaw.name,
    description: currentArenaRaw.description,
  };

  const handleBuySkin = (skin: SnakeSkin) => {
    if (profile.coins < skin.price) {
      soundEngine.haptic('collision');
      const notice = getTranslation('notEnoughCoinsToBuyNotice', language).replace(
        '{price}',
        String(skin.price)
      );
      setPurchaseNotice(notice);
      setTimeout(() => setPurchaseNotice(null), 3500);
      return;
    }
    soundEngine.playSpecialEat();
    soundEngine.haptic('success');
    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
    onUpdateProfile((prev) => ({
      ...prev,
      coins: prev.coins - skin.price,
      unlockedSkins: [...prev.unlockedSkins, skin.id],
      selectedSkin: skin.id,
    }));
    const skinLoc = LOCALIZED_SKINS[skin.id]?.[language]?.name || skin.name;
    const msg =
      language === 'en'
        ? `🎉 Successfully unlocked & equipped ${skinLoc}!`
        : language === 'ja'
        ? `🎉 ${skinLoc} を解放＆着用しました！`
        : language === 'zh-CN'
        ? `🎉 成功以 ${skin.price} 金币兑换并穿戴 ${skinLoc}！`
        : `🎉 成功以 ${skin.price} 金幣兌換並穿戴 ${skinLoc}！`;
    setPurchaseNotice(msg);
    setTimeout(() => setPurchaseNotice(null), 3500);
  };

  const handleSelectSkin = (id: string) => {
    soundEngine.playClick();
    onUpdateProfile((prev) => ({
      ...prev,
      selectedSkin: id,
    }));
  };

  const handleBuyArena = (arena: ArenaTheme) => {
    if (profile.coins < arena.price) {
      soundEngine.haptic('collision');
      const notice = getTranslation('notEnoughCoinsToBuyNotice', language).replace(
        '{price}',
        String(arena.price)
      );
      setPurchaseNotice(notice);
      setTimeout(() => setPurchaseNotice(null), 3500);
      return;
    }
    soundEngine.playSpecialEat();
    soundEngine.haptic('success');
    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
    onUpdateProfile((prev) => ({
      ...prev,
      coins: prev.coins - arena.price,
      unlockedArenas: [...prev.unlockedArenas, arena.id],
      selectedArena: arena.id,
    }));
    const arenaLoc = LOCALIZED_ARENAS[arena.id]?.[language]?.name || arena.name;
    const msg =
      language === 'en'
        ? `🎉 Successfully unlocked & equipped ${arenaLoc}!`
        : language === 'ja'
        ? `🎉 ${arenaLoc} を解放＆装備しました！`
        : language === 'zh-CN'
        ? `🎉 成功以 ${arena.price} 金币兑换并装备 ${arenaLoc}！`
        : `🎉 成功以 ${arena.price} 金幣兌換並裝備 ${arenaLoc}！`;
    setPurchaseNotice(msg);
    setTimeout(() => setPurchaseNotice(null), 3500);
  };

  const handleSelectArena = (id: string) => {
    soundEngine.playClick();
    onUpdateProfile((prev) => ({
      ...prev,
      selectedArena: id,
    }));
  };

  const handleBuyCoinPackage = async (pkg: CoinPackage) => {
    if (purchasingCoinPkgId) return;
    soundEngine.playClick();
    setPurchasingCoinPkgId(pkg.id);

    try {
      const result = await iapService.purchaseProduct(pkg.appleProductId);
      if (result.success) {
        soundEngine.playSpecialEat();
        soundEngine.haptic('success');

        try {
          confetti({
            particleCount: 80,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }

        const totalCoins = pkg.coins + (pkg.bonusCoins || 0);

        onUpdateProfile((prev) => ({
          ...prev,
          coins: prev.coins + totalCoins,
        }));

        const msg = getTranslation('purchaseSuccessMsg', language).replace('{total}', String(totalCoins));
        setPurchaseNotice(msg);
        setTimeout(() => {
          setPurchaseNotice(null);
        }, 3500);
      } else if (!result.cancelled && result.error) {
        soundEngine.haptic('collision');
        setPurchaseNotice(result.error);
        setTimeout(() => setPurchaseNotice(null), 3500);
      }
    } catch (err: any) {
      console.error('Apple IAP Coin error:', err);
    } finally {
      setPurchasingCoinPkgId(null);
    }
  };

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
      <CuteModalBackground
        theme="shop"
        className="w-full max-w-md max-h-[calc(100dvh-max(env(safe-area-inset-top),0.5rem)-4.5rem)] flex flex-col text-slate-100 shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 border-b border-amber-500/20 flex items-center justify-between shrink-0 bg-slate-950/75 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black truncate">{getTranslation('shopTitle', language)}</h2>
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                <span>{getTranslation('coinBalance', language)}</span>
                <span className="text-amber-300 font-mono text-sm">{profile.coins}</span>
                <CoinIcon className="w-4 h-4" />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-95 shrink-0 cursor-pointer shadow-md touch-manipulation"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Equipped Wardrobe Showcase */}
        <div className="mx-4 mt-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between shadow-inner shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg relative border border-white/20 shrink-0"
              style={{
                background: `radial-gradient(circle, ${currentSkinRaw.headColor} 0%, #090d16 100%)`,
                boxShadow: `0 0 14px ${currentSkinRaw.glowColor}`,
              }}
            >
              <div className="flex items-center gap-1">
                <div
                  className="w-4 h-4 rounded-full border border-white shadow-sm flex items-center justify-center relative"
                  style={{ backgroundColor: currentSkinRaw.headColor }}
                >
                  <div className="w-1 h-1 rounded-full bg-white absolute top-0.5 left-0.5" />
                </div>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentSkinRaw.bodyColor }} />
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentSkinRaw.tailColor }} />
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 font-medium">
                {getTranslation('equippedSkin', language)}
              </div>
              <div className="text-sm font-bold text-white truncate">{currentSkinLoc.name}</div>
              <div className="text-[11px] text-emerald-400 truncate">
                {getTranslation('equippedArena', language)}
                {currentArenaLoc.name}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0 pl-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <Check className="w-3.5 h-3.5" />
              <span>{getTranslation('activeStatus', language)}</span>
            </span>
          </div>
        </div>

        {/* Success Banner */}
        {purchaseNotice && (
          <div className="mx-4 mt-2.5 p-3 rounded-2xl bg-amber-500/20 border border-amber-400/50 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 animate-fade-in shadow-md shrink-0">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{purchaseNotice}</span>
          </div>
        )}

        {/* Tab Buttons */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setTab('SKINS');
            }}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              tab === 'SKINS'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>
              {getTranslation('tabSkins', language)} ({SNAKE_SKINS.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setTab('ARENAS');
            }}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              tab === 'ARENAS'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>
              {getTranslation('tabArenas', language)} ({ARENA_THEMES.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setTab('COINS');
            }}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              tab === 'COINS'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'bg-slate-800/80 text-amber-300/80 hover:text-amber-200'
            }`}
          >
            <CoinIcon className="w-3.5 h-3.5" />
            <span>{getTranslation('tabCoins', language)}</span>
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-4 space-y-3">
          {tab === 'SKINS' && (
            <>
              {SNAKE_SKINS.map((skin) => {
                const isUnlocked = profile.unlockedSkins.includes(skin.id);
                const isSelected = profile.selectedSkin === skin.id;
                const canAfford = profile.coins >= skin.price;
                const skinLoc = LOCALIZED_SKINS[skin.id]?.[language] || {
                  name: skin.name,
                  description: skin.description,
                };

                return (
                  <div
                    key={skin.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-900/20'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Visual Preview */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner relative overflow-hidden shrink-0"
                        style={{
                          background: `radial-gradient(circle, ${skin.headColor} 0%, #090d16 100%)`,
                          boxShadow: `0 0 16px ${skin.glowColor}`,
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <div
                            className="w-4 h-4 rounded-full border border-white/60 shadow-sm"
                            style={{ backgroundColor: skin.headColor }}
                          />
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: skin.bodyColor }}
                          />
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: skin.tailColor }}
                          />
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold flex items-center gap-1.5">
                          {skinLoc.name}
                          {isSelected && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-500 text-slate-950">
                              {getTranslation('inUse', language)}
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">{skinLoc.description}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div>
                      {isUnlocked ? (
                        <button
                          type="button"
                          onClick={() => handleSelectSkin(skin.id)}
                          disabled={isSelected}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm'
                          }`}
                        >
                          {isSelected
                            ? getTranslation('equippedBtn', language)
                            : getTranslation('equipBtn', language)}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleBuySkin(skin)}
                          disabled={!canAfford}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                              : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700/50'
                          }`}
                        >
                          <Lock className="w-3 h-3 shrink-0" />
                          <span className="flex items-center gap-1 font-mono font-bold">
                            {skin.price} <CoinIcon className="w-3.5 h-3.5" />
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {tab === 'ARENAS' && (
            <>
              {ARENA_THEMES.map((arena) => {
                const isUnlocked = profile.unlockedArenas.includes(arena.id);
                const isSelected = profile.selectedArena === arena.id;
                const canAfford = profile.coins >= arena.price;
                const arenaLoc = LOCALIZED_ARENAS[arena.id]?.[language] || {
                  name: arena.name,
                  description: arena.description,
                };

                return (
                  <div
                    key={arena.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-900/20'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Visual Preview */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner relative overflow-hidden border shrink-0"
                        style={{
                          background:
                            arena.id === 'neon_grid'
                              ? `url('/assets/neon_digital_grid_bg.svg') center/cover no-repeat`
                              : `linear-gradient(135deg, ${arena.bgGradient[0]}, ${arena.bgGradient[1]})`,
                          borderColor: arena.wallColor,
                          boxShadow: `0 0 12px ${arena.wallGlow}`,
                        }}
                      >
                        <div
                          className="w-6 h-6 rounded border flex items-center justify-center"
                          style={{ borderColor: arena.wallColor }}
                        >
                          {arena.id === 'neon_grid' ? (
                            <span className="text-[10px] text-cyan-300 font-black">⬡</span>
                          ) : null}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold flex items-center gap-1.5">
                          {arenaLoc.name}
                          {isSelected && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-500 text-slate-950">
                              {getTranslation('inUse', language)}
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">{arenaLoc.description}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div>
                      {isUnlocked ? (
                        <button
                          type="button"
                          onClick={() => handleSelectArena(arena.id)}
                          disabled={isSelected}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          {isSelected
                            ? getTranslation('equippedArenaBtn', language)
                            : getTranslation('equipArenaBtn', language)}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleBuyArena(arena)}
                          disabled={!canAfford}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                              : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700/50'
                          }`}
                        >
                          <Lock className="w-3 h-3 shrink-0" />
                          <span className="flex items-center gap-1 font-mono font-bold">
                            {arena.price} <CoinIcon className="w-3.5 h-3.5" />
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* COINS Tab */}
          {tab === 'COINS' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2.5">
                {COIN_PACKAGES.map((pkg) => {
                  const pkgName = LOCALIZED_COIN_PACKAGES[pkg.id]?.[language] || pkg.name;
                  const isThisPurchasing = purchasingCoinPkgId === pkg.id;

                  return (
                    <div
                      key={pkg.id}
                      className={`relative p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                        pkg.isBestValue
                          ? 'bg-gradient-to-r from-amber-950/60 via-purple-950/40 to-slate-900 border-amber-400 shadow-lg shadow-amber-500/20'
                          : pkg.isPopular
                          ? 'bg-gradient-to-r from-rose-950/50 via-slate-900 to-slate-900 border-pink-400/70 shadow-md shadow-pink-500/15'
                          : 'bg-slate-950/70 border-slate-800'
                      }`}
                    >
                      {/* Badge */}
                      {pkg.isBestValue && (
                        <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-[10px] shadow-sm flex items-center gap-1">
                          <Flame className="w-3 h-3 fill-slate-950" />
                          <span>{getTranslation('bestValueBadge', language)}</span>
                        </span>
                      )}
                      {pkg.isPopular && !pkg.isBestValue && (
                        <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black text-[10px] shadow-sm">
                          {getTranslation('popularBadge', language)}
                        </span>
                      )}

                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shadow-inner shrink-0">
                          <CoinIcon className="w-7 h-7" />
                        </div>

                        <div className="text-left">
                          <div className="text-sm font-black text-white flex items-center gap-1.5">
                            <span>{pkgName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono font-black text-amber-300 text-base">
                              +{pkg.coins}
                            </span>
                            {pkg.bonusCoins && (
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                {getTranslation('bonusCoinsTag', language).replace(
                                  '{n}',
                                  String(pkg.bonusCoins)
                                )}
                              </span>
                            )}
                            <CoinIcon className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={purchasingCoinPkgId !== null}
                        onClick={() => handleBuyCoinPackage(pkg)}
                        className={`py-2 px-3.5 rounded-xl font-black text-xs transition-all active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer shrink-0 min-h-[38px] ${
                          isThisPurchasing
                            ? 'bg-slate-700 text-slate-300 cursor-wait'
                            : pkg.isBestValue
                            ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 hover:brightness-110 shadow-amber-500/30'
                            : pkg.isPopular
                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:brightness-110 shadow-pink-500/30'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                        }`}
                      >
                        {isThisPurchasing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{language === 'en' ? 'Processing...' : '連線中...'}</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>{pkg.priceTag}</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CuteModalBackground>
    </div>
  );
};
