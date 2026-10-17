<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import type { PaymentType } from '@/db/types';
import { CATEGORIES } from '@/utils/categories';
import { formatNumberOnly } from '@/utils/currency';
import { db } from '@/db';
import { useLiveQuery } from '@/composables/useLiveQuery';
import { extractUniqueNotes, rankPastNotes } from '@/utils/fuzzyNotes';
import CategoryIcon from './CategoryIcon.vue';
import { Delete, Wallet, CreditCard, RotateCcw, CornerDownLeft, LayoutGrid } from 'lucide-vue-next';
import {
  createInitialNumpadState,
  handleDigitInput,
  handleAddThousands as addThousandsEngine,
  handleDotInput,
  handleBackspaceInput,
  computeNumericAmount,
  computeDisplayParts,
  type NumpadState,
} from '@/utils/numpadEngine';

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

// Numpad state engine
const numpadState = ref<NumpadState>(createInitialNumpadState());
const noteInputRef = ref<HTMLInputElement | null>(null);
const noteText = ref('');
const selectedPayment = ref<PaymentType>('tunai');
const userOverrodePayment = ref(false);
const isShaking = ref(false);
const isNoteFocused = ref(false);
let blurTimeout: ReturnType<typeof setTimeout> | null = null;

// Query all transactions to track last used payment
const allTransactions = useLiveQuery(
  () => db.transactions.toArray(),
  []
);

// Past notes extraction & typo-tolerant fuzzy ranking
const pastNotes = computed(() => extractUniqueNotes(allTransactions.value || []));

const suggestedNotes = computed(() => {
  if (!noteText.value.trim()) {
    return [];
  }
  return rankPastNotes(noteText.value, pastNotes.value, 6);
});

function applySuggestedNote(suggestion: string) {
  noteText.value = suggestion;
  // If keyboard is currently open, keep it focused with cursor at the end
  if (isNoteFocused.value) {
    nextTick(() => {
      if (noteInputRef.value) {
        noteInputRef.value.focus();
        const len = suggestion.length;
        noteInputRef.value.setSelectionRange(len, len);
      }
    });
  }
}

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

onMounted(() => {
  if (allTransactions.value && allTransactions.value.length > 0) {
    const lastTx = allTransactions.value[allTransactions.value.length - 1];
    if (lastTx && (lastTx.type === 'tunai' || lastTx.type === 'rekening')) {
      selectedPayment.value = lastTx.type;
    }
  } else {
    requestAnimationFrame(() => {
      syncPaymentWithLastTransaction();
    });
  }
});

watch(
  allTransactions,
  (txs) => {
    if (!userOverrodePayment.value && txs && txs.length > 0) {
      const lastTx = txs[txs.length - 1];
      if (lastTx && (lastTx.type === 'tunai' || lastTx.type === 'rekening')) {
        selectedPayment.value = lastTx.type;
      }
    }
  }
);

watch(
  () => props.isOpen,
  (newOpen) => {
    if (newOpen) {
      syncPaymentWithLastTransaction();
    } else {
      restoreNumpad();
    }
  }
);

const numericAmount = computed(() => computeNumericAmount(numpadState.value));
const displayParts = computed(() => computeDisplayParts(numpadState.value));

// Keypad handlers
function handleDigit(digit: string) {
  numpadState.value = handleDigitInput(numpadState.value, digit);
}

function handleAddThousands() {
  numpadState.value = addThousandsEngine(numpadState.value);
}

function handleDot() {
  numpadState.value = handleDotInput(numpadState.value);
}

function handleBackspace() {
  numpadState.value = handleBackspaceInput(numpadState.value);
}

function handleNoteFocus() {
  if (blurTimeout) {
    clearTimeout(blurTimeout);
    blurTimeout = null;
  }
  isNoteFocused.value = true;
}

function handleNoteBlur() {
  if (blurTimeout) clearTimeout(blurTimeout);
  blurTimeout = setTimeout(() => {
    isNoteFocused.value = false;
  }, 200);
}

function restoreNumpad() {
  if (blurTimeout) clearTimeout(blurTimeout);
  isNoteFocused.value = false;
  noteInputRef.value?.blur();
}

function handleClear() {
  numpadState.value = createInitialNumpadState();
  noteText.value = '';
  restoreNumpad();
}

function handleEnter(event?: Event) {
  event?.preventDefault();
  handleNoteFocus();
  noteInputRef.value?.focus();
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
  numpadState.value = createInitialNumpadState();
  noteText.value = '';
  userOverrodePayment.value = false;
  restoreNumpad();
}
</script>

<template>
  <div class="flex-1 flex flex-col justify-between p-2.5 sm:p-4 bg-sand-bg select-none overflow-hidden">
    <!-- Top Static Section: Amount -> Note Input + Ribbon -> Category Matrix -->
    <div class="flex flex-col gap-2 sm:gap-3 shrink-0">
      <!-- Amount Display & Note Row -->
      <div
        class="bg-sand-surface rounded-2xl p-2.5 sm:p-3.5 border border-sand-border/80 transition-all flex flex-col gap-1.5 sm:gap-2 shadow-xs shrink-0"
        :class="{ 'animate-shake border-red-400 bg-red-50/50': isShaking }"
      >
        <div class="flex items-baseline gap-1.5 py-0.5">
          <!-- Main Currency & Amount Display -->
          <span class="text-lg sm:text-2xl font-extrabold text-matcha-deep/80 select-none">Rp</span>
          <div class="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight font-sans select-none flex items-baseline">
            <span class="text-matcha-deep">{{ displayParts.mainText }}</span>
            <span v-if="displayParts.dimmedZeros" class="text-matcha-deep/30 font-bold">{{ displayParts.dimmedZeros }}</span>
          </div>
          
          <!-- Payment Switcher Toggle: Tunai vs Rekening -->
          <div class="flex ml-auto items-center bg-sand-card p-0.5 rounded-xl border border-sand-border shadow-xs">
            <button
              type="button"
              @pointerdown="triggerKey(() => setPayment('tunai'), $event)"
              @click="triggerKey(() => setPayment('tunai'), $event)"
              :class="[
                'flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all btn-tactile',
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
                'flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all btn-tactile',
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

        <!-- Quick Note Input: Larger text for mobile readability without message icon or optional label -->
        <div class="flex items-center px-3 py-1.5 sm:px-3.5 sm:py-2.5 bg-sand-card rounded-xl border border-sand-border/70 focus-within:border-matcha-deep focus-within:ring-1 focus-within:ring-matcha-deep transition-all">
          <input
            ref="noteInputRef"
            v-model="noteText"
            type="text"
            placeholder="Nasi padang Keputih"
            @focus="handleNoteFocus"
            @blur="handleNoteBlur"
            @keyup.enter="restoreNumpad"
            class="w-full text-sm sm:text-lg font-medium bg-transparent border-0 text-stone-dark placeholder:text-stone-muted focus:outline-none focus:ring-0 p-0"
          />
        </div>

        <!-- Fuzzy Note Suggestions Ribbon (Permanently reserved slot, never collapses, stays shown on blur) -->
        <div class="h-[34px] sm:h-[42px] flex items-center -mt-0.5">
          <Transition name="fade">
            <div
              v-if="suggestedNotes.length > 0"
              class="w-full flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar touch-pan-x"
            >
              <button
                v-for="suggestion in suggestedNotes"
                :key="suggestion"
                type="button"
                @pointerdown.prevent="applySuggestedNote(suggestion)"
                @click.prevent="applySuggestedNote(suggestion)"
                class="shrink-0 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-sand-card hover:bg-matcha-50 border border-sand-border/80 hover:border-matcha-300 text-xs sm:text-sm font-semibold text-stone-dark transition-all btn-tactile active:scale-95 shadow-2xs flex items-center justify-center min-h-[28px] sm:min-h-[36px]"
              >
                <span>{{ suggestion }}</span>
              </button>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Category Direct-Log Matrix (Sub-3-Second Trigger) -->
      <div class="shrink-0">
        <div class="grid grid-cols-3 gap-1.5 sm:gap-2">
          <button
            v-for="cat in CATEGORIES"
            :key="cat.id"
            type="button"
            @click="handleCategoryTap(cat.name)"
            class="category-card bg-sand-surface hover:bg-matcha-50 border border-sand-border/70 hover:border-matcha-300 text-stone-dark transition-all group btn-tactile active:scale-95 shadow-xs"
          >
            <div
              class="category-card-icon flex items-center justify-center shrink-0 border border-black/5"
              :style="{ backgroundColor: cat.bgLight, color: cat.color }"
            >
              <CategoryIcon :category="cat.name" :size="16" />
            </div>
            <div class="min-w-0 w-full">
              <div class="category-card-label font-bold truncate leading-tight group-hover:text-matcha-deep">
                {{ cat.name }}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Speed Numeric Keypad (Hidden while note input is focused so keyboard takes bottom space) -->
    <div
      v-show="!isNoteFocused"
      class="mt-auto pt-1 sm:pt-2 grid grid-cols-4 gap-1 sm:gap-2 select-none touch-manipulation"
    >
      <!-- Row 1 -->
      <button
        type="button"
        @pointerdown="triggerKey(() => handleDigit('1'), $event)"
        @click="triggerKey(() => handleDigit('1'), $event)"
        class="numpad-key rounded-xl sm:rounded-2xl bg-sand-card text-stone-dark font-extrabold text-lg sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-xs btn-tactile flex items-center justify-center select-none touch-manipulation"
      >
        1
      </button>
      <button
        type="button"
        @pointerdown="triggerKey(() => handleDigit('2'), $event)"
        @click="triggerKey(() => handleDigit('2'), $event)"
        class="numpad-key rounded-xl sm:rounded-2xl bg-sand-card text-stone-dark font-extrabold text-lg sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-xs btn-tactile flex items-center justify-center select-none touch-manipulation"
      >
        2
      </button>
      <button
        type="button"
        @pointerdown="triggerKey(() => handleDigit('3'), $event)"
        @click="triggerKey(() => handleDigit('3'), $event)"
        class="numpad-key rounded-xl sm:rounded-2xl bg-sand-card text-stone-dark font-extrabold text-lg sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-xs btn-tactile flex items-center justify-center select-none touch-manipulation"
      >
        3
      </button>
      <button
        type="button"
        @pointerdown="triggerKey(handleBackspace, $event)"
        @click="triggerKey(handleBackspace, $event)"
        title="Hapus Digit Terakhir"
        class="numpad-key rounded-xl sm:rounded-2xl bg-sand-surface text-stone-warm font-bold text-xs border border-sand-border hover:text-stone-dark flex items-center justify-center shadow-xs btn-tactile select-none touch-manipulation"
      >
        <Delete :size="18" class="sm:w-5 sm:h-5" />
      </button>

      <!-- Row 2 -->
      <button
        type="button"
        @pointerdown="triggerKey(() => handleDigit('4'), $event)"
        @click="triggerKey(() => handleDigit('4'), $event)"
        class="numpad-key rounded-xl sm:rounded-2xl bg-sand-card text-stone-dark font-extrabold text-lg sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-xs btn-tactile flex items-center justify-center select-none touch-manipulation"
      >
        4
      </button>
      <button
        type="button"
        @pointerdown="triggerKey(() => handleDigit('5'), $event)"
        @click="triggerKey(() => handleDigit('5'), $event)"
        class="numpad-key rounded-xl sm:rounded-2xl bg-sand-card text-stone-dark font-extrabold text-lg sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-xs btn-tactile flex items-center justify-center select-none touch-manipulation"
      >
        5
      </button>
      <button
        type="button"
        @pointerdown="triggerKey(() => handleDigit('6'), $event)"
        @click="triggerKey(() => handleDigit('6'), $event)"
        class="numpad-key rounded-xl sm:rounded-2xl bg-sand-card text-stone-dark font-extrabold text-lg sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-xs btn-tactile flex items-center justify-center select-none touch-manipulation"
      >
        6
      </button>
      <button
        type="button"
        @pointerdown="triggerKey(handleClear, $event)"
        @click="triggerKey(handleClear, $event)"
        title="Reset Nominal"
        class="numpad-key rounded-xl sm:rounded-2xl bg-sand-surface text-stone-warm font-bold text-xs border border-sand-border hover:text-stone-dark flex items-center justify-center shadow-xs btn-tactile select-none touch-manipulation"
      >
        <RotateCcw :size="17" class="sm:w-[19px] sm:h-[19px]" />
      </button>

      <!-- Row 3 -->
      <button
        type="button"
        @pointerdown="triggerKey(() => handleDigit('7'), $event)"
        @click="triggerKey(() => handleDigit('7'), $event)"
        class="numpad-key rounded-xl sm:rounded-2xl bg-sand-card text-stone-dark font-extrabold text-lg sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-xs btn-tactile flex items-center justify-center select-none touch-manipulation"
      >
        7
      </button>
      <button
        type="button"
        @pointerdown="triggerKey(() => handleDigit('8'), $event)"
        @click="triggerKey(() => handleDigit('8'), $event)"
        class="numpad-key rounded-xl sm:rounded-2xl bg-sand-card text-stone-dark font-extrabold text-lg sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-xs btn-tactile flex items-center justify-center select-none touch-manipulation"
      >
        8
      </button>
      <button
        type="button"
        @pointerdown="triggerKey(() => handleDigit('9'), $event)"
        @click="triggerKey(() => handleDigit('9'), $event)"
        class="numpad-key rounded-xl sm:rounded-2xl bg-sand-card text-stone-dark font-extrabold text-lg sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-xs btn-tactile flex items-center justify-center select-none touch-manipulation"
      >
        9
      </button>
      <!-- Single Enter (CornerDownLeft) spanning Row 3 & 4 -->
      <button
        type="button"
        @click="handleEnter"
        class="row-span-2 h-full numpad-enter rounded-xl sm:rounded-2xl bg-matcha-100 text-matcha-deep font-extrabold border border-matcha-200 hover:bg-matcha-200/80 flex items-center justify-center shadow-xs btn-tactile select-none touch-manipulation"
        title="Catatan (Enter)"
        aria-label="Catatan"
      >
        <CornerDownLeft :size="22" class="sm:w-6 sm:h-6" />
      </button>

      <!-- Row 4: Col 1 [ 000 ], Col 2 [ 0 ], Col 3 [ . ] -->
      <button
        type="button"
        @pointerdown="triggerKey(handleAddThousands, $event)"
        @click="triggerKey(handleAddThousands, $event)"
        title="Tambah Ribuan (000)"
        class="numpad-key rounded-xl sm:rounded-2xl bg-sand-card text-stone-dark font-extrabold text-sm sm:text-lg border border-sand-border hover:bg-sand-surface shadow-xs btn-tactile flex items-center justify-center select-none touch-manipulation"
      >
        000
      </button>
      <button
        type="button"
        @pointerdown="triggerKey(() => handleDigit('0'), $event)"
        @click="triggerKey(() => handleDigit('0'), $event)"
        class="numpad-key rounded-xl sm:rounded-2xl bg-sand-card text-stone-dark font-extrabold text-lg sm:text-2xl border border-sand-border hover:bg-sand-surface shadow-xs btn-tactile flex items-center justify-center select-none touch-manipulation"
      >
        0
      </button>
      <button
        type="button"
        @pointerdown="triggerKey(handleDot, $event)"
        @click="triggerKey(handleDot, $event)"
        title="Titik Desimal (.)"
        class="numpad-key rounded-xl sm:rounded-2xl bg-sand-card text-stone-dark font-black text-xl sm:text-3xl border border-sand-border hover:bg-sand-surface shadow-xs btn-tactile flex items-center justify-center select-none touch-manipulation pb-1"
      >
        .
      </button>
    </div>
  </div>
</template>
