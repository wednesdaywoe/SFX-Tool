import type { BodyWaveform } from './types'

function triangleWave(phase: number): number {
  // Piecewise linear triangle in [-1, 1] from continuous phase.
  const wrapped = phase / (2 * Math.PI) - Math.floor(phase / (2 * Math.PI))
  return wrapped < 0.5 ? 4 * wrapped - 1 : 3 - 4 * wrapped
}

export function generateBody(
  buffer: Float32Array,
  startSample: number,
  freqHz: number,
  decayMs: number,
  waveform: BodyWaveform,
  amount: number,
  sampleRate: number,
): void {
  if (amount === 0) return

  const durationSamples = Math.floor((decayMs / 1000) * sampleRate)
  const tau = durationSamples / 4
  const phaseStep = (2 * Math.PI * freqHz) / sampleRate

  for (let i = 0; i < durationSamples; i++) {
    const idx = startSample + i
    if (idx >= buffer.length) break
    const phase = i * phaseStep
    const sample = waveform === 'sine' ? Math.sin(phase) : triangleWave(phase)
    const env = Math.exp(-i / tau)
    buffer[idx] += sample * env * amount
  }
}
