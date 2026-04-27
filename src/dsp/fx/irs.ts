import type { ReverbSpace } from './types'

/* Synthesized impulse responses for the 6 reverb spaces. Phase 3 ships these
 * algorithmic IRs — decay-shaped noise bursts — to avoid IR licensing/sourcing
 * dependencies. They produce useful reverb character for SFX work; phase 7
 * polish can swap in real recorded IRs (Open AIR Library, Voxengo free pack,
 * etc.) without touching the rest of the pipeline.
 */

interface IRSpec {
  /* Total length in seconds. */
  durationS: number
  /* Exponential decay rate. Higher = faster decay. */
  decay: number
  /* Pre-decay delay (early reflections) in seconds. */
  predelayS: number
  /* High-frequency rolloff cutoff in Hz (0 = no rolloff). */
  rolloffHz: number
  /* Optional metallic ringing for spring/plate character. */
  metallic?: { freqHz: number; depth: number }
}

const SPACES: Record<ReverbSpace, IRSpec> = {
  small_room: {
    durationS: 0.4,
    decay: 8,
    predelayS: 0.005,
    rolloffHz: 5000,
  },
  hall: {
    durationS: 2.0,
    decay: 2,
    predelayS: 0.02,
    rolloffHz: 7000,
  },
  cathedral: {
    durationS: 4.5,
    decay: 0.9,
    predelayS: 0.04,
    rolloffHz: 5000,
  },
  plate: {
    durationS: 1.8,
    decay: 2.2,
    predelayS: 0.001,
    rolloffHz: 9000,
    metallic: { freqHz: 3500, depth: 0.15 },
  },
  spring: {
    durationS: 0.9,
    decay: 4,
    predelayS: 0.001,
    rolloffHz: 6000,
    metallic: { freqHz: 1500, depth: 0.4 },
  },
  ambient_pad: {
    durationS: 6.0,
    decay: 0.6,
    predelayS: 0.05,
    rolloffHz: 4000,
  },
}

const cache = new Map<string, AudioBuffer>()

export function getReverbIR(
  ctx: BaseAudioContext,
  space: ReverbSpace,
): AudioBuffer {
  const key = `${space}@${ctx.sampleRate}`
  const cached = cache.get(key)
  if (cached) return cached
  const ir = synthesizeIR(ctx, SPACES[space])
  cache.set(key, ir)
  return ir
}

function synthesizeIR(ctx: BaseAudioContext, spec: IRSpec): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const numSamples = Math.max(1, Math.ceil(spec.durationS * sampleRate))
  const predelaySamples = Math.floor(spec.predelayS * sampleRate)
  const buffer = ctx.createBuffer(2, numSamples, sampleRate)

  // First-order LP coefficient for the rolloff
  const lpCoef = spec.rolloffHz > 0
    ? 1 - Math.exp(-2 * Math.PI * spec.rolloffHz / sampleRate)
    : 1

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    let lpState = 0
    for (let i = 0; i < numSamples; i++) {
      if (i < predelaySamples) {
        data[i] = 0
        continue
      }
      const t = (i - predelaySamples) / sampleRate
      const env = Math.exp(-spec.decay * t)
      // Decorrelated stereo via per-channel random seed
      let sample = (Math.random() * 2 - 1) * env
      if (spec.metallic) {
        const ring = Math.sin(2 * Math.PI * spec.metallic.freqHz * t) * env * spec.metallic.depth
        sample += ring
      }
      // First-order LP for rolloff
      lpState += (sample - lpState) * lpCoef
      data[i] = lpState
    }
  }
  return buffer
}
