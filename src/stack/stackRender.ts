import { applyPattern } from '../dsp/pattern/applyPattern'
import { renderAtmosphericOffline } from '../dsp/atmospheric/offline'
import { removeDCOffset } from '../dsp/envelope'
import { renderFm } from '../dsp/fm/render'
import { renderPercussive } from '../dsp/render'
import { renderTonal } from '../dsp/tonal/render'
import { SAMPLE_RATE } from '../dsp/types'
import type { LibraryEntry } from '../library/types'
import type { SoundSpec } from '../spec'
import type { Stack, StackLayer } from './types'
import { anyLayerSoloed } from './operations'

const DEFAULT_ATMO_LAYER_DURATION_MS = 5000

// Resolve a layer's source to a concrete SoundSpec. Layers reference library
// entries by ID (compact mode) or carry inline SoundSpecs (flattened mode).
function resolveLayerSource(
  layer: StackLayer,
  library: LibraryEntry[],
): SoundSpec | null {
  if (typeof layer.ref === 'string') {
    const entry = library.find((e) => e.id === layer.ref)
    if (!entry) return null
    if (entry.spec.kind !== 'sound') return null
    return entry.spec
  }
  return layer.ref
}

async function renderSound(
  spec: SoundSpec,
  durationMs: number,
): Promise<AudioBuffer> {
  if (spec.mode === 'percussive') return renderPercussive(spec.params)
  if (spec.mode === 'tonal') return renderTonal(spec.params)
  if (spec.mode === 'fm') return renderFm(spec.params)
  // Atmospheric: bounded render at the layer's duration_ms (or fallback default).
  return renderAtmosphericOffline(spec.params, durationMs / 1000)
}

/* Default atmospheric layer duration: longest non-atmospheric layer in the
 * stack (so the atmo bed naturally covers the rest), or 5s if all layers are
 * atmospheric / stack is empty. Per v3 spec phase 5. */
function defaultAtmoDurationMs(
  stack: Stack,
  library: LibraryEntry[],
): number {
  let maxNonAtmo = 0
  for (const layer of stack.layers) {
    const src = resolveLayerSource(layer, library)
    if (!src || src.mode === 'atmospheric') continue
    const dur = estimateSpecDurationMs(src)
    if (dur > maxNonAtmo) maxNonAtmo = dur
  }
  return maxNonAtmo > 0 ? maxNonAtmo : DEFAULT_ATMO_LAYER_DURATION_MS
}

function createSilentBuffer(
  ctx: BaseAudioContext,
  samples: number,
): AudioBuffer {
  const buf = ctx.createBuffer(1, samples, SAMPLE_RATE)
  return buf
}

// Renders the stack into a mixed AudioBuffer per spec:
// 1. Apply mute/solo to determine playable layers
// 2. Render each layer (synthesis + per-layer pattern)
// 3. Mix layers at their offsets, normalizing earliest start to sample 0
// 4. Apply stack-level pattern if any
// 5. DC removal
export async function renderStack(
  stack: Stack,
  library: LibraryEntry[],
  audioContext: BaseAudioContext,
): Promise<AudioBuffer> {
  const soloed = anyLayerSoloed(stack)
  const playableLayers = stack.layers.filter((l) => {
    if (soloed) return l.solo === true
    return !l.mute
  })

  if (playableLayers.length === 0) {
    return createSilentBuffer(audioContext, Math.ceil(0.1 * SAMPLE_RATE))
  }

  // Render each layer (synthesis + per-layer pattern). Atmospheric layers use
  // the layer's duration_ms (or computed default). Pattern is intentionally
  // skipped for atmospheric since "trigger N times" doesn't apply to a
  // continuous bed.
  const atmoDefaultMs = defaultAtmoDurationMs(stack, library)
  const layerRenders = await Promise.all(
    playableLayers.map(async (layer) => {
      const source = resolveLayerSource(layer, library)
      if (!source) return null
      const durationMs =
        source.mode === 'atmospheric'
          ? layer.duration_ms ?? atmoDefaultMs
          : 0
      const sourceBuf = await renderSound(source, durationMs)
      const patterned =
        layer.pattern && source.mode !== 'atmospheric'
          ? applyPattern(sourceBuf, layer.pattern, audioContext)
          : sourceBuf
      return {
        data: patterned.getChannelData(0),
        offset_ms: layer.offset_ms,
        gain: layer.gain,
      }
    }),
  )

  const valid = layerRenders.filter(
    (r): r is NonNullable<typeof r> => r !== null,
  )
  if (valid.length === 0) {
    return createSilentBuffer(audioContext, Math.ceil(0.1 * SAMPLE_RATE))
  }

  const earliestStartMs = Math.min(0, ...valid.map((l) => l.offset_ms))
  const latestEndMs = Math.max(
    ...valid.map(
      (l) => l.offset_ms + (l.data.length / SAMPLE_RATE) * 1000,
    ),
  )
  const totalDurationMs = latestEndMs - earliestStartMs
  const totalSamples = Math.ceil((totalDurationMs / 1000) * SAMPLE_RATE)

  const output = new Float32Array(totalSamples)
  for (const layer of valid) {
    const offsetSamples = Math.round(
      ((layer.offset_ms - earliestStartMs) / 1000) * SAMPLE_RATE,
    )
    for (
      let i = 0;
      i < layer.data.length && offsetSamples + i < totalSamples;
      i++
    ) {
      output[offsetSamples + i] += layer.data[i] * layer.gain
    }
  }

  removeDCOffset(output, SAMPLE_RATE)

  const result = audioContext.createBuffer(1, totalSamples, SAMPLE_RATE)
  result.copyToChannel(output, 0)

  // Stack-level pattern operates on the mixed output
  if (stack.pattern) {
    return applyPattern(result, stack.pattern, audioContext)
  }
  return result
}

// Compute the timeline display range in milliseconds — used by the timeline
// region to decide its width and ruler tick spacing.
export function computeTimelineRange(
  stack: Stack,
  library: LibraryEntry[],
): { startMs: number; endMs: number } {
  if (stack.layers.length === 0) return { startMs: 0, endMs: 1000 }
  const atmoDefaultMs = defaultAtmoDurationMs(stack, library)
  let startMs = 0
  let endMs = 0
  for (const layer of stack.layers) {
    const source = resolveLayerSource(layer, library)
    if (!source) continue
    // Atmospheric layers honor the layer's duration_ms override; non-atmo
    // estimate from synthesis params.
    const durMs =
      source.mode === 'atmospheric'
        ? layer.duration_ms ?? atmoDefaultMs
        : estimateSpecDurationMs(source)
    if (layer.offset_ms < startMs) startMs = layer.offset_ms
    const layerEnd = layer.offset_ms + durMs
    if (layerEnd > endMs) endMs = layerEnd
  }
  return { startMs, endMs: Math.max(endMs, 200) }
}

function estimateSpecDurationMs(spec: SoundSpec): number {
  if (spec.mode === 'percussive') {
    return spec.params.decay_ms + 50
  }
  if (spec.mode === 'tonal' || spec.mode === 'fm') {
    const p = spec.params
    return Math.min(
      4000,
      p.amp_attack_ms + p.amp_decay_ms + p.amp_release_ms + 50,
    )
  }
  // atmospheric — use the saved spec hint if any, else 5s.
  return spec.duration_ms ?? DEFAULT_ATMO_LAYER_DURATION_MS
}
