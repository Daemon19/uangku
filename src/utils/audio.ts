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

let keypressBuffer: AudioBuffer | null = null;
let activeBufferSource: AudioBufferSourceNode | null = null;

/**
 * Pre-synthesized tactile keypress AudioBuffer (16ms)
 * Combines a crisp 1,900Hz snap (phone speaker sweet spot) with a warm 600Hz body.
 * Generated purely in-memory via deterministic PCM calculations.
 */
function getKeypressBuffer(ctx: AudioContext): AudioBuffer {
  if (keypressBuffer && keypressBuffer.sampleRate === ctx.sampleRate) {
    return keypressBuffer;
  }

  const sampleRate = ctx.sampleRate;
  const duration = 0.016; // 16 milliseconds
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, numSamples, sampleRate);
  const channel = buffer.getChannelData(0);

  const attackSamples = Math.floor(sampleRate * 0.0012); // 1.2ms micro-attack
  const peakAmp = 0.20; // Calibrated peak gain (gentle on laptops, clear on phones)

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Linear attack (0 to peakAmp) over 1.2ms, followed by exponential decay
    let env: number;
    if (i < attackSamples) {
      env = (i / attackSamples) * peakAmp;
    } else {
      env = peakAmp * Math.exp(-(t - 0.0012) / 0.0035);
    }

    // Dual-tone presence: 70% 1,900Hz (phone resonance sweet-spot) + 30% 600Hz (warm laptop body)
    const wave = 0.70 * Math.sin(2 * Math.PI * 1900 * t) + 0.30 * Math.sin(2 * Math.PI * 600 * t);
    channel[i] = env * wave;
  }

  keypressBuffer = buffer;
  return buffer;
}

/**
 * Keypress click sound for numpad & buttons
 * 100% sample-identical playback using pre-synthesized PCM AudioBuffer.
 * Zero pitch variation, zero phase jitter, and equalized volume across devices.
 */
export function playKeypress(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Stop previous buffer source immediately to eliminate rapid-tap phase interference
    if (activeBufferSource) {
      try {
        activeBufferSource.stop(now);
        activeBufferSource.disconnect();
      } catch {
        // Ignore if already stopped
      }
    }

    const buffer = getKeypressBuffer(ctx);
    const source = ctx.createBufferSource();
    activeBufferSource = source;

    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(now);

    source.onended = () => {
      if (activeBufferSource === source) {
        activeBufferSource = null;
      }
    };
  } catch (err) {
    console.debug('Audio keypress error:', err);
  }
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

/**
 * Distinguishable Delete / Remove sound effect
 * Two-stage descending acoustic cue:
 * 1. Crisp initial warning tap (520Hz -> 420Hz, 50ms)
 * 2. Deep falling discard swoop (360Hz -> 80Hz over 180ms)
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

    gain1.gain.setValueAtTime(0.38, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.05);

    // Stage 2: Deep falling discard swoop with audible harmonics
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'triangle';
    const swoopStart = now + 0.045;
    const swoopDuration = 0.18;

    osc2.frequency.setValueAtTime(360, swoopStart);
    osc2.frequency.exponentialRampToValueAtTime(80, swoopStart + swoopDuration);

    gain2.gain.setValueAtTime(0.40, swoopStart);
    gain2.gain.exponentialRampToValueAtTime(0.001, swoopStart + swoopDuration);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(swoopStart);
    osc2.stop(swoopStart + swoopDuration);
  } catch (err) {
    console.debug('Audio delete error:', err);
  }
}
