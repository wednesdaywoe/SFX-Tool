import { useEffect, useRef, useState } from 'react'

interface FolderHeaderProps {
  // null id = the synthetic "Unfiled" folder header
  id: string | null
  name: string
  expanded: boolean
  count: number
  onToggle: () => void
  onRename?: (newName: string) => void  // omitted for Unfiled (can't rename)
  onDelete?: () => void                 // omitted for Unfiled (can't delete)
  isDropTarget?: boolean
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: () => void
  onDrop?: (e: React.DragEvent) => void
}

export function FolderHeader({
  id,
  name,
  expanded,
  count,
  onToggle,
  onRename,
  onDelete,
  isDropTarget,
  onDragOver,
  onDragLeave,
  onDrop,
}: FolderHeaderProps) {
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState(name)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (renaming) inputRef.current?.select()
  }, [renaming])

  const commitRename = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== name && onRename) onRename(trimmed)
    setRenaming(false)
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className="library-folder-header group"
      style={
        isDropTarget
          ? {
              background: '#0c1f15',
              boxShadow: 'inset 2px 0 0 #39ff7a',
            }
          : undefined
      }
      onClick={(e) => {
        if (renaming) return
        const tag = (e.target as HTMLElement).tagName
        if (tag === 'INPUT' || tag === 'BUTTON') return
        onToggle()
      }}
    >
      <span
        style={{ marginRight: '6px', color: '#4a7a5a', fontSize: '9px' }}
        aria-hidden="true"
      >
        {expanded ? '▼' : '▶'}
      </span>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
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
                setDraft(name)
                setRenaming(false)
              }
            }}
            className="cathode-input"
            style={{ flex: 1 }}
          />
        ) : (
          <div
            onDoubleClick={(e) => {
              if (!onRename) return
              e.stopPropagation()
              setDraft(name)
              setRenaming(true)
            }}
            style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={onRename ? 'Double-click to rename' : undefined}
          >
            {name}
          </div>
        )}
        <span
          className="term tabular"
          style={{
            color: '#4a7a5a',
            fontSize: '13px',
            letterSpacing: 'normal',
            textTransform: 'none',
          }}
        >
          ({count})
        </span>
      </div>

      {id !== null && onDelete && (
        <button
          type="button"
          aria-label="Delete folder"
          title="Delete folder (entries move to Unfiled)"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="opacity-0 group-hover:opacity-100"
          style={{
            width: 18,
            height: 16,
            border: '1px solid #122418',
            background: '#050908',
            color: '#ff6b8a',
            fontFamily: "'VT323', monospace",
            fontSize: '11px',
            cursor: 'pointer',
            padding: 0,
            marginLeft: 4,
          }}
        >
          ✕
        </button>
      )}
    </div>
  )
}
