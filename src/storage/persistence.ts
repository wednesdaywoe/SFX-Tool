import type { Spec } from '../spec'
import type { Folder, LibraryEntry, LibraryState } from '../library/types'

const STORAGE_KEY = 'sfx-tool:state:v2'
const DEBOUNCE_MS = 400

export type JsonExportMode = 'reference' | 'flattened'

export interface PersistedUiState {
  currentMode: 'percussive' | 'tonal'
  autoPlayOnChange: boolean
  mutateDistance: 'S' | 'M' | 'L'
  jsonExportMode: JsonExportMode
}

// Folder.expanded lives on the folder itself, so it persists with the library
// rather than as a separate UI key. Per-mode current sound (preset/params/
// pattern) is NOT persisted in phase 4 — phase 6 polish target.

interface PersistedEntry {
  id: string
  name: string
  preset: string
  spec: Spec
  folderId?: string
  createdAt: string
  modifiedAt: string
}

interface PersistedShape {
  version: '2.0'
  folders: Folder[]
  entries: PersistedEntry[]
  ui?: PersistedUiState
}

export interface LoadedState {
  library: LibraryState
  ui?: PersistedUiState
}

// Strip transient fields (waveformBuffer is regenerated on first audition).
function toPersistedEntry(e: LibraryEntry): PersistedEntry {
  return {
    id: e.id,
    name: e.name,
    preset: e.preset,
    spec: e.spec,
    ...(e.folderId !== undefined ? { folderId: e.folderId } : {}),
    createdAt: e.createdAt,
    modifiedAt: e.modifiedAt,
  }
}

function fromPersistedEntry(p: PersistedEntry): LibraryEntry {
  return {
    id: p.id,
    name: p.name,
    preset: p.preset,
    spec: p.spec,
    waveformBuffer: null,
    folderId: p.folderId,
    createdAt: p.createdAt,
    modifiedAt: p.modifiedAt,
  }
}

export function loadState(): LoadedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedShape
    if (parsed.version !== '2.0') {
      console.warn(
        `Persisted state has unexpected version "${parsed.version}"; ignoring`,
      )
      return null
    }
    return {
      library: {
        folders: parsed.folders ?? [],
        entries: (parsed.entries ?? []).map(fromPersistedEntry),
      },
      ui: parsed.ui,
    }
  } catch (err) {
    console.warn('Failed to load persisted state:', err)
    return null
  }
}

let saveTimer: number | null = null

export function scheduleSave(
  library: LibraryState,
  ui: PersistedUiState,
): void {
  if (saveTimer !== null) window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    saveTimer = null
    void saveStateNow(library, ui)
  }, DEBOUNCE_MS)
}

export function saveStateNow(
  library: LibraryState,
  ui: PersistedUiState,
): void {
  const payload: PersistedShape = {
    version: '2.0',
    folders: library.folders,
    entries: library.entries.map(toPersistedEntry),
    ui,
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      // Surface in console; UI-level toast/modal is phase 6 polish.
      console.error(
        'Storage limit reached. Export your library to a zip and clear some entries.',
      )
    } else {
      console.error('Failed to save state:', err)
    }
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.warn('Failed to clear state:', err)
  }
}
