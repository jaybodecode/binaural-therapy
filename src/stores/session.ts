import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { getBand } from '@/data/bands'
import { useAudioEngine } from '@/audio/engine'
import type { SpatialConfig } from '@/audio/panning'
import { loadSettings, saveSettings } from './settings'
import type { AtmosphereId, BandId } from '@/data/bands'

/**
 * Session store. Owns the user-visible state (band, atmosphere, gains,
 * spatial mode, play state) and keeps it in sync with the shared audio engine.
 */
export const useSessionStore = defineStore('session', () => {
  const engine = useAudioEngine()

  const persisted = loadSettings()

  const mode = ref<'state-lock'>('state-lock')
  const band = ref<BandId>(persisted.band)
  const atmosphere = ref<AtmosphereId>(persisted.atmosphere)
  const toneGain = ref(persisted.toneGain)
  const atmosphereGain = ref(persisted.atmosphereGain)
  const beatHz = ref(persisted.beatHz)
  const spatial = ref<SpatialConfig>({ ...persisted.spatial })

  const isPlaying = computed(() => engine.status.value === 'playing')
  const canPlay = computed(() => engine.status.value !== 'idle')

  const currentBand = computed(() => getBand(band.value))

  /** The beat frequency actually driving the engine: override or band default. */
  const effectiveBeat = computed(() => {
    const b = getBand(band.value)
    return beatHz.value ?? b.defaultBeatHz
  })

  function setBand(id: BandId) {
    band.value = id
    beatHz.value = null
    engine.setBand(id)
    const pref = getBand(id).preferredAtmosphere
    atmosphere.value = pref
    engine.setAtmosphere(pref)
  }

  function setAtmosphere(id: AtmosphereId) {
    atmosphere.value = id
    engine.setAtmosphere(id)
  }

  function setToneGain(g: number) {
    toneGain.value = g
    engine.setToneGain(g)
  }

  function setAtmosphereGain(g: number) {
    atmosphereGain.value = g
    engine.setAtmosphereGain(g)
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
    engine.setAtmosphere(atmosphere.value)
    engine.setBeat(effectiveBeat.value)
    engine.setToneGain(toneGain.value)
    engine.setAtmosphereGain(atmosphereGain.value)
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
    [band, atmosphere, toneGain, atmosphereGain, beatHz, spatial],
    () => {
      saveSettings({
        band: band.value,
        atmosphere: atmosphere.value,
        toneGain: toneGain.value,
        atmosphereGain: atmosphereGain.value,
        beatHz: beatHz.value,
        spatial: spatial.value,
      })
    },
    { deep: true },
  )

  return {
    mode,
    band,
    atmosphere,
    toneGain,
    atmosphereGain,
    beatHz,
    spatial,
    isPlaying,
    canPlay,
    currentBand,
    effectiveBeat,
    setBand,
    setAtmosphere,
    setToneGain,
    setAtmosphereGain,
    setBeat,
    setSpatial,
    start,
    stop,
    unlockAndStart,
    pingChannel,
  }
})
