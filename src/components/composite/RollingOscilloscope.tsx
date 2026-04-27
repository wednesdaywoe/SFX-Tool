import { useEffect, useRef } from 'react'

interface RollingOscilloscopeProps {
  analyser: AnalyserNode | null
  width: number
  height: number
}

/* Real-time oscilloscope for atmospheric playback. Reads time-domain samples
 * from an AnalyserNode at ~60Hz, draws a phosphor-green polyline.
 * Last-N-samples view (no leftward translation — simpler than scrolling and
 * reads the same way perceptually for continuous textures).
 */
export function RollingOscilloscope({
  analyser,
  width,
  height,
}: RollingOscilloscopeProps) {
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

    let raf = 0
    const data = new Float32Array(analyser?.fftSize ?? 2048)
    const mid = height / 2

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      // Centerline
      ctx.strokeStyle = 'rgba(28, 58, 38, 0.6)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, mid)
      ctx.lineTo(width, mid)
      ctx.stroke()

      if (analyser) {
        analyser.getFloatTimeDomainData(data)
        const stride = data.length / width

        // Two-pass: dim under-pass + bright top-pass for the phosphor glow look.
        const drawLine = (color: string, lineWidth: number) => {
          ctx.strokeStyle = color
          ctx.lineWidth = lineWidth
          ctx.beginPath()
          for (let x = 0; x < width; x++) {
            const sample = data[Math.floor(x * stride)] || 0
            const y = mid - sample * mid * 0.95
            if (x === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.stroke()
        }
        drawLine('rgba(57, 255, 122, 0.45)', 1.5)
        drawLine('rgba(57, 255, 122, 0.95)', 0.75)
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [analyser, width, height])

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, display: 'block' }}
    />
  )
}
