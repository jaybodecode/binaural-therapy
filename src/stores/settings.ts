import type { AtmosphereId, BandId } from '@/data/bands'
import {
  DEFAULT_ATMOSPHERE,
  DEFAULT_ATMOSPHERE_GAIN,
  DEFAULT_BAND,
  DEFAULT_TONE_GAIN,
} from '@/data/bands'
import { DEFAULT_SPATIAL, type PanningMode } from '@/audio/panning'

const KEY = 'bt:settings:v1'

export interface SpatialSettings {
  mode: PanningMode
  azimuth: number
  elevation: number
  driftSpeed: number
  wanderRadius: number
  distance: number
}

export interface Settings {
  band: BandId
  atmosphere: AtmosphereId
  toneGain: number
  atmosphereGain: number
  /** Optional custom beat override within the band range (Hz). null = band default. */
  beatHz: number | null
  spatial: SpatialSettings
}

export function defaultSettings(): Settings {
  return {
    band: DEFAULT_BAND,
    atmosphere: DEFAULT_ATMOSPHERE,
    toneGain: DEFAULT_TONE_GAIN,
    atmosphereGain: DEFAULT_ATMOSPHERE_GAIN,
    beatHz: null,
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
