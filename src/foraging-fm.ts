import type { FmOperator, FmParams } from './dsp/fm/types'
import type { FmOperatorRanges, FmPresetDefinition } from './presets-fm'
import type { MutateDistance } from './foraging'

const MUTATE_STDDEV_PCT: Record<MutateDistance, number> = {
  S: 0.05,
  M: 0.15,
  L: 0.3,
}

// Top-level numeric/categorical split. Operator fields are handled separately
// via the per-op ranges. `algorithm` is treated as categorical: randomize
// picks uniformly from 1..8, mutate leaves it alone (changing algorithm
// mid-mutate would be too disruptive — that's a "randomize" operation).
const TOP_NUMERIC_KEYS: Array<
  keyof Omit<FmParams, 'op1' | 'op2' | 'op3' | 'op4' | 'algorithm' | 'filter_type' | 'lfo_shape' | 'lfo_target'>
> = [
  'base_pitch_semitones',
  'fm_amount',
  'feedback',
  'filter_freq_hz',
  'filter_q',
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

const OP_NUMERIC_KEYS: Array<
  keyof Omit<FmOperator, 'fixed'>
> = [
  'ratio',
  'fixed_freq_hz',
  'detune_cents',
  'level',
  'env_attack_ms',
  'env_decay_ms',
  'env_sustain',
  'env_release_ms',
]

function snapTopLevel(key: keyof FmParams, value: number): number {
  switch (key) {
    case 'base_pitch_semitones':
    case 'filter_freq_hz':
    case 'amp_attack_ms':
    case 'amp_decay_ms':
    case 'amp_release_ms':
    case 'pitch_env_attack_ms':
    case 'pitch_env_decay_ms':
      return Math.round(value)
    case 'fm_amount':
    case 'feedback':
    case 'filter_q':
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

function snapOp(key: keyof FmOperator, value: number): number {
  switch (key) {
    case 'detune_cents':
    case 'env_attack_ms':
    case 'env_decay_ms':
    case 'env_release_ms':
      return Math.round(value)
    case 'fixed_freq_hz':
      return Math.round(value * 10) / 10
    case 'ratio':
    case 'level':
    case 'env_sustain':
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

function randomizeOp(
  current: FmOperator,
  ranges: FmOperatorRanges | undefined,
): FmOperator {
  if (!ranges) return current
  const next: FmOperator = { ...current }
  for (const key of OP_NUMERIC_KEYS) {
    const range = ranges[key]
    if (!range) continue
    const [min, max] = range
    const raw = min + Math.random() * (max - min)
    ;(next as unknown as Record<string, number>)[key] = snapOp(key, raw)
  }
  // `fixed` is categorical (boolean). Only flip it when the preset's range
  // explicitly includes both true and false, otherwise preserve the
  // preset's choice (most patches are all-ratio or all-fixed).
  if (ranges.fixed && ranges.fixed.length > 0) {
    next.fixed = ranges.fixed[Math.floor(Math.random() * ranges.fixed.length)]
  }
  return next
}

function mutateOp(
  current: FmOperator,
  ranges: FmOperatorRanges | undefined,
  pct: number,
): FmOperator {
  if (!ranges) return current
  const next: FmOperator = { ...current }
  for (const key of OP_NUMERIC_KEYS) {
    const range = ranges[key]
    if (!range) continue
    const [min, max] = range
    const stddev = (max - min) * pct
    const cur = (current as unknown as Record<string, number>)[key]
    const perturbed = cur + gaussian() * stddev
    const clamped = Math.max(min, Math.min(max, perturbed))
    ;(next as unknown as Record<string, number>)[key] = snapOp(key, clamped)
  }
  return next
}

export function randomizeFmPreset(preset: FmPresetDefinition): FmParams {
  const params: FmParams = {
    ...preset.defaults,
    op1: { ...preset.defaults.op1 },
    op2: { ...preset.defaults.op2 },
    op3: { ...preset.defaults.op3 },
    op4: { ...preset.defaults.op4 },
  }

  for (const key of TOP_NUMERIC_KEYS) {
    const range = preset.ranges[key] as [number, number] | undefined
    if (!range) continue
    const [min, max] = range
    const raw = min + Math.random() * (max - min)
    ;(params as unknown as Record<string, number>)[key] = snapTopLevel(key, raw)
  }

  params.op1 = randomizeOp(params.op1, preset.opRanges)
  params.op2 = randomizeOp(params.op2, preset.opRanges)
  params.op3 = randomizeOp(params.op3, preset.opRanges)
  params.op4 = randomizeOp(params.op4, preset.opRanges)

  return params
}

export function mutateFmPreset(
  preset: FmPresetDefinition,
  current: FmParams,
  distance: MutateDistance,
): FmParams {
  const pct = MUTATE_STDDEV_PCT[distance]
  const params: FmParams = {
    ...current,
    op1: mutateOp(current.op1, preset.opRanges, pct),
    op2: mutateOp(current.op2, preset.opRanges, pct),
    op3: mutateOp(current.op3, preset.opRanges, pct),
    op4: mutateOp(current.op4, preset.opRanges, pct),
  }
  for (const key of TOP_NUMERIC_KEYS) {
    const range = preset.ranges[key] as [number, number] | undefined
    if (!range) continue
    const [min, max] = range
    const stddev = (max - min) * pct
    const cur = (current as unknown as Record<string, number>)[key]
    const perturbed = cur + gaussian() * stddev
    const clamped = Math.max(min, Math.min(max, perturbed))
    ;(params as unknown as Record<string, number>)[key] = snapTopLevel(key, clamped)
  }
  return params
}
