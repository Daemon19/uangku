<script setup lang="ts">
import { ref } from 'vue';
import type { PaymentType } from '@/db/types';
import SpeedNumpad from './SpeedNumpad.vue';
import SmartParserInput from './SmartParserInput.vue';
import { LayoutGrid, Sparkles, X } from 'lucide-vue-next';

type InputMode = 'numpad' | 'nlp';

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
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
  <Transition name="sheet-backdrop">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40 flex flex-col justify-end items-center bg-black/45"
      @click="emit('close')"
    >
      <!-- Bottom Sheet: spans only needed height, clicks inside do not close -->
      <div
        class="sheet-pane w-full max-w-md bg-sand-card rounded-t-3xl shadow-xl border-t border-sand-border/70 overflow-hidden flex flex-col max-h-[94vh]"
        style="transform: translateZ(0); will-change: transform;"
        @click.stop
      >
        <!-- Sheet Handle & Mode Switcher Bar -->
        <div class="pt-2 pb-1.5 px-3.5 flex items-center justify-between bg-sand-card border-b border-sand-border/40 shrink-0">
          <!-- Grab Handle (visual cue) -->
          <div class="w-7">
            <div class="w-7 h-1 bg-stone-300 rounded-full"></div>
          </div>

          <!-- Mode Switcher Tabs -->
          <div class="bg-sand-surface p-0.5 rounded-xl border border-sand-border/80 shadow-xs flex items-center gap-0.5">
            <button
              type="button"
              @click="currentMode = 'numpad'"
              :class="[
                'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all btn-tactile',
                currentMode === 'numpad'
                  ? 'bg-matcha-deep text-white shadow-sm'
                  : 'text-stone-warm hover:text-stone-dark'
              ]"
            >
              <LayoutGrid :size="13" />
              <span>Mode Cepat</span>
            </button>

            <button
              type="button"
              @click="currentMode = 'nlp'"
              :class="[
                'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all btn-tactile',
                currentMode === 'nlp'
                  ? 'bg-matcha-deep text-white shadow-sm'
                  : 'text-stone-warm hover:text-stone-dark'
              ]"
            >
              <Sparkles :size="13" class="text-amber-warm" />
              <span>Input Pintar</span>
            </button>
          </div>

          <!-- Close Button (X matching reference) -->
          <button
            type="button"
            @click="emit('close')"
            class="w-7 h-7 rounded-full bg-sand-surface hover:bg-sand-border/60 text-stone-warm hover:text-stone-dark flex items-center justify-center transition-all btn-tactile"
            title="Tutup"
            aria-label="Tutup"
          >
            <X :size="16" />
          </button>
        </div>

        <!-- Active Input Mode Component (Height hugs content) -->
        <div class="overflow-y-auto overscroll-contain">
          <SpeedNumpad
            v-if="currentMode === 'numpad'"
            :is-open="isOpen"
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
    </div>
  </Transition>
</template>

