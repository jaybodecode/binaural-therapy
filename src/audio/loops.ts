import type { Loop } from './loopCache'

/**
 * Registry of sourced ambient loops (appspec §6.1).
 *
 * These point at loopable, iOS-compatible MP3s (44.1kHz, ~180–200kbps)
 * bundled under /loops/*. Attribution lives in the Credits page (§6.5).
 * The engine still falls back to offline-capable synth when a blob fails
 * to load/decode, so a missing asset never breaks playback.
 */
export const LOOP_REGISTRY: Record<string, Loop> = {
  ocean: {
    id: 'ocean',
    src: '/loops/ocean-cc0.mp3',
    kind: 'sourced',
  },
  rain: {
    id: 'rain',
    src: '/loops/rain-ccby.mp3',
    kind: 'sourced',
  },
}
