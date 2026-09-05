import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AtmosphereId, BandId } from '@/data/bands'

export interface Preset {
  id: string
  name: string
  band: BandId
  atmosphere: AtmosphereId
  toneGain: number
  atmosphereGain: number
  beatHz: number | null
}

const STORE_KEY = 'bt:presets:v1'

function read(): Preset[] {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    return raw ? (JSON.parse(raw) as Preset[]) : []
  } catch {
    return []
  }
}

function write(list: Preset[]) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(list))
  } catch {
    /* storage unavailable */
  }
}

function newId(): string {
  // Collision-resistant-enough id without a dep.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export const usePresetsStore = defineStore('presets', () => {
  const presets = ref<Preset[]>(read())

  function add(name: string, data: Omit<Preset, 'id' | 'name'>) {
    const preset: Preset = { id: newId(), name, ...data }
    presets.value = [...presets.value, preset]
    write(presets.value)
    return preset
  }

  function remove(id: string) {
    presets.value = presets.value.filter((p) => p.id !== id)
    write(presets.value)
  }

  function get(id: string): Preset | undefined {
    return presets.value.find((p) => p.id === id)
  }

  return { presets, add, remove, get }
})
