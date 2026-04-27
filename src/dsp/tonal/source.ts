import {
  generateBrownNoise,
  generatePinkNoise,
  generateWhiteNoise,
} from '../noise'
import type { TonalNoiseType, TonalParams } from '../types'
import { TONAL_BASE_FREQ_HZ } from '../types'
import { lfoSample } from './lfo'
import { oscillator } from './oscillator'
import { computePitchEnvelope } from './pitchEnvelope'

const TWO_PI = 2 * Math.PI

// Build the source layer (osc A + osc B + sub + noise) into a single buffer
// with per-sample pitch modulation from the pitch envelope and (optionally)
// the LFO. Phase is accumulated cumulatively to avoid clicks during pitch
// sweeps — see the spec's "Pitch modulation and phase accumulation" note.
export function generateTonalSource(
  buffer: Float32Array,
  params: TonalParams,
  sampleRate: number,
): void {
  const totalSamples = buffer.length

  // base_pitch_semitones shifts the A4 reference. +12 = A5, -12 = A3, etc.
  const pitchShiftMult = Math.pow(2, params.base_pitch_semitones / 12)
  const baseFreqA = TONAL_BASE_FREQ_HZ * pitchShiftMult
  const baseFreqB = baseFreqA * Math.pow(2, params.osc_b_detune_cents / 1200)
  const baseFreqSub = baseFreqA / 2

  let phaseA = 0
  let phaseB = 0
  let phaseSub = 0

  const lfoOnPitch =
    params.lfo_target === 'pitch' && params.lfo_depth > 0
  // LFO depth of 1 → ~5% pitch wobble (~80 cents) per spec.
  const lfoPitchScale = 0.05

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate
    let pitchMult = computePitchEnvelope(t, params)

    if (lfoOnPitch) {
      const lfoPhase = TWO_PI * params.lfo_rate_hz * t
      const lfoVal = lfoSample(params.lfo_shape, lfoPhase)
      pitchMult *= 1 + lfoVal * params.lfo_depth * lfoPitchScale
    }

    const freqA = baseFreqA * pitchMult
    const freqB = baseFreqB * pitchMult
    const freqSub = baseFreqSub * pitchMult

    phaseA += (TWO_PI * freqA) / sampleRate
    phaseB += (TWO_PI * freqB) / sampleRate
    phaseSub += (TWO_PI * freqSub) / sampleRate

    const oscA = oscillator(params.osc_a_wave, phaseA) * params.osc_a_level
    const oscB = oscillator(params.osc_b_wave, phaseB) * params.osc_b_level
    const sub = Math.sin(phaseSub) * params.sub_amount

    buffer[i] = oscA + oscB + sub
  }

  if (params.noise_amount > 0 && params.noise_type !== 'none') {
    const noise = generateNoiseFor(params.noise_type, totalSamples)
    for (let i = 0; i < totalSamples; i++) {
      buffer[i] += noise[i] * params.noise_amount
    }
  }
}

function generateNoiseFor(
  type: Exclude<TonalNoiseType, 'none'>,
  numSamples: number,
): Float32Array {
  switch (type) {
    case 'white':
      return generateWhiteNoise(numSamples)
    case 'pink':
      return generatePinkNoise(numSamples)
    case 'brown':
      return generateBrownNoise(numSamples)
  }
}
