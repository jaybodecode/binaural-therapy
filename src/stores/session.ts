import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { getBand, type BackgroundId, type BandId, type NoiseId, BANDS } from '@/data/bands'
import { useAudioEngine } from '@/audio/engine'
import type { SpatialConfig } from '@/audio/panning'
import { getTransit, type TransitMode } from '@/data/transitions'
import { loadSettings, saveSettings } from './settings'

const BAND_IDS = BANDS.map((b) => b.id)

/**
 * Session store. Owns the user-visible state (band, tone gain, noise layer,
 * background layer, spatial mode, play state) and keeps it in sync with the
 * shared audio engine. Noise and background are independent layers.
 */
export const useSessionStore = defineStore('session', () => {
  const engine = useAudioEngine()

  const persisted = loadSettings()

  const mode = ref<'state-lock'>('state-lock')
  const band = ref<BandId>(persisted.band)
  const beatHz = ref(persisted.beatHz)
  const toneGain = ref(persisted.toneGain)
  const noise = ref<NoiseId>(persisted.noise)
  const noiseGain = ref(persisted.noiseGain)
  const background = ref<BackgroundId>(persisted.background)
  const backgroundGain = ref(persisted.backgroundGain)
  const spatial = ref<SpatialConfig>({ ...persisted.spatial })
  const transitMode = ref<TransitMode>(persisted.transitMode ?? 'state-lock')

  /**
   * Ambient-space (HRTF spatial audio) needs PannerNode + HRTF support and is
   * headphone-dependent. Feature-detect rather than assume.
   */
  const spatialSupported = computed(() => {
    if (typeof window === 'undefined') return false
    try {
      const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!Ctor) return false
      const a = new Ctor()
      const p =
        typeof a.createPanner === 'function'
          ? a.createPanner()
          : (window as any).webkitAudioContext?.createPanner?.call(a)
      const ok = !!p && typeof p.setPosition === 'function'
      try {
        a.close()
      } catch {
        /* ignore */
      }
      return ok
    } catch {
      return false
    }
  })

  const isPlaying = computed(() => engine.status.value === 'playing')
  const canPlay = computed(() => engine.status.value !== 'idle')

  const currentBand = computed(() => getBand(band.value))

  /** The noise mask locked to the current band by default (brown=deep/focus-sleep, pink=focus). */
  const lockedNoise = computed(() => getBand(band.value).preferredNoise)

  const effectiveBeat = computed(() => {
    const b = getBand(band.value)
    return beatHz.value ?? b.defaultBeatHz
  })

  function setBand(id: BandId) {
    band.value = id
    beatHz.value = null
    // Lock the noise mask to the band's preferred one.
    const pref = getBand(id).preferredNoise
    noise.value = pref
    engine.setNoise(pref)
    engine.setBand(id)
  }

  function setNoise(id: NoiseId) {
    noise.value = id
    engine.setNoise(id)
  }

  function setBackground(id: BackgroundId) {
    background.value = id
    engine.setBackground(id)
  }

  function setToneGain(g: number) {
    toneGain.value = g
    engine.setToneGain(g)
  }

  function setNoiseGain(g: number) {
    noiseGain.value = g
    engine.setNoiseGain(g)
  }

  function setBackgroundGain(g: number) {
    backgroundGain.value = g
    engine.setBgGain(g)
  }

  function setBeat(hz: number) {
    beatHz.value = hz
    engine.setBeat(hz)
  }

  function setSpatial(cfg: Partial<SpatialConfig>) {
    spatial.value = { ...spatial.value, ...cfg }
    engine.setSpatial(cfg)
  }

  function setTransitMode(id: TransitMode) {
    transitMode.value = id
  }

  function start() {
    engine.setBand(band.value)
    engine.setNoise(noise.value)
    engine.setBackground(background.value)
    engine.setBeat(effectiveBeat.value)
    engine.setToneGain(toneGain.value)
    engine.setNoiseGain(noiseGain.value)
    engine.setBgGain(backgroundGain.value)
    engine.setSpatial(spatial.value)
    engine.start()

    // State-transition paths (Power Nap / Go-to-bed / Oscillate / Sleep Journey).
    if (transitMode.value === 'sleep-journey') {
      // Stage durations (ms) for a 45-min journey: 22% / 33% / 45%.
      const s1 = Math.round(45 * 60000 * 0.22)
      const s2 = Math.round(45 * 60000 * 0.33)
      const s3 = Math.round(45 * 60000 * 0.45)
      engine.startSleepJourney([s1, s2, s3])
    } else if (transitMode.value !== 'state-lock') {
      const def = getTransit(transitMode.value)
      const steps = def.steps(effectiveBeat.value, currentBand.value.name)
      if (steps.some((s) => s.holdMs > 0)) {
        engine.scheduleBeatPath(steps)
      }
    }
  }

  function stop() {
    engine.stop()
  }

  async function unlockAndStart() {
    await engine.unlock()
    start()
  }

  function pingChannel(side: 'left' | 'right') {
    engine.pingChannel(side)
  }

  /** Read preset parameters from the URL hash and apply them on load. */
  function applyUrlParams(): void {
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    const query = new URLSearchParams(hash.replace(/^#/, ''))
    const bandId = query.get('band') as BandId | null
    if (bandId && BAND_IDS.includes(bandId)) setBand(bandId)
    const noiseId = query.get('noise')
    if (noiseId === 'pink' || noiseId === 'brown') setNoise(noiseId)
    const bg = query.get('bg')
    if (bg === 'rain' || bg === 'ocean' || bg === 'none') setBackground(bg)
    const beat = query.get('beat')
    if (beat !== null) {
      const b = Number(beat)
      if (!Number.isNaN(b)) setBeat(b)
    }
    const tg = query.get('tg')
    if (tg !== null) {
      const g = Number(tg)
      if (!Number.isNaN(g)) setToneGain(Math.min(1, Math.max(0, g)))
    }
    const mode = query.get('mode') as TransitMode | null
    if (mode) setTransitMode(mode)
  }

  /** Build a shareable URL encoding the current session state. */
  function buildShareUrl(): string {
    const qp = new URLSearchParams({ band: band.value })
    if (noise.value) qp.set('noise', noise.value)
    qp.set('bg', background.value)
    if (beatHz.value != null) qp.set('beat', String(beatHz.value))
    if (transitMode.value !== 'state-lock') qp.set('mode', transitMode.value)
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    return `${base}${typeof window !== 'undefined' ? window.location.pathname : '/'}#${qp.toString()}`
  }

  watch(
    [band, beatHz, toneGain, noise, noiseGain, background, backgroundGain, spatial, transitMode],
    () => {
      saveSettings({
        band: band.value,
        beatHz: beatHz.value,
        toneGain: toneGain.value,
        noise: noise.value,
        noiseGain: noiseGain.value,
        background: background.value,
        backgroundGain: backgroundGain.value,
        spatial: spatial.value,
        transitMode: transitMode.value,
      })
    },
    { deep: true },
  )

  return {
    mode,
    band,
    beatHz,
    toneGain,
    noise,
    noiseGain,
    background,
    backgroundGain,
    spatial,
    transitMode,
    isPlaying,
    canPlay,
    currentBand,
    lockedNoise,
    effectiveBeat,
    spatialSupported,
    setBand,
    setNoise,
    setBackground,
    setToneGain,
    setNoiseGain,
    setBackgroundGain,
    setBeat,
    setSpatial,
    setTransitMode,
    start,
    stop,
    unlockAndStart,
    pingChannel,
    applyUrlParams,
    buildShareUrl,
  }
})
