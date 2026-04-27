import type { PercussiveParams } from './dsp/types'
import type { PatternConfig } from './dsp/pattern/types'
import type { FXConfig } from './dsp/fx/types'

export type PresetKey =
  | 'click'
  | 'tick'
  | 'tap'
  | 'pop'
  | 'snap'
  | 'impact'
  | 'thud'
  | 'clank'

// Numeric-param keys: a [min, max] tuple. Categorical-param keys: an array of
// allowed values (length 1 = effectively fixed; length >1 = randomize picks
// uniformly among them).
type RangeFor<T> = [T] extends [number] ? [number, number] : readonly T[]

export interface PresetDefinition {
  key: PresetKey
  name: string
  description: string
  defaults: PercussiveParams
  // Parameters absent from `ranges` are fixed at their default value across
  // all variations of the preset — that fixed-vs-variable distinction is
  // structural and expresses the preset's categorical identity (e.g., Tap is
  // always BP-filtered; changing that would make it a different preset).
  ranges: {
    [K in keyof PercussiveParams]?: RangeFor<PercussiveParams[K]>
  }
  // Optional pattern shipped with the preset. When set, selecting this preset
  // also applies this pattern (with `enabled: true`); when absent, selection
  // resets pattern to default.
  pattern?: Omit<PatternConfig, 'enabled'>
  // Optional FX chain shipped with the preset. When absent, selection resets
  // FX to DEFAULT_FX_CONFIG.
  fx?: FXConfig
}

export const PRESETS: Record<PresetKey, PresetDefinition> = {
  click: {
    key: 'click',
    name: 'Click',
    description: 'Bright, snappy, transient-dominated. Prototypical UI click.',
    defaults: {
      noise_type: 'white',
      impulse_duration_ms: 8,
      filter_type: 'highpass',
      filter_freq_hz: 3500,
      filter_q: 2.5,
      body_amount: 0.2,
      body_freq_hz: 1200,
      body_decay_ms: 15,
      body_waveform: 'sine',
      decay_ms: 50,
      decay_curve: 0.2,
      gain: 0.8,
    },
    ranges: {
      noise_type: ['white', 'pink'],
      impulse_duration_ms: [4, 12],
      filter_freq_hz: [2000, 6000],
      filter_q: [1.5, 5],
      body_amount: [0, 0.4],
      body_freq_hz: [800, 2000],
      body_decay_ms: [8, 25],
      decay_ms: [30, 80],
      decay_curve: [0.0, 0.4],
      gain: [0.7, 0.9],
    },
  },
  tick: {
    key: 'tick',
    name: 'Tick',
    description: 'Very short, very bright, transient-only. Clock/checkbox.',
    defaults: {
      noise_type: 'white',
      impulse_duration_ms: 4,
      filter_type: 'highpass',
      filter_freq_hz: 6500,
      filter_q: 3.5,
      body_amount: 0.05,
      body_freq_hz: 2000,
      body_decay_ms: 8,
      body_waveform: 'sine',
      decay_ms: 30,
      decay_curve: 0.1,
      gain: 0.7,
    },
    ranges: {
      impulse_duration_ms: [2, 7],
      filter_freq_hz: [5000, 9000],
      filter_q: [2, 6],
      body_amount: [0, 0.2],
      body_freq_hz: [1500, 2500],
      body_decay_ms: [5, 15],
      decay_ms: [20, 45],
      decay_curve: [0.0, 0.3],
      gain: [0.6, 0.85],
    },
  },
  tap: {
    key: 'tap',
    name: 'Tap',
    description: 'Softer, mid-range, slightly resonant. Finger on surface.',
    defaults: {
      noise_type: 'pink',
      impulse_duration_ms: 12,
      filter_type: 'bandpass',
      filter_freq_hz: 1500,
      filter_q: 4,
      body_amount: 0.4,
      body_freq_hz: 600,
      body_decay_ms: 30,
      body_waveform: 'sine',
      decay_ms: 80,
      decay_curve: 0.3,
      gain: 0.7,
    },
    ranges: {
      impulse_duration_ms: [8, 18],
      filter_freq_hz: [800, 2500],
      filter_q: [2.5, 7],
      body_amount: [0.2, 0.6],
      body_freq_hz: [400, 1000],
      body_decay_ms: [20, 45],
      decay_ms: [50, 120],
      decay_curve: [0.1, 0.5],
      gain: [0.6, 0.85],
    },
  },
  pop: {
    key: 'pop',
    name: 'Pop',
    description: 'Round, bubbly, body-dominated. Bubble bursting / boop.',
    defaults: {
      noise_type: 'pink',
      impulse_duration_ms: 5,
      filter_type: 'bandpass',
      filter_freq_hz: 1800,
      filter_q: 5,
      body_amount: 0.75,
      body_freq_hz: 1500,
      body_decay_ms: 35,
      body_waveform: 'sine',
      decay_ms: 70,
      decay_curve: 0.25,
      gain: 0.7,
    },
    ranges: {
      impulse_duration_ms: [3, 10],
      filter_freq_hz: [1000, 3000],
      filter_q: [3, 8],
      body_amount: [0.55, 0.9],
      body_freq_hz: [800, 2500],
      body_decay_ms: [20, 50],
      decay_ms: [45, 110],
      decay_curve: [0.1, 0.4],
      gain: [0.6, 0.85],
    },
  },
  snap: {
    key: 'snap',
    name: 'Snap',
    description: 'Sharp, fast, prominent transient. Finger snap / stick break.',
    defaults: {
      noise_type: 'white',
      impulse_duration_ms: 6,
      filter_type: 'highpass',
      filter_freq_hz: 4500,
      filter_q: 2,
      body_amount: 0.1,
      body_freq_hz: 1000,
      body_decay_ms: 12,
      body_waveform: 'sine',
      decay_ms: 35,
      decay_curve: 0.05,
      gain: 0.85,
    },
    ranges: {
      body_waveform: ['sine', 'triangle'],
      impulse_duration_ms: [3, 10],
      filter_freq_hz: [3000, 7000],
      filter_q: [1, 4],
      body_amount: [0, 0.25],
      body_freq_hz: [600, 1500],
      body_decay_ms: [8, 20],
      decay_ms: [25, 55],
      decay_curve: [0.0, 0.2],
      gain: [0.75, 0.95],
    },
  },
  impact: {
    key: 'impact',
    name: 'Impact',
    description: 'Heavier, lower, resonance-dominated. Solid hits solid.',
    defaults: {
      noise_type: 'pink',
      impulse_duration_ms: 20,
      filter_type: 'lowpass',
      filter_freq_hz: 800,
      filter_q: 3,
      body_amount: 0.65,
      body_freq_hz: 350,
      body_decay_ms: 45,
      body_waveform: 'sine',
      decay_ms: 130,
      decay_curve: 0.4,
      gain: 0.85,
    },
    ranges: {
      noise_type: ['pink', 'brown'],
      body_waveform: ['sine', 'triangle'],
      impulse_duration_ms: [12, 30],
      filter_freq_hz: [400, 1500],
      filter_q: [1.5, 5],
      body_amount: [0.4, 0.85],
      body_freq_hz: [200, 700],
      body_decay_ms: [30, 60],
      decay_ms: [90, 180],
      decay_curve: [0.2, 0.6],
      gain: [0.75, 0.95],
    },
  },
  thud: {
    key: 'thud',
    name: 'Thud',
    description: 'Soft, low, dampened. Heavy on soft (book on carpet).',
    defaults: {
      noise_type: 'pink',
      impulse_duration_ms: 25,
      filter_type: 'lowpass',
      filter_freq_hz: 500,
      filter_q: 1.5,
      body_amount: 0.55,
      body_freq_hz: 200,
      body_decay_ms: 50,
      body_waveform: 'sine',
      decay_ms: 150,
      decay_curve: 0.5,
      gain: 0.75,
    },
    ranges: {
      noise_type: ['pink', 'brown'],
      impulse_duration_ms: [15, 40],
      filter_freq_hz: [300, 900],
      filter_q: [0.7, 3],
      body_amount: [0.3, 0.75],
      body_freq_hz: [120, 400],
      body_decay_ms: [35, 60],
      decay_ms: [100, 200],
      decay_curve: [0.3, 0.7],
      gain: [0.65, 0.85],
    },
  },
  clank: {
    key: 'clank',
    name: 'Clank',
    description: 'Metallic, ringing, high-Q resonance. Metal-on-metal.',
    defaults: {
      noise_type: 'white',
      impulse_duration_ms: 10,
      filter_type: 'bandpass',
      filter_freq_hz: 2800,
      filter_q: 12,
      body_amount: 0.7,
      body_freq_hz: 1200,
      body_decay_ms: 50,
      body_waveform: 'triangle',
      decay_ms: 160,
      decay_curve: 0.3,
      gain: 0.8,
    },
    ranges: {
      impulse_duration_ms: [5, 15],
      filter_freq_hz: [1500, 4500],
      filter_q: [8, 18],
      body_amount: [0.5, 0.85],
      body_freq_hz: [700, 2000],
      body_decay_ms: [35, 60],
      decay_ms: [110, 200],
      decay_curve: [0.1, 0.5],
      gain: [0.7, 0.9],
    },
  },
}

export const PRESET_ORDER: PresetKey[] = [
  'click',
  'tick',
  'tap',
  'pop',
  'snap',
  'impact',
  'thud',
  'clank',
]
