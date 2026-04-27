import { removeDCOffset } from '../envelope'
import { SAMPLE_RATE } from '../types'
import type { TonalParams } from '../types'
import { applyAmpADSR } from './ampADSR'
import { lfoSample } from './lfo'
import { generateTonalSource } from './source'

const TWO_PI = 2 * Math.PI

// Cap render duration to prevent runaway buffer allocation if a user types
// extreme envelope values via the click-to-edit input.
const MAX_RENDER_MS = 4000

// Hard floor on cutoff so we don't pass <=0 to Web Audio's biquad.
const CUTOFF_FLOOR_HZ = 20

export async function renderTonal(params: TonalParams): Promise<AudioBuffer> {
  const sampleRate = SAMPLE_RATE
  const totalDurationMs = Math.min(
    MAX_RENDER_MS,
    params.amp_attack_ms +
      params.amp_decay_ms +
      params.amp_release_ms +
      50,
  )
  const totalSamples = Math.ceil((totalDurationMs / 1000) * sampleRate)

  // 1. Source layer: oscillators + sub + noise, with pitch envelope and
  //    pitch-targeted LFO baked in per-sample.
  const sourceBuffer = new Float32Array(totalSamples)
  generateTonalSource(sourceBuffer, params, sampleRate)

  // 2. Filter via OfflineAudioContext with cutoff automation that combines
  //    the filter envelope and (if targeted) the filter LFO.
  const offlineCtx = new OfflineAudioContext(1, totalSamples, sampleRate)
  const sourceAudioBuffer = offlineCtx.createBuffer(
    1,
    totalSamples,
    sampleRate,
  )
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

  // 3. Amp ADSR
  applyAmpADSR(finalBuffer, params, sampleRate)

  // 4. LFO on amp (the other LFO targets are integrated upstream)
  if (params.lfo_target === 'amp' && params.lfo_depth > 0) {
    for (let i = 0; i < finalBuffer.length; i++) {
      const t = i / sampleRate
      const lfoPhase = TWO_PI * params.lfo_rate_hz * t
      const lfoVal = lfoSample(params.lfo_shape, lfoPhase)
      // Amp LFO: 1 ± (depth × 0.5), so depth=1 → 50% amplitude wobble
      const modAmount = 1 + lfoVal * params.lfo_depth * 0.5
      finalBuffer[i] *= modAmount
    }
  }

  // 5. Output gain
  for (let i = 0; i < finalBuffer.length; i++) finalBuffer[i] *= params.gain

  // 6. DC removal — important for tonal because asymmetric square/saw waves
  //    can accumulate DC offset.
  removeDCOffset(finalBuffer, sampleRate)

  return filteredBuffer
}

// Sample the cutoff curve at fixed intervals (5ms = 200Hz update rate) and
// schedule linear ramps between samples. This handles both the static-LFO
// case and the LFO-on-filter case uniformly. 200Hz is well above 10× the
// max LFO rate (20Hz), so the LFO shape is preserved without aliasing.
function scheduleFilterAutomation(
  filter: BiquadFilterNode,
  params: TonalParams,
  totalSec: number,
  sampleRate: number,
): void {
  const baseCutoff = params.filter_freq_hz
  const lfoOnFilter = params.lfo_target === 'filter' && params.lfo_depth > 0
  const hasEnv = params.filter_env_amount !== 0

  if (!hasEnv && !lfoOnFilter) {
    // Static cutoff — no automation needed.
    filter.frequency.value = baseCutoff
    return
  }

  const stepSec = 0.005
  const initial = computeCutoffAt(0, params, baseCutoff, sampleRate, lfoOnFilter)
  filter.frequency.setValueAtTime(initial, 0)

  for (let t = stepSec; t < totalSec; t += stepSec) {
    const v = computeCutoffAt(t, params, baseCutoff, sampleRate, lfoOnFilter)
    filter.frequency.linearRampToValueAtTime(v, t)
  }
}

function computeCutoffAt(
  t: number,
  params: TonalParams,
  baseCutoff: number,
  sampleRate: number,
  lfoOnFilter: boolean,
): number {
  // Filter envelope shape: 0 at rest, peaks at 1 during attack, exp decay back
  // to 0. Same shape as the pitch envelope.
  const envAttackSec = params.filter_env_attack_ms / 1000
  const envDecaySec = params.filter_env_decay_ms / 1000

  let envShape: number
  if (t < envAttackSec) {
    envShape = envAttackSec === 0 ? 1 : t / envAttackSec
  } else if (t < envAttackSec + envDecaySec) {
    envShape =
      envDecaySec === 0
        ? 0
        : Math.exp((-(t - envAttackSec) / envDecaySec) * 4)
  } else {
    envShape = 0
  }

  // Envelope contribution: peak = base × 2^(amount × 4 octaves) per spec.
  let cutoff =
    baseCutoff * Math.pow(2, params.filter_env_amount * envShape * 4)

  if (lfoOnFilter) {
    const lfoPhase = TWO_PI * params.lfo_rate_hz * t
    const lfoVal = lfoSample(params.lfo_shape, lfoPhase)
    // Filter LFO: ±0.5 octave wobble at depth=1
    cutoff *= Math.pow(2, lfoVal * params.lfo_depth * 0.5)
  }

  return Math.max(CUTOFF_FLOOR_HZ, Math.min(sampleRate / 2 - 1, cutoff))
}
