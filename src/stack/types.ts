import type { PatternConfig } from '../dsp/pattern/types'
import type { SoundSpec } from '../spec'

export interface StackLayer {
  id: string
  // Reference to a library entry by ID (compact mode), or an inline SoundSpec
  // (flattened mode — used for self-contained sharing).
  ref: string | SoundSpec
  offset_ms: number
  gain: number
  mute: boolean
  solo?: boolean              // NOT persisted; transient authoring only
  pattern?: PatternConfig     // Per-layer pattern, replaces source's pattern in stack context
  // Required for atmospheric layers (continuous source needs a bounded render
  // window). Ignored for percussive/tonal layers — those have natural durations
  // from their amp envelopes. Defaults applied at render time when undefined.
  duration_ms?: number
}

export interface Stack {
  layers: StackLayer[]
  pattern?: PatternConfig    // Stack-level pattern
}

export const EMPTY_STACK: Stack = { layers: [] }

export function newLayerId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `layer_${Date.now()}_${Math.random()}`
}
