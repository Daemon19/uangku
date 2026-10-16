<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { PaymentType, CategoryItem, Transaction } from '@/db/types';
import { CATEGORIES } from '@/utils/categories';
import { formatNumberOnly } from '@/utils/currency';
import { db } from '@/db';
import { useLiveQuery } from '@/composables/useLiveQuery';
import CategoryIcon from './CategoryIcon.vue';
import { Delete, Wallet, CreditCard, RotateCcw, MessageSquare } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    isOpen?: boolean;
  }>(),
  {
    isOpen: true,
  }
);

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

// Query all transactions to track last used payment
const allTransactions = useLiveQuery(
  () => db.transactions.toArray(),
  []
);

// Set payment choice same as the last transaction
async function syncPaymentWithLastTransaction() {
  try {
    const lastTx = await db.transactions.reverse().first();
    if (lastTx && (lastTx.type === 'tunai' || lastTx.type === 'rekening')) {
      selectedPayment.value = lastTx.type;
    }
  } catch (err) {
    console.debug('Failed to get last transaction payment type:', err);
  }
}

// Frozen categories list: initialized upon pane opening, preserved while pane is opened
const sortedCategories = ref<CategoryItem[]>([...CATEGORIES]);
let hasFrozenCategories = false;

function sortCategoriesList(txs: Transaction[]) {
  if (!txs || txs.length === 0) return;
  hasFrozenCategories = true;
  const counts = new Map<string, number>();
  for (const tx of txs) {
    counts.set(tx.category, (counts.get(tx.category) || 0) + 1);
  }

  sortedCategories.value = [...CATEGORIES].sort((a, b) => {
    const countA = counts.get(a.name) || 0;
    const countB = counts.get(b.name) || 0;
    if (countB !== countA) {
      return countB - countA;
    }
    return 0;
  });
}

async function updateCategoryOrder() {
  if (allTransactions.value && allTransactions.value.length > 0) {
    sortCategoriesList(allTransactions.value);
    return;
  }
  try {
    const txs = await db.transactions.toArray();
    sortCategoriesList(txs);
  } catch (err) {
    console.debug('Failed to sort categories on open:', err);
  }
}

onMounted(() => {
  // If data is already in memory from live query, sort instantly without blocking IPC
  if (allTransactions.value && allTransactions.value.length > 0) {
    sortCategoriesList(allTransactions.value);
    const lastTx = allTransactions.value[allTransactions.value.length - 1];
    if (lastTx && (lastTx.type === 'tunai' || lastTx.type === 'rekening')) {
      selectedPayment.value = lastTx.type;
    }
  } else {
    // Defer async database calls by 1 frame to keep pop-up animation smooth
    requestAnimationFrame(() => {
      syncPaymentWithLastTransaction();
      updateCategoryOrder();
    });
  }
});

watch(
  allTransactions,
  (txs) => {
    // If initial seed data loads on first launch, sort once
    if (!hasFrozenCategories && txs && txs.length > 0) {
      updateCategoryOrder();
    }
    if (!userOverrodePayment.value && txs && txs.length > 0) {
      const lastTx = txs[txs.length - 1];
      if (lastTx && (lastTx.type === 'tunai' || lastTx.type === 'rekening')) {
        selectedPayment.value = lastTx.type;
      }
    }
  }
);

// Re-sort only when the pane transitions from closed to open
watch(
  () => props.isOpen,
  (newOpen) => {
    if (newOpen) {
      hasFrozenCategories = false;
      updateCategoryOrder();
      syncPaymentWithLastTransaction();
    }
  }
);

const numericAmount = computed(() => {
  return amountBuffer.value ? parseInt(amountBuffer.value, 10) : 0;
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

// Fast pointer input handler to register inputs instantly on touch-down without click delays or drops
let lastPointerTime = 0;

function triggerKey(action: () => void, event: UIEvent) {
  if ('button' in event && (event as PointerEvent).button !== 0) {
    return;
  }
  const now = performance.now();
  if (event.type === 'pointerdown') {
    lastPointerTime = now;
    action();
  } else if (event.type === 'click') {
    if (now - lastPointerTime < 400) {
      return;
    }
    action();
  } else {
    action();
  }
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

  // Commit transaction immediately with selected payment
  emit('log-expense', {
    amount: numericAmount.value,
    category: categoryName,
    type: selectedPayment.value,
    note: noteText.value.trim() || undefined,
  });

  // Reset inputs
  amountBuffer.value = '';
  noteText.value = '';
  userOverrodePayment.value = false;
}
</script>

<template>
  <div class="bg-sand-card px-3.5 pt-2 pb-4 flex flex-col justify-start gap-2">
    <!-- Amount Display & Note Row (Above Category Picker) -->
    <div
      class="bg-sand-surface rounded-2xl p-3 sm:p-3.5 border border-sand-border/80 transition-all flex flex-col gap-2 shadow-xs"
      :class="{ 'animate-shake border-red-400 bg-red-50/50': isShaking }"
    >
      <!-- Top Row: Payment Switcher & Amount Heading -->
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-stone-warm uppercase tracking-wider select-none">Nominal</span>

        <!-- Payment Switcher Toggle: Tunai vs Rekening -->
        <div class="flex items-center bg-sand-card p-0.5 rounded-xl border border-sand-border shadow-xs">
          <button
            type="button"
            @pointerdown="triggerKey(() => setPayment('tunai'), $event)"
            @click="triggerKey(() => setPayment('tunai'), $event)"
            :class="[
              'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all btn-tactile',
              selectedPayment === 'tunai'
                ? 'bg-amber-warm text-white shadow-xs'
                : 'text-stone-warm hover:text-stone-dark'
            ]"
          >
            <Wallet :size="12" />
            <span>Tunai</span>
          </button>

          <button
            type="button"
            @pointerdown="triggerKey(() => setPayment('rekening'), $event)"
            @click="triggerKey(() => setPayment('rekening'), $event)"
            :class="[
              'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all btn-tactile',
              selectedPayment === 'rekening'
                ? 'bg-matcha-deep text-white shadow-xs'
                : 'text-stone-warm hover:text-stone-dark'
            ]"
          >
            <CreditCard :size="12" />
            <span>Rekening</span>
          </button>
        </div>
      </div>

      <!-- Main Currency & Amount Display -->
      <div class="flex items-baseline gap-1.5 py-0.5">
        <span class="text-xl sm:text-2xl font-extrabold text-matcha-deep/80 select-none">Rp</span>
        <span class="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight font-sans text-matcha-deep select-none">
          {{ formatNumberOnly(numericAmount) }}
        </span>
      </div>

      <!-- Quick Optional Note Input: Larger text for mobile readability -->
      <div class="flex items-center gap-2 px-3 py-2 bg-sand-card rounded-xl border border-sand-border/70 focus-within:border-matcha-deep focus-within:ring-1 focus-within:ring-matcha-deep transition-all">
        <MessageSquare :size="18" class="text-stone-warm shrink-0" />
        <input
          v-model="noteText"
          type="text"
          placeholder="Nasi padang Keputih"
          class="w-full text-base sm:text-lg font-medium bg-transparent border-0 text-stone-dark placeholder:text-stone-muted focus:outline-none focus:ring-0 p-0"
        />
        <span v-if="!noteText" class="text-xs text-stone-muted select-none shrink-0 font-medium">
          (Opsional)
        </span>
      </div>
    </div>

    <!-- Category Direct-Log Row: 1 Row, Horizontally Scrollable, Sorted by Most Used -->
    <div>
      <div class="px-1 mb-1.5 flex items-center justify-between">
        <span class="text-xs font-bold text-stone-warm uppercase tracking-wider">Kategori</span>
      </div>

      <div
        class="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 px-0.5 touch-pan-x overscroll-x-contain"
        style="-webkit-overflow-scrolling: touch; overscroll-behavior-x: contain;"
      >
        <button
          v-for="cat in sortedCategories"
          :key="cat.id"
          type="button"
          @click="handleCategoryTap(cat.name)"
          :title="cat.name"
          :aria-label="cat.name"
          class="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center shrink-0 border border-sand-border/70 active:scale-95 transition-transform duration-75 select-none touch-manipulation shadow-xs"
          :style="{ backgroundColor: cat.bgLight, color: cat.color }"
        >
          <CategoryIcon :category="cat.name" :size="22" />
        </button>
      </div>
    </div>

    <!-- Speed Numeric Keypad (Enlarged Vertically & Clean Layout) -->
    <div class="grid grid-cols-4 gap-1.5 sm:gap-2 select-none touch-manipulation">
      <!-- Row 1 -->
      <button
        type="button"
        @pointerdown="triggerKey(() => handleDigit('1'), $event)"
        @click="triggerKey(() => handleDigit('1'), $event)"
        class="h-[54px] sm:h-[60px] rounded-2xl bg-sand-card text-stone-dark font-extrabold text-xl sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-xs btn-tactile flex items-center justify-center select-none touch-manipulation"
      >
        1
      </button>
      <button
        type="button"
        @pointerdown="triggerKey(() => handleDigit('2'), $event)"
        @click="triggerKey(() => handleDigit('2'), $event)"
        class="h-[54px] sm:h-[60px] rounded-2xl bg-sand-card text-stone-dark font-extrabold text-xl sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-xs btn-tactile flex items-center justify-center select-none touch-manipulation"
      >
        2
      </button>
      <button
        type="button"
        @pointerdown="triggerKey(() => handleDigit('3'), $event)"
        @click="triggerKey(() => handleDigit('3'), $event)"
        class="h-[54px] sm:h-[60px] rounded-2xl bg-sand-card text-stone-dark font-extrabold text-xl sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-xs btn-tactile flex items-center justify-center select-none touch-manipulation"
      >
        3
      </button>
      <button
        type="button"
        @pointerdown="triggerKey(handleBackspace, $event)"
        @click="triggerKey(handleBackspace, $event)"
        title="Hapus Digit Terakhir"
        class="h-[54px] sm:h-[60px] rounded-2xl bg-sand-surface text-stone-warm font-bold text-xs border border-sand-border hover:text-stone-dark flex items-center justify-center shadow-xs btn-tactile select-none touch-manipulation"
      >
        <Delete :size="20" />
      </button>

      <!-- Row 2 -->
      <button
        type="button"
        @pointerdown="triggerKey(() => handleDigit('4'), $event)"
        @click="triggerKey(() => handleDigit('4'), $event)"
        class="h-[54px] sm:h-[60px] rounded-2xl bg-sand-card text-stone-dark font-extrabold text-xl sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-xs btn-tactile flex items-center justify-center select-none touch-manipulation"
      >
        4
      </button>
      <button
        type="button"
        @pointerdown="triggerKey(() => handleDigit('5'), $event)"
        @click="triggerKey(() => handleDigit('5'), $event)"
        class="h-[54px] sm:h-[60px] rounded-2xl bg-sand-card text-stone-dark font-extrabold text-xl sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-xs btn-tactile flex items-center justify-center select-none touch-manipulation"
      >
        5
      </button>
      <button
        type="button"
        @pointerdown="triggerKey(() => handleDigit('6'), $event)"
        @click="triggerKey(() => handleDigit('6'), $event)"
        class="h-[54px] sm:h-[60px] rounded-2xl bg-sand-card text-stone-dark font-extrabold text-xl sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-xs btn-tactile flex items-center justify-center select-none touch-manipulation"
      >
        6
      </button>
      <button
        type="button"
        @pointerdown="triggerKey(handleClear, $event)"
        @click="triggerKey(handleClear, $event)"
        title="Reset Nominal"
        class="h-[54px] sm:h-[60px] rounded-2xl bg-sand-surface text-stone-warm font-bold text-xs border border-sand-border hover:text-stone-dark flex items-center justify-center shadow-xs btn-tactile select-none touch-manipulation"
      >
        <RotateCcw :size="19" />
      </button>

      <!-- Row 3 -->
      <button
        type="button"
        @pointerdown="triggerKey(() => handleDigit('7'), $event)"
        @click="triggerKey(() => handleDigit('7'), $event)"
        class="h-[54px] sm:h-[60px] rounded-2xl bg-sand-card text-stone-dark font-extrabold text-xl sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-xs btn-tactile flex items-center justify-center select-none touch-manipulation"
      >
        7
      </button>
      <button
        type="button"
        @pointerdown="triggerKey(() => handleDigit('8'), $event)"
        @click="triggerKey(() => handleDigit('8'), $event)"
        class="h-[54px] sm:h-[60px] rounded-2xl bg-sand-card text-stone-dark font-extrabold text-xl sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-xs btn-tactile flex items-center justify-center select-none touch-manipulation"
      >
        8
      </button>
      <button
        type="button"
        @pointerdown="triggerKey(() => handleDigit('9'), $event)"
        @click="triggerKey(() => handleDigit('9'), $event)"
        class="h-[54px] sm:h-[60px] rounded-2xl bg-sand-card text-stone-dark font-extrabold text-xl sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-xs btn-tactile flex items-center justify-center select-none touch-manipulation"
      >
        9
      </button>
      <!-- Single +000 spanning Row 3 & 4 (No Duplicates!) -->
      <button
        type="button"
        @pointerdown="triggerKey(handleAddThousands, $event)"
        @click="triggerKey(handleAddThousands, $event)"
        class="row-span-2 h-full min-h-[114px] sm:min-h-[126px] rounded-2xl bg-matcha-100 text-matcha-deep font-extrabold text-sm sm:text-base border border-matcha-200 hover:bg-matcha-200/80 flex items-center justify-center shadow-xs btn-tactile select-none touch-manipulation"
        title="Tambah Ribuan (+000)"
      >
        +000
      </button>

      <!-- Row 4 -->
      <div class="col-span-3">
        <button
          type="button"
          @pointerdown="triggerKey(() => handleDigit('0'), $event)"
          @click="triggerKey(() => handleDigit('0'), $event)"
          class="w-full h-[54px] sm:h-[60px] rounded-2xl bg-sand-card text-stone-dark font-extrabold text-xl sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-xs btn-tactile flex items-center justify-center select-none touch-manipulation"
        >
          0
        </button>
      </div>
    </div>
  </div>
</template>
