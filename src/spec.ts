import type {
  BodyWaveform,
  FilterType,
  LfoShape,
  LfoTarget,
  NoiseType,
  OscWaveform,
  PercussiveParams,
  TonalNoiseType,
  TonalParams,
} from './dsp/types'
import type {
  AtmosphericFilterType,
  AtmosphericNoiseType,
  AtmosphericOscWave,
  AtmosphericParams,
  LfoShape as AtmoLfoShape,
  ModulationTarget,
  SlowEnvShape,
  SlowEnvTarget,
} from './dsp/atmospheric/types'
import type {
  FmAlgorithm,
  FmLfoTarget,
  FmOperator,
  FmParams,
} from './dsp/fm/types'
import type {
  PatternConfig,
  PatternDirection,
} from './dsp/pattern/types'
import { PRESETS } from './presets'
import type { PresetKey } from './presets'
import { TONAL_PRESETS } from './presets-tonal'
import type { TonalPresetKey } from './presets-tonal'
import { FM_PRESETS } from './presets-fm'
import type { FmPresetKey } from './presets-fm'
import { ATMOSPHERIC_PRESETS } from './presets-atmospheric'
import type { AtmosphericPresetKey } from './presets-atmospheric'

export const SPEC_VERSION = '3.0'
export const TOOL_NAME = 'sfx-tool'
export const TOOL_VERSION = '3.0.0'

// v1 specs use "1.0" with no `kind` field. They auto-migrate to v2.0 on parse
// by adding kind: "sound" and bumping the version. Saving a migrated spec
// writes it in 2.0 format. v1 specs in the wild remain readable indefinitely.

export type PercussivePreset = PresetKey | 'custom'
export type TonalPreset = TonalPresetKey | 'custom'
export type FmPreset = FmPresetKey | 'custom'
export type AtmosphericPreset = AtmosphericPresetKey | 'custom'

export interface SpecMetadata {
  created?: string
  modified?: string
  tool?: string
  tool_version?: string
  name?: string
  tags?: string[]
  // Unknown metadata fields are preserved verbatim across round-trip.
  [key: string]: unknown
}

export interface PercussiveSpec {
  version: string
  kind: 'sound'
  mode: 'percussive'
  preset: PercussivePreset
  params: PercussiveParams
  pattern?: PatternConfig
  metadata?: SpecMetadata
}

export interface TonalSpec {
  version: string
  kind: 'sound'
  mode: 'tonal'
  preset: TonalPreset
  params: TonalParams
  pattern?: PatternConfig
  metadata?: SpecMetadata
}

export interface AtmosphericSpec {
  version: string
  kind: 'sound'
  mode: 'atmospheric'
  preset: AtmosphericPreset
  params: AtmosphericParams
  // Atmospheric sounds don't have pattern (continuous, not trigger-based).
  // Optional render-time hint for the export duration. v3.6 adds the export
  // dialog UI; v3.5 saves include the user's last-used default (5s).
  duration_ms?: number
  metadata?: SpecMetadata
}

export interface FmSpec {
  version: string
  kind: 'sound'
  mode: 'fm'
  preset: FmPreset
  params: FmParams
  metadata?: SpecMetadata
}

export type SoundSpec = PercussiveSpec | TonalSpec | FmSpec | AtmosphericSpec

// Stack spec: a composition of layers, each referring to a SoundSpec by ID
// (compact mode) or inline (flattened mode).
export interface StackLayerSerialized {
  ref: string | SoundSpec
  offset_ms: number
  gain: number
  mute: boolean
  pattern?: PatternConfig
  // Required for atmospheric layers (continuous source needs a bounded render
  // window). Ignored for percussive/tonal layers.
  duration_ms?: number
  // Note: `solo` is intentionally not serialized — transient authoring state.
}

export interface StackSpec {
  version: string
  kind: 'stack'
  layers: StackLayerSerialized[]
  pattern?: PatternConfig
  metadata?: SpecMetadata
}

export type Spec = SoundSpec | StackSpec

export interface SerializeOptions {
  preset: PercussivePreset
  params: PercussiveParams
  pattern?: PatternConfig
  name?: string
  created?: string
  modified?: string
  extraMetadata?: Record<string, unknown>
}

export interface SerializeTonalOptions {
  preset: TonalPreset
  params: TonalParams
  pattern?: PatternConfig
  name?: string
  created?: string
  modified?: string
  extraMetadata?: Record<string, unknown>
}

export interface SerializeFmOptions {
  preset: FmPreset
  params: FmParams
  name?: string
  created?: string
  modified?: string
  extraMetadata?: Record<string, unknown>
}

export interface SerializeAtmosphericOptions {
  preset: AtmosphericPreset
  params: AtmosphericParams
  duration_ms?: number
  name?: string
  created?: string
  modified?: string
  extraMetadata?: Record<string, unknown>
}

function buildMetadata(opts: {
  name?: string
  created?: string
  modified?: string
  extraMetadata?: Record<string, unknown>
}): SpecMetadata {
  return {
    tool: TOOL_NAME,
    tool_version: TOOL_VERSION,
    created: opts.created ?? new Date().toISOString(),
    ...(opts.modified !== undefined ? { modified: opts.modified } : {}),
    ...(opts.name !== undefined ? { name: opts.name } : {}),
    ...(opts.extraMetadata ?? {}),
  }
}

export function serializePercussiveSpec(
  opts: SerializeOptions,
): PercussiveSpec {
  return {
    version: SPEC_VERSION,
    kind: 'sound',
    mode: 'percussive',
    preset: opts.preset,
    params: { ...opts.params },
    ...(opts.pattern ? { pattern: clonePattern(opts.pattern) } : {}),
    metadata: buildMetadata(opts),
  }
}

export function serializeTonalSpec(
  opts: SerializeTonalOptions,
): TonalSpec {
  return {
    version: SPEC_VERSION,
    kind: 'sound',
    mode: 'tonal',
    preset: opts.preset,
    params: { ...opts.params },
    ...(opts.pattern ? { pattern: clonePattern(opts.pattern) } : {}),
    metadata: buildMetadata(opts),
  }
}

export function serializeFmSpec(opts: SerializeFmOptions): FmSpec {
  return {
    version: SPEC_VERSION,
    kind: 'sound',
    mode: 'fm',
    preset: opts.preset,
    params: cloneFmParams(opts.params),
    metadata: buildMetadata(opts),
  }
}

function cloneFmParams(p: FmParams): FmParams {
  return {
    ...p,
    op1: { ...p.op1 },
    op2: { ...p.op2 },
    op3: { ...p.op3 },
    op4: { ...p.op4 },
  }
}

export function serializeAtmosphericSpec(
  opts: SerializeAtmosphericOptions,
): AtmosphericSpec {
  return {
    version: SPEC_VERSION,
    kind: 'sound',
    mode: 'atmospheric',
    preset: opts.preset,
    params: { ...opts.params },
    ...(opts.duration_ms !== undefined ? { duration_ms: opts.duration_ms } : {}),
    metadata: buildMetadata(opts),
  }
}

function clonePattern(p: PatternConfig): PatternConfig {
  return { ...p, pitch_offsets: [...p.pitch_offsets] }
}

export interface ParseResult<S = SoundSpec> {
  spec: S
  warnings: string[]
}

export class SpecParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SpecParseError'
  }
}

// Per spec: strict about structure (modes, types, required fields), permissive
// about values (clamp, default, warn). Errors surface a SpecParseError;
// warnings collect non-fatal issues.
//
// Dispatches by `kind` (v2.0) or by `mode` (v1.0 — auto-migrated). For v1
// specs (no `kind` field, version starts with "1."), kind is implicit "sound".
export function parseSpec(input: unknown): ParseResult<Spec> {
  if (!isObject(input)) {
    throw new SpecParseError('Spec must be a JSON object')
  }
  if (typeof input.version !== 'string') {
    throw new SpecParseError('Missing or invalid `version`')
  }

  // v1 backward-compat: missing `kind` is allowed if version starts with "1."
  let kind = input.kind
  if (kind === undefined) {
    if (!input.version.startsWith('1.')) {
      throw new SpecParseError('Missing `kind` (required for v2.0+ specs)')
    }
    kind = 'sound'
  }

  if (kind === 'sound') return parseSoundSpec(input) as ParseResult<Spec>
  if (kind === 'stack') return parseStackSpec(input) as ParseResult<Spec>
  throw new SpecParseError(
    `Kind "${String(kind)}" not supported in this version`,
  )
}

// Backward-compat alias for callers that only handled sounds in phase 4.
export function parseSoundSpec(input: unknown): ParseResult<SoundSpec> {
  if (!isObject(input)) {
    throw new SpecParseError('Spec must be a JSON object')
  }
  if (typeof input.version !== 'string') {
    throw new SpecParseError('Missing or invalid `version`')
  }
  if (input.kind !== undefined && input.kind !== 'sound') {
    throw new SpecParseError(
      `Expected kind "sound", got "${String(input.kind)}"`,
    )
  }
  if (typeof input.mode !== 'string') {
    throw new SpecParseError('Missing or invalid `mode`')
  }
  if (input.mode === 'percussive') {
    return parsePercussiveSpec(input) as ParseResult<SoundSpec>
  }
  if (input.mode === 'tonal') {
    return parseTonalSpec(input) as ParseResult<SoundSpec>
  }
  if (input.mode === 'fm') {
    return parseFmSpec(input) as ParseResult<SoundSpec>
  }
  if (input.mode === 'atmospheric') {
    return parseAtmosphericSpec(input) as ParseResult<SoundSpec>
  }
  throw new SpecParseError(
    `Mode "${String(input.mode)}" not supported in this version`,
  )
}

export function parseStackSpec(input: unknown): ParseResult<StackSpec> {
  const warnings: string[] = []
  if (!isObject(input)) throw new SpecParseError('Stack spec must be an object')
  if (typeof input.version !== 'string') {
    throw new SpecParseError('Missing or invalid `version`')
  }
  if (input.kind !== 'stack') {
    throw new SpecParseError(`Expected kind "stack", got "${String(input.kind)}"`)
  }

  const layersRaw = Array.isArray(input.layers) ? input.layers : []
  const layers: StackLayerSerialized[] = []
  for (const raw of layersRaw) {
    if (!isObject(raw)) {
      warnings.push('Layer is not an object — skipped')
      continue
    }
    let ref: string | SoundSpec
    if (typeof raw.ref === 'string') {
      ref = raw.ref
    } else if (isObject(raw.ref)) {
      try {
        ref = parseSoundSpec(raw.ref).spec
      } catch (err) {
        const msg = err instanceof SpecParseError ? err.message : String(err)
        warnings.push(`Layer ref failed to parse: ${msg} — skipped`)
        continue
      }
    } else {
      warnings.push('Layer missing valid `ref` — skipped')
      continue
    }
    const offset_ms =
      typeof raw.offset_ms === 'number' && Number.isFinite(raw.offset_ms)
        ? Math.round(raw.offset_ms)
        : 0
    const gain =
      typeof raw.gain === 'number' && Number.isFinite(raw.gain)
        ? Math.max(0, Math.min(1, raw.gain))
        : 1
    const mute = typeof raw.mute === 'boolean' ? raw.mute : false
    const pattern = parsePatternIfPresent(raw.pattern, warnings)
    const duration_ms =
      typeof raw.duration_ms === 'number' && Number.isFinite(raw.duration_ms)
        ? Math.max(100, Math.min(300_000, Math.round(raw.duration_ms)))
        : undefined
    layers.push({
      ref,
      offset_ms,
      gain,
      mute,
      ...(pattern ? { pattern } : {}),
      ...(duration_ms !== undefined ? { duration_ms } : {}),
    })
  }

  if (layers.length === 0) {
    throw new SpecParseError('Stack has no valid layers')
  }

  let metadata: SpecMetadata | undefined
  if (input.metadata !== undefined) {
    if (isObject(input.metadata)) {
      metadata = { ...input.metadata } as SpecMetadata
    } else {
      warnings.push('`metadata` is not an object — ignored')
    }
  }

  const stackPattern = parsePatternIfPresent(input.pattern, warnings)

  return {
    spec: {
      version: SPEC_VERSION,
      kind: 'stack',
      layers,
      ...(stackPattern ? { pattern: stackPattern } : {}),
      metadata,
    },
    warnings,
  }
}

export interface SerializeStackOptions {
  layers: StackLayerSerialized[]
  pattern?: PatternConfig
  name?: string
  created?: string
  modified?: string
  extraMetadata?: Record<string, unknown>
}

export function serializeStackSpec(opts: SerializeStackOptions): StackSpec {
  return {
    version: SPEC_VERSION,
    kind: 'stack',
    layers: opts.layers.map((l) => ({
      ref: typeof l.ref === 'string' ? l.ref : { ...l.ref },
      offset_ms: l.offset_ms,
      gain: l.gain,
      mute: l.mute,
      ...(l.pattern ? { pattern: clonePattern(l.pattern) } : {}),
      ...(l.duration_ms !== undefined ? { duration_ms: l.duration_ms } : {}),
    })),
    ...(opts.pattern ? { pattern: clonePattern(opts.pattern) } : {}),
    metadata: buildMetadata(opts),
  }
}

export function parsePercussiveSpec(
  input: unknown,
): ParseResult<PercussiveSpec> {
  const warnings: string[] = []

  if (!isObject(input)) {
    throw new SpecParseError('Spec must be a JSON object')
  }
  if (typeof input.version !== 'string') {
    throw new SpecParseError('Missing or invalid `version`')
  }
  if (input.mode !== 'percussive') {
    throw new SpecParseError(
      `Expected mode "percussive", got "${String(input.mode)}"`,
    )
  }
  if (!isObject(input.params)) {
    throw new SpecParseError('Missing `params`')
  }

  const knownPresets = new Set<PercussivePreset>([
    ...(Object.keys(PRESETS) as PresetKey[]),
    'custom',
  ])
  let preset: PercussivePreset = 'custom'
  if (typeof input.preset === 'string') {
    if (knownPresets.has(input.preset as PercussivePreset)) {
      preset = input.preset as PercussivePreset
    } else {
      warnings.push(
        `Unknown preset "${input.preset}" — treating as "custom"`,
      )
    }
  } else {
    warnings.push('Missing `preset` — treating as "custom"')
  }

  const baseline =
    preset === 'custom' ? PRESETS.click.defaults : PRESETS[preset].defaults

  const params = parsePercussiveParams(input.params, baseline, warnings)

  let metadata: SpecMetadata | undefined
  if (input.metadata !== undefined) {
    if (isObject(input.metadata)) {
      metadata = { ...input.metadata } as SpecMetadata
    } else {
      warnings.push('`metadata` is not an object — ignored')
    }
  }

  const pattern = parsePatternIfPresent(input.pattern, warnings)

  // Auto-migrate to 2.0 on read (kind: "sound", version bumped). v1 specs
  // are preserved in spirit (same params, same preset) but normalized to
  // current schema shape.
  if (input.version.startsWith('1.')) {
    warnings.push(
      `Auto-migrated spec from version ${input.version} to ${SPEC_VERSION}`,
    )
  }

  return {
    spec: {
      version: SPEC_VERSION,
      kind: 'sound',
      mode: 'percussive',
      preset,
      params,
      ...(pattern ? { pattern } : {}),
      metadata,
    },
    warnings,
  }
}

export function parseTonalSpec(input: unknown): ParseResult<TonalSpec> {
  const warnings: string[] = []

  if (!isObject(input)) {
    throw new SpecParseError('Spec must be a JSON object')
  }
  if (typeof input.version !== 'string') {
    throw new SpecParseError('Missing or invalid `version`')
  }
  if (input.mode !== 'tonal') {
    throw new SpecParseError(
      `Expected mode "tonal", got "${String(input.mode)}"`,
    )
  }
  if (!isObject(input.params)) {
    throw new SpecParseError('Missing `params`')
  }

  const knownTonalPresets = new Set<TonalPreset>([
    ...(Object.keys(TONAL_PRESETS) as TonalPresetKey[]),
    'custom',
  ])
  let preset: TonalPreset = 'custom'
  if (typeof input.preset === 'string') {
    if (knownTonalPresets.has(input.preset as TonalPreset)) {
      preset = input.preset as TonalPreset
    } else {
      warnings.push(
        `Unknown tonal preset "${input.preset}" — treating as "custom"`,
      )
    }
  } else {
    warnings.push('Missing `preset` — treating as "custom"')
  }

  const baseline =
    preset === 'custom'
      ? TONAL_PRESETS.beep.defaults
      : TONAL_PRESETS[preset].defaults

  const params = parseTonalParams(input.params, baseline, warnings)

  let metadata: SpecMetadata | undefined
  if (input.metadata !== undefined) {
    if (isObject(input.metadata)) {
      metadata = { ...input.metadata } as SpecMetadata
    } else {
      warnings.push('`metadata` is not an object — ignored')
    }
  }

  const pattern = parsePatternIfPresent(input.pattern, warnings)

  if (input.version.startsWith('1.')) {
    warnings.push(
      `Auto-migrated spec from version ${input.version} to ${SPEC_VERSION}`,
    )
  }

  return {
    spec: {
      version: SPEC_VERSION,
      kind: 'sound',
      mode: 'tonal',
      preset,
      params,
      ...(pattern ? { pattern } : {}),
      metadata,
    },
    warnings,
  }
}

// ----- FM spec parsing -----

const FM_LFO_SHAPES = new Set<LfoShape>(['sine', 'triangle', 'square'])
const FM_LFO_TARGETS = new Set<FmLfoTarget>([
  'off',
  'pitch',
  'amp',
  'fm',
  'filter',
])
const FM_FILTER_VALUES = new Set<FilterType>([
  'highpass',
  'bandpass',
  'lowpass',
])
const FM_ALGORITHMS = new Set<FmAlgorithm>([1, 2, 3, 4, 5, 6, 7, 8])

const FM_TOP_NUMERIC_RANGES: Record<
  Exclude<
    keyof FmParams,
    'op1' | 'op2' | 'op3' | 'op4' | 'algorithm' | 'filter_type' | 'lfo_shape' | 'lfo_target'
  >,
  [number, number]
> = {
  base_pitch_semitones: [-48, 48],
  fm_amount: [0, 50],
  feedback: [0, 2],
  filter_freq_hz: [20, 22050],
  filter_q: [0.1, 100],
  amp_attack_ms: [0, 5000],
  amp_decay_ms: [0, 5000],
  amp_sustain: [0, 2],
  amp_release_ms: [0, 5000],
  pitch_env_amount_oct: [-4, 4],
  pitch_env_attack_ms: [0, 2000],
  pitch_env_decay_ms: [0, 5000],
  lfo_rate_hz: [0.01, 50],
  lfo_depth: [0, 2],
  gain: [0, 4],
}

const FM_OP_NUMERIC_RANGES: Record<
  Exclude<keyof FmOperator, 'fixed'>,
  [number, number]
> = {
  ratio: [0.01, 64],
  fixed_freq_hz: [0.1, 22050],
  detune_cents: [-1200, 1200],
  level: [0, 4],
  env_attack_ms: [0, 10000],
  env_decay_ms: [0, 10000],
  env_sustain: [0, 2],
  env_release_ms: [0, 10000],
}

function parseFmOperator(
  raw: unknown,
  baseline: FmOperator,
  warnings: string[],
  label: string,
): FmOperator {
  if (!isObject(raw)) {
    warnings.push(`\`${label}\` missing or not an object — using preset default`)
    return { ...baseline }
  }
  const out: FmOperator = { ...baseline }
  out.fixed = typeof raw.fixed === 'boolean' ? raw.fixed : baseline.fixed

  for (const [key, [min, max]] of Object.entries(FM_OP_NUMERIC_RANGES)) {
    const k = key as keyof typeof FM_OP_NUMERIC_RANGES
    const v = raw[k]
    if (v === undefined) {
      warnings.push(
        `Missing \`${label}.${k}\` — using preset default ${baseline[k]}`,
      )
      continue
    }
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      warnings.push(
        `Field \`${label}.${k}\` is not a finite number — using preset default ${baseline[k]}`,
      )
      continue
    }
    if (v < min || v > max) {
      const clamped = Math.max(min, Math.min(max, v))
      warnings.push(
        `\`${label}.${k}\` value ${v} out of range [${min}, ${max}] — clamped to ${clamped}`,
      )
      out[k] = clamped
    } else {
      out[k] = v
    }
  }
  return out
}

function parseFmParams(
  raw: Record<string, unknown>,
  baseline: FmParams,
  warnings: string[],
): FmParams {
  const out: FmParams = {
    ...baseline,
    op1: { ...baseline.op1 },
    op2: { ...baseline.op2 },
    op3: { ...baseline.op3 },
    op4: { ...baseline.op4 },
  }

  out.filter_type = parseEnumField(
    raw,
    'filter_type',
    FM_FILTER_VALUES,
    baseline.filter_type,
    warnings,
  )
  out.lfo_shape = parseEnumField(
    raw,
    'lfo_shape',
    FM_LFO_SHAPES,
    baseline.lfo_shape,
    warnings,
  )
  out.lfo_target = parseEnumField(
    raw,
    'lfo_target',
    FM_LFO_TARGETS,
    baseline.lfo_target,
    warnings,
  )

  if (typeof raw.algorithm === 'number' && FM_ALGORITHMS.has(raw.algorithm as FmAlgorithm)) {
    out.algorithm = raw.algorithm as FmAlgorithm
  } else {
    warnings.push(
      `Missing or invalid \`algorithm\` — using preset default ${baseline.algorithm}`,
    )
  }

  for (const [key, [min, max]] of Object.entries(FM_TOP_NUMERIC_RANGES)) {
    const k = key as keyof typeof FM_TOP_NUMERIC_RANGES
    const v = raw[k]
    if (v === undefined) {
      warnings.push(`Missing \`${k}\` — using preset default ${baseline[k]}`)
      continue
    }
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      warnings.push(
        `Field \`${k}\` is not a finite number — using preset default ${baseline[k]}`,
      )
      continue
    }
    if (v < min || v > max) {
      const clamped = Math.max(min, Math.min(max, v))
      warnings.push(
        `\`${k}\` value ${v} out of range [${min}, ${max}] — clamped to ${clamped}`,
      )
      out[k] = clamped
    } else {
      out[k] = v
    }
  }

  out.op1 = parseFmOperator(raw.op1, baseline.op1, warnings, 'op1')
  out.op2 = parseFmOperator(raw.op2, baseline.op2, warnings, 'op2')
  out.op3 = parseFmOperator(raw.op3, baseline.op3, warnings, 'op3')
  out.op4 = parseFmOperator(raw.op4, baseline.op4, warnings, 'op4')

  const known = new Set<string>([
    'algorithm',
    'op1',
    'op2',
    'op3',
    'op4',
    'filter_type',
    'lfo_shape',
    'lfo_target',
    ...Object.keys(FM_TOP_NUMERIC_RANGES),
  ])
  for (const k of Object.keys(raw)) {
    if (!known.has(k)) warnings.push(`Unknown params field "${k}" — ignored`)
  }

  return out
}

export function parseFmSpec(input: unknown): ParseResult<FmSpec> {
  const warnings: string[] = []

  if (!isObject(input)) {
    throw new SpecParseError('Spec must be a JSON object')
  }
  if (typeof input.version !== 'string') {
    throw new SpecParseError('Missing or invalid `version`')
  }
  if (input.mode !== 'fm') {
    throw new SpecParseError(
      `Expected mode "fm", got "${String(input.mode)}"`,
    )
  }
  if (!isObject(input.params)) {
    throw new SpecParseError('Missing `params`')
  }

  const knownPresets = new Set<FmPreset>([
    ...(Object.keys(FM_PRESETS) as FmPresetKey[]),
    'custom',
  ])
  let preset: FmPreset = 'custom'
  if (typeof input.preset === 'string') {
    if (knownPresets.has(input.preset as FmPreset)) {
      preset = input.preset as FmPreset
    } else {
      warnings.push(
        `Unknown FM preset "${input.preset}" — treating as "custom"`,
      )
    }
  } else {
    warnings.push('Missing `preset` — treating as "custom"')
  }

  const baseline =
    preset === 'custom' ? FM_PRESETS.bell.defaults : FM_PRESETS[preset].defaults

  const params = parseFmParams(input.params, baseline, warnings)

  let metadata: SpecMetadata | undefined
  if (input.metadata !== undefined) {
    if (isObject(input.metadata)) {
      metadata = { ...input.metadata } as SpecMetadata
    } else {
      warnings.push('`metadata` is not an object — ignored')
    }
  }

  return {
    spec: {
      version: SPEC_VERSION,
      kind: 'sound',
      mode: 'fm',
      preset,
      params,
      metadata,
    },
    warnings,
  }
}

const VALID_DIRECTIONS = new Set<PatternDirection>([
  'forward',
  'reverse',
  'ping-pong',
])

function parsePatternIfPresent(
  raw: unknown,
  warnings: string[],
): PatternConfig | undefined {
  if (raw === undefined) return undefined
  if (!isObject(raw)) {
    warnings.push('`pattern` is not an object — ignored')
    return undefined
  }
  const enabled = typeof raw.enabled === 'boolean' ? raw.enabled : false
  let steps =
    typeof raw.steps === 'number' && Number.isFinite(raw.steps)
      ? Math.max(1, Math.min(8, Math.round(raw.steps)))
      : 1
  const interval_ms =
    typeof raw.interval_ms === 'number' && Number.isFinite(raw.interval_ms)
      ? Math.max(5, Math.min(2000, raw.interval_ms))
      : 110
  const volume_decay =
    typeof raw.volume_decay === 'number' &&
    Number.isFinite(raw.volume_decay)
      ? Math.max(0, Math.min(1, raw.volume_decay))
      : 1
  const direction =
    typeof raw.direction === 'string' &&
    VALID_DIRECTIONS.has(raw.direction as PatternDirection)
      ? (raw.direction as PatternDirection)
      : 'forward'

  let pitch_offsets: number[]
  if (Array.isArray(raw.pitch_offsets)) {
    pitch_offsets = raw.pitch_offsets
      .slice(0, steps)
      .map((v) =>
        typeof v === 'number' && Number.isFinite(v)
          ? Math.max(-48, Math.min(48, Math.round(v)))
          : 0,
      )
    while (pitch_offsets.length < steps) pitch_offsets.push(0)
  } else {
    warnings.push('`pattern.pitch_offsets` missing or invalid — defaulted to 0s')
    pitch_offsets = new Array(steps).fill(0)
  }

  return { enabled, steps, interval_ms, pitch_offsets, volume_decay, direction }
}

const NOISE_VALUES = new Set<NoiseType>(['white', 'pink', 'brown'])
const FILTER_VALUES = new Set<FilterType>(['highpass', 'bandpass', 'lowpass'])
const WAVEFORM_VALUES = new Set<BodyWaveform>(['sine', 'triangle'])

const NUMERIC_RANGES: Record<
  Exclude<
    keyof PercussiveParams,
    'noise_type' | 'filter_type' | 'body_waveform'
  >,
  [number, number]
> = {
  // These are the spec's documented numeric ranges. Validation clamps + warns.
  impulse_duration_ms: [1, 50],
  filter_freq_hz: [200, 12000],
  filter_q: [0.5, 20],
  body_amount: [0, 1],
  body_freq_hz: [100, 2000],
  body_decay_ms: [5, 60],
  decay_ms: [20, 200],
  decay_curve: [0, 1],
  gain: [0, 1],
}

function parsePercussiveParams(
  raw: Record<string, unknown>,
  baseline: PercussiveParams,
  warnings: string[],
): PercussiveParams {
  const out: PercussiveParams = { ...baseline }

  // Categoricals
  out.noise_type = parseEnumField(
    raw,
    'noise_type',
    NOISE_VALUES,
    baseline.noise_type,
    warnings,
  )
  out.filter_type = parseEnumField(
    raw,
    'filter_type',
    FILTER_VALUES,
    baseline.filter_type,
    warnings,
  )
  out.body_waveform = parseEnumField(
    raw,
    'body_waveform',
    WAVEFORM_VALUES,
    baseline.body_waveform,
    warnings,
  )

  // Numerics — clamp out-of-range to spec's documented bounds, with warning.
  for (const [key, [min, max]] of Object.entries(NUMERIC_RANGES)) {
    const k = key as keyof typeof NUMERIC_RANGES
    const v = raw[k]
    if (v === undefined) {
      warnings.push(`Missing \`${k}\` — using preset default ${baseline[k]}`)
      continue
    }
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      warnings.push(
        `Field \`${k}\` is not a finite number — using preset default ${baseline[k]}`,
      )
      continue
    }
    if (v < min || v > max) {
      const clamped = Math.max(min, Math.min(max, v))
      warnings.push(
        `\`${k}\` value ${v} out of range [${min}, ${max}] — clamped to ${clamped}`,
      )
      out[k] = clamped
    } else {
      out[k] = v
    }
  }

  // Forward-compatibility: warn on unknown fields, don't reject.
  const known = new Set<string>([
    'noise_type',
    'filter_type',
    'body_waveform',
    ...Object.keys(NUMERIC_RANGES),
  ])
  for (const k of Object.keys(raw)) {
    if (!known.has(k)) warnings.push(`Unknown params field "${k}" — ignored`)
  }

  return out
}

// ----- Tonal params parsing -----

const TONAL_NOISE_VALUES = new Set<TonalNoiseType>([
  'none',
  'white',
  'pink',
  'brown',
])
const OSC_WAVES = new Set<OscWaveform>(['sine', 'triangle', 'square', 'saw'])
const LFO_SHAPES = new Set<LfoShape>(['sine', 'triangle', 'square'])
const LFO_TARGETS = new Set<LfoTarget>(['off', 'pitch', 'filter', 'amp'])

const TONAL_NUMERIC_RANGES: Record<
  Exclude<
    keyof TonalParams,
    | 'osc_a_wave'
    | 'osc_b_wave'
    | 'noise_type'
    | 'filter_type'
    | 'lfo_shape'
    | 'lfo_target'
  >,
  [number, number]
> = {
  base_pitch_semitones: [-48, 48],
  osc_a_level: [0, 1],
  osc_b_level: [0, 1],
  osc_b_detune_cents: [0, 50],
  sub_amount: [0, 0.7],
  noise_amount: [0, 0.4],
  filter_freq_hz: [100, 16000],
  filter_q: [0.5, 20],
  filter_env_amount: [-1, 1],
  filter_env_attack_ms: [0, 500],
  filter_env_decay_ms: [5, 1000],
  amp_attack_ms: [0, 500],
  amp_decay_ms: [5, 1000],
  amp_sustain: [0, 1],
  amp_release_ms: [5, 2000],
  pitch_env_amount_oct: [-2, 2],
  pitch_env_attack_ms: [0, 500],
  pitch_env_decay_ms: [5, 1000],
  lfo_rate_hz: [0.1, 20],
  lfo_depth: [0, 1],
  gain: [0, 1],
}

function parseTonalParams(
  raw: Record<string, unknown>,
  baseline: TonalParams,
  warnings: string[],
): TonalParams {
  const out: TonalParams = { ...baseline }

  out.osc_a_wave = parseEnumField(
    raw,
    'osc_a_wave',
    OSC_WAVES,
    baseline.osc_a_wave,
    warnings,
  )
  out.osc_b_wave = parseEnumField(
    raw,
    'osc_b_wave',
    OSC_WAVES,
    baseline.osc_b_wave,
    warnings,
  )
  out.noise_type = parseEnumField(
    raw,
    'noise_type',
    TONAL_NOISE_VALUES,
    baseline.noise_type,
    warnings,
  )
  out.filter_type = parseEnumField(
    raw,
    'filter_type',
    new Set<FilterType>(['highpass', 'bandpass', 'lowpass']),
    baseline.filter_type,
    warnings,
  )
  out.lfo_shape = parseEnumField(
    raw,
    'lfo_shape',
    LFO_SHAPES,
    baseline.lfo_shape,
    warnings,
  )
  out.lfo_target = parseEnumField(
    raw,
    'lfo_target',
    LFO_TARGETS,
    baseline.lfo_target,
    warnings,
  )

  for (const [key, [min, max]] of Object.entries(TONAL_NUMERIC_RANGES)) {
    const k = key as keyof typeof TONAL_NUMERIC_RANGES
    const v = raw[k]
    if (v === undefined) {
      warnings.push(`Missing \`${k}\` — using preset default ${baseline[k]}`)
      continue
    }
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      warnings.push(
        `Field \`${k}\` is not a finite number — using preset default ${baseline[k]}`,
      )
      continue
    }
    if (v < min || v > max) {
      const clamped = Math.max(min, Math.min(max, v))
      warnings.push(
        `\`${k}\` value ${v} out of range [${min}, ${max}] — clamped to ${clamped}`,
      )
      out[k] = clamped
    } else {
      out[k] = v
    }
  }

  const known = new Set<string>([
    'osc_a_wave',
    'osc_b_wave',
    'noise_type',
    'filter_type',
    'lfo_shape',
    'lfo_target',
    ...Object.keys(TONAL_NUMERIC_RANGES),
  ])
  for (const k of Object.keys(raw)) {
    if (!known.has(k)) warnings.push(`Unknown params field "${k}" — ignored`)
  }

  return out
}

// ----- Atmospheric params parsing -----

const ATMO_NOISE_VALUES = new Set<AtmosphericNoiseType>([
  'white',
  'pink',
  'brown',
  'blue',
  'violet',
  'grey',
  'off',
])
const ATMO_OSC_WAVES = new Set<AtmosphericOscWave>(['sine', 'triangle'])
const ATMO_FILTER_VALUES = new Set<AtmosphericFilterType>([
  'highpass',
  'bandpass',
  'lowpass',
])
const SLOW_ENV_SHAPES = new Set<SlowEnvShape>([
  'ramp_up',
  'ramp_down',
  'hold_then_release',
  'attack_hold_release',
])
const SLOW_ENV_TARGETS = new Set<SlowEnvTarget>([
  'off',
  'amp',
  'filter_a_freq',
  'filter_b_freq',
])
const MOD_TARGETS = new Set<ModulationTarget>([
  'off',
  'amp',
  'pitch',
  'filter_a_freq',
  'filter_a_q',
  'filter_b_freq',
  'filter_b_q',
])
const ATMO_LFO_SHAPES = new Set<AtmoLfoShape>(['sine', 'triangle', 'square'])

const ATMO_NUMERIC_RANGES: Record<string, [number, number]> = {
  noise_amount: [0, 1],
  osc_a_level: [0, 1],
  osc_b_level: [0, 1],
  osc_b_detune_cents: [0, 1200],
  osc_c_level: [0, 1],
  osc_c_detune_cents: [0, 1200],
  base_pitch_semitones: [-48, 48],
  filter_a_freq_hz: [20, 22050],
  filter_a_q: [0.1, 100],
  filter_a_mix: [0, 1],
  filter_b_freq_hz: [20, 22050],
  filter_b_q: [0.1, 100],
  filter_b_mix: [0, 1],
  slow_env_duration_s: [0.5, 60],
  slow_env_amount: [-1, 1],
  rw1_rate_hz: [0.01, 50],
  rw1_depth: [0, 1],
  rw1_smoothing_ms: [10, 5000],
  rw2_rate_hz: [0.01, 50],
  rw2_depth: [0, 1],
  rw2_smoothing_ms: [10, 5000],
  lfo1_rate_hz: [0.01, 50],
  lfo1_depth: [0, 1],
  lfo1_phase_offset_deg: [0, 360],
  lfo2_rate_hz: [0.01, 50],
  lfo2_depth: [0, 1],
  lfo2_phase_offset_deg: [0, 360],
  gain: [0, 1],
}

export function parseAtmosphericSpec(
  input: unknown,
): ParseResult<AtmosphericSpec> {
  const warnings: string[] = []
  if (!isObject(input)) {
    throw new SpecParseError('Spec must be a JSON object')
  }
  if (typeof input.version !== 'string') {
    throw new SpecParseError('Missing or invalid `version`')
  }
  if (input.mode !== 'atmospheric') {
    throw new SpecParseError(
      `Expected mode "atmospheric", got "${String(input.mode)}"`,
    )
  }
  if (!isObject(input.params)) {
    throw new SpecParseError('Missing `params`')
  }

  const knownPresets = new Set<AtmosphericPreset>([
    ...(Object.keys(ATMOSPHERIC_PRESETS) as AtmosphericPresetKey[]),
    'custom',
  ])
  let preset: AtmosphericPreset = 'custom'
  if (typeof input.preset === 'string') {
    if (knownPresets.has(input.preset as AtmosphericPreset)) {
      preset = input.preset as AtmosphericPreset
    } else {
      warnings.push(
        `Unknown atmospheric preset "${input.preset}" — treating as "custom"`,
      )
    }
  } else {
    warnings.push('Missing `preset` — treating as "custom"')
  }

  const baseline =
    preset === 'custom'
      ? ATMOSPHERIC_PRESETS.wind.defaults
      : ATMOSPHERIC_PRESETS[preset].defaults

  const params: AtmosphericParams = { ...baseline }
  const raw = input.params

  // Categoricals
  params.noise_type = parseEnumField(
    raw,
    'noise_type',
    ATMO_NOISE_VALUES,
    baseline.noise_type,
    warnings,
  )
  params.osc_a_wave = parseEnumField(
    raw,
    'osc_a_wave',
    ATMO_OSC_WAVES,
    baseline.osc_a_wave,
    warnings,
  )
  params.osc_b_wave = parseEnumField(
    raw,
    'osc_b_wave',
    ATMO_OSC_WAVES,
    baseline.osc_b_wave,
    warnings,
  )
  params.osc_c_wave = parseEnumField(
    raw,
    'osc_c_wave',
    ATMO_OSC_WAVES,
    baseline.osc_c_wave,
    warnings,
  )
  params.filter_a_type = parseEnumField(
    raw,
    'filter_a_type',
    ATMO_FILTER_VALUES,
    baseline.filter_a_type,
    warnings,
  )
  params.filter_b_type = parseEnumField(
    raw,
    'filter_b_type',
    ATMO_FILTER_VALUES,
    baseline.filter_b_type,
    warnings,
  )
  params.slow_env_shape = parseEnumField(
    raw,
    'slow_env_shape',
    SLOW_ENV_SHAPES,
    baseline.slow_env_shape,
    warnings,
  )
  params.slow_env_target = parseEnumField(
    raw,
    'slow_env_target',
    SLOW_ENV_TARGETS,
    baseline.slow_env_target,
    warnings,
  )
  params.rw1_target = parseEnumField(
    raw,
    'rw1_target',
    MOD_TARGETS,
    baseline.rw1_target,
    warnings,
  )
  params.rw2_target = parseEnumField(
    raw,
    'rw2_target',
    MOD_TARGETS,
    baseline.rw2_target,
    warnings,
  )
  params.lfo1_shape = parseEnumField(
    raw,
    'lfo1_shape',
    ATMO_LFO_SHAPES,
    baseline.lfo1_shape,
    warnings,
  )
  params.lfo1_target = parseEnumField(
    raw,
    'lfo1_target',
    MOD_TARGETS,
    baseline.lfo1_target,
    warnings,
  )
  params.lfo2_shape = parseEnumField(
    raw,
    'lfo2_shape',
    ATMO_LFO_SHAPES,
    baseline.lfo2_shape,
    warnings,
  )
  params.lfo2_target = parseEnumField(
    raw,
    'lfo2_target',
    MOD_TARGETS,
    baseline.lfo2_target,
    warnings,
  )

  // osc_count: special — clamp to {0,1,2,3}
  if (typeof raw.osc_count === 'number' && Number.isFinite(raw.osc_count)) {
    const v = Math.max(0, Math.min(3, Math.round(raw.osc_count)))
    params.osc_count = v as 0 | 1 | 2 | 3
  } else {
    warnings.push(`Missing osc_count — using preset default ${baseline.osc_count}`)
  }

  // Numerics
  for (const [key, [min, max]] of Object.entries(ATMO_NUMERIC_RANGES)) {
    const v = raw[key]
    if (v === undefined) {
      warnings.push(
        `Missing \`${key}\` — using preset default ${(baseline as unknown as Record<string, unknown>)[key]}`,
      )
      continue
    }
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      warnings.push(`Field \`${key}\` is not a finite number — defaulted`)
      continue
    }
    const clamped = Math.max(min, Math.min(max, v))
    if (clamped !== v) {
      warnings.push(
        `\`${key}\` value ${v} out of range [${min}, ${max}] — clamped to ${clamped}`,
      )
    }
    ;(params as unknown as Record<string, number>)[key] = clamped
  }

  let metadata: SpecMetadata | undefined
  if (input.metadata !== undefined) {
    if (isObject(input.metadata)) {
      metadata = { ...input.metadata } as SpecMetadata
    } else {
      warnings.push('`metadata` is not an object — ignored')
    }
  }

  const duration_ms =
    typeof input.duration_ms === 'number' && Number.isFinite(input.duration_ms)
      ? Math.max(100, Math.min(300_000, Math.round(input.duration_ms)))
      : undefined

  return {
    spec: {
      version: SPEC_VERSION,
      kind: 'sound',
      mode: 'atmospheric',
      preset,
      params,
      ...(duration_ms !== undefined ? { duration_ms } : {}),
      metadata,
    },
    warnings,
  }
}

function parseEnumField<T extends string>(
  raw: Record<string, unknown>,
  key: string,
  allowed: Set<T>,
  fallback: T,
  warnings: string[],
): T {
  const v = raw[key]
  if (v === undefined) {
    warnings.push(`Missing \`${key}\` — using preset default "${fallback}"`)
    return fallback
  }
  if (typeof v !== 'string' || !allowed.has(v as T)) {
    warnings.push(
      `Field \`${key}\` value "${String(v)}" not recognized — using preset default "${fallback}"`,
    )
    return fallback
  }
  return v as T
}

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}
