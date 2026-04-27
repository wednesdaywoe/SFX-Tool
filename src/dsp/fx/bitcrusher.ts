import type { FXChain } from './reverb'
import type { BitcrusherConfig } from './types'

/* Bitcrusher — sample-rate reduction (sample-and-hold) + bit-depth quantization.
 *
 * Implementation note: ScriptProcessor is deprecated but works uniformly in
 * both AudioContext and OfflineAudioContext. AudioWorklet would be preferable
 * for production (lower-latency, off-main-thread) but requires async setup
 * incompatible with our synchronous graph builder. Phase 7 polish migrates.
 */
export function createBitcrusherChain(
  ctx: BaseAudioContext,
  config: BitcrusherConfig,
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

  // ScriptProcessorNode buffer size 256 — small enough for low latency,
  // large enough to avoid excessive callback overhead.
  const node = ctx.createScriptProcessor(256, 1, 1)
  const sampleRateDiv = Math.max(1, Math.min(32, Math.floor(config.sample_rate_div)))
  const bitDepth = Math.max(1, Math.min(16, Math.floor(config.bit_depth)))
  const levels = Math.pow(2, bitDepth)
  let heldSample = 0
  let samplesUntilUpdate = 0

  node.onaudioprocess = (e) => {
    const inBuf = e.inputBuffer.getChannelData(0)
    const outBuf = e.outputBuffer.getChannelData(0)
    for (let i = 0; i < inBuf.length; i++) {
      if (samplesUntilUpdate <= 0) {
        // Quantize to bit depth: round to nearest level in [-1, 1].
        heldSample = Math.round(inBuf[i] * levels) / levels
        samplesUntilUpdate = sampleRateDiv
      }
      outBuf[i] = heldSample
      samplesUntilUpdate--
    }
  }

  input.connect(node)
  node.connect(wetMix)
  wetMix.connect(output)

  return { input, output }
}
