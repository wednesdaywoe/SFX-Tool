import { useEffect } from 'react'

export interface KeyboardShortcutHandlers {
  // Global
  onTrigger: () => void
  onRandomize: () => void
  onMutate: () => void
  onSave: () => void
  onSelectPresetByIndex: (oneBasedIndex: number) => void
  onExportWav: () => void
  onExportJson: () => void

  // v2 global additions
  onSwitchMode: (mode: 'percussive' | 'tonal' | 'atmospheric') => void
  onTogglePattern: () => void
  onToggleTriggerSource: () => void

  // Layer-context (fire when hasSelectedLayer is true)
  onLayerOffsetNudge: (deltaMs: number) => void
  onLayerGainNudge: (delta: number) => void
  onLayerToggleMute: () => void
  onLayerToggleSolo: () => void
  onLayerDelete: () => void
}

function isTextInput(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (target.isContentEditable) return true
  return false
}

export function useKeyboardShortcuts(
  handlers: KeyboardShortcutHandlers,
  enabled: boolean,
  hasSelectedLayer: boolean,
): void {
  useEffect(() => {
    if (!enabled) return
    const handler = (e: KeyboardEvent) => {
      if (isTextInput(e.target)) return
      const cmd = e.metaKey || e.ctrlKey
      const key = e.key

      // Cmd-modifier shortcuts
      if (cmd && e.shiftKey && key.toLowerCase() === 'e') {
        e.preventDefault()
        handlers.onExportJson()
        return
      }
      if (cmd && !e.shiftKey && key.toLowerCase() === 'e') {
        e.preventDefault()
        handlers.onExportWav()
        return
      }
      if (cmd && e.shiftKey && key.toLowerCase() === 't') {
        e.preventDefault()
        handlers.onToggleTriggerSource()
        return
      }
      if (cmd && !e.shiftKey && key.toLowerCase() === 'p') {
        e.preventDefault()
        handlers.onTogglePattern()
        return
      }
      if (cmd && !e.shiftKey && key === '1') {
        e.preventDefault()
        handlers.onSwitchMode('percussive')
        return
      }
      if (cmd && !e.shiftKey && key === '2') {
        e.preventDefault()
        handlers.onSwitchMode('tonal')
        return
      }
      if (cmd && !e.shiftKey && key === '3') {
        e.preventDefault()
        handlers.onSwitchMode('atmospheric')
        return
      }
      if (cmd) return // ignore other Cmd/Ctrl combos

      // Layer-context shortcuts (when a stack layer is selected)
      if (hasSelectedLayer) {
        if (key === 'ArrowLeft') {
          e.preventDefault()
          handlers.onLayerOffsetNudge(e.shiftKey ? -10 : -1)
          return
        }
        if (key === 'ArrowRight') {
          e.preventDefault()
          handlers.onLayerOffsetNudge(e.shiftKey ? 10 : 1)
          return
        }
        if (key === 'ArrowUp') {
          e.preventDefault()
          handlers.onLayerGainNudge(0.05)
          return
        }
        if (key === 'ArrowDown') {
          e.preventDefault()
          handlers.onLayerGainNudge(-0.05)
          return
        }
        if (key === 'Delete' || key === 'Backspace') {
          e.preventDefault()
          handlers.onLayerDelete()
          return
        }
        if (key === 'm' || key === 'M') {
          e.preventDefault()
          handlers.onLayerToggleMute()
          return
        }
        if (key === 's' || key === 'S') {
          e.preventDefault()
          handlers.onLayerToggleSolo()
          return
        }
      }

      // Global single-key shortcuts
      if (key === ' ') {
        e.preventDefault()
        handlers.onTrigger()
        return
      }
      if (key === 'r' || key === 'R') {
        e.preventDefault()
        handlers.onRandomize()
        return
      }
      if (key === 'm' || key === 'M') {
        e.preventDefault()
        handlers.onMutate()
        return
      }
      if (key === 's' || key === 'S') {
        e.preventDefault()
        handlers.onSave()
        return
      }
      if (/^[1-8]$/.test(key)) {
        e.preventDefault()
        handlers.onSelectPresetByIndex(parseInt(key, 10))
        return
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handlers, enabled, hasSelectedLayer])
}
