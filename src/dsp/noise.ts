export function generateWhiteNoise(numSamples: number): Float32Array {
  const out = new Float32Array(numSamples)
  for (let i = 0; i < numSamples; i++) {
    out[i] = Math.random() * 2 - 1
  }
  return out
}

// Brown (red) noise via Paul Kellett's leaky integrator. Spectrum falls off
// at -6 dB/oct, concentrating energy in the lows — reads as rumble, distant
// thunder, weighty impacts. The /1.02 leak prevents DC drift; *3.5 brings
// amplitude back into roughly [-1, 1].
export function generateBrownNoise(numSamples: number): Float32Array {
  const out = new Float32Array(numSamples)
  let last = 0
  for (let i = 0; i < numSamples; i++) {
    const white = Math.random() * 2 - 1
    last = (last + 0.02 * white) / 1.02
    out[i] = last * 3.5
  }
  return out
}

export function generatePinkNoise(numSamples: number): Float32Array {
  const out = new Float32Array(numSamples)
  const numRows = 16
  const rows = new Float32Array(numRows)
  let runningSum = 0

  for (let i = 0; i < numRows; i++) {
    rows[i] = Math.random() * 2 - 1
    runningSum += rows[i]
  }

  for (let i = 0; i < numSamples; i++) {
    let rowIndex = 0
    let n = i
    while ((n & 1) === 0 && rowIndex < numRows - 1) {
      n >>= 1
      rowIndex++
    }

    const newValue = Math.random() * 2 - 1
    runningSum -= rows[rowIndex]
    runningSum += newValue
    rows[rowIndex] = newValue

    out[i] = runningSum / numRows
  }

  return out
}
