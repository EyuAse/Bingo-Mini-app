import {
  getHumanCallParts,
  gamePhrases
} from './amharicVoice.ts';
import { telegramService } from './telegramService.ts';

/**
 * Web Audio API Broadcast Master & Dynamic Audio Sound Pack Engine
 * Features:
 * - Dynamic Audio Sound Pack Loader (Plays real Addis AI / human MP3 recordings when placed in /assets/audio/)
 * - In-memory AudioBuffer Cache with 0ms playback latency
 * - Studio Broadcast Filter Chain: Warm PA Equalizer + Studio Dynamic Compressor
 * - Two-Stage Live Human Caller Cadence ("Letter... 220ms Pause... Number!")
 * - Automatic SpeechSynthesis fallback if custom audio file is missing
 */

class AudioEngineService {
  private ctx: AudioContext | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private vocalWarmFilter: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private voiceLang: 'en' | 'am' = 'am';
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private speechTimeoutRef: number | null = null;
  private audioBufferCache: Map<string, AudioBuffer | null> = new Map();
  private currentVoiceAudio: HTMLAudioElement | null = null;
  private preloadedAudios: Map<number, HTMLAudioElement> = new Map();
  private voiceBufferMap: Map<number, AudioBuffer> = new Map();
  private isAudioUnlocked: boolean = false;

  constructor() {
    this.initVoices();
  }

  private initVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        // 1. Gentle Transparent Limiter (clean dynamics without harsh radio pumping)
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(40, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(2.5, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.01, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

        // 2. Pure Natural Filter (flat 0dB gain for 100% natural, uncolored audio clarity)
        this.vocalWarmFilter = this.ctx.createBiquadFilter();
        this.vocalWarmFilter.type = 'peaking';
        this.vocalWarmFilter.frequency.setValueAtTime(1000, this.ctx.currentTime);
        this.vocalWarmFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);
        this.vocalWarmFilter.gain.setValueAtTime(0.0, this.ctx.currentTime);

        // 3. Master Gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

        // Connect Chain: Source -> Filter -> Compressor -> MasterGain -> Destination
        this.vocalWarmFilter.connect(this.compressor);
        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public resumeAudioContext() {
    try {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch {}
  }

  public unlockAudio() {
    this.isAudioUnlocked = true;
    try {
      this.initCtx();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      if (this.ctx) {
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);
      }
    } catch {}

    if (this.preloadedAudios.size > 0) {
      for (const audio of this.preloadedAudios.values()) {
        try {
          audio.load();
        } catch {}
      }
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        if (this.speechTimeoutRef) {
          clearTimeout(this.speechTimeoutRef);
        }
      }
      if (this.currentVoiceAudio) {
        try {
          this.currentVoiceAudio.pause();
        } catch {}
      }
    }
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  setVoiceLang(lang: 'en' | 'am') {
    this.voiceLang = lang;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (this.speechTimeoutRef) {
        clearTimeout(this.speechTimeoutRef);
      }
    }
  }

  getVoiceLang(): 'en' | 'am' {
    return this.voiceLang;
  }

  private getNativeAmharicVoice(): SpeechSynthesisVoice | null {
    if (this.cachedVoices.length === 0 && 'speechSynthesis' in window) {
      this.cachedVoices = window.speechSynthesis.getVoices();
    }
    return (
      this.cachedVoices.find(
        v =>
          v.lang.toLowerCase().startsWith('am') ||
          v.name.toLowerCase().includes('amharic') ||
          v.name.toLowerCase().includes('ethiopia')
      ) || null
    );
  }

  private getEnglishVoice(): SpeechSynthesisVoice | null {
    if (this.cachedVoices.length === 0 && 'speechSynthesis' in window) {
      this.cachedVoices = window.speechSynthesis.getVoices();
    }
    return (
      this.cachedVoices.find(
        v =>
          v.lang.toLowerCase().startsWith('en-us') ||
          v.lang.toLowerCase().startsWith('en-gb') ||
          v.lang.toLowerCase().startsWith('en')
      ) || null
    );
  }

  /**
   * Preload audio file into in-memory AudioBuffer
   */
  async loadAudioBuffer(url: string): Promise<AudioBuffer | null> {
    if (this.audioBufferCache.has(url)) {
      return this.audioBufferCache.get(url) || null;
    }
    try {
      this.initCtx();
      if (!this.ctx) return null;
      const res = await fetch(url);
      if (!res.ok) {
        this.audioBufferCache.set(url, null);
        return null;
      }
      const arrayBuffer = await res.arrayBuffer();
      const decoded = await this.ctx.decodeAudioData(arrayBuffer);
      this.audioBufferCache.set(url, decoded);
      return decoded;
    } catch {
      this.audioBufferCache.set(url, null);
      return null;
    }
  }

  /**
   * Play decoded AudioBuffer.
   * When isVoice is true, bypasses artificial radio filters for 100% natural, crisp voice clarity.
   */
  playDecodedBuffer(buffer: AudioBuffer, isVoice: boolean = true): boolean {
    if (this.isMuted) return false;
    try {
      this.initCtx();
      if (!this.ctx || !this.masterGain) return false;
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      if (isVoice) {
        // Direct high-fidelity clean routing (eliminates radio/megaphone effect)
        source.connect(this.masterGain);
      } else if (this.vocalWarmFilter) {
        source.connect(this.vocalWarmFilter);
      } else {
        source.connect(this.masterGain);
      }
      source.start();
      return true;
    } catch {
      return false;
    }
  }

  // Loud & Clear Ball Pop
  playPop() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.vocalWarmFilter) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.vocalWarmFilter);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch {
      // Fallback
    }
  }

  // Broadcast Hall PA Cue Chime
  playPresenceChime() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.vocalWarmFilter) return;
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(659.25, now);
      osc2.frequency.setValueAtTime(1318.5, now);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.vocalWarmFilter);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.09);
      osc2.stop(now + 0.09);
    } catch {
      // Fallback
    }
  }

  // Loud & Clear Daub Chime
  playDaub() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.vocalWarmFilter) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime);
      osc.frequency.setValueAtTime(880.0, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.vocalWarmFilter);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch {
      // Fallback
    }
  }

  // Lucky Pick Power-Up Arpeggio
  playLuckyPick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.vocalWarmFilter) return;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.vocalWarmFilter) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const startTime = this.ctx.currentTime + idx * 0.07;
        gain.gain.setValueAtTime(0.5, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
        osc.connect(gain);
        gain.connect(this.vocalWarmFilter);
        osc.start(startTime);
        osc.stop(startTime + 0.15);
      });
    } catch {
      // Fallback
    }
  }

  // Fanfare Celebration on Bingo Win
  playFanfare() {
    telegramService.triggerHaptic('success');
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx || !this.vocalWarmFilter) return;
      const chords = [
        { freq: [523.25, 659.25, 783.99], t: 0 },
        { freq: [587.33, 739.99, 880.0], t: 0.18 },
        { freq: [659.25, 830.61, 987.77], t: 0.36 },
        { freq: [783.99, 987.77, 1174.66, 1567.98], t: 0.54 }
      ];

      chords.forEach(chord => {
        chord.freq.forEach(freq => {
          if (!this.ctx || !this.vocalWarmFilter) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          const startTime = this.ctx.currentTime + chord.t;
          gain.gain.setValueAtTime(0.45, startTime);
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.7);
          osc.connect(gain);
          gain.connect(this.vocalWarmFilter);
          osc.start(startTime);
          osc.stop(startTime + 0.7);
        });
      });
    } catch {
      // Fallback
    }
  }

  playWinFanfare() {
    this.playFanfare();
  }

  /**
   * High-reliability HTML5 Audio playback for mobile and desktop
   */
  async playAudioDirect(url: string): Promise<boolean> {
    if (this.isMuted) return false;

    return new Promise<boolean>((resolve) => {
      try {
        if (typeof window === 'undefined' || typeof Audio === 'undefined') {
          return resolve(false);
        }

        if (this.currentVoiceAudio) {
          try {
            this.currentVoiceAudio.pause();
            this.currentVoiceAudio.currentTime = 0;
          } catch {}
        }

        const audio = new Audio(url);
        audio.volume = 1.0;
        audio.preload = 'auto';
        this.currentVoiceAudio = audio;

        let handled = false;
        const finish = (success: boolean) => {
          if (!handled) {
            handled = true;
            resolve(success);
          }
        };

        audio.onended = () => finish(true);
        audio.onerror = () => finish(false);

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              finish(true);
            })
            .catch(() => {
              finish(false);
            });
        }
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Pre-warms and caches voice files into both Web Audio RAM (AudioBuffer)
   * and HTML5 Audio elements for 100% universal cross-device playback (PC & mobile).
   * Supports Column B (1–15), Column I (16–30), Column N (31–45), and Column G (46–60).
   */
  async preloadVoicePack(column: string = 'ALL', count: number = 60) {
    if (typeof window === 'undefined') return;

    for (let i = 1; i <= count; i++) {
      // 1. Preload HTML5 Audio (Universal MP3 with WAV/WebM fallback)
      if (!this.preloadedAudios.has(i) && typeof Audio !== 'undefined') {
        try {
          const audio = new Audio(`/assets/audio/am/${i}.mp3`);
          audio.preload = 'auto';
          audio.volume = 1.0;
          this.preloadedAudios.set(i, audio);
        } catch {}
      }

      // 2. Decode into in-memory Web Audio AudioBuffer (0ms instant hardware playback)
      if (!this.voiceBufferMap.has(i)) {
        try {
          const urls = [
            `/assets/audio/am/${i}.mp3`,
            `/assets/audio/am/${i}.wav`,
            `/assets/audio/am/${i}.webm`
          ];
          for (const url of urls) {
            const buf = await this.loadAudioBuffer(url);
            if (buf) {
              this.voiceBufferMap.set(i, buf);
              break;
            }
          }
        } catch {}
      }
    }
  }

  /**
   * Human Voice Announcement for Column B (1–15), Column I (16–30), Column N (31–45), and Column G (46–60):
   * - Columns B, I, N, G (1–60): Plays real human voice directly with crystal-clear studio audio.
   * - Column O (61–75): Strictly silent as per design specification until recorded.
   */
  async speakBall(col: string, num: number) {
    telegramService.triggerHaptic('medium');
    if (this.isMuted) return;

    // Strict Voice Policy: Real human recordings exist for Column B (1–15), Column I (16–30), Column N (31–45), and Column G (46–60).
    // For unrecorded column O (61–75), remain completely silent with 0 network calls.
    const isSupportedCol =
      col?.toUpperCase() === 'B' ||
      col?.toUpperCase() === 'I' ||
      col?.toUpperCase() === 'N' ||
      col?.toUpperCase() === 'G' ||
      (num >= 1 && num <= 60);

    if (!isSupportedCol || num < 1 || num > 60) {
      return;
    }

    // Ensure audio context is running if user interacted
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    // Tier 1: Direct Native Hardware Audio (100% pure human voice, zero radio/filter coloration)
    const preloaded = this.preloadedAudios.get(num);
    if (preloaded) {
      try {
        if (this.currentVoiceAudio && this.currentVoiceAudio !== preloaded) {
          try {
            this.currentVoiceAudio.pause();
            this.currentVoiceAudio.currentTime = 0;
          } catch {}
        }
        this.currentVoiceAudio = preloaded;
        preloaded.currentTime = 0;
        preloaded.volume = 1.0;
        const playPromise = preloaded.play();
        if (playPromise !== undefined) {
          await playPromise;
          return;
        }
        return;
      } catch {
        // Fall through to Tier 2 on browser restriction
      }
    }

    // Tier 2: Direct fresh HTML5 Audio instance (guaranteed native hardware DAC playback)
    const directPlayed = await this.playAudioDirect(`/assets/audio/am/${num}.mp3`);
    if (directPlayed) return;

    // Tier 3: In-memory Web Audio Buffer directly connected to hardware destination (bypassing all filters)
    const cachedBuffer = this.voiceBufferMap.get(num);
    if (cachedBuffer) {
      try {
        this.initCtx();
        if (this.ctx) {
          const source = this.ctx.createBufferSource();
          source.buffer = cachedBuffer;
          // Direct bypass to destination: zero compression, zero EQ
          source.connect(this.ctx.destination);
          source.start();
          return;
        }
      } catch {}
    }
  }

  /**
   * Energetic Live Game Event Shouts:
   * 1. Checks for /assets/audio/{lang}/{phraseKey}.mp3/.webm/.wav/.m4a
   * 2. If recorded file exists: Plays audio buffer
   * 3. If not recorded yet: Stays silent (zero synthetic voice)
   */
  async speakPhrase(phraseKey: 'start' | 'solo_win' | 'split_win' | 'opp_win' | 'one_to_go') {
    if (this.isMuted) return;

    const possibleUrls = [
      `/assets/audio/${this.voiceLang}/${phraseKey}.webm`,
      `/assets/audio/${this.voiceLang}/${phraseKey}.mp3`,
      `/assets/audio/${this.voiceLang}/${phraseKey}.m4a`,
      `/assets/audio/${this.voiceLang}/${phraseKey}.wav`
    ];

    for (const customUrl of possibleUrls) {
      const buffer = await this.loadAudioBuffer(customUrl);
      if (buffer) {
        this.playDecodedBuffer(buffer);
        return;
      }
    }
  }
}

export const soundEngine = new AudioEngineService();
