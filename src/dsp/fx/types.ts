/* FX block (v3) — types. Each effect is independently toggleable; chain
 * order is fixed (distortion → bitcrusher → delay → reverb → EQ).
 *
 * Why fixed order: standard production audio convention. Distortion before
 * bitcrusher because bitcrushing already-distorted content has the cleanest
 * character; delay before reverb so echoes themselves reverberate; EQ at the
 * end as final corrective shaping.
 */

export type ReverbSpace =
  | 'small_room'
  | 'hall'
  | 'cathedral'
  | 'plate'
  | 'spring'
  | 'ambient_pad'

export type DistortionCurve = 'soft' | 'hard' | 'fold'

export interface ReverbConfig {
  enabled: boolean
  space: ReverbSpace
  mix: number          // 0-1
  pre_delay_ms: number // 0-100
}

export interface DelayConfig {
  enabled: boolean
  time_ms: number               // 1-2000
  feedback: number              // 0-0.95
  feedback_filter_freq_hz: number  // 200-12000
  mix: number                   // 0-1
}

export interface BitcrusherConfig {
  enabled: boolean
  bit_depth: number       // 1-16
  sample_rate_div: number // 1-32
  mix: number             // 0-1
}

export interface DistortionConfig {
  enabled: boolean
  drive: number           // 0-1
  curve: DistortionCurve
  tone_hz: number         // 100-12000
  mix: number             // 0-1
}

export interface EQConfig {
  enabled: boolean
  low_gain_db: number       // -12..+12 (low shelf at 250Hz)
  low_mid_gain_db: number   // -12..+12 (peaking at 600Hz)
  high_mid_gain_db: number  // -12..+12 (peaking at 3kHz)
  high_gain_db: number      // -12..+12 (high shelf at 6kHz)
}

export interface FXConfig {
  reverb: ReverbConfig
  delay: DelayConfig
  bitcrusher: BitcrusherConfig
  distortion: DistortionConfig
  eq: EQConfig
}

export const DEFAULT_FX_CONFIG: FXConfig = {
  reverb: {
    enabled: false,
    space: 'small_room',
    mix: 0.3,
    pre_delay_ms: 12,
  },
  delay: {
    enabled: false,
    time_ms: 250,
    feedback: 0.4,
    feedback_filter_freq_hz: 4000,
    mix: 0.3,
  },
  bitcrusher: {
    enabled: false,
    bit_depth: 8,
    sample_rate_div: 4,
    mix: 0.5,
  },
  distortion: {
    enabled: false,
    drive: 0.4,
    curve: 'soft',
    tone_hz: 4000,
    mix: 0.5,
  },
  eq: {
    enabled: false,
    low_gain_db: 0,
    low_mid_gain_db: 0,
    high_mid_gain_db: 0,
    high_gain_db: 0,
  },
}

/* Returns true when no effect is enabled — render paths can short-circuit
 * the entire FX pass and skip allocating the OfflineAudioContext. */
export function isFXBypassed(fx: FXConfig | undefined): boolean {
  if (!fx) return true
  return (
    !fx.reverb.enabled &&
    !fx.delay.enabled &&
    !fx.bitcrusher.enabled &&
    !fx.distortion.enabled &&
    !fx.eq.enabled
  )
}
