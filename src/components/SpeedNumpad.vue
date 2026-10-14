<script setup lang="ts">
import { ref, computed } from 'vue';
import type { PaymentType } from '@/db/types';
import { CATEGORIES } from '@/utils/categories';
import { formatRupiah } from '@/utils/currency';
import { useAudioFeedback } from '@/composables/useAudioFeedback';
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

const { triggerKeypress } = useAudioFeedback();

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
  triggerKeypress();
  if (amountBuffer.value.length >= 11) return; // Prevent overflow beyond 99 billion
  if (amountBuffer.value === '0' && digit === '0') return;
  if (amountBuffer.value === '0') {
    amountBuffer.value = digit;
  } else {
    amountBuffer.value += digit;
  }
}

function handleAddThousands() {
  triggerKeypress();
  if (!amountBuffer.value || amountBuffer.value === '0') return;
  if (amountBuffer.value.length + 3 > 11) return;
  amountBuffer.value += '000';
}

function handleBackspace() {
  triggerKeypress();
  if (amountBuffer.value.length > 0) {
    amountBuffer.value = amountBuffer.value.slice(0, -1);
  }
}

function handleClear() {
  triggerKeypress();
  amountBuffer.value = '';
  noteText.value = '';
}

function setPayment(type: PaymentType) {
  triggerKeypress();
  selectedPayment.value = type;
  userOverrodePayment.value = true;
}

// Sub-3-Second Log Execution on Category Chip Tap
async function handleCategoryTap(categoryName: string) {
  if (numericAmount.value <= 0) {
    triggerKeypress();
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
  <div class="bg-sand-card border-t border-sand-border/80 shadow-[0_-8px_25px_rgba(45,74,62,0.08)] px-3 pt-3 pb-4">
    <!-- Amount Display & Note Row -->
    <div
      class="bg-sand-surface rounded-2xl p-3 border border-sand-border transition-all mb-2.5 flex flex-col gap-1.5"
      :class="{ 'animate-shake border-red-400 bg-red-50/50': isShaking }"
    >
      <div class="flex items-center justify-between">
        <!-- Currency & Amount Display -->
        <div class="flex items-baseline gap-1">
          <span class="text-xs font-bold text-matcha-500 uppercase tracking-wider">IDR</span>
          <span class="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans text-matcha-deep">
            {{ displayAmount }}
          </span>
        </div>

        <!-- Payment Switcher Toggle: Tunai vs Rekening -->
        <div class="flex items-center bg-sand-card p-1 rounded-xl border border-sand-border shadow-sm">
          <button
            type="button"
            @click="setPayment('tunai')"
            :class="[
              'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all btn-tactile',
              selectedPayment === 'tunai'
                ? 'bg-amber-warm text-white shadow-sm'
                : 'text-stone-warm hover:text-stone-dark'
            ]"
          >
            <Wallet :size="12" />
            <span>Tunai</span>
          </button>

          <button
            type="button"
            @click="setPayment('rekening')"
            :class="[
              'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all btn-tactile',
              selectedPayment === 'rekening'
                ? 'bg-matcha-deep text-white shadow-sm'
                : 'text-stone-warm hover:text-stone-dark'
            ]"
          >
            <CreditCard :size="12" />
            <span>Rekening</span>
          </button>
        </div>
      </div>

      <!-- Quick Optional Note Input -->
      <input
        v-model="noteText"
        type="text"
        placeholder="Catatan singkat (opsional, misal: Es Kopi Susu)..."
        class="w-full text-xs bg-transparent border-0 border-t border-sand-border/60 pt-1.5 text-stone-dark placeholder:text-stone-muted focus:outline-none focus:ring-0"
      />
    </div>

    <!-- Category Direct-Log Matrix (Sub-3-Second Trigger) -->
    <div class="mb-2.5">
      <div class="flex items-center justify-between mb-1.5 px-1">
        <span class="text-[10px] font-bold uppercase tracking-wider text-stone-warm flex items-center gap-1">
          Sentuh Kategori untuk Catat Langsung:
        </span>
      </div>

      <div class="grid grid-cols-3 gap-1.5">
        <button
          v-for="cat in CATEGORIES"
          :key="cat.id"
          type="button"
          @click="handleCategoryTap(cat.name)"
          class="flex items-center gap-2 p-2 rounded-xl bg-sand-surface hover:bg-matcha-50 border border-sand-border/70 hover:border-matcha-300 text-stone-dark transition-all text-left group btn-tactile active:scale-95"
        >
          <div
            class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-black/5"
            :style="{ backgroundColor: cat.bgLight, color: cat.color }"
          >
            <CategoryIcon :category="cat.name" :size="14" />
          </div>
          <div class="min-w-0">
            <div class="text-[11px] font-bold truncate leading-tight group-hover:text-matcha-deep">
              {{ cat.name }}
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- Speed Numeric Keypad -->
    <div class="grid grid-cols-4 gap-1.5">
      <!-- Row 1 -->
      <button
        type="button"
        @click="handleDigit('1')"
        class="h-10 rounded-xl bg-sand-card text-stone-dark font-extrabold text-base border border-sand-border hover:bg-sand-surface shadow-sm btn-tactile"
      >
        1
      </button>
      <button
        type="button"
        @click="handleDigit('2')"
        class="h-10 rounded-xl bg-sand-card text-stone-dark font-extrabold text-base border border-sand-border hover:bg-sand-surface shadow-sm btn-tactile"
      >
        2
      </button>
      <button
        type="button"
        @click="handleDigit('3')"
        class="h-10 rounded-xl bg-sand-card text-stone-dark font-extrabold text-base border border-sand-border hover:bg-sand-surface shadow-sm btn-tactile"
      >
        3
      </button>
      <button
        type="button"
        @click="handleBackspace"
        title="Hapus Digit Terakhir"
        class="h-10 rounded-xl bg-sand-surface text-stone-warm font-bold text-xs border border-sand-border hover:text-stone-dark flex items-center justify-center shadow-sm btn-tactile"
      >
        <Delete :size="18" />
      </button>

      <!-- Row 2 -->
      <button
        type="button"
        @click="handleDigit('4')"
        class="h-10 rounded-xl bg-sand-card text-stone-dark font-extrabold text-base border border-sand-border hover:bg-sand-surface shadow-sm btn-tactile"
      >
        4
      </button>
      <button
        type="button"
        @click="handleDigit('5')"
        class="h-10 rounded-xl bg-sand-card text-stone-dark font-extrabold text-base border border-sand-border hover:bg-sand-surface shadow-sm btn-tactile"
      >
        5
      </button>
      <button
        type="button"
        @click="handleDigit('6')"
        class="h-10 rounded-xl bg-sand-card text-stone-dark font-extrabold text-base border border-sand-border hover:bg-sand-surface shadow-sm btn-tactile"
      >
        6
      </button>
      <button
        type="button"
        @click="handleClear"
        title="Reset Nominal"
        class="h-10 rounded-xl bg-sand-surface text-stone-warm font-bold text-xs border border-sand-border hover:text-stone-dark flex items-center justify-center shadow-sm btn-tactile"
      >
        <RotateCcw :size="16" />
      </button>

      <!-- Row 3 -->
      <button
        type="button"
        @click="handleDigit('7')"
        class="h-10 rounded-xl bg-sand-card text-stone-dark font-extrabold text-base border border-sand-border hover:bg-sand-surface shadow-sm btn-tactile"
      >
        7
      </button>
      <button
        type="button"
        @click="handleDigit('8')"
        class="h-10 rounded-xl bg-sand-card text-stone-dark font-extrabold text-base border border-sand-border hover:bg-sand-surface shadow-sm btn-tactile"
      >
        8
      </button>
      <button
        type="button"
        @click="handleDigit('9')"
        class="h-10 rounded-xl bg-sand-card text-stone-dark font-extrabold text-base border border-sand-border hover:bg-sand-surface shadow-sm btn-tactile"
      >
        9
      </button>
      <button
        type="button"
        @click="handleAddThousands"
        class="h-10 rounded-xl bg-amber-subtle text-amber-warm font-extrabold text-xs border border-amber-light hover:bg-amber-light/60 flex items-center justify-center shadow-sm btn-tactile"
        title="Tambah Ribuan (+000)"
      >
        +000
      </button>

      <!-- Row 4 -->
      <div class="col-span-3">
        <button
          type="button"
          @click="handleDigit('0')"
          class="w-full h-10 rounded-xl bg-sand-card text-stone-dark font-extrabold text-base border border-sand-border hover:bg-sand-surface shadow-sm btn-tactile"
        >
          0
        </button>
      </div>
      <button
        type="button"
        @click="handleAddThousands"
        class="h-10 rounded-xl bg-matcha-100 text-matcha-deep font-extrabold text-xs border border-matcha-200 hover:bg-matcha-200/80 flex items-center justify-center shadow-sm btn-tactile"
        title="Tambah Ribuan (+000)"
      >
        +000
      </button>
    </div>
  </div>
</template>
