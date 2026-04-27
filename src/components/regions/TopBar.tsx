import { TOOL_VERSION } from '../../spec'

type Mode = 'percussive' | 'tonal' | 'atmospheric'

interface TopBarProps {
  mode: Mode
  onModeChange: (mode: Mode) => void
  onOpenSettings: () => void
  onOpenAbout: () => void
}

export function TopBar({
  mode,
  onModeChange,
  onOpenSettings,
  onOpenAbout,
}: TopBarProps) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        borderBottom: '1px solid #122418',
        background: '#050908',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: 10,
            height: 10,
            background: '#39ff7a',
            boxShadow:
              '0 0 12px rgba(57, 255, 122, 0.9), 0 0 24px rgba(57, 255, 122, 0.4)',
          }}
        />
        <span
          className="display"
          style={{
            fontSize: '18px',
            color: '#39ff7a',
            textShadow:
              '0 0 8px rgba(57, 255, 122, 0.6), 0 0 16px rgba(57, 255, 122, 0.2)',
          }}
        >
          SFX_TOOL
          <span className="blink" style={{ marginLeft: '1px' }}>
            _
          </span>
        </span>
        <span
          className="pixel"
          style={{ fontSize: '9px', color: '#4a7a5a' }}
        >
          V{TOOL_VERSION}
        </span>
      </div>

      <div style={{ display: 'flex' }}>
        <ModePill
          label="Percussive"
          active={mode === 'percussive'}
          onClick={() => onModeChange('percussive')}
          title="Short impacts: clicks, taps, thuds, clanks"
        />
        <ModePill
          label="Tonal"
          active={mode === 'tonal'}
          onClick={() => onModeChange('tonal')}
          title="Pitched/sustained sounds — laser, coin, beep, jump, whoosh, magic, electric"
        />
        <ModePill
          label="Atmospheric"
          active={mode === 'atmospheric'}
          onClick={() => onModeChange('atmospheric')}
          title="Continuous evolving textures — wind, rain, drone, glitch (v3)"
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          type="button"
          aria-label="Settings"
          title="Settings — preferences for this session"
          onClick={onOpenSettings}
          className="pixel"
          style={{
            background: 'none',
            border: 'none',
            color: '#6fa180',
            fontSize: '9px',
            cursor: 'pointer',
            letterSpacing: '0.15em',
          }}
        >
          SETTINGS
        </button>
        <button
          type="button"
          aria-label="About"
          title="About — keyboard shortcuts and tips"
          onClick={onOpenAbout}
          className="pixel"
          style={{
            background: 'none',
            border: 'none',
            color: '#6fa180',
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          ?
        </button>
      </div>
    </header>
  )
}

interface ModePillProps {
  label: string
  active: boolean
  disabled?: boolean
  soon?: boolean
  title?: string
  onClick?: () => void
}

function ModePill({
  label,
  active,
  disabled,
  soon,
  title,
  onClick,
}: ModePillProps) {
  const className = `mode-pill ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`
  return (
    <button
      type="button"
      className={className}
      title={title}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {label}
      {soon && <span className="soon">SOON</span>}
    </button>
  )
}
