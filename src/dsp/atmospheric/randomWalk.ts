/* Random walk modulator — aperiodic smoothed random.
 *
 * Why random walk vs LFO: real-world atmospheric variation (wind gusts, fire
 * crackle) is irregular. A periodic LFO sounds artificial because the period
 * becomes audible. Random walk emits new random targets at `rate_hz` and
 * smoothly interpolates the current value toward each target — gives the
 * "lifelike" feel without locked-in periodicity.
 */

export class RandomWalk {
  private current = 0
  private target = 0
  private samplesUntilNewTarget = 0
  private samplesPerUpdate: number
  private smoothingCoef: number

  constructor(rateHz: number, smoothingMs: number, sampleRate: number) {
    this.samplesPerUpdate = Math.max(1, Math.floor(sampleRate / rateHz))
    // Exponential smoothing: output approaches target with time constant
    // smoothing_ms. Coefficient = 1 - e^(-1/(τ × sr)).
    const tauSamples = Math.max(1, (smoothingMs / 1000) * sampleRate)
    this.smoothingCoef = 1 - Math.exp(-1 / tauSamples)
    // Start with an immediate target so the first samples aren't all zero.
    this.target = Math.random() * 2 - 1
    this.current = this.target * 0.3
    this.samplesUntilNewTarget = this.samplesPerUpdate
  }

  step(): number {
    if (this.samplesUntilNewTarget <= 0) {
      this.target = Math.random() * 2 - 1
      this.samplesUntilNewTarget = this.samplesPerUpdate
    }
    this.samplesUntilNewTarget--
    this.current += (this.target - this.current) * this.smoothingCoef
    return this.current
  }
}

/* Pre-render a random walk into a Float32Array. Used to feed BufferSourceNode
 * → AudioParam connections (works in both real-time and offline contexts). */
export function generateRandomWalkBuffer(
  rateHz: number,
  smoothingMs: number,
  sampleRate: number,
  numSamples: number,
): Float32Array {
  const walk = new RandomWalk(rateHz, smoothingMs, sampleRate)
  const out = new Float32Array(numSamples)
  for (let i = 0; i < numSamples; i++) {
    out[i] = walk.step()
  }
  return out
}
