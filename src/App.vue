<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterView } from 'vue-router'
import UpdateToast from '@/components/UpdateToast.vue'
import AuraLogo from '@/components/AuraLogo.vue'
import InstallPrompt from '@/components/InstallPrompt.vue'
import { useThemeStore } from '@/stores/theme'
import { useSessionStore } from '@/stores/session'

// Initialize theme (applies data-theme on documentElement via the store).
useThemeStore()

const session = useSessionStore()
const showSplash = ref(false)
const splashFading = ref(false)

onMounted(() => {
  // Apply any shared presets from the URL hash (e.g. #band=alpha&noise=pink…).
  session.applyUrlParams()

  showSplash.value = true
  window.setTimeout(() => {
    splashFading.value = true
  }, 1200)
  window.setTimeout(() => {
    showSplash.value = false
  }, 1700)
})
</script>

<template>
  <div class="app-shell">
    <RouterView />
    <UpdateToast />
    <InstallPrompt />

    <!-- Startup splash: animated Aura logo -->
    <Transition name="splash">
      <div
        v-if="showSplash"
        class="splash"
        :class="{ 'splash--fading': splashFading }"
        aria-hidden="true"
      >
        <div class="splash__ring">
          <AuraLogo :size="84" animated />
        </div>
        <p class="splash__name">Aura</p>
        <p class="splash__tag">Binaural Therapy</p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
@reference './style.css';

.app-shell {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg);
  color: var(--color-fg);
  font-family: var(--font-system);
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

.splash {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: var(--color-bg);
  transition: opacity 0.5s ease;
}
.splash--fading {
  opacity: 0;
}
.splash__name {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.splash__tag {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-muted);
}
.splash-enter-active {
  transition: opacity 0.2s ease;
}
.splash-enter-from,
.splash-leave-to {
  opacity: 0;
}
</style>
