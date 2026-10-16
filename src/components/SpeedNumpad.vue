<script setup lang="ts">
import { ref, computed } from 'vue';
import type { PaymentType } from '@/db/types';
import { CATEGORIES } from '@/utils/categories';
import { formatRupiah } from '@/utils/currency';
import { getPreferredPayment } from '@/db';
import CategoryIcon from './CategoryIcon.vue';
import { Delete, Wallet, CreditCard, RotateCcw } from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'log-expense', payload: {
    amount: number;
    category: string;
    type: PaymentType;
    note?: string;
  }): void;
  (e: 'toast', message: string, type?: 'info' | 'warning' | 'success'): void;
}>();

// Raw numeric string buffer (e.g. "25000")
const amountBuffer = ref('');
const noteText = ref('');
const selectedPayment = ref<PaymentType>('tunai');
const userOverrodePayment = ref(false);
const isShaking = ref(false);

const numericAmount = computed(() => {
  return amountBuffer.value ? parseInt(amountBuffer.value, 10) : 0;
});

// Format display
const displayAmount = computed(() => {
  return formatRupiah(numericAmount.value);
});

// Keypad handlers
function handleDigit(digit: string) {
  if (amountBuffer.value.length >= 11) return; // Prevent overflow beyond 99 billion
  if (amountBuffer.value === '0' && digit === '0') return;
  if (amountBuffer.value === '0') {
    amountBuffer.value = digit;
  } else {
    amountBuffer.value += digit;
  }
}

function handleAddThousands() {
  if (!amountBuffer.value || amountBuffer.value === '0') return;
  if (amountBuffer.value.length + 3 > 11) return;
  amountBuffer.value += '000';
}

function handleBackspace() {
  if (amountBuffer.value.length > 0) {
    amountBuffer.value = amountBuffer.value.slice(0, -1);
  }
}

function handleClear() {
  amountBuffer.value = '';
  noteText.value = '';
}

function setPayment(type: PaymentType) {
  selectedPayment.value = type;
  userOverrodePayment.value = true;
}

// Sub-3-Second Log Execution on Category Chip Tap
async function handleCategoryTap(categoryName: string) {
  if (numericAmount.value <= 0) {
    isShaking.value = true;
    setTimeout(() => {
      isShaking.value = false;
    }, 400);
    emit('toast', 'Ketik nominal pengeluaran terlebih dahulu', 'warning');
    return;
  }

  // Determine payment method:
  // If user explicitly toggled payment during this entry, use selectedPayment.
  // Otherwise, fetch the remembered preference for this category!
  let paymentToUse = selectedPayment.value;
  if (!userOverrodePayment.value) {
    try {
      paymentToUse = await getPreferredPayment(categoryName);
    } catch {
      paymentToUse = selectedPayment.value;
    }
  }

  // Commit transaction immediately
  emit('log-expense', {
    amount: numericAmount.value,
    category: categoryName,
    type: paymentToUse,
    note: noteText.value.trim() || undefined,
  });

  // Reset inputs
  amountBuffer.value = '';
  noteText.value = '';
  userOverrodePayment.value = false;
}
</script>

<template>
  <div class="bg-sand-card flex-1 flex flex-col justify-between px-3.5 pt-2 pb-5 overflow-y-auto">
    <!-- Amount Display & Note Row -->
    <div
      class="bg-sand-surface rounded-2xl p-3 sm:p-4 border border-sand-border transition-all mb-2 flex flex-col gap-1.5 shadow-sm"
      :class="{ 'animate-shake border-red-400 bg-red-50/50': isShaking }"
    >
      <div class="flex items-center justify-between">
        <!-- Currency & Amount Display -->
        <div class="flex items-baseline gap-1.5">
          <span class="text-xs sm:text-sm font-bold text-matcha-500 uppercase tracking-wider">IDR</span>
          <span class="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight font-sans text-matcha-deep">
            {{ displayAmount }}
          </span>
        </div>

        <!-- Payment Switcher Toggle: Tunai vs Rekening -->
        <div class="flex items-center bg-sand-card p-1 rounded-xl border border-sand-border shadow-sm">
          <button
            type="button"
            @click="setPayment('tunai')"
            :class="[
              'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all btn-tactile',
              selectedPayment === 'tunai'
                ? 'bg-amber-warm text-white shadow-sm'
                : 'text-stone-warm hover:text-stone-dark'
            ]"
          >
            <Wallet :size="13" />
            <span>Tunai</span>
          </button>

          <button
            type="button"
            @click="setPayment('rekening')"
            :class="[
              'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all btn-tactile',
              selectedPayment === 'rekening'
                ? 'bg-matcha-deep text-white shadow-sm'
                : 'text-stone-warm hover:text-stone-dark'
            ]"
          >
            <CreditCard :size="13" />
            <span>Rekening</span>
          </button>
        </div>
      </div>

      <!-- Quick Optional Note Input -->
      <input
        v-model="noteText"
        type="text"
        placeholder="Nasi padang Keputih"
        class="w-full text-xs sm:text-sm bg-transparent border-0 border-t border-sand-border/60 pt-2 pb-1 text-stone-dark placeholder:text-stone-muted focus:outline-none focus:ring-0"
      />
    </div>

    <!-- Category Direct-Log Matrix (Sub-3-Second Trigger) -->
    <div class="mb-2">
      <div class="flex items-center justify-between mb-1.5 px-1">
        <span class="text-[11px] font-bold uppercase tracking-wider text-stone-muted/70 flex items-center gap-1">
          Kategori
        </span>
      </div>

      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="cat in CATEGORIES"
          :key="cat.id"
          type="button"
          @click="handleCategoryTap(cat.name)"
          class="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-sand-surface hover:bg-matcha-50 border border-sand-border/70 hover:border-matcha-300 text-stone-dark transition-all text-left group btn-tactile active:scale-95 shadow-xs"
        >
          <div
            class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border border-black/5"
            :style="{ backgroundColor: cat.bgLight, color: cat.color }"
          >
            <CategoryIcon :category="cat.name" :size="16" />
          </div>
          <div class="min-w-0">
            <div class="text-xs font-bold truncate leading-tight group-hover:text-matcha-deep">
              {{ cat.name }}
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- Speed Numeric Keypad (Enlarged Vertically & Clean Layout) -->
    <div class="grid grid-cols-4 gap-2">
      <!-- Row 1 -->
      <button
        type="button"
        @click="handleDigit('1')"
        class="h-[66px] sm:h-[72px] rounded-2xl bg-sand-card text-stone-dark font-extrabold text-xl sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-sm btn-tactile flex items-center justify-center"
      >
        1
      </button>
      <button
        type="button"
        @click="handleDigit('2')"
        class="h-[66px] sm:h-[72px] rounded-2xl bg-sand-card text-stone-dark font-extrabold text-xl sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-sm btn-tactile flex items-center justify-center"
      >
        2
      </button>
      <button
        type="button"
        @click="handleDigit('3')"
        class="h-[66px] sm:h-[72px] rounded-2xl bg-sand-card text-stone-dark font-extrabold text-xl sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-sm btn-tactile flex items-center justify-center"
      >
        3
      </button>
      <button
        type="button"
        @click="handleBackspace"
        title="Hapus Digit Terakhir"
        class="h-[66px] sm:h-[72px] rounded-2xl bg-sand-surface text-stone-warm font-bold text-xs border border-sand-border hover:text-stone-dark flex items-center justify-center shadow-sm btn-tactile"
      >
        <Delete :size="22" />
      </button>

      <!-- Row 2 -->
      <button
        type="button"
        @click="handleDigit('4')"
        class="h-[66px] sm:h-[72px] rounded-2xl bg-sand-card text-stone-dark font-extrabold text-xl sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-sm btn-tactile flex items-center justify-center"
      >
        4
      </button>
      <button
        type="button"
        @click="handleDigit('5')"
        class="h-[66px] sm:h-[72px] rounded-2xl bg-sand-card text-stone-dark font-extrabold text-xl sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-sm btn-tactile flex items-center justify-center"
      >
        5
      </button>
      <button
        type="button"
        @click="handleDigit('6')"
        class="h-[66px] sm:h-[72px] rounded-2xl bg-sand-card text-stone-dark font-extrabold text-xl sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-sm btn-tactile flex items-center justify-center"
      >
        6
      </button>
      <button
        type="button"
        @click="handleClear"
        title="Reset Nominal"
        class="h-[66px] sm:h-[72px] rounded-2xl bg-sand-surface text-stone-warm font-bold text-xs border border-sand-border hover:text-stone-dark flex items-center justify-center shadow-sm btn-tactile"
      >
        <RotateCcw :size="20" />
      </button>

      <!-- Row 3 -->
      <button
        type="button"
        @click="handleDigit('7')"
        class="h-[66px] sm:h-[72px] rounded-2xl bg-sand-card text-stone-dark font-extrabold text-xl sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-sm btn-tactile flex items-center justify-center"
      >
        7
      </button>
      <button
        type="button"
        @click="handleDigit('8')"
        class="h-[66px] sm:h-[72px] rounded-2xl bg-sand-card text-stone-dark font-extrabold text-xl sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-sm btn-tactile flex items-center justify-center"
      >
        8
      </button>
      <button
        type="button"
        @click="handleDigit('9')"
        class="h-[66px] sm:h-[72px] rounded-2xl bg-sand-card text-stone-dark font-extrabold text-xl sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-sm btn-tactile flex items-center justify-center"
      >
        9
      </button>
      <!-- Single +000 spanning Row 3 & 4 (No Duplicates!) -->
      <button
        type="button"
        @click="handleAddThousands"
        class="row-span-2 h-full min-h-[140px] rounded-2xl bg-matcha-100 text-matcha-deep font-extrabold text-sm sm:text-base border border-matcha-200 hover:bg-matcha-200/80 flex items-center justify-center shadow-sm btn-tactile"
        title="Tambah Ribuan (+000)"
      >
        +000
      </button>

      <!-- Row 4 -->
      <div class="col-span-3">
        <button
          type="button"
          @click="handleDigit('0')"
          class="w-full h-[66px] sm:h-[72px] rounded-2xl bg-sand-card text-stone-dark font-extrabold text-xl sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-sm btn-tactile flex items-center justify-center"
        >
          0
        </button>
      </div>
    </div>
  </div>
</template>
