import type { PercussiveParams } from './dsp/types'
import type { PresetDefinition } from './presets'

export type MutateDistance = 'S' | 'M' | 'L'

// Mutate stddev as a fraction of each parameter's range width.
// Spec: S = 5%, M = 15%, L = 30%.
const MUTATE_STDDEV_PCT: Record<MutateDistance, number> = {
  S: 0.05,
  M: 0.15,
  L: 0.3,
}

// Numeric params: randomized via uniform sampling, mutated via Gaussian
// perturbation. Categorical params (noise_type, filter_type, body_waveform)
// are randomized by uniform pick from the preset's allowed set, but mutate
// leaves them alone — mutate is for refinement, randomize for exploration.
const NUMERIC_KEYS: Array<keyof PercussiveParams> = [
  'impulse_duration_ms',
  'filter_freq_hz',
  'filter_q',
  'body_amount',
  'body_freq_hz',
  'body_decay_ms',
  'decay_ms',
  'decay_curve',
  'gain',
]

const CATEGORICAL_KEYS: Array<'noise_type' | 'filter_type' | 'body_waveform'> =
  ['noise_type', 'filter_type', 'body_waveform']

function snapValue(key: keyof PercussiveParams, value: number): number {
  switch (key) {
    case 'filter_freq_hz':
    case 'body_freq_hz':
    case 'impulse_duration_ms':
    case 'body_decay_ms':
    case 'decay_ms':
      return Math.round(value)
    case 'filter_q':
    case 'body_amount':
    case 'decay_curve':
    case 'gain':
      return Math.round(value * 100) / 100
    default:
      return value
  }
}

function gaussian(): number {
  const u1 = Math.max(Number.MIN_VALUE, Math.random())
  const u2 = Math.random()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

function pickFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function randomizeWithinPreset(
  preset: PresetDefinition,
): PercussiveParams {
  const params = { ...preset.defaults }

  for (const key of NUMERIC_KEYS) {
    const range = preset.ranges[key] as [number, number] | undefined
    if (!range) continue
    const [min, max] = range
    const raw = min + Math.random() * (max - min)
    ;(params as Record<string, number | string>)[key] = snapValue(key, raw)
  }

  for (const key of CATEGORICAL_KEYS) {
    const set = preset.ranges[key] as readonly string[] | undefined
    if (!set || set.length === 0) continue
    ;(params as Record<string, string | number>)[key] = pickFrom(set)
  }

  return params
}

export function mutateWithinPreset(
  preset: PresetDefinition,
  current: PercussiveParams,
  distance: MutateDistance,
): PercussiveParams {
  const params = { ...current }
  const pct = MUTATE_STDDEV_PCT[distance]
  for (const key of NUMERIC_KEYS) {
    const range = preset.ranges[key] as [number, number] | undefined
    if (!range) continue
    const [min, max] = range
    const stddev = (max - min) * pct
    const currentValue = (current as unknown as Record<string, number>)[key]
    const perturbed = currentValue + gaussian() * stddev
    const clamped = Math.max(min, Math.min(max, perturbed))
    ;(params as Record<string, number | string>)[key] = snapValue(key, clamped)
  }
  return params
}
