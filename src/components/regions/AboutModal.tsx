import { Modal } from '../primitives/Modal'
import { KeyHint } from '../primitives/KeyHint'
import { TOOL_VERSION } from '../../spec'

interface AboutModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="About">
      <div className="space-y-5">
        <div>
          <div className="font-display text-xl tracking-[0.18em] text-stone-200">
            sfx_tool
          </div>
          <div className="font-mono text-[10px] tracking-widest text-stone-500 mt-1">
            v{TOOL_VERSION} · percussive + tonal modes · stacks
          </div>
        </div>

        <p className="text-sm text-stone-300 leading-relaxed">
          A foraging-style synth for authoring game sound effects. Three synthesis modes
          (percussive + tonal + atmospheric), a render-time pattern feature for repeats and
          arpeggios, and multichannel stacks for composing layered sounds.
          Library is folder-organized and persists across sessions. Save your sounds as WAV and JSON.
        </p>

        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2">
            shortcuts — sound editing
          </h3>
          <ul className="space-y-1.5 text-xs text-stone-300">
            <ShortcutRow keys="SPACE" label="Trigger current sound or stack" />
            <ShortcutRow keys="R" label="Randomize within current preset" />
            <ShortcutRow keys="M" label="Mutate (current distance)" />
            <ShortcutRow keys="S" label="Save current sound or stack" />
            <ShortcutRow keys="1–8" label="Select preset 1 through 8" />
            <ShortcutRow keys="⌘1 / ⌘2" label="Switch to Percussive / Tonal mode" />
            <ShortcutRow keys="⌘P" label="Toggle pattern on/off" />
            <ShortcutRow keys="⌘⇧T" label="Toggle TRIGGER PLAYS source / stack" />
            <ShortcutRow keys="⌘E" label="Export WAV" />
            <ShortcutRow keys="⌘⇧E" label="Export JSON spec" />
          </ul>
        </section>

        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2">
            shortcuts — selected stack layer
          </h3>
          <ul className="space-y-1.5 text-xs text-stone-300">
            <ShortcutRow keys="←  →" label="Nudge offset by 1 ms" />
            <ShortcutRow keys="⇧ ←  →" label="Nudge offset by 10 ms" />
            <ShortcutRow keys="↑ ↓" label="Nudge gain by 0.05" />
            <ShortcutRow keys="M" label="Toggle mute" />
            <ShortcutRow keys="S" label="Toggle solo" />
            <ShortcutRow keys="DEL" label="Remove layer" />
          </ul>
        </section>

        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2">
            tips
          </h3>
          <ul className="space-y-1.5 text-xs text-stone-300 leading-relaxed">
            <li>Click any numeric value to type it directly.</li>
            <li>
              Drag a sound from the library onto the timeline or roster to add
              it as a stack layer.
            </li>
            <li>
              Drag a layer block horizontally to adjust its time offset; drag
              the amber strip on top vertically for gain.
            </li>
            <li>
              Library is saved in your browser's local storage. Use Settings →
              Export library to back up or move between machines.
            </li>
          </ul>
        </section>
      </div>
    </Modal>
  )
}

function ShortcutRow({ keys, label }: { keys: string; label: string }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <KeyHint keys={keys} />
    </li>
  )
}
