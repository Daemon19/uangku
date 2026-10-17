<script setup lang="ts">
import { computed } from 'vue';
import type { Transaction } from '@/db/types';
import { formatRupiah } from '@/utils/currency';
import { formatTime } from '@/utils/date';
import { getCategoryByName } from '@/utils/categories';
import CategoryIcon from './CategoryIcon.vue';
import { Wallet, CreditCard, ChevronRight } from 'lucide-vue-next';

const props = defineProps<{
  transaction: Transaction;
}>();

const emit = defineEmits<{
  (e: 'select', tx: Transaction): void;
}>();

const categoryInfo = computed(() => {
  return getCategoryByName(props.transaction.category);
});
</script>

<template>
  <div
    role="button"
    tabindex="0"
    @click="emit('select', transaction)"
    @keydown.enter="emit('select', transaction)"
    @keydown.space.prevent="emit('select', transaction)"
    class="bg-sand-card rounded-2xl p-3.5 border border-sand-border/80 shadow-soft hover:shadow-md hover:border-matcha-deep/30 transition-all group relative overflow-hidden flex items-center justify-between gap-3 cursor-pointer btn-tactile text-left"
  >
    <!-- Left: Category Icon & Details -->
    <div class="flex items-center gap-3 min-w-0">
      <!-- Category Icon with gentle background -->
      <div
        class="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border border-black/5"
        :style="{
          backgroundColor: categoryInfo?.bgLight || '#F3EFEA',
          color: categoryInfo?.color || '#2D4A3E'
        }"
      >
        <CategoryIcon :category="transaction.category" :size="20" />
      </div>

      <!-- Title (Note or Category) & Metadata Sub-line -->
      <div class="min-w-0">
        <span class="font-bold text-sm text-stone-dark leading-tight block truncate max-w-[180px] sm:max-w-[240px]">
          {{ transaction.note || transaction.category }}
        </span>

        <!-- Sub-line: Payment method & Timestamp -->
        <div class="flex items-center gap-1.5 text-[10px] text-stone-muted mt-0.5">
          <!-- Payment: Tunai or Rekening (text color only) -->
          <span
            v-if="transaction.type === 'tunai'"
            class="inline-flex items-center gap-1 font-medium text-amber-warm"
          >
            <Wallet :size="10" />
            Tunai
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1 font-medium text-matcha-deep"
          >
            <CreditCard :size="10" />
            Rekening
          </span>

          <span class="text-stone-300">•</span>

          <!-- Timestamp -->
          <span>
            {{ formatTime(transaction.timestamp) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Right: Amount & Subtle Chevron indicator -->
    <div class="flex items-center gap-2 shrink-0">
      <div class="text-right">
        <span class="text-sm font-bold text-matcha-deep font-sans">
          - {{ formatRupiah(transaction.amount) }}
        </span>
      </div>

      <ChevronRight :size="16" class="text-stone-muted group-hover:text-matcha-deep group-hover:translate-x-0.5 transition-all" />
    </div>
  </div>
</template>
