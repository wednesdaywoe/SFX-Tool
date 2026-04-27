import type { Spec } from '../spec'

export interface Folder {
  id: string
  name: string
  expanded: boolean
}

export interface LibraryEntry {
  id: string
  name: string
  // For sounds: the preset key (e.g., "click", "laser"). For stacks: empty
  // string or "stack" — stacks don't have presets in v2.
  preset: string
  spec: Spec
  // null until lazily rendered. Transient — not persisted.
  waveformBuffer: AudioBuffer | null
  // undefined = "Unfiled". Otherwise references a Folder.id.
  folderId?: string
  createdAt: string
  modifiedAt: string
}

export interface LibraryState {
  folders: Folder[]
  entries: LibraryEntry[]
}

export const UNFILED: undefined = undefined

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random()}`
}
