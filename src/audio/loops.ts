import type { Loop } from './loopCache'

/**
 * Registry of optional sourced ambient loops (appspec §6.1).
 *
 * These point at real Freesound candidates. Bundled previews are low-fi
 * (64–128 kbps) and carry CC-BY/CC0 attribution; the engine falls back to
 * offline-capable synth when a blob isn't present, so these are strictly an
 * enhancement. Add/replace `src` with a bundled asset under `/loops/*` to
 * upgrade quality.
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
