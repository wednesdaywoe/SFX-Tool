import { useState } from 'react'
import type { ReactNode } from 'react'
import { ParameterGroup } from '../../composite/ParameterGroup'
import { ParameterRow } from '../../composite/ParameterRow'
import { SegmentedControl } from '../../primitives/SegmentedControl'
import { Slider } from '../../primitives/Slider'
import {
  FM_EDIT_LIMITS,
  formatHz,
  formatMs,
  formatRatio,
  formatSignedInt,
  noteName,
} from '../../../format'
import { isCarrier } from '../../../dsp/fm/algorithms'
import type {
  FmAlgorithm,
  FmLfoTarget,
  FmOperator,
  FmParams,
} from '../../../dsp/fm/types'
import type { FilterType, LfoShape } from '../../../dsp/types'
import { FmAlgorithmPicker } from './FmAlgorithmPicker'
import { FmOperatorEditor } from './FmOperatorEditor'

type OpKey = 'op1' | 'op2' | 'op3' | 'op4'

interface FmPanelProps {
  params: FmParams
  onChange: <K extends keyof FmParams>(key: K, value: FmParams[K]) => void
}

export function FmPanel({ params, onChange }: FmPanelProps) {
  const snapInt = (v: number) => Math.round(v)
  const snap2 = (v: number) => Math.round(v * 100) / 100

  const [activeOp, setActiveOp] = useState<OpKey>('op1')
  const opIndex = OP_INDEX[activeOp]
  const opIsCarrier = isCarrier(params.algorithm, opIndex)

  const setOpField = <K extends keyof FmOperator>(
    key: K,
    value: FmOperator[K],
  ) => {
    const next: FmOperator = { ...params[activeOp], [key]: value }
    onChange(activeOp, next)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <ParameterGroup title="01 · ALGORITHM" accent="cyan">
        <FmAlgorithmPicker
          value={params.algorithm}
          onChange={(v) => onChange('algorithm', v)}
        />
        <ParameterRow
          label="FM Amt"
          value={formatRatio(params.fm_amount)}
          editValue={params.fm_amount}
          onEditCommit={(v) => onChange('fm_amount', snap2(v))}
          editMin={FM_EDIT_LIMITS.fm_amount?.[0]}
          editMax={FM_EDIT_LIMITS.fm_amount?.[1]}
        >
          <Slider
            ariaLabel="Master FM amount"
            value={params.fm_amount}
            min={0}
            max={10}
            step={0.01}
            onChange={(v) => onChange('fm_amount', snap2(v))}
          />
        </ParameterRow>
        <ParameterRow
          label="Feedback"
          value={formatRatio(params.feedback)}
          editValue={params.feedback}
          onEditCommit={(v) => onChange('feedback', snap2(v))}
          editMin={FM_EDIT_LIMITS.feedback?.[0]}
          editMax={FM_EDIT_LIMITS.feedback?.[1]}
        >
          <Slider
            ariaLabel="Op1 self-feedback"
            value={params.feedback}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => onChange('feedback', snap2(v))}
          />
        </ParameterRow>
      </ParameterGroup>

      <ParameterGroup
        title="02 · OPERATORS"
        accent="cyan"
        headerExtra={
          <span
            className="pixel"
            style={{
              fontSize: '8px',
              color: opIsCarrier ? '#4dd0ff' : '#ff4dcc',
              letterSpacing: '0.18em',
            }}
          >
            {opIsCarrier ? 'CARRIER' : 'MODULATOR'}
          </span>
        }
      >
        <OperatorTabs
          algorithm={params.algorithm}
          active={activeOp}
          onChange={setActiveOp}
        />
        <FmOperatorEditor op={params[activeOp]} onChange={setOpField} />
      </ParameterGroup>

      <ParameterGroup title="03 · PITCH" accent="magenta">
        <ParameterRow
          label="Note"
          value={formatSignedInt(params.base_pitch_semitones)}
          unit={noteName(params.base_pitch_semitones)}
          editValue={params.base_pitch_semitones}
          onEditCommit={(v) => onChange('base_pitch_semitones', snapInt(v))}
          editMin={FM_EDIT_LIMITS.base_pitch_semitones?.[0]}
          editMax={FM_EDIT_LIMITS.base_pitch_semitones?.[1]}
        >
          <Slider
            ariaLabel="Base pitch (semitones from A4)"
            value={params.base_pitch_semitones}
            min={-24}
            max={24}
            step={1}
            onChange={(v) => onChange('base_pitch_semitones', snapInt(v))}
          />
        </ParameterRow>

        <SubGroupHeader>pitch envelope</SubGroupHeader>
        <ParameterRow
          label="Amount"
          value={formatRatio(params.pitch_env_amount_oct)}
          unit="oct"
          editValue={params.pitch_env_amount_oct}
          onEditCommit={(v) => onChange('pitch_env_amount_oct', snap2(v))}
          editMin={FM_EDIT_LIMITS.pitch_env_amount_oct?.[0]}
          editMax={FM_EDIT_LIMITS.pitch_env_amount_oct?.[1]}
        >
          <Slider
            ariaLabel="Pitch envelope amount"
            value={params.pitch_env_amount_oct}
            min={-2}
            max={2}
            step={0.01}
            onChange={(v) => onChange('pitch_env_amount_oct', snap2(v))}
          />
        </ParameterRow>
        <ParameterRow
          label="Attack"
          value={formatMs(params.pitch_env_attack_ms)}
          unit="ms"
          editValue={params.pitch_env_attack_ms}
          onEditCommit={(v) => onChange('pitch_env_attack_ms', snapInt(v))}
          editMin={FM_EDIT_LIMITS.pitch_env_attack_ms?.[0]}
          editMax={FM_EDIT_LIMITS.pitch_env_attack_ms?.[1]}
        >
          <Slider
            ariaLabel="Pitch envelope attack"
            value={params.pitch_env_attack_ms}
            min={0}
            max={500}
            step={1}
            onChange={(v) => onChange('pitch_env_attack_ms', snapInt(v))}
          />
        </ParameterRow>
        <ParameterRow
          label="Decay"
          value={formatMs(params.pitch_env_decay_ms)}
          unit="ms"
          editValue={params.pitch_env_decay_ms}
          onEditCommit={(v) => onChange('pitch_env_decay_ms', snapInt(v))}
          editMin={FM_EDIT_LIMITS.pitch_env_decay_ms?.[0]}
          editMax={FM_EDIT_LIMITS.pitch_env_decay_ms?.[1]}
        >
          <Slider
            ariaLabel="Pitch envelope decay"
            value={params.pitch_env_decay_ms}
            min={5}
            max={1000}
            step={1}
            scale="log"
            onChange={(v) => onChange('pitch_env_decay_ms', snapInt(v))}
          />
        </ParameterRow>
      </ParameterGroup>

      <ParameterGroup title="04 · FILTER" accent="amber">
        <ParameterRow label="Type">
          <SegmentedControl<FilterType>
            ariaLabel="Filter type"
            value={params.filter_type}
            onChange={(v) => onChange('filter_type', v)}
            options={[
              { value: 'highpass', label: 'HP', title: 'High-pass — removes lows.' },
              { value: 'bandpass', label: 'BP', title: 'Band-pass — narrow band around cutoff.' },
              { value: 'lowpass', label: 'LP', title: 'Low-pass — removes highs.' },
            ]}
          />
        </ParameterRow>
        <ParameterRow
          label="Freq"
          value={formatHz(params.filter_freq_hz)}
          unit="Hz"
          editValue={params.filter_freq_hz}
          onEditCommit={(v) => onChange('filter_freq_hz', snapInt(v))}
          editMin={FM_EDIT_LIMITS.filter_freq_hz?.[0]}
          editMax={FM_EDIT_LIMITS.filter_freq_hz?.[1]}
        >
          <Slider
            ariaLabel="Filter frequency"
            value={params.filter_freq_hz}
            min={100}
            max={16000}
            step={1}
            scale="log"
            onChange={(v) => onChange('filter_freq_hz', snapInt(v))}
          />
        </ParameterRow>
        <ParameterRow
          label="Q"
          value={formatRatio(params.filter_q)}
          editValue={params.filter_q}
          onEditCommit={(v) => onChange('filter_q', snap2(v))}
          editMin={FM_EDIT_LIMITS.filter_q?.[0]}
          editMax={FM_EDIT_LIMITS.filter_q?.[1]}
        >
          <Slider
            ariaLabel="Filter Q"
            value={params.filter_q}
            min={0.5}
            max={20}
            step={0.05}
            scale="log"
            onChange={(v) => onChange('filter_q', snap2(v))}
          />
        </ParameterRow>
      </ParameterGroup>

      <ParameterGroup title="05 · AMP ENV" accent="magenta">
        <ParameterRow
          label="Attack"
          value={formatMs(params.amp_attack_ms)}
          unit="ms"
          editValue={params.amp_attack_ms}
          onEditCommit={(v) => onChange('amp_attack_ms', snapInt(v))}
          editMin={FM_EDIT_LIMITS.amp_attack_ms?.[0]}
          editMax={FM_EDIT_LIMITS.amp_attack_ms?.[1]}
        >
          <Slider
            ariaLabel="Amp attack"
            value={params.amp_attack_ms}
            min={0}
            max={500}
            step={1}
            onChange={(v) => onChange('amp_attack_ms', snapInt(v))}
          />
        </ParameterRow>
        <ParameterRow
          label="Decay"
          value={formatMs(params.amp_decay_ms)}
          unit="ms"
          editValue={params.amp_decay_ms}
          onEditCommit={(v) => onChange('amp_decay_ms', snapInt(v))}
          editMin={FM_EDIT_LIMITS.amp_decay_ms?.[0]}
          editMax={FM_EDIT_LIMITS.amp_decay_ms?.[1]}
        >
          <Slider
            ariaLabel="Amp decay"
            value={params.amp_decay_ms}
            min={5}
            max={1000}
            step={1}
            scale="log"
            onChange={(v) => onChange('amp_decay_ms', snapInt(v))}
          />
        </ParameterRow>
        <ParameterRow
          label="Sustain"
          value={formatRatio(params.amp_sustain)}
          editValue={params.amp_sustain}
          onEditCommit={(v) => onChange('amp_sustain', snap2(v))}
          editMin={FM_EDIT_LIMITS.amp_sustain?.[0]}
          editMax={FM_EDIT_LIMITS.amp_sustain?.[1]}
        >
          <Slider
            ariaLabel="Amp sustain"
            value={params.amp_sustain}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => onChange('amp_sustain', snap2(v))}
          />
        </ParameterRow>
        <ParameterRow
          label="Release"
          value={formatMs(params.amp_release_ms)}
          unit="ms"
          editValue={params.amp_release_ms}
          onEditCommit={(v) => onChange('amp_release_ms', snapInt(v))}
          editMin={FM_EDIT_LIMITS.amp_release_ms?.[0]}
          editMax={FM_EDIT_LIMITS.amp_release_ms?.[1]}
        >
          <Slider
            ariaLabel="Amp release"
            value={params.amp_release_ms}
            min={5}
            max={2000}
            step={1}
            scale="log"
            onChange={(v) => onChange('amp_release_ms', snapInt(v))}
          />
        </ParameterRow>
      </ParameterGroup>

      <ParameterGroup title="06 · LFO" accent="lavender">
        <ParameterRow
          label="Rate"
          value={params.lfo_rate_hz.toFixed(2)}
          unit="Hz"
          editValue={params.lfo_rate_hz}
          onEditCommit={(v) => onChange('lfo_rate_hz', snap2(v))}
          editMin={FM_EDIT_LIMITS.lfo_rate_hz?.[0]}
          editMax={FM_EDIT_LIMITS.lfo_rate_hz?.[1]}
        >
          <Slider
            ariaLabel="LFO rate"
            value={params.lfo_rate_hz}
            min={0.1}
            max={20}
            step={0.05}
            scale="log"
            onChange={(v) => onChange('lfo_rate_hz', snap2(v))}
          />
        </ParameterRow>
        <ParameterRow
          label="Depth"
          value={formatRatio(params.lfo_depth)}
          editValue={params.lfo_depth}
          onEditCommit={(v) => onChange('lfo_depth', snap2(v))}
          editMin={FM_EDIT_LIMITS.lfo_depth?.[0]}
          editMax={FM_EDIT_LIMITS.lfo_depth?.[1]}
        >
          <Slider
            ariaLabel="LFO depth"
            value={params.lfo_depth}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => onChange('lfo_depth', snap2(v))}
          />
        </ParameterRow>
        <ParameterRow label="Shape">
          <SegmentedControl<LfoShape>
            ariaLabel="LFO shape"
            value={params.lfo_shape}
            onChange={(v) => onChange('lfo_shape', v)}
            options={[
              { value: 'sine', label: 'Sine', title: 'Smooth wobble.' },
              { value: 'triangle', label: 'Tri', title: 'Linear ramp up and down.' },
              { value: 'square', label: 'Sq', title: 'Hard switch — stepped/gated effect.' },
            ]}
          />
        </ParameterRow>
        <ParameterRow label="Target">
          <SegmentedControl<FmLfoTarget>
            ariaLabel="LFO target"
            value={params.lfo_target}
            onChange={(v) => onChange('lfo_target', v)}
            options={[
              { value: 'off', label: 'Off', title: 'LFO disabled.' },
              { value: 'pitch', label: 'Pitch', title: 'Vibrato to FM-like wobble.' },
              { value: 'fm', label: 'FM', title: 'Modulates master FM amount — timbre wobble.' },
              { value: 'filter', label: 'Filter', title: 'Wah-wah to harsh modulation.' },
              { value: 'amp', label: 'Amp', title: 'Tremolo to amplitude modulation.' },
            ]}
          />
        </ParameterRow>
      </ParameterGroup>

      <ParameterGroup title="07 · OUTPUT" accent="green">
        <ParameterRow
          label="Gain"
          value={formatRatio(params.gain)}
          editValue={params.gain}
          onEditCommit={(v) => onChange('gain', snap2(v))}
          editMin={FM_EDIT_LIMITS.gain?.[0]}
          editMax={FM_EDIT_LIMITS.gain?.[1]}
        >
          <Slider
            ariaLabel="Output gain"
            value={params.gain}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => onChange('gain', snap2(v))}
          />
        </ParameterRow>
      </ParameterGroup>
    </div>
  )
}

const OP_INDEX: Record<OpKey, number> = { op1: 1, op2: 2, op3: 3, op4: 4 }
const OP_KEYS: readonly OpKey[] = ['op1', 'op2', 'op3', 'op4']

interface OperatorTabsProps {
  algorithm: FmAlgorithm
  active: OpKey
  onChange: (next: OpKey) => void
}

// Custom tab strip — 4 buttons, one per operator. The dot before each label
// reflects this op's role under the *current* algorithm: cyan = carrier,
// pink = modulator. So changing algorithms recolors the dots without
// changing the active tab.
function OperatorTabs({ algorithm, active, onChange }: OperatorTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Operator selection"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '4px',
      }}
    >
      {OP_KEYS.map((key) => {
        const idx = OP_INDEX[key]
        const carrier = isCarrier(algorithm, idx)
        const dotColor = carrier ? '#4dd0ff' : '#ff4dcc'
        const selected = key === active
        return (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onChange(key)}
            className={`seg-button ${selected ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '6px',
            }}
            title={`Operator ${idx} — ${carrier ? 'carrier' : 'modulator'}`}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                background: dotColor,
                boxShadow: `0 0 4px ${dotColor}`,
              }}
            />
            <span className="tabular" style={{ fontSize: '12px' }}>
              OP{idx}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function SubGroupHeader({ children }: { children: ReactNode }) {
  return (
    <div
      className="pixel"
      style={{
        fontSize: '8px',
        color: '#6fa180',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        marginTop: '6px',
        marginBottom: '2px',
      }}
    >
      {children}
    </div>
  )
}

export const FM_SIGNAL_FLOW = [
  'Algorithm',
  'Operators',
  'Filter',
  'Envelopes',
  'LFO',
  'Out',
]
