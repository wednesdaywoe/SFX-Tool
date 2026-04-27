import JSZip from 'jszip'
import { parseSpec, SpecParseError } from '../spec'
import type { Folder, LibraryEntry, LibraryState } from './types'
import { newId } from './types'

interface ManifestFolder {
  id: string
  name: string
  order: number
}

interface ManifestEntry {
  id: string
  name: string
  folder?: string
  kind?: 'sound' | 'stack'
  filename: string
  created: string
  modified: string
}

interface ImportResult {
  added: LibraryEntry[]
  newFolders: Folder[]
  warnings: string[]
}

// Append-only import: never overwrites existing entries. Folder IDs are
// remapped if they collide with existing ones; entry names get an "_imported"
// suffix on collision.
export async function importLibraryZip(
  file: File | Blob,
  current: LibraryState,
): Promise<ImportResult> {
  const warnings: string[] = []
  const zip = await JSZip.loadAsync(file)

  const manifestFile = zip.file('manifest.sfx.json')
  if (!manifestFile) {
    throw new Error('Zip missing manifest.sfx.json')
  }
  const manifestJson = await manifestFile.async('string')
  const manifest = JSON.parse(manifestJson) as {
    version?: string
    folders?: ManifestFolder[]
    entries?: ManifestEntry[]
  }

  if (manifest.version !== '2.0') {
    warnings.push(
      `Manifest version is "${manifest.version}", expected "2.0" — proceeding cautiously`,
    )
  }

  const folderIdMap = new Map<string, string>()
  const newFolders: Folder[] = []
  const existingFolderIds = new Set(current.folders.map((f) => f.id))

  for (const f of manifest.folders ?? []) {
    let id = f.id
    if (existingFolderIds.has(id)) {
      id = newId()
      warnings.push(
        `Folder ID collision for "${f.name}" — assigned new ID`,
      )
    }
    folderIdMap.set(f.id, id)
    newFolders.push({ id, name: f.name, expanded: true })
  }

  const existingNames = new Set(
    current.entries.map((e) => e.name.toLowerCase()),
  )
  const added: LibraryEntry[] = []

  for (const m of manifest.entries ?? []) {
    const file = zip.file(m.filename)
    if (!file) {
      warnings.push(`Missing spec file ${m.filename} — skipped`)
      continue
    }
    const json = await file.async('string')
    let parsed
    try {
      parsed = parseSpec(JSON.parse(json))
    } catch (err) {
      const msg = err instanceof SpecParseError ? err.message : String(err)
      warnings.push(`Failed to parse ${m.filename}: ${msg}`)
      continue
    }
    warnings.push(...parsed.warnings.map((w) => `${m.name}: ${w}`))

    let name = m.name
    let suffix = 1
    while (existingNames.has(name.toLowerCase())) {
      suffix += 1
      name = `${m.name}_imported${suffix > 2 ? `_${suffix}` : ''}`
    }
    existingNames.add(name.toLowerCase())

    const folderId =
      m.folder !== undefined ? folderIdMap.get(m.folder) : undefined
    const preset = parsed.spec.kind === 'sound' ? parsed.spec.preset : 'stack'

    added.push({
      id: newId(),
      name,
      preset,
      spec: parsed.spec,
      waveformBuffer: null,
      folderId,
      createdAt: m.created || new Date().toISOString(),
      modifiedAt: m.modified || new Date().toISOString(),
    })
  }

  return { added, newFolders, warnings }
}
