import { generateRandomWalkBuffer } from './randomWalk'
import type {
  AtmosphericParams,
  LfoShape,
  ModulationTarget,
  SlowEnvShape,
  SlowEnvTarget,
} from './types'

const TWO_PI = 2 * Math.PI

/* Pre-rendered modulator signal in [-1, 1]. Played via BufferSourceNode
 * connected to a target AudioParam, scaled by a depth Gain. Long buffers
 * (60s+ for real-time) keep loop seams inaudible because random walks aren't
 * periodic. LFOs are periodic by design — looping is fine. */
export interface ModulatorBuffer {
  data: Float32Array
  /* Whether this modulator should loop in real-time playback. */
  loop: boolean
  target: ModulationTarget | SlowEnvTarget
  depth: number
}

/* Build the buffers for all six potential modulators (RW1, RW2, LFO1, LFO2,
 * slow envelope, plus an empty placeholder slot for "none"). Caller assigns
 * each one to its routing target. */
export function buildModulatorBuffers(
  params: AtmosphericParams,
  numSamples: number,
  sampleRate: number,
): ModulatorBuffer[] {
  const buffers: ModulatorBuffer[] = []

  // Random Walk 1
  if (params.rw1_target !== 'off' && params.rw1_depth > 0) {
    buffers.push({
      data: generateRandomWalkBuffer(
        params.rw1_rate_hz,
        params.rw1_smoothing_ms,
        sampleRate,
        numSamples,
      ),
      loop: true,
      target: params.rw1_target,
      depth: params.rw1_depth,
    })
  }

  // Random Walk 2
  if (params.rw2_target !== 'off' && params.rw2_depth > 0) {
    buffers.push({
      data: generateRandomWalkBuffer(
        params.rw2_rate_hz,
        params.rw2_smoothing_ms,
        sampleRate,
        numSamples,
      ),
      loop: true,
      target: params.rw2_target,
      depth: params.rw2_depth,
    })
  }

  // LFO 1
  if (params.lfo1_target !== 'off' && params.lfo1_depth > 0) {
    buffers.push({
      data: generateLfoBuffer(
        params.lfo1_rate_hz,
        params.lfo1_shape,
        params.lfo1_phase_offset_deg,
        sampleRate,
        numSamples,
      ),
      loop: true,
      target: params.lfo1_target,
      depth: params.lfo1_depth,
    })
  }

  // LFO 2
  if (params.lfo2_target !== 'off' && params.lfo2_depth > 0) {
    buffers.push({
      data: generateLfoBuffer(
        params.lfo2_rate_hz,
        params.lfo2_shape,
        params.lfo2_phase_offset_deg,
        sampleRate,
        numSamples,
      ),
      loop: true,
      target: params.lfo2_target,
      depth: params.lfo2_depth,
    })
  }

  // Slow envelope (one-shot — does not loop). Only emitted when enabled and
  // the buffer is long enough to contain at least the envelope rise.
  if (
    params.slow_env_target !== 'off' &&
    params.slow_env_amount !== 0 &&
    numSamples > 0
  ) {
    buffers.push({
      data: generateSlowEnvBuffer(
        params.slow_env_shape,
        params.slow_env_duration_s,
        sampleRate,
        numSamples,
      ),
      loop: false,
      target: params.slow_env_target,
      depth: params.slow_env_amount, // signed [-1, +1]
    })
  }

  return buffers
}

function generateLfoBuffer(
  rateHz: number,
  shape: LfoShape,
  phaseOffsetDeg: number,
  sampleRate: number,
  numSamples: number,
): Float32Array {
  const out = new Float32Array(numSamples)
  const phaseStep = (TWO_PI * rateHz) / sampleRate
  let phase = (phaseOffsetDeg / 360) * TWO_PI
  for (let i = 0; i < numSamples; i++) {
    out[i] = lfoSample(shape, phase)
    phase += phaseStep
  }
  return out
}

function lfoSample(shape: LfoShape, phase: number): number {
  switch (shape) {
    case 'sine':
      return Math.sin(phase)
    case 'triangle': {
      // arcsin-of-sine — smooth, continuous triangle.
      return (2 / Math.PI) * Math.asin(Math.sin(phase))
    }
    case 'square':
      return Math.sin(phase) >= 0 ? 1 : -1
  }
}

function generateSlowEnvBuffer(
  shape: SlowEnvShape,
  durationS: number,
  sampleRate: number,
  numSamples: number,
): Float32Array {
  const out = new Float32Array(numSamples)
  const envSamples = Math.max(1, Math.floor(durationS * sampleRate))
  for (let i = 0; i < numSamples; i++) {
    const t = Math.min(1, i / envSamples)
    let v = 0
    switch (shape) {
      case 'ramp_up':
        v = t
        break
      case 'ramp_down':
        v = 1 - t
        break
      case 'hold_then_release':
        // Hold at 1 for first 70%, ramp to 0 over last 30%.
        if (t < 0.7) v = 1
        else v = 1 - (t - 0.7) / 0.3
        break
      case 'attack_hold_release':
        if (t < 0.2) v = t / 0.2
        else if (t < 0.8) v = 1
        else v = 1 - (t - 0.8) / 0.2
        break
    }
    out[i] = v
  }
  return out
}

/* Helper for graph wiring: per-target depth scale. Filter freq modulation
 * needs much larger AudioParam units than amp modulation, so each target
 * applies a different scale to the [-1,1] modulator signal × depth. */
export function modDepthScale(
  target: ModulationTarget | SlowEnvTarget,
  baseValue: number,
): number {
  switch (target) {
    case 'amp':
      // ±50% amplitude variation at full depth.
      return 0.5
    case 'pitch':
      // ±1 octave at full depth — modulator output is in semitones × 12.
      // For BiquadFilter detune (cents), this would be 1200 — but we don't
      // have a pitch AudioParam directly; pitch modulation is applied to the
      // source generator's frequency at render-time. Returning 1200 keeps the
      // ABI consistent (1.0 at max depth → 1 octave shift).
      return 1200
    case 'filter_a_freq':
    case 'filter_b_freq':
      // ±2 octaves at full depth, scaled in Hz around the base. The graph
      // builder applies the depth as a multiplicative shift via a connected
      // ConstantSource or by computing baseValue × pow(2, mod × depth × 2).
      // Here we expose linear-Hz depth: ±baseValue × (2^(depth × 2) − 1).
      return baseValue * (Math.pow(2, 2) - 1)
    case 'filter_a_q':
    case 'filter_b_q':
      // ±50% Q variation at full depth.
      return baseValue * 0.5
    case 'off':
      return 0
  }
}
