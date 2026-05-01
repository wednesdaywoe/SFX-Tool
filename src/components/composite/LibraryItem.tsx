import { useEffect, useRef, useState } from 'react'
import { WaveformDisplay } from './WaveformDisplay'
import type { LibraryEntry } from '../../library/types'
import type { Spec } from '../../spec'

interface LibraryItemProps {
  entry: LibraryEntry
  selected?: boolean
  onRecall: (entry: LibraryEntry) => void
  onAudition: (entry: LibraryEntry) => void
  onExportJson: (entry: LibraryEntry) => void
  onRename: (id: string, newName: string) => void
  onDelete: (id: string) => void
  onDragStart?: (id: string) => void
  onDragEnd?: () => void
}

export function LibraryItem({
  entry,
  selected,
  onRecall,
  onAudition,
  onExportJson,
  onRename,
  onDelete,
  onDragStart,
  onDragEnd,
}: LibraryItemProps) {
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState(entry.name)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (renaming) inputRef.current?.select()
  }, [renaming])

  const commitRename = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== entry.name) onRename(entry.id, trimmed)
    setRenaming(false)
  }

  return (
    <div
      draggable={!renaming}
      onDragStart={(e) => {
        // text/plain → folder drop targets (move semantics)
        // application/x-library-entry → stack drop targets (copy/add semantics)
        e.dataTransfer.setData('text/plain', entry.id)
        e.dataTransfer.setData('application/x-library-entry', entry.id)
        e.dataTransfer.effectAllowed = 'copyMove'
        onDragStart?.(entry.id)
      }}
      onDragEnd={() => onDragEnd?.()}
      className={`library-item group ${selected ? 'selected' : ''}`}
      onClick={(e) => {
        if (renaming) return
        const tag = (e.target as HTMLElement).tagName
        if (tag === 'INPUT' || tag === 'BUTTON') return
        onRecall(entry)
      }}
    >
      <ModeTag spec={entry.spec} />
      <div
        style={{
          flexShrink: 0,
          background: '#050908',
          border: '1px solid #122418',
        }}
      >
        <WaveformDisplay
          buffer={entry.waveformBuffer}
          width={28}
          height={20}
          variant="mini"
        />
      </div>

      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {renaming ? (
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                ;(e.currentTarget as HTMLInputElement).blur()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                setDraft(entry.name)
                setRenaming(false)
              }
            }}
            className="cathode-input"
            style={{ width: '100%' }}
          />
        ) : (
          <div
            onDoubleClick={(e) => {
              e.stopPropagation()
              setDraft(entry.name)
              setRenaming(true)
            }}
            className="term"
            style={{
              fontSize: '14px',
              color: '#b8e0c0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title="Double-click to rename"
          >
            {entry.name}
          </div>
        )}
        <div
          className="pixel"
          style={{
            fontSize: '7px',
            color: '#6fa180',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          {entry.spec.kind === 'stack'
            ? `${entry.spec.layers.length} layers`
            : entry.preset}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '2px',
          flexShrink: 0,
          marginRight: 28,
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <IconBtn
          ariaLabel="Audition"
          title="Audition — play this entry without recalling its parameters"
          onClick={(e) => {
            e.stopPropagation()
            onAudition(entry)
          }}
        >
          ▶
        </IconBtn>
        <IconBtn
          ariaLabel="Export JSON"
          title="Export this entry as a .sfx.json file"
          onClick={(e) => {
            e.stopPropagation()
            onExportJson(entry)
          }}
        >
          {'{}'}
        </IconBtn>
        <IconBtn
          ariaLabel="Delete"
          title="Remove from the library"
          danger
          onClick={(e) => {
            e.stopPropagation()
            onDelete(entry.id)
          }}
        >
          ✕
        </IconBtn>
      </div>
    </div>
  )
}

function ModeTag({ spec }: { spec: Spec }) {
  let letter: 'P' | 'T' | 'F' | 'S' | 'A'
  let title: string
  if (spec.kind === 'stack') {
    letter = 'S'
    title = 'Stack'
  } else if (spec.mode === 'percussive') {
    letter = 'P'
    title = 'Percussive'
  } else if (spec.mode === 'tonal') {
    letter = 'T'
    title = 'Tonal'
  } else if (spec.mode === 'fm') {
    letter = 'F'
    title = 'FM'
  } else {
    letter = 'A'
    title = 'Atmospheric'
  }
  return (
    <span title={title} className={`mode-tag ${letter}`}>
      {letter}
    </span>
  )
}

interface IconBtnProps {
  ariaLabel: string
  title?: string
  danger?: boolean
  onClick: (e: React.MouseEvent) => void
  children: React.ReactNode
}

function IconBtn({ ariaLabel, title, danger, onClick, children }: IconBtnProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      onClick={onClick}
      style={{
        width: 22,
        height: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050908',
        border: '1px solid #122418',
        color: danger ? '#ff6b8a' : '#8fc0a0',
        fontFamily: "'VT323', monospace",
        fontSize: '12px',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      {children}
    </button>
  )
}
