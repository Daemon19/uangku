<script setup lang="ts">
import { ref } from 'vue';
import type { Transaction } from '@/db/types';
import { exportToCsv, exportToJson } from '@/utils/csv';
import { seedSampleData, clearAllData, db } from '@/db';
import {
  X,
  FileSpreadsheet,
  FileJson,
  Upload,
  Sparkles,
  Trash2,
  Database,
  CheckCircle2,
} from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
  transactions: Transaction[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'toast', message: string, type?: 'info' | 'warning' | 'success'): void;
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);

function handleDownloadCsv() {
  if (props.transactions.length === 0) {
    emit('toast', 'Belum ada data transaksi untuk diekspor', 'warning');
    return;
  }
  exportToCsv(props.transactions);
  emit('toast', 'File CSV berhasil diunduh', 'success');
}

function handleDownloadJson() {
  if (props.transactions.length === 0) {
    emit('toast', 'Belum ada data untuk dicadangkan', 'warning');
    return;
  }
  exportToJson(props.transactions);
  emit('toast', 'Cadangan JSON berhasil diunduh', 'success');
}

function triggerFileInput() {
  fileInputRef.value?.click();
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (Array.isArray(data) && data.length > 0) {
      // Clean and sanitize items
      const validItems: Omit<Transaction, 'id'>[] = data.map((item: any) => ({
        amount: Number(item.amount) || 0,
        category: String(item.category || 'Lainnya'),
        type: item.type === 'rekening' ? 'rekening' : 'tunai',
        note: item.note ? String(item.note) : undefined,
        timestamp: item.timestamp || new Date().toISOString(),
      }));

      await db.transactions.bulkAdd(validItems);
      emit('toast', `Berhasil memulihkan ${validItems.length} transaksi`, 'success');
      emit('close');
    } else {
      emit('toast', 'Format data cadangan tidak valid', 'warning');
    }
  } catch (err) {
    console.error('Import error:', err);
    emit('toast', 'Gagal membaca file JSON', 'warning');
  } finally {
    if (target) target.value = '';
  }
}

async function handleSeedSample() {
  try {
    await seedSampleData();
    emit('toast', 'Data contoh berhasil dimuat!', 'success');
    emit('close');
  } catch (err) {
    console.error('Seed error:', err);
    emit('toast', 'Gagal memuat data contoh', 'warning');
  }
}

async function handleResetData() {
  const confirm = window.confirm('Apakah Anda yakin ingin menghapus seluruh data transaksi? Tindakan ini tidak dapat dibatalkan.');
  if (confirm) {
    try {
      await clearAllData();
      emit('toast', 'Seluruh data telah dibersihkan', 'info');
      emit('close');
    } catch (err) {
      console.error('Reset error:', err);
    }
  }
}
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
            <Database :size="16" />
          </div>
          <div>
            <h2 class="text-base font-bold text-stone-dark leading-tight">Pengaturan & Ekspor Data</h2>
            <p class="text-[11px] text-stone-warm">Penyimpanan offline lokal IndexedDB</p>
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
        <!-- Section: Ekspor Data -->
        <div class="space-y-2">
          <h3 class="text-xs font-bold uppercase tracking-wider text-stone-warm">
            Ekspor & Cadangan
          </h3>

          <div class="grid grid-cols-2 gap-2">
            <!-- CSV Download Button -->
            <button
              type="button"
              @click="handleDownloadCsv"
              class="p-3 rounded-2xl bg-sand-surface border border-sand-border hover:border-matcha-deep/50 hover:bg-matcha-50/50 transition-all text-left group btn-tactile flex flex-col gap-1.5"
            >
              <div class="w-8 h-8 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
                <FileSpreadsheet :size="16" />
              </div>
              <div>
                <div class="text-xs font-bold text-stone-dark group-hover:text-matcha-deep">Unduh CSV</div>
                <div class="text-[10px] text-stone-warm">Untuk Excel / Google Sheets</div>
              </div>
            </button>

            <!-- JSON Backup Button -->
            <button
              type="button"
              @click="handleDownloadJson"
              class="p-3 rounded-2xl bg-sand-surface border border-sand-border hover:border-matcha-deep/50 hover:bg-matcha-50/50 transition-all text-left group btn-tactile flex flex-col gap-1.5"
            >
              <div class="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <FileJson :size="16" />
              </div>
              <div>
                <div class="text-xs font-bold text-stone-dark group-hover:text-matcha-deep">Cadangan JSON</div>
                <div class="text-[10px] text-stone-warm">Simpan berkas data utuh</div>
              </div>
            </button>
          </div>
        </div>

        <!-- Section: Pulihkan Data -->
        <div class="space-y-2">
          <h3 class="text-xs font-bold uppercase tracking-wider text-stone-warm">
            Pulihkan & Data Contoh
          </h3>

          <!-- Hidden file input for import -->
          <input
            ref="fileInputRef"
            type="file"
            accept=".json,application/json"
            class="hidden"
            @change="handleFileUpload"
          />

          <button
            type="button"
            @click="triggerFileInput"
            class="w-full p-3 rounded-2xl bg-sand-surface border border-sand-border hover:bg-sand-border/40 transition-all flex items-center justify-between text-left btn-tactile"
          >
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Upload :size="16" />
              </div>
              <div>
                <div class="text-xs font-bold text-stone-dark">Pulihkan Berkas JSON</div>
                <div class="text-[10px] text-stone-warm">Muat kembali transaksi dari cadangan</div>
              </div>
            </div>
          </button>

          <button
            type="button"
            @click="handleSeedSample"
            class="w-full p-3 rounded-2xl bg-sand-surface border border-sand-border hover:bg-matcha-50/50 hover:border-matcha-300 transition-all flex items-center justify-between text-left btn-tactile"
          >
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-amber-light text-amber-warm flex items-center justify-center shrink-0">
                <Sparkles :size="16" />
              </div>
              <div>
                <div class="text-xs font-bold text-stone-dark">Muat Data Contoh Rupiah</div>
                <div class="text-[10px] text-stone-warm">Isi contoh pengeluaran kopi, bensin, dll.</div>
              </div>
            </div>
          </button>
        </div>

        <!-- Section: Reset / Bahaya -->
        <div class="pt-2 border-t border-sand-border">
          <button
            type="button"
            @click="handleResetData"
            class="w-full p-2.5 rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 btn-tactile"
          >
            <Trash2 :size="14" />
            <span>Kosongkan Seluruh Data Transaksi</span>
          </button>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="p-4 border-t border-sand-border bg-sand-surface/60">
        <button
          type="button"
          @click="emit('close')"
          class="w-full py-2.5 rounded-xl bg-matcha-deep text-white text-xs font-bold shadow-sm hover:bg-matcha-dark transition-colors btn-tactile"
        >
          Selesai
        </button>
      </div>
    </div>
  </div>
</template>
