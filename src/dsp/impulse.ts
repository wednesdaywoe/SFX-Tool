import {
  generateBrownNoise,
  generatePinkNoise,
  generateWhiteNoise,
} from './noise'
import type { NoiseType } from './types'

export function generateImpulse(
  buffer: Float32Array,
  durationMs: number,
  noiseType: NoiseType,
  sampleRate: number,
): void {
  const durationSamples = Math.min(
    Math.floor((durationMs / 1000) * sampleRate),
    buffer.length,
  )
  if (durationSamples <= 0) return

  const noise =
    noiseType === 'white'
      ? generateWhiteNoise(durationSamples)
      : noiseType === 'pink'
        ? generatePinkNoise(durationSamples)
        : generateBrownNoise(durationSamples)

  // tau = N/2 so amplitude reaches ~13% at end of duration. Originally N/3
  // (~5%) per the spec; phase 1 tuning found that decayed too fast on the
  // 20-25ms impulses (Impact/Thud), making them feel weak.
  const tau = durationSamples / 2

  for (let i = 0; i < durationSamples; i++) {
    const env = Math.exp(-i / tau)
    buffer[i] = noise[i] * env
  }
}
