import React, { useState, useEffect, useRef } from 'react';
import { CuteMonsterSnakeArt } from './CuteMonsterSnakeArt';
import { soundEngine } from '../utils/audio';
import { SupportedLanguage, detectSystemLanguage } from '../utils/i18n';
import { Play, Shield } from 'lucide-react';

interface IntroAnimationProps {
  isOpen: boolean;
  onFinish: () => void;
  language?: SupportedLanguage;
  selectedSkin?: string;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({
  isOpen,
  onFinish,
  language,
  selectedSkin = 'neon_viper',
}) => {
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);
  const TOTAL_DURATION_MS = 6800; // Stage 1 extended to 3.0s (Total: 6.8s)

  // 自動跟隨手機系統語言 (Auto-detect mobile system language upon start)
  const currentLanguage: SupportedLanguage = language || detectSystemLanguage();

  // Keep a stable ref to onFinish so parent re-renders never tear down or restart the animation
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasFinishedRef = useRef<boolean>(false);
  const crackSfxPlayedRef = useRef<boolean>(false);
  const hatchSfxPlayedRef = useRef<boolean>(false);

  // Trigger finish safely with exit transition
  const triggerFinish = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setIsFinishing(true);
    soundEngine.unlockAudio().catch(() => {});
    try {
      soundEngine.playResume();
    } catch {
      // ignore
    }
    setTimeout(() => {
      onFinishRef.current();
    }, 350);
  };

  // Main 5-second animation clock
  useEffect(() => {
    if (!isOpen) {
      setElapsedMs(0);
      setIsFinishing(false);
      hasFinishedRef.current = false;
      crackSfxPlayedRef.current = false;
      hatchSfxPlayedRef.current = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    startTimeRef.current = performance.now();
    hasFinishedRef.current = false;
    crackSfxPlayedRef.current = false;
    hatchSfxPlayedRef.current = false;
    setElapsedMs(0);
    setIsFinishing(false);

    // Opening chime
    try {
      soundEngine.playIntroChime();
    } catch {
      // ignore
    }

    const tick = (now: number) => {
      if (!startTimeRef.current) startTimeRef.current = now;
      const diff = now - startTimeRef.current;
      setElapsedMs(Math.min(TOTAL_DURATION_MS, diff));

      // Sound 1: At 2.0s, egg cracking sound during intensified wobbling
      if (diff >= 2000 && !crackSfxPlayedRef.current) {
        crackSfxPlayedRef.current = true;
        try {
          soundEngine.playClick();
        } catch {
          // ignore
        }
      }

      // Sound 2: At 3.0s, dramatic hatching burst fanfare & eat sound as egg breaks
      if (diff >= 3000 && !hatchSfxPlayedRef.current) {
        hatchSfxPlayedRef.current = true;
        try {
          soundEngine.playSpecialEat();
        } catch {
          // ignore
        }
      }

      if (diff >= TOTAL_DURATION_MS) {
        triggerFinish();
      } else {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate progress
  const progressPercent = Math.min(100, Math.round((elapsedMs / TOTAL_DURATION_MS) * 100));

  // 4 Detailed Cinematic Timeline Stages:
  // Stage 1 (0.0s – 3.0s): Magic Summoning Rune + Monster Egg Wobbling & Cracking (Extended to 3s)
  // Stage 2 (3.0s – 4.5s): Egg Shatters with 2 broken shells flying apart, Snake shoots out & slithers eating treats
  // Stage 3 (4.5s – 5.8s): 3D Neon Game Title banner drops in + Trophy & Feature pills
  // Stage 4 (5.8s – 6.8s): Warp gate + Mascot waves "READY! Start Adventure" & White Flash Transition
  const stage =
    elapsedMs < 3000 ? 1 : elapsedMs < 4500 ? 2 : elapsedMs < 5800 ? 3 : 4;

  // Localized texts for all 4 languages (zh-HK, zh-CN, en, ja)
  const texts = {
    'zh-HK': {
      skip: '跳過',
      summoning: '⚡ 正在召喚怪獸萌蛇...',
      cracking: '🥚 蛋殼劇烈震動！即將破殼！',
      incubatingSub: '神秘萌怪孵化中...',
      crackingSub: '⚡ 即將破殼而出！⚡',
      hatching: '✨ 破蛋而出！萌力覺醒！',
      eating: '🍎 吞噬能量果實 · 迅速成長！',
      title: 'Snake Pro',
      subtitle: '怪獸萌蛇大冒險',
      ready: '🚀 冒險準備就緒！進入遊戲...',
      loading: '載入遊戲資源中...',
      readyShort: '準備完成！',
      tapSkip: '點擊任意處跳過動畫',
    },
    'zh-CN': {
      skip: '跳过',
      summoning: '⚡ 正在召唤怪兽萌蛇...',
      cracking: '🥚 蛋壳剧烈震动！即将破壳！',
      incubatingSub: '神秘萌怪孵化中...',
      crackingSub: '⚡ 即将破壳而出！⚡',
      hatching: '✨ 破蛋而出！萌力觉醒！',
      eating: '🍎 吞噬能量果实 · 迅速成长！',
      title: 'Snake Pro',
      subtitle: '怪兽萌蛇大冒险',
      ready: '🚀 冒险准备就绪！进入游戏...',
      loading: '载入游戏资源中...',
      readyShort: '准备完成！',
      tapSkip: '点击任意处跳过动画',
    },
    en: {
      skip: 'Skip',
      summoning: '⚡ Summoning Cute Monster Snake...',
      cracking: '🥚 Egg is trembling! About to hatch!',
      incubatingSub: 'Incubating Mystery Monster...',
      crackingSub: '⚡ CRACKING OUT! ⚡',
      hatching: '✨ Hatched from Egg! Power Awakens!',
      eating: '🍎 Eating Power Berries · Growing Fast!',
      title: 'Snake Pro',
      subtitle: 'Monster Snake Adventure',
      ready: '🚀 Ready to Play! Entering World...',
      loading: 'LOADING ASSETS...',
      readyShort: 'READY!',
      tapSkip: 'Tap anywhere to skip intro',
    },
    ja: {
      skip: 'スキップ',
      summoning: '⚡ モンスターヘビ召喚中...',
      cracking: '🥚 タマゴが激しく揺れている！',
      incubatingSub: '謎のモンスター孵化中...',
      crackingSub: '⚡ タマゴにヒビが！⚡',
      hatching: '✨ 破卵誕生！タマゴから飛び出した！',
      eating: '🍎 エナジーフルーツを食べて急成長！',
      title: 'Snake Pro',
      subtitle: 'モンスター・スネーク大冒険',
      ready: '🚀 準備完了！ゲームスタート...',
      loading: 'ゲームデータ読込中...',
      readyShort: '準備完了！',
      tapSkip: 'タップしてスキップ',
    },
  }[currentLanguage] || {
    skip: '跳過',
    summoning: '⚡ 正在召喚怪獸萌蛇...',
    cracking: '🥚 蛋殼劇烈震動！即將破殼！',
    incubatingSub: '神秘萌怪孵化中...',
    crackingSub: '⚡ 即將破殼而出！⚡',
    hatching: '✨ 破蛋而出！萌力覺醒！',
    eating: '🍎 吞噬能量果實 · 迅速成長！',
    title: 'Snake Pro',
    subtitle: '怪獸萌蛇大冒險',
    ready: '🚀 冒險準備就緒！進入遊戲...',
    loading: '載入遊戲資源中...',
    readyShort: '準備完成！',
    tapSkip: '點擊任意處跳過動畫',
  };

  // Mascot skin variant
  const mascotVariant =
    selectedSkin === 'neon_viper'
      ? 'neon_viper'
      : selectedSkin === 'neon_aurora'
      ? 'neon_aurora'
      : selectedSkin === 'sulley_furry'
      ? 'sulley'
      : selectedSkin === 'night_fury'
      ? 'nightfury'
      : 'mikey';

  return (
    <div
      onClick={triggerFinish}
      className={`fixed inset-0 z-[100] flex flex-col justify-between items-center text-slate-100 select-none overflow-hidden touch-manipulation cursor-pointer transition-all duration-300 ${
        isFinishing ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'radial-gradient(ellipse at 50% 45%, #0d1738 0%, #060914 70%, #020308 100%)',
      }}
    >
      {/* Background Cyber Ambient Grid */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none bg-[url('/assets/neon_digital_grid_bg.svg')] bg-cover bg-center"
        style={{
          transform: `scale(${1 + (elapsedMs / TOTAL_DURATION_MS) * 0.08})`,
        }}
      />

      {/* Rotating Background Magic Circles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {/* Outer glowing ring */}
        <div
          className="w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] rounded-full border border-cyan-500/30 animate-spin"
          style={{
            animationDuration: '14s',
            boxShadow: '0 0 50px rgba(6, 182, 212, 0.25), inset 0 0 40px rgba(6, 182, 212, 0.15)',
          }}
        />
        {/* Inner counter rotating dashed ring */}
        <div
          className="absolute w-[240px] h-[240px] sm:w-[290px] sm:h-[290px] rounded-full border-2 border-dashed border-pink-500/35 animate-spin"
          style={{ animationDuration: '8s', animationDirection: 'reverse' }}
        />
        {/* Center glowing nebula glow */}
        <div
          className="absolute w-52 h-52 rounded-full bg-gradient-to-tr from-cyan-500/25 via-emerald-500/25 to-purple-500/25 blur-3xl"
          style={{
            transform: `scale(${0.9 + Math.sin(elapsedMs / 200) * 0.15})`,
          }}
        />
      </div>

      {/* Floating Sparkles & Light Points */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[16%] left-[14%] text-cyan-300 text-lg animate-bounce opacity-85" style={{ animationDuration: '2.1s' }}>✦</div>
        <div className="absolute top-[20%] right-[16%] text-amber-300 text-xl animate-bounce opacity-90" style={{ animationDuration: '2.5s', animationDelay: '0.3s' }}>★</div>
        <div className="absolute bottom-[26%] left-[10%] text-pink-400 text-base animate-pulse opacity-80">✨</div>
        <div className="absolute bottom-[22%] right-[12%] text-emerald-300 text-lg animate-bounce opacity-85" style={{ animationDuration: '1.9s', animationDelay: '0.2s' }}>★</div>
      </div>



      {/* Radiant White Burst Flash at the end of intro */}
      {elapsedMs >= 6200 && (
        <div
          className="fixed inset-0 z-50 bg-white pointer-events-none transition-opacity duration-300"
          style={{
            opacity: Math.min(1, (elapsedMs - 6200) / 450),
          }}
        />
      )}

      {/* CENTER STAGE: 4 Distinct Dramatic Animations */}
      <div className="w-full max-w-md flex-1 min-h-0 flex flex-col items-center justify-center relative z-20 px-4 py-2">
        {/* ========================================================
            STAGE 1 (0.0s – 3.0s): Magic Egg Incubating & Cracking (3 Seconds)
           ======================================================== */}
        {stage === 1 && (
          <div className="flex flex-col items-center text-center animate-fade-in">
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* Summoning Rune floor circle */}
              <div
                className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/50 animate-spin"
                style={{ animationDuration: '6s' }}
              />
              <div
                className="absolute inset-4 rounded-full border border-pink-400/40 animate-spin"
                style={{ animationDuration: '8s', animationDirection: 'reverse' }}
              />

              {/* Glowing Dragon Monster Egg with real-time shaking wobble */}
              <div
                className="relative w-28 h-36 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] bg-gradient-to-b from-cyan-200 via-teal-300 to-emerald-400 shadow-[0_0_40px_rgba(6,182,212,0.7)] flex flex-col items-center justify-center border-2 border-white/90"
                style={{
                  animation:
                    elapsedMs < 1800
                      ? 'eggWobble 0.6s ease-in-out infinite'
                      : 'eggWobble 0.16s ease-in-out infinite',
                }}
              >
                {/* Egg spots and patterns */}
                <div className="absolute top-5 left-4 w-4 h-4 rounded-full bg-emerald-500/40" />
                <div className="absolute top-11 right-4 w-5 h-5 rounded-full bg-teal-600/35" />
                <div className="absolute bottom-6 left-6 w-6 h-6 rounded-full bg-cyan-600/30" />

                {/* Cracking Light Lines */}
                <div className="relative flex flex-col items-center">
                  <div className="text-2xl animate-pulse">⚡</div>
                  {elapsedMs >= 1700 && (
                    <div className="absolute -top-2 text-xl font-bold text-amber-200 animate-ping">
                      💥
                    </div>
                  )}
                </div>

                <div className="absolute -top-3 text-lg animate-bounce">✨</div>
              </div>
            </div>

            {/* Stage 1 Status Tag */}
            <div className="mt-5 flex flex-col items-center">
              <span className="px-4 py-1.5 rounded-full bg-cyan-500/25 border border-cyan-400/50 text-cyan-200 text-xs font-black tracking-wide shadow-lg">
                {elapsedMs < 1800 ? texts.summoning : texts.cracking}
              </span>
              <p className="text-[11px] text-slate-400 mt-2 font-mono">
                {elapsedMs < 1800 ? texts.incubatingSub : texts.crackingSub}
              </p>
            </div>
          </div>
        )}

        {/* ========================================================
            STAGE 2 (3.0s – 4.5s): EGG SHATTERS & SNAKE EMERGES!
           ======================================================== */}
        {stage === 2 && (
          <div className="flex flex-col items-center w-full text-center relative animate-fade-in">
            {/* Center Stage Arena */}
            <div className="relative w-full max-w-[340px] h-52 flex items-center justify-center overflow-visible">
              {/* Explosion Shockwave Ripple */}
              <div
                className="absolute w-44 h-44 rounded-full border-4 border-amber-300/80 shadow-[0_0_40px_rgba(251,191,36,0.9)] pointer-events-none"
                style={{ animation: 'shockwave 1s ease-out forwards' }}
              />

              {/* Sparkle burst emojis */}
              <div className="absolute -top-3 left-8 text-2xl animate-bounce">💥</div>
              <div className="absolute top-2 right-8 text-2xl animate-ping">✨</div>
              <div className="absolute bottom-2 left-6 text-xl animate-pulse">⭐</div>
              <div className="absolute bottom-2 right-8 text-xl animate-bounce">🌟</div>

              {/* BROKEN EGG SHELL (Left Half flying off to the left) */}
              <div
                className="absolute z-10 w-16 h-24 rounded-tl-[60px] rounded-bl-[40px] bg-gradient-to-br from-cyan-200 via-teal-300 to-emerald-400 border-2 border-white/80 shadow-[0_0_20px_rgba(6,182,212,0.6)] flex items-center justify-center text-teal-900 font-bold"
                style={{
                  clipPath: 'polygon(0% 0%, 100% 20%, 75% 50%, 100% 80%, 0% 100%)',
                  animation: 'shellLeftBreak 1.2s ease-out forwards',
                }}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500/40" />
              </div>

              {/* BROKEN EGG SHELL (Right Half flying off to the right) */}
              <div
                className="absolute z-10 w-16 h-24 rounded-tr-[60px] rounded-br-[40px] bg-gradient-to-bl from-cyan-200 via-teal-300 to-emerald-400 border-2 border-white/80 shadow-[0_0_20px_rgba(6,182,212,0.6)] flex items-center justify-center text-teal-900 font-bold"
                style={{
                  clipPath: 'polygon(100% 0%, 0% 20%, 25% 50%, 0% 80%, 100% 100%)',
                  animation: 'shellRightBreak 1.2s ease-out forwards',
                }}
              >
                <div className="w-2 h-2 rounded-full bg-teal-600/40" />
              </div>

              {/* THE CUTE MONSTER SNAKE SHOOTING OUT OF THE BROKEN EGG! */}
              <div
                className="relative z-20 flex items-center justify-center"
                style={{ animation: 'snakeEmerge 0.8s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards' }}
              >
                {/* Floating energy treats */}
                <div
                  className="absolute -left-16 top-0 p-1.5 rounded-full bg-rose-500/25 border border-rose-400/60 shadow-lg animate-bounce"
                  style={{ animationDuration: '0.9s' }}
                >
                  <span className="text-2xl">🍎</span>
                </div>
                <div
                  className="absolute -right-16 -top-2 p-1.5 rounded-full bg-amber-500/25 border border-amber-400/60 shadow-lg animate-bounce"
                  style={{ animationDuration: '1.1s', animationDelay: '0.15s' }}
                >
                  <span className="text-2xl">⭐</span>
                </div>
                <div
                  className="absolute right-12 -bottom-8 p-1.5 rounded-full bg-cyan-500/25 border border-cyan-400/60 shadow-lg animate-bounce"
                  style={{ animationDuration: '1.3s', animationDelay: '0.3s' }}
                >
                  <Shield className="w-5 h-5 text-cyan-300" />
                </div>

                {/* Mascot Snake Art with Glow */}
                <div
                  className="transform scale-110 drop-shadow-[0_0_30px_rgba(56,189,248,0.9)]"
                  style={{ animation: 'floatGentle 2s ease-in-out infinite' }}
                >
                  <CuteMonsterSnakeArt
                    size={120}
                    variant={mascotVariant}
                    mood="excited"
                  />
                </div>
              </div>
            </div>

            {/* Stage 2 Text Announcement */}
            <div className="mt-3 flex flex-col items-center">
              <span className="px-4 py-1.5 rounded-full bg-emerald-500/30 border border-emerald-400/60 text-emerald-200 text-xs sm:text-sm font-black shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center gap-1.5">
                <span>🐣</span>
                <span>{texts.hatching}</span>
              </span>
              <p className="text-[12px] text-amber-300 font-bold mt-2 flex items-center gap-1">
                <span>{texts.eating}</span>
              </p>
            </div>
          </div>
        )}

        {/* ========================================================
            STAGE 3 (4.5s – 5.8s): 3D TITLE FORGE & FEATURE PILLS
           ======================================================== */}
        {stage === 3 && (
          <div className="flex flex-col items-center w-full text-center animate-fade-in">
            {/* Glowing Golden Crown Crest (Crisp vector elements, no blurry raster/app logo) */}
            <div className="relative my-2 sm:my-3 flex items-center justify-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/20 to-teal-500/30 border border-emerald-400/50 backdrop-blur-md flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                <span className="text-4xl sm:text-5xl select-none filter drop-shadow-[0_0_15px_rgba(251,191,36,0.85)] animate-bounce" style={{ animationDuration: '1.6s' }}>
                  👑
                </span>
              </div>
              <div className="absolute -top-2 -right-2 text-2xl animate-spin select-none" style={{ animationDuration: '4s' }}>
                ✨
              </div>
              <div className="absolute -bottom-1 -left-2 text-xl animate-pulse select-none">
                🌟
              </div>
            </div>

            {/* Glowing 3D Neon Game Title */}
            <h1
              className="text-3xl sm:text-4xl font-black tracking-wider mt-2 bg-gradient-to-r from-emerald-300 via-teal-200 via-amber-200 to-sky-300 bg-clip-text text-transparent uppercase drop-shadow-[0_0_25px_rgba(16,185,129,0.8)]"
              style={{
                textShadow: '0 0 30px rgba(16, 185, 129, 0.7), 0 0 60px rgba(56, 189, 248, 0.5)',
              }}
            >
              {texts.title}
            </h1>
            <p className="text-xs sm:text-sm font-bold text-emerald-300/90 mt-1">
              {texts.subtitle}
            </p>
          </div>
        )}

        {/* ========================================================
            STAGE 4 (5.8s – 6.8s): WARP PORTAL & READY TO PLAY!
           ======================================================== */}
        {stage === 4 && (
          <div className="flex flex-col items-center w-full text-center animate-fade-in">
            {/* Expanding Warp Portal Effect */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/40 via-cyan-500/40 to-purple-500/40 blur-2xl animate-pulse" />
              <div className="relative transform scale-110 drop-shadow-[0_0_35px_rgba(56,189,248,0.9)]">
                <CuteMonsterSnakeArt
                  size={110}
                  variant={mascotVariant}
                  mood="happy"
                />
              </div>
              <div className="absolute -top-1 -right-1 text-2xl animate-spin" style={{ animationDuration: '4s' }}>
                🌟
              </div>
            </div>

            {/* Ready Callout Banner */}
            <div className="mt-3 flex flex-col items-center">
              <div className="px-6 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-sm shadow-[0_0_30px_rgba(16,185,129,0.8)] flex items-center gap-2 animate-bounce">
                <Play className="w-4 h-4 fill-current" />
                <span>{texts.ready}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer: Progress Bar & Direct Skip */}
      <div className="w-full max-w-md px-5 pb-[calc(max(env(safe-area-inset-bottom),0.5rem)+1.2rem)] flex flex-col items-center gap-2.5 z-30 shrink-0">
        <div className="w-full flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-black text-slate-400 px-0.5">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              {progressPercent < 100 ? texts.loading : texts.readyShort}
            </span>
            <span className="text-amber-300 font-mono">
              {progressPercent}%
            </span>
          </div>

          {/* Smooth Progress Bar */}
          <div className="w-full h-3 rounded-full bg-slate-900/90 border border-slate-800 p-0.5 shadow-inner overflow-hidden relative">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-teal-400 via-emerald-400 to-amber-300 shadow-[0_0_12px_rgba(56,189,248,0.7)] transition-all duration-100 ease-linear relative overflow-hidden"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full -translate-x-full animate-[shimmer_1.5s_infinite]" />
            </div>
          </div>
        </div>

        {/* Tap to Skip */}
        <button
          type="button"
          onClick={triggerFinish}
          className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 font-medium tracking-wide transition-colors cursor-pointer py-1"
        >
          <span className="animate-pulse">👆</span>
          <span>{texts.tapSkip}</span>
        </button>
      </div>
    </div>
  );
};
