export function applyAmpEnvelope(
  buffer: Float32Array,
  decayMs: number,
  curve: number,
  sampleRate: number,
): void {
  const durationSamples = Math.floor((decayMs / 1000) * sampleRate)
  if (durationSamples <= 0) {
    buffer.fill(0)
    return
  }
  const tau = durationSamples / 4

  for (let i = 0; i < buffer.length; i++) {
    if (i >= durationSamples) {
      buffer[i] = 0
      continue
    }
    const expEnv = Math.exp(-i / tau)
    const linEnv = 1 - i / durationSamples
    const env = expEnv * (1 - curve) + linEnv * curve
    buffer[i] *= env
  }
}

export function applyGain(buffer: Float32Array, gain: number): void {
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] *= gain
  }
}

// Simple one-pole DC-blocking high-pass: y[n] = x[n] - x[n-1] + R * y[n-1].
// R chosen to put the corner near 20Hz at 44.1kHz.
export function removeDCOffset(buffer: Float32Array, sampleRate: number): void {
  const fc = 20
  const R = Math.exp((-2 * Math.PI * fc) / sampleRate)
  let prevX = 0
  let prevY = 0
  for (let i = 0; i < buffer.length; i++) {
    const x = buffer[i]
    const y = x - prevX + R * prevY
    prevX = x
    prevY = y
    buffer[i] = y
  }
}
