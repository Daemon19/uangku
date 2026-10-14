<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Transaction } from '@/db/types';
import { getRelativeDayLabel } from '@/utils/date';
import TransactionItem from './TransactionItem.vue';
import { Search, Sparkles } from 'lucide-vue-next';

const props = defineProps<{
  transactions: Transaction[];
}>();

const emit = defineEmits<{
  (e: 'duplicate', tx: Transaction): void;
  (e: 'delete', id: number): void;
}>();

const searchQuery = ref('');

// Filter by search query
const filteredList = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.transactions;
  }
  const q = searchQuery.value.toLowerCase().trim();
  return props.transactions.filter(tx => {
    return (
      tx.category.toLowerCase().includes(q) ||
      (tx.note && tx.note.toLowerCase().includes(q)) ||
      String(tx.amount).includes(q) ||
      tx.type.toLowerCase().includes(q)
    );
  });
});

// Group filtered transactions by day
const groupedTransactions = computed(() => {
  const groups: { dayLabel: string; items: Transaction[] }[] = [];
  const map = new Map<string, Transaction[]>();

  for (const tx of filteredList.value) {
    const label = getRelativeDayLabel(tx.timestamp);
    if (!map.has(label)) {
      map.set(label, []);
    }
    map.get(label)!.push(tx);
  }

  for (const [dayLabel, items] of map.entries()) {
    groups.push({ dayLabel, items });
  }

  return groups;
});
</script>

<template>
  <section class="px-4 py-3 pb-32">
    <!-- Search Bar if transactions exist -->
    <div v-if="transactions.length > 3" class="relative mb-3">
      <Search :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-muted" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Cari transaksi, catatan, atau kategori..."
        class="w-full pl-9 pr-4 py-2 bg-sand-card border border-sand-border rounded-xl text-xs text-stone-dark placeholder:text-stone-muted focus:outline-none focus:border-matcha-deep focus:ring-1 focus:ring-matcha-deep transition-all shadow-sm"
      />
    </div>

    <!-- Empty State -->
    <div
      v-if="filteredList.length === 0"
      class="text-center py-12 px-4 bg-sand-card/70 border border-dashed border-sand-border rounded-3xl my-2"
    >
      <div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-matcha-100/60 flex items-center justify-center text-matcha-deep">
        <Sparkles :size="28" />
      </div>
      <h3 class="font-bold text-stone-dark text-base">Belum Ada Pengeluaran</h3>
      <p class="text-xs text-stone-warm max-w-[240px] mx-auto mt-1 leading-relaxed">
        Ketik nominal di keypad bawah lalu sentuh kategori untuk mencatat dalam 3 detik!
      </p>
    </div>

    <!-- Chronological Grouped List -->
    <div v-else class="space-y-4">
      <div v-for="group in groupedTransactions" :key="group.dayLabel" class="space-y-2">
        <!-- Date Header -->
        <div class="sticky top-[152px] z-10 flex items-center gap-2 py-1 bg-sand-bg/95 backdrop-blur-sm">
          <span class="text-[11px] font-bold uppercase tracking-wider text-stone-warm px-2 py-0.5 rounded-md bg-sand-surface border border-sand-border/70">
            {{ group.dayLabel }}
          </span>
          <div class="h-px bg-sand-border flex-1"></div>
        </div>

        <!-- Transactions in this day -->
        <div class="space-y-2">
          <TransactionItem
            v-for="tx in group.items"
            :key="tx.id"
            :transaction="tx"
            @duplicate="emit('duplicate', $event)"
            @delete="emit('delete', $event)"
          />
        </div>
      </div>
    </div>
  </section>
</template>
