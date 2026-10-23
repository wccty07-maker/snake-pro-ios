import React, { useState } from 'react';
import { soundEngine } from '../utils/audio';
import { CuteMonsterSnakeArt } from './CuteMonsterSnakeArt';
import { SupportedLanguage, getTranslation } from '../utils/i18n';
import confetti from 'canvas-confetti';
import { CuteModalBackground } from './CuteModalBackground';
import { CoinIcon } from './CoinIcon';
import { GoldenAppleIcon } from './GoldenAppleIcon';
import { RedAppleIcon } from './RedAppleIcon';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Award,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Shield,
  Star,
  CheckCircle2,
  Heart,
  Sparkles,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  language: SupportedLanguage;
  hasClaimedReward?: boolean;
  onClose: () => void;
  onCompleteTutorial: () => void;
}

// Index finger pointing hand icon (食指)
const IndexFingerIcon: React.FC<{ className?: string; pointingDown?: boolean }> = ({
  className = 'w-6 h-6',
  pointingDown = false,
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${className} ${pointingDown ? 'rotate-180' : ''}`}
  >
    {/* Extended index finger (食指) */}
    <path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10" />
    {/* Curled middle finger */}
    <path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1" />
    {/* Curled ring finger */}
    <path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
    {/* Pinky and base of hand with thumb resting */}
    <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    <path d="M22 14a8 8 0 0 1-8 8" />
  </svg>
);

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  language,
  hasClaimedReward = false,
  onClose,
  onCompleteTutorial,
}) => {
  const [step, setStep] = useState<number>(0);

  if (!isOpen) return null;

  const totalSteps = 4;

  const handleNext = () => {
    soundEngine.playClick();
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    soundEngine.playClick();
    if (step > 0) {
      setStep((s) => s - 1);
    }
  };

  const handleFinish = () => {
    soundEngine.playLevelClear();
    if (!hasClaimedReward) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }
    onCompleteTutorial();
    onClose();
  };

  const swipeHint =
    language === 'en'
      ? 'Swipe in 4 directions'
      : language === 'ja'
      ? '上下左右にスワイプ'
      : language === 'zh-CN'
      ? '上下左右滑动'
      : '上下左右滑動';

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 pt-[calc(max(env(safe-area-inset-top),0.5rem)+3.2rem)] pb-3 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none touch-manipulation overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          soundEngine.playClick();
          onClose();
        }
      }}
    >
      <CuteModalBackground
        theme="tutorial"
        className="w-full max-w-sm sm:max-w-md max-h-[calc(100dvh-max(env(safe-area-inset-top),0.5rem)-4.5rem)] flex flex-col text-slate-100 shadow-2xl overflow-hidden"
      >
        {/* Sticky Header with generous touch target Close Button */}
        <div className="p-3.5 sm:p-4 border-b border-sky-500/20 flex items-center justify-between shrink-0 bg-slate-950/75 backdrop-blur-md z-20">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/40">
              {getTranslation('stepBadge', language)
                .replace('{step}', String(step + 1))
                .replace('{total}', String(totalSteps))}
            </span>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-slate-800/90 hover:bg-slate-700 active:scale-95 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-md shrink-0 cursor-pointer touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Scrollable Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 flex flex-col items-center text-center space-y-4">
          {/* Step 0: Welcome Mascot (Reward badge removed per user request: only shows on the last page) */}
          {step === 0 && (
            <div className="space-y-3 animate-fade-in flex flex-col items-center w-full">
              <div className="relative my-1">
                <CuteMonsterSnakeArt size={135} variant="mikey" mood="excited" />
                <div className="absolute -top-1 -right-2 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-lg animate-bounce">
                  HI! 👋
                </div>
              </div>
              <h3 className="text-xl font-black text-white tracking-wide">
                {getTranslation('tutorialStep1Title', language)}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-[290px]">
                {getTranslation('tutorialStep1Desc', language)}
              </p>
            </div>
          )}

          {/* Step 1: Controls (Swipe & Double Tap to Pause) - Both icons show Index Finger (食指), not whole palm */}
          {step === 1 && (
            <div className="space-y-3 animate-fade-in flex flex-col items-center w-full">
              {/* Visual Demo for Swipe AND Double Tap */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-[320px]">
                {/* Left: Directional Swipe with Index Finger */}
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-emerald-400/50 flex flex-col items-center justify-center shadow-inner">
                  <div className="relative w-20 h-20 flex items-center justify-center my-0.5">
                    {/* 4 directional arrows surrounding the index finger */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 text-emerald-400 animate-bounce">
                      <ArrowUp className="w-3.5 h-3.5" />
                    </div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-emerald-400 animate-bounce">
                      <ArrowDown className="w-3.5 h-3.5" />
                    </div>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 text-emerald-400">
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </div>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 text-emerald-400">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                    {/* Index finger pointing upwards in the center */}
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center text-emerald-300 shadow-md">
                      <IndexFingerIcon className="w-6 h-6 text-emerald-300" />
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-emerald-300 mt-1">
                    {getTranslation('swipeLabel', language)}
                  </span>
                  <span className="text-[9px] text-emerald-200/80 mt-0.5 font-medium">
                    {swipeHint}
                  </span>
                </div>

                {/* Right: Double Tap to Pause with Index Finger */}
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-amber-400/50 flex flex-col items-center justify-center shadow-inner">
                  <div className="relative w-20 h-20 flex items-center justify-center my-0.5">
                    {/* Tap ripple waves */}
                    <div className="absolute w-16 h-16 rounded-full border border-amber-400/30 animate-ping pointer-events-none" />
                    <div className="absolute w-12 h-12 rounded-full border border-amber-400/50 pointer-events-none" />
                    {/* Index finger tapping */}
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-300 shadow-md animate-pulse">
                      <IndexFingerIcon className="w-6 h-6 text-amber-300" />
                    </div>
                    {/* 2x badge */}
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] shadow">
                      2x
                    </span>
                  </div>
                  <span className="text-[11px] font-black text-amber-300 mt-1">
                    {getTranslation('doubleTapLabel', language)}
                  </span>
                  <span className="text-[9px] text-amber-200/80 mt-0.5 font-medium">
                    {getTranslation('doubleTapDesc', language)}
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-black text-white">
                {getTranslation('tutorialStep2Title', language)}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-[290px] whitespace-pre-line text-left bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                {getTranslation('tutorialStep2Desc', language)}
              </p>
            </div>
          )}

          {/* Step 2: Energy Orbs & Powerups (STEP 3/4 in UI) */}
          {step === 2 && (
            <div className="space-y-3 animate-fade-in flex flex-col items-center w-full">
              {/* 3 Core Item Cards */}
              <div className="grid grid-cols-3 gap-2 w-full max-w-[320px]">
                {/* 1. Red & Special Color Apples */}
                <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-rose-500/40 flex flex-col items-center text-center relative overflow-hidden shadow-inner">
                  <div className="relative mb-1 flex items-center justify-center">
                    <RedAppleIcon size={26} className="filter drop-shadow-[0_2px_8px_rgba(244,63,94,0.4)]" />
                    <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block shadow-sm" />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shadow-sm" />
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-rose-300 truncate w-full">
                    {getTranslation('fruitNormal', language)}
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-200 text-[8px] font-black mt-0.5 border border-rose-500/30">
                    ⭐ +10~20
                  </span>
                  <span className="text-[9px] text-slate-300/90 mt-1 leading-tight font-medium">
                    {getTranslation('fruitNormalDesc', language)}
                  </span>
                </div>

                {/* 2. Golden Apple */}
                <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-amber-500/40 flex flex-col items-center text-center relative overflow-hidden shadow-inner">
                  <div className="relative mb-1 flex items-center justify-center">
                    <GoldenAppleIcon className="w-6 h-6 filter drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)] animate-pulse" />
                  </div>
                  <span className="text-[11px] font-black text-amber-300 truncate w-full">
                    {getTranslation('fruitStar', language)}
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-200 text-[8px] font-black mt-0.5 border border-amber-500/30">
                    {language === 'en'
                      ? '✨ +50 Pts · +5 Coins'
                      : language === 'ja'
                      ? '✨ +50点 · +5コイン'
                      : language === 'zh-CN'
                      ? '✨ +50分 · +5币'
                      : '✨ +50分 · +5幣'}
                  </span>
                  <span className="text-[9px] text-slate-300/90 mt-1 leading-tight font-medium">
                    {getTranslation('fruitStarDesc', language)}
                  </span>
                </div>

                {/* 3. Forcefield Shield */}
                <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-sky-500/40 flex flex-col items-center text-center relative overflow-hidden shadow-inner">
                  <div className="relative mb-1 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-sky-400 filter drop-shadow-[0_2px_8px_rgba(56,189,248,0.5)]" />
                  </div>
                  <span className="text-[11px] font-black text-sky-300 truncate w-full">
                    {getTranslation('fruitShield', language)}
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-200 text-[8px] font-black mt-0.5 border border-sky-500/30">
                    {language === 'en'
                      ? '🛡️ 4s Shield'
                      : language === 'ja'
                      ? '🛡️ 4秒無敵'
                      : language === 'zh-CN'
                      ? '🛡️ 4秒无敌'
                      : '🛡️ 4秒無敵'}
                  </span>
                  <span className="text-[9px] text-slate-300/90 mt-1 leading-tight font-medium">
                    {getTranslation('fruitShieldDesc', language)}
                  </span>
                </div>
              </div>

              {/* Special Items Hint Banner */}
              <div className="w-full max-w-[320px] px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-sky-500/15 border border-pink-400/30 text-pink-200 text-[10px] font-bold flex items-center justify-center gap-1.5 shadow-sm text-center">
                <span>{getTranslation('specialItemsHint', language)}</span>
              </div>

              {/* Step 3 Title */}
              <h3 className="text-xl font-black text-white tracking-wide">
                {getTranslation('tutorialStep3Title', language)}
              </h3>

              {/* Detailed Points Box */}
              <div className="space-y-1.5 text-left text-xs text-slate-300 bg-slate-900/70 p-3 rounded-xl border border-slate-800 w-full max-w-[320px] leading-relaxed">
                <div className="flex items-start gap-1.5">
                  <span className="shrink-0 text-sm">🍎</span>
                  <span>{getTranslation('step3Point1', language)}</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="shrink-0 text-sm">🌟</span>
                  <span>{getTranslation('step3Point2', language)}</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="shrink-0 text-sm">🛡️</span>
                  <span>{getTranslation('step3Point3', language)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Survival Rules & Starter Gift Pack (STEP 4/4 in UI) */}
          {step === 3 && (
            <div className="space-y-3 animate-fade-in flex flex-col items-center w-full">
              {/* 3-Point Rules & Hearts Stamina Card */}
              <div className="w-full max-w-[320px] bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-2.5 sm:p-3 text-left space-y-2 shadow-inner">
                {/* Rule 1: Collision */}
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] leading-snug">
                    <span className="font-extrabold text-rose-300">
                      {getTranslation('step4Rule1Title', language)}：
                    </span>
                    <span className="text-slate-300 font-medium">
                      {getTranslation('step4Rule1Desc', language)}
                    </span>
                  </div>
                </div>

                {/* Rule 2: Stamina on clears vs loss */}
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] leading-snug">
                    <span className="font-extrabold text-emerald-300">
                      {getTranslation('step4Rule2Title', language)}：
                    </span>
                    <span className="text-slate-300 font-medium">
                      {getTranslation('step4Rule2Desc', language)}
                    </span>
                  </div>
                </div>

                {/* Rule 3: Auto Refill */}
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] leading-snug">
                    <span className="font-extrabold text-amber-300">
                      {getTranslation('step4Rule3Title', language)}：
                    </span>
                    <span className="text-slate-300 font-medium">
                      {getTranslation('step4Rule3Desc', language)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Starter Gift Box with Ambient Glow */}
              <div className="relative my-0.5 flex flex-col items-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-emerald-400 blur-xl opacity-40 animate-pulse" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 via-rose-500 to-pink-500 p-0.5 shadow-2xl flex items-center justify-center animate-pulse">
                  <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center gap-2">
                    <div className="flex flex-col items-center">
                      <CoinIcon className="w-7 h-7 filter drop-shadow-[0_2px_6px_rgba(251,191,36,0.5)]" />
                      <span className="text-[10px] font-black text-amber-300 leading-tight mt-0.5">
                        {getTranslation('starterPackCoins', language)}
                      </span>
                    </div>
                    <div className="w-px h-8 bg-slate-800" />
                    <div className="flex flex-col items-center">
                      <Heart className="w-7 h-7 fill-rose-500 text-rose-500 filter drop-shadow-[0_2px_6px_rgba(244,63,94,0.5)]" />
                      <span className="text-[10px] font-black text-rose-300 leading-tight mt-0.5">
                        {getTranslation('starterPackHearts', language)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-black text-white tracking-wide">
                {getTranslation('tutorialComplete', language)}
              </h3>

              {/* Starter Gift Claim Status Card */}
              <div
                className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 max-w-[320px] w-full transition-all ${
                  hasClaimedReward
                    ? 'bg-slate-900/90 border-emerald-500/40 text-emerald-300 shadow-inner'
                    : 'bg-gradient-to-r from-amber-500/25 via-emerald-500/25 to-teal-500/25 border-amber-400/60 text-amber-200 shadow-lg shadow-amber-500/10 animate-pulse'
                }`}
              >
                {hasClaimedReward ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                )}
                <span>
                  {hasClaimedReward
                    ? getTranslation('tutorialRewardClaimedNotice', language)
                    : getTranslation('tutorialRewardNotice', language)}
                </span>
              </div>
            </div>
          )}

          {/* Step Dots indicator */}
          <div className="flex items-center gap-1.5 pt-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  step === i ? 'w-6 bg-emerald-400' : 'w-1.5 bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Sticky Footer Navigation Buttons */}
        <div className="p-4 border-t border-slate-800/80 flex items-center justify-between gap-2 shrink-0 bg-slate-900/90 backdrop-blur-md">
          {step > 0 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold flex items-center gap-1 transition-all active:scale-95 touch-manipulation cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{getTranslation('prevStep', language)}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="min-h-[44px] px-3.5 py-2.5 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors touch-manipulation cursor-pointer flex items-center"
            >
              {getTranslation('skipTutorial', language)}
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            className={`min-h-[44px] flex-1 max-w-[210px] py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-95 touch-manipulation cursor-pointer ${
              step === totalSteps - 1 && !hasClaimedReward
                ? 'bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 hover:brightness-110 text-slate-950 shadow-amber-500/30 ring-2 ring-amber-300/50 animate-pulse'
                : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:brightness-110 text-slate-950 shadow-emerald-500/30'
            }`}
          >
            <span>
              {step === totalSteps - 1
                ? hasClaimedReward
                  ? getTranslation('tutorialFinishBtn', language)
                  : getTranslation('tutorialClaimBtn', language)
                : getTranslation('nextStep', language)}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </CuteModalBackground>
    </div>
  );
};
