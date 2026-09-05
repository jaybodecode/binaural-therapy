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
  /** Target cognitive state copy. */
  target: string
  /** Preferred noise profile id. */
  preferredAtmosphere: AtmosphereId
  /** One-sentence evidence note (from appspec §3). */
  note: string
  icon: string
}

export type AtmosphereId = 'pink' | 'brown'

export interface Atmosphere {
  id: AtmosphereId
  label: string
  /** Noise profile: 1/f (pink, -3 dB/oct) or 1/f^2 (brown, -6 dB/oct). */
  profile: 'pink' | 'brown'
  description: string
}

export const BANDS: Band[] = [
  {
    id: 'delta',
    name: 'Delta',
    beatRange: [0.5, 4.0],
    defaultBeatHz: 2.0,
    carrierHz: 160,
    target: 'Deep slow-wave sleep, restoration',
    preferredAtmosphere: 'brown',
    note: 'Drives slow-wave amplitude; matches Papalambros 2017 (closed-loop PLL not replicated).',
    icon: '🌒',
  },
  {
    id: 'theta',
    name: 'Theta',
    beatRange: [4.0, 8.0],
    defaultBeatHz: 6.0,
    carrierHz: 210,
    target: 'Hypnagogia, deep relaxation, meditation',
    preferredAtmosphere: 'brown',
    note: 'Hypnagogic state; lowest carrier to keep the beat audible.',
    icon: '🌊',
  },
  {
    id: 'alpha',
    name: 'Alpha',
    beatRange: [8.0, 13.0],
    defaultBeatHz: 10.0,
    carrierHz: 240,
    target: 'Calm focus, wakeful relaxation',
    preferredAtmosphere: 'pink',
    note: 'Bridges alertness and calm; most-studied in pre-operative anxiety.',
    icon: '🌿',
  },
  {
    id: 'beta',
    name: 'Beta',
    beatRange: [14.0, 30.0],
    defaultBeatHz: 18.0,
    carrierHz: 300,
    target: 'Active concentration, working memory',
    preferredAtmosphere: 'pink',
    note: 'Increases vigilance; use sparingly — sustained beta can be arousing.',
    icon: '⚡',
  },
  {
    id: 'gamma',
    name: 'Gamma',
    beatRange: [30.0, 50.0],
    defaultBeatHz: 40.0,
    carrierHz: 320,
    target: 'Information synthesis, exploratory',
    preferredAtmosphere: 'pink',
    note: '40 Hz is the Adaikkan GENUS frequency — preclinical only.',
    icon: '🔆',
  },
]

export const ATMOSPHERES: Atmosphere[] = [
  {
    id: 'pink',
    label: 'Pink Noise',
    profile: 'pink',
    description: '1/f spectrum — matches resting EEG scaling. Neutral, minimal arousal.',
  },
  {
    id: 'brown',
    label: 'Brown Noise',
    profile: 'brown',
    description: '1/f² — deep, warm bass. Strong masking against environmental transients.',
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
