import { ref } from 'vue';
import {
  playKeypress as audioKeypress,
  playSuccess as audioSuccess,
  playDelete as audioDelete,
  isSoundEnabled,
  toggleSound as audioToggleSound,
} from '@/utils/audio';

const soundActive = ref(isSoundEnabled());

export function useAudioFeedback() {
  function triggerKeypress() {
    audioKeypress();
  }

  function triggerSuccess() {
    audioSuccess();
  }

  function triggerDelete() {
    audioDelete();
  }

  function toggle() {
    soundActive.value = audioToggleSound();
  }

  return {
    soundActive,
    triggerKeypress,
    triggerSuccess,
    triggerDelete,
    toggle,
  };
}
