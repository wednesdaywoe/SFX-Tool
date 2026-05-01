import { removeDCOffset } from '../envelope'
import { lfoSample } from '../tonal/lfo'
import { SAMPLE_RATE } from '../types'
import { generateFmSource } from './source'
import type { FmParams } from './types'

const TWO_PI = 2 * Math.PI
const MAX_RENDER_MS = 4000
const CUTOFF_FLOOR_HZ = 20

export async function renderFm(params: FmParams): Promise<AudioBuffer> {
  const sampleRate = SAMPLE_RATE
  const totalDurationMs = Math.min(
    MAX_RENDER_MS,
    params.amp_attack_ms +
      params.amp_decay_ms +
      params.amp_release_ms +
      50,
  )
  const totalSamples = Math.ceil((totalDurationMs / 1000) * sampleRate)

  // 1. Source: 4-op FM with per-op envelopes, pitch EG, and feedback baked in.
  const sourceBuffer = new Float32Array(totalSamples)
  generateFmSource(sourceBuffer, params, sampleRate)

  // 2. Filter via OfflineAudioContext (same approach as tonal/render.ts).
  const offlineCtx = new OfflineAudioContext(1, totalSamples, sampleRate)
  const sourceAudioBuffer = offlineCtx.createBuffer(1, totalSamples, sampleRate)
  sourceAudioBuffer.copyToChannel(sourceBuffer, 0)
  const source = offlineCtx.createBufferSource()
  source.buffer = sourceAudioBuffer

  const filter = offlineCtx.createBiquadFilter()
  filter.type = params.filter_type
  filter.Q.value = params.filter_q
  scheduleFilterAutomation(filter, params, totalDurationMs / 1000, sampleRate)

  source.connect(filter).connect(offlineCtx.destination)
  source.start(0)

  const filteredBuffer = await offlineCtx.startRendering()
  const finalBuffer = filteredBuffer.getChannelData(0)

  // 3. Amp ADSR (inline — FmParams has the same fields as TonalParams' amp_*).
  applyAmpADSR(finalBuffer, params, sampleRate)

  // 4. Amp-targeted LFO.
  if (params.lfo_target === 'amp' && params.lfo_depth > 0) {
    for (let i = 0; i < finalBuffer.length; i++) {
      const t = i / sampleRate
      const lfoPhase = TWO_PI * params.lfo_rate_hz * t
      const lfoVal = lfoSample(params.lfo_shape, lfoPhase)
      finalBuffer[i] *= 1 + lfoVal * params.lfo_depth * 0.5
    }
  }

  // 5. Output gain.
  for (let i = 0; i < finalBuffer.length; i++) finalBuffer[i] *= params.gain

  // 6. DC removal — FM with high feedback can accumulate offset.
  removeDCOffset(finalBuffer, sampleRate)

  return filteredBuffer
}

function applyAmpADSR(
  buffer: Float32Array,
  params: FmParams,
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

function scheduleFilterAutomation(
  filter: BiquadFilterNode,
  params: FmParams,
  totalSec: number,
  sampleRate: number,
): void {
  const baseCutoff = params.filter_freq_hz
  const lfoOnFilter = params.lfo_target === 'filter' && params.lfo_depth > 0

  if (!lfoOnFilter) {
    filter.frequency.value = baseCutoff
    return
  }

  const stepSec = 0.005
  filter.frequency.setValueAtTime(
    computeCutoffAt(0, params, baseCutoff, sampleRate),
    0,
  )
  for (let t = stepSec; t < totalSec; t += stepSec) {
    const v = computeCutoffAt(t, params, baseCutoff, sampleRate)
    filter.frequency.linearRampToValueAtTime(v, t)
  }
}

function computeCutoffAt(
  t: number,
  params: FmParams,
  baseCutoff: number,
  sampleRate: number,
): number {
  const lfoPhase = TWO_PI * params.lfo_rate_hz * t
  const lfoVal = lfoSample(params.lfo_shape, lfoPhase)
  const cutoff = baseCutoff * Math.pow(2, lfoVal * params.lfo_depth * 0.5)
  return Math.max(CUTOFF_FLOOR_HZ, Math.min(sampleRate / 2 - 1, cutoff))
}
