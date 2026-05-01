import type { AtmosphericParams } from './dsp/atmospheric/types'
import type { FmOperator, FmParams } from './dsp/fm/types'
import type { PercussiveParams, TonalParams } from './dsp/types'

export function formatHz(value: number): string {
  return Math.round(value).toLocaleString('en-US')
}

export function formatMs(value: number): string {
  return Math.round(value).toString()
}

export function formatRatio(value: number): string {
  return value.toFixed(2)
}

export function formatSignedInt(value: number): string {
  const n = Math.round(value)
  return n > 0 ? `+${n}` : `${n}`
}

// Convert a semitone offset from A4 (MIDI 69) to a note name like "A4" or "C#5".
// Used by the tonal panel to show the musical note alongside the semitone offset.
export function noteName(semitonesFromA4: number): string {
  const midi = 69 + Math.round(semitonesFromA4)
  const noteIdx = ((midi % 12) + 12) % 12
  const octave = Math.floor(midi / 12) - 1
  const names = [
    'C',
    'C#',
    'D',
    'D#',
    'E',
    'F',
    'F#',
    'G',
    'G#',
    'A',
    'A#',
    'B',
  ]
  return `${names[noteIdx]}${octave}`
}

// Wider-than-slider bounds for typed input. The slider expresses the
// ergonomic range; these bounds express the safe-physical range. Caps:
// frequencies clamped to Nyquist (22050 at 44.1kHz); negative values
// rejected; ratios allowed to over-drive (gain/body_amount > 1).
export const EDIT_LIMITS: Partial<
  Record<keyof PercussiveParams, [number, number]>
> = {
  impulse_duration_ms: [0.1, 500],
  filter_freq_hz: [20, 22050],
  filter_q: [0.1, 100],
  body_amount: [0, 4],
  body_freq_hz: [20, 22050],
  body_decay_ms: [1, 1000],
  decay_ms: [5, 5000],
  decay_curve: [0, 1],
  gain: [0, 4],
}

// Tonal edit limits — same principle as percussive, wider than the slider
// range. Allows over-drive on level/sub/noise/gain, frequencies up to Nyquist,
// and longer envelopes.
export const TONAL_EDIT_LIMITS: Partial<
  Record<keyof TonalParams, [number, number]>
> = {
  base_pitch_semitones: [-48, 48],
  osc_a_level: [0, 2],
  osc_b_level: [0, 2],
  osc_b_detune_cents: [0, 1200],
  sub_amount: [0, 2],
  noise_amount: [0, 1],
  filter_freq_hz: [20, 22050],
  filter_q: [0.1, 100],
  filter_env_amount: [-2, 2],
  filter_env_attack_ms: [0, 2000],
  filter_env_decay_ms: [0, 5000],
  amp_attack_ms: [0, 2000],
  amp_decay_ms: [0, 5000],
  amp_sustain: [0, 2],
  amp_release_ms: [0, 5000],
  pitch_env_amount_oct: [-4, 4],
  pitch_env_attack_ms: [0, 2000],
  pitch_env_decay_ms: [0, 5000],
  lfo_rate_hz: [0.01, 50],
  lfo_depth: [0, 2],
  gain: [0, 4],
}

// FM edit limits — same principle: typed input wider than slider range.
// Operator edit limits are shared (every op has identical bounds).
export const FM_OPERATOR_EDIT_LIMITS: Partial<
  Record<keyof FmOperator, [number, number]>
> = {
  ratio: [0.01, 64],
  fixed_freq_hz: [0.1, 22050],
  detune_cents: [-1200, 1200],
  level: [0, 4],
  env_attack_ms: [0, 5000],
  env_decay_ms: [0, 10000],
  env_sustain: [0, 2],
  env_release_ms: [0, 10000],
}

export const FM_EDIT_LIMITS: Partial<Record<keyof FmParams, [number, number]>> = {
  base_pitch_semitones: [-48, 48],
  fm_amount: [0, 50],
  feedback: [0, 2],
  filter_freq_hz: [20, 22050],
  filter_q: [0.1, 100],
  amp_attack_ms: [0, 2000],
  amp_decay_ms: [0, 5000],
  amp_sustain: [0, 2],
  amp_release_ms: [0, 5000],
  pitch_env_amount_oct: [-4, 4],
  pitch_env_attack_ms: [0, 2000],
  pitch_env_decay_ms: [0, 5000],
  lfo_rate_hz: [0.01, 50],
  lfo_depth: [0, 2],
  gain: [0, 4],
}

/* Atmospheric edit limits — wider-than-slider where useful. */
export const ATMOSPHERIC_EDIT_LIMITS: Partial<
  Record<keyof AtmosphericParams, [number, number]>
> = {
  noise_amount: [0, 2],
  osc_a_level: [0, 2],
  osc_b_level: [0, 2],
  osc_b_detune_cents: [0, 1200],
  osc_c_level: [0, 2],
  osc_c_detune_cents: [0, 1200],
  base_pitch_semitones: [-48, 48],
  filter_a_freq_hz: [20, 22050],
  filter_a_q: [0.1, 100],
  filter_a_mix: [0, 2],
  filter_b_freq_hz: [20, 22050],
  filter_b_q: [0.1, 100],
  filter_b_mix: [0, 2],
  slow_env_duration_s: [0.5, 60],
  slow_env_amount: [-2, 2],
  rw1_rate_hz: [0.01, 50],
  rw1_depth: [0, 2],
  rw1_smoothing_ms: [10, 5000],
  rw2_rate_hz: [0.01, 50],
  rw2_depth: [0, 2],
  rw2_smoothing_ms: [10, 5000],
  lfo1_rate_hz: [0.01, 50],
  lfo1_depth: [0, 2],
  lfo1_phase_offset_deg: [0, 360],
  lfo2_rate_hz: [0.01, 50],
  lfo2_depth: [0, 2],
  lfo2_phase_offset_deg: [0, 360],
  gain: [0, 4],
}
