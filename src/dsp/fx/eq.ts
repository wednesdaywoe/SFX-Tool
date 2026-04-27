import type { FXChain } from './reverb'
import type { EQConfig } from './types'

export function createEQChain(
  ctx: BaseAudioContext,
  config: EQConfig,
): FXChain {
  // Pure pass-through if disabled or all bands at 0dB.
  if (
    !config.enabled ||
    (config.low_gain_db === 0 &&
      config.low_mid_gain_db === 0 &&
      config.high_mid_gain_db === 0 &&
      config.high_gain_db === 0)
  ) {
    const passthrough = ctx.createGain()
    return { input: passthrough, output: passthrough }
  }

  const lowShelf = ctx.createBiquadFilter()
  lowShelf.type = 'lowshelf'
  lowShelf.frequency.value = 250
  lowShelf.Q.value = 0.707
  lowShelf.gain.value = config.low_gain_db

  const lowMid = ctx.createBiquadFilter()
  lowMid.type = 'peaking'
  lowMid.frequency.value = 600
  lowMid.Q.value = 1.0
  lowMid.gain.value = config.low_mid_gain_db

  const highMid = ctx.createBiquadFilter()
  highMid.type = 'peaking'
  highMid.frequency.value = 3000
  highMid.Q.value = 1.0
  highMid.gain.value = config.high_mid_gain_db

  const highShelf = ctx.createBiquadFilter()
  highShelf.type = 'highshelf'
  highShelf.frequency.value = 6000
  highShelf.Q.value = 0.707
  highShelf.gain.value = config.high_gain_db

  lowShelf.connect(lowMid)
  lowMid.connect(highMid)
  highMid.connect(highShelf)

  return { input: lowShelf, output: highShelf }
}
