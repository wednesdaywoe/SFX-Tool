import type { FXChain } from './reverb'
import type { DistortionConfig, DistortionCurve } from './types'

export function makeDistortionCurve(
  curve: DistortionCurve,
  drive: number,
): Float32Array<ArrayBuffer> {
  const samples = 4096
  const out = new Float32Array(samples)
  // 1× to 100× input gain
  const driveAmount = 1 + drive * 99

  for (let i = 0; i < samples; i++) {
    const x = (i / samples) * 2 - 1
    const driven = x * driveAmount
    let y: number
    switch (curve) {
      case 'soft':
        y = Math.tanh(driven)
        break
      case 'hard':
        y = Math.max(-1, Math.min(1, driven))
        break
      case 'fold': {
        // Triangular wave-folding wrap
        let folded = driven
        let safety = 64
        while (Math.abs(folded) > 1 && safety-- > 0) {
          folded = folded > 0 ? 2 - folded : -2 - folded
        }
        y = folded
        break
      }
    }
    out[i] = y
  }
  return out
}

export function createDistortionChain(
  ctx: BaseAudioContext,
  config: DistortionConfig,
): FXChain {
  const input = ctx.createGain()
  const output = ctx.createGain()
  const dryMix = ctx.createGain()

  if (!config.enabled || config.mix === 0) {
    input.connect(output)
    return { input, output }
  }

  dryMix.gain.value = 1 - config.mix
  const wetMix = ctx.createGain()
  wetMix.gain.value = config.mix

  input.connect(dryMix)
  dryMix.connect(output)

  const shaper = ctx.createWaveShaper()
  shaper.curve = makeDistortionCurve(config.curve, config.drive)
  shaper.oversample = '4x'

  const tone = ctx.createBiquadFilter()
  tone.type = 'lowpass'
  tone.frequency.value = config.tone_hz
  tone.Q.value = 0.707

  input.connect(shaper)
  shaper.connect(tone)
  tone.connect(wetMix)
  wetMix.connect(output)

  return { input, output }
}
