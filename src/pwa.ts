import { registerSW as viteRegisterSW } from 'virtual:pwa-register'

type UpdateState = {
  /** True when a new SW has been installed and is waiting to activate. */
  updateReady: boolean
  /** True when offline-ready. */
  offlineReady: boolean
  /** True when registration itself failed. */
  error: boolean
}

let state: UpdateState = {
  updateReady: false,
  offlineReady: false,
  error: false,
}

const listeners = new Set<(s: UpdateState) => void>()

function emit() {
  for (const l of listeners) l({ ...state })
}

export function onUpdateState(fn: (s: UpdateState) => void): () => void {
  listeners.add(fn)
  fn({ ...state })
  return () => listeners.delete(fn)
}

async function applyUpdate() {
  // Workbox exposes registration.waiting once a new SW is installed.
  // We rely on vite-plugin-pwa's default behavior of leaving the new SW in waiting.
  // Calling SKIP_WAITING activates it and triggers a controlled reload on next nav.
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.getRegistration()
    reg?.waiting?.postMessage({ type: 'SKIP_WAITING' })
  }
  // Force reload to pick up the new SW + new bundle.
  window.location.reload()
}

/**
 * Register the service worker and surface update state to UI.
 * Uses vite-plugin-pwa's virtual module to wire the Workbox lifecycle.
 */
export function registerSW(): void {
  if (typeof window === 'undefined') return

  const update = viteRegisterSW({
    immediate: true,
    onNeedRefresh() {
      state = { ...state, updateReady: true }
      emit()
    },
    onOfflineReady() {
      state = { ...state, offlineReady: true }
      emit()
    },
    onRegisterError() {
      state = { ...state, error: true }
      emit()
    },
  })

  // Expose the applyUpdate function via a custom event so UpdateToast.vue
  // can invoke it without importing virtual modules directly.
  window.addEventListener('bt:apply-update', () => {
    void update(true)
    void applyUpdate()
  })
}
