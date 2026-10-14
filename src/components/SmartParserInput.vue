<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { PaymentType } from '@/db/types';
import { parseSmartExpense } from '@/utils/nlpParser';
import { formatRupiah } from '@/utils/currency';
import { CATEGORIES, getCategoryByName } from '@/utils/categories';
import { getPreferredPayment } from '@/db';
import { useAudioFeedback } from '@/composables/useAudioFeedback';
import CategoryIcon from './CategoryIcon.vue';
import {
  Sparkles,
  CornerDownLeft,
  Wallet,
  CreditCard,
  CheckCircle2,
  HelpCircle,
} from 'lucide-vue-next';

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

const inputText = ref('');
const manualCategory = ref<string | null>(null);
const manualPayment = ref<PaymentType | null>(null);

// Parsed result from input text
const parsed = computed(() => {
  return parseSmartExpense(inputText.value);
});

// Category to display (manual override or NLP parsed)
const activeCategory = computed(() => {
  return manualCategory.value || parsed.value.category;
});

// Payment to display
const activePayment = ref<PaymentType>('tunai');

// Watch parsed category/type to auto-update preferred payment if not manually set
watch(
  [() => parsed.value.type, () => activeCategory.value],
  async ([detectedType, catName]) => {
    if (manualPayment.value) {
      activePayment.value = manualPayment.value;
      return;
    }
    if (detectedType) {
      activePayment.value = detectedType;
    } else {
      const preferred = await getPreferredPayment(catName);
      activePayment.value = preferred;
    }
  },
  { immediate: true }
);

function togglePayment() {
  triggerKeypress();
  const next = activePayment.value === 'tunai' ? 'rekening' : 'tunai';
  manualPayment.value = next;
  activePayment.value = next;
}

function selectCategory(catName: string) {
  triggerKeypress();
  manualCategory.value = catName;
}

function handleExample(exampleText: string) {
  triggerKeypress();
  inputText.value = exampleText;
  manualCategory.value = null;
  manualPayment.value = null;
}

function handleSubmit() {
  if (parsed.value.amount <= 0) {
    emit('toast', 'Masukkan nominal dalam teks (misal: 25rb atau 1,5jt)', 'warning');
    return;
  }

  emit('log-expense', {
    amount: parsed.value.amount,
    category: activeCategory.value,
    type: activePayment.value,
    note: parsed.value.note || undefined,
  });

  // Reset
  inputText.value = '';
  manualCategory.value = null;
  manualPayment.value = null;
}
</script>

<template>
  <div class="bg-sand-card border-t border-sand-border/80 shadow-[0_-8px_25px_rgba(45,74,62,0.08)] p-3.5 space-y-3">
    <!-- Freeform NLP Input Field -->
    <div class="relative">
      <textarea
        v-model="inputText"
        @keydown.enter.prevent="handleSubmit"
        rows="2"
        placeholder="Ketik bebas: '25rb makan siang cash warung bu tetty' atau '1,5jt tagihan bca'..."
        class="w-full p-3 pr-10 text-xs sm:text-sm bg-sand-surface border border-sand-border rounded-2xl text-stone-dark placeholder:text-stone-muted focus:outline-none focus:border-matcha-deep focus:ring-1 focus:ring-matcha-deep resize-none shadow-inner"
      ></textarea>

      <button
        type="button"
        @click="handleSubmit"
        :disabled="parsed.amount <= 0"
        title="Catat Sekarang (Enter)"
        class="absolute right-2.5 bottom-3.5 p-2 rounded-xl bg-matcha-deep text-white disabled:opacity-40 disabled:pointer-events-none hover:bg-matcha-dark transition-all shadow-sm btn-tactile"
      >
        <CornerDownLeft :size="16" />
      </button>
    </div>

    <!-- Real-time Live Parsed Preview Card -->
    <div
      v-if="inputText.trim().length > 0"
      class="bg-sand-surface rounded-2xl p-3 border border-matcha-200/80 shadow-sm transition-all animate-fadeIn"
    >
      <div class="flex items-center justify-between mb-2">
        <span class="text-[10px] font-bold uppercase tracking-wider text-matcha-deep flex items-center gap-1">
          <Sparkles :size="12" class="text-amber-warm" />
          Hasil Deteksi Otomatis:
        </span>
        <span class="text-[10px] text-stone-muted">Tekan Enter untuk Catat</span>
      </div>

      <!-- Detection Chips -->
      <div class="flex items-center gap-1.5 flex-wrap">
        <!-- Nominal Badge -->
        <span
          class="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl"
          :class="parsed.amount > 0 ? 'bg-matcha-deep text-white shadow-sm' : 'bg-sand-border text-stone-warm'"
        >
          {{ parsed.amount > 0 ? formatRupiah(parsed.amount) : 'Belum ada nominal' }}
        </span>

        <!-- Category Badge (interactive) -->
        <button
          type="button"
          class="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl bg-matcha-100 text-matcha-deep border border-matcha-200 hover:bg-matcha-200 transition-colors btn-tactile"
          title="Klik untuk ganti kategori"
        >
          <CategoryIcon :category="activeCategory" :size="13" />
          <span>{{ activeCategory }}</span>
        </button>

        <!-- Payment Badge (interactive toggle) -->
        <button
          type="button"
          @click="togglePayment"
          class="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl border transition-colors btn-tactile"
          :class="activePayment === 'tunai'
            ? 'bg-amber-subtle text-amber-warm border-amber-light'
            : 'bg-blue-50 text-blue-700 border-blue-200'"
          title="Klik untuk ubah metode pembayaran"
        >
          <Wallet v-if="activePayment === 'tunai'" :size="12" />
          <CreditCard v-else :size="12" />
          <span>{{ activePayment === 'tunai' ? 'Tunai' : 'Rekening' }}</span>
        </button>
      </div>

      <!-- Note Memo Preview -->
      <div v-if="parsed.note" class="text-xs text-stone-warm mt-2 pt-2 border-t border-sand-border/60 flex items-baseline gap-1">
        <span class="font-semibold text-stone-dark">Catatan:</span>
        <span class="italic text-stone-dark">"{{ parsed.note }}"</span>
      </div>
    </div>

    <!-- Quick Examples if empty -->
    <div v-else class="text-[11px] text-stone-warm space-y-1">
      <div class="font-semibold text-stone-dark flex items-center gap-1">
        <HelpCircle :size="12" class="text-matcha-500" />
        Contoh format yang dipahami:
      </div>
      <div class="flex flex-wrap gap-1.5">
        <button
          type="button"
          @click="handleExample('25rb makan siang cash warung bu tetty')"
          class="text-[10px] bg-sand-surface hover:bg-sand-border/60 text-stone-dark px-2 py-1 rounded-lg border border-sand-border transition-colors text-left"
        >
          "25rb makan siang cash warung bu tetty"
        </button>
        <button
          type="button"
          @click="handleExample('1,5jt tagihan listrik bca')"
          class="text-[10px] bg-sand-surface hover:bg-sand-border/60 text-stone-dark px-2 py-1 rounded-lg border border-sand-border transition-colors text-left"
        >
          "1,5jt tagihan listrik bca"
        </button>
        <button
          type="button"
          @click="handleExample('50k bensin gojek pertalite')"
          class="text-[10px] bg-sand-surface hover:bg-sand-border/60 text-stone-dark px-2 py-1 rounded-lg border border-sand-border transition-colors text-left"
        >
          "50k bensin gojek pertalite"
        </button>
      </div>
    </div>
  </div>
</template>
