import type { FXChain } from './reverb'
import type { DelayConfig } from './types'

export function createDelayChain(
  ctx: BaseAudioContext,
  config: DelayConfig,
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

  const delay = ctx.createDelay(2.0)
  delay.delayTime.value = Math.max(0.001, Math.min(2, config.time_ms / 1000))

  const feedbackGain = ctx.createGain()
  feedbackGain.gain.value = Math.max(0, Math.min(0.95, config.feedback))

  const feedbackFilter = ctx.createBiquadFilter()
  feedbackFilter.type = 'lowpass'
  feedbackFilter.frequency.value = config.feedback_filter_freq_hz
  feedbackFilter.Q.value = 0.707

  // input → delay → wet → out
  // feedback loop: delay → filter → feedback gain → delay
  input.connect(delay)
  delay.connect(feedbackFilter)
  feedbackFilter.connect(feedbackGain)
  feedbackGain.connect(delay)
  delay.connect(wetMix)
  wetMix.connect(output)

  return { input, output }
}
