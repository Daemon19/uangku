import { createApp } from 'vue';
import App from './App.vue';
import './style.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker with auto-update
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('UangKu updated. Reloading...');
  },
  onOfflineReady() {
    console.log('UangKu is ready for offline use.');
  },
});

createApp(App).mount('#app');
