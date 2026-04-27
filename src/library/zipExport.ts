import JSZip from 'jszip'
import { TOOL_NAME, TOOL_VERSION } from '../spec'
import { downloadBlob } from '../wav'
import type { LibraryState } from './types'

interface ManifestFolder {
  id: string
  name: string
  order: number
}

interface ManifestEntry {
  id: string
  name: string
  folder?: string
  kind: 'sound' | 'stack'
  filename: string
  created: string
  modified: string
}

interface LibraryManifest {
  version: '2.0'
  exported: string
  tool: string
  tool_version: string
  folders: ManifestFolder[]
  entries: ManifestEntry[]
}

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export async function exportLibraryZip(
  library: LibraryState,
  filenameBase = 'library',
): Promise<void> {
  const zip = new JSZip()

  const usedFilenames = new Set<string>()
  const manifestEntries: ManifestEntry[] = []

  for (const e of library.entries) {
    const base = safeFilename(e.name)
    let candidate = `${base}.sfx.json`
    let suffix = 1
    while (usedFilenames.has(candidate)) {
      suffix += 1
      candidate = `${base}_${suffix}.sfx.json`
    }
    usedFilenames.add(candidate)

    const kind = e.spec.kind
    const subdir = kind === 'stack' ? 'stacks' : 'sounds'
    const filename = `${subdir}/${candidate}`
    zip.file(filename, JSON.stringify(e.spec, null, 2))

    manifestEntries.push({
      id: e.id,
      name: e.name,
      folder: e.folderId,
      kind,
      filename,
      created: e.createdAt,
      modified: e.modifiedAt,
    })
  }

  const manifest: LibraryManifest = {
    version: '2.0',
    exported: new Date().toISOString(),
    tool: TOOL_NAME,
    tool_version: TOOL_VERSION,
    folders: library.folders.map<ManifestFolder>((f, i) => ({
      id: f.id,
      name: f.name,
      order: i,
    })),
    entries: manifestEntries,
  }
  zip.file('manifest.sfx.json', JSON.stringify(manifest, null, 2))

  const blob = await zip.generateAsync({ type: 'blob' })
  const date = new Date().toISOString().split('T')[0]
  downloadBlob(blob, `${filenameBase}_${date}.sfx.zip`, 'application/zip')
}
