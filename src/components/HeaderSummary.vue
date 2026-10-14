<script setup lang="ts">
import { computed } from 'vue';
import type { Transaction, TimeFilter } from '@/db/types';
import { formatRupiah } from '@/utils/currency';
import { useAudioFeedback } from '@/composables/useAudioFeedback';
import {
  Sparkles,
  BarChart3,
  Download,
  Volume2,
  VolumeX,
  Wallet,
  CreditCard,
} from 'lucide-vue-next';

const props = defineProps<{
  transactions: Transaction[];
  currentFilter: TimeFilter;
}>();

const emit = defineEmits<{
  (e: 'update:filter', filter: TimeFilter): void;
  (e: 'open-analytics'): void;
  (e: 'open-export'): void;
}>();

const { soundActive, toggle: toggleSoundEffect } = useAudioFeedback();

// Total spending for displayed list
const totalAmount = computed(() => {
  return props.transactions.reduce((sum, tx) => sum + tx.amount, 0);
});

// Total by Tunai
const totalTunai = computed(() => {
  return props.transactions
    .filter(tx => tx.type === 'tunai')
    .reduce((sum, tx) => sum + tx.amount, 0);
});

// Total by Rekening
const totalRekening = computed(() => {
  return props.transactions
    .filter(tx => tx.type === 'rekening')
    .reduce((sum, tx) => sum + tx.amount, 0);
});

const filterLabels: { key: TimeFilter; label: string }[] = [
  { key: 'today', label: 'Hari Ini' },
  { key: '7days', label: '7 Hari' },
  { key: 'month', label: 'Bulan Ini' },
  { key: 'all', label: 'Semua' },
];

const periodSubtitle = computed(() => {
  switch (props.currentFilter) {
    case 'today':
      return 'Total Pengeluaran Hari Ini';
    case '7days':
      return 'Total Pengeluaran 7 Hari Terakhir';
    case 'month':
      return 'Total Pengeluaran Bulan Ini';
    case 'all':
    default:
      return 'Total Seluruh Pengeluaran';
  }
});
</script>

<template>
  <header class="bg-sand-card border-b border-sand-border pt-4 pb-3 px-4 shadow-soft sticky top-0 z-20">
    <!-- Top Branding & Action Toolbar -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <div class="w-9 h-9 rounded-xl bg-matcha-deep flex items-center justify-center text-white shadow-sm">
          <Sparkles :size="20" class="text-amber-light" />
        </div>
        <div>
          <h1 class="text-lg font-bold tracking-tight text-matcha-deep flex items-center gap-1.5 leading-none">
            UangKu
            <span class="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-matcha-100 text-matcha-deep border border-matcha-200">
              Offline
            </span>
          </h1>
          <p class="text-[11px] text-stone-warm mt-0.5 font-medium">Catat Cepat Rupiah</p>
        </div>
      </div>

      <!-- Action Toolbar -->
      <div class="flex items-center gap-1">
        <button
          type="button"
          @click="toggleSoundEffect"
          :title="soundActive ? 'Suara Aktif' : 'Suara Senyap'"
          class="p-2 rounded-lg text-stone-warm hover:text-stone-dark hover:bg-sand-surface transition-colors btn-tactile"
        >
          <Volume2 v-if="soundActive" :size="18" class="text-matcha-deep" />
          <VolumeX v-else :size="18" class="text-stone-muted" />
        </button>

        <button
          type="button"
          @click="emit('open-analytics')"
          title="Analisis Kategori"
          class="p-2 rounded-lg text-stone-warm hover:text-stone-dark hover:bg-sand-surface transition-colors btn-tactile"
        >
          <BarChart3 :size="18" class="text-matcha-deep" />
        </button>

        <button
          type="button"
          @click="emit('open-export')"
          title="Ekspor CSV & Cadangan"
          class="p-2 rounded-lg text-stone-warm hover:text-stone-dark hover:bg-sand-surface transition-colors btn-tactile"
        >
          <Download :size="18" class="text-matcha-deep" />
        </button>
      </div>
    </div>

    <!-- Main Spending Total Display -->
    <div class="bg-gradient-to-br from-matcha-deep to-matcha-dark text-white rounded-2xl p-4 shadow-lifted relative overflow-hidden">
      <!-- Decorative background blur -->
      <div class="absolute -right-6 -bottom-6 w-28 h-28 bg-matcha-400 opacity-20 rounded-full blur-2xl pointer-events-none"></div>

      <div class="flex items-baseline justify-between mb-1">
        <span class="text-xs font-medium text-matcha-100 uppercase tracking-wider">
          {{ periodSubtitle }}
        </span>
        <span class="text-[11px] text-matcha-200 font-mono">
          {{ transactions.length }} transaksi
        </span>
      </div>

      <div class="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans text-white mb-3">
        {{ formatRupiah(totalAmount) }}
      </div>

      <!-- Payment Split Pills: Tunai vs Rekening -->
      <div class="grid grid-cols-2 gap-2 pt-2 border-t border-matcha-500/40">
        <div class="flex items-center gap-2 bg-matcha-darkest/40 rounded-xl px-2.5 py-1.5 border border-white/10">
          <div class="w-6 h-6 rounded-lg bg-amber-warm/20 flex items-center justify-center text-amber-warm shrink-0">
            <Wallet :size="13" />
          </div>
          <div class="min-w-0">
            <div class="text-[10px] text-matcha-200 font-medium">Tunai</div>
            <div class="text-xs font-bold text-white truncate font-mono">
              {{ formatRupiah(totalTunai) }}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 bg-matcha-darkest/40 rounded-xl px-2.5 py-1.5 border border-white/10">
          <div class="w-6 h-6 rounded-lg bg-matcha-100/20 flex items-center justify-center text-matcha-100 shrink-0">
            <CreditCard :size="13" />
          </div>
          <div class="min-w-0">
            <div class="text-[10px] text-matcha-200 font-medium">Rekening</div>
            <div class="text-xs font-bold text-white truncate font-mono">
              {{ formatRupiah(totalRekening) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Periods Tabs -->
    <div class="flex items-center gap-1.5 mt-3 overflow-x-auto pb-0.5 no-scrollbar">
      <button
        v-for="item in filterLabels"
        :key="item.key"
        type="button"
        @click="emit('update:filter', item.key)"
        :class="[
          'text-xs font-semibold px-3 py-1.5 rounded-full transition-all shrink-0 btn-tactile',
          currentFilter === item.key
            ? 'bg-matcha-deep text-white shadow-sm'
            : 'bg-sand-surface text-stone-warm hover:text-stone-dark hover:bg-sand-border/70'
        ]"
      >
        {{ item.label }}
      </button>
    </div>
  </header>
</template>
