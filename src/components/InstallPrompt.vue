<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const show = ref(false)
const dismissed = ref(false)

const isStandalone =
  typeof window !== 'undefined' &&
  ((window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true)

const isIOS =
  typeof navigator !== 'undefined' &&
  /iPhone|iPad|iPod/.test(navigator.userAgent) &&
  !(navigator as Navigator & { standalone?: boolean }).standalone

// Only show for iOS Safari, in browser (non-standalone) mode.
const shouldShow = computed(() => !dismissed.value && isIOS && !isStandalone && show.value)

function dismiss() {
  dismissed.value = true
}

onMounted(() => {
  window.setTimeout(() => {
    if (!isStandalone) show.value = true
  }, 1800)
})
</script>

<template>
  <Transition name="pop">
    <div
      v-if="shouldShow"
      class="ios-install"
      role="dialog"
      aria-modal="true"
      aria-label="Install Aura"
    >
      <div class="ios-install__card">
        <button type="button" class="ios-install__close" aria-label="Dismiss" @click="dismiss">
          ✕
        </button>
        <p class="ios-install__title">Install Aura on your Home Screen</p>
        <p class="ios-install__body">
          Aura works best as a standalone app — it can keep playing with the screen locked.
        </p>
        <ol class="ios-install__steps">
          <li>
            Tap the <strong>Share</strong> button
            <span class="ios-install__shareicon" aria-hidden="true">⤴</span> in Safari.
          </li>
          <li>Tap <strong>“Add to Home Screen”</strong>.</li>
          <li>Tap <strong>Add</strong> — then open Aura from your Home Screen.</li>
        </ol>
        <button type="button" class="btn-primary w-full" @click="dismiss">Got it</button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
@reference '../style.css';

.ios-install {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 1rem;
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.ios-install__card {
  position: relative;
  width: 100%;
  max-width: 26rem;
  border-radius: 1.25rem;
  background: var(--color-bg);
  border: 1px solid color-mix(in oklab, var(--color-fg) 14%, transparent);
  padding: 1.25rem;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}
.ios-install__close {
  position: absolute;
  top: 0.4rem;
  right: 0.6rem;
  min-height: 2rem;
  background: transparent;
  border: 0;
  color: var(--color-muted);
  font-size: 1.1rem;
}
.ios-install__title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 0.4rem 0;
}
.ios-install__body {
  margin: 0 0 0.75rem 0;
  color: var(--color-muted);
  font-size: 0.85rem;
  line-height: 1.4;
}
.ios-install__steps {
  margin: 0 0 1rem 0;
  padding-left: 1.125rem;
  color: var(--color-fg);
  font-size: 0.9rem;
  line-height: 1.6;
}
.ios-install__shareicon {
  font-size: 1rem;
  color: var(--color-accent);
}
.pop-enter-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
@media (prefers-reduced-motion: reduce) {
  .pop-enter-active,
  .pop-leave-active {
    transition: none;
  }
}
</style>
