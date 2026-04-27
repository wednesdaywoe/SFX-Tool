import { generateAtmosphericNoise } from './noise'
import {
  ATMOSPHERIC_BASE_FREQ_HZ,
  type AtmosphericOscWave,
  type AtmosphericParams,
} from './types'

const TWO_PI = 2 * Math.PI

function oscSample(wave: AtmosphericOscWave, phase: number): number {
  if (wave === 'sine') return Math.sin(phase)
  // triangle
  const wrapped = phase / TWO_PI - Math.floor(phase / TWO_PI)
  return wrapped < 0.5 ? 4 * wrapped - 1 : 3 - 4 * wrapped
}

/* Generate the atmospheric source layer (noise + oscillators mixed) into a
 * Float32Array. For real-time playback this buffer loops; for offline export
 * it's sized to the export duration. Modulators apply downstream — the source
 * itself is deterministic given params + duration. */
export function generateAtmosphericSource(
  params: AtmosphericParams,
  durationSeconds: number,
  sampleRate: number,
): Float32Array {
  const numSamples = Math.max(1, Math.ceil(durationSeconds * sampleRate))
  const out = new Float32Array(numSamples)

  // Noise component
  const noiseAmount = params.noise_type === 'off' ? 0 : params.noise_amount
  const noise =
    noiseAmount > 0
      ? generateAtmosphericNoise(params.noise_type, numSamples)
      : null

  // Oscillator setup. Three slots, each with its own phase accumulator,
  // independently detuned. Inactive slots (osc_count below their index) skip.
  const baseFreq =
    ATMOSPHERIC_BASE_FREQ_HZ *
    Math.pow(2, params.base_pitch_semitones / 12)

  type OscState = {
    active: boolean
    wave: AtmosphericOscWave
    level: number
    freq: number
    phase: number
    phaseStep: number
  }
  const oscs: OscState[] = [
    {
      active: params.osc_count >= 1,
      wave: params.osc_a_wave,
      level: params.osc_a_level,
      freq: baseFreq,
      phase: 0,
      phaseStep: 0,
    },
    {
      active: params.osc_count >= 2,
      wave: params.osc_b_wave,
      level: params.osc_b_level,
      freq: baseFreq * Math.pow(2, params.osc_b_detune_cents / 1200),
      phase: 0,
      phaseStep: 0,
    },
    {
      active: params.osc_count >= 3,
      wave: params.osc_c_wave,
      level: params.osc_c_level,
      freq: baseFreq * Math.pow(2, params.osc_c_detune_cents / 1200),
      phase: 0,
      phaseStep: 0,
    },
  ]
  for (const o of oscs) {
    o.phaseStep = (TWO_PI * o.freq) / sampleRate
  }

  for (let i = 0; i < numSamples; i++) {
    let s = noise ? noise[i] * noiseAmount : 0
    for (const o of oscs) {
      if (!o.active || o.level <= 0) continue
      s += oscSample(o.wave, o.phase) * o.level
      o.phase += o.phaseStep
    }
    out[i] = s
  }

  return out
}
