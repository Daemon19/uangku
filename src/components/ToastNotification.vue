<script setup lang="ts">
import { CheckCircle2, AlertTriangle, Info } from 'lucide-vue-next';

defineProps<{
  show: boolean;
  message: string;
  type?: 'info' | 'warning' | 'success';
}>();
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="transform -translate-y-4 opacity-0 scale-95"
    enter-to-class="transform translate-y-0 opacity-100 scale-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="transform translate-y-0 opacity-100 scale-100"
    leave-to-class="transform -translate-y-4 opacity-0 scale-95"
  >
    <div
      v-if="show"
      class="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] sm:max-w-sm pointer-events-none"
    >
      <div
        class="flex items-center gap-2 px-3.5 py-2 rounded-2xl shadow-lifted border backdrop-blur-md text-xs font-semibold"
        :class="{
          'bg-matcha-deep/95 text-white border-matcha-400/40': type === 'success',
          'bg-amber-warm/95 text-white border-amber-light/40': type === 'warning',
          'bg-sand-card/95 text-stone-dark border-sand-border shadow-soft': type === 'info' || !type
        }"
      >
        <CheckCircle2 v-if="type === 'success'" :size="16" class="text-matcha-100 shrink-0" />
        <AlertTriangle v-else-if="type === 'warning'" :size="16" class="text-white shrink-0" />
        <Info v-else :size="16" class="text-matcha-deep shrink-0" />
        <span>{{ message }}</span>
      </div>
    </div>
  </Transition>
</template>
