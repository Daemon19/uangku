<script setup lang="ts">
import { ref } from 'vue';
import type { PaymentType } from '@/db/types';
import SpeedNumpad from './SpeedNumpad.vue';
import SmartParserInput from './SmartParserInput.vue';
import { LayoutGrid, Sparkles } from 'lucide-vue-next';

type InputMode = 'numpad' | 'nlp';

const emit = defineEmits<{
  (e: 'log-expense', payload: {
    amount: number;
    category: string;
    type: PaymentType;
    note?: string;
  }): void;
  (e: 'toast', message: string, type?: 'info' | 'warning' | 'success'): void;
}>();

const currentMode = ref<InputMode>('numpad');
</script>

<template>
  <div class="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-30">
    <!-- Mode Switcher Tabs Bar -->
    <div class="px-3 pt-1 flex justify-center pointer-events-none">
      <div class="bg-sand-card/95 backdrop-blur-md p-1 rounded-2xl border border-sand-border/80 shadow-lifted flex items-center gap-1 pointer-events-auto">
        <button
          type="button"
          @click="currentMode = 'numpad'"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all btn-tactile',
            currentMode === 'numpad'
              ? 'bg-matcha-deep text-white shadow-sm'
              : 'text-stone-warm hover:text-stone-dark'
          ]"
        >
          <LayoutGrid :size="13" />
          <span>Mode Cepat (Numpad)</span>
        </button>

        <button
          type="button"
          @click="currentMode = 'nlp'"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all btn-tactile',
            currentMode === 'nlp'
              ? 'bg-matcha-deep text-white shadow-sm'
              : 'text-stone-warm hover:text-stone-dark'
          ]"
        >
          <Sparkles :size="13" class="text-amber-warm" />
          <span>Input Pintar (Teks)</span>
        </button>
      </div>
    </div>

    <!-- Active Input Mode Component -->
    <div class="mt-1">
      <SpeedNumpad
        v-if="currentMode === 'numpad'"
        @log-expense="emit('log-expense', $event)"
        @toast="(msg, type) => emit('toast', msg, type)"
      />
      <SmartParserInput
        v-else
        @log-expense="emit('log-expense', $event)"
        @toast="(msg, type) => emit('toast', msg, type)"
      />
    </div>
  </div>
</template>
