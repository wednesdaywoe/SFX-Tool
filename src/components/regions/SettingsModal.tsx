import { Modal } from '../primitives/Modal'
import { SegmentedControl } from '../primitives/SegmentedControl'
import type { JsonExportMode } from '../../storage/persistence'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  autoPlayOnChange: boolean
  onAutoPlayOnChangeToggle: (next: boolean) => void
  jsonExportMode: JsonExportMode
  onJsonExportModeChange: (mode: JsonExportMode) => void
  onExportLibrary: () => void
  onImportLibrary: (file: File) => void
  onClearAllData: () => void
}

export function SettingsModal({
  isOpen,
  onClose,
  autoPlayOnChange,
  onAutoPlayOnChangeToggle,
  jsonExportMode,
  onJsonExportModeChange,
  onExportLibrary,
  onImportLibrary,
  onClearAllData,
}: SettingsModalProps) {
  const handleImportClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.zip,.sfx.zip,application/zip'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) onImportLibrary(file)
    }
    input.click()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-5">
        <Section title="Playback">
          <SettingRow
            label="Auto-play on parameter change"
            help="When on, dragging a slider plays the result automatically (debounced ~120ms). When off, you trigger manually with Space or the button."
            checked={autoPlayOnChange}
            onToggle={onAutoPlayOnChangeToggle}
          />
        </Section>

        <Section title="Export">
          <div className="space-y-2">
            <div>
              <div className="text-sm text-stone-200">
                Default JSON export mode for stacks
              </div>
              <div className="text-xs text-stone-500 mt-1 leading-relaxed">
                <strong>Reference</strong> — compact; layers point to library
                entries by ID. Loading requires those entries to exist.
                <br />
                <strong>Flattened</strong> — self-contained; each layer inlines
                its full sound spec. Larger but portable.
              </div>
              <div className="mt-2">
                <SegmentedControl<JsonExportMode>
                  ariaLabel="Default JSON export mode"
                  value={jsonExportMode}
                  onChange={onJsonExportModeChange}
                  size="sm"
                  options={[
                    {
                      value: 'reference',
                      label: 'Reference',
                      title: 'Compact; requires the consumer library to have referenced entries',
                    },
                    {
                      value: 'flattened',
                      label: 'Flattened',
                      title: 'Self-contained; safer for sharing across libraries',
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        </Section>

        <Section title="Library">
          <div className="flex flex-wrap gap-2">
            <ActionButton
              onClick={onExportLibrary}
              title="Download a zip of the entire library + manifest"
            >
              Export library
            </ActionButton>
            <ActionButton
              onClick={handleImportClick}
              title="Import a previously-exported library zip (append-only)"
            >
              Import library
            </ActionButton>
          </div>
        </Section>

        <Section title="Danger zone">
          <div
            style={{
              border: '1px solid #5a1f4a',
              padding: '12px',
              background: 'rgba(42, 10, 32, 0.3)',
            }}
          >
            <div style={{ fontSize: '14px', color: '#d4ecdc', marginBottom: '4px' }}>
              Clear all data
            </div>
            <div
              style={{
                fontSize: '12px',
                color: '#8fc0a0',
                marginBottom: '8px',
                lineHeight: 1.5,
              }}
            >
              Wipes the library and all settings from this browser. Cannot be
              undone — export your library first if you want to keep it.
            </div>
            <button
              type="button"
              onClick={onClearAllData}
              className="pixel"
              style={{
                background: '#1a0a14',
                border: '1px solid #ff4dcc',
                color: '#ff4dcc',
                fontSize: '9px',
                padding: '6px 12px',
                cursor: 'pointer',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                textShadow: '0 0 4px rgba(255, 77, 204, 0.5)',
              }}
            >
              Clear all data
            </button>
          </div>
        </Section>
      </div>
    </Modal>
  )
}

interface SectionProps {
  title: string
  children: React.ReactNode
}

function Section({ title, children }: SectionProps) {
  return (
    <section>
      <h3
        className="pixel"
        style={{
          fontSize: '9px',
          letterSpacing: '0.2em',
          color: '#8fc0a0',
          marginBottom: '8px',
          textTransform: 'uppercase',
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  )
}

interface SettingRowProps {
  label: string
  help?: string
  checked: boolean
  onToggle: (next: boolean) => void
}

function SettingRow({ label, help, checked, onToggle }: SettingRowProps) {
  return (
    <label style={{ display: 'block', cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '4px 0' }}>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onToggle(!checked)}
          style={{
            marginTop: '2px',
            width: 36,
            height: 20,
            background: checked ? '#0c1f15' : '#0a1410',
            border: `1px solid ${checked ? '#39ff7a' : '#1c3a26'}`,
            position: 'relative',
            flexShrink: 0,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 2,
              left: checked ? 18 : 2,
              width: 14,
              height: 14,
              background: checked ? '#39ff7a' : '#6fa180',
              boxShadow: checked
                ? '0 0 6px rgba(57, 255, 122, 0.8)'
                : 'none',
              transition: 'left 0.08s',
            }}
          />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', color: '#d4ecdc' }}>{label}</div>
          {help && (
            <div
              style={{
                fontSize: '12px',
                color: '#8fc0a0',
                marginTop: '4px',
                lineHeight: 1.5,
              }}
            >
              {help}
            </div>
          )}
        </div>
      </div>
    </label>
  )
}

function ActionButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="pixel"
      style={{
        background: '#0a1410',
        border: '1px solid #1c3a26',
        color: '#a8d8b0',
        fontSize: '9px',
        padding: '6px 12px',
        cursor: 'pointer',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </button>
  )
}
