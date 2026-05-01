import { lfoSample } from '../tonal/lfo'
import { ALGORITHMS } from './algorithms'
import { operatorEnvAt } from './operatorEnv'
import { FM_BASE_FREQ_HZ, type FmOperator, type FmParams } from './types'

const TWO_PI = 2 * Math.PI

// Render the 4-op FM source layer into a single mono buffer. Per-sample
// per-operator: compute frequency (carrier × ratio, or fixed Hz), accumulate
// phase, sum modulator inputs (plus self-feedback on op1), apply per-op
// envelope, and write the carrier sum to the buffer.
//
// Pitch envelope and pitch-targeted LFO scale the carrier base frequency
// (DX7-style — pitch EG affects all operators in ratio mode together).
//
// FM-targeted LFO scales the master modulation index, producing tremolo-like
// spectral motion ("the timbre wobbles, not the volume").
export function generateFmSource(
  buffer: Float32Array,
  params: FmParams,
  sampleRate: number,
): void {
  const totalSamples = buffer.length
  const totalSec = totalSamples / sampleRate

  const algo = ALGORITHMS[params.algorithm]
  const ops: FmOperator[] = [params.op1, params.op2, params.op3, params.op4]

  const baseFreqMult = Math.pow(2, params.base_pitch_semitones / 12)
  const carrierBaseFreq = FM_BASE_FREQ_HZ * baseFreqMult

  // Pre-compute per-op detune multipliers (constant across the render).
  const detuneMult: number[] = ops.map((op) =>
    Math.pow(2, op.detune_cents / 1200),
  )

  const lfoOnPitch = params.lfo_target === 'pitch' && params.lfo_depth > 0
  const lfoOnFm = params.lfo_target === 'fm' && params.lfo_depth > 0
  // Same conventions as tonal mode: pitch LFO at depth=1 ≈ ±5% (~80 cents).
  const lfoPitchScale = 0.05
  // FM LFO at depth=1 swings the master mod index by ±50% of its current value.
  const lfoFmScale = 0.5

  // Per-op state.
  const phase = [0, 0, 0, 0]
  const lastOut = [0, 0, 0, 0]
  // opOut is 1-indexed via [_, op1, op2, op3, op4] for direct lookup against
  // the algorithm's modulatorsOf indices (which are 1-based).
  const opOut: [number, number, number, number, number] = [0, 0, 0, 0, 0]

  // Pitch envelope inlined here (same shape as computePitchEnvelope) so we
  // avoid re-deriving the TonalParams shim.
  const pitchAmount = params.pitch_env_amount_oct
  const pitchAttackSec = params.pitch_env_attack_ms / 1000
  const pitchDecaySec = params.pitch_env_decay_ms / 1000

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate

    // --- Pitch modulation ---
    let pitchMult = 1
    if (pitchAmount !== 0) {
      let envShape: number
      if (t < pitchAttackSec) {
        envShape = pitchAttackSec === 0 ? 1 : t / pitchAttackSec
      } else if (t < pitchAttackSec + pitchDecaySec) {
        if (pitchDecaySec === 0) {
          envShape = 0
        } else {
          const decayProgress = (t - pitchAttackSec) / pitchDecaySec
          envShape = Math.exp(-decayProgress * 4)
        }
      } else {
        envShape = 0
      }
      pitchMult = Math.pow(2, pitchAmount * envShape)
    }

    if (lfoOnPitch) {
      const lfoPhase = TWO_PI * params.lfo_rate_hz * t
      const lfoVal = lfoSample(params.lfo_shape, lfoPhase)
      pitchMult *= 1 + lfoVal * params.lfo_depth * lfoPitchScale
    }

    const carrierFreq = carrierBaseFreq * pitchMult

    // --- FM amount (with optional LFO) ---
    let fmAmt = params.fm_amount
    if (lfoOnFm) {
      const lfoPhase = TWO_PI * params.lfo_rate_hz * t
      const lfoVal = lfoSample(params.lfo_shape, lfoPhase)
      fmAmt *= 1 + lfoVal * params.lfo_depth * lfoFmScale
    }

    // --- Per-operator pass (1 → 2 → 3 → 4) ---
    for (let opIdx = 0; opIdx < 4; opIdx++) {
      const op = ops[opIdx]
      const freq = op.fixed
        ? op.fixed_freq_hz
        : carrierFreq * op.ratio
      const opFreq = freq * detuneMult[opIdx]
      phase[opIdx] += (TWO_PI * opFreq) / sampleRate

      // Sum modulator inputs from earlier operators in this sample.
      let modSum = 0
      const mods = algo.modulatorsOf[opIdx]
      for (let m = 0; m < mods.length; m++) {
        modSum += opOut[mods[m]]
      }
      // Feedback: op1 only, 1-sample delayed self-modulation.
      if (opIdx === 0 && params.feedback > 0) {
        modSum += lastOut[0] * params.feedback
      }

      const env = operatorEnvAt(op, t, totalSec)
      const out = Math.sin(phase[opIdx] + modSum * fmAmt) * env * op.level
      lastOut[opIdx] = out
      opOut[opIdx + 1] = out
    }

    // --- Sum carriers ---
    let sample = 0
    const carriers = algo.carriers
    for (let c = 0; c < carriers.length; c++) {
      sample += opOut[carriers[c]]
    }
    // Normalize by carrier count so additive (algo 8) doesn't clip relative
    // to single-carrier algorithms.
    buffer[i] = sample / carriers.length
  }
}
