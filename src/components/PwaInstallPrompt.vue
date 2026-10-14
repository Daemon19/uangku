<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Smartphone, Download, X, WifiOff } from 'lucide-vue-next';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
const isInstallable = ref(false);
const isDismissed = ref(false);
const isOffline = ref(!navigator.onLine);

function handleBeforeInstallPrompt(e: Event) {
  e.preventDefault();
  deferredPrompt.value = e as BeforeInstallPromptEvent;
  // Check if previously dismissed in this session
  if (!sessionStorage.getItem('uangku_install_dismissed')) {
    isInstallable.value = true;
  }
}

async function triggerInstall() {
  if (!deferredPrompt.value) return;
  await deferredPrompt.value.prompt();
  const choice = await deferredPrompt.value.userChoice;
  if (choice.outcome === 'accepted') {
    isInstallable.value = false;
  }
  deferredPrompt.value = null;
}

function dismissInstall() {
  isInstallable.value = false;
  isDismissed.value = true;
  sessionStorage.setItem('uangku_install_dismissed', 'true');
}

function updateOnlineStatus() {
  isOffline.value = !navigator.onLine;
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
});

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.removeEventListener('online', updateOnlineStatus);
  window.removeEventListener('offline', updateOnlineStatus);
});
</script>

<template>
  <div>
    <!-- Offline status banner if device is offline -->
    <div
      v-if="isOffline"
      class="bg-amber-warm text-white px-3 py-1.5 text-center text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm sticky top-0 z-30"
    >
      <WifiOff :size="14" />
      <span>Mode Offline Aktif — Data tersimpan aman di perangkat Anda.</span>
    </div>

    <!-- PWA Install Prompt Banner -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-y-8 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform translate-y-8 opacity-0"
    >
      <div
        v-if="isInstallable && !isDismissed"
        class="fixed bottom-24 left-4 right-4 max-w-sm mx-auto z-40 bg-sand-card border border-matcha-300/80 rounded-2xl p-3 shadow-lifted flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-9 h-9 rounded-xl bg-matcha-deep text-white flex items-center justify-center shrink-0">
            <Smartphone :size="18" class="text-amber-light" />
          </div>
          <div class="min-w-0">
            <div class="text-xs font-bold text-stone-dark leading-tight">Pasang UangKu</div>
            <div class="text-[10px] text-stone-warm truncate">Akses instan dari layar utama HP Anda</div>
          </div>
        </div>

        <div class="flex items-center gap-1 shrink-0">
          <button
            type="button"
            @click="triggerInstall"
            class="px-2.5 py-1.5 rounded-xl bg-matcha-deep text-white text-xs font-bold shadow-sm hover:bg-matcha-dark transition-colors btn-tactile flex items-center gap-1"
          >
            <Download :size="13" />
            <span>Pasang</span>
          </button>
          <button
            type="button"
            @click="dismissInstall"
            class="p-1.5 rounded-lg text-stone-warm hover:text-stone-dark transition-colors"
          >
            <X :size="15" />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
