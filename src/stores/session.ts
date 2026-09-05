import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { getBand, type BackgroundId, type BandId, type NoiseId } from '@/data/bands'
import { useAudioEngine } from '@/audio/engine'
import type { SpatialConfig } from '@/audio/panning'
import { loadSettings, saveSettings } from './settings'

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

  watch(
    [band, beatHz, toneGain, noise, noiseGain, background, backgroundGain, spatial],
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
    isPlaying,
    canPlay,
    currentBand,
    lockedNoise,
    effectiveBeat,
    setBand,
    setNoise,
    setBackground,
    setToneGain,
    setNoiseGain,
    setBackgroundGain,
    setBeat,
    setSpatial,
    start,
    stop,
    unlockAndStart,
    pingChannel,
  }
})
