import { useRef } from 'react'
import { WaveformDisplay } from './WaveformDisplay'
import type { LibraryEntry } from '../../library/types'
import type { StackLayer } from '../../stack/types'

const TRACK_HEIGHT = 64

interface TimelineTrackProps {
  layer: StackLayer
  sourceEntry: LibraryEntry | null
  estimatedDurationMs: number
  startMs: number
  endMs: number
  width: number
  labelLeftWidth: number
  selected: boolean
  anySoloed: boolean
  onSelect: () => void
  onOffsetChange: (offsetMs: number) => void
  onGainChange: (gain: number) => void
  onToggleMute: () => void
  onToggleSolo: () => void
}

export function TimelineTrack({
  layer,
  sourceEntry,
  estimatedDurationMs,
  startMs,
  endMs,
  width,
  labelLeftWidth,
  selected,
  anySoloed,
  onSelect,
  onOffsetChange,
  onGainChange,
  onToggleMute,
  onToggleSolo,
}: TimelineTrackProps) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const dragStateRef = useRef<{
    mode: 'offset' | 'gain'
    startX: number
    startY: number
    startOffset: number
    startGain: number
    msPerPixel: number
  } | null>(null)

  const rangeMs = endMs - startMs
  const contentWidth = width - labelLeftWidth
  const msPerPixel = rangeMs / contentWidth

  const blockLeft =
    labelLeftWidth + ((layer.offset_ms - startMs) / rangeMs) * contentWidth
  const blockWidth = (estimatedDurationMs / rangeMs) * contentWidth
  const blockHeight = TRACK_HEIGHT * (0.2 + layer.gain * 0.6)
  const blockTop = (TRACK_HEIGHT - blockHeight) / 2

  const isAudible = anySoloed ? layer.solo === true : !layer.mute
  const isMuted = !isAudible

  const refName = sourceEntry?.name ?? '(missing)'
  const mode =
    sourceEntry?.spec.kind === 'sound' ? sourceEntry.spec.mode : null
  const buffer = sourceEntry?.waveformBuffer ?? null

  const startDrag = (
    mode: 'offset' | 'gain',
    e: React.PointerEvent<HTMLDivElement>,
  ) => {
    e.preventDefault()
    e.stopPropagation()
    onSelect()
    ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
    dragStateRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      startOffset: layer.offset_ms,
      startGain: layer.gain,
      msPerPixel,
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current
    if (!drag) return
    if (drag.mode === 'offset') {
      const dx = e.clientX - drag.startX
      onOffsetChange(drag.startOffset + dx * drag.msPerPixel)
    } else {
      // dragging up should increase gain — invert dy
      const dy = drag.startY - e.clientY
      const gainPerPixel = 1 / TRACK_HEIGHT
      onGainChange(drag.startGain + dy * gainPerPixel * 1.5)
    }
  }

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStateRef.current = null
    try {
      ;(e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  return (
    <div
      ref={trackRef}
      className="timeline-track"
      style={{ width }}
      onClick={onSelect}
    >
      {/* Track label */}
      <div
        className="track-label"
        style={{
          width: labelLeftWidth,
          background: selected ? '#0a1814' : '#050908',
        }}
      >
        <ModeTag mode={mode} />
        <span
          className="term"
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: '13px',
            color: selected ? '#39ff7a' : '#a8d8b0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {refName}
        </span>
        <button
          type="button"
          className={`ms-button ${layer.mute ? 'active-mute' : ''}`}
          title={layer.mute ? 'Unmute' : 'Mute'}
          onClick={(e) => {
            e.stopPropagation()
            onToggleMute()
          }}
        >
          M
        </button>
        <button
          type="button"
          className={`ms-button ${layer.solo === true ? 'active-solo' : ''}`}
          title={layer.solo ? 'Unsolo' : 'Solo (silences other layers)'}
          onClick={(e) => {
            e.stopPropagation()
            onToggleSolo()
          }}
        >
          S
        </button>
      </div>

      <div
        className={`track-content ${selected ? 'selected' : ''}`}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: labelLeftWidth,
          right: 0,
        }}
      >
        {/* 0ms anchor line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            height: '100%',
            width: '1px',
            background: 'rgba(57, 255, 122, 0.3)',
            pointerEvents: 'none',
            left: ((-startMs) / rangeMs) * contentWidth,
          }}
        />

        {/* Layer block */}
        <div
          onPointerDown={(e) => startDrag('offset', e)}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={`layer-block ${selected ? 'selected' : ''} ${isMuted ? 'muted' : ''} ${anySoloed && !layer.solo ? 'soloed-out' : ''}`}
          style={{
            left: blockLeft - labelLeftWidth,
            width: Math.max(8, blockWidth),
            top: blockTop,
            height: blockHeight,
            bottom: 'auto',
          }}
          title={`${refName} — offset ${layer.offset_ms}ms, gain ${layer.gain.toFixed(2)}`}
        >
          {/* Gain handle */}
          <div
            onPointerDown={(e) => startDrag('gain', e)}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="gain-handle"
            title="Drag vertically to adjust gain"
          />
          {buffer && blockWidth > 16 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                paddingTop: 6,
                pointerEvents: 'none',
                opacity: 0.7,
              }}
            >
              <WaveformDisplay
                buffer={buffer}
                width={Math.max(8, blockWidth)}
                height={Math.max(4, blockHeight - 6)}
                variant="mini"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ModeTag({
  mode,
}: {
  mode: 'percussive' | 'tonal' | 'atmospheric' | null
}) {
  if (mode === null) {
    return (
      <span
        style={{
          width: 16,
          height: 14,
          fontFamily: "'Silkscreen', monospace",
          fontSize: '8px',
          fontWeight: 'bold',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a1410',
          color: '#4a7a5a',
          border: '1px solid #122418',
          flexShrink: 0,
        }}
      >
        ?
      </span>
    )
  }
  const letter =
    mode === 'percussive' ? 'P' : mode === 'tonal' ? 'T' : 'A'
  return <span className={`mode-tag ${letter}`}>{letter}</span>
}

export const TIMELINE_TRACK_HEIGHT = TRACK_HEIGHT
