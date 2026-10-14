/**
 * Native Web Audio API Synthesizer
 * Zero external audio assets needed. Completely offline-capable.
 */

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

// Initialize sound state from localStorage
try {
  const saved = localStorage.getItem('uangku_sound_enabled');
  if (saved !== null) {
    soundEnabled = saved === 'true';
  }
} catch {
  soundEnabled = true;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function setSoundEnabled(val: boolean): void {
  soundEnabled = val;
  try {
    localStorage.setItem('uangku_sound_enabled', String(val));
  } catch {
    // Ignore localStorage errors
  }
}

export function toggleSound(): boolean {
  setSoundEnabled(!soundEnabled);
  if (soundEnabled) {
    playSuccess();
  }
  return soundEnabled;
}

/**
 * Keypress click sound for numpad & buttons
 * Crisp, subtle sine click (750Hz -> 300Hz in 25ms)
 */
export function playKeypress(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.025);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.025);
  } catch (err) {
    console.debug('Audio keypress error:', err);
  }
}

/**
 * Success chime for logging transactions
 * Arpeggiated C-major triad (C5 -> E5 -> G5) with gentle decay
 */
export function playSuccess(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const notes = [
      { freq: 523.25, time: 0 },    // C5
      { freq: 659.25, time: 0.05 }, // E5
      { freq: 783.99, time: 0.10 }, // G5
    ];

    const startTime = ctx.currentTime;

    notes.forEach(({ freq, time }) => {
      const noteTime = startTime + time;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.15, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.28);
    });
  } catch (err) {
    console.debug('Audio success error:', err);
  }
}

/**
 * Distinguishable Delete / Remove sound effect
 * Two-stage descending acoustic cue:
 * 1. Crisp initial warning tap (520Hz -> 420Hz, 50ms)
 * 2. Deep falling discard swoop (340Hz -> 75Hz over 180ms)
 */
export function playDelete(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Stage 1: Crisp high-mid tap
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(520, now);
    osc1.frequency.exponentialRampToValueAtTime(420, now + 0.05);

    gain1.gain.setValueAtTime(0.16, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.05);

    // Stage 2: Deep falling discard swoop
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'sine';
    const swoopStart = now + 0.045;
    const swoopDuration = 0.18;

    osc2.frequency.setValueAtTime(340, swoopStart);
    osc2.frequency.exponentialRampToValueAtTime(75, swoopStart + swoopDuration);

    gain2.gain.setValueAtTime(0.18, swoopStart);
    gain2.gain.exponentialRampToValueAtTime(0.001, swoopStart + swoopDuration);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(swoopStart);
    osc2.stop(swoopStart + swoopDuration);
  } catch (err) {
    console.debug('Audio delete error:', err);
  }
}
