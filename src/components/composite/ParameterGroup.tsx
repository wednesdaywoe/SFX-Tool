import type { ReactNode } from 'react'

export type ParamGroupAccent =
  | 'cyan'
  | 'amber'
  | 'magenta'
  | 'lavender'
  | 'green'
  | 'orange'

interface ParameterGroupProps {
  title: string
  children: ReactNode
  accent?: ParamGroupAccent
  headerExtra?: ReactNode
}

const ACCENT: Record<ParamGroupAccent, { fg: string }> = {
  cyan: { fg: '#4dd0ff' },
  amber: { fg: '#ffb84d' },
  magenta: { fg: '#ff4dcc' },
  lavender: { fg: '#a78fff' },
  green: { fg: '#39ff7a' },
  orange: { fg: '#ff7a5a' },
}

export function ParameterGroup({
  title,
  children,
  accent = 'green',
  headerExtra,
}: ParameterGroupProps) {
  const c = ACCENT[accent]
  return (
    <section className="panel">
      <div className="panel-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              background: c.fg,
              boxShadow: `0 0 6px ${c.fg}`,
            }}
          />
          <span style={{ color: c.fg, opacity: 0.85 }}>{title}</span>
        </span>
        {headerExtra}
      </div>
      <div
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {children}
      </div>
    </section>
  )
}
