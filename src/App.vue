<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterView } from 'vue-router'
import UpdateToast from '@/components/UpdateToast.vue'
import AuraLogo from '@/components/AuraLogo.vue'
import InstallPrompt from '@/components/InstallPrompt.vue'
import { useThemeStore } from '@/stores/theme'
import { useSessionStore } from '@/stores/session'
import { useAudioEngine } from '@/audio/engine'

// Initialize theme (applies data-theme on documentElement via the store).
useThemeStore()

const session = useSessionStore()
const engine = useAudioEngine()
const showSplash = ref(false)
const splashFading = ref(false)

let introPlayed = false
function playIntroOnFirstTap() {
  if (introPlayed) return
  introPlayed = true
  engine.unlock()
  engine.playIntro()
}

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

  ;['pointerdown', 'touchstart'].forEach((ev) =>
    window.addEventListener(ev, playIntroOnFirstTap, { once: false }),
  )
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
          <div class="splash__glow"></div>
          <AuraLogo :size="105" animated />
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
  color: #e8ebef;
  background:
    radial-gradient(120% 100% at 50% 30%, #141926 0%, #0b0d10 70%),
    linear-gradient(180deg, #0b0d10, #0b0d10);
  transition: opacity 0.6s ease;
}
.splash--fading {
  opacity: 0;
}
.splash__ring {
  position: relative;
  display: grid;
  place-items: center;
}
.splash__glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 190px;
  height: 190px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    color-mix(in oklab, var(--color-accent) 45%, transparent) 0%,
    transparent 70%
  );
  filter: blur(8px);
}
.splash__name {
  margin: 0;
  font-size: 1.7rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #e8ebef;
}
.splash__tag {
  margin: 0;
  font-size: 0.85rem;
  color: color-mix(in oklab, var(--color-accent) 80%, #fff);
}
.splash-enter-active {
  transition: opacity 0.2s ease;
}
.splash-enter-from,
.splash-leave-to {
  opacity: 0;
}
</style>
