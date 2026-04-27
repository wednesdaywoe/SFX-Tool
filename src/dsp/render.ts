import { generateBody } from './body'
import { applyAmpEnvelope, applyGain, removeDCOffset } from './envelope'
import { generateImpulse } from './impulse'
import type { PercussiveParams } from './types'
import { SAMPLE_RATE } from './types'

// LP filtering wipes most of pink/white noise's energy, leaving the body to
// dominate. A 3x pre-filter boost on lowpass impulses restores the strike
// presence so Impact/Thud read as weighty rather than as a low "bop". Brown
// noise already concentrates energy in the lows, so it doesn't need (and
// shouldn't get) the boost.
const LOWPASS_IMPULSE_BOOST = 3

export async function renderPercussive(
  params: PercussiveParams,
): Promise<AudioBuffer> {
  const sampleRate = SAMPLE_RATE
  const totalDurationMs = params.decay_ms + 50
  const totalSamples = Math.ceil((totalDurationMs / 1000) * sampleRate)

  const dryBuffer = new Float32Array(totalSamples)
  generateImpulse(
    dryBuffer,
    params.impulse_duration_ms,
    params.noise_type,
    sampleRate,
  )

  if (params.filter_type === 'lowpass' && params.noise_type !== 'brown') {
    for (let i = 0; i < dryBuffer.length; i++) {
      dryBuffer[i] *= LOWPASS_IMPULSE_BOOST
    }
  }

  const offlineCtx = new OfflineAudioContext(1, totalSamples, sampleRate)
  const sourceBuffer = offlineCtx.createBuffer(1, totalSamples, sampleRate)
  sourceBuffer.copyToChannel(dryBuffer, 0)

  const source = offlineCtx.createBufferSource()
  source.buffer = sourceBuffer

  const filter = offlineCtx.createBiquadFilter()
  filter.type = params.filter_type
  filter.frequency.value = params.filter_freq_hz
  filter.Q.value = params.filter_q

  source.connect(filter).connect(offlineCtx.destination)
  source.start(0)

  const filteredBuffer = await offlineCtx.startRendering()
  const finalBuffer = filteredBuffer.getChannelData(0)

  generateBody(
    finalBuffer,
    0,
    params.body_freq_hz,
    params.body_decay_ms,
    params.body_waveform,
    params.body_amount,
    sampleRate,
  )
  applyAmpEnvelope(finalBuffer, params.decay_ms, params.decay_curve, sampleRate)
  applyGain(finalBuffer, params.gain)
  removeDCOffset(finalBuffer, sampleRate)

  return filteredBuffer
}
