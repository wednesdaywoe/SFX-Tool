import type { FilterType, LfoShape } from '../types'

// ----- FM mode -----
//
// 4-operator FM with 8 algorithms, ADSR per operator, global pitch envelope,
// and feedback fixed on op1. See ALGORITHMS for the topology table.

export type FmAlgorithm = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export type FmLfoTarget = 'off' | 'pitch' | 'amp' | 'fm' | 'filter'

export interface FmOperator {
  // Frequency selection. When fixed=false, freq = carrierFreq × ratio.
  // When fixed=true, freq = fixed_freq_hz (ratio ignored). Fixed mode is
  // useful for inharmonic textures (bells, metallic) and sub-bass layers.
  ratio: number              // 0.5–32
  fixed: boolean
  fixed_freq_hz: number      // 1–8000

  detune_cents: number       // -50..+50
  level: number              // 0–1. For carriers: output amplitude.
                             // For modulators: scales the modulation index.

  // ADSR. For modulators these shape the modulation index over time
  // (the FM "tone"); for carriers they shape audible amplitude.
  env_attack_ms: number      // 0–2000
  env_decay_ms: number       // 0–4000
  env_sustain: number        // 0–1
  env_release_ms: number     // 0–4000
}

export interface FmParams {
  base_pitch_semitones: number   // -24..+24 (slider); ±48 (edit). 0 = A4.

  algorithm: FmAlgorithm
  op1: FmOperator
  op2: FmOperator
  op3: FmOperator
  op4: FmOperator

  // Master modulation index. Scales all modulator→carrier connections.
  // Range exceeds 1.0 to allow screaming FM; sane patches sit around 1–3.
  fm_amount: number              // 0–10

  // Self-feedback on op1. 1-sample delayed feedback is a standard FM trick
  // for noise-like / saw-like timbres without adding a second modulator.
  feedback: number               // 0–1

  // Filter (reused from tonal pipeline)
  filter_type: FilterType
  filter_freq_hz: number         // 100–16000
  filter_q: number               // 0.5–20

  // Amp ADSR (reused from tonal pipeline)
  amp_attack_ms: number          // 0–500
  amp_decay_ms: number           // 5–1000
  amp_sustain: number            // 0–1
  amp_release_ms: number         // 5–2000

  // Global pitch envelope — applied to the carrier base frequency, which
  // propagates to all operators in ratio mode (DX7-style pitch EG).
  pitch_env_amount_oct: number   // -2..+2
  pitch_env_attack_ms: number    // 0–500
  pitch_env_decay_ms: number     // 5–1000

  // LFO. 'fm' targets the master modulation index for tremolo-like spectral
  // motion; the others mirror tonal mode.
  lfo_rate_hz: number            // 0.1–20
  lfo_depth: number              // 0–1
  lfo_shape: LfoShape
  lfo_target: FmLfoTarget

  gain: number                   // 0–1
}

export const FM_BASE_FREQ_HZ = 440
