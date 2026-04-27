import type { AtmosphericParams } from './dsp/atmospheric/types'
import type { AtmosphericPresetDefinition } from './presets-atmospheric'
import type { MutateDistance } from './foraging'

const MUTATE_STDDEV_PCT: Record<MutateDistance, number> = {
  S: 0.05,
  M: 0.15,
  L: 0.3,
}

const NUMERIC_KEYS: Array<keyof AtmosphericParams> = [
  'noise_amount',
  'osc_a_level',
  'osc_b_level',
  'osc_b_detune_cents',
  'osc_c_level',
  'osc_c_detune_cents',
  'base_pitch_semitones',
  'filter_a_freq_hz',
  'filter_a_q',
  'filter_a_mix',
  'filter_b_freq_hz',
  'filter_b_q',
  'filter_b_mix',
  'slow_env_duration_s',
  'slow_env_amount',
  'rw1_rate_hz',
  'rw1_depth',
  'rw1_smoothing_ms',
  'rw2_rate_hz',
  'rw2_depth',
  'rw2_smoothing_ms',
  'lfo1_rate_hz',
  'lfo1_depth',
  'lfo1_phase_offset_deg',
  'lfo2_rate_hz',
  'lfo2_depth',
  'lfo2_phase_offset_deg',
  'gain',
]

const CATEGORICAL_KEYS: Array<keyof AtmosphericParams> = [
  'noise_type',
  'osc_a_wave',
  'osc_b_wave',
  'osc_c_wave',
  'filter_a_type',
  'filter_b_type',
  'slow_env_shape',
  'slow_env_target',
  'rw1_target',
  'rw2_target',
  'lfo1_shape',
  'lfo1_target',
  'lfo2_shape',
  'lfo2_target',
]

/* osc_count is technically numeric but only valid for [0, 3] integer values.
 * Treat it specially. */
const OSC_COUNT_KEY: keyof AtmosphericParams = 'osc_count'

function snapAtmospheric(
  key: keyof AtmosphericParams,
  value: number,
): number {
  switch (key) {
    case 'osc_b_detune_cents':
    case 'osc_c_detune_cents':
    case 'base_pitch_semitones':
    case 'filter_a_freq_hz':
    case 'filter_b_freq_hz':
    case 'rw1_smoothing_ms':
    case 'rw2_smoothing_ms':
    case 'lfo1_phase_offset_deg':
    case 'lfo2_phase_offset_deg':
      return Math.round(value)
    case 'slow_env_duration_s':
      return Math.round(value * 10) / 10
    default:
      return Math.round(value * 100) / 100
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

export function randomizeAtmosphericPreset(
  preset: AtmosphericPresetDefinition,
): AtmosphericParams {
  const params = { ...preset.defaults }

  for (const key of NUMERIC_KEYS) {
    const range = preset.ranges[key] as [number, number] | undefined
    if (!range) continue
    const [min, max] = range
    const raw = min + Math.random() * (max - min)
    ;(params as Record<string, number | string>)[key] = snapAtmospheric(key, raw)
  }

  for (const key of CATEGORICAL_KEYS) {
    const set = preset.ranges[key] as readonly string[] | undefined
    if (!set || set.length === 0) continue
    ;(params as Record<string, string | number>)[key] = pickFrom(set)
  }

  // osc_count specially — clamp to [0, 3] integer.
  const oscRange = preset.ranges[OSC_COUNT_KEY] as [number, number] | undefined
  if (oscRange) {
    const [min, max] = oscRange
    const v = Math.floor(min + Math.random() * (max - min + 1))
    params.osc_count = Math.max(0, Math.min(3, v)) as 0 | 1 | 2 | 3
  }

  return params
}

export function mutateAtmosphericPreset(
  preset: AtmosphericPresetDefinition,
  current: AtmosphericParams,
  distance: MutateDistance,
): AtmosphericParams {
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
    ;(params as Record<string, number | string>)[key] = snapAtmospheric(
      key,
      clamped,
    )
  }
  return params
}
