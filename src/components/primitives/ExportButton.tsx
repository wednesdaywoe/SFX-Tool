interface ExportButtonProps {
  label: string
  shortcut: string
  onClick: () => void
  disabled?: boolean
  title?: string
}

export function ExportButton({
  label,
  shortcut,
  onClick,
  disabled,
  title,
}: ExportButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      className="export-btn"
    >
      <span className="label">{label}</span>
      <span className="hint">{shortcut}</span>
    </button>
  )
}
