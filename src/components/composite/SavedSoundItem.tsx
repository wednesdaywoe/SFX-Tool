import { useEffect, useRef, useState } from 'react'
import { WaveformDisplay } from './WaveformDisplay'
import type { SoundSpec } from '../../spec'

export interface SavedSound {
  id: string
  name: string
  preset: string
  spec: SoundSpec
  waveformBuffer: AudioBuffer
}

interface SavedSoundItemProps {
  sound: SavedSound
  selected?: boolean
  onRecall: () => void
  onAudition: () => void
  onRename: (newName: string) => void
  onDelete: () => void
}

export function SavedSoundItem({
  sound,
  selected,
  onRecall,
  onAudition,
  onRename,
  onDelete,
}: SavedSoundItemProps) {
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState(sound.name)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (renaming) inputRef.current?.select()
  }, [renaming])

  const commitRename = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== sound.name) onRename(trimmed)
    setRenaming(false)
  }

  return (
    <div
      className={`group flex items-center gap-2 px-2 py-1.5 border-l-2 transition-colors cursor-pointer ${
        selected
          ? 'bg-stone-900 border-l-accent'
          : 'border-l-transparent hover:bg-stone-900/40'
      }`}
      onClick={(e) => {
        if (renaming) return
        const tag = (e.target as HTMLElement).tagName
        if (tag === 'INPUT' || tag === 'BUTTON') return
        onRecall()
      }}
    >
      <div className="flex-shrink-0 bg-stone-950 border border-stone-800 rounded-sm">
        <WaveformDisplay
          buffer={sound.waveformBuffer}
          width={28}
          height={24}
          variant="mini"
        />
      </div>

      <div className="flex-1 min-w-0">
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
                setDraft(sound.name)
                setRenaming(false)
              }
            }}
            className="w-full bg-stone-900 border border-accent/60 rounded px-1 text-xs font-mono text-stone-100 focus:outline-none"
          />
        ) : (
          <div
            onDoubleClick={(e) => {
              e.stopPropagation()
              setDraft(sound.name)
              setRenaming(true)
            }}
            className="font-mono text-xs text-stone-200 truncate"
            title="Double-click to rename"
          >
            {sound.name}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <ModeTag mode={sound.spec.mode} />
          <span className="font-mono text-[9px] uppercase tracking-widest text-stone-500">
            {sound.preset}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <IconBtn
          ariaLabel="Audition"
          title="Audition — play this exact buffer without recalling its parameters"
          onClick={(e) => {
            e.stopPropagation()
            onAudition()
          }}
        >
          ▶
        </IconBtn>
        <IconBtn
          ariaLabel="Delete"
          title="Remove from the saved list"
          danger
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          ✕
        </IconBtn>
      </div>
    </div>
  )
}

// Mode tag colors per v2 spec: P = blue (percussive), T = amber (tonal),
// S = purple (stacks, phase 5).
function ModeTag({ mode }: { mode: 'percussive' | 'tonal' }) {
  const config =
    mode === 'percussive'
      ? { letter: 'P', bg: 'bg-blue-900/60', fg: 'text-blue-300' }
      : { letter: 'T', bg: 'bg-amber-900/50', fg: 'text-amber-300' }
  return (
    <span
      title={mode === 'percussive' ? 'Percussive' : 'Tonal'}
      className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-sm font-mono text-[8px] font-bold ${config.bg} ${config.fg}`}
    >
      {config.letter}
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
      className={`w-6 h-6 flex items-center justify-center rounded text-[11px] ${
        danger
          ? 'text-stone-500 hover:text-red-400 hover:bg-stone-800'
          : 'text-stone-400 hover:text-accent hover:bg-stone-800'
      }`}
    >
      {children}
    </button>
  )
}
