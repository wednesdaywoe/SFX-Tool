import {
  generateBrownNoise,
  generatePinkNoise,
  generateWhiteNoise,
} from '../noise'
import type { AtmosphericNoiseType } from './types'

/* Blue noise — first-order high-pass on white. Differentiation gives a
 * +6 dB/oct slope (true blue is +3 dB/oct, but the simpler diff matches
 * v1's white/pink/brown DSP simplicity and reads as "shimmer" perceptually).
 * 0.5 amplitude scale brings the differentiated signal back into ~[-1, 1]. */
export function generateBlueNoise(numSamples: number): Float32Array {
  const out = new Float32Array(numSamples)
  let prev = 0
  for (let i = 0; i < numSamples; i++) {
    const white = Math.random() * 2 - 1
    out[i] = (white - prev) * 0.5
    prev = white
  }
  return out
}

/* Violet noise — second-order high-pass (differentiate twice). */
export function generateVioletNoise(numSamples: number): Float32Array {
  const blue = generateBlueNoise(numSamples)
  const out = new Float32Array(numSamples)
  let prev = 0
  for (let i = 0; i < numSamples; i++) {
    out[i] = (blue[i] - prev) * 0.5
    prev = blue[i]
  }
  return out
}

/* Grey noise — psychoacoustic equal-loudness weighting via inverted A-weighting.
 * Approximated as cascaded biquad stages: low-shelf boost + dual mid-cut.
 * Coefficients are perceptual approximations, not a precise A-weighting curve. */
export function generateGreyNoise(numSamples: number): Float32Array {
  const white = generateWhiteNoise(numSamples)
  // Three-stage biquad cascade. Stage parameters chosen for "balanced" feel:
  // boost lows where white feels thin, cut presence where white feels harsh.
  let s = white
  s = applyPeaking(s, 1000, 0.7, -3, 44100)
  s = applyPeaking(s, 3000, 0.7, -6, 44100)
  s = applyLowShelf(s, 100, 0.7, +6, 44100)
  return s
}

function generateNoiseInternal(
  type: AtmosphericNoiseType,
  numSamples: number,
): Float32Array {
  switch (type) {
    case 'white':
      return generateWhiteNoise(numSamples)
    case 'pink':
      return generatePinkNoise(numSamples)
    case 'brown':
      return generateBrownNoise(numSamples)
    case 'blue':
      return generateBlueNoise(numSamples)
    case 'violet':
      return generateVioletNoise(numSamples)
    case 'grey':
      return generateGreyNoise(numSamples)
    case 'off':
      return new Float32Array(numSamples)
  }
}

export function generateAtmosphericNoise(
  type: AtmosphericNoiseType,
  numSamples: number,
): Float32Array {
  return generateNoiseInternal(type, numSamples)
}

/* ─── Biquad helpers (used for grey noise A-weighting approximation) ───
 * Standard RBJ cookbook coefficients. Single-precision Float32 — fine for
 * pre-render of static filters. */

function applyPeaking(
  input: Float32Array,
  freqHz: number,
  q: number,
  gainDb: number,
  sampleRate: number,
): Float32Array {
  const A = Math.pow(10, gainDb / 40)
  const w0 = (2 * Math.PI * freqHz) / sampleRate
  const alpha = Math.sin(w0) / (2 * q)
  const cos = Math.cos(w0)
  const b0 = 1 + alpha * A
  const b1 = -2 * cos
  const b2 = 1 - alpha * A
  const a0 = 1 + alpha / A
  const a1 = -2 * cos
  const a2 = 1 - alpha / A
  return runBiquad(input, b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0)
}

function applyLowShelf(
  input: Float32Array,
  freqHz: number,
  q: number,
  gainDb: number,
  sampleRate: number,
): Float32Array {
  const A = Math.pow(10, gainDb / 40)
  const w0 = (2 * Math.PI * freqHz) / sampleRate
  const alpha = Math.sin(w0) / (2 * q)
  const cos = Math.cos(w0)
  const sqA = 2 * Math.sqrt(A) * alpha
  const b0 = A * (A + 1 - (A - 1) * cos + sqA)
  const b1 = 2 * A * (A - 1 - (A + 1) * cos)
  const b2 = A * (A + 1 - (A - 1) * cos - sqA)
  const a0 = A + 1 + (A - 1) * cos + sqA
  const a1 = -2 * (A - 1 + (A + 1) * cos)
  const a2 = A + 1 + (A - 1) * cos - sqA
  return runBiquad(input, b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0)
}

function runBiquad(
  input: Float32Array,
  b0: number,
  b1: number,
  b2: number,
  a1: number,
  a2: number,
): Float32Array {
  const out = new Float32Array(input.length)
  let x1 = 0
  let x2 = 0
  let y1 = 0
  let y2 = 0
  for (let i = 0; i < input.length; i++) {
    const x = input[i]
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
    out[i] = y
    x2 = x1
    x1 = x
    y2 = y1
    y1 = y
  }
  return out
}
