import { ParameterRow } from '../../composite/ParameterRow'
import { SegmentedControl } from '../../primitives/SegmentedControl'
import { Slider } from '../../primitives/Slider'
import { FM_OPERATOR_EDIT_LIMITS, formatHz, formatMs, formatRatio } from '../../../format'
import type { FmOperator } from '../../../dsp/fm/types'

interface FmOperatorEditorProps {
  op: FmOperator
  onChange: <K extends keyof FmOperator>(key: K, value: FmOperator[K]) => void
}

// Single-operator editor. Shown inside the OPERATORS group, swapped via tabs.
// "Frequency" row toggles between Ratio (carrier × ratio) and Fixed (Hz).
export function FmOperatorEditor({ op, onChange }: FmOperatorEditorProps) {
  const snap2 = (v: number) => Math.round(v * 100) / 100
  const snapInt = (v: number) => Math.round(v)

  return (
    <>
      <ParameterRow label="Mode">
        <SegmentedControl<'ratio' | 'fixed'>
          ariaLabel="Operator frequency mode"
          value={op.fixed ? 'fixed' : 'ratio'}
          onChange={(v) => onChange('fixed', v === 'fixed')}
          options={[
            {
              value: 'ratio',
              label: 'Ratio',
              title: 'Operator frequency = carrier × ratio (harmonic).',
            },
            {
              value: 'fixed',
              label: 'Fixed Hz',
              title: 'Operator frequency is a fixed Hz, ignores carrier pitch (inharmonic).',
            },
          ]}
        />
      </ParameterRow>

      {op.fixed ? (
        <ParameterRow
          label="Freq"
          value={formatHz(op.fixed_freq_hz)}
          unit="Hz"
          editValue={op.fixed_freq_hz}
          onEditCommit={(v) => onChange('fixed_freq_hz', snap2(v))}
          editMin={FM_OPERATOR_EDIT_LIMITS.fixed_freq_hz?.[0]}
          editMax={FM_OPERATOR_EDIT_LIMITS.fixed_freq_hz?.[1]}
        >
          <Slider
            ariaLabel="Operator fixed frequency"
            value={op.fixed_freq_hz}
            min={1}
            max={8000}
            step={0.5}
            scale="log"
            onChange={(v) => onChange('fixed_freq_hz', snap2(v))}
          />
        </ParameterRow>
      ) : (
        <ParameterRow
          label="Ratio"
          value={op.ratio.toFixed(2)}
          editValue={op.ratio}
          onEditCommit={(v) => onChange('ratio', snap2(v))}
          editMin={FM_OPERATOR_EDIT_LIMITS.ratio?.[0]}
          editMax={FM_OPERATOR_EDIT_LIMITS.ratio?.[1]}
        >
          <Slider
            ariaLabel="Operator ratio"
            value={op.ratio}
            min={0.5}
            max={32}
            step={0.01}
            scale="log"
            onChange={(v) => onChange('ratio', snap2(v))}
          />
        </ParameterRow>
      )}

      <ParameterRow
        label="Detune"
        value={formatMs(op.detune_cents)}
        unit="¢"
        editValue={op.detune_cents}
        onEditCommit={(v) => onChange('detune_cents', snapInt(v))}
        editMin={FM_OPERATOR_EDIT_LIMITS.detune_cents?.[0]}
        editMax={FM_OPERATOR_EDIT_LIMITS.detune_cents?.[1]}
      >
        <Slider
          ariaLabel="Operator detune"
          value={op.detune_cents}
          min={-50}
          max={50}
          step={1}
          onChange={(v) => onChange('detune_cents', snapInt(v))}
        />
      </ParameterRow>

      <ParameterRow
        label="Level"
        value={formatRatio(op.level)}
        editValue={op.level}
        onEditCommit={(v) => onChange('level', snap2(v))}
        editMin={FM_OPERATOR_EDIT_LIMITS.level?.[0]}
        editMax={FM_OPERATOR_EDIT_LIMITS.level?.[1]}
      >
        <Slider
          ariaLabel="Operator level"
          value={op.level}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => onChange('level', snap2(v))}
        />
      </ParameterRow>

      <ParameterRow
        label="Attack"
        value={formatMs(op.env_attack_ms)}
        unit="ms"
        editValue={op.env_attack_ms}
        onEditCommit={(v) => onChange('env_attack_ms', snapInt(v))}
        editMin={FM_OPERATOR_EDIT_LIMITS.env_attack_ms?.[0]}
        editMax={FM_OPERATOR_EDIT_LIMITS.env_attack_ms?.[1]}
      >
        <Slider
          ariaLabel="Operator attack"
          value={op.env_attack_ms}
          min={0}
          max={2000}
          step={1}
          scale="log"
          onChange={(v) => onChange('env_attack_ms', snapInt(v))}
        />
      </ParameterRow>

      <ParameterRow
        label="Decay"
        value={formatMs(op.env_decay_ms)}
        unit="ms"
        editValue={op.env_decay_ms}
        onEditCommit={(v) => onChange('env_decay_ms', snapInt(v))}
        editMin={FM_OPERATOR_EDIT_LIMITS.env_decay_ms?.[0]}
        editMax={FM_OPERATOR_EDIT_LIMITS.env_decay_ms?.[1]}
      >
        <Slider
          ariaLabel="Operator decay"
          value={op.env_decay_ms}
          min={0}
          max={4000}
          step={1}
          scale="log"
          onChange={(v) => onChange('env_decay_ms', snapInt(v))}
        />
      </ParameterRow>

      <ParameterRow
        label="Sustain"
        value={formatRatio(op.env_sustain)}
        editValue={op.env_sustain}
        onEditCommit={(v) => onChange('env_sustain', snap2(v))}
        editMin={FM_OPERATOR_EDIT_LIMITS.env_sustain?.[0]}
        editMax={FM_OPERATOR_EDIT_LIMITS.env_sustain?.[1]}
      >
        <Slider
          ariaLabel="Operator sustain"
          value={op.env_sustain}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => onChange('env_sustain', snap2(v))}
        />
      </ParameterRow>

      <ParameterRow
        label="Release"
        value={formatMs(op.env_release_ms)}
        unit="ms"
        editValue={op.env_release_ms}
        onEditCommit={(v) => onChange('env_release_ms', snapInt(v))}
        editMin={FM_OPERATOR_EDIT_LIMITS.env_release_ms?.[0]}
        editMax={FM_OPERATOR_EDIT_LIMITS.env_release_ms?.[1]}
      >
        <Slider
          ariaLabel="Operator release"
          value={op.env_release_ms}
          min={0}
          max={4000}
          step={1}
          scale="log"
          onChange={(v) => onChange('env_release_ms', snapInt(v))}
        />
      </ParameterRow>
    </>
  )
}
