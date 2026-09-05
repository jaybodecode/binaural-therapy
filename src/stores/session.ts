import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Placeholder session store for M0. The real implementation in M1/M3
 * will own mode, band, atmosphere, beat frequency, gain, journey stage,
 * and a single bridge into the Web Audio engine (see appspec.md §10.4).
 */
export const useSessionStore = defineStore('session', () => {
  const isPlaying = ref(false)

  function start() {
    isPlaying.value = true
  }

  function stop() {
    isPlaying.value = false
  }

  return { isPlaying, start, stop }
})
