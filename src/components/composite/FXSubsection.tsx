import { useState, type ReactNode } from 'react'

interface FXSubsectionProps {
  name: string
  enabled: boolean
  summary: string
  onEnabledChange: (next: boolean) => void
  children: ReactNode
}

/* One effect's collapsible row inside the FX panel. Header bar shows name +
 * state summary + on/off toggle. Body is rendered when expanded AND enabled.
 * Disabled state collapses the body regardless of expansion to keep the
 * panel from growing with controls that have no audible effect. */
export function FXSubsection({
  name,
  enabled,
  summary,
  onEnabledChange,
  children,
}: FXSubsectionProps) {
  const [expanded, setExpanded] = useState(false)
  const showBody = expanded && enabled

  return (
    <div
      style={{
        background: '#050908',
        border: '1px solid #122418',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          cursor: 'pointer',
        }}
        onClick={() => enabled && setExpanded((v) => !v)}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className="pixel"
            style={{
              fontSize: '8px',
              color: enabled ? '#6fa180' : '#3d5a46',
              width: 10,
            }}
          >
            {enabled ? (showBody ? '▼' : '▶') : ' '}
          </span>
          <span
            className="pixel"
            style={{
              fontSize: '9px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: enabled ? '#b8e0c0' : '#6fa180',
            }}
          >
            {name}
          </span>
          <span
            className="term"
            style={{
              fontSize: '13px',
              color: enabled ? '#39ff7a' : '#6fa180',
              letterSpacing: 'normal',
              textTransform: 'none',
            }}
          >
            · {summary}
          </span>
        </span>
        <div className="seg-group" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={`seg-button ${!enabled ? 'active' : ''}`}
            onClick={() => onEnabledChange(false)}
            style={{ padding: '3px 8px', fontSize: '11px' }}
          >
            OFF
          </button>
          <button
            type="button"
            className={`seg-button ${enabled ? 'active' : ''}`}
            onClick={() => onEnabledChange(true)}
            style={{ padding: '3px 8px', fontSize: '11px' }}
          >
            ON
          </button>
        </div>
      </div>
      {showBody && (
        <div
          style={{
            padding: '12px',
            borderTop: '1px solid #122418',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}
