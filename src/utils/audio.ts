/**
 * Modern Mobile Game Audio Engine
 * Uses Web Audio API to create arcade-quality sound effects and procedural background music
 * with multi-part melodies and layered instrumentation without external audio files.
 */

const MASTER_BGM_VOLUME = 0.35;
const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
let isHtml5AudioUnlocked = false;

const unlockHtml5Audio = () => {
  if (isHtml5AudioUnlocked || typeof window === 'undefined') return;
  try {
    const audio = new Audio();
    audio.src = SILENT_WAV;
    audio.volume = 0.01;
    const p = audio.play();
    if (p !== undefined) {
      p.then(() => {
        isHtml5AudioUnlocked = true;
        audio.pause();
      }).catch(() => {});
    }
  } catch {
    // ignore
  }
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private bgmEnabled: boolean = true;
  private bgmAudio: HTMLAudioElement | null = null;
  private isBgmPlaying: boolean = false;
  private wasBgmPlayingBeforeHidden: boolean = false;
  private noiseBuffer: AudioBuffer | null = null;
  private isHidden: boolean = false;
  private isExternalNavActive: boolean = false;
  private isResumingAudio: boolean = false;
  private lastResumeAttempt: number = 0;

  // iOS audio state
  private isUnlockedState: boolean = false;
  private unlockListenersAttached: boolean = false;
  private unlockCallbacks: Array<() => void> = [];
  private gestureRemover: (() => void) | null = null;

  constructor() {
    try {
      const savedSound = localStorage.getItem('snake_pro_sound');
      if (savedSound !== null) this.soundEnabled = savedSound === 'true';

      const savedBgm = localStorage.getItem('snake_pro_bgm');
      if (savedBgm !== null) this.bgmEnabled = savedBgm === 'true';
    } catch {
      // ignore
    }

    if (typeof window !== 'undefined') {
      this.attachAutoUnlockListeners();
      try {
        this.initContext();
      } catch {
        // ignore
      }
    }
  }

  private cleanupContext() {
    this.noiseBuffer = null;
    if (this.ctx) {
      try {
        if (this.ctx.state !== 'closed') {
          this.ctx.close().catch(() => {});
        }
      } catch {
        // ignore
      }
      this.ctx = null;
    }
  }

  private recreateContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    this.cleanupContext();

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    try {
      this.ctx = new AudioCtx();
      this.setupContextStateListener(this.ctx);
      return this.ctx;
    } catch (err) {
      console.warn('[SoundEngine] Failed to recreate AudioContext:', err);
      this.ctx = null;
      return null;
    }
  }

  private setupContextStateListener(ctx: AudioContext) {
    ctx.onstatechange = () => {
      const state = ctx.state as string;
      if (state === 'running') {
        this.isUnlockedState = true;
        const cbs = [...this.unlockCallbacks];
        this.unlockCallbacks = [];
        cbs.forEach((cb) => {
          try {
            cb();
          } catch {
            // ignore
          }
        });
      }
    };
  }

  private lastVisibilityChangeTimestamp: number = 0;

  public handleVisibilityOrFocusChange(isVisible: boolean) {
    const isDocHidden = typeof document !== 'undefined' ? document.visibilityState === 'hidden' : false;
    const shouldBeHidden = !isVisible || isDocHidden;

    if (this.isHidden === shouldBeHidden) return;
    this.isHidden = shouldBeHidden;

    if (this.isHidden) {
      // Leaving foreground / screen hidden: remember BGM state and immediately pause cleanly
      if (this.bgmEnabled && this.isBgmPlaying) {
        this.wasBgmPlayingBeforeHidden = true;
      }
      this.pauseBgm();

      // Cleanly suspend Web Audio context for SFX without pops
      if (this.ctx && this.ctx.state === 'running') {
        try {
          this.ctx.suspend().catch(() => {});
        } catch {
          // ignore
        }
      }
    } else {
      // Returning to foreground / app resumed:
      this.isExternalNavActive = false;

      // 1. Resume Web Audio context for SFX
      if (this.ctx) {
        const ctxState = this.ctx.state as string;
        if (ctxState === 'suspended' || ctxState === 'interrupted') {
          this.ctx.resume().catch(() => {});
        }
      }

      // 2. Resume BGM immediately
      if (this.bgmEnabled && (this.wasBgmPlayingBeforeHidden || !this.bgmAudio || this.bgmAudio.paused)) {
        this.startBgm();
      }
    }
  }

  private attachAutoUnlockListeners() {
    if (this.unlockListenersAttached || typeof window === 'undefined') return;
    this.unlockListenersAttached = true;

    const gestureEvents = ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown'];
    const handleGesture = () => {
      // If user navigated out to an external web page (Privacy/Terms), lock audio to dead silence
      if (this.isExternalNavActive) return;

      this.isHidden = false;
      unlockHtml5Audio();

      if (this.ctx && (this.ctx.state as string) === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      if (this.bgmEnabled && (!this.isBgmPlaying || (this.bgmAudio && this.bgmAudio.paused))) {
        this.startBgm();
      }
    };

    gestureEvents.forEach((ev) => {
      window.addEventListener(ev, handleGesture, { capture: true, passive: true });
    });

    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityOrFocusChange(document.visibilityState === 'visible');
    });

    window.addEventListener('pageshow', () => {
      this.handleVisibilityOrFocusChange(true);
    });

    window.addEventListener('pagehide', () => {
      this.handleVisibilityOrFocusChange(false);
    });

    window.addEventListener('focus', () => {
      this.handleVisibilityOrFocusChange(true);
    });

    // Native Capacitor / Cordova lifecycle hooks for app resume & pause
    const win = window as any;
    if (win.Capacitor?.Plugins?.App) {
      try {
        win.Capacitor.Plugins.App.addListener('appStateChange', (state: { isActive: boolean }) => {
          this.handleVisibilityOrFocusChange(state.isActive);
        });
      } catch {
        // ignore
      }
    }
    document.addEventListener('resume', () => {
      this.handleVisibilityOrFocusChange(true);
    });
    document.addEventListener('pause', () => {
      this.handleVisibilityOrFocusChange(false);
    });
  }

  public isUnlocked(): boolean {
    if (typeof window === 'undefined') return false;
    return !!this.ctx && this.ctx.state === 'running';
  }

  public onUnlock(callback: () => void): () => void {
    if (this.isUnlocked()) {
      callback();
      return () => {};
    }
    this.unlockCallbacks.push(callback);
    return () => {
      this.unlockCallbacks = this.unlockCallbacks.filter((cb) => cb !== callback);
    };
  }

  public async resumeAndRestoreAudio(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (this.isResumingAudio) {
      return !!this.ctx && this.ctx.state === 'running';
    }
    const nowTime = Date.now();
    if (nowTime - this.lastResumeAttempt < 100) {
      return !!this.ctx && this.ctx.state === 'running';
    }
    this.lastResumeAttempt = nowTime;
    this.isResumingAudio = true;

    try {
      unlockHtml5Audio();

      let ctx = this.ctx;
      if (!ctx || ctx.state === 'closed') {
        ctx = this.recreateContext();
      }
      if (ctx) {
        const state = ctx.state as string;
        if (state === 'suspended' || state === 'interrupted') {
          await ctx.resume().catch(() => {});
        }
      }

      if (this.bgmEnabled && (this.wasBgmPlayingBeforeHidden || !this.bgmAudio || this.bgmAudio.paused)) {
        this.startBgm();
      }

      return !!ctx && ctx.state === 'running';
    } catch {
      return false;
    } finally {
      this.isResumingAudio = false;
    }
  }

  private autoCleanup(...nodes: (AudioNode | null | undefined)[]) {
    const primary = nodes[0];
    if (primary && 'onended' in primary) {
      (primary as AudioScheduledSourceNode).onended = () => {
        for (let i = 0; i < nodes.length; i++) {
          try {
            nodes[i]?.disconnect();
          } catch {
            // ignore
          }
        }
      };
      return;
    }
    setTimeout(() => {
      for (let i = 0; i < nodes.length; i++) {
        try {
          nodes[i]?.disconnect();
        } catch {
          // ignore
        }
      }
    }, 600);
  }

  public prepareForExternalNavigation() {
    this.isExternalNavActive = true;
    this.isHidden = true;
    if (this.bgmEnabled && this.isBgmPlaying) {
      this.wasBgmPlayingBeforeHidden = true;
    }
    this.pauseBgm();
    if (this.ctx && this.ctx.state === 'running') {
      try {
        this.ctx.suspend().catch(() => {});
      } catch {
        // ignore
      }
    }
  }

  public async restoreFromExternalNavigation(): Promise<boolean> {
    this.isExternalNavActive = false;
    this.isHidden = false;
    if (this.ctx && (this.ctx.state as string) === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.bgmEnabled) {
      this.startBgm();
    }
    return true;
  }

  public async unlockAudio(): Promise<boolean> {
    return this.resumeAndRestoreAudio();
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx || this.ctx.state === 'closed') {
      return this.recreateContext();
    }

    const state = this.ctx.state as string;
    if (state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer && this.noiseBuffer.sampleRate === ctx.sampleRate) {
      return this.noiseBuffer;
    }
    const bufferSize = Math.floor(ctx.sampleRate * 0.05); // 50ms noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    localStorage.setItem('snake_pro_sound', String(enabled));
  }

  public getSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setBgmEnabled(enabled: boolean) {
    this.bgmEnabled = enabled;
    localStorage.setItem('snake_pro_bgm', String(enabled));
    if (enabled) {
      this.wasBgmPlayingBeforeHidden = true;
      this.startBgm();
    } else {
      this.wasBgmPlayingBeforeHidden = false;
      this.stopBgm();
    }
  }

  public getBgmEnabled(): boolean {
    return this.bgmEnabled;
  }

  public haptic(_pattern?: 'light' | 'medium' | 'heavy' | 'success' | 'collision') {
    return;
  }

  public getHapticsEnabled(): boolean {
    return false;
  }

  public setHapticsEnabled(_enabled: boolean) {
    // Disabled
  }

  private getBgmAudio(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    if (!this.bgmAudio) {
      try {
        const bgmUrl = new URL('assets/bgm_fantasy.mp3', window.location.href).href;
        this.bgmAudio = new Audio(bgmUrl);
        this.bgmAudio.loop = true;
        this.bgmAudio.volume = MASTER_BGM_VOLUME;
        this.bgmAudio.preload = 'auto';

        // iOS Safari safeguard: when audio reaches the end, loop back reliably
        this.bgmAudio.addEventListener('ended', () => {
          if (this.bgmAudio && this.bgmEnabled && !this.isHidden && !this.isExternalNavActive) {
            this.bgmAudio.currentTime = 0;
            this.bgmAudio.play().catch(() => {});
          }
        });
      } catch (err) {
        console.warn('[SoundEngine] Failed to initialize BGM audio element:', err);
      }
    }
    return this.bgmAudio;
  }

  /**
   * High-Fidelity Studio Fantasy Adventure BGM
   * Native HTML5 Audio loop backed by iOS CoreMedia AVPlayer:
   * 100% pop-free, zero DC offset beep on app suspend, and 100% reliable resume!
   */
  public startBgm() {
    if (!this.bgmEnabled || typeof window === 'undefined') return;
    if (this.isHidden || this.isExternalNavActive) {
      this.wasBgmPlayingBeforeHidden = true;
      return;
    }

    const audio = this.getBgmAudio();
    if (!audio) return;

    this.isBgmPlaying = true;
    this.wasBgmPlayingBeforeHidden = true;

    try {
      audio.volume = MASTER_BGM_VOLUME;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Play was deferred until user gesture - will be triggered on next interaction
        });
      }
    } catch {
      // ignore
    }
  }

  public pauseBgm() {
    this.isBgmPlaying = false;
    if (this.bgmAudio) {
      try {
        this.bgmAudio.pause();
      } catch {
        // ignore
      }
    }
  }

  public stopBgm() {
    this.pauseBgm();
    this.wasBgmPlayingBeforeHidden = false;
    if (this.bgmAudio) {
      try {
        this.bgmAudio.currentTime = 0;
      } catch {
        // ignore
      }
    }
  }

  /**
   * Standard Apple eat: crisp, bubbly pop
   */
  public playEat(combo: number = 1) {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const baseFreq = 520 + Math.min(combo * 40, 360);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, now + 0.08);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // ignore
    }
  }

  /**
   * Escalating Combo Arpeggio
   */
  public playCombo(combo: number) {
    if (!this.soundEnabled || combo <= 1) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const noteIdx = Math.min(combo - 2, notes.length - 1);
      const freq = notes[noteIdx];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.30, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // ignore
    }
  }

  /**
   * Golden fruit / special item eat sound
   */
  public playSpecialEat() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const notes = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6
      notes.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.04;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);

        osc.start(now);
        osc.stop(now + 0.15);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Star Fruit Catch
   */
  public playStarCatch() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const notes = [783.99, 987.77, 1174.66, 1567.98];
      notes.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.035;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);

        osc.start(now);
        osc.stop(now + 0.14);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Rainbow Fever Euphoric Chime - 8-note sparkling arpeggio with rich harmonic overtone
   */
  public playRainbowFever() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const rainbowNotes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0, 2637.02]; // C5 to E7
      rainbowNotes.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.045;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);

        osc.start(now);
        osc.stop(now + 0.22);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Double Tap responsive pop
   */
  public playDoubleTap() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Dual cute bubble blip
      [580, 880].forEach((freq, idx) => {
        const t = now + idx * 0.06;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);

        osc.start(t);
        osc.stop(t + 0.055);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Pause sound (playful cute spring/drop)
   */
  public playPause() {
    if (!this.soundEnabled || this.isHidden || (typeof document !== 'undefined' && document.hidden)) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.14);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // ignore
    }
  }

  /**
   * Resume sound (cheerful ascending chime)
   */
  public playResume() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(720, now + 0.12);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // ignore
    }
  }

  /**
   * Shield Activated
   */
  public playShield() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // ignore
    }
  }

  /**
   * Shield Pop / Blocked Collision
   */
  public playShieldPop() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.16);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // ignore
    }
  }

  /**
   * Shield Broken / Saved Life (legacy alias)
   */
  public playShieldBreak() {
    this.playShieldPop();
  }

  /**
   * Slow Potion Eaten
   */
  public playSlow() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.22);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // ignore
    }
  }

  /**
   * Coin Collected
   */
  public playCoin() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      this.autoCleanup(osc2, osc1, gain);

      osc1.start(now);
      osc1.stop(now + 0.08);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.25);
    } catch {
      // ignore
    }
  }

  /**
   * Game Over / Wall or Tail Collision
   */
  public playGameOver() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.35);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // ignore
    }
  }

  /**
   * Intro Opening Fanfare / Chime (Magical ascending fairy chime for the 5-second intro)
   */
  public playIntroChime() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6
      const now = ctx.currentTime;

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.18, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.38);

        osc.connect(gain);
        gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.4);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Level Clear: Celebratory victory fanfare arpeggio
   */
  public playLevelClear() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = ctx.currentTime;

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);

        gain.gain.setValueAtTime(0.2, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);

        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.35);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Quick turn swish / swipe sound
   */
  public playTurn() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.04);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {
      // ignore
    }
  }

  /**
   * Intro Star Gleam sparkle (for wink at 00:03)
   */
  public playStarGleam() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // High sparkling bell chime: C6, E6, G6, C7
      const freqs = [1046.5, 1318.5, 1567.98, 2093.0];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.12, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.36);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Intro 3D Logo Pop fanfare (for Snake Pro title at 00:04)
   */
  public playLogoPop() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const chords = [523.25, 659.25, 783.99, 1046.5]; // C major chord
      chords.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(freq, now + 0.15);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);
        osc.start(now);
        osc.stop(now + 0.42);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Intro White Flash transition burst (for white flash at 00:05)
   */
  public playWhiteFlashBurst() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Resonant deep swoosh + high shimmer
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.45);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
      osc.connect(gain);
      gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);
      osc.start(now);
      osc.stop(now + 0.5);

      // Shimmer overlay
      const shimmer = ctx.createOscillator();
      const sGain = ctx.createGain();
      shimmer.type = 'sine';
      shimmer.frequency.setValueAtTime(880, now);
      shimmer.frequency.exponentialRampToValueAtTime(1760, now + 0.2);
      sGain.gain.setValueAtTime(0.08, now);
      sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      shimmer.connect(sGain);
      sGain.connect(ctx.destination);
      this.autoCleanup(shimmer, sGain);
      shimmer.start(now);
      shimmer.stop(now + 0.36);
    } catch {
      // ignore
    }
  }

  /**
   * Bomb ticking heartbeat
   */
  public playBombTick() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // ignore
    }
  }

  /**
   * Bomb defused successfully
   */
  public playBombDefuse() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [587.33, 880, 1174.66].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.06);
        gain.gain.setValueAtTime(0.15, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.26);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Explosive blast sound
   */
  public playExplosion() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);
      osc.start(now);
      osc.stop(now + 0.6);
    } catch {
      // ignore
    }
  }

  /**
   * Ice sliding whoosh
   */
  public playIceSlide() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.06);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // ignore
    }
  }

  /**
   * Ghost mode ethereal chime
   */
  public playGhostMode() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [659.25, 783.99, 1046.5, 1318.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.12, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.42);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Reverse gear reversal whoosh
   */
  public playReverse() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(250, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.22);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      // ignore
    }
  }

  /**
   * Color match success
   */
  public playColorMatch() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [523.25, 659.25, 1046.5].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.04);
        gain.gain.setValueAtTime(0.12, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);
        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.32);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Color mismatch warning
   */
  public playColorMismatch() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // ignore
    }
  }

  /**
   * Power-up or revive fanfare sound
   */
  public playPowerUp() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.25);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // ignore
    }
  }

  /**
   * Revive Chime
   */
  public playRevive() {
    this.playPowerUp();
  }

  /**
   * Heart Refill sound
   */
  public playHeartRefill() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [440, 554.37, 659.25].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.16, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.2);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Button click / tap
   */
  public playClick() {
    if (!this.soundEnabled || this.isHidden || (typeof document !== 'undefined' && document.hidden)) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch {
      // ignore
    }
  }

  /**
   * Heart deducted / lost sound effect (descending minor dual tone)
   */
  public playHeartLoss() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [420, 310].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.75, now + idx * 0.1 + 0.14);

        gain.gain.setValueAtTime(0.18, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);
      this.autoCleanup(osc, gain);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.18);
      });
    } catch {
      // ignore
    }
  }
}

export const soundEngine = new SoundEngine();
