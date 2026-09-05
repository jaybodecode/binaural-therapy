import { ref } from 'vue'
import type { AtmosphereId, BandId } from '@/data/bands'
import { ATMOSPHERES, getBand } from '@/data/bands'
import {
  createAtmosphere,
  createLoopAtmosphere,
  destroyAtmosphere,
  type AtmosphereEngine,
} from './noise'
import { resolveLoopBuffer } from './loopCache'
import { LOOP_REGISTRY } from './loops'
import {
  createSpatialLayer,
  setupListener,
  type PanningMode,
  type SpatialConfig,
  type SpatialLayer,
} from './panning'
import { DEFAULT_SPATIAL } from './panning'

/**
 * Ramp durations per appspec §5.3.
 */
const RAMP = {
  carrier: 5,
  beat: 60,
  toneGain: 1.5,
  atmosphereGain: 2.5,
  master: 0.05,
}

export type EngineStatus = 'idle' | 'unlocked' | 'playing'

let singleton: ReturnType<typeof createAudioEngine> | null = null

/**
 * A single shared Web Audio engine for the whole app.
 *
 * Graph (appspec §5.2):
 *   Left:  Osc(sine, f)              -> StereoPanner(-1) -> toneGain
 *   Right: Osc(sine, f + Δf)         -> StereoPanner(+1) -> toneGain
 *   Atmos: NoiseBuffer -> Lowpass    -> atmosGain
 *   [toneGain, atmosGain] -> master  -> ctx.destination        (direct)
 *                                 -> MediaStreamDestination  -> <audio srcObject>   (iOS anchor, §8.3)
 */
function createAudioEngine() {
  const status = ref<EngineStatus>('idle')

  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let toneGain: GainNode | null = null
  let atmosGain: GainNode | null = null
  let oscL: OscillatorNode | null = null
  let oscR: OscillatorNode | null = null
  let anchor: HTMLAudioElement | null = null
  let atmosphere: AtmosphereEngine | null = null
  let currentAtmosphereId: AtmosphereId | null = null
  /** True when the active atmosphere is a sourced loop (vs synth). */
  const loopActive = ref(false)

  let carrierHz = 240
  let beatHz = 10
  let targetToneGain = 0.2
  let targetAtmosGain = 0.75

  // ── Spatial (PannerMode) state ────────────────────────────────────────────
  const spatialConfig: SpatialConfig = { ...DEFAULT_SPATIAL }
  let spatialNode: PannerNode | null = null
  let spatialLayer: SpatialLayer | null = null
  let driftRAF: number | null = null
  const spatialMode = ref<PanningMode>('off')

  function connectAtmosphere(engine: AtmosphereEngine) {
    if (!atmosGain) return
    if (spatialNode) {
      engine.gain.connect(spatialNode).connect(atmosGain)
    } else {
      engine.gain.connect(atmosGain)
    }
  }

  /** Rebuild the panner when the spatial config changes. */
  function rebuildSpatial() {
    if (!ctx) return
    if (spatialNode) {
      try {
        spatialNode.disconnect()
      } catch {
        /* noop */
      }
    }
    spatialNode = null
    spatialLayer = null

    if (spatialConfig.mode !== 'off' && typeof ctx.createPanner === 'function') {
      spatialLayer = createSpatialLayer(ctx, spatialConfig)
      spatialNode = spatialLayer?.node ?? null
    }
    // Re-wire the current atmosphere if it exists.
    if (atmosphere && atmosGain) {
      try {
        atmosphere.gain.disconnect()
      } catch {
        /* noop */
      }
      if (spatialNode) {
        atmosphere.gain.connect(spatialNode).connect(atmosGain)
      } else {
        atmosphere.gain.connect(atmosGain)
      }
    }
    spatialMode.value = spatialConfig.mode
    if (spatialConfig.mode === 'drift') startDrift()
    else stopDrift()
  }

  function startDrift() {
    if (driftRAF != null || !spatialLayer) return
    const loop = (t: number) => {
      if (spatialLayer) {
        const base = DEFAULT_SPATIAL.azimuth
        const phase = (t / 1000) * spatialConfig.driftSpeed * 0.02 + base
        const az = base + Math.sin(phase) * spatialConfig.wanderRadius
        spatialLayer.apply({ azimuth: az })
      }
      if (status.value === 'playing' || spatialConfig.mode === 'drift') {
        driftRAF = requestAnimationFrame(loop)
      } else {
        driftRAF = null
      }
    }
    driftRAF = requestAnimationFrame(loop)
  }

  function stopDrift() {
    if (driftRAF != null) {
      cancelAnimationFrame(driftRAF)
      driftRAF = null
    }
  }

  function setSpatial(cfg: Partial<SpatialConfig>) {
    Object.assign(spatialConfig, cfg)
    rebuildSpatial()
    spatialMode.value = spatialConfig.mode
  }

  // ── Low-level helpers ─────────────────────────────────────────────────────
  function ramp(param: AudioParam | null, target: number, seconds: number) {
    if (!param || !ctx) return
    const now = ctx.currentTime
    param.cancelScheduledValues(now)
    param.setValueAtTime(param.value, now)
    param.linearRampToValueAtTime(target, now + seconds)
  }

  function buildGraph() {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    master = ctx.createGain()
    master.gain.value = 0
    toneGain = ctx.createGain()
    toneGain.gain.value = 0
    atmosGain = ctx.createGain()
    atmosGain.gain.value = 0

    toneGain.connect(master)
    atmosGain.connect(master)

    // Direct path (desktop / Android / older iOS).
    master.connect(ctx.destination)

    // iOS MediaStream anchor (appspec §8.3).
    try {
      const dest = ctx.createMediaStreamDestination()
      master.connect(dest)
      anchor = document.createElement('audio')
      anchor.setAttribute('playsinline', '')
      anchor.srcObject = dest.stream
    } catch (e) {
      // Not supported — fall back to direct output (fine on desktop).
      anchor = null
    }

    // Set up the immersive listener + any pre-configured spatial layer.
    setupListener(ctx)
    rebuildSpatial()
  }

  function ensurePlayback() {
    // Anchor.play() must be inside the user-gesture chain (appspec §8.6).
    if (anchor && anchor.paused) {
      anchor.play().catch(() => {})
    }
  }

  function makeOscillators() {
    if (!ctx || !toneGain || oscL) return
    const panL = ctx.createStereoPanner()
    const panR = ctx.createStereoPanner()
    panL.pan.value = -1
    panR.pan.value = 1

    oscL = ctx.createOscillator()
    oscR = ctx.createOscillator()
    oscL.type = 'sine'
    oscR.type = 'sine'
    oscL.frequency.value = carrierHz
    oscR.frequency.value = carrierHz + beatHz

    oscL.connect(panL).connect(toneGain)
    oscR.connect(panR).connect(toneGain)
    oscL.start()
    oscR.start()
  }

  // ── Public API ────────────────────────────────────────────────────────────
  async function unlock() {
    if (status.value !== 'idle') return
    buildGraph()
    if (!ctx) return
    await ctx.resume()

    // app.spec §8.2 — bypass silent switch where supported.
    const nav = navigator as Navigator & { audioSession?: { type: string } }
    if (nav.audioSession) nav.audioSession.type = 'playback'

    status.value = 'unlocked'
  }

  function start() {
    if (!ctx || !master || !toneGain || !atmosGain) return
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    makeOscillators()
    ensurePlayback()

    // If no atmosphere has been built yet (initial start), build the synth
    // one synchronously so playback is instant and offline-capable. Sourced
    // loops are applied on later explicit atmosphere switches.
    if (!atmosphere && currentAtmosphereId) {
      atmosphere = createAtmosphere(ctx, currentAtmosphereId)
      connectAtmosphere(atmosphere)
    }

    ramp(toneGain.gain, targetToneGain, RAMP.toneGain)
    ramp(atmosGain.gain, targetAtmosGain, RAMP.atmosphereGain)
    ramp(master.gain, 1, RAMP.master)

    status.value = 'playing'
  }

  function stop() {
    if (!ctx) return
    if (master) ramp(master.gain, 0, RAMP.toneGain)
    setTimeout(() => {
      if (!ctx) return
      if (toneGain) toneGain.gain.cancelScheduledValues(ctx.currentTime)
      if (atmosGain) atmosGain.gain.cancelScheduledValues(ctx.currentTime)
      if (oscL) {
        try {
          oscL.stop()
        } catch {
          /* already stopped */
        }
      }
      if (oscR) {
        try {
          oscR.stop()
        } catch {
          /* already stopped */
        }
      }
      oscL = null
      oscR = null
      stopDrift()
      status.value = 'unlocked'
    }, 1600)
  }

  function setBand(id: BandId) {
    const band = getBand(id)
    carrierHz = band.carrierHz
    beatHz = band.defaultBeatHz
    if (ctx && oscL) {
      ramp(oscL.frequency, carrierHz, RAMP.carrier)
      if (oscR) ramp(oscR.frequency, carrierHz + beatHz, RAMP.beat)
    }
  }

  function setBeat(hz: number) {
    beatHz = hz
    // Interactive slider → fast anti-pop ramp. The 60s RAMP.beat is reserved
    // for Sleep Journey stage transitions (§5.3), scheduled separately.
    if (ctx && oscR) ramp(oscR.frequency, carrierHz + hz, 0.05)
  }

  function setToneGain(g: number) {
    targetToneGain = g
    if (status.value === 'playing' && toneGain) ramp(toneGain.gain, g, RAMP.toneGain)
  }

  function setAtmosphereGain(g: number) {
    targetAtmosGain = g
    if (status.value === 'playing' && atmosGain) ramp(atmosGain.gain, g, RAMP.atmosphereGain)
  }

  function setAtmosphere(id: AtmosphereId) {
    if (!ctx || id === currentAtmosphereId) return
    // Fade out old, swap, fade in new (appspec §5.3 atmosphere crossfade).
    if (atmosphere && atmosGain) ramp(atmosGain.gain, 0, RAMP.atmosphereGain)
    const prev = atmosphere
    const wasPlaying = status.value === 'playing'
    setTimeout(async () => {
      if (prev) destroyAtmosphere(prev)
      atmosphere = null
      loopActive.value = false

      // Prefer a sourced loop when the registry has one and we can resolve
      // a buffer (IndexedDB first, then network); fall back to synth.
      const loop = LOOP_REGISTRY[id]
      let built = false
      if (loop && ctx) {
        try {
          const buffer = await resolveLoopBuffer(ctx, loop)
          if (buffer) {
            atmosphere = createLoopAtmosphere(ctx, buffer)
            loopActive.value = true
            built = true
          }
        } catch {
          /* fall back to synth */
        }
      }
      if (!built) {
        atmosphere = createAtmosphere(ctx!, id)
      }

      if (atmosphere) {
        connectAtmosphere(atmosphere)
        if (wasPlaying && atmosGain) {
          ramp(atmosGain.gain, targetAtmosGain, RAMP.atmosphereGain)
        }
      }
    }, RAMP.atmosphereGain * 1000)
    currentAtmosphereId = id
  }

  /** Stereo-channel check (appspec §10 'stereo_check_utility'): a short
   * 440 Hz tone panned hard to one ear so the user can verify channel
   * isolation on headphones. Routes to ctx.destination (+ iOS anchor)
   * directly so it is ALWAYS audible — independent of play state and the
   * master/tone gains (which are 0 before a session starts). */
  function pingChannel(side: 'left' | 'right') {
    if (!ctx) return
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    const pan = ctx.createStereoPanner()
    osc.type = 'sine'
    osc.frequency.value = 440
    pan.pan.value = side === 'left' ? -1 : 1
    const now = ctx.currentTime
    g.gain.setValueAtTime(0.0001, now)
    g.gain.linearRampToValueAtTime(0.25, now + 0.05)
    g.gain.setValueAtTime(0.25, now + 0.5)
    g.gain.linearRampToValueAtTime(0.0001, now + 0.6)

    osc.connect(pan).connect(g).connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.65)
    osc.addEventListener('ended', () => {
      osc.disconnect()
      g.disconnect()
      pan.disconnect()
    })
  }

  const atmosphereOptions = ATMOSPHERES.map((a) => a.id)

  return {
    status,
    loopActive,
    spatialMode,
    unlock,
    start,
    stop,
    setBand,
    setBeat,
    setToneGain,
    pingChannel,
    setAtmosphereGain,
    setAtmosphere,
    setSpatial,
    atmosphereOptions,
  }
}

export function useAudioEngine() {
  if (!singleton) singleton = createAudioEngine()
  return singleton
}
