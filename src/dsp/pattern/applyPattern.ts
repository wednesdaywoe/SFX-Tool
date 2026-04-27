import { removeDCOffset } from '../envelope'
import { pitchShiftBuffer } from './pitchShift'
import type { PatternConfig } from './types'

// Build the playback order from `direction`. Forward = original; reverse =
// reversed; ping-pong = forward then reverse without repeating the apex
// (so [a,b,c,d] → [a,b,c,d,c,b,a], 2N-1 entries).
function expandDirection(
  offsets: number[],
  direction: PatternConfig['direction'],
): number[] {
  if (direction === 'forward') return offsets
  if (direction === 'reverse') return [...offsets].reverse()
  // ping-pong
  if (offsets.length <= 1) return offsets
  const back = [...offsets].slice(0, -1).reverse()
  return [...offsets, ...back]
}

// Apply the pattern as a render-time post-process. Takes the synthesized
// source AudioBuffer and returns a new AudioBuffer with N pitch-shifted,
// gain-staggered, time-offset copies mixed together. DC removal at the
// end keeps the output clean.
//
// When pattern is disabled or steps === 1, the source is returned as-is.
export function applyPattern(
  source: AudioBuffer,
  config: PatternConfig,
  audioContext: BaseAudioContext,
): AudioBuffer {
  if (!config.enabled || config.steps <= 1) return source

  const sampleRate = source.sampleRate
  const sourceData = source.getChannelData(0)

  // Trim trailing silence so pitch-shifted copies don't carry a long quiet
  // tail. Keep the pitch-shifted output length per-step.
  const offsets = config.pitch_offsets.slice(0, config.steps)
  const playbackOrder = expandDirection(offsets, config.direction)

  // Pre-compute each shifted buffer once per unique pitch offset so we
  // don't re-shift the same value multiple times in machine-gun patterns.
  const shiftedCache = new Map<number, Float32Array>()
  function getShifted(semitones: number): Float32Array {
    let cached = shiftedCache.get(semitones)
    if (!cached) {
      cached = pitchShiftBuffer(sourceData, semitones)
      shiftedCache.set(semitones, cached)
    }
    return cached
  }

  const intervalSamples = Math.round((config.interval_ms / 1000) * sampleRate)

  // Total output length = position of last step + that step's buffer length.
  let totalSamples = 0
  for (let i = 0; i < playbackOrder.length; i++) {
    const startSample = i * intervalSamples
    const shifted = getShifted(playbackOrder[i])
    const endSample = startSample + shifted.length
    if (endSample > totalSamples) totalSamples = endSample
  }

  const out = new Float32Array(totalSamples)

  for (let i = 0; i < playbackOrder.length; i++) {
    const startSample = i * intervalSamples
    const semitones = playbackOrder[i]
    const shifted = getShifted(semitones)
    const gain = Math.pow(config.volume_decay, i)

    for (let j = 0; j < shifted.length; j++) {
      const idx = startSample + j
      if (idx >= out.length) break
      out[idx] += shifted[j] * gain
    }
  }

  removeDCOffset(out, sampleRate)

  const result = audioContext.createBuffer(1, totalSamples, sampleRate)
  result.copyToChannel(out, 0)
  return result
}
