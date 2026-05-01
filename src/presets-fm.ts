import type { FmAlgorithm, FmOperator, FmParams } from './dsp/fm/types'
import type { FXConfig } from './dsp/fx/types'

export type FmPresetKey =
  | 'bell'
  | 'epiano'
  | 'bass'
  | 'brass'
  | 'glass'
  | 'bass_drop'

type RangeFor<T> = [T] extends [number] ? [number, number] : readonly T[]

// Per-operator ranges shared across all 4 ops within a preset. If a preset
// needs op-specific ranges later, this can become a 4-tuple.
export interface FmOperatorRanges {
  ratio?: [number, number]
  fixed_freq_hz?: [number, number]
  detune_cents?: [number, number]
  level?: [number, number]
  env_attack_ms?: [number, number]
  env_decay_ms?: [number, number]
  env_sustain?: [number, number]
  env_release_ms?: [number, number]
  fixed?: readonly boolean[]
}

type FmTopLevel = Omit<FmParams, 'op1' | 'op2' | 'op3' | 'op4'>

export interface FmPresetDefinition {
  key: FmPresetKey
  name: string
  description: string
  defaults: FmParams
  ranges: {
    [K in keyof FmTopLevel]?: RangeFor<FmTopLevel[K]>
  }
  // Shared per-operator ranges. randomize/mutate apply these to all 4 ops.
  opRanges?: FmOperatorRanges
  fx?: FXConfig
}

// Helper for constructing operators concisely. Defaults to a "pure carrier"
// shape (ratio 1, full sustain, instant attack/release).
function op(overrides: Partial<FmOperator> = {}): FmOperator {
  return {
    ratio: 1,
    fixed: false,
    fixed_freq_hz: 100,
    detune_cents: 0,
    level: 1,
    env_attack_ms: 0,
    env_decay_ms: 0,
    env_sustain: 1,
    env_release_ms: 0,
    ...overrides,
  }
}

// ---------- Presets ----------

const BELL: FmPresetDefinition = {
  key: 'bell',
  name: 'Bell',
  description:
    'Classic FM bell — three modulators on a single carrier, fast attack, long exponential decay.',
  defaults: {
    base_pitch_semitones: 0,
    algorithm: 7 as FmAlgorithm,
    op1: op({ ratio: 14, level: 0.7, env_attack_ms: 0, env_decay_ms: 800, env_sustain: 0, env_release_ms: 200 }),
    op2: op({ ratio: 3.5, level: 0.5, env_attack_ms: 0, env_decay_ms: 600, env_sustain: 0, env_release_ms: 200 }),
    op3: op({ ratio: 1, level: 0.4, env_attack_ms: 0, env_decay_ms: 1200, env_sustain: 0, env_release_ms: 200 }),
    op4: op({ ratio: 1, level: 0.9, env_attack_ms: 0, env_decay_ms: 1800, env_sustain: 0, env_release_ms: 300 }),
    fm_amount: 1.4,
    feedback: 0,
    filter_type: 'lowpass',
    filter_freq_hz: 12000,
    filter_q: 0.7,
    amp_attack_ms: 2,
    amp_decay_ms: 600,
    amp_sustain: 0.0,
    amp_release_ms: 800,
    pitch_env_amount_oct: 0,
    pitch_env_attack_ms: 0,
    pitch_env_decay_ms: 50,
    lfo_rate_hz: 5,
    lfo_depth: 0,
    lfo_shape: 'sine',
    lfo_target: 'off',
    gain: 0.85,
  },
  ranges: {
    base_pitch_semitones: [-12, 12],
    fm_amount: [0.6, 2.5],
    feedback: [0, 0.2],
    filter_freq_hz: [4000, 16000],
    amp_release_ms: [400, 1500],
    gain: [0.75, 0.9],
  },
  opRanges: {
    ratio: [1, 16],
    detune_cents: [-5, 5],
    level: [0.3, 0.95],
    env_decay_ms: [400, 2000],
  },
}

const EPIANO: FmPresetDefinition = {
  key: 'epiano',
  name: 'E.Piano',
  description: 'DX7-style electric piano — two modulators feeding a chain, gentle feedback.',
  defaults: {
    base_pitch_semitones: 0,
    algorithm: 5 as FmAlgorithm,
    op1: op({ ratio: 14, level: 0.35, env_attack_ms: 0, env_decay_ms: 400, env_sustain: 0.1, env_release_ms: 300 }),
    op2: op({ ratio: 1, level: 0.45, env_attack_ms: 0, env_decay_ms: 600, env_sustain: 0.2, env_release_ms: 400 }),
    op3: op({ ratio: 1, level: 0.7, env_attack_ms: 0, env_decay_ms: 800, env_sustain: 0.15, env_release_ms: 500 }),
    op4: op({ ratio: 1, level: 0.95, env_attack_ms: 0, env_decay_ms: 1500, env_sustain: 0.4, env_release_ms: 600 }),
    fm_amount: 1.0,
    feedback: 0.15,
    filter_type: 'lowpass',
    filter_freq_hz: 9000,
    filter_q: 0.7,
    amp_attack_ms: 2,
    amp_decay_ms: 800,
    amp_sustain: 0.3,
    amp_release_ms: 600,
    pitch_env_amount_oct: 0,
    pitch_env_attack_ms: 0,
    pitch_env_decay_ms: 50,
    lfo_rate_hz: 4,
    lfo_depth: 0,
    lfo_shape: 'sine',
    lfo_target: 'off',
    gain: 0.85,
  },
  ranges: {
    base_pitch_semitones: [-12, 12],
    fm_amount: [0.7, 1.6],
    feedback: [0.05, 0.3],
    amp_decay_ms: [400, 1200],
    amp_sustain: [0.2, 0.5],
    gain: [0.75, 0.9],
  },
  opRanges: {
    ratio: [1, 16],
    level: [0.3, 0.95],
    env_decay_ms: [300, 1500],
    env_sustain: [0.0, 0.4],
  },
}

const BASS: FmPresetDefinition = {
  key: 'bass',
  name: 'Bass',
  description: 'Deep FM stack — punchy, harmonically rich low end.',
  defaults: {
    base_pitch_semitones: -24,
    algorithm: 1 as FmAlgorithm,
    op1: op({ ratio: 1, level: 0.4, env_attack_ms: 0, env_decay_ms: 200, env_sustain: 0.3, env_release_ms: 100 }),
    op2: op({ ratio: 1, level: 0.6, env_attack_ms: 0, env_decay_ms: 200, env_sustain: 0.5, env_release_ms: 100 }),
    op3: op({ ratio: 2, level: 0.5, env_attack_ms: 0, env_decay_ms: 200, env_sustain: 0.5, env_release_ms: 100 }),
    op4: op({ ratio: 1, level: 0.95, env_attack_ms: 0, env_decay_ms: 400, env_sustain: 0.6, env_release_ms: 150 }),
    fm_amount: 1.6,
    feedback: 0.25,
    filter_type: 'lowpass',
    filter_freq_hz: 4000,
    filter_q: 1.5,
    amp_attack_ms: 2,
    amp_decay_ms: 200,
    amp_sustain: 0.6,
    amp_release_ms: 200,
    pitch_env_amount_oct: 0,
    pitch_env_attack_ms: 0,
    pitch_env_decay_ms: 50,
    lfo_rate_hz: 4,
    lfo_depth: 0,
    lfo_shape: 'sine',
    lfo_target: 'off',
    gain: 0.85,
  },
  ranges: {
    base_pitch_semitones: [-36, -12],
    fm_amount: [0.8, 2.5],
    feedback: [0.1, 0.5],
    filter_freq_hz: [800, 8000],
    filter_q: [0.7, 4],
    amp_sustain: [0.3, 0.8],
    gain: [0.75, 0.9],
  },
  opRanges: {
    ratio: [0.5, 4],
    level: [0.4, 0.95],
    env_decay_ms: [100, 600],
    env_sustain: [0.2, 0.7],
  },
}

const BRASS: FmPresetDefinition = {
  key: 'brass',
  name: 'Brass',
  description: 'Parallel FM pairs with slow attack — synth brass character.',
  defaults: {
    base_pitch_semitones: 0,
    algorithm: 2 as FmAlgorithm,
    op1: op({ ratio: 1, level: 0.6, env_attack_ms: 80, env_decay_ms: 400, env_sustain: 0.6, env_release_ms: 300 }),
    op2: op({ ratio: 1, level: 0.85, env_attack_ms: 100, env_decay_ms: 400, env_sustain: 0.7, env_release_ms: 300 }),
    op3: op({ ratio: 2, level: 0.5, env_attack_ms: 80, env_decay_ms: 400, env_sustain: 0.5, env_release_ms: 300 }),
    op4: op({ ratio: 1, level: 0.85, env_attack_ms: 100, env_decay_ms: 400, env_sustain: 0.7, env_release_ms: 300 }),
    fm_amount: 1.2,
    feedback: 0.1,
    filter_type: 'lowpass',
    filter_freq_hz: 8000,
    filter_q: 0.7,
    amp_attack_ms: 100,
    amp_decay_ms: 400,
    amp_sustain: 0.7,
    amp_release_ms: 400,
    pitch_env_amount_oct: 0,
    pitch_env_attack_ms: 0,
    pitch_env_decay_ms: 50,
    lfo_rate_hz: 5.5,
    lfo_depth: 0.15,
    lfo_shape: 'sine',
    lfo_target: 'pitch',
    gain: 0.8,
  },
  ranges: {
    base_pitch_semitones: [-12, 12],
    fm_amount: [0.7, 1.8],
    feedback: [0.0, 0.3],
    amp_attack_ms: [50, 200],
    amp_sustain: [0.5, 0.85],
    lfo_rate_hz: [4, 7],
    lfo_depth: [0.05, 0.3],
    gain: [0.7, 0.9],
  },
  opRanges: {
    ratio: [1, 4],
    level: [0.4, 0.9],
    env_attack_ms: [40, 200],
    env_decay_ms: [200, 800],
    env_sustain: [0.4, 0.8],
  },
}

const GLASS: FmPresetDefinition = {
  key: 'glass',
  name: 'Glass',
  description: 'Pure additive (algorithm 8) with inharmonic ratios — slow, glassy swells.',
  defaults: {
    base_pitch_semitones: 0,
    algorithm: 8 as FmAlgorithm,
    op1: op({ ratio: 1, level: 0.6, env_attack_ms: 200, env_decay_ms: 800, env_sustain: 0.4, env_release_ms: 800 }),
    op2: op({ ratio: 2.76, level: 0.4, env_attack_ms: 300, env_decay_ms: 1000, env_sustain: 0.3, env_release_ms: 800 }),
    op3: op({ ratio: 5.4, level: 0.25, env_attack_ms: 400, env_decay_ms: 1200, env_sustain: 0.2, env_release_ms: 800 }),
    op4: op({ ratio: 8.93, level: 0.15, env_attack_ms: 500, env_decay_ms: 1500, env_sustain: 0.1, env_release_ms: 800 }),
    fm_amount: 0,
    feedback: 0,
    filter_type: 'lowpass',
    filter_freq_hz: 12000,
    filter_q: 0.7,
    amp_attack_ms: 200,
    amp_decay_ms: 800,
    amp_sustain: 0.5,
    amp_release_ms: 1500,
    pitch_env_amount_oct: 0,
    pitch_env_attack_ms: 0,
    pitch_env_decay_ms: 50,
    lfo_rate_hz: 0.6,
    lfo_depth: 0.2,
    lfo_shape: 'sine',
    lfo_target: 'amp',
    gain: 0.8,
  },
  ranges: {
    base_pitch_semitones: [-12, 12],
    amp_attack_ms: [100, 400],
    amp_release_ms: [800, 2000],
    lfo_rate_hz: [0.3, 1.5],
    lfo_depth: [0.1, 0.4],
    gain: [0.7, 0.9],
  },
  opRanges: {
    ratio: [1, 12],
    level: [0.05, 0.7],
    env_attack_ms: [100, 600],
    env_decay_ms: [600, 1800],
    env_sustain: [0.05, 0.5],
  },
}

const BASS_DROP: FmPresetDefinition = {
  key: 'bass_drop',
  name: 'Bass Drop',
  description: 'FM stack with deep downward pitch sweep and a fixed-Hz sub carrier.',
  defaults: {
    base_pitch_semitones: -12,
    algorithm: 1 as FmAlgorithm,
    op1: op({ ratio: 0.5, level: 0.6, env_attack_ms: 0, env_decay_ms: 1200, env_sustain: 0.4, env_release_ms: 400 }),
    op2: op({ ratio: 1, level: 0.7, env_attack_ms: 0, env_decay_ms: 1500, env_sustain: 0.5, env_release_ms: 400 }),
    op3: op({ ratio: 1, level: 0.6, env_attack_ms: 0, env_decay_ms: 1500, env_sustain: 0.5, env_release_ms: 400 }),
    op4: op({ fixed: true, fixed_freq_hz: 55, level: 1.0, env_attack_ms: 0, env_decay_ms: 1500, env_sustain: 0.7, env_release_ms: 500 }),
    fm_amount: 2.0,
    feedback: 0.3,
    filter_type: 'lowpass',
    filter_freq_hz: 2200,
    filter_q: 1.2,
    amp_attack_ms: 4,
    amp_decay_ms: 1200,
    amp_sustain: 0.6,
    amp_release_ms: 600,
    pitch_env_amount_oct: -1.5,
    pitch_env_attack_ms: 20,
    pitch_env_decay_ms: 800,
    lfo_rate_hz: 4,
    lfo_depth: 0,
    lfo_shape: 'sine',
    lfo_target: 'off',
    gain: 0.9,
  },
  ranges: {
    base_pitch_semitones: [-24, -6],
    fm_amount: [1.0, 3.0],
    feedback: [0.15, 0.5],
    filter_freq_hz: [800, 4500],
    pitch_env_amount_oct: [-2, -0.8],
    pitch_env_decay_ms: [400, 1500],
    gain: [0.8, 0.95],
  },
  opRanges: {
    ratio: [0.5, 4],
    level: [0.4, 1.0],
    env_decay_ms: [600, 2500],
    env_sustain: [0.3, 0.8],
  },
}

export const FM_PRESETS: Record<FmPresetKey, FmPresetDefinition> = {
  bell: BELL,
  epiano: EPIANO,
  bass: BASS,
  brass: BRASS,
  glass: GLASS,
  bass_drop: BASS_DROP,
}

export const FM_PRESET_ORDER: FmPresetKey[] = [
  'bell',
  'epiano',
  'bass',
  'brass',
  'glass',
  'bass_drop',
]
