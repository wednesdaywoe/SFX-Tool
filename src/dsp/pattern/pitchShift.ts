// Sample-rate-offset pitch shift with linear interpolation.
//
// To pitch up by N semitones, read the source at 2^(N/12) × original_rate
// — the resulting buffer is shorter. Pitching down stretches it longer.
// Duration is NOT preserved; that's a v2 limitation, accepted because it
// keeps the implementation tiny and the artifacts are usually fine for
// short SFX patterns.
export function pitchShiftBuffer(
  source: Float32Array,
  semitones: number,
): Float32Array {
  if (semitones === 0) return source.slice()

  const ratio = Math.pow(2, semitones / 12)
  const outputLength = Math.max(1, Math.ceil(source.length / ratio))
  const output = new Float32Array(outputLength)

  for (let i = 0; i < outputLength; i++) {
    const sourceIdx = i * ratio
    const idx0 = Math.floor(sourceIdx)
    const idx1 = idx0 + 1
    const frac = sourceIdx - idx0

    if (idx0 >= source.length) {
      output[i] = 0
    } else if (idx1 >= source.length) {
      output[i] = source[idx0]
    } else {
      output[i] = source[idx0] * (1 - frac) + source[idx1] * frac
    }
  }

  return output
}
