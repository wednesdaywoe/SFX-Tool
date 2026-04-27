import type { TonalParams } from './dsp/types'
import type { TonalPresetDefinition } from './presets-tonal'
import type { MutateDistance } from './foraging'

const MUTATE_STDDEV_PCT: Record<MutateDistance, number> = {
  S: 0.05,
  M: 0.15,
  L: 0.3,
}

// Numeric vs categorical split for tonal params. Categoricals are randomized
// by uniform pick from the preset's allowed set; mutate leaves them alone.
const NUMERIC_KEYS: Array<keyof TonalParams> = [
  'base_pitch_semitones',
  'osc_a_level',
  'osc_b_level',
  'osc_b_detune_cents',
  'sub_amount',
  'noise_amount',
  'filter_freq_hz',
  'filter_q',
  'filter_env_amount',
  'filter_env_attack_ms',
  'filter_env_decay_ms',
  'amp_attack_ms',
  'amp_decay_ms',
  'amp_sustain',
  'amp_release_ms',
  'pitch_env_amount_oct',
  'pitch_env_attack_ms',
  'pitch_env_decay_ms',
  'lfo_rate_hz',
  'lfo_depth',
  'gain',
]

const CATEGORICAL_KEYS: Array<keyof TonalParams> = [
  'osc_a_wave',
  'osc_b_wave',
  'noise_type',
  'filter_type',
  'lfo_shape',
  'lfo_target',
]

function snapTonal(key: keyof TonalParams, value: number): number {
  switch (key) {
    case 'base_pitch_semitones':
    case 'filter_freq_hz':
    case 'osc_b_detune_cents':
    case 'filter_env_attack_ms':
    case 'filter_env_decay_ms':
    case 'amp_attack_ms':
    case 'amp_decay_ms':
    case 'amp_release_ms':
    case 'pitch_env_attack_ms':
    case 'pitch_env_decay_ms':
      return Math.round(value)
    case 'osc_a_level':
    case 'osc_b_level':
    case 'sub_amount':
    case 'noise_amount':
    case 'filter_q':
    case 'filter_env_amount':
    case 'amp_sustain':
    case 'pitch_env_amount_oct':
    case 'lfo_rate_hz':
    case 'lfo_depth':
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

export function randomizeTonalPreset(
  preset: TonalPresetDefinition,
): TonalParams {
  const params = { ...preset.defaults }

  for (const key of NUMERIC_KEYS) {
    const range = preset.ranges[key] as [number, number] | undefined
    if (!range) continue
    const [min, max] = range
    const raw = min + Math.random() * (max - min)
    ;(params as Record<string, number | string>)[key] = snapTonal(key, raw)
  }

  for (const key of CATEGORICAL_KEYS) {
    const set = preset.ranges[key] as readonly string[] | undefined
    if (!set || set.length === 0) continue
    ;(params as Record<string, string | number>)[key] = pickFrom(set)
  }

  return params
}

export function mutateTonalPreset(
  preset: TonalPresetDefinition,
  current: TonalParams,
  distance: MutateDistance,
): TonalParams {
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
    ;(params as Record<string, number | string>)[key] = snapTonal(key, clamped)
  }
  return params
}
