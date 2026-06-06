// Web Audio API Sound Synthesizer Manager
// Provides lightweight, clean, zero-dependency sound effects for gameplay.

class SoundManager {
  private ctx: AudioContext | null = null;

  // Lazy initialize AudioContext on user interaction
  private init() {
    if (!this.ctx) {
      // Support standard and older browsers
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    // Resume context if suspended (browser security policy)
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Helper to create oscillator
  private playTone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainValue: number = 0.1,
    delay: number = 0
  ) {
    const ctx = this.init();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, ctx.currentTime + delay);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + delay + duration);
    }

    gainNode.gain.setValueAtTime(gainValue, ctx.currentTime + delay);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  }

  // 1. Cleary Click sound (UI Buttons)
  playClick() {
    try {
      this.playTone(800, 1200, 0.08, 'sine', 0.08);
    } catch (e) {
      console.warn('Audio click play failed', e);
    }
  }

  // 2. Launch Attack sound
  playAttack() {
    try {
      this.playTone(150, 450, 0.15, 'triangle', 0.15);
    } catch (e) {
      console.warn('Audio attack play failed', e);
    }
  }

  // 3. Defend Success sound (metal/shield clang)
  playDefend() {
    try {
      // Layer two frequencies to make a metallic bell-like chime
      this.playTone(600, 600, 0.25, 'sine', 0.1);
      this.playTone(950, 950, 0.25, 'sine', 0.06, 0.002);
    } catch (e) {
      console.warn('Audio defend play failed', e);
    }
  }

  // 4. Hit Take Damage sound (thud/low impact)
  playHit() {
    try {
      this.playTone(180, 50, 0.2, 'sawtooth', 0.2);
    } catch (e) {
      console.warn('Audio hit play failed', e);
    }
  }

  // 5. Heal sound (sparkling rising chime)
  playHeal() {
    try {
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
      notes.forEach((freq, index) => {
        this.playTone(freq, freq * 1.05, 0.25, 'sine', 0.08, index * 0.06);
      });
    } catch (e) {
      console.warn('Audio heal play failed', e);
    }
  }

  // 6. Level Up sound (shiny rising chime)
  playLevelUp() {
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        this.playTone(freq, freq * 1.02, 0.35, 'sine', 0.08, index * 0.07);
      });
      // Add a sparkly triangle wave layer
      setTimeout(() => {
        this.playTone(1046.50, 1567.98, 0.4, 'triangle', 0.05);
      }, 210);
    } catch (e) {
      console.warn('Audio level up play failed', e);
    }
  }

  // 7. Victory fanfare (Major key triumph)
  playVictory() {
    try {
      const notes = [
        { f: 523.25, d: 0.15 }, // C5
        { f: 523.25, d: 0.15 }, // C5
        { f: 523.25, d: 0.15 }, // C5
        { f: 659.25, d: 0.30 }, // E5
        { f: 587.33, d: 0.15 }, // D5
        { f: 659.25, d: 0.15 }, // E5
        { f: 783.99, d: 0.60 }  // G5 (Long triumph note)
      ];
      let delay = 0;
      notes.forEach((note) => {
        this.playTone(note.f, note.f, note.d + 0.1, 'sine', 0.1, delay);
        this.playTone(note.f * 1.5, note.f * 1.5, note.d + 0.1, 'triangle', 0.03, delay);
        delay += note.d;
      });
    } catch (e) {
      console.warn('Audio victory play failed', e);
    }
  }

  // 8. Defeat sound (Sad descending minor sound)
  playDefeat() {
    try {
      const notes = [
        { f: 392.00, d: 0.25 }, // G4
        { f: 349.23, d: 0.25 }, // F4
        { f: 311.13, d: 0.25 }, // Eb4 (Minor 3rd)
        { f: 293.66, d: 0.50 }  // D4 (Sorrow resolve)
      ];
      let delay = 0;
      notes.forEach((note) => {
        this.playTone(note.f, note.f - 10, note.d + 0.15, 'sawtooth', 0.08, delay);
        delay += note.d;
      });
    } catch (e) {
      console.warn('Audio defeat play failed', e);
    }
  }

  // 9. Defeat opponent fly-out sound (rising whistle and impact pop)
  playFlyOut() {
    try {
      // Rising slide
      this.playTone(150, 1200, 0.8, 'sine', 0.12);
      // Sparkly slide
      this.playTone(300, 1800, 0.8, 'triangle', 0.04);
    } catch (e) {
      console.warn('Audio fly out play failed', e);
    }
  }
}

export const soundManager = new SoundManager();
