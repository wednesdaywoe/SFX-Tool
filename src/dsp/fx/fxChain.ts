import { createBitcrusherChain } from './bitcrusher'
import { createDelayChain } from './delay'
import { createDistortionChain } from './distortion'
import { createEQChain } from './eq'
import { createReverbChain, type FXChain } from './reverb'
import { isFXBypassed, type FXConfig } from './types'

/* Build the full FX chain in fixed order:
 *   distortion → bitcrusher → delay → reverb → EQ
 *
 * Standard production audio convention; see FXConfig docstring.
 *
 * Returns input + output AudioNodes; caller wires source → input and
 * output → destination (or further downstream).
 */
export function buildFXChain(
  ctx: BaseAudioContext,
  fx: FXConfig | undefined,
): FXChain {
  if (isFXBypassed(fx)) {
    const passthrough = ctx.createGain()
    return { input: passthrough, output: passthrough }
  }
  const config = fx as FXConfig

  const distortion = createDistortionChain(ctx, config.distortion)
  const bitcrusher = createBitcrusherChain(ctx, config.bitcrusher)
  const delay = createDelayChain(ctx, config.delay)
  const reverb = createReverbChain(ctx, config.reverb)
  const eq = createEQChain(ctx, config.eq)

  distortion.output.connect(bitcrusher.input)
  bitcrusher.output.connect(delay.input)
  delay.output.connect(reverb.input)
  reverb.output.connect(eq.input)

  return { input: distortion.input, output: eq.output }
}

/* Apply FX as a post-process pass on a finished AudioBuffer. Used by the
 * percussive/tonal/stack render paths, which produce a complete buffer first
 * and then route it through FX via OfflineAudioContext for a clean apply. */
export async function applyFXToBuffer(
  buffer: AudioBuffer,
  fx: FXConfig | undefined,
): Promise<AudioBuffer> {
  if (isFXBypassed(fx)) return buffer

  // Output buffer length: source length + reverb tail allowance. Reverb adds
  // up to ~6s for ambient_pad; cap at +6s to avoid huge buffers.
  const tailExtraSamples = Math.ceil(6 * buffer.sampleRate)
  const outChannels = buffer.numberOfChannels
  const ctx = new OfflineAudioContext(
    outChannels,
    buffer.length + tailExtraSamples,
    buffer.sampleRate,
  )

  const source = ctx.createBufferSource()
  source.buffer = buffer

  const chain = buildFXChain(ctx, fx)
  source.connect(chain.input)
  chain.output.connect(ctx.destination)
  source.start()

  return ctx.startRendering()
}
