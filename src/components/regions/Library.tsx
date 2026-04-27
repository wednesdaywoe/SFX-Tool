import { useRef, useState } from 'react'
import { FolderHeader } from '../composite/FolderHeader'
import { LibraryItem } from '../composite/LibraryItem'
import type { LibraryEntry, LibraryState } from '../../library/types'

interface LibraryProps {
  state: LibraryState
  selectedEntryId: string | null
  onCreateFolder: (name: string) => void
  onRenameFolder: (folderId: string, newName: string) => void
  onDeleteFolder: (folderId: string) => void
  onToggleFolder: (folderId: string) => void
  onMoveEntryToFolder: (entryId: string, folderId: string | undefined) => void
  onRecallEntry: (entry: LibraryEntry) => void
  onAuditionEntry: (entry: LibraryEntry) => void
  onExportEntryJson: (entry: LibraryEntry) => void
  onRenameEntry: (entryId: string, newName: string) => void
  onDeleteEntry: (entryId: string) => void
  onExportLibrary: () => void
  onImportLibrary: (file: File) => void
}

export function Library(props: LibraryProps) {
  const {
    state,
    selectedEntryId,
    onCreateFolder,
    onRenameFolder,
    onDeleteFolder,
    onToggleFolder,
    onMoveEntryToFolder,
    onRecallEntry,
    onAuditionEntry,
    onExportEntryJson,
    onRenameEntry,
    onDeleteEntry,
    onExportLibrary,
    onImportLibrary,
  } = props

  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [hoverFolderId, setHoverFolderId] = useState<string | null | 'unfiled'>(
    null,
  )
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleCreateFolder = () => {
    const name = window.prompt('Folder name:')?.trim()
    if (name) onCreateFolder(name)
  }

  const handleDeleteFolder = (folderId: string, name: string) => {
    if (
      window.confirm(
        `Delete folder "${name}"? Sounds inside will move to Unfiled.`,
      )
    ) {
      onDeleteFolder(folderId)
    }
  }

  const handleDragOverFolder = (
    e: React.DragEvent,
    folderId: string | 'unfiled',
  ) => {
    if (!draggedId) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setHoverFolderId(folderId)
  }

  const handleDropOnFolder = (
    e: React.DragEvent,
    folderId: string | undefined,
  ) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain') || draggedId
    if (id) onMoveEntryToFolder(id, folderId)
    setHoverFolderId(null)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onImportLibrary(file)
    e.target.value = ''
  }

  const unfiledEntries = state.entries.filter((e) => e.folderId === undefined)

  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#050908',
        borderTop: '2px solid #122418',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <div className="panel-header" style={{ flexShrink: 0 }}>
        <span>LIBRARY</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <HeaderButton onClick={handleCreateFolder} title="Create new folder">
            + FOLDER
          </HeaderButton>
          <HeaderButton
            onClick={onExportLibrary}
            title="Export entire library as a .sfx.zip file"
          >
            EXPORT
          </HeaderButton>
          <HeaderButton
            onClick={handleImportClick}
            title="Import a previously-exported library zip"
          >
            IMPORT
          </HeaderButton>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,.sfx.zip,application/zip"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {state.entries.length === 0 && state.folders.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <p
            className="term"
            style={{
              fontSize: '14px',
              color: '#4a7a5a',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            no sounds saved
            <br />
            <span style={{ color: '#2d4a36' }}>press save (S) to keep one</span>
            <br />
            <span style={{ color: '#2d4a36' }}>
              persists across reloads
            </span>
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {state.folders.map((folder) => {
            const items = state.entries.filter(
              (e) => e.folderId === folder.id,
            )
            return (
              <div key={folder.id}>
                <FolderHeader
                  id={folder.id}
                  name={folder.name}
                  expanded={folder.expanded}
                  count={items.length}
                  onToggle={() => onToggleFolder(folder.id)}
                  onRename={(newName) => onRenameFolder(folder.id, newName)}
                  onDelete={() => handleDeleteFolder(folder.id, folder.name)}
                  isDropTarget={hoverFolderId === folder.id}
                  onDragOver={(e) => handleDragOverFolder(e, folder.id)}
                  onDragLeave={() => setHoverFolderId(null)}
                  onDrop={(e) => handleDropOnFolder(e, folder.id)}
                />
                {folder.expanded &&
                  items.map((entry) => (
                    <div key={entry.id} className="pl-4">
                      <LibraryItem
                        entry={entry}
                        selected={selectedEntryId === entry.id}
                        onRecall={onRecallEntry}
                        onAudition={onAuditionEntry}
                        onExportJson={onExportEntryJson}
                        onRename={onRenameEntry}
                        onDelete={onDeleteEntry}
                        onDragStart={setDraggedId}
                        onDragEnd={() => {
                          setDraggedId(null)
                          setHoverFolderId(null)
                        }}
                      />
                    </div>
                  ))}
              </div>
            )
          })}

          {/* Unfiled section — shown when there are folders OR unfiled entries */}
          {(state.folders.length > 0 || unfiledEntries.length > 0) && (
            <div>
              <FolderHeader
                id={null}
                name="Unfiled"
                expanded={true}
                count={unfiledEntries.length}
                onToggle={() => undefined}
                isDropTarget={hoverFolderId === 'unfiled'}
                onDragOver={(e) => handleDragOverFolder(e, 'unfiled')}
                onDragLeave={() => setHoverFolderId(null)}
                onDrop={(e) => handleDropOnFolder(e, undefined)}
              />
              {unfiledEntries.map((entry) => (
                <div key={entry.id} className="pl-4">
                  <LibraryItem
                    entry={entry}
                    selected={selectedEntryId === entry.id}
                    onRecall={onRecallEntry}
                    onAudition={onAuditionEntry}
                    onExportJson={onExportEntryJson}
                    onRename={onRenameEntry}
                    onDelete={onDeleteEntry}
                    onDragStart={setDraggedId}
                    onDragEnd={() => {
                      setDraggedId(null)
                      setHoverFolderId(null)
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  )
}

interface HeaderButtonProps {
  onClick: () => void
  title: string
  children: React.ReactNode
}

function HeaderButton({ onClick, title, children }: HeaderButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="pixel"
      style={{
        background: '#0a1410',
        border: '1px solid #1c3a26',
        color: '#8fd0a0',
        fontSize: '8px',
        padding: '2px 8px',
        cursor: 'pointer',
        letterSpacing: '0.1em',
      }}
    >
      {children}
    </button>
  )
}
