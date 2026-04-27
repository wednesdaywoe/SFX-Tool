import { getReverbIR } from './irs'
import type { ReverbConfig } from './types'

export interface FXChain {
  input: AudioNode
  output: AudioNode
}

export function createReverbChain(
  ctx: BaseAudioContext,
  config: ReverbConfig,
): FXChain {
  const input = ctx.createGain()
  const output = ctx.createGain()
  const dryMix = ctx.createGain()

  if (!config.enabled || config.mix === 0) {
    // Bypass — straight pass-through
    input.connect(output)
    return { input, output }
  }

  dryMix.gain.value = 1 - config.mix
  const wetMix = ctx.createGain()
  wetMix.gain.value = config.mix

  input.connect(dryMix)
  dryMix.connect(output)

  // Pre-delay (max 100ms per spec)
  const preDelay = ctx.createDelay(0.2)
  preDelay.delayTime.value = Math.max(0, Math.min(0.1, config.pre_delay_ms / 1000))

  const convolver = ctx.createConvolver()
  convolver.buffer = getReverbIR(ctx, config.space)

  input.connect(preDelay)
  preDelay.connect(convolver)
  convolver.connect(wetMix)
  wetMix.connect(output)

  return { input, output }
}
