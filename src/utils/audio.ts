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
 * Success chime for logging transactions
 * Arpeggiated C-major triad (C5 -> E5 -> G5) with fuller volume and gentle decay
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
    const duration = 0.32;

    notes.forEach(({ freq, time }) => {
      const noteTime = startTime + time;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.35, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + duration);
    });
  } catch (err) {
    console.debug('Audio success error:', err);
  }
}

