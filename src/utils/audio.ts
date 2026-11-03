/**
 * Modern Mobile Game Audio Engine
 * Uses Web Audio API to create arcade-quality sound effects and procedural background music
 * with multi-part melodies and layered instrumentation without external audio files.
 */


const MASTER_BGM_VOLUME = 0.35;

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private soundEnabled: boolean = true;
  private bgmEnabled: boolean = true;
  private rawBgmArrayBuffer: ArrayBuffer | null = null;
  private bgmAudioBuffer: AudioBuffer | null = null;
  private bgmSource: AudioBufferSourceNode | null = null;
  private activeBgmSources: Set<AudioBufferSourceNode> = new Set();
  private bgmGainNode: GainNode | null = null;
  private isLoadingBgm: boolean = false;
  private isStartingBgm: boolean = false;
  private isBgmPlaying: boolean = false;
  private wasBgmPlayingBeforeHidden: boolean = false;
  private noiseBuffer: AudioBuffer | null = null;
  private isHidden: boolean = false;
  private isExternalNavActive: boolean = false;
  private isResumingAudio: boolean = false;
  private lastResumeAttempt: number = 0;

  // iOS Web Audio DAC Keep-Alive (prevents iOS hardware amplifier from sleeping when BGM is off)
  private keepAliveNode: AudioBufferSourceNode | null = null;
  private keepAliveGain: GainNode | null = null;

  // iOS audio state
  private isUnlockedState: boolean = false;
  private unlockListenersAttached: boolean = false;
  private unlockCallbacks: Array<() => void> = [];

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
        this.getOrCreateContext();
      } catch {
        // ignore
      }
    }
  }

  public getDestination(ctx: AudioContext): AudioNode {
    if (this.masterGainNode && this.masterGainNode.context === ctx) {
      return this.masterGainNode;
    }
    return ctx.destination;
  }

  private startKeepAlive(ctx: AudioContext) {
    if (this.keepAliveNode || typeof window === 'undefined' || this.isHidden) return;
    try {
      // 1-second silent buffer looping continuously
      const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gain = ctx.createGain();
      // 0.0001 gain: inaudible (-80dB), but informs iOS CoreAudio that an active audio stream
      // is running so the hardware DAC speaker amplifier never goes into a cold sleep!
      gain.gain.value = 0.0001;

      source.connect(gain);
      gain.connect(this.getDestination(ctx));
      source.start(0);

      this.keepAliveNode = source;
      this.keepAliveGain = gain;
    } catch {
      // ignore
    }
  }

  private stopKeepAlive() {
    if (this.keepAliveNode) {
      try {
        this.keepAliveNode.stop();
        this.keepAliveNode.disconnect();
      } catch {}
      this.keepAliveNode = null;
    }
    if (this.keepAliveGain) {
      try {
        this.keepAliveGain.disconnect();
      } catch {}
      this.keepAliveGain = null;
    }
  }

  private getOrCreateContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    // CRITICAL: NEVER destroy or recreate the AudioContext on 'interrupted' or 'suspended'!
    // On iOS WebKit, an already unlocked AudioContext keeps its user-gesture activation!
    // If you recreate it, the new context is permanently blocked until another user gesture.
    if (!this.ctx || this.ctx.state === 'closed') {
      try {
        this.ctx = new AudioCtx();
        this.setupContextStateListener(this.ctx);
        // Clear decoded buffer cache if a brand new context was instantiated
        this.bgmAudioBuffer = null;
      } catch (err) {
        console.warn('[SoundEngine] Failed to create AudioContext:', err);
        this.ctx = null;
        return null;
      }
    }

    if (this.ctx && (!this.masterGainNode || this.masterGainNode.context !== this.ctx)) {
      try {
        this.masterGainNode = this.ctx.createGain();
        this.masterGainNode.gain.value = this.isHidden ? 0 : 1.0;
        this.masterGainNode.connect(this.ctx.destination);
      } catch {}
    }

    return this.ctx;
  }

  public ensureAudioContextActive(): AudioContext | null {
    const ctx = this.getOrCreateContext();
    if (ctx && (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted')) {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  private setupContextStateListener(ctx: AudioContext) {
    ctx.onstatechange = () => {
      const state = ctx.state as string;
      if (state === 'running') {
        this.isUnlockedState = true;
        if (!this.isHidden) {
          this.startKeepAlive(ctx);
        }
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

  public handleVisibilityOrFocusChange(isVisible: boolean) {
    const isDocHidden = typeof document !== 'undefined' ? document.visibilityState === 'hidden' : false;
    const shouldBeHidden = !isVisible || isDocHidden;

    if (this.isHidden === shouldBeHidden) return;
    this.isHidden = shouldBeHidden;

    if (this.isHidden) {
      // Leaving foreground / screen hidden:
      // 1. Remember if BGM was actively playing
      if (this.bgmEnabled && this.isBgmPlaying) {
        this.wasBgmPlayingBeforeHidden = true;
      }
      // 2. Immediately stop BGM node
      this.pauseBgm();
      // 3. Immediately stop Keep-Alive DAC node
      this.stopKeepAlive();
      // 4. Mute master gain node to 0 instantly (ensures 0 sound leak to home screen)
      if (this.masterGainNode && this.ctx) {
        try {
          this.masterGainNode.gain.cancelScheduledValues(0);
          this.masterGainNode.gain.setValueAtTime(0, this.ctx.currentTime);
        } catch {}
      }
      // 5. Suspend context so WebAudio thread pauses entirely
      if (this.ctx && this.ctx.state === 'running') {
        try {
          this.ctx.suspend().catch(() => {});
        } catch {}
      }
    } else {
      // Returning to foreground / app resumed:
      this.isExternalNavActive = false;

      // Staged recovery: try immediately, at 60ms, 180ms, 350ms, 600ms
      // to seamlessly synchronize with the native iOS AVAudioSession awakening
      this.resumeAudioPipeline();
      setTimeout(() => this.resumeAudioPipeline(), 60);
      setTimeout(() => this.resumeAudioPipeline(), 180);
      setTimeout(() => this.resumeAudioPipeline(), 350);
      setTimeout(() => this.resumeAudioPipeline(), 600);
    }
  }

  public async resumeAudioPipeline() {
    if (this.isHidden || typeof window === 'undefined') return;

    const ctx = this.getOrCreateContext();
    if (!ctx) return;

    // 1. Recover WebKit AudioContext state using proven PlayCanvas/WebKit workaround:
    // If state is interrupted or suspended, suspend then resume to unfreeze the hardware unit
    if (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted') {
      try {
        if (typeof ctx.suspend === 'function') {
          await ctx.suspend();
        }
      } catch {}
      try {
        await ctx.resume();
      } catch (err) {
        console.warn('[SoundEngine] ctx.resume error:', err);
      }
    }

    // 2. Unmute master gain back to 1.0
    if (this.masterGainNode && this.masterGainNode.context === ctx) {
      try {
        this.masterGainNode.gain.cancelScheduledValues(0);
        this.masterGainNode.gain.setValueAtTime(1.0, ctx.currentTime);
      } catch {}
    }

    // 3. Restart DAC keep-alive to keep the amplifier awake
    if (ctx.state === 'running') {
      this.startKeepAlive(ctx);
    }

    // 4. Restart BGM only if enabled, not already playing, and not currently starting
    if (this.bgmEnabled && !this.isBgmPlaying && !this.isStartingBgm && !this.bgmSource) {
      await this.startBgm();
    }
  }

  private attachAutoUnlockListeners() {
    if (this.unlockListenersAttached || typeof window === 'undefined') return;
    this.unlockListenersAttached = true;

    const gestureEvents = ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown'];
    const handleGesture = () => {
      if (this.isExternalNavActive || this.isHidden) return;
      this.resumeAudioPipeline();
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

    // Native Capacitor App lifecycle events
    try {
      const capApp = (window as any)?.Capacitor?.Plugins?.App;
      if (capApp && typeof capApp.addListener === 'function') {
        capApp.addListener('appStateChange', (state: { isActive: boolean }) => {
          this.handleVisibilityOrFocusChange(state.isActive);
        });
      }
    } catch {
      // ignore
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
    await this.resumeAudioPipeline();
    return !!this.ctx && this.ctx.state === 'running';
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
    this.handleVisibilityOrFocusChange(false);
  }

  public async restoreFromExternalNavigation(): Promise<boolean> {
    this.isExternalNavActive = false;
    this.handleVisibilityOrFocusChange(true);
    return true;
  }

  public async unlockAudio(): Promise<boolean> {
    return this.resumeAndRestoreAudio();
  }

  public initContext(): AudioContext | null {
    const ctx = this.getOrCreateContext();
    if (ctx && (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted')) {
      ctx.resume().catch(() => {});
    }
    return ctx;
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
    if (enabled) {
      this.resumeAudioPipeline();
    } else {
      this.stopKeepAlive();
    }
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
      this.stopAllBgmSources();
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

  private stopAllBgmSources() {
    this.activeBgmSources.forEach((src) => {
      try {
        src.onended = null;
        src.stop();
        src.disconnect();
      } catch {}
    });
    this.activeBgmSources.clear();
    this.bgmSource = null;
    this.isBgmPlaying = false;
    this.isStartingBgm = false;

    if (this.bgmGainNode && this.ctx) {
      try {
        this.bgmGainNode.gain.cancelScheduledValues(0);
        this.bgmGainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      } catch {}
    }
  }

  private async loadBgmBuffer(ctx: AudioContext): Promise<AudioBuffer | null> {
    if (this.bgmAudioBuffer) return this.bgmAudioBuffer;
    if (typeof window === 'undefined') return null;

    if (this.isLoadingBgm) {
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 100));
        if (this.bgmAudioBuffer) return this.bgmAudioBuffer;
        if (!this.isLoadingBgm) break;
      }
      if (this.bgmAudioBuffer) return this.bgmAudioBuffer;
    }

    this.isLoadingBgm = true;

    try {
      if (!this.rawBgmArrayBuffer) {
        const bgmUrl = new URL('assets/bgm_fantasy.mp3', window.location.href).href;
        const resp = await fetch(bgmUrl);
        this.rawBgmArrayBuffer = await resp.arrayBuffer();
      }
      // Pass a sliced copy so rawBgmArrayBuffer is never detached by decodeAudioData
      const copy = this.rawBgmArrayBuffer.slice(0);
      const decoded = await ctx.decodeAudioData(copy);
      this.bgmAudioBuffer = decoded;
      return decoded;
    } catch (err) {
      console.warn('[SoundEngine] Failed to load/decode BGM audio buffer:', err);
      return null;
    } finally {
      this.isLoadingBgm = false;
    }
  }

  /**
   * Pure Web Audio Game BGM (Strict Singleton, High-Fidelity & Zero Lock-Screen Media Widget)
   * Guaranteed to NEVER duplicate, overlap, or phase-distort!
   */
  public async startBgm() {
    if (!this.bgmEnabled || typeof window === 'undefined') {
      this.stopAllBgmSources();
      return;
    }
    if (this.isHidden || this.isExternalNavActive) {
      this.wasBgmPlayingBeforeHidden = true;
      return;
    }

    // Atomic Mutex: If already playing or currently starting, strictly reject duplicate requests
    if (this.isBgmPlaying || this.isStartingBgm || this.bgmSource) {
      return;
    }
    this.isStartingBgm = true;

    try {
      const ctx = this.getOrCreateContext();
      if (!ctx) return;

      if (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted') {
        try {
          await ctx.resume();
        } catch {}
      }

      let buffer = this.bgmAudioBuffer;
      if (!buffer) {
        buffer = await this.loadBgmBuffer(ctx);
      }

      // Re-verify conditions after asynchronous load (e.g. user might have toggled off BGM or backgrounded)
      if (!buffer || !this.bgmEnabled || this.isHidden || this.isExternalNavActive) {
        this.stopAllBgmSources();
        return;
      }

      // Stop and cleanly disconnect any previous source nodes to ensure 100% single audio stream
      this.stopAllBgmSources();

      if (!this.bgmGainNode || this.bgmGainNode.context !== ctx) {
        this.bgmGainNode = ctx.createGain();
        this.bgmGainNode.connect(this.getDestination(ctx));
      }
      this.bgmGainNode.gain.cancelScheduledValues(0);
      this.bgmGainNode.gain.setValueAtTime(MASTER_BGM_VOLUME, ctx.currentTime);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(this.bgmGainNode);

      source.onended = () => {
        this.activeBgmSources.delete(source);
        if (this.bgmSource === source) {
          this.bgmSource = null;
          this.isBgmPlaying = false;
        }
      };

      source.start(0);

      this.bgmSource = source;
      this.activeBgmSources.add(source);
      this.isBgmPlaying = true;
      this.wasBgmPlayingBeforeHidden = true;
    } catch (err) {
      console.warn('[SoundEngine] startBgm error:', err);
      this.stopAllBgmSources();
    } finally {
      this.isStartingBgm = false;
    }
  }

  public pauseBgm() {
    this.stopAllBgmSources();
  }

  public stopBgm() {
    this.wasBgmPlayingBeforeHidden = false;
    this.stopAllBgmSources();
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
      gain.connect(this.getDestination(ctx));
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
      gain.connect(this.getDestination(ctx));
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
        gain.connect(this.getDestination(ctx));
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
        gain.connect(this.getDestination(ctx));
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
        gain.connect(this.getDestination(ctx));
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
        gain.connect(this.getDestination(ctx));
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
      gain.connect(this.getDestination(ctx));
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
      gain.connect(this.getDestination(ctx));
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
      gain.connect(this.getDestination(ctx));
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
      gain.connect(this.getDestination(ctx));
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
      gain.connect(this.getDestination(ctx));
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
      gain.connect(this.getDestination(ctx));
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
      gain.connect(this.getDestination(ctx));
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
        gain.connect(this.getDestination(ctx));
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
        gain.connect(this.getDestination(ctx));
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
      gain.connect(this.getDestination(ctx));
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
        gain.connect(this.getDestination(ctx));
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
        gain.connect(this.getDestination(ctx));
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
      gain.connect(this.getDestination(ctx));
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
      gain.connect(this.getDestination(ctx));
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
        gain.connect(this.getDestination(ctx));
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
      gain.connect(this.getDestination(ctx));
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
      gain.connect(this.getDestination(ctx));
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
        gain.connect(this.getDestination(ctx));
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
      gain.connect(this.getDestination(ctx));
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
        gain.connect(this.getDestination(ctx));
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
      gain.connect(this.getDestination(ctx));
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
      gain.connect(this.getDestination(ctx));
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
        gain.connect(this.getDestination(ctx));
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
      gain.connect(this.getDestination(ctx));
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
        gain.connect(this.getDestination(ctx));
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
