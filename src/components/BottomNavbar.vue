<script setup lang="ts">
import { Plus, Receipt, BarChart3 } from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'open-input'): void;
  (e: 'open-analytics'): void;
  (e: 'scroll-top'): void;
}>();
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-sand-card/95 backdrop-blur-md border-t border-sand-border/80 px-8 py-2 flex items-center justify-between z-20 shadow-[0_-4px_20px_rgba(45,74,62,0.06)]">
    <!-- Left: Activity Feed / History -->
    <button
      type="button"
      @click="emit('scroll-top')"
      class="flex flex-col items-center gap-1 text-matcha-deep hover:text-matcha-dark transition-colors btn-tactile py-1 px-3 rounded-xl"
      title="Riwayat Pengeluaran"
    >
      <Receipt :size="20" />
      <span class="text-[10px] font-bold tracking-tight">Riwayat</span>
    </button>

    <!-- Center: Prominent Elevated (+) FAB -->
    <button
      type="button"
      @click="emit('open-input')"
      class="w-14 h-14 -mt-5 rounded-full bg-matcha-deep text-white shadow-lifted border-4 border-sand-bg flex items-center justify-center hover:bg-matcha-dark active:scale-95 transition-all btn-tactile focus:outline-none"
      title="Catat Pengeluaran Baru (+)"
    >
      <Plus :size="28" stroke-width="2.5" />
    </button>

    <!-- Right: Analytics Shortcut -->
    <button
      type="button"
      @click="emit('open-analytics')"
      class="flex flex-col items-center gap-1 text-stone-warm hover:text-stone-dark transition-colors btn-tactile py-1 px-3 rounded-xl"
      title="Analisis Kategori"
    >
      <BarChart3 :size="20" />
      <span class="text-[10px] font-bold tracking-tight">Analisis</span>
    </button>
  </nav>
</template>
