import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isSoundEnabled, setSoundEnabled, toggleSound, playSuccess } from './audio';
import { useAudioFeedback } from '@/composables/useAudioFeedback';

const storage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, val: string) => {
    storage[key] = val;
  },
  removeItem: (key: string) => {
    delete storage[key];
  },
  clear: () => {
    for (const key of Object.keys(storage)) {
      delete storage[key];
    }
  },
};

globalThis.localStorage = localStorageMock as unknown as Storage;

describe('Audio Synthesizer & Feedback', () => {
  beforeEach(() => {
    localStorage.clear();
    setSoundEnabled(true);
    vi.restoreAllMocks();
  });

  it('manages sound enabled state', () => {
    expect(isSoundEnabled()).toBe(true);
    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
    expect(localStorage.getItem('uangku_sound_enabled')).toBe('false');

    setSoundEnabled(true);
    expect(isSoundEnabled()).toBe(true);
    expect(localStorage.getItem('uangku_sound_enabled')).toBe('true');
  });

  it('toggles sound enabled state', () => {
    setSoundEnabled(true);
    const toggled1 = toggleSound();
    expect(toggled1).toBe(false);
    expect(isSoundEnabled()).toBe(false);

    const toggled2 = toggleSound();
    expect(toggled2).toBe(true);
    expect(isSoundEnabled()).toBe(true);
  });

  it('only exports playSuccess for sound playback', async () => {
    const audioModule = await import('./audio');
    expect(typeof audioModule.playSuccess).toBe('function');
    expect((audioModule as Record<string, unknown>).playKeypress).toBeUndefined();
    expect((audioModule as Record<string, unknown>).playDelete).toBeUndefined();
  });

  it('provides useAudioFeedback composable with only success and toggle controls', () => {
    const feedback = useAudioFeedback();
    expect(feedback.soundActive).toBeDefined();
    expect(typeof feedback.triggerSuccess).toBe('function');
    expect(typeof feedback.toggle).toBe('function');
    expect((feedback as Record<string, unknown>).triggerKeypress).toBeUndefined();
    expect((feedback as Record<string, unknown>).triggerDelete).toBeUndefined();
  });

  it('safely handles playSuccess when sound is disabled or AudioContext is absent', () => {
    setSoundEnabled(false);
    expect(() => playSuccess()).not.toThrow();

    setSoundEnabled(true);
    expect(() => playSuccess()).not.toThrow();
  });
});
