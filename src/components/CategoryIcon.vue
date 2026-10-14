<script setup lang="ts">
import { computed } from 'vue';
import {
  Utensils,
  Car,
  Zap,
  ShoppingBag,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  Handshake,
  Package,
} from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    category: string;
    size?: number;
    class?: string;
  }>(),
  {
    size: 20,
    class: '',
  }
);

const iconComponent = computed(() => {
  const norm = props.category.toLowerCase();
  switch (norm) {
    case 'makanan':
      return Utensils;
    case 'transportasi':
      return Car;
    case 'tagihan':
      return Zap;
    case 'shopping':
      return ShoppingBag;
    case 'hiburan':
      return Gamepad2;
    case 'kesehatan':
      return HeartPulse;
    case 'edukasi':
      return GraduationCap;
    case 'hutang':
      return Handshake;
    case 'lainnya':
    default:
      return Package;
  }
});
</script>

<template>
  <component :is="iconComponent" :size="size" :class="props.class" />
</template>
