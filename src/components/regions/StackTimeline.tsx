import { useEffect, useRef, useState } from 'react'
import {
  TimelineTrack,
  TIMELINE_TRACK_HEIGHT,
} from '../composite/TimelineTrack'
import { TimelineRuler } from '../composite/TimelineRuler'
import type { LibraryEntry } from '../../library/types'
import type { Stack } from '../../stack/types'
import { anyLayerSoloed } from '../../stack/operations'
import { computeTimelineRange } from '../../stack/stackRender'

const LABEL_LEFT_WIDTH = 180

interface StackTimelineProps {
  stack: Stack
  library: LibraryEntry[]
  selectedLayerId: string | null
  onSelectLayer: (layerId: string) => void
  onLayerOffsetChange: (layerId: string, offsetMs: number) => void
  onLayerGainChange: (layerId: string, gain: number) => void
  onAddLayerFromLibrary: (
    entryId: string,
    offsetMs: number,
  ) => void
  onToggleMute: (layerId: string) => void
  onToggleSolo: (layerId: string) => void
  height: number
}

export function StackTimeline({
  stack,
  library,
  selectedLayerId,
  onSelectLayer,
  onLayerOffsetChange,
  onLayerGainChange,
  onAddLayerFromLibrary,
  onToggleMute,
  onToggleSolo,
  height,
}: StackTimelineProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(800)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 800
      setWidth(Math.floor(w))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const range = computeTimelineRange(stack, library)
  // Padding so blocks aren't flush against the right edge
  const endMs = range.endMs + 50
  const startMs = range.startMs

  const soloed = anyLayerSoloed(stack)

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/x-library-entry')) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    const entryId = e.dataTransfer.getData('application/x-library-entry')
    if (!entryId) return
    e.preventDefault()
    // Translate drop X to ms
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) {
      onAddLayerFromLibrary(entryId, 0)
      return
    }
    const xInContent = e.clientX - rect.left - LABEL_LEFT_WIDTH
    const contentWidth = width - LABEL_LEFT_WIDTH
    const ratio = Math.max(0, Math.min(1, xInContent / contentWidth))
    const dropMs = startMs + ratio * (endMs - startMs)
    onAddLayerFromLibrary(entryId, Math.round(dropMs))
  }

  return (
    <div
      ref={containerRef}
      className="waveform-container"
      style={{
        height,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {stack.layers.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <div>
            <p
              className="term"
              style={{ fontSize: '14px', color: '#6fa180' }}
            >
              empty stack
            </p>
            <p
              className="term"
              style={{ fontSize: '13px', color: '#4a7a5a', marginTop: 4 }}
            >
              drag a sound from the library here to compose
            </p>
          </div>
        </div>
      ) : (
        <>
          <TimelineRuler
            startMs={startMs}
            endMs={endMs}
            width={width}
            labelLeftWidth={LABEL_LEFT_WIDTH}
          />
          <div className="flex-1 overflow-y-auto">
            {stack.layers.map((layer) => {
              const sourceEntry =
                typeof layer.ref === 'string'
                  ? library.find((e) => e.id === layer.ref) ?? null
                  : null
              const estDur = estimateLayerDuration(layer, sourceEntry)
              return (
                <TimelineTrack
                  key={layer.id}
                  layer={layer}
                  sourceEntry={sourceEntry}
                  estimatedDurationMs={estDur}
                  startMs={startMs}
                  endMs={endMs}
                  width={width}
                  labelLeftWidth={LABEL_LEFT_WIDTH}
                  selected={selectedLayerId === layer.id}
                  anySoloed={soloed}
                  onSelect={() => onSelectLayer(layer.id)}
                  onOffsetChange={(off) => onLayerOffsetChange(layer.id, off)}
                  onGainChange={(g) => onLayerGainChange(layer.id, g)}
                  onToggleMute={() => onToggleMute(layer.id)}
                  onToggleSolo={() => onToggleSolo(layer.id)}
                />
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function estimateLayerDuration(
  _layer: unknown,
  sourceEntry: LibraryEntry | null,
): number {
  if (!sourceEntry) return 200
  if (sourceEntry.spec.kind !== 'sound') return 200
  if (sourceEntry.waveformBuffer) {
    return sourceEntry.waveformBuffer.duration * 1000
  }
  if (sourceEntry.spec.mode === 'percussive') {
    return sourceEntry.spec.params.decay_ms + 50
  }
  const p = sourceEntry.spec.params
  return Math.min(4000, p.amp_attack_ms + p.amp_decay_ms + p.amp_release_ms + 50)
}

export function timelineHeightFor(layerCount: number): number {
  if (layerCount === 0) return 100
  // ruler 22 + tracks + 12 padding
  return 22 + layerCount * TIMELINE_TRACK_HEIGHT + 12
}
