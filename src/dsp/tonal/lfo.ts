import type { LfoShape } from '../types'

// Sample an LFO at the given phase (radians). Triangle uses an arcsin-of-sine
// approximation — cleaner than a Fourier series at the audio rates we're
// using and the cost difference is imperceptible.
export function lfoSample(shape: LfoShape, phase: number): number {
  switch (shape) {
    case 'sine':
      return Math.sin(phase)
    case 'triangle':
      return (2 / Math.PI) * Math.asin(Math.sin(phase))
    case 'square':
      return Math.sin(phase) >= 0 ? 1 : -1
  }
}
