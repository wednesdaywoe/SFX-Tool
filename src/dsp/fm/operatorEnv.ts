import type { FmOperator } from './types'

// Per-operator ADSR sampled at time t (seconds). Same exponential-decay
// shape as the global amp ADSR in tonal mode (ampADSR.ts) but evaluated
// per-sample rather than written into a buffer, since the FM source loop
// needs every operator's envelope value at every sample.
//
// Returns 0..1. Multiply by op.level to get the final scalar applied to the
// operator's output.
export function operatorEnvAt(
  op: FmOperator,
  t: number,
  totalSec: number,
): number {
  const attackSec = op.env_attack_ms / 1000
  const decaySec = op.env_decay_ms / 1000
  const releaseSec = op.env_release_ms / 1000
  const sustain = op.env_sustain

  const totalEnvSec = attackSec + decaySec + releaseSec
  const sustainSec = Math.max(0, totalSec - totalEnvSec)

  const attackEnd = attackSec
  const decayEnd = attackEnd + decaySec
  const sustainEnd = decayEnd + sustainSec

  if (t < attackEnd) {
    return attackSec === 0 ? 1 : t / attackSec
  }
  if (t < decayEnd) {
    if (decaySec === 0) return sustain
    const decayProgress = (t - attackEnd) / decaySec
    return 1 + (sustain - 1) * (1 - Math.exp(-decayProgress * 4))
  }
  if (t < sustainEnd) {
    return sustain
  }
  if (releaseSec === 0) return 0
  const releaseProgress = (t - sustainEnd) / releaseSec
  return sustain * Math.exp(-releaseProgress * 4)
}
