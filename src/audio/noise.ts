import type { AtmosphereId } from '@/data/bands'

/**
 * Generate loopable, offline-capable atmosphere sounds via pure synthesis.
 *
 * Four profiles (appspec §6.1 — all synth, no assets):
 *   pink  : 1/f from white via Paul Kellet pink filter.
 *   brown : 1/f² by integrating white noise.
 *   rain  : pink-ish hiss, high-passed for a steady rain bed.
 *   ocean : brown noise with a ~0.1 Hz low-frequency gain swell (surge).
 *
 * The returned engine exposes source/filter/gain; the caller wires `gain`
 * into the atmosphere bus. For ocean, gain is auto-modulated by an LFO so
 * the caller should treat gain.value as the base level (not ramp it hard).
 */
export interface AtmosphereEngine {
  source: AudioBufferSourceNode
  filter: BiquadFilterNode
  gain: GainNode
  /** Optional LFO driving a slow gain swell (ocean). */
  lfo?: OscillatorNode
  lfoGain?: GainNode
}

function makeNoiseBuffer(ctx: AudioContext, profile: 'pink' | 'brown' | 'rain'): AudioBuffer {
  const seconds = 4
  const length = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
  const white = new Float32Array(length)

  for (let i = 0; i < length; i++) white[i] = Math.random() * 2 - 1

  if (profile === 'pink' || profile === 'rain') {
    // Paul Kellet's refined pink filter.
    const b0 = 0.99886
    const b1 = 0.99332
    const b2 = 0.969
    const b3 = 0.8665
    const b5 = -0.7616
    let s0 = 0,
      s1 = 0,
      s2 = 0,
      s3 = 0
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch)
      for (let i = 0; i < length; i++) {
        const w = white[i]
        s0 = b0 * s0 + w * 0.99886
        s1 = b1 * s1 + w * 0.99332
        s2 = b2 * s2 + w * 0.969
        s3 = b3 * s3 + w * 0.8665
        const out = (s0 + s1 + s2 + s3 + w * b5) * 0.11
        data[i] = out
      }
    }
  } else {
    // Brown noise: integrate white noise (leaky integrator).
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch)
      let last = 0
      for (let i = 0; i < length; i++) {
        const out = (last + 0.02 * white[i]) / 1.02
        last = out
        data[i] = out * 3.5
      }
    }
  }

  // Normalize each channel to ~ -3 dBFS peak.
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    let peak = 0
    for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(data[i]))
    if (peak > 0) {
      const scale = 0.7 / peak
      for (let i = 0; i < length; i++) data[i] *= scale
    }
  }

  return buffer
}

export function createAtmosphere(ctx: AudioContext, id: AtmosphereId): AtmosphereEngine {
  const source = ctx.createBufferSource()

  let filter: BiquadFilterNode
  let gain = ctx.createGain()
  let lfo: OscillatorNode | undefined
  let lfoGain: GainNode | undefined

  switch (id) {
    case 'rain': {
      source.buffer = makeNoiseBuffer(ctx, 'rain')
      filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 4200
      filter.Q.value = 0.4
      gain.gain.value = 1
      break
    }
    case 'ocean': {
      source.buffer = makeNoiseBuffer(ctx, 'brown')
      filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 900
      filter.Q.value = 0.5
      gain.gain.value = 1
      // 0.1 Hz surge modulated onto gain (mirrors ocean wave envelope / RSA).
      lfo = ctx.createOscillator()
      lfo.frequency.value = 0.1
      lfoGain = ctx.createGain()
      lfoGain.gain.value = 0.35
      gain.gain.value = 1 - 0.35
      lfo.connect(lfoGain).connect(gain.gain)
      lfo.start()
      break
    }
    case 'brown': {
      source.buffer = makeNoiseBuffer(ctx, 'brown')
      filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 3000
      filter.Q.value = 0.3
      gain.gain.value = 1
      break
    }
    case 'pink':
    default: {
      source.buffer = makeNoiseBuffer(ctx, 'pink')
      filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 3000
      filter.Q.value = 0.3
      gain.gain.value = 1
      break
    }
  }

  source.loop = true
  source.connect(filter).connect(gain)
  source.start()

  return { source, filter, gain, lfo, lfoGain }
}

/** Stop an atmosphere engine (clean up LFO). */
export function destroyAtmosphere(engine: AtmosphereEngine): void {
  try {
    engine.source.stop()
  } catch {
    /* already stopped */
  }
  if (engine.lfo) {
    try {
      engine.lfo.stop()
    } catch {
      /* already stopped */
    }
  }
  engine.source.disconnect()
  engine.filter.disconnect()
  engine.gain.disconnect()
  engine.lfoGain?.disconnect()
}
