import type { Folder, LibraryEntry, LibraryState } from './types'
import { newId } from './types'

export function createFolder(state: LibraryState, name: string): LibraryState {
  const folder: Folder = { id: newId(), name, expanded: true }
  return { ...state, folders: [...state.folders, folder] }
}

export function renameFolder(
  state: LibraryState,
  folderId: string,
  newName: string,
): LibraryState {
  return {
    ...state,
    folders: state.folders.map((f) =>
      f.id === folderId ? { ...f, name: newName } : f,
    ),
  }
}

export function deleteFolder(
  state: LibraryState,
  folderId: string,
): LibraryState {
  // Sounds inside go back to Unfiled (never deleted with the folder) — per spec.
  return {
    folders: state.folders.filter((f) => f.id !== folderId),
    entries: state.entries.map((e) =>
      e.folderId === folderId ? { ...e, folderId: undefined } : e,
    ),
  }
}

export function toggleFolder(
  state: LibraryState,
  folderId: string,
): LibraryState {
  return {
    ...state,
    folders: state.folders.map((f) =>
      f.id === folderId ? { ...f, expanded: !f.expanded } : f,
    ),
  }
}

export function moveEntryToFolder(
  state: LibraryState,
  entryId: string,
  folderId: string | undefined,
): LibraryState {
  return {
    ...state,
    entries: state.entries.map((e) =>
      e.id === entryId
        ? { ...e, folderId, modifiedAt: new Date().toISOString() }
        : e,
    ),
  }
}

export function addEntry(
  state: LibraryState,
  entry: LibraryEntry,
): LibraryState {
  return { ...state, entries: [...state.entries, entry] }
}

export function deleteEntry(
  state: LibraryState,
  entryId: string,
): LibraryState {
  return {
    ...state,
    entries: state.entries.filter((e) => e.id !== entryId),
  }
}

export function renameEntry(
  state: LibraryState,
  entryId: string,
  newName: string,
): LibraryState {
  return {
    ...state,
    entries: state.entries.map((e) =>
      e.id === entryId
        ? { ...e, name: newName, modifiedAt: new Date().toISOString() }
        : e,
    ),
  }
}

export function updateEntryBuffer(
  state: LibraryState,
  entryId: string,
  buffer: AudioBuffer,
): LibraryState {
  return {
    ...state,
    entries: state.entries.map((e) =>
      e.id === entryId ? { ...e, waveformBuffer: buffer } : e,
    ),
  }
}

// Group entries for display: each folder's entries first, then unfiled.
export function entriesByFolder(
  state: LibraryState,
  folderId: string | undefined,
): LibraryEntry[] {
  return state.entries.filter((e) => e.folderId === folderId)
}
