import { ParameterRow } from '../composite/ParameterRow'
import { PatternStepChip } from '../composite/PatternStepChip'
import { SegmentedControl } from '../primitives/SegmentedControl'
import { Slider } from '../primitives/Slider'
import { formatMs, formatRatio } from '../../format'
import type {
  PatternConfig,
  PatternDirection,
} from '../../dsp/pattern/types'
import {
  applyPatternPreset,
  detectPatternPreset,
  PATTERN_PRESET_LABELS,
  PATTERN_PRESET_ORDER,
  type PatternPresetKey,
} from '../../presets-pattern'

interface PatternPanelProps {
  title: string  // e.g. "05 · Pattern"
  config: PatternConfig
  onChange: (next: PatternConfig) => void
}

type PresetSelectValue = PatternPresetKey | 'custom'

export function PatternPanel({ title, config, onChange }: PatternPanelProps) {
  const detected = detectPatternPreset(config)
  const presetValue: PresetSelectValue = detected ?? 'custom'

  const update = (patch: Partial<PatternConfig>) => {
    onChange({ ...config, ...patch })
  }

  const handlePresetChange = (key: PresetSelectValue) => {
    if (key === 'custom') return
    onChange(applyPatternPreset(config, key))
  }

  const handleStepsChange = (newSteps: number) => {
    const steps = Math.max(1, Math.min(8, Math.round(newSteps)))
    let pitch_offsets = config.pitch_offsets.slice(0, steps)
    while (pitch_offsets.length < steps) pitch_offsets.push(0)
    update({ steps, pitch_offsets })
  }

  const handleStepOffsetChange = (idx: number, semitones: number) => {
    const pitch_offsets = config.pitch_offsets.slice()
    while (pitch_offsets.length < config.steps) pitch_offsets.push(0)
    pitch_offsets[idx] = semitones
    update({ pitch_offsets })
  }

  const presetOptions: Array<{
    value: PresetSelectValue
    label: string
    title?: string
    disabled?: boolean
  }> = [
    ...PATTERN_PRESET_ORDER.map((k) => ({
      value: k as PresetSelectValue,
      label: PATTERN_PRESET_LABELS[k],
      title: presetTooltip(k),
    })),
    {
      value: 'custom' as PresetSelectValue,
      label: 'Custom',
      disabled: true,
      title:
        'Auto-selected when the current settings don\'t match any named preset',
    },
  ]

  const summary = config.enabled
    ? detected
      ? `${config.steps} steps · ${PATTERN_PRESET_LABELS[detected]}`
      : `${config.steps} steps · custom`
    : 'off'

  return (
    <section className="panel">
      <div className="panel-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              background: '#ff7a5a',
              boxShadow: '0 0 6px #ff7a5a',
            }}
          />
          <span style={{ color: '#ff7a5a', opacity: 0.85 }}>{title.toUpperCase()}</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            className="term"
            style={{
              fontSize: '13px',
              color: config.enabled ? '#39ff7a' : '#4a7a5a',
              textTransform: 'none',
              letterSpacing: 'normal',
            }}
          >
            {summary}
          </span>
          <div className="seg-group">
            <button
              type="button"
              className={`seg-button ${!config.enabled ? 'active' : ''}`}
              onClick={() => update({ enabled: false })}
              style={{ padding: '3px 10px', fontSize: '12px' }}
            >
              OFF
            </button>
            <button
              type="button"
              className={`seg-button ${config.enabled ? 'active' : ''}`}
              onClick={() => update({ enabled: true })}
              style={{ padding: '3px 10px', fontSize: '12px' }}
            >
              ON
            </button>
          </div>
        </div>
      </div>

      {config.enabled && (
        <div
          style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <ParameterRow label="Preset">
            <SegmentedControl<PresetSelectValue>
              ariaLabel="Pattern preset"
              value={presetValue}
              onChange={handlePresetChange}
              options={presetOptions}
              size="sm"
            />
          </ParameterRow>

          <ParameterRow
            label="Steps"
            value={config.steps}
            editValue={config.steps}
            onEditCommit={(v) => handleStepsChange(v)}
            editMin={1}
            editMax={8}
          >
            <Slider
              ariaLabel="Pattern steps"
              value={config.steps}
              min={1}
              max={8}
              step={1}
              onChange={handleStepsChange}
            />
          </ParameterRow>

          <ParameterRow
            label="Interval"
            value={formatMs(config.interval_ms)}
            unit="ms"
            editValue={config.interval_ms}
            onEditCommit={(v) =>
              update({ interval_ms: Math.round(v) })
            }
            editMin={5}
            editMax={2000}
          >
            <Slider
              ariaLabel="Pattern interval"
              value={config.interval_ms}
              min={20}
              max={500}
              step={1}
              onChange={(v) => update({ interval_ms: Math.round(v) })}
            />
          </ParameterRow>

          <ParameterRow
            label="Decay"
            value={formatRatio(config.volume_decay)}
            editValue={config.volume_decay}
            onEditCommit={(v) =>
              update({ volume_decay: Math.round(v * 100) / 100 })
            }
            editMin={0}
            editMax={1}
          >
            <Slider
              ariaLabel="Pattern volume decay"
              value={config.volume_decay}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) =>
                update({ volume_decay: Math.round(v * 100) / 100 })
              }
            />
          </ParameterRow>

          <ParameterRow label="Direction">
            <SegmentedControl<PatternDirection>
              ariaLabel="Pattern direction"
              value={config.direction}
              onChange={(v) => update({ direction: v })}
              size="sm"
              options={[
                {
                  value: 'forward',
                  label: 'Fwd',
                  title: 'Play steps in order: 1 → N',
                },
                {
                  value: 'reverse',
                  label: 'Rev',
                  title: 'Play steps in reverse order: N → 1',
                },
                {
                  value: 'ping-pong',
                  label: 'PP',
                  title:
                    'Forward then reverse (apex not repeated). [a,b,c,d] → a,b,c,d,c,b,a',
                },
              ]}
            />
          </ParameterRow>

          <div style={{ marginTop: '8px' }}>
            <div
              className="pixel"
              style={{
                fontSize: '8px',
                color: '#4a7a5a',
                letterSpacing: '0.18em',
                marginBottom: '8px',
                textTransform: 'uppercase',
              }}
            >
              PITCH OFFSETS (SEMITONES)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {Array.from({ length: 8 }, (_, i) => {
                const active = i < config.steps
                const semitones =
                  i < config.pitch_offsets.length ? config.pitch_offsets[i] : 0
                return (
                  <PatternStepChip
                    key={i}
                    index={i}
                    semitones={semitones}
                    active={active}
                    onChange={(s) => handleStepOffsetChange(i, s)}
                  />
                )
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function presetTooltip(key: PatternPresetKey): string {
  switch (key) {
    case 'single':
      return 'Single trigger — equivalent to pattern off'
    case 'double':
      return 'Two quick triggers, second 70% as loud — feels like a double-tap'
    case 'triple':
      return 'Three triggers with decreasing volume — burst'
    case 'machine_gun':
      return 'Seven rapid-fire triggers at 50ms intervals — automatic-weapon feel'
    case 'octave_up':
      return 'Two triggers, second one octave higher — classic coin pickup'
    case 'major_arp':
      return 'Major arpeggio: root, major 3rd, perfect 5th, octave (0/4/7/12)'
    case 'minor_arp':
      return 'Minor arpeggio: root, minor 3rd, perfect 5th, octave (0/3/7/12)'
  }
}
