<script setup lang="ts">
import { computed } from 'vue';
import type { Transaction } from '@/db/types';
import { formatRupiah } from '@/utils/currency';
import { CATEGORIES, getCategoryByName } from '@/utils/categories';
import CategoryIcon from './CategoryIcon.vue';
import { X, PieChart, Wallet, CreditCard, TrendingUp, Receipt } from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
  transactions: Transaction[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const totalAmount = computed(() => {
  return props.transactions.reduce((sum, tx) => sum + tx.amount, 0);
});

const totalTunai = computed(() => {
  return props.transactions
    .filter(tx => tx.type === 'tunai')
    .reduce((sum, tx) => sum + tx.amount, 0);
});

const totalRekening = computed(() => {
  return props.transactions
    .filter(tx => tx.type === 'rekening')
    .reduce((sum, tx) => sum + tx.amount, 0);
});

const tunaiPercent = computed(() => {
  if (totalAmount.value === 0) return 0;
  return Math.round((totalTunai.value / totalAmount.value) * 100);
});

const rekeningPercent = computed(() => {
  if (totalAmount.value === 0) return 0;
  return Math.round((totalRekening.value / totalAmount.value) * 100);
});

const averagePerTx = computed(() => {
  if (props.transactions.length === 0) return 0;
  return Math.round(totalAmount.value / props.transactions.length);
});

// Category breakdown sorted descending
const categoryBreakdown = computed(() => {
  const map = new Map<string, { total: number; count: number }>();

  for (const cat of CATEGORIES) {
    map.set(cat.name, { total: 0, count: 0 });
  }

  for (const tx of props.transactions) {
    const existing = map.get(tx.category) || { total: 0, count: 0 };
    map.set(tx.category, {
      total: existing.total + tx.amount,
      count: existing.count + 1,
    });
  }

  const list: {
    category: string;
    total: number;
    count: number;
    percent: number;
    color: string;
    bgLight: string;
  }[] = [];

  for (const [name, data] of map.entries()) {
    if (data.total > 0) {
      const catDef = getCategoryByName(name);
      list.push({
        category: name,
        total: data.total,
        count: data.count,
        percent: totalAmount.value > 0 ? Math.round((data.total / totalAmount.value) * 100) : 0,
        color: catDef?.color || '#2D4A3E',
        bgLight: catDef?.bgLight || '#F3EFEA',
      });
    }
  }

  // Sort descending by total
  return list.sort((a, b) => b.total - a.total);
});

const topCategory = computed(() => {
  return categoryBreakdown.value[0] || null;
});
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-dark/50 backdrop-blur-sm animate-fadeIn"
    @click.self="emit('close')"
  >
    <div class="bg-sand-card w-full max-w-md rounded-3xl border border-sand-border shadow-lifted overflow-hidden max-h-[90vh] flex flex-col">
      <!-- Modal Header -->
      <div class="px-5 py-4 border-b border-sand-border flex items-center justify-between bg-sand-surface/60">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-matcha-deep text-white flex items-center justify-center">
            <PieChart :size="16" />
          </div>
          <div>
            <h2 class="text-base font-bold text-stone-dark leading-tight">Analisis Pengeluaran</h2>
            <p class="text-[11px] text-stone-warm">Rangkuman kategori & metode bayar</p>
          </div>
        </div>

        <button
          type="button"
          @click="emit('close')"
          class="p-1.5 rounded-lg text-stone-warm hover:text-stone-dark hover:bg-sand-surface transition-colors btn-tactile"
        >
          <X :size="18" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-5 overflow-y-auto space-y-4">
        <!-- Overview Stats Grid -->
        <div class="grid grid-cols-2 gap-2.5">
          <div class="bg-sand-surface p-3 rounded-2xl border border-sand-border">
            <div class="flex items-center gap-1.5 text-stone-warm text-[10px] font-semibold uppercase tracking-wider mb-1">
              <TrendingUp :size="12" class="text-matcha-deep" />
              Rata-rata / Tx
            </div>
            <div class="text-sm font-extrabold text-stone-dark">
              {{ formatRupiah(averagePerTx) }}
            </div>
          </div>

          <div class="bg-sand-surface p-3 rounded-2xl border border-sand-border">
            <div class="flex items-center gap-1.5 text-stone-warm text-[10px] font-semibold uppercase tracking-wider mb-1">
              <Receipt :size="12" class="text-amber-warm" />
              Kategori Terboros
            </div>
            <div class="text-sm font-extrabold text-stone-dark truncate">
              {{ topCategory ? topCategory.category : '-' }}
            </div>
          </div>
        </div>

        <!-- Payment Method Comparison: Tunai vs Rekening -->
        <div class="bg-sand-surface p-3.5 rounded-2xl border border-sand-border space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-stone-dark">
            <span class="flex items-center gap-1.5">
              <Wallet :size="14" class="text-amber-warm" />
              Tunai ({{ tunaiPercent }}%)
            </span>
            <span class="flex items-center gap-1.5">
              <CreditCard :size="14" class="text-matcha-deep" />
              Rekening ({{ rekeningPercent }}%)
            </span>
          </div>

          <!-- Proportion Bar -->
          <div class="h-3 w-full bg-sand-border rounded-full overflow-hidden flex">
            <div
              class="h-full bg-amber-warm transition-all duration-500"
              :style="{ width: `${tunaiPercent}%` }"
              title="Tunai"
            ></div>
            <div
              class="h-full bg-matcha-deep transition-all duration-500"
              :style="{ width: `${rekeningPercent}%` }"
              title="Rekening"
            ></div>
          </div>

          <div class="flex items-center justify-between text-[11px] font-mono text-stone-warm">
            <span>{{ formatRupiah(totalTunai) }}</span>
            <span>{{ formatRupiah(totalRekening) }}</span>
          </div>
        </div>

        <!-- Category Breakdown Progress Bars -->
        <div>
          <h3 class="text-xs font-bold uppercase tracking-wider text-stone-warm mb-2.5">
            Rincian Per Kategori
          </h3>

          <div v-if="categoryBreakdown.length === 0" class="text-center py-6 text-xs text-stone-warm">
            Belum ada transaksi pada periode ini.
          </div>

          <div v-else class="space-y-2.5">
            <div
              v-for="item in categoryBreakdown"
              :key="item.category"
              class="bg-sand-card p-3 rounded-2xl border border-sand-border/80 shadow-sm space-y-1.5"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div
                    class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    :style="{ backgroundColor: item.bgLight, color: item.color }"
                  >
                    <CategoryIcon :category="item.category" :size="14" />
                  </div>
                  <div>
                    <span class="font-bold text-xs text-stone-dark">{{ item.category }}</span>
                    <span class="text-[10px] text-stone-muted ml-1.5 font-mono">({{ item.count }}x)</span>
                  </div>
                </div>

                <div class="text-right">
                  <span class="text-xs font-extrabold text-stone-dark">{{ formatRupiah(item.total) }}</span>
                  <span class="text-[10px] text-stone-warm font-bold ml-1">({{ item.percent }}%)</span>
                </div>
              </div>

              <!-- Progress bar -->
              <div class="h-1.5 w-full bg-sand-surface rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :style="{
                    width: `${item.percent}%`,
                    backgroundColor: item.color
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="p-4 border-t border-sand-border bg-sand-surface/60">
        <button
          type="button"
          @click="emit('close')"
          class="w-full py-2.5 rounded-xl bg-matcha-deep text-white text-xs font-bold shadow-sm hover:bg-matcha-dark transition-colors btn-tactile"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
</template>
