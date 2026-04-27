import type { Stack, StackLayer } from './types'
import { newLayerId } from './types'
import type { SoundSpec } from '../spec'
import type { PatternConfig } from '../dsp/pattern/types'

export function addLayer(
  stack: Stack,
  ref: string | SoundSpec,
  partial: Partial<Omit<StackLayer, 'id' | 'ref'>> = {},
): Stack {
  const layer: StackLayer = {
    id: newLayerId(),
    ref,
    offset_ms: partial.offset_ms ?? defaultOffset(stack),
    gain: partial.gain ?? 1.0,
    mute: partial.mute ?? false,
    ...(partial.pattern ? { pattern: partial.pattern } : {}),
  }
  return { ...stack, layers: [...stack.layers, layer] }
}

function defaultOffset(stack: Stack): number {
  // Stagger by 50ms after the last layer's start for a sensible default
  // (per spec). If empty, start at 0.
  if (stack.layers.length === 0) return 0
  const last = stack.layers[stack.layers.length - 1]
  return last.offset_ms + 50
}

export function removeLayer(stack: Stack, layerId: string): Stack {
  return {
    ...stack,
    layers: stack.layers.filter((l) => l.id !== layerId),
  }
}

export function updateLayer(
  stack: Stack,
  layerId: string,
  patch: Partial<StackLayer>,
): Stack {
  return {
    ...stack,
    layers: stack.layers.map((l) =>
      l.id === layerId ? { ...l, ...patch } : l,
    ),
  }
}

export function setLayerOffset(
  stack: Stack,
  layerId: string,
  offsetMs: number,
): Stack {
  return updateLayer(stack, layerId, { offset_ms: Math.round(offsetMs) })
}

export function setLayerGain(
  stack: Stack,
  layerId: string,
  gain: number,
): Stack {
  const clamped = Math.max(0, Math.min(1, gain))
  return updateLayer(stack, layerId, {
    gain: Math.round(clamped * 100) / 100,
  })
}

export function toggleMute(stack: Stack, layerId: string): Stack {
  const l = stack.layers.find((l) => l.id === layerId)
  if (!l) return stack
  return updateLayer(stack, layerId, { mute: !l.mute })
}

export function toggleSolo(stack: Stack, layerId: string): Stack {
  const l = stack.layers.find((l) => l.id === layerId)
  if (!l) return stack
  return updateLayer(stack, layerId, { solo: !l.solo })
}

export function clearAllSolos(stack: Stack): Stack {
  return {
    ...stack,
    layers: stack.layers.map((l) => ({ ...l, solo: false })),
  }
}

// True when any layer in the stack is solo'd. Used by playback logic.
export function anyLayerSoloed(stack: Stack): boolean {
  return stack.layers.some((l) => l.solo === true)
}

export function isLayerAudible(stack: Stack, layer: StackLayer): boolean {
  if (anyLayerSoloed(stack)) return layer.solo === true
  return !layer.mute
}

export function setLayerPattern(
  stack: Stack,
  layerId: string,
  pattern: PatternConfig | undefined,
): Stack {
  return {
    ...stack,
    layers: stack.layers.map((l) => {
      if (l.id !== layerId) return l
      if (pattern === undefined) {
        const { pattern: _drop, ...rest } = l
        return rest as StackLayer
      }
      return { ...l, pattern }
    }),
  }
}

export function setLayerDuration(
  stack: Stack,
  layerId: string,
  durationMs: number | undefined,
): Stack {
  return {
    ...stack,
    layers: stack.layers.map((l) => {
      if (l.id !== layerId) return l
      if (durationMs === undefined) {
        const { duration_ms: _drop, ...rest } = l
        return rest as StackLayer
      }
      return { ...l, duration_ms: Math.max(100, Math.round(durationMs)) }
    }),
  }
}

export function setStackPattern(
  stack: Stack,
  pattern: PatternConfig | undefined,
): Stack {
  if (pattern === undefined) {
    const { pattern: _drop, ...rest } = stack
    return rest as Stack
  }
  return { ...stack, pattern }
}
