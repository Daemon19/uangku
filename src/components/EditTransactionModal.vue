<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Transaction, PaymentType } from '@/db/types';
import { CATEGORIES } from '@/utils/categories';
import { formatRupiah } from '@/utils/currency';
import { toDateTimeLocalInput, fromDateTimeLocalInput } from '@/utils/date';
import CategoryIcon from './CategoryIcon.vue';
import { X, Wallet, CreditCard, Copy, Trash2, Calendar, Tag, FileText, Check } from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
  transaction: Transaction | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', payload: {
    id: number;
    amount: number;
    category: string;
    type: PaymentType;
    note?: string;
    timestamp: string;
  }): void;
  (e: 'duplicate', tx: Transaction): void;
  (e: 'delete', id: number): void;
}>();

const formAmount = ref<number>(0);
const formCategory = ref<string>('Makanan');
const formType = ref<PaymentType>('tunai');
const formNote = ref<string>('');
const formDateTime = ref<string>('');

// Reset / populate form whenever transaction changes or modal opens
watch(
  () => props.transaction,
  (newTx) => {
    if (newTx) {
      formAmount.value = newTx.amount;
      formCategory.value = newTx.category;
      formType.value = newTx.type;
      formNote.value = newTx.note || '';
      formDateTime.value = toDateTimeLocalInput(newTx.timestamp);
    }
  },
  { immediate: true }
);

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen && props.transaction) {
      formAmount.value = props.transaction.amount;
      formCategory.value = props.transaction.category;
      formType.value = props.transaction.type;
      formNote.value = props.transaction.note || '';
      formDateTime.value = toDateTimeLocalInput(props.transaction.timestamp);
    }
  }
);

const isFormValid = computed(() => {
  return formAmount.value > 0 && formCategory.value.trim().length > 0;
});

function handleSave() {
  if (!props.transaction?.id || !isFormValid.value) return;

  const newIsoTimestamp = fromDateTimeLocalInput(
    formDateTime.value,
    props.transaction.timestamp
  );

  emit('save', {
    id: props.transaction.id,
    amount: formAmount.value,
    category: formCategory.value,
    type: formType.value,
    note: formNote.value.trim() || undefined,
    timestamp: newIsoTimestamp,
  });
}

function handleDuplicate() {
  if (!props.transaction) return;
  emit('duplicate', {
    ...props.transaction,
    amount: formAmount.value,
    category: formCategory.value,
    type: formType.value,
    note: formNote.value.trim() || undefined,
  });
  emit('close');
}

function handleDelete() {
  if (!props.transaction?.id) return;
  emit('delete', props.transaction.id);
  emit('close');
}
</script>

<template>
  <div
    v-if="isOpen && transaction"
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-dark/50 backdrop-blur-sm animate-fadeIn"
    @click.self="emit('close')"
  >
    <div
      class="bg-sand-card w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-sand-border shadow-lifted overflow-hidden max-h-[92vh] flex flex-col animate-slideUp"
    >
      <!-- Header -->
      <div class="px-5 py-4 border-b border-sand-border flex items-center justify-between bg-sand-surface/60">
        <div>
          <h2 class="text-base font-bold text-stone-dark leading-tight">Edit Transaksi</h2>
          <p class="text-[11px] text-stone-warm">Ubah rincian atau kelola transaksi ini</p>
        </div>

        <button
          type="button"
          @click="emit('close')"
          class="p-1.5 rounded-lg text-stone-warm hover:text-stone-dark hover:bg-sand-surface transition-colors btn-tactile"
        >
          <X :size="18" />
        </button>
      </div>

      <!-- Form Body -->
      <form @submit.prevent="handleSave" class="p-5 overflow-y-auto space-y-4">
        <!-- Amount Input -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold uppercase tracking-wider text-stone-warm">
            Nominal
          </label>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-warm">
              Rp
            </span>
            <input
              v-model.number="formAmount"
              type="number"
              min="1"
              step="500"
              required
              class="w-full pl-11 pr-4 py-2.5 bg-sand-surface border border-sand-border rounded-xl text-base font-extrabold text-stone-dark focus:outline-none focus:border-matcha-deep focus:ring-1 focus:ring-matcha-deep transition-all font-mono"
            />
          </div>
          <p class="text-[11px] text-matcha-deep font-bold pl-1">
            {{ formatRupiah(formAmount || 0) }}
          </p>
        </div>

        <!-- Note Input (moved under Amount) -->
        <div class="space-y-1.5">
          <label class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-warm">
            <FileText :size="13" />
            Catatan
          </label>
          <input
            v-model="formNote"
            type="text"
            maxlength="100"
            placeholder="kopi allegre"
            class="w-full px-3.5 py-2.5 bg-sand-surface border border-sand-border rounded-xl text-xs text-stone-dark placeholder:text-stone-muted focus:outline-none focus:border-matcha-deep focus:ring-1 focus:ring-matcha-deep transition-all"
          />
        </div>

        <!-- Payment Method Toggle -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold uppercase tracking-wider text-stone-warm">
            Pembayaran
          </label>
          <div class="grid grid-cols-2 gap-2 p-1 bg-sand-surface border border-sand-border rounded-xl">
            <button
              type="button"
              @click="formType = 'tunai'"
              class="flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all btn-tactile"
              :class="
                formType === 'tunai'
                  ? 'bg-amber-warm text-white shadow-sm'
                  : 'text-stone-warm hover:text-stone-dark'
              "
            >
              <Wallet :size="14" />
              Tunai
            </button>
            <button
              type="button"
              @click="formType = 'rekening'"
              class="flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all btn-tactile"
              :class="
                formType === 'rekening'
                  ? 'bg-matcha-deep text-white shadow-sm'
                  : 'text-stone-warm hover:text-stone-dark'
              "
            >
              <CreditCard :size="14" />
              Rekening
            </button>
          </div>
        </div>

        <!-- Date & Time Input -->
        <div class="space-y-1.5">
          <label class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-warm">
            <Calendar :size="13" />
            Tanggal & Jam
          </label>
          <input
            v-model="formDateTime"
            type="datetime-local"
            class="w-full px-3.5 py-2.5 bg-sand-surface border border-sand-border rounded-xl text-xs font-semibold text-stone-dark focus:outline-none focus:border-matcha-deep focus:ring-1 focus:ring-matcha-deep transition-all"
          />
        </div>

        <!-- Category Grid Selector -->
        <div class="space-y-1.5">
          <label class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-warm">
            <Tag :size="13" />
            Kategori
          </label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="cat in CATEGORIES"
              :key="cat.id"
              type="button"
              @click="formCategory = cat.name"
              class="flex items-center gap-2 p-2 rounded-xl border text-left transition-all btn-tactile"
              :class="
                formCategory.toLowerCase() === cat.name.toLowerCase()
                  ? 'border-matcha-deep bg-matcha-50 ring-1 ring-matcha-deep text-matcha-deep font-bold'
                  : 'border-sand-border bg-sand-surface text-stone-dark hover:border-sand-border/80'
              "
            >
              <div
                class="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs"
                :style="{ backgroundColor: cat.bgLight, color: cat.color }"
              >
                <CategoryIcon :category="cat.name" :size="12" />
              </div>
              <span class="text-[11px] truncate">{{ cat.name }}</span>
            </button>
          </div>
        </div>
      </form>

      <!-- Modal Footer & Secondary Actions -->
      <div class="p-4 border-t border-sand-border bg-sand-surface/60 space-y-2.5">
        <!-- Main Save Button -->
        <button
          type="button"
          :disabled="!isFormValid"
          @click="handleSave"
          class="w-full py-2.5 rounded-xl bg-matcha-deep text-white text-xs font-bold shadow-sm hover:bg-matcha-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 btn-tactile"
        >
          <Check :size="15" />
          Simpan Perubahan
        </button>

        <!-- Relocated Quick Actions: Duplicate & Delete -->
        <div class="grid grid-cols-2 gap-2 pt-1 border-t border-sand-border/70">
          <button
            type="button"
            @click="handleDuplicate"
            class="py-2 px-3 rounded-xl bg-sand-surface hover:bg-sand-border/50 border border-sand-border text-stone-dark text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors btn-tactile"
          >
            <Copy :size="14" class="text-matcha-deep" />
            Catat Ulang
          </button>

          <button
            type="button"
            @click="handleDelete"
            class="py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors btn-tactile"
          >
            <Trash2 :size="14" />
            Hapus
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
