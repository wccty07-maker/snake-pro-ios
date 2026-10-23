import React, { useState, useEffect } from 'react';
import { LevelMission } from '../types';
import { SupportedLanguage } from '../utils/i18n';
import { ITEM_INTRO_DEFINITIONS, ItemIntroType } from '../utils/itemIntroData';
import { soundEngine } from '../utils/audio';
import { GoldenAppleIcon } from './GoldenAppleIcon';
import { BlueAppleIcon } from './BlueAppleIcon';
import { GreenAppleIcon } from './GreenAppleIcon';

export interface ItemIntroModalProps {
  isOpen: boolean;
  items: ItemIntroType[];
  currentLevel?: LevelMission;
  language: SupportedLanguage;
  onConfirm: () => void;
  isCompendiumMode?: boolean; // If opened as Encyclopedia browsing
  onClose?: () => void;
}

export const ItemIntroModal: React.FC<ItemIntroModalProps> = ({
  isOpen,
  items,
  currentLevel,
  language,
  onConfirm,
  isCompendiumMode = false,
  onClose,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Reset active index whenever opened or items change
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(0);
      soundEngine.playSpecialEat();
      soundEngine.haptic('medium');
    }
  }, [isOpen, items]);

  if (!isOpen || items.length === 0) return null;

  const currentItemKey = items[Math.min(activeIndex, items.length - 1)] || items[0];
  const itemDef = ITEM_INTRO_DEFINITIONS[currentItemKey];
  if (!itemDef) return null;

  const handleNextItem = () => {
    soundEngine.playClick();
    if (activeIndex < items.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      onConfirm();
    }
  };

  const handleConfirmAll = () => {
    soundEngine.playClick();
    soundEngine.haptic('success');
    onConfirm();
  };

  const isLastItem = activeIndex >= items.length - 1;

  // Visual Item Display Renderer
  const renderItemVisual = (key: ItemIntroType) => {
    switch (key) {
      case 'BLUE':
        return (
          <div className="relative w-24 h-24 flex items-center justify-center animate-bounce-subtle">
            <div className="absolute inset-0 rounded-full bg-sky-400/30 blur-2xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-sky-950/80 via-sky-600/30 to-sky-400/20 shadow-xl shadow-sky-500/40 border-2 border-sky-300/70 flex items-center justify-center backdrop-blur-sm">
              <div className="absolute inset-0 rounded-full border border-sky-300/40 animate-ping opacity-25" />
              <BlueAppleIcon size={48} className="filter drop-shadow-[0_4px_12px_rgba(56,189,248,0.7)] select-none" />
            </div>
          </div>
        );

      case 'GREEN':
        return (
          <div className="relative w-24 h-24 flex items-center justify-center animate-bounce-subtle">
            <div className="absolute inset-0 rounded-full bg-emerald-400/30 blur-2xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-950/80 via-emerald-600/30 to-emerald-400/20 shadow-xl shadow-emerald-500/40 border-2 border-emerald-300/70 flex items-center justify-center backdrop-blur-sm">
              <div className="absolute inset-0 rounded-full border border-emerald-300/40 animate-ping opacity-25" />
              <GreenAppleIcon size={48} className="filter drop-shadow-[0_4px_12px_rgba(74,222,128,0.7)] select-none" />
            </div>
          </div>
        );

      case 'GOLDEN':
        return (
          <div className="relative w-24 h-24 flex items-center justify-center animate-bounce-subtle">
            <div className="absolute inset-0 rounded-full bg-amber-400/40 blur-2xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-amber-950/80 via-amber-600/30 to-yellow-400/20 shadow-2xl shadow-yellow-500/50 border-2 border-yellow-300/70 flex items-center justify-center backdrop-blur-sm">
              <div className="absolute inset-0 rounded-full border-2 border-yellow-300/50 animate-ping opacity-30" />
              <GoldenAppleIcon size={48} className="filter drop-shadow-[0_4px_12px_rgba(251,191,36,0.8)] select-none" />
            </div>
          </div>
        );

      case 'SHIELD':
        return (
          <div className="relative w-24 h-24 flex items-center justify-center animate-bounce-subtle">
            <div className="absolute inset-0 rounded-full bg-cyan-400/30 blur-2xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-blue-700 via-cyan-500 to-sky-200 shadow-xl shadow-cyan-500/40 border-2 border-cyan-300 flex items-center justify-center">
              <div className="absolute inset-1 rounded-full border border-white/40 border-dashed animate-spin-slow" />
              <span className="text-4xl filter drop-shadow select-none">🛡️</span>
            </div>
          </div>
        );

      case 'PORTAL':
        return (
          <div className="relative w-24 h-24 flex items-center justify-center animate-bounce-subtle">
            <div className="absolute inset-0 rounded-full bg-teal-400/30 blur-2xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-slate-950 via-teal-900 to-cyan-500 shadow-xl shadow-teal-500/40 border-2 border-teal-300 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 rounded-full border-2 border-teal-300/70 border-dashed animate-spin-slow" />
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white via-cyan-300 to-teal-600 flex items-center justify-center font-black text-slate-900 text-sm shadow-inner">
                α·β
              </div>
            </div>
          </div>
        );

      case 'RAINBOW':
        return (
          <div className="relative w-24 h-24 flex items-center justify-center animate-bounce-subtle">
            <div className="absolute inset-0 rounded-full bg-pink-400/35 blur-2xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500 via-pink-400 to-amber-200 shadow-2xl shadow-pink-500/50 border-2 border-pink-200 flex items-center justify-center">
              <div className="absolute -bottom-2 -right-1 w-2.5 h-9 bg-white rounded-full rotate-45 border border-pink-300 shadow" />
              <span className="text-4xl filter drop-shadow-md select-none">🍭</span>
            </div>
          </div>
        );

      case 'CHILI':
        return (
          <div className="relative w-24 h-24 flex items-center justify-center animate-bounce-subtle">
            <div className="absolute inset-0 rounded-full bg-orange-500/35 blur-2xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-red-700 via-orange-500 to-amber-200 shadow-2xl shadow-orange-500/50 border-2 border-orange-300 flex items-center justify-center">
              <span className="text-4xl filter drop-shadow-md select-none">🌶️</span>
            </div>
          </div>
        );

      case 'MAGNET':
        return (
          <div className="relative w-24 h-24 flex items-center justify-center animate-bounce-subtle">
            <div className="absolute inset-0 rounded-full bg-cyan-500/35 blur-2xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-blue-700 via-cyan-600 to-cyan-300 shadow-2xl shadow-cyan-500/50 border-2 border-cyan-200 flex items-center justify-center">
              <span className="text-4xl filter drop-shadow-md select-none">🧲</span>
            </div>
          </div>
        );

      case 'DRAGON_EGG':
        return (
          <div className="relative w-24 h-24 flex items-center justify-center animate-bounce-subtle">
            <div className="absolute inset-0 rounded-full bg-rose-500/35 blur-2xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-rose-900 via-rose-600 to-yellow-300 shadow-2xl shadow-rose-500/50 border-2 border-yellow-300 flex items-center justify-center">
              <span className="text-4xl filter drop-shadow-md select-none">🥚</span>
            </div>
          </div>
        );

      case 'BOMB':
        return (
          <div className="relative w-24 h-24 flex items-center justify-center animate-bounce-subtle">
            <div className="absolute inset-0 rounded-full bg-red-500/40 blur-2xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-stone-900 via-red-950 to-red-600 shadow-2xl shadow-red-500/50 border-2 border-red-400 flex items-center justify-center">
              <div className="absolute -top-1 right-2 w-3 h-3 rounded-full bg-amber-400 animate-ping opacity-75" />
              <span className="text-4xl filter drop-shadow-md select-none">💣</span>
            </div>
          </div>
        );

      case 'GHOST':
        return (
          <div className="relative w-24 h-24 flex items-center justify-center animate-bounce-subtle">
            <div className="absolute inset-0 rounded-full bg-purple-500/35 blur-2xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-950 via-purple-800 to-pink-400 shadow-2xl shadow-purple-500/50 border-2 border-purple-300 flex items-center justify-center">
              <span className="text-4xl filter drop-shadow-md select-none">👻</span>
            </div>
          </div>
        );

      case 'REVERSE':
        return (
          <div className="relative w-24 h-24 flex items-center justify-center animate-bounce-subtle">
            <div className="absolute inset-0 rounded-full bg-indigo-500/35 blur-2xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-slate-950 via-indigo-900 to-purple-500 shadow-2xl shadow-indigo-500/50 border-2 border-indigo-300 flex items-center justify-center">
              <div className="absolute inset-1 rounded-full border border-indigo-300/40 border-dashed animate-spin-slow" />
              <span className="text-3xl filter drop-shadow-md select-none">⏪</span>
            </div>
          </div>
        );

      case 'GLOW_BERRY':
        return (
          <div className="relative w-24 h-24 flex items-center justify-center animate-bounce-subtle">
            <div className="absolute inset-0 rounded-full bg-sky-400/40 blur-2xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-slate-950 via-sky-900 to-cyan-400 shadow-2xl shadow-sky-500/50 border-2 border-sky-300 flex items-center justify-center">
              <span className="text-4xl filter drop-shadow-md select-none">🫐</span>
            </div>
          </div>
        );

      case 'KEY':
        return (
          <div className="relative w-24 h-24 flex items-center justify-center animate-bounce-subtle">
            <div className="absolute inset-0 rounded-full bg-yellow-400/40 blur-2xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-amber-950 via-yellow-600 to-amber-300 shadow-2xl shadow-yellow-500/50 border-2 border-yellow-300 flex items-center justify-center">
              <span className="text-4xl filter drop-shadow-md select-none">🗝️</span>
            </div>
          </div>
        );

      case 'ICE':
        return (
          <div className="relative w-24 h-24 flex items-center justify-center animate-bounce-subtle">
            <div className="absolute inset-0 rounded-full bg-cyan-400/35 blur-2xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-sky-950 via-cyan-800 to-sky-300 shadow-2xl shadow-cyan-500/50 border-2 border-cyan-300 flex items-center justify-center">
              <span className="text-4xl filter drop-shadow-md select-none">❄️</span>
            </div>
          </div>
        );

      case 'COLOR_SEQUENCE':
        return (
          <div className="relative w-24 h-24 flex items-center justify-center animate-bounce-subtle">
            <div className="absolute inset-0 rounded-full bg-fuchsia-500/35 blur-2xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-purple-950 via-fuchsia-900 to-pink-400 shadow-2xl shadow-fuchsia-500/50 border-2 border-fuchsia-300 flex items-center justify-center gap-1">
              <span className="text-xs">🔴</span>
              <span className="text-xs">🔵</span>
              <span className="text-xs">🟢</span>
            </div>
          </div>
        );

      case 'COLOR_GATE':
        return (
          <div className="relative w-24 h-24 flex items-center justify-center animate-bounce-subtle">
            <div className="absolute inset-0 rounded-full bg-emerald-500/35 blur-2xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-teal-950 via-emerald-800 to-teal-400 shadow-2xl shadow-emerald-500/50 border-2 border-emerald-300 flex items-center justify-center">
              <span className="text-4xl filter drop-shadow-md select-none">🚪</span>
            </div>
          </div>
        );

      case 'TURN_LIMIT':
        return (
          <div className="relative w-24 h-24 flex items-center justify-center animate-bounce-subtle">
            <div className="absolute inset-0 rounded-full bg-amber-500/35 blur-2xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-amber-950 via-yellow-800 to-amber-400 shadow-2xl shadow-amber-500/50 border-2 border-amber-300 flex items-center justify-center">
              <div className="absolute inset-1 rounded-full border border-amber-300/40 border-dashed animate-spin-slow" />
              <span className="text-3xl filter drop-shadow-md select-none">🔄</span>
            </div>
          </div>
        );

      case 'LIGHTNING':
        return (
          <div className="relative w-24 h-24 flex items-center justify-center animate-bounce-subtle">
            <div className="absolute inset-0 rounded-full bg-fuchsia-500/40 blur-2xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-purple-950 via-fuchsia-900 to-cyan-400 shadow-2xl shadow-fuchsia-500/60 border-2 border-cyan-300 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-1 rounded-full border border-cyan-300/60 border-dashed animate-spin-slow" />
              <span className="text-4xl filter drop-shadow-[0_0_12px_rgba(6,182,212,0.9)] select-none">⚡</span>
            </div>
          </div>
        );

      default:
        return (
          <div className="w-20 h-20 rounded-full bg-cyan-600/30 border border-cyan-400 flex items-center justify-center text-3xl">
            {itemDef.icon}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      {/* Container Card with Neon Border & Ambient Glow */}
      <div
        className={`w-full max-w-sm sm:max-w-md rounded-3xl bg-[#090d1a]/95 border-2 ${itemDef.borderColor} shadow-2xl flex flex-col overflow-hidden relative transition-all duration-300 animate-scale-up`}
        style={{
          boxShadow: `0 0 35px ${itemDef.glowColor}, 0 20px 25px -5px rgba(0, 0, 0, 0.6)`,
        }}
      >
        {/* Close button for compendium mode */}
        {isCompendiumMode && onClose && (
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Modal Body: Active Item Detail */}
        <div className="p-4 sm:p-5 pt-6 sm:pt-7 flex flex-col items-center relative">
          {/* Multiple items navigation tabs */}
          {items.length > 1 && (
            <div className="flex items-center gap-1.5 mb-2 p-1 rounded-full bg-slate-900/80 border border-slate-700/60 max-w-full overflow-x-auto">
              {items.map((key, idx) => {
                const def = ITEM_INTRO_DEFINITIONS[key];
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      soundEngine.playClick();
                      setActiveIndex(idx);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25 scale-105'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {def.id === 'GOLDEN' ? (
                      <GoldenAppleIcon className="w-3.5 h-3.5 inline-block shrink-0" />
                    ) : def.id === 'BLUE' ? (
                      <BlueAppleIcon className="w-3.5 h-3.5 inline-block shrink-0" />
                    ) : def.id === 'GREEN' ? (
                      <GreenAppleIcon className="w-3.5 h-3.5 inline-block shrink-0" />
                    ) : (
                      <span>{def.icon}</span>
                    )}
                    <span>{def.name[language] || def.name['zh-HK']}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Main Visual Display */}
          <div className="my-1 sm:my-2">{renderItemVisual(currentItemKey)}</div>

          {/* Item Name & Badges */}
          <div className="flex items-center gap-2 mt-2">
            <span
              className="text-lg sm:text-xl font-black text-white tracking-wide"
              style={{ textShadow: `0 0 12px ${itemDef.themeColor}` }}
            >
              {itemDef.name[language] || itemDef.name['zh-HK']}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
              {itemDef.badge[language] || itemDef.badge['zh-HK']}
            </span>
          </div>

          {/* Stat Pill */}
          <div className="mt-2 px-3 py-1 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-300 text-xs font-black tracking-wide shadow-inner flex items-center gap-1.5">
            <span>{itemDef.statPill[language] || itemDef.statPill['zh-HK']}</span>
          </div>

          {/* Detailed Description */}
          <p className="mt-3 text-xs sm:text-sm text-slate-200 leading-relaxed text-center px-1">
            {itemDef.description[language] || itemDef.description['zh-HK']}
          </p>

          {/* Pro Tip Box */}
          <div className="mt-3 w-full rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-800/60 to-slate-900/90 border border-amber-500/30 p-2.5 sm:p-3 flex items-start gap-2 shadow-sm">
            <span className="text-base sm:text-lg flex-shrink-0 animate-pulse">💡</span>
            <div className="flex-1 text-[11px] sm:text-xs text-amber-200/90 leading-tight">
              <span className="font-black text-amber-300 block mb-0.5">
                {language === 'en'
                  ? 'PRO TIP'
                  : language === 'ja'
                  ? '攻略のヒント'
                  : language === 'zh-CN'
                  ? '闯关秘技'
                  : '闖關密技'}
              </span>
              {itemDef.usageTip[language] || itemDef.usageTip['zh-HK']}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between gap-2">
          {items.length > 1 && !isLastItem ? (
            <>
              {/* Skip / Direct Confirm */}
              <button
                onClick={handleConfirmAll}
                className="px-3 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition"
              >
                {language === 'en' ? 'Start Level' : language === 'ja' ? 'すぐに開始' : language === 'zh-CN' ? '直接开始' : '直接開始'}
              </button>

              {/* Next Item in batch */}
              <button
                onClick={handleNextItem}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <span>
                  {language === 'en'
                    ? `Next Item (${activeIndex + 1}/${items.length})`
                    : language === 'ja'
                    ? `次のアイテム (${activeIndex + 1}/${items.length})`
                    : language === 'zh-CN'
                    ? `下一项 (${activeIndex + 1}/${items.length})`
                    : `下一項 (${activeIndex + 1}/${items.length})`}
                </span>
                <span>➔</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleConfirmAll}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-black text-xs sm:text-sm shadow-xl shadow-teal-500/30 flex items-center justify-center gap-2 transition active:scale-95 animate-pulse-glow"
            >
              <span className="text-base">🚀</span>
              <span>
                {isCompendiumMode
                  ? language === 'en'
                    ? 'Close Compendium'
                    : language === 'ja'
                    ? '図鑑を閉じる'
                    : language === 'zh-CN'
                    ? '关闭图鉴'
                    : '關閉圖鑑'
                  : language === 'en'
                  ? 'Got It! Start Playing'
                  : language === 'ja'
                  ? '了解！挑戦開始'
                  : language === 'zh-CN'
                  ? '我知道了！开始挑战'
                  : '我知道了！開始挑戰'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
