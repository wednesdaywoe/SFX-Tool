import { useCallback, useRef } from 'react'

export type SliderScale = 'linear' | 'log'

interface SliderProps {
  value: number
  min: number
  max: number
  step?: number
  scale?: SliderScale
  onChange: (value: number) => void
  disabled?: boolean
  ariaLabel: string
}

function valueToProgress(
  value: number,
  min: number,
  max: number,
  scale: SliderScale,
): number {
  const clamped = Math.max(min, Math.min(max, value))
  if (scale === 'log') {
    return (
      (Math.log(clamped) - Math.log(min)) / (Math.log(max) - Math.log(min))
    )
  }
  return (clamped - min) / (max - min)
}

function progressToValue(
  progress: number,
  min: number,
  max: number,
  scale: SliderScale,
): number {
  const p = Math.max(0, Math.min(1, progress))
  if (scale === 'log') {
    return Math.exp(Math.log(min) + p * (Math.log(max) - Math.log(min)))
  }
  return min + p * (max - min)
}

function snap(value: number, step: number, min: number, max: number): number {
  const snapped = Math.round((value - min) / step) * step + min
  return Math.max(min, Math.min(max, snapped))
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  scale = 'linear',
  onChange,
  disabled,
  ariaLabel,
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const draggingRef = useRef(false)

  const progress = valueToProgress(value, min, max, scale)

  const setFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track) return
      const rect = track.getBoundingClientRect()
      const p = (clientX - rect.left) / rect.width
      const raw = progressToValue(p, min, max, scale)
      onChange(snap(raw, step, min, max))
    },
    [min, max, scale, step, onChange],
  )

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return
    e.preventDefault()
    const target = e.currentTarget as HTMLDivElement
    target.focus()
    target.setPointerCapture(e.pointerId)
    draggingRef.current = true
    setFromClientX(e.clientX)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    setFromClientX(e.clientX)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false
    ;(e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    const multiplier = e.shiftKey ? 10 : 1
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      onChange(snap(value - step * multiplier, step, min, max))
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      onChange(snap(value + step * multiplier, step, min, max))
    } else if (e.key === 'Home') {
      e.preventDefault()
      onChange(min)
    } else if (e.key === 'End') {
      e.preventDefault()
      onChange(max)
    }
  }

  const fillPct = `${(progress * 100).toFixed(2)}%`

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-disabled={disabled || undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
      className={`slider-track ${disabled ? 'opacity-40 cursor-not-allowed' : ''} focus:outline-none`}
      style={{ outline: 'none' }}
    >
      <div className="slider-fill" style={{ width: fillPct }} />
      <div className="slider-thumb" style={{ left: fillPct }} />
    </div>
  )
}
