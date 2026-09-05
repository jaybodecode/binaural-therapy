import type { BackgroundId, BandId, NoiseId } from '@/data/bands'
import {
  DEFAULT_BACKGROUND,
  DEFAULT_BACKGROUND_GAIN,
  DEFAULT_BAND,
  DEFAULT_NOISE,
  DEFAULT_NOISE_GAIN,
  DEFAULT_TONE_GAIN,
} from '@/data/bands'
import { DEFAULT_SPATIAL } from '@/audio/panning'

const KEY = 'bt:settings:v1'

export interface SpatialSettings {
  mode: 'off' | 'surround' | 'drift'
  azimuth: number
  elevation: number
  driftSpeed: number
  wanderRadius: number
  distance: number
}

export interface Settings {
  band: BandId
  beatHz: number | null
  toneGain: number
  noise: NoiseId
  noiseGain: number
  background: BackgroundId
  backgroundGain: number
  spatial: SpatialSettings
}

export function defaultSettings(): Settings {
  return {
    band: DEFAULT_BAND,
    beatHz: null,
    toneGain: DEFAULT_TONE_GAIN,
    noise: DEFAULT_NOISE,
    noiseGain: DEFAULT_NOISE_GAIN,
    background: DEFAULT_BACKGROUND,
    backgroundGain: DEFAULT_BACKGROUND_GAIN,
    spatial: { ...DEFAULT_SPATIAL },
  }
}

export function loadSettings(): Settings {
  if (typeof localStorage === 'undefined') return defaultSettings()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultSettings()
    const parsed = JSON.parse(raw) as Partial<Settings>
    return { ...defaultSettings(), ...parsed, spatial: { ...DEFAULT_SPATIAL, ...parsed.spatial } }
  } catch {
    return defaultSettings()
  }
}

export function saveSettings(s: Settings): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* storage unavailable — ignore */
  }
}
