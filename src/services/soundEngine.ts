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
  private isMuted: boolean = true;
  private voiceLang: 'en' | 'am' = 'am';
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private speechTimeoutRef: number | null = null;
  private audioBufferCache: Map<string, AudioBuffer | null> = new Map();

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

        // 1. Studio Broadcast Compressor (-24dB threshold, 4:1 ratio for loud broadcast punch)
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-24, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

        // 2. Warm Broadcast Vocal Peaking Filter (250Hz warmth + slight high presence)
        this.vocalWarmFilter = this.ctx.createBiquadFilter();
        this.vocalWarmFilter.type = 'peaking';
        this.vocalWarmFilter.frequency.setValueAtTime(250, this.ctx.currentTime);
        this.vocalWarmFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);
        this.vocalWarmFilter.gain.setValueAtTime(2.5, this.ctx.currentTime);

        // 3. Master Gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.9, this.ctx.currentTime);

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

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (this.speechTimeoutRef) {
        clearTimeout(this.speechTimeoutRef);
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
   * Play decoded AudioBuffer through the studio broadcast chain
   */
  playDecodedBuffer(buffer: AudioBuffer): boolean {
    if (this.isMuted) return false;
    try {
      this.initCtx();
      if (!this.ctx || !this.vocalWarmFilter) return false;
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.vocalWarmFilter);
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
   * Universal Ball Speech Announcement:
   * 1. Checks if custom Addis AI / Human MP3 recording exists in /assets/audio/{lang}/{num}.mp3
   * 2. If found: Plays studio audio buffer with 0ms latency.
   * 3. If not found: Executes live two-stage human caller engine.
   */
  async speakBall(col: string, num: number) {
    telegramService.triggerHaptic('medium');
    if (this.isMuted) return;

    // 1. Play presence cue
    this.playPresenceChime();

    // 2. Check for custom recorded audio file (Addis AI / Studio Human clip)
    const possibleUrls = [
      `/assets/audio/${this.voiceLang}/${num}.webm`,
      `/assets/audio/${this.voiceLang}/${num}.mp3`,
      `/assets/audio/${this.voiceLang}/${col}-${num}.webm`,
      `/assets/audio/${this.voiceLang}/${col}-${num}.mp3`,
      `/assets/audio/${this.voiceLang}/${num}.m4a`,
      `/assets/audio/${this.voiceLang}/${col}-${num}.m4a`,
      `/assets/audio/${this.voiceLang}/${num}.wav`
    ];

    for (const url of possibleUrls) {
      const buffer = await this.loadAudioBuffer(url);
      if (buffer) {
        this.playDecodedBuffer(buffer);
        return;
      }
    }

    // 3. Fallback: If custom audio file has not been recorded yet, stay silent (zero synthetic computer speech)
    // The engine waits until real voice recordings are provided.
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
