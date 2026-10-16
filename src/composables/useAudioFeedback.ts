import { ref } from 'vue';
import {
  playSuccess as audioSuccess,
  isSoundEnabled,
  toggleSound as audioToggleSound,
} from '@/utils/audio';

const soundActive = ref(isSoundEnabled());

export function useAudioFeedback() {
  function triggerSuccess() {
    audioSuccess();
  }

  function toggle() {
    soundActive.value = audioToggleSound();
  }

  return {
    soundActive,
    triggerSuccess,
    toggle,
  };
}

