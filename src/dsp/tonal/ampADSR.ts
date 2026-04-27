import type { TonalParams } from '../types'

// Standard ADSR with held sustain. Since SFX renders are fixed-duration with
// no note-off, "sustain" is the level held between decay end and release
// start for whatever time remains in the buffer. Sounds with fast envelopes
// produce essentially no sustain region; long envelopes have meaningful
// sustain.
export function applyAmpADSR(
  buffer: Float32Array,
  params: TonalParams,
  sampleRate: number,
): void {
  const attackSamples = (params.amp_attack_ms / 1000) * sampleRate
  const decaySamples = (params.amp_decay_ms / 1000) * sampleRate
  const releaseSamples = (params.amp_release_ms / 1000) * sampleRate
  const sustainLevel = params.amp_sustain

  const totalEnvSamples = attackSamples + decaySamples + releaseSamples
  const sustainSamples = Math.max(0, buffer.length - totalEnvSamples)

  const attackEnd = attackSamples
  const decayEnd = attackEnd + decaySamples
  const sustainEnd = decayEnd + sustainSamples

  for (let i = 0; i < buffer.length; i++) {
    let env: number
    if (i < attackEnd) {
      env = attackSamples === 0 ? 1 : i / attackSamples
    } else if (i < decayEnd) {
      if (decaySamples === 0) {
        env = sustainLevel
      } else {
        const decayProgress = (i - attackEnd) / decaySamples
        env = 1 + (sustainLevel - 1) * (1 - Math.exp(-decayProgress * 4))
      }
    } else if (i < sustainEnd) {
      env = sustainLevel
    } else {
      if (releaseSamples === 0) {
        env = 0
      } else {
        const releaseProgress = (i - sustainEnd) / releaseSamples
        env = sustainLevel * Math.exp(-releaseProgress * 4)
      }
    }
    buffer[i] *= env
  }
}
