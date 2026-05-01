import type { LibraryEntry } from '../../library/types'
import type { StackLayer } from '../../stack/types'

interface StackLayerListItemProps {
  layer: StackLayer
  sourceEntry: LibraryEntry | null
  selected: boolean
  anySoloed: boolean
  onSelect: () => void
  onToggleMute: () => void
  onToggleSolo: () => void
  onDelete: () => void
  onOffsetChange: (offsetMs: number) => void
  onGainChange: (gain: number) => void
  onDurationChange?: (durationMs: number) => void
}

export function StackLayerListItem({
  layer,
  sourceEntry,
  selected,
  anySoloed,
  onSelect,
  onToggleMute,
  onToggleSolo,
  onDelete,
  onOffsetChange,
  onGainChange,
  onDurationChange,
}: StackLayerListItemProps) {
  const refName = sourceEntry?.name ?? '(missing)'
  const mode =
    sourceEntry?.spec.kind === 'sound' ? sourceEntry.spec.mode : null
  const isAtmospheric = mode === 'atmospheric'

  const isMuted = layer.mute && !layer.solo
  const isSoloedOut = anySoloed && !layer.solo
  const classes = [
    'stack-list-item group',
    selected ? 'selected' : '',
    isMuted ? 'muted' : '',
    isSoloedOut ? 'soloed-out' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div onClick={onSelect} className={classes}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <ModeTag mode={mode} />
        <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
          <div
            className="term"
            style={{
              fontSize: '14px',
              color: '#b8e0c0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {refName}
          </div>
          <div
            className="term tabular"
            style={{
              fontSize: '12px',
              color: '#8fc0a0',
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <NumberField
              label="off"
              value={layer.offset_ms}
              unit="ms"
              onChange={onOffsetChange}
            />
            <NumberField
              label="gain"
              value={layer.gain}
              onChange={onGainChange}
              decimals={2}
              min={0}
              max={1}
            />
            {isAtmospheric && onDurationChange && (
              <NumberField
                label="dur"
                value={layer.duration_ms ?? 5000}
                unit="ms"
                onChange={(ms) => onDurationChange(Math.max(100, Math.round(ms)))}
                min={100}
              />
            )}
          </div>
        </div>
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
        <button
          type="button"
          aria-label="Remove layer"
          title="Remove layer from stack"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="opacity-0 group-hover:opacity-100"
          style={{
            width: 18,
            height: 18,
            border: '1px solid #122418',
            background: '#050908',
            color: '#ff6b8a',
            fontFamily: "'VT323', monospace",
            fontSize: '11px',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

function ModeTag({
  mode,
}: {
  mode: 'percussive' | 'tonal' | 'fm' | 'atmospheric' | null
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
          color: '#6fa180',
          border: '1px solid #122418',
          flexShrink: 0,
        }}
      >
        ?
      </span>
    )
  }
  const letter =
    mode === 'percussive' ? 'P'
      : mode === 'tonal' ? 'T'
      : mode === 'fm' ? 'F'
      : 'A'
  return <span className={`mode-tag ${letter}`}>{letter}</span>
}

interface NumberFieldProps {
  label: string
  value: number
  unit?: string
  decimals?: number
  min?: number
  max?: number
  onChange: (next: number) => void
}

function NumberField({
  label,
  value,
  unit,
  decimals = 0,
  min,
  max,
  onChange,
}: NumberFieldProps) {
  const display =
    decimals > 0 ? value.toFixed(decimals) : String(Math.round(value))
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
      <span style={{ color: '#6fa180' }}>{label}</span>
      <input
        type="number"
        value={display}
        step={decimals > 0 ? 0.01 : 1}
        min={min}
        max={max}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          const v = parseFloat(e.target.value)
          if (Number.isFinite(v)) onChange(v)
        }}
        style={{
          width: 48,
          background: 'transparent',
          border: '1px solid transparent',
          padding: '0 4px',
          color: '#d4ecdc',
          fontFamily: "'VT323', monospace",
          fontSize: '13px',
          fontVariantNumeric: 'tabular-nums',
          outline: 'none',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = '#39ff7a')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'transparent')}
      />
      {unit && <span style={{ color: '#6fa180' }}>{unit}</span>}
    </span>
  )
}
