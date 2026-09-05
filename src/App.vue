<script setup lang="ts">
import { RouterView } from 'vue-router'
import UpdateToast from '@/components/UpdateToast.vue'
import { useThemeStore } from '@/stores/theme'

// Initialize theme (applies data-theme on documentElement via the store).
useThemeStore()
</script>

<template>
  <div class="app-shell">
    <RouterView />
    <UpdateToast />
  </div>
</template>

<style scoped>
@reference './style.css';

.app-shell {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background-color: rgb(var(--color-bg));
  color: rgb(var(--color-fg));
  font-family: var(--font-system);
  /* Respect iOS safe-area insets */
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
</style>
