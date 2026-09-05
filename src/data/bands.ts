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
  /** Preferred atmosphere id; stays locked while this band is active. */
  preferredAtmosphere: AtmosphereId
  icon: string
}

export type AtmosphereId = 'pink' | 'brown' | 'rain' | 'ocean'

export interface Atmosphere {
  id: AtmosphereId
  label: string
  /** Synthesis profile. rain/pink/ocean/brown are all generated offline-capable. */
  profile: 'pink' | 'brown' | 'rain' | 'ocean'
  description: string
  /** Short human label for the noise-type picker. */
  kind: string
}

export const BANDS: Band[] = [
  {
    id: 'delta',
    name: 'Delta',
    beatRange: [0.5, 4.0],
    defaultBeatHz: 2.0,
    carrierHz: 160,
    description: 'Deep sleep — slow, heavy waves for falling into deep sleep and staying there.',
    preferredAtmosphere: 'brown',
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
    preferredAtmosphere: 'brown',
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
    preferredAtmosphere: 'pink',
    icon: '🌿',
  },
  {
    id: 'beta',
    name: 'Beta',
    beatRange: [14.0, 30.0],
    defaultBeatHz: 18.0,
    carrierHz: 300,
    description: 'Active focus — alert, analytical, on-task concentration for work or study.',
    preferredAtmosphere: 'pink',
    icon: '⚡',
  },
  {
    id: 'gamma',
    name: 'Gamma',
    beatRange: [30.0, 50.0],
    defaultBeatHz: 40.0,
    carrierHz: 320,
    description: 'Peak focus — sharp, integrative attention for deep problem-solving.',
    preferredAtmosphere: 'pink',
    icon: '🔆',
  },
]

export const ATMOSPHERES: Atmosphere[] = [
  {
    id: 'brown',
    label: 'Brown Noise',
    profile: 'brown',
    kind: 'Noise',
    description: 'Deep, warm bass rumble — strong masking, great for sleep.',
  },
  {
    id: 'pink',
    label: 'Pink Noise',
    profile: 'pink',
    kind: 'Noise',
    description: 'Balanced, gentle white-ish hiss — low fatigue, good for focus.',
  },
  {
    id: 'rain',
    label: 'Steady Rain',
    profile: 'rain',
    kind: 'Background',
    description: 'Soft, steady rain bed — comfortable and calming.',
  },
  {
    id: 'ocean',
    label: 'Ocean Waves',
    profile: 'ocean',
    kind: 'Background',
    description: 'Slow ocean swell with a gentle rhythm.',
  },
]

export const DEFAULT_BAND: BandId = 'alpha'
export const DEFAULT_ATMOSPHERE: AtmosphereId = 'pink'
export const DEFAULT_TONE_GAIN = 0.2
export const DEFAULT_ATMOSPHERE_GAIN = 0.75

export function getBand(id: BandId): Band {
  return BANDS.find((b) => b.id === id) ?? BANDS[0]
}

export function getAtmosphere(id: AtmosphereId): Atmosphere {
  return ATMOSPHERES.find((a) => a.id === id) ?? ATMOSPHERES[0]
}
