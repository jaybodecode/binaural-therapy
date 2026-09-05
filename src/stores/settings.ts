import type { AtmosphereId, BandId } from '@/data/bands'
import {
  DEFAULT_ATMOSPHERE,
  DEFAULT_ATMOSPHERE_GAIN,
  DEFAULT_BAND,
  DEFAULT_TONE_GAIN,
} from '@/data/bands'

const KEY = 'bt:settings:v1'

export interface Settings {
  band: BandId
  atmosphere: AtmosphereId
  toneGain: number
  atmosphereGain: number
  /** Optional custom beat override within the band range (Hz). null = band default. */
  beatHz: number | null
}

export function defaultSettings(): Settings {
  return {
    band: DEFAULT_BAND,
    atmosphere: DEFAULT_ATMOSPHERE,
    toneGain: DEFAULT_TONE_GAIN,
    atmosphereGain: DEFAULT_ATMOSPHERE_GAIN,
    beatHz: null,
  }
}

export function loadSettings(): Settings {
  if (typeof localStorage === 'undefined') return defaultSettings()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultSettings()
    const parsed = JSON.parse(raw) as Partial<Settings>
    return { ...defaultSettings(), ...parsed }
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
