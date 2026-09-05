<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onUpdateState } from '@/pwa'
import { useSessionStore } from '@/stores/session'

const updateReady = ref(false)
const offlineReady = ref(false)
const dismissed = ref(false)
const session = useSessionStore()

const isSessionActive = computed(() => session.isPlaying)

const visible = computed(() => updateReady.value && !dismissed.value)

function applyNow() {
  if (isSessionActive.value) return
  window.dispatchEvent(new CustomEvent('bt:apply-update'))
}

function deferToAfterSession() {
  dismissed.value = true
}

function dismiss() {
  dismissed.value = true
}

onMounted(() => {
  const off = onUpdateState((s) => {
    updateReady.value = s.updateReady
    offlineReady.value = s.offlineReady
  })
  onUnmounted(off)
})
</script>

<template>
  <div v-if="visible" class="update-toast" role="status" aria-live="polite">
    <div class="update-toast__body">
      <p class="update-toast__title">Update ready</p>
      <p class="update-toast__desc">
        A new version is available.
        <span v-if="isSessionActive"> It will apply when your session ends. </span>
      </p>
      <div class="update-toast__actions">
        <button
          v-if="!isSessionActive"
          type="button"
          class="btn-primary update-toast__btn"
          @click="applyNow"
        >
          Apply now
        </button>
        <button
          v-else
          type="button"
          class="btn-secondary update-toast__btn"
          @click="deferToAfterSession"
        >
          After session
        </button>
        <button type="button" class="btn-secondary update-toast__btn" @click="dismiss">
          Dismiss
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference '../style.css';

.update-toast {
  position: fixed;
  left: 1rem;
  right: 1rem;
  bottom: calc(1rem + env(safe-area-inset-bottom));
  z-index: 50;
  pointer-events: none;
}

.update-toast__body {
  pointer-events: auto;
  max-width: 32rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-radius: 1rem;
  background-color: color-mix(in oklab, #0b0d10 92%, white 8%);
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.update-toast__title {
  @apply text-fg font-semibold;
}

.update-toast__desc {
  @apply text-muted text-sm leading-relaxed;
}

.update-toast__actions {
  @apply mt-1 flex flex-wrap gap-2;
}

.update-toast__btn {
  @apply flex-1 min-w-[6rem];
}
</style>
