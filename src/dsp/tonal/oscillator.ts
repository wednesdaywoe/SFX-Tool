import type { OscWaveform } from '../types'

const TWO_PI = 2 * Math.PI

// Sample an oscillator at the given phase (radians). Phase is accumulated
// externally; the per-sample increment is (2π × freq) / sampleRate.
//
// All four shapes alias at high frequencies (no band-limiting). Acceptable
// for short SFX renders; the perceptual cost is small and the implementation
// stays simple.
export function oscillator(wave: OscWaveform, phase: number): number {
  switch (wave) {
    case 'sine':
      return Math.sin(phase)
    case 'triangle': {
      const wrapped = phase / TWO_PI - Math.floor(phase / TWO_PI)
      return wrapped < 0.5 ? 4 * wrapped - 1 : 3 - 4 * wrapped
    }
    case 'square':
      return Math.sin(phase) >= 0 ? 1 : -1
    case 'saw': {
      const wrapped = phase / TWO_PI - Math.floor(phase / TWO_PI)
      return 2 * wrapped - 1
    }
  }
}
