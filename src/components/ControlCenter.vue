<script setup lang="ts">
import { ref } from 'vue';
import type { PaymentType } from '@/db/types';
import SpeedNumpad from './SpeedNumpad.vue';
import SmartParserInput from './SmartParserInput.vue';
import { LayoutGrid, Sparkles, ChevronDown } from 'lucide-vue-next';

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
  <Transition name="slide-up">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40 flex justify-center bg-stone-dark/30 backdrop-blur-xs"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-md h-[100dvh] max-h-[100dvh] bg-sand-bg flex flex-col shadow-2xl border-x border-sand-border/40 overflow-hidden">
        <!-- Top Header: V Button to Close Pane & Mode Switcher -->
        <div class="pt-2 pb-1.5 px-3 flex items-center justify-between bg-sand-card border-b border-sand-border/60 shrink-0">
          <!-- V Close Button -->
          <button
            type="button"
            @click="emit('close')"
            class="p-2 rounded-xl text-stone-warm hover:text-stone-dark hover:bg-sand-surface transition-all btn-tactile flex items-center gap-1"
            title="Tutup Input Pane"
            aria-label="Tutup Input Pane"
          >
            <ChevronDown :size="24" class="text-matcha-deep" stroke-width="2.5" />
          </button>

          <!-- Mode Switcher Tabs -->
          <div class="bg-sand-surface p-1 rounded-2xl border border-sand-border/80 shadow-xs flex items-center gap-1">
            <button
              type="button"
              @click="currentMode = 'numpad'"
              :class="[
                'flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all btn-tactile',
                currentMode === 'numpad'
                  ? 'bg-matcha-deep text-white shadow-sm'
                  : 'text-stone-warm hover:text-stone-dark'
              ]"
            >
              <LayoutGrid :size="14" />
              <span>Mode Cepat</span>
            </button>

            <button
              type="button"
              @click="currentMode = 'nlp'"
              :class="[
                'flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all btn-tactile',
                currentMode === 'nlp'
                  ? 'bg-matcha-deep text-white shadow-sm'
                  : 'text-stone-warm hover:text-stone-dark'
              ]"
            >
              <Sparkles :size="14" class="text-amber-warm" />
              <span>Input Pintar</span>
            </button>
          </div>

          <!-- Empty balancing spacer -->
          <div class="w-10"></div>
        </div>

        <!-- Active Input Mode Component (Full-View Height) -->
        <div class="flex-1 flex flex-col overflow-hidden">
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

