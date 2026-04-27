import { useRef } from 'react'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  disabled?: boolean
  soonBadge?: boolean
  title?: string
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  size?: 'sm' | 'md'
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'md',
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  const sizeStyle =
    size === 'sm'
      ? { padding: '3px 8px', fontSize: '12px' }
      : { padding: '5px 10px', fontSize: '14px' }

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const dir = e.key === 'ArrowRight' ? 1 : -1
    const enabled = options
      .map((o, i) => ({ o, i }))
      .filter((x) => !x.o.disabled)
    if (enabled.length === 0) return
    const currentEnabledIdx = enabled.findIndex((x) => x.i === index)
    const nextIdx =
      (currentEnabledIdx + dir + enabled.length) % enabled.length
    const next = enabled[nextIdx]
    onChange(next.o.value)
    const buttons = containerRef.current?.querySelectorAll('button')
    buttons?.[next.i]?.focus()
  }

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label={ariaLabel}
      className="seg-group"
    >
      {options.map((opt, i) => {
        const selected = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={opt.disabled}
            title={opt.title}
            tabIndex={selected && !opt.disabled ? 0 : -1}
            onClick={() => !opt.disabled && onChange(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={`seg-button ${selected ? 'active' : ''}`}
            style={sizeStyle}
          >
            {opt.label}
            {opt.soonBadge && (
              <span
                className="pixel"
                style={{ fontSize: '7px', marginLeft: '6px', opacity: 0.6 }}
              >
                SOON
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
