export type PatternDirection = 'forward' | 'reverse' | 'ping-pong'

export interface PatternConfig {
  enabled: boolean
  steps: number              // 1-8
  interval_ms: number        // 20-500 (slider); wider via edit
  pitch_offsets: number[]    // semitones, length === steps
  volume_decay: number       // 0-1 per-step gain multiplier
  direction: PatternDirection
}

// Default pattern is a single trigger — effectively "off" even if enabled
// flips to true (steps=1 is also a no-op per spec).
export const DEFAULT_PATTERN: PatternConfig = {
  enabled: false,
  steps: 1,
  interval_ms: 110,
  pitch_offsets: [0],
  volume_decay: 1.0,
  direction: 'forward',
}
