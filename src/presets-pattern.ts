import type { PatternConfig } from './dsp/pattern/types'

export type PatternPresetKey =
  | 'single'
  | 'double'
  | 'triple'
  | 'machine_gun'
  | 'octave_up'
  | 'major_arp'
  | 'minor_arp'

// Selectable templates that populate the PatternConfig. "Custom" is not in
// this list because Custom is a *computed* state — it appears in the UI
// when the current config doesn't match any named preset, but the user
// never explicitly picks it. See `detectPatternPreset`.
export const PATTERN_PRESETS: Record<
  PatternPresetKey,
  Omit<PatternConfig, 'enabled'>
> = {
  single: {
    steps: 1,
    interval_ms: 110,
    pitch_offsets: [0],
    volume_decay: 1.0,
    direction: 'forward',
  },
  double: {
    steps: 2,
    interval_ms: 80,
    pitch_offsets: [0, 0],
    volume_decay: 0.7,
    direction: 'forward',
  },
  triple: {
    steps: 3,
    interval_ms: 70,
    pitch_offsets: [0, 0, 0],
    volume_decay: 0.7,
    direction: 'forward',
  },
  machine_gun: {
    steps: 7,
    interval_ms: 50,
    pitch_offsets: [0, 0, 0, 0, 0, 0, 0],
    volume_decay: 0.85,
    direction: 'forward',
  },
  octave_up: {
    steps: 2,
    interval_ms: 70,
    pitch_offsets: [0, 12],
    volume_decay: 1.0,
    direction: 'forward',
  },
  major_arp: {
    steps: 4,
    interval_ms: 110,
    pitch_offsets: [0, 4, 7, 12],
    volume_decay: 1.0,
    direction: 'forward',
  },
  minor_arp: {
    steps: 4,
    interval_ms: 110,
    pitch_offsets: [0, 3, 7, 12],
    volume_decay: 1.0,
    direction: 'forward',
  },
}

export const PATTERN_PRESET_ORDER: PatternPresetKey[] = [
  'single',
  'double',
  'triple',
  'machine_gun',
  'octave_up',
  'major_arp',
  'minor_arp',
]

export const PATTERN_PRESET_LABELS: Record<PatternPresetKey, string> = {
  single: 'Single',
  double: 'Double',
  triple: 'Triple',
  machine_gun: 'M.Gun',
  octave_up: 'Oct',
  major_arp: 'Maj',
  minor_arp: 'Min',
}

// Returns the matching preset key if the config matches a named preset,
// otherwise null (meaning "Custom"). Comparison ignores `enabled`.
export function detectPatternPreset(
  config: PatternConfig,
): PatternPresetKey | null {
  for (const key of PATTERN_PRESET_ORDER) {
    const preset = PATTERN_PRESETS[key]
    if (preset.steps !== config.steps) continue
    if (preset.interval_ms !== config.interval_ms) continue
    if (preset.volume_decay !== config.volume_decay) continue
    if (preset.direction !== config.direction) continue
    if (
      preset.pitch_offsets.length !== config.pitch_offsets.length
    )
      continue
    let offsetsMatch = true
    for (let i = 0; i < preset.pitch_offsets.length; i++) {
      if (preset.pitch_offsets[i] !== config.pitch_offsets[i]) {
        offsetsMatch = false
        break
      }
    }
    if (offsetsMatch) return key
  }
  return null
}

export function applyPatternPreset(
  config: PatternConfig,
  key: PatternPresetKey,
): PatternConfig {
  const preset = PATTERN_PRESETS[key]
  return {
    ...config,
    steps: preset.steps,
    interval_ms: preset.interval_ms,
    pitch_offsets: [...preset.pitch_offsets],
    volume_decay: preset.volume_decay,
    direction: preset.direction,
  }
}
