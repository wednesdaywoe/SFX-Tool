/* Atmospheric synthesis (v3) — types and shared constants. */

export type AtmosphericNoiseType =
  | 'white'
  | 'pink'
  | 'brown'
  | 'blue'
  | 'violet'
  | 'grey'
  | 'off'

export type AtmosphericOscWave = 'sine' | 'triangle'

export type AtmosphericFilterType = 'highpass' | 'bandpass' | 'lowpass'

export type SlowEnvShape =
  | 'ramp_up'
  | 'ramp_down'
  | 'hold_then_release'
  | 'attack_hold_release'

export type SlowEnvTarget =
  | 'off'
  | 'amp'
  | 'filter_a_freq'
  | 'filter_b_freq'

export type ModulationTarget =
  | 'off'
  | 'amp'
  | 'pitch'
  | 'filter_a_freq'
  | 'filter_a_q'
  | 'filter_b_freq'
  | 'filter_b_q'

export type LfoShape = 'sine' | 'triangle' | 'square'

export interface AtmosphericParams {
  // Sources
  noise_type: AtmosphericNoiseType
  noise_amount: number      // 0-1
  osc_count: 0 | 1 | 2 | 3
  osc_a_wave: AtmosphericOscWave
  osc_a_level: number       // 0-1
  osc_b_wave: AtmosphericOscWave
  osc_b_level: number       // 0-1
  osc_b_detune_cents: number  // 0-50
  osc_c_wave: AtmosphericOscWave
  osc_c_level: number       // 0-1
  osc_c_detune_cents: number  // 0-50
  base_pitch_semitones: number  // -24..+24 (slider), -48..+48 (typed)

  // Filter A
  filter_a_type: AtmosphericFilterType
  filter_a_freq_hz: number  // 20-20000
  filter_a_q: number        // 0.5-20
  filter_a_mix: number      // 0-1

  // Filter B
  filter_b_type: AtmosphericFilterType
  filter_b_freq_hz: number
  filter_b_q: number
  filter_b_mix: number

  // Slow envelope
  slow_env_shape: SlowEnvShape
  slow_env_duration_s: number  // 1-30
  slow_env_amount: number      // -1..+1
  slow_env_target: SlowEnvTarget

  // Random walks
  rw1_rate_hz: number        // 0.05-10
  rw1_depth: number          // 0-1
  rw1_smoothing_ms: number   // 50-2000
  rw1_target: ModulationTarget
  rw2_rate_hz: number
  rw2_depth: number
  rw2_smoothing_ms: number
  rw2_target: ModulationTarget

  // LFOs
  lfo1_rate_hz: number       // 0.05-20
  lfo1_depth: number         // 0-1
  lfo1_shape: LfoShape
  lfo1_phase_offset_deg: number  // 0-360
  lfo1_target: ModulationTarget
  lfo2_rate_hz: number
  lfo2_depth: number
  lfo2_shape: LfoShape
  lfo2_phase_offset_deg: number
  lfo2_target: ModulationTarget

  // Output
  gain: number               // 0-1
}

export const ATMOSPHERIC_BASE_FREQ_HZ = 440
