<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import confetti from 'canvas-confetti';
import type { Transaction, TimeFilter, PaymentType } from '@/db/types';
import { db, addTransaction, deleteTransaction, updateTransaction, seedSampleData } from '@/db';
import { useLiveQuery } from '@/composables/useLiveQuery';
import { useAudioFeedback } from '@/composables/useAudioFeedback';
import { filterTransactionsByTime } from '@/utils/date';
import { formatRupiah } from '@/utils/currency';

// Components
import HeaderSummary from '@/components/HeaderSummary.vue';
import ActivityStream from '@/components/ActivityStream.vue';
import ControlCenter from '@/components/ControlCenter.vue';
import BottomNavbar from '@/components/BottomNavbar.vue';
import AnalyticsModal from '@/components/AnalyticsModal.vue';
import ExportModal from '@/components/ExportModal.vue';
import EditTransactionModal from '@/components/EditTransactionModal.vue';
import ToastNotification from '@/components/ToastNotification.vue';
import PwaInstallPrompt from '@/components/PwaInstallPrompt.vue';

const { triggerSuccess } = useAudioFeedback();

// Filter State: defaults to 'today'
const currentFilter = ref<TimeFilter>('today');

// Input Pane slide-up state: opened by default upon app launch
const isInputPaneOpen = ref(true);

const mainScrollContainer = ref<HTMLElement | null>(null);

function scrollToTop() {
  if (mainScrollContainer.value) {
    mainScrollContainer.value.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Live Query for all transactions from Dexie (reactive, updates instantly!)
const allTransactions = useLiveQuery(
  () => db.transactions.reverse().toArray(),
  []
);

// Filtered transactions based on time filter
const displayedTransactions = computed(() => {
  return filterTransactionsByTime(allTransactions.value, currentFilter.value);
});

// Modals
const isAnalyticsOpen = ref(false);
const isExportOpen = ref(false);
const editingTransaction = ref<Transaction | null>(null);
const isEditModalOpen = ref(false);

function handleSelectTransaction(tx: Transaction) {
  editingTransaction.value = tx;
  isEditModalOpen.value = true;
}

function handleCloseEditModal() {
  isEditModalOpen.value = false;
  editingTransaction.value = null;
}

// Toast Feedback
const toast = ref<{
  show: boolean;
  message: string;
  type: 'info' | 'warning' | 'success';
}>({
  show: false,
  message: '',
  type: 'info',
});

let toastTimeout: ReturnType<typeof setTimeout> | null = null;

function showToast(message: string, type: 'info' | 'warning' | 'success' = 'info') {
  if (toastTimeout) clearTimeout(toastTimeout);
  toast.value = { show: true, message, type };
  toastTimeout = setTimeout(() => {
    toast.value.show = false;
  }, 2600);
}

// Log new expense (from Speed Numpad or Smart NLP parser)
async function handleLogExpense(payload: {
  amount: number;
  category: string;
  type: PaymentType;
  note?: string;
}) {
  try {
    await addTransaction({
      amount: payload.amount,
      category: payload.category,
      type: payload.type,
      note: payload.note,
      timestamp: new Date().toISOString(),
    });

    // Play instant audio chime
    triggerSuccess();

    // Trigger subtle confetti burst if amount >= 100k
    if (payload.amount >= 100000) {
      try {
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.85 },
          colors: ['#2D4A3E', '#D97706', '#E1EDE6'],
        });
      } catch {
        // Ignore confetti if not supported
      }
    }

    showToast(`Tercatat: ${formatRupiah(payload.amount)} (${payload.category})`, 'success');
  } catch (err) {
    console.error('Failed to log transaction:', err);
    showToast('Gagal menyimpan transaksi', 'warning');
  }
}

// Duplicate / Re-log an existing transaction
async function handleDuplicate(tx: Transaction) {
  try {
    await addTransaction({
      amount: tx.amount,
      category: tx.category,
      type: tx.type,
      note: tx.note,
      timestamp: new Date().toISOString(),
    });

    triggerSuccess();
    showToast(`Dicatat ulang: ${formatRupiah(tx.amount)} (${tx.category})`, 'success');
  } catch (err) {
    console.error('Failed to duplicate transaction:', err);
    showToast('Gagal mencatat ulang', 'warning');
  }
}

// Delete transaction
async function handleDelete(id: number) {
  try {
    await deleteTransaction(id);
    showToast('Transaksi dihapus', 'info');
  } catch (err) {
    console.error('Failed to delete transaction:', err);
    showToast('Gagal menghapus transaksi', 'warning');
  }
}

// Update existing transaction
async function handleSaveTransaction(payload: {
  id: number;
  amount: number;
  category: string;
  type: PaymentType;
  note?: string;
  timestamp: string;
}) {
  try {
    await updateTransaction(payload.id, {
      amount: payload.amount,
      category: payload.category,
      type: payload.type,
      note: payload.note,
      timestamp: payload.timestamp,
    });

    triggerSuccess();
    handleCloseEditModal();
    showToast('Perubahan transaksi disimpan', 'success');
  } catch (err) {
    console.error('Failed to update transaction:', err);
    showToast('Gagal menyimpan perubahan', 'warning');
  }
}

// Initial onboarding check: if first visit ever, load sample data so app isn't blank
onMounted(async () => {
  try {
    const count = await db.transactions.count();
    const hasInitialized = localStorage.getItem('uangku_first_init');
    if (count === 0 && !hasInitialized) {
      localStorage.setItem('uangku_first_init', 'true');
      await seedSampleData();
    }
  } catch (err) {
    console.debug('Init check error:', err);
  }
});
</script>

<template>
  <div class="min-h-screen bg-sand-bg text-stone-dark flex justify-center">
    <!-- Mobile App Container Shell -->
    <div class="w-full max-w-md min-h-screen bg-sand-bg relative flex flex-col shadow-2xl border-x border-sand-border/40">
      <!-- PWA Offline & Install Prompt -->
      <PwaInstallPrompt />

      <!-- Top Summary Header -->
      <HeaderSummary
        :transactions="displayedTransactions"
        :current-filter="currentFilter"
        @update:filter="currentFilter = $event"
        @open-analytics="isAnalyticsOpen = true"
        @open-export="isExportOpen = true"
      />

      <!-- Main Activity Feed Stream -->
      <main ref="mainScrollContainer" class="flex-1 overflow-y-auto">
        <ActivityStream
          :transactions="displayedTransactions"
          @select="handleSelectTransaction"
        />
      </main>

      <!-- Bottom Navigation Bar with (+) in Center -->
      <BottomNavbar
        @open-input="isInputPaneOpen = true"
        @open-analytics="isAnalyticsOpen = true"
        @scroll-top="scrollToTop"
      />

      <!-- Full-View Slide-Up Input Pane (Speed Numpad & Smart NLP) -->
      <ControlCenter
        :is-open="isInputPaneOpen"
        @close="isInputPaneOpen = false"
        @log-expense="handleLogExpense"
        @toast="showToast"
      />

      <!-- Modals -->
      <EditTransactionModal
        :is-open="isEditModalOpen"
        :transaction="editingTransaction"
        @close="handleCloseEditModal"
        @save="handleSaveTransaction"
        @duplicate="handleDuplicate"
        @delete="handleDelete"
      />

      <AnalyticsModal
        :is-open="isAnalyticsOpen"
        :transactions="displayedTransactions"
        @close="isAnalyticsOpen = false"
      />

      <ExportModal
        :is-open="isExportOpen"
        :transactions="allTransactions"
        @close="isExportOpen = false"
        @toast="showToast"
      />

      <!-- Toast Notification -->
      <ToastNotification
        :show="toast.show"
        :message="toast.message"
        :type="toast.type"
      />
    </div>
  </div>
</template>
