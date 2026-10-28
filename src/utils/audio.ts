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
  private bgmGainNode: GainNode | null = null;
  private bgmIntervalId: number | null = null;
  private isBgmPlaying: boolean = false;
  private wasBgmPlayingBeforeHidden: boolean = false;
  private currentStep: number = 0;
  private noiseBuffer: AudioBuffer | null = null;
  private isHidden: boolean = false;
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
    if (this.bgmIntervalId !== null) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
    if (this.bgmGainNode) {
      try {
        this.bgmGainNode.disconnect();
      } catch {
        // ignore
      }
      this.bgmGainNode = null;
    }
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

      // Re-create master BGM gain node attached to the fresh context
      this.bgmGainNode = this.ctx.createGain();
      this.bgmGainNode.gain.setValueAtTime(MASTER_BGM_VOLUME, this.ctx.currentTime);
      this.bgmGainNode.connect(this.ctx.destination);

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
      } else if (state === 'interrupted' || state === 'suspended') {
        if (!this.isHidden) {
          ctx.resume().catch(() => {});
        }
      }
    };
  }

  private handleVisibilityOrFocusChange(isVisible: boolean) {
    this.isHidden = !isVisible;

    if (!isVisible) {
      if (this.isBgmPlaying) {
        this.wasBgmPlayingBeforeHidden = true;
      }
      if (this.bgmIntervalId !== null) {
        clearInterval(this.bgmIntervalId);
        this.bgmIntervalId = null;
      }
      if (this.ctx && this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => {});
      }
    } else {
      // Immediate attempt when returning to app (e.g. from Privacy / Terms web page)
      this.resumeAndRestoreAudio().catch(() => {});
      // Staggered attempts to catch iOS CoreAudio hardware release
      setTimeout(() => this.resumeAndRestoreAudio().catch(() => {}), 150);
      setTimeout(() => this.resumeAndRestoreAudio().catch(() => {}), 450);
      setTimeout(() => this.resumeAndRestoreAudio().catch(() => {}), 900);
    }
  }

  private attachAutoUnlockListeners() {
    if (this.unlockListenersAttached || typeof window === 'undefined') return;
    this.unlockListenersAttached = true;

    // Keep gesture events PERMANENTLY active so returning from Safari or external browser
    // will instantly re-wake audio on the very first touch, even if iOS suspended it.
    const gestureEvents = ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown'];
    const handleGesture = () => {
      // Fast path: if already active and running, zero work on gameplay touch events
      if (this.ctx && this.ctx.state === 'running') {
        return;
      }

      unlockHtml5Audio();
      this.initContext();
      if (this.ctx && (this.ctx.state === 'suspended' || (this.ctx.state as string) === 'interrupted')) {
        this.ctx.resume().catch(() => {});
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

    // Native Capacitor / Cordova lifecycle hooks for app resume
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
      if (!ctx || ctx.state === 'closed' || (ctx.state as string) === 'interrupted') {
        ctx = this.recreateContext();
      }
      if (!ctx) return false;

      // iOS Safari and Android Chrome handle both 'suspended' and 'interrupted'
      const state = ctx.state as string;
      if (state === 'suspended' || state === 'interrupted') {
        await ctx.resume().catch(() => {});
      }

      // iOS Safari silent buffer unlock trick to re-engage physical audio hardware
      try {
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => {
          try {
            source.disconnect();
          } catch {
            // ignore
          }
        };
        source.start(0);
      } catch {
        // ignore
      }

      if (ctx.state === 'running') {
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

      // Restore background music if it was running before screen lock or app switch
      if (this.bgmEnabled && (this.wasBgmPlayingBeforeHidden || this.isBgmPlaying)) {
        if (!this.bgmIntervalId) {
          this.isBgmPlaying = false; // allow startBgm to launch cleanly
          this.startBgm();
        }
      }

      return ctx.state === 'running';
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
    this.isHidden = true;
    if (this.bgmIntervalId !== null) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
    if (this.ctx && this.ctx.state === 'running') {
      try {
        this.ctx.suspend().catch(() => {});
      } catch {
        // ignore
      }
    }
  }

  public async restoreFromExternalNavigation(): Promise<boolean> {
    this.isHidden = false;
    const res = await this.resumeAndRestoreAudio();
    setTimeout(() => {
      if (!this.ctx || this.ctx.state !== 'running') {
        this.recreateContext();
        if (this.bgmEnabled && (this.wasBgmPlayingBeforeHidden || this.isBgmPlaying)) {
          this.isBgmPlaying = false;
          this.startBgm();
        }
      }
    }, 250);
    return res;
  }

  public async unlockAudio(): Promise<boolean> {
    return this.resumeAndRestoreAudio();
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx || this.ctx.state === 'closed' || (this.ctx.state as string) === 'interrupted') {
      return this.recreateContext();
    }

    const state = this.ctx.state as string;
    if (state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }


    // Ensure BGM gain node is bound to current context
    if (!this.bgmGainNode || this.bgmGainNode.context !== this.ctx) {
      try {
        this.bgmGainNode = this.ctx.createGain();
        this.bgmGainNode.gain.setValueAtTime(MASTER_BGM_VOLUME, this.ctx.currentTime);
        this.bgmGainNode.connect(this.ctx.destination);
      } catch {
        // ignore
      }
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

  /**
   * Procedural Multi-Movement Whimsical Fantasy Adventure BGM
   * 96-step musical sequence featuring 4 dynamic movements:
   * 1. Movement A (Playful Bouncy Carnival): Marimba lead + upright walking bass + pizzicato counterpoint
   * 2. Movement B (Soaring Chorus / Peak Energy): Glockenspiel high register + lush harmony chords
   * 3. Movement C (Funky Syncopated Bridge): Staccato woodblocks + playful passing notes + shaker groove
   * 4. Movement D (Music Box Fairytale Cadence): Shimmering music box arpeggios leading back to Movement A
   */
  public startBgm() {
    if (!this.bgmEnabled || typeof window === 'undefined') return;
    if (this.isHidden) {
      this.wasBgmPlayingBeforeHidden = true;
      return;
    }

    const ctx = this.initContext();
    if (!ctx) return;

    // Master BGM Volume bound to current context
    if (!this.bgmGainNode || this.bgmGainNode.context !== ctx) {
      try {
        this.bgmGainNode = ctx.createGain();
        this.bgmGainNode.gain.setValueAtTime(MASTER_BGM_VOLUME, ctx.currentTime);
        this.bgmGainNode.connect(ctx.destination);
      } catch {
        // ignore
      }
    }

    // If interval is active and playing, just resume ctx
    if (this.isBgmPlaying && this.bgmIntervalId !== null) {
      const state = ctx.state as string;
      if (state === 'suspended' || state === 'interrupted') {
        ctx.resume().catch(() => {});
      }
      return;
    }

    // Clear any stale interval
    if (this.bgmIntervalId !== null) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }

    this.isBgmPlaying = true;
    this.wasBgmPlayingBeforeHidden = true;

    // 96-step musical melody (A: 0-23, B: 24-47, C: 48-71, D: 72-95)
    const melodyPattern = [
      // Movement A: Playful Carnival Hook (0-23)
      523.25, 659.25, 783.99, 659.25,  // C5, E5, G5, E5
      880.00, 783.99, 659.25, 523.25,  // A5, G5, E5, C5
      587.33, 659.25, 587.33, 440.00,  // D5, E5, D5, A4
      523.25, 0,      659.25, 783.99,  // C5, rest, E5, G5
      880.00, 1046.5, 880.00, 783.99,  // A5, C6, A5, G5
      659.25, 783.99, 587.33, 523.25,  // E5, G5, D5, C5

      // Movement B: Uplifting Soaring Chorus (24-47)
      783.99, 880.00, 1046.5, 1174.66, // G5, A5, C6, D6
      1318.51, 1174.66, 1046.5, 880.00,// E6, D6, C6, A5
      698.46, 783.99, 880.00, 1046.5,  // F5, G5, A5, C6
      987.77, 880.00, 783.99, 0,       // B5, A5, G5, rest
      783.99, 1046.5, 1174.66, 1318.51,// G5, C6, D6, E6
      1567.98, 1318.51, 1174.66, 1046.5,// G6, E6, D6, C6

      // Movement C: Funky Syncopated Bridge (48-71)
      659.25, 0,      659.25, 783.99,  // E5, rest, E5, G5
      587.33, 0,      587.33, 659.25,  // D5, rest, D5, E5
      523.25, 587.33, 659.25, 523.25,  // C5, D5, E5, C5
      440.00, 493.88, 523.25, 587.33,  // A4, B4, C5, D5
      659.25, 783.99, 880.00, 1046.5,  // E5, G5, A5, C6
      1174.66, 987.77, 880.00, 783.99, // D6, B5, A5, G5

      // Movement D: Fairytale Music Box Cadence (72-95)
      1046.5, 0,      1318.51, 0,      // C6, rest, E6, rest
      1174.66, 0,     987.77, 0,       // D6, rest, B5, rest
      880.00, 1046.5, 783.99, 659.25,  // A5, C6, G5, E5
      587.33, 659.25, 783.99, 880.00,  // D5, E5, G5, A5
      1046.5, 1174.66, 1318.51, 1567.98,// C6, D6, E6, G6
      1318.51, 1174.66, 1046.5, 0      // E6, D6, C6, rest
    ];

    // Shimmering Glockenspiel / Counter-Melody Layer
    const glockPattern = [
      0, 1046.5, 0, 1318.51, 0, 1567.98, 0, 1318.51,
      0, 1174.66, 0, 1046.5, 0, 880.00, 0, 1046.5,
      0, 1318.51, 0, 1567.98, 0, 1760.00, 0, 1567.98,

      1567.98, 0, 1760.00, 0, 2093.00, 0, 1760.00, 0,
      1396.91, 0, 1567.98, 0, 1760.00, 0, 1396.91, 0,
      1567.98, 0, 2093.00, 0, 2349.32, 0, 2093.00, 0,

      1318.51, 0, 0, 1567.98, 1174.66, 0, 0, 1318.51,
      1046.5, 0, 1174.66, 0, 1318.51, 0, 1046.5, 0,
      880.00, 0, 1046.5, 0, 1174.66, 0, 1318.51, 0,

      2093.00, 1760.00, 1567.98, 1318.51, 1760.00, 1567.98, 1318.51, 1174.66,
      1567.98, 1318.51, 1174.66, 1046.5, 1318.51, 1174.66, 1046.5, 880.00,
      1046.5, 1318.51, 1567.98, 2093.00, 1567.98, 1318.51, 1046.5, 0
    ];

    // Harmony chords / pizzicato accompaniment
    const harmonyPattern = [
      329.63, 0, 392.00, 0, 329.63, 0, 261.63, 0,
      293.66, 0, 329.63, 0, 261.63, 0, 220.00, 0,
      440.00, 0, 523.25, 0, 392.00, 0, 329.63, 0,

      392.00, 0, 440.00, 0, 523.25, 0, 392.00, 0,
      349.23, 0, 392.00, 0, 440.00, 0, 349.23, 0,
      392.00, 0, 523.25, 0, 587.33, 0, 392.00, 0,

      329.63, 0, 392.00, 0, 293.66, 0, 329.63, 0,
      261.63, 0, 329.63, 0, 220.00, 0, 261.63, 0,
      329.63, 0, 392.00, 0, 440.00, 0, 523.25, 0,

      523.25, 0, 659.25, 0, 587.33, 0, 493.88, 0,
      440.00, 0, 523.25, 0, 392.00, 0, 329.63, 0,
      293.66, 0, 392.00, 0, 523.25, 0, 261.63, 0
    ];

    // Upright bouncy bassline
    const bassPattern = [
      130.81, 130.81, 196.00, 130.81, // C3, C3, G3, C3
      110.00, 110.00, 164.81, 110.00, // A2, A2, E3, A2
      87.31,  87.31,  130.81, 87.31,  // F2, F2, C3, F2
      98.00,  98.00,  146.83, 98.00,  // G2, G2, D3, G2
      130.81, 130.81, 196.00, 130.81, // C3
      110.00, 110.00, 164.81, 110.00, // A2

      130.81, 196.00, 130.81, 196.00, // C3, G3
      110.00, 164.81, 110.00, 164.81, // A2, E3
      87.31,  130.81, 87.31,  130.81, // F2, C3
      98.00,  146.83, 98.00,  146.83, // G2, D3
      130.81, 196.00, 130.81, 196.00, // C3, G3
      87.31,  130.81, 98.00,  146.83, // F2, C3, G2, D3

      130.81, 130.81, 164.81, 196.00, // C3, C3, E3, G3
      98.00,  98.00,  123.47, 146.83, // G2, G2, B2, D3
      110.00, 110.00, 130.81, 164.81, // A2, A2, C3, E3
      87.31,  87.31,  110.00, 130.81, // F2, F2, A2, C3
      130.81, 164.81, 196.00, 261.63, // C3, E3, G3, C4
      98.00,  123.47, 146.83, 196.00, // G2, B2, D3, G3

      130.81, 0,      164.81, 0,      // C3, E3
      98.00,  0,      146.83, 0,      // G2, D3
      110.00, 0,      164.81, 0,      // A2, E3
      87.31,  0,      130.81, 0,      // F2, C3
      130.81, 164.81, 196.00, 261.63, // C3, E3, G3, C4
      130.81, 130.81, 130.81, 0       // C3
    ];

    const stepDuration = 200; // Lively, upbeat ~150 BPM tempo

    const playBgmStep = () => {
      if (!this.isBgmPlaying || !this.bgmEnabled || this.isHidden) return;
      const audioCtx = this.initContext();
      if (!audioCtx) return;

      const state = audioCtx.state as string;
      if (state !== 'running') {
        if (state === 'suspended' || state === 'interrupted') {
          audioCtx.resume().catch(() => {});
        } else if (state === 'closed') {
          this.recreateContext();
        }
        return;
      }

      if (!this.bgmGainNode || this.bgmGainNode.context !== audioCtx) {
        try {
          this.bgmGainNode = audioCtx.createGain();
          this.bgmGainNode.gain.setValueAtTime(MASTER_BGM_VOLUME, audioCtx.currentTime);
          this.bgmGainNode.connect(audioCtx.destination);
        } catch {
          return;
        }
      }

      try {
        const now = audioCtx.currentTime;
        const stepIdx = this.currentStep % melodyPattern.length;
        const melodyFreq = melodyPattern[stepIdx];
        const bassFreq = bassPattern[stepIdx % bassPattern.length];

        // 1. Warm Melodic Marimba Lead
        if (melodyFreq > 0) {
          const osc = audioCtx.createOscillator();
          const noteGain = audioCtx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(melodyFreq, now);

          noteGain.gain.setValueAtTime(0.18, now);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

          osc.connect(noteGain);
          noteGain.connect(this.bgmGainNode);
          this.autoCleanup(osc, noteGain);

          osc.start(now);
          osc.stop(now + 0.18);
        }

        // 2. Upright Acoustic Bouncy Bass (Every 2 beats)
        if (this.currentStep % 2 === 0 && bassFreq > 0) {
          const bassOsc = audioCtx.createOscillator();
          const bassGain = audioCtx.createGain();

          bassOsc.type = 'sine';
          bassOsc.frequency.setValueAtTime(bassFreq * 1.04, now);
          bassOsc.frequency.exponentialRampToValueAtTime(bassFreq, now + 0.04);

          bassGain.gain.setValueAtTime(0.18, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);

          bassOsc.connect(bassGain);
          bassGain.connect(this.bgmGainNode);
          this.autoCleanup(bassOsc, bassGain);

          bassOsc.start(now);
          bassOsc.stop(now + 0.21);
        }

        this.currentStep++;
      } catch {
        // Audio waiting for user gesture
      }
    };

    this.bgmIntervalId = window.setInterval(playBgmStep, stepDuration);
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    this.wasBgmPlayingBeforeHidden = false;
    if (this.bgmIntervalId !== null) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
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
    if (!this.soundEnabled) return;
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
    if (!this.soundEnabled) return;
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
