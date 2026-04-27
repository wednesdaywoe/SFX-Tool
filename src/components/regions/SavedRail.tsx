import { SavedSoundItem } from '../composite/SavedSoundItem'
import type { SavedSound } from '../composite/SavedSoundItem'

interface SavedRailProps {
  sounds: SavedSound[]
  selectedId: string | null
  onRecall: (sound: SavedSound) => void
  onAudition: (sound: SavedSound) => void
  onRename: (id: string, newName: string) => void
  onDelete: (id: string) => void
}

export function SavedRail({
  sounds,
  selectedId,
  onRecall,
  onAudition,
  onRename,
  onDelete,
}: SavedRailProps) {
  return (
    <aside className="flex flex-col h-full border-l border-stone-800 bg-stone-950/40 min-h-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800 flex-shrink-0">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">
          saved
        </h2>
        <span className="font-mono text-[9px] uppercase tracking-widest text-stone-600">
          session only
        </span>
      </div>

      {sounds.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="font-mono text-[11px] text-stone-600 text-center leading-relaxed">
            no sounds saved
            <br />
            <span className="text-stone-700">press save (S) to keep one</span>
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto py-1">
          {sounds.map((s) => (
            <SavedSoundItem
              key={s.id}
              sound={s}
              selected={s.id === selectedId}
              onRecall={() => onRecall(s)}
              onAudition={() => onAudition(s)}
              onRename={(newName) => onRename(s.id, newName)}
              onDelete={() => onDelete(s.id)}
            />
          ))}
        </div>
      )}
    </aside>
  )
}
