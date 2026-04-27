import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface ParameterRowProps {
  label: string
  children: ReactNode
  // Display value (already formatted) shown on the right.
  value?: string | number
  unit?: string
  // When provided, the value display becomes click-to-edit. The numeric input
  // is clamped to [editMin, editMax] on commit, which is typically wider than
  // the slider's range — sliders express the ergonomic range, edit bounds
  // express the safe-physical range.
  editValue?: number
  onEditCommit?: (value: number) => void
  editMin?: number
  editMax?: number
}

export function ParameterRow({
  label,
  children,
  value,
  unit,
  editValue,
  onEditCommit,
  editMin,
  editMax,
}: ParameterRowProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  const editable = editValue !== undefined && onEditCommit !== undefined

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.select()
    }
  }, [editing])

  const startEdit = () => {
    if (!editable) return
    setDraft(String(editValue))
    setEditing(true)
  }

  const commit = () => {
    if (!editable) {
      setEditing(false)
      return
    }
    const parsed = parseFloat(draft)
    if (!Number.isNaN(parsed)) {
      let v = parsed
      if (editMin !== undefined) v = Math.max(editMin, v)
      if (editMax !== undefined) v = Math.min(editMax, v)
      onEditCommit?.(v)
    }
    setEditing(false)
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '90px 1fr 80px',
        alignItems: 'center',
        gap: '16px',
      }}
    >
      <div style={{ fontSize: '12px', color: '#6fa180' }}>{label}</div>
      <div style={{ minWidth: 0, display: 'flex', alignItems: 'center' }}>
        {children}
      </div>
      <div
        className="tabular"
        style={{ textAlign: 'right' }}
      >
        {value === undefined ? null : editing ? (
          <input
            ref={inputRef}
            type="number"
            inputMode="decimal"
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
            className="cathode-input"
            style={{
              width: '100%',
              textAlign: 'right',
              fontVariantNumeric: 'tabular-nums',
            }}
          />
        ) : (
          <button
            type="button"
            onClick={startEdit}
            disabled={!editable}
            title={editable ? 'Click to type a value' : undefined}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '0 2px',
              textAlign: 'right',
              cursor: editable ? 'text' : 'default',
              width: '100%',
            }}
          >
            <span
              className="term tabular"
              style={{
                fontSize: '15px',
                color: '#39ff7a',
                textShadow: '0 0 4px rgba(57, 255, 122, 0.4)',
              }}
            >
              {value}
            </span>
            {unit && (
              <span
                className="pixel"
                style={{ fontSize: '8px', color: '#4a7a5a', marginLeft: '4px' }}
              >
                {unit}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
