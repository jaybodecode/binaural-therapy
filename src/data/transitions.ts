export type TransitMode = 'state-lock' | 'power-nap' | 'go-to-bed' | 'oscillate' | 'sleep-journey'

export interface TransitStep {
  beat: number
  holdMs: number
  label: string
}

export interface TransitDef {
  id: TransitMode
  label: string
  description: string
  /** Beacon beats for the current band → target state. */
  steps: (bandBeat: number, bandName: string) => TransitStep[]
}

/**
 * State-transition paths grounded in the binaural/nap literature (appspec §3)
 * and the band catalogue (§4). Frequencies are beat Δf in Hz.
 */
export const TRANSIT_MODES: TransitDef[] = [
  {
    id: 'state-lock',
    label: 'State lock',
    description: 'Stay in the chosen state — no automatic changes.',
    steps: () => [],
  },
  {
    id: 'power-nap',
    label: 'Power nap',
    description:
      'Settle down to Theta (6 Hz) for a short nap, then NREM to deep Delta, then come back up to wake refreshed.',
    steps: (bandBeat, name) => [
      { beat: Math.min(bandBeat, 18), holdMs: 60000, label: `Start (${name})` },
      { beat: 6, holdMs: 5 * 60 * 1000, label: 'Theta nap' },
      { beat: 2, holdMs: 10 * 60 * 1000, label: 'Delta deep sleep' },
      { beat: 10, holdMs: 60 * 1000, label: 'Alpha waking' },
      { beat: 18, holdMs: 30 * 1000, label: 'Beta alert' },
      { beat: 0, holdMs: 0, label: 'End' },
    ],
  },
  {
    id: 'go-to-bed',
    label: 'Go to bed',
    description:
      'Wind down from whatever you are doing (Beta/Alpha) into Theta, then deep Delta sleep.',
    steps: (bandBeat) => [
      { beat: bandBeat, holdMs: 3 * 60 * 1000, label: 'Wind down' },
      { beat: 9, holdMs: 4 * 60 * 1000, label: 'Alpha' },
      { beat: 5, holdMs: 5 * 60 * 1000, label: 'Theta' },
      { beat: 2, holdMs: 30 * 60 * 1000, label: 'Delta sleep' },
      { beat: 0, holdMs: 0, label: 'Asleep' },
    ],
  },
  {
    id: 'oscillate',
    label: 'Oscillate',
    description:
      'Gently cycle between Theta and Delta — a dreamy, oscillating drift through the mid bands.',
    steps: () => [
      { beat: 8, holdMs: 2 * 60 * 1000, label: 'Theta' },
      { beat: 2, holdMs: 2 * 60 * 1000, label: 'Delta' },
      { beat: 8, holdMs: 2 * 60 * 1000, label: 'Theta' },
      { beat: 2, holdMs: 2 * 60 * 1000, label: 'Delta' },
    ],
  },
  {
    id: 'sleep-journey',
    label: 'Sleep journey',
    description:
      'Settle into bed over ~45 min: Beta → Alpha → Theta → Delta, then the tones fade away leaving only brown noise to mask the room.',
    steps: () => [],
  },
]

export function getTransit(id: TransitMode): TransitDef {
  return TRANSIT_MODES.find((t) => t.id === id) ?? TRANSIT_MODES[0]
}
