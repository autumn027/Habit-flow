/**
 * Robust Web Audio API Synthesizer for HabitFlow
 * Generates tactile, lightweight, and modern sound effects programmatically.
 * This guarantees pristine audio feedback immediately without requiring external .mp3 file loads.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private volumeLevel: number = 0.35; // Default low, non-intrusive level (0.3 - 0.5)
  private isMuted: boolean = false;

  private initContext() {
    if (this.isMuted) return null;
    if (!this.ctx) {
      // Establish standard AudioContext compatible with older browsers
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    // Resume context if suspended (common browser security constraint)
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Set master volume level (0.0 to 1.0)
   */
  public setVolume(level: number) {
    this.volumeLevel = Math.max(0, Math.min(1, level));
  }

  /**
   * Set muted status
   */
  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  /**
   * Get muted status
   */
  public getMuted() {
    return this.isMuted;
  }

  /**
   * Synthesizes an upbeat, shiny ascending major chord arpeggio ending on a brilliant flourish
   * Ideal for level-ups/milestones.
   */
  public playLevelUpSound() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Energetic level-up arpeggio nodes: C5 (523 Hz), E5 (659 Hz), G5 (784 Hz), C6 (1046 Hz), E6 (1318 Hz)
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      const spacing = 0.082;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        const startTime = now + (idx * spacing);

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        // Exponential decay envelope
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(this.volumeLevel * 0.45, startTime + 0.03);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.55);

        osc.start(startTime);
        osc.stop(startTime + 0.6);
      });
    } catch (e) {
      console.warn("Audio level up sound failure", e);
    }
  }

  /**
   * Synthesizes a high-frequency, elastic tactile "pop" sound
   * Ideal for individual task checks.
   */
  public playCheckPop() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      const now = ctx.currentTime;

      // Frequency Sweep for an elastic, crisp pop feel
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.06);

      // Amplitude Envelope to decay rapidly (silently)
      gainNode.gain.setValueAtTime(this.volumeLevel * 0.4, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {
      console.warn("Audio feedback play failure", e);
    }
  }

  /**
   * Synthesizes a beautiful, glowing C-major pentatonic arpeggio chime
   * Celebrates reaching the 100% daily task target.
   */
  public playSuccessChime() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Arpeggio notes: C5 (523.25 Hz), E5 (659.25 Hz), G5 (783.99 Hz), C6 (1046.50 Hz)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      const spacing = 0.095; // Staggered entry

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        const startTime = now + (idx * spacing);

        // Soft, round triangle waveform for a warm bell-like tone
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        // Low-pass filter to subtract harsh high frequencies
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, startTime);

        // Exponential decay envelope
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(this.volumeLevel * 0.35, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.65);

        osc.start(startTime);
        osc.stop(startTime + 0.7);
      });
    } catch (e) {
      console.warn("Audio success chime failure", e);
    }
  }

  /**
   * Synthesizes a low-frequency, dull, damp "bong" sound.
   * Provides negative tactile feedback for unchecking a task.
   */
  public playUncheckBong() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      const now = ctx.currentTime;

      // Heavy dull tone (triangle with descending pitch)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.25);

      // Low pass filter to make it dull/muffled
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, now);
      filter.frequency.exponentialRampToValueAtTime(80, now + 0.25);

      // Amplitude Envelope
      gainNode.gain.setValueAtTime(this.volumeLevel * 0.45, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch (e) {
      console.warn("Audio uncheck sound failure", e);
    }
  }
}

export const audioEngine = new AudioEngine();
