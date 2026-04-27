interface TimelineRulerProps {
  startMs: number
  endMs: number
  width: number
  labelLeftWidth: number
}

// Tick marks every 100ms with labels at 200ms intervals (avoid clutter).
// The trigger anchor at 0ms is drawn as an emphasised tick.
export function TimelineRuler({
  startMs,
  endMs,
  width,
  labelLeftWidth,
}: TimelineRulerProps) {
  const rangeMs = endMs - startMs
  const contentWidth = width - labelLeftWidth
  const ticks: { ms: number; left: number; major: boolean; isAnchor: boolean }[] =
    []
  const tickStepMs = 100
  const startTick = Math.ceil(startMs / tickStepMs) * tickStepMs
  for (let ms = startTick; ms <= endMs; ms += tickStepMs) {
    const left = labelLeftWidth + ((ms - startMs) / rangeMs) * contentWidth
    ticks.push({
      ms,
      left,
      major: ms % 200 === 0,
      isAnchor: ms === 0,
    })
  }

  return (
    <div
      className="timeline-ruler"
      style={{ width, flexShrink: 0 }}
    >
      <div
        className="pixel"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: labelLeftWidth,
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px',
          fontSize: '8px',
          color: '#4a7a5a',
          letterSpacing: '0.18em',
          background: '#050908',
          borderRight: '1px solid #0a1410',
        }}
      >
        STACK
      </div>
      {ticks.map((t, i) => (
        <div key={i}>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: t.left,
              width: '1px',
              height: t.isAnchor ? '100%' : t.major ? '8px' : '4px',
              background: t.isAnchor
                ? 'rgba(57, 255, 122, 0.5)'
                : t.major
                  ? '#1c3a26'
                  : '#0a1410',
            }}
          />
          {(t.major || t.isAnchor) && (
            <div
              className="term tabular"
              style={{
                position: 'absolute',
                top: 2,
                left: t.left + 4,
                fontSize: '11px',
                color: t.isAnchor ? '#39ff7a' : '#4a7a5a',
              }}
            >
              {t.ms}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
