import type { AtmosphericParams } from '../../dsp/atmospheric/types'
import type { FXConfig } from '../../dsp/fx/types'
import type { PercussiveParams, TonalParams } from '../../dsp/types'
import type { PatternConfig } from '../../dsp/pattern/types'
import {
  AtmosphericPanel,
  ATMOSPHERIC_SIGNAL_FLOW,
} from './ParameterPanel/Atmospheric'
import {
  PercussivePanel,
  PERCUSSIVE_SIGNAL_FLOW,
} from './ParameterPanel/Percussive'
import { TonalPanel, TONAL_SIGNAL_FLOW } from './ParameterPanel/Tonal'
import { FXPanel } from './FXPanel'

interface ParameterPanelProps {
  mode: 'percussive' | 'tonal' | 'atmospheric'
  percussiveParams: PercussiveParams
  tonalParams: TonalParams
  atmosphericParams: AtmosphericParams
  onPercussiveChange: <K extends keyof PercussiveParams>(
    key: K,
    value: PercussiveParams[K],
  ) => void
  onTonalChange: <K extends keyof TonalParams>(
    key: K,
    value: TonalParams[K],
  ) => void
  onAtmosphericChange: <K extends keyof AtmosphericParams>(
    key: K,
    value: AtmosphericParams[K],
  ) => void
  percussivePattern: PatternConfig
  tonalPattern: PatternConfig
  onPercussivePatternChange: (next: PatternConfig) => void
  onTonalPatternChange: (next: PatternConfig) => void
  fx: FXConfig
  onFXChange: (next: FXConfig) => void
}

export function ParameterPanel({
  mode,
  percussiveParams,
  tonalParams,
  atmosphericParams,
  onPercussiveChange,
  onTonalChange,
  onAtmosphericChange,
  percussivePattern,
  tonalPattern,
  onPercussivePatternChange,
  onTonalPatternChange,
  fx,
  onFXChange,
}: ParameterPanelProps) {
  const baseStages =
    mode === 'percussive'
      ? PERCUSSIVE_SIGNAL_FLOW
      : mode === 'tonal'
        ? TONAL_SIGNAL_FLOW
        : ATMOSPHERIC_SIGNAL_FLOW
  // FX is the second-to-last stage; insert before OUT.
  const stages = [...baseStages.slice(0, -1), 'FX', baseStages[baseStages.length - 1]]

  return (
    <div
      className="grid-bg"
      style={{ height: '100%', overflowY: 'auto', padding: '20px' }}
    >
      <div
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <SignalFlow stages={stages} />
        {mode === 'percussive' ? (
          <PercussivePanel
            params={percussiveParams}
            onChange={onPercussiveChange}
            pattern={percussivePattern}
            onPatternChange={onPercussivePatternChange}
          />
        ) : mode === 'tonal' ? (
          <TonalPanel
            params={tonalParams}
            onChange={onTonalChange}
            pattern={tonalPattern}
            onPatternChange={onTonalPatternChange}
          />
        ) : (
          <AtmosphericPanel
            params={atmosphericParams}
            onChange={onAtmosphericChange}
          />
        )}
        <FXPanel fx={fx} onChange={onFXChange} />
      </div>
    </div>
  )
}

const STAGE_COLORS: Record<string, string> = {
  SOURCES: '#4dd0ff',
  SOURCE: '#4dd0ff',
  FILTER: '#ffb84d',
  FILTERS: '#ffb84d',
  ENV: '#ff4dcc',
  ENVS: '#ff4dcc',
  ENVELOPE: '#ff4dcc',
  ENVELOPES: '#ff4dcc',
  LFO: '#a78fff',
  LFOS: '#a78fff',
  MOD: '#a78fff',
  MODULATORS: '#a78fff',
  PATTERN: '#ff7a5a',
  FX: '#a78fff',
  OUT: '#39ff7a',
  OUTPUT: '#39ff7a',
}

function SignalFlow({ stages }: { stages: string[] }) {
  return (
    <div
      className="pixel"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontSize: '8px',
        marginBottom: '8px',
        letterSpacing: '0.22em',
      }}
    >
      {stages.map((s, i) => {
        const upper = s.toUpperCase()
        const color = STAGE_COLORS[upper] ?? '#39ff7a'
        return (
          <span
            key={s}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span style={{ color }}>{upper}</span>
            {i < stages.length - 1 && (
              <span style={{ color: '#3d5a46' }}>▶</span>
            )}
          </span>
        )
      })}
    </div>
  )
}
