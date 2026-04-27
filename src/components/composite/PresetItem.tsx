import { KeyHint } from '../primitives/KeyHint'

interface PresetItemProps {
  label: string
  selected: boolean
  shortcut: string
  description?: string
  onClick: () => void
}

export function PresetItem({
  label,
  selected,
  shortcut,
  description,
  onClick,
}: PresetItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      title={description}
      className={`preset-item ${selected ? 'active' : ''}`}
    >
      <span className="preset-dot" aria-hidden="true" />
      <span style={{ flex: 1 }}>{label}</span>
      <KeyHint keys={shortcut} />
    </button>
  )
}
