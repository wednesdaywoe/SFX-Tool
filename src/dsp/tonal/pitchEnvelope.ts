import type { TonalParams } from '../types'

// Pitch envelope: returns a multiplier on the oscillator base frequency.
//
// Shape: at rest pitch_mult = 1.0 (no shift). The envelope deviates pitch
// during attack to a peak of 2^pitch_env_amount_oct, then exponentially
// returns to 1.0 during decay, then stays at 1.0.
//
// Negative amount = pitch deviates downward; positive = upward.
// Attack ramp is linear; decay is exponential (perceived linearly because
// frequency is heard logarithmically).
export function computePitchEnvelope(t: number, params: TonalParams): number {
  const amount = params.pitch_env_amount_oct
  if (amount === 0) return 1

  const attackSec = params.pitch_env_attack_ms / 1000
  const decaySec = params.pitch_env_decay_ms / 1000

  let envShape: number
  if (t < attackSec) {
    envShape = attackSec === 0 ? 1 : t / attackSec
  } else if (t < attackSec + decaySec) {
    if (decaySec === 0) {
      envShape = 0
    } else {
      const decayProgress = (t - attackSec) / decaySec
      // exp(-decayProgress * 4) reaches ~1.8% by progress=1, close enough to 0
      envShape = Math.exp(-decayProgress * 4)
    }
  } else {
    envShape = 0
  }

  return Math.pow(2, amount * envShape)
}
