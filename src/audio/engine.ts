import { ref } from 'vue'
import type { BackgroundId, BandId, NoiseId } from '@/data/bands'
import { getBand } from '@/data/bands'
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
  layerGain: 2.5,
  master: 0.05,
}

export type EngineStatus = 'idle' | 'unlocked' | 'playing'

let singleton: ReturnType<typeof createAudioEngine> | null = null

/**
 * A single shared Web Audio engine for the whole app.
 *
 * Graph (appspec §5.2, extended for dual ambient layers):
 *   Left:  Osc(sine, f)              -> StereoPanner(-1) -> toneGain
 *   Right: Osc(sine, f + Δf)         -> StereoPanner(+1) -> toneGain
 *   Noise: (synth) pink/brown        -> noiseGain
 *   Bg:    (synth/loop) rain/ocean   -> (spatial panner?) -> bgGain
 *   [toneGain, noiseGain, bgGain] -> master -> ctx.destination (direct)
 *                                        -> MediaStreamDestination -> <audio> (iOS anchor §8.3)
 */
function createAudioEngine() {
  const status = ref<EngineStatus>('idle')

  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let toneGain: GainNode | null = null
  let noiseGain: GainNode | null = null
  let bgGain: GainNode | null = null
  let oscL: OscillatorNode | null = null
  let oscR: OscillatorNode | null = null
  let anchor: HTMLAudioElement | null = null

  let noiseEngine: AtmosphereEngine | null = null
  let bgEngine: AtmosphereEngine | null = null
  let currentNoise: NoiseId | null = null
  let currentBg: BackgroundId | null = null
  const noiseLoaded = ref(false)
  const bgLoaded = ref(false)

  let carrierHz = 240
  let beatHz = 10
  let targetToneGain = 0.2
  let targetNoiseGain = 0.6
  let targetBgGain = 0.75

  // ── Spatial (PannerMode) state ────────────────────────────────────────────
  const spatialConfig: SpatialConfig = { ...DEFAULT_SPATIAL }
  let spatialNode: PannerNode | null = null
  let spatialLayer: SpatialLayer | null = null
  let driftRAF: number | null = null
  const spatialMode = ref<PanningMode>('off')

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

    // Spatial applies to the noise + background ambient layers (carriers
    // stay hard-panned StereoPanner to protect the binaural percept).
    if (spatialConfig.mode !== 'off' && typeof ctx.createPanner === 'function') {
      spatialLayer = createSpatialLayer(ctx, spatialConfig)
      spatialNode = spatialLayer?.node ?? null
    }
    connectNoise()
    connectBg()
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
    noiseGain = ctx.createGain()
    noiseGain.gain.value = 0
    bgGain = ctx.createGain()
    bgGain.gain.value = 0

    toneGain.connect(master)
    noiseGain.connect(master)
    bgGain.connect(master)

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
      anchor = null
    }

    // Immersive listener + any spatial layer.
    setupListener(ctx)
    rebuildSpatial()
  }

  function ensurePlayback() {
    if (anchor && anchor.paused) anchor.play().catch(() => {})
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

  // Connect noise engine to its gain (optionally through the spatial node).
  function connectNoise() {
    if (!noiseEngine || !noiseGain) return
    try {
      noiseEngine.gain.disconnect()
    } catch {
      /* noop */
    }
    if (spatialNode) noiseEngine.gain.connect(spatialNode).connect(noiseGain)
    else noiseEngine.gain.connect(noiseGain)
  }

  // Connect background engine, optionally through the spatial node.
  function connectBg() {
    if (!bgEngine || !bgGain) return
    try {
      bgEngine.gain.disconnect()
    } catch {
      /* noop */
    }
    if (spatialNode) bgEngine.gain.connect(spatialNode).connect(bgGain)
    else bgEngine.gain.connect(bgGain)
  }

  // ── Public API ────────────────────────────────────────────────────────────
  async function unlock() {
    if (status.value !== 'idle') return
    buildGraph()
    if (!ctx) return
    await ctx.resume()

    const nav = navigator as Navigator & { audioSession?: { type: string } }
    if (nav.audioSession) nav.audioSession.type = 'playback'

    status.value = 'unlocked'
  }

  function start() {
    if (!ctx || !master || !toneGain || !noiseGain || !bgGain) return
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    makeOscillators()
    ensurePlayback()

    // Build synth noise layer synchronously if not set (instant, offline-capable).
    if (!noiseEngine && currentNoise) {
      noiseEngine = createAtmosphere(ctx, currentNoise)
      connectNoise()
    }
    // Build synth background layer synchronously if not set.
    if (!bgEngine && currentBg && currentBg !== 'none') {
      bgEngine = createAtmosphere(ctx, currentBg)
      connectBg()
    }

    ramp(toneGain.gain, targetToneGain, RAMP.toneGain)
    ramp(noiseGain.gain, targetNoiseGain, RAMP.layerGain)
    ramp(bgGain.gain, targetBgGain, RAMP.layerGain)
    ramp(master.gain, 1, RAMP.master)

    status.value = 'playing'
  }

  function stop() {
    if (!ctx) return
    if (master) ramp(master.gain, 0, RAMP.toneGain)
    setTimeout(() => {
      if (!ctx) return
      if (toneGain) toneGain.gain.cancelScheduledValues(ctx.currentTime)
      if (noiseGain) noiseGain.gain.cancelScheduledValues(ctx.currentTime)
      if (bgGain) bgGain.gain.cancelScheduledValues(ctx.currentTime)
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
    if (ctx && oscR) ramp(oscR.frequency, carrierHz + hz, 0.05)
  }

  /**
   * Schedule a state-transition path for the beat frequency: a sequence of
   * [targetBeat Hz, duration ms]. Ramps (linearRampToValueAtTime) at fast
   * anti-pop speed to follow the sequence. Holds each target for its duration,
   * then moves to the next. Returns the total duration so callers can show
   * progress. Used by Power Nap / Go-to-bed / Oscillate modes (§15).
   */
  function scheduleBeatPath(seq: { beat: number; holdMs: number }[], onEnd?: () => void): number {
    if (!ctx || !oscR || !seq.length) return 0
    const freq = oscR.frequency
    let t = ctx.currentTime + 0.05
    freq.cancelScheduledValues(t)
    freq.setValueAtTime(carrierHz + seq[0].beat, t)
    const totalMs = seq.reduce((s, s2) => s + s2.holdMs, 0)
    for (const step of seq) {
      // Brief ramp to target then hold.
      const target = carrierHz + step.beat
      freq.linearRampToValueAtTime(target, t + 0.2)
      freq.setValueAtTime(target, t + 0.2 + step.holdMs / 1000)
      t += 0.2 + step.holdMs / 1000
    }
    if (onEnd) window.setTimeout(onEnd, totalMs + 400)
    return totalMs
  }

  /**
   * Sleep Journey (appspec §10.2): a continuous descending ramp over normally
   * 45 min — Beta→Alpha (16→9 Hz), Alpha→Theta (9→5 Hz), Theta→Delta (5→1.5 Hz),
   * then fade the tones out over 180 s leaving brown noise to mask the room.
   *
   * Each stage is a single long linearRampToValueAtTime over its full
   * duration (sleep-safe per §5.3). stageMs scales the default 45-min ramps.
   */
  function startSleepJourney(stageMs: [number, number, number], onEnd?: () => void): void {
    if (!ctx || !oscR || !toneGain) return
    const freq = oscR.frequency
    let t = ctx.currentTime + 0.05
    const beats: [number, number][] = [
      [16, 9],
      [9, 5],
      [5, 1.5],
    ]
    freq.cancelScheduledValues(t)
    freq.setValueAtTime(carrierHz + beats[0][0], t)
    for (let i = 0; i < 3; i++) {
      const [from, to] = beats[i]
      const dur = stageMs[i] / 1000
      freq.setValueAtTime(carrierHz + from, t)
      freq.linearRampToValueAtTime(carrierHz + to, t + dur)
      t += dur
    }
    // Stage 4: fade tones to 0 over 180 s (tones off, brown noise continues).
    toneGain.gain.cancelScheduledValues(t)
    toneGain.gain.setValueAtTime(targetToneGain, t)
    toneGain.gain.linearRampToValueAtTime(0, t + 180)
    const totalMs = stageMs.reduce((s, v) => s + v, 0) + 180000
    if (onEnd) window.setTimeout(onEnd, totalMs + 500)
  }

  function setToneGain(g: number) {
    targetToneGain = g
    if (status.value === 'playing' && toneGain) ramp(toneGain.gain, g, RAMP.toneGain)
  }

  function setNoiseGain(g: number) {
    targetNoiseGain = g
    if (status.value === 'playing' && noiseGain) ramp(noiseGain.gain, g, RAMP.layerGain)
  }

  function setBgGain(g: number) {
    targetBgGain = g
    if (status.value === 'playing' && bgGain) ramp(bgGain.gain, g, RAMP.layerGain)
  }

  /** Set the noise layer. Always available; locked to band by default. */
  function setNoise(id: NoiseId) {
    if (!ctx || id === currentNoise) return
    if (noiseEngine && noiseGain) ramp(noiseGain.gain, 0, RAMP.layerGain)
    const prev = noiseEngine
    setTimeout(() => {
      if (prev) destroyAtmosphere(prev)
      noiseEngine = createAtmosphere(ctx!, id)
      connectNoise()
      if (status.value === 'playing' && noiseGain)
        ramp(noiseGain.gain, targetNoiseGain, RAMP.layerGain)
    }, RAMP.layerGain * 1000)
    currentNoise = id
    noiseLoaded.value = true
  }

  /** Set the background layer (or turn it off). Synth or sourced loop. */
  function setBackground(id: BackgroundId) {
    if (!ctx || id === currentBg) return
    // Fade out current.
    if (bgEngine && bgGain) ramp(bgGain.gain, 0, RAMP.layerGain)
    const prev = bgEngine
    setTimeout(async () => {
      if (prev) destroyAtmosphere(prev)
      bgEngine = null
      bgLoaded.value = false
      if (id === 'none') return

      const loop = LOOP_REGISTRY[id]
      let built = false
      if (loop && ctx) {
        try {
          const buffer = await resolveLoopBuffer(ctx, loop)
          if (buffer) {
            bgEngine = createLoopAtmosphere(ctx, buffer)
            built = true
          }
        } catch {
          /* fall back to synth */
        }
      }
      if (!built) bgEngine = createAtmosphere(ctx!, id)
      connectBg()
      bgLoaded.value = built
      if (status.value === 'playing' && bgGain) ramp(bgGain.gain, targetBgGain, RAMP.layerGain)
    }, RAMP.layerGain * 1000)
    currentBg = id
  }

  /** Stereo-channel check (appspec §10 'stereo_check_utility'): short 440 Hz
   * tone panned hard to one ear. Routes to ctx.destination directly so it's
   * ALWAYS audible — independent of play state and the master/tone gains. */
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

  return {
    status,
    spatialMode,
    noiseLoaded,
    bgLoaded,
    unlock,
    start,
    stop,
    setBand,
    setBeat,
    scheduleBeatPath,
    startSleepJourney,
    setToneGain,
    setNoise,
    setNoiseGain,
    setBackground,
    setBgGain,
    setSpatial,
    pingChannel,
  }
}

export function useAudioEngine() {
  if (!singleton) singleton = createAudioEngine()
  return singleton
}
