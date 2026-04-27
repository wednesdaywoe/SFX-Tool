export type NoiseType = 'white' | 'pink' | 'brown'
export type FilterType = 'highpass' | 'bandpass' | 'lowpass'
export type BodyWaveform = 'sine' | 'triangle'

// ----- Tonal mode (v2) -----

export type OscWaveform = 'sine' | 'triangle' | 'square' | 'saw'
export type TonalNoiseType = 'none' | 'white' | 'pink' | 'brown'
export type LfoShape = 'sine' | 'triangle' | 'square'
export type LfoTarget = 'off' | 'pitch' | 'filter' | 'amp'

export interface TonalParams {
  // Sources
  base_pitch_semitones: number // -24 to +24 (slider); ±48 (edit). 0 = A4.
  osc_a_wave: OscWaveform
  osc_a_level: number          // 0-1
  osc_b_wave: OscWaveform
  osc_b_level: number          // 0-1
  osc_b_detune_cents: number   // 0-50
  sub_amount: number           // 0-0.7
  noise_type: TonalNoiseType
  noise_amount: number         // 0-0.4

  // Filter
  filter_type: FilterType
  filter_freq_hz: number       // 100-16000
  filter_q: number             // 0.5-20

  // Filter envelope
  filter_env_amount: number    // -1 to +1
  filter_env_attack_ms: number // 0-500
  filter_env_decay_ms: number  // 5-1000

  // Amp ADSR
  amp_attack_ms: number        // 0-500
  amp_decay_ms: number         // 5-1000
  amp_sustain: number          // 0-1
  amp_release_ms: number       // 5-2000

  // Pitch envelope
  pitch_env_amount_oct: number // -2 to +2
  pitch_env_attack_ms: number  // 0-500
  pitch_env_decay_ms: number   // 5-1000

  // LFO
  lfo_rate_hz: number          // 0.1-20
  lfo_depth: number            // 0-1
  lfo_shape: LfoShape
  lfo_target: LfoTarget

  // Output
  gain: number                 // 0-1
}

// A4 reference frequency for the tonal oscillator base pitch. Pitch envelope
// shifts this; the absolute pitch is conceptual rather than an exposed
// parameter (per the cross-mode semantic table).
export const TONAL_BASE_FREQ_HZ = 440

export interface PercussiveParams {
  noise_type: NoiseType
  impulse_duration_ms: number

  filter_type: FilterType
  filter_freq_hz: number
  filter_q: number

  body_amount: number
  body_freq_hz: number
  body_decay_ms: number
  body_waveform: BodyWaveform

  decay_ms: number
  decay_curve: number

  gain: number
}

export const SAMPLE_RATE = 44100
