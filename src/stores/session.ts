import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { getBand } from '@/data/bands'
import { useAudioEngine } from '@/audio/engine'
import { loadSettings, saveSettings } from './settings'
import type { AtmosphereId, BandId } from '@/data/bands'

/**
 * M1 session store. Owns the user-visible state (band, atmosphere, gains,
 * play state) and keeps it in sync with the shared audio engine.
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

  const isPlaying = computed(() => engine.status.value === 'playing')
  const canPlay = computed(() => engine.status.value !== 'idle')

  const currentBand = computed(() => getBand(band.value))

  // Pass-through to engine (keeps engine as the single source of truth for audio).
  function setBand(id: BandId) {
    band.value = id
    beatHz.value = null // reset to band default
    engine.setBand(id)
    // Follow the band's preferred atmosphere (appspec §4).
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

  function start() {
    engine.setBand(band.value)
    engine.setAtmosphere(atmosphere.value)
    engine.setBeat(effectiveBeat.value)
    engine.setToneGain(toneGain.value)
    engine.setAtmosphereGain(atmosphereGain.value)
    engine.start()
  }

  function stop() {
    engine.stop()
  }

  async function unlockAndStart() {
    await engine.unlock()
    start()
  }

  /** The beat frequency actually driving the engine: custom override or band default. */
  const effectiveBeat = computed(() => {
    const b = getBand(band.value)
    return beatHz.value ?? b.defaultBeatHz
  })

  // Persist on any significant change.
  watch(
    [band, atmosphere, toneGain, atmosphereGain, beatHz],
    () => {
      saveSettings({
        band: band.value,
        atmosphere: atmosphere.value,
        toneGain: toneGain.value,
        atmosphereGain: atmosphereGain.value,
        beatHz: beatHz.value,
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
    isPlaying,
    canPlay,
    currentBand,
    effectiveBeat,
    setBand,
    setAtmosphere,
    setToneGain,
    setAtmosphereGain,
    setBeat,
    start,
    stop,
    unlockAndStart,
  }
})
