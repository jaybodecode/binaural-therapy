export type BandId = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma'

export interface Band {
  id: BandId
  name: string
  /** Binaural beat frequency range (Hz). */
  beatRange: [number, number]
  /** Default start beat frequency (Hz). */
  defaultBeatHz: number
  /** Fixed carrier frequency (Hz) — stays in Oster's 200–500 Hz window. */
  carrierHz: number
  /** Functional description — what this state is good for (no citations). */
  description: string
  /** Locked noise mask for this band (brown for sleep, pink for focus). */
  preferredNoise: NoiseId
  icon: string
}

/** Colored-noise mask layer (always available; locked to band by default). */
export type NoiseId = 'pink' | 'brown'

/** Optional natural background ambience layer (independent gain; can be off). */
export type BackgroundId = 'none' | 'rain' | 'ocean'

export interface Noise {
  id: NoiseId
  label: string
  profile: 'pink' | 'brown'
  description: string
}

export interface Background {
  id: BackgroundId
  label: string
  profile: 'rain' | 'ocean'
  description: string
}

export const BANDS: Band[] = [
  {
    id: 'delta',
    name: 'Delta',
    beatRange: [0.5, 4.0],
    defaultBeatHz: 2.0,
    carrierHz: 160,
    description: 'Deep sleep — slow, heavy waves for falling into deep sleep and staying there.',
    preferredNoise: 'brown',
    icon: '🌒',
  },
  {
    id: 'theta',
    name: 'Theta',
    beatRange: [4.0, 8.0],
    defaultBeatHz: 6.0,
    carrierHz: 210,
    description:
      'Dreaming & meditation — the drifting, dreamy space before sleep and in deep meditation.',
    preferredNoise: 'brown',
    icon: '🌊',
  },
  {
    id: 'alpha',
    name: 'Alpha',
    beatRange: [8.0, 13.0],
    defaultBeatHz: 10.0,
    carrierHz: 240,
    description:
      'Relaxed focus — calm, clear, wakeful relaxation; good for reading or easing anxiety.',
    preferredNoise: 'pink',
    icon: '🌿',
  },
  {
    id: 'beta',
    name: 'Beta',
    beatRange: [14.0, 30.0],
    defaultBeatHz: 18.0,
    carrierHz: 300,
    description: 'Active focus — alert, analytical, on-task concentration for work or study.',
    preferredNoise: 'pink',
    icon: '⚡',
  },
  {
    id: 'gamma',
    name: 'Gamma',
    beatRange: [30.0, 50.0],
    defaultBeatHz: 40.0,
    carrierHz: 320,
    description: 'Peak focus — sharp, integrative attention for deep problem-solving.',
    preferredNoise: 'pink',
    icon: '🔆',
  },
]

export const NOISES: Noise[] = [
  {
    id: 'brown',
    label: 'Brown Noise',
    profile: 'brown',
    description: 'Deep, warm bass rumble — strong masking, great for sleep.',
  },
  {
    id: 'pink',
    label: 'Pink Noise',
    profile: 'pink',
    description: 'Balanced, gentle hiss — low fatigue, good for focus.',
  },
]

export const BACKGROUNDS: Background[] = [
  {
    id: 'rain',
    label: 'Steady Rain',
    profile: 'rain',
    description: 'Soft, steady rain bed — comfortable and calming.',
  },
  {
    id: 'ocean',
    label: 'Ocean Waves',
    profile: 'ocean',
    description: 'Slow ocean swell with a gentle rhythm.',
  },
]

export const DEFAULT_BAND: BandId = 'alpha'
export const DEFAULT_NOISE: NoiseId = 'pink'
export const DEFAULT_BACKGROUND: BackgroundId = 'none'
export const DEFAULT_TONE_GAIN = 0.2
export const DEFAULT_NOISE_GAIN = 0.6
export const DEFAULT_BACKGROUND_GAIN = 0.75

export function getBand(id: BandId): Band {
  return BANDS.find((b) => b.id === id) ?? BANDS[0]
}

export function getNoise(id: NoiseId): Noise {
  return NOISES.find((n) => n.id === id) ?? NOISES[0]
}

export function getBackground(id: BackgroundId): Background | null {
  if (id === 'none') return null
  return BACKGROUNDS.find((b) => b.id === id) ?? null
}
