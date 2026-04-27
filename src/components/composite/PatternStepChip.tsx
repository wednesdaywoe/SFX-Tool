import { useEffect, useRef, useState } from 'react'

interface PatternStepChipProps {
  index: number
  semitones: number
  // null when this chip's step is beyond the active steps count (visible but
  // dim and non-editable so the user sees the row width stays fixed).
  active: boolean
  onChange: (semitones: number) => void
  min?: number
  max?: number
}

export function PatternStepChip({
  index,
  semitones,
  active,
  onChange,
  min = -24,
  max = 24,
}: PatternStepChipProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(semitones))
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const startEdit = () => {
    if (!active) return
    setDraft(String(semitones))
    setEditing(true)
  }

  const commit = () => {
    const parsed = parseInt(draft, 10)
    if (Number.isFinite(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed))
      onChange(clamped)
    }
    setEditing(false)
  }

  const display = semitones > 0 ? `+${semitones}` : `${semitones}`

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <span
        className="pixel"
        style={{ fontSize: '7px', color: '#4a7a5a', letterSpacing: '0.18em' }}
      >
        {index + 1}
      </span>
      {editing ? (
        <input
          ref={inputRef}
          type="number"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              ;(e.currentTarget as HTMLInputElement).blur()
            } else if (e.key === 'Escape') {
              e.preventDefault()
              setEditing(false)
            }
          }}
          className="cathode-input tabular"
          style={{ width: 32, textAlign: 'center', padding: '4px' }}
        />
      ) : (
        <button
          type="button"
          onClick={startEdit}
          disabled={!active}
          title={
            active
              ? `Step ${index + 1} pitch offset (semitones)`
              : 'Inactive step'
          }
          className="pattern-step tabular"
          style={
            !active
              ? {
                  opacity: 0.3,
                  cursor: 'not-allowed',
                }
              : undefined
          }
        >
          {display}
        </button>
      )}
    </div>
  )
}
