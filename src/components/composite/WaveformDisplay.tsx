import { useEffect, useRef } from 'react'

interface WaveformDisplayProps {
  buffer: AudioBuffer | null
  width: number
  height: number
  variant?: 'full' | 'mini'
  showPlayhead?: boolean
  playheadProgress?: number
  metadata?: {
    durationLabel?: string
    presetLabel?: string
  }
}

export function WaveformDisplay({
  buffer,
  width,
  height,
  variant = 'full',
  showPlayhead = false,
  playheadProgress = 0,
  metadata,
}: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)

    const mid = height / 2

    // Centerline — phosphor-mid against the dark waveform container.
    ctx.strokeStyle = 'rgba(28, 58, 38, 0.6)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, mid)
    ctx.lineTo(width, mid)
    ctx.stroke()

    if (!buffer) return

    // Width may be fractional from layout math (e.g., timeline tracks); floor
    // it for the peaks-per-column calculation. `new Array(non-integer)` throws.
    const cols = Math.max(0, Math.floor(width))
    if (cols === 0) return

    const samples = buffer.getChannelData(0)
    const samplesPerColumn = Math.max(1, Math.floor(samples.length / cols))

    // Compute min/max per pixel column
    const peaks: { min: number; max: number }[] = new Array(cols)
    for (let x = 0; x < cols; x++) {
      const start = x * samplesPerColumn
      const end = Math.min(samples.length, start + samplesPerColumn)
      let min = 0
      let max = 0
      for (let i = start; i < end; i++) {
        const v = samples[i]
        if (v < min) min = v
        if (v > max) max = v
      }
      peaks[x] = { min, max }
    }

    const draw = (color: string, lineWidth: number) => {
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      ctx.beginPath()
      for (let x = 0; x < cols; x++) {
        const yMax = mid - peaks[x].max * mid * 0.95
        const yMin = mid - peaks[x].min * mid * 0.95
        ctx.moveTo(x + 0.5, yMax)
        ctx.lineTo(x + 0.5, yMin)
      }
      ctx.stroke()
    }

    // Two-pass phosphor-green stroke (dim under-pass + bright top-pass).
    draw('rgba(57, 255, 122, 0.45)', variant === 'mini' ? 1 : 1.5)
    draw('rgba(57, 255, 122, 0.95)', variant === 'mini' ? 0.5 : 0.75)

    // Playhead
    if (showPlayhead && playheadProgress > 0 && playheadProgress < 1) {
      const x = playheadProgress * width
      ctx.strokeStyle = 'rgba(57, 255, 122, 0.9)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
  }, [buffer, width, height, variant, showPlayhead, playheadProgress])

  return (
    <div
      className="relative"
      style={{ width, height }}
    >
      <canvas
        ref={canvasRef}
        style={{ width, height, display: 'block' }}
      />
      {variant === 'full' && metadata && (
        <>
          {metadata.durationLabel && (
            <div
              className="pixel"
              style={{
                position: 'absolute',
                top: '6px',
                left: '8px',
                fontSize: '8px',
                color: '#6fa180',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              last triggered · {metadata.durationLabel}
            </div>
          )}
          {metadata.presetLabel && (
            <div
              className="pixel"
              style={{
                position: 'absolute',
                bottom: '6px',
                right: '8px',
                fontSize: '8px',
                color: '#6fa180',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              {metadata.presetLabel}
            </div>
          )}
        </>
      )}
    </div>
  )
}
