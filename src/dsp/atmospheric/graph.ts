import { generateAtmosphericSource } from './source'
import { buildModulatorBuffers, modDepthScale } from './modulators'
import { buildFXChain } from '../fx/fxChain'
import type { FXConfig } from '../fx/types'
import type {
  ModulationTarget,
  AtmosphericParams,
  SlowEnvTarget,
} from './types'

export interface AtmosphericGraph {
  output: AudioNode
  /* Sources to start (real-time: looping; offline: one-shot). */
  sources: AudioBufferSourceNode[]
}

/* Build the atmospheric Web Audio graph in either a live or offline context.
 *
 *   source → filter A ─┐
 *                       ├─► output gain → DC removal → graph.output
 *          → filter B ─┘
 *
 * Modulators (random walks, LFOs, slow envelope) are pre-generated to
 * Float32Arrays, then played via dedicated BufferSourceNodes whose output
 * connects to the target AudioParam through a depth-scale Gain. This works
 * uniformly in both AudioContext and OfflineAudioContext.
 */
export function buildAtmosphericGraph(
  ctx: BaseAudioContext,
  params: AtmosphericParams,
  durationSeconds: number,
  options: { loopSource: boolean; fx?: FXConfig },
): AtmosphericGraph {
  const sampleRate = ctx.sampleRate
  const numSamples = Math.max(1, Math.ceil(durationSeconds * sampleRate))

  // 1. Source layer — single mono buffer of noise + oscillators.
  const sourceData = generateAtmosphericSource(params, durationSeconds, sampleRate)
  const sourceBuffer = ctx.createBuffer(1, numSamples, sampleRate)
  sourceBuffer.copyToChannel(sourceData, 0)
  const source = ctx.createBufferSource()
  source.buffer = sourceBuffer
  source.loop = options.loopSource

  // 2. Filter A
  const filterA = ctx.createBiquadFilter()
  filterA.type = params.filter_a_type
  filterA.frequency.value = clamp(params.filter_a_freq_hz, 20, 20000)
  filterA.Q.value = clamp(params.filter_a_q, 0.1, 30)
  const filterAMix = ctx.createGain()
  filterAMix.gain.value = clamp(params.filter_a_mix, 0, 1)

  // 3. Filter B
  const filterB = ctx.createBiquadFilter()
  filterB.type = params.filter_b_type
  filterB.frequency.value = clamp(params.filter_b_freq_hz, 20, 20000)
  filterB.Q.value = clamp(params.filter_b_q, 0.1, 30)
  const filterBMix = ctx.createGain()
  filterBMix.gain.value = clamp(params.filter_b_mix, 0, 1)

  // 4. Output gain
  const outputGain = ctx.createGain()
  outputGain.gain.value = clamp(params.gain, 0, 1)

  // 5. FX block (between output gain and DC removal). Bypassed → no-op gain.
  const fxChain = buildFXChain(ctx, options.fx)

  // 6. DC removal (20Hz HP) — same as v1 + v2.
  const dcFilter = ctx.createBiquadFilter()
  dcFilter.type = 'highpass'
  dcFilter.frequency.value = 20
  dcFilter.Q.value = 0.707

  // Wire core signal path
  source.connect(filterA)
  source.connect(filterB)
  filterA.connect(filterAMix)
  filterB.connect(filterBMix)
  filterAMix.connect(outputGain)
  filterBMix.connect(outputGain)
  outputGain.connect(fxChain.input)
  fxChain.output.connect(dcFilter)

  // 6. Modulators
  const sources: AudioBufferSourceNode[] = [source]
  const modBuffers = buildModulatorBuffers(params, numSamples, sampleRate)

  for (const mod of modBuffers) {
    const buf = ctx.createBuffer(1, mod.data.length, sampleRate)
    buf.copyToChannel(mod.data, 0)
    const node = ctx.createBufferSource()
    node.buffer = buf
    node.loop = mod.loop
    sources.push(node)

    // Depth gain scales [-1,1] modulator output to AudioParam units.
    const depthGain = ctx.createGain()
    const param = resolveModTarget(
      mod.target,
      filterA,
      filterB,
      outputGain,
      source,
    )
    if (!param) continue
    depthGain.gain.value =
      mod.depth * modDepthScale(mod.target, baseValueForTarget(mod.target, params))

    node.connect(depthGain)
    depthGain.connect(param)
  }

  return {
    output: dcFilter,
    sources,
  }
}

function resolveModTarget(
  target: ModulationTarget | SlowEnvTarget,
  filterA: BiquadFilterNode,
  filterB: BiquadFilterNode,
  outputGain: GainNode,
  source: AudioBufferSourceNode,
): AudioParam | null {
  switch (target) {
    case 'amp':
      return outputGain.gain
    case 'pitch':
      return source.detune
    case 'filter_a_freq':
      return filterA.frequency
    case 'filter_a_q':
      return filterA.Q
    case 'filter_b_freq':
      return filterB.frequency
    case 'filter_b_q':
      return filterB.Q
    case 'off':
      return null
  }
}

function baseValueForTarget(
  target: ModulationTarget | SlowEnvTarget,
  params: AtmosphericParams,
): number {
  switch (target) {
    case 'filter_a_freq':
      return params.filter_a_freq_hz
    case 'filter_b_freq':
      return params.filter_b_freq_hz
    case 'filter_a_q':
      return params.filter_a_q
    case 'filter_b_q':
      return params.filter_b_q
    default:
      return 1
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}
