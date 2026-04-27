import { ParameterGroup } from '../../composite/ParameterGroup'
import { ParameterRow } from '../../composite/ParameterRow'
import { SegmentedControl } from '../../primitives/SegmentedControl'
import { Slider } from '../../primitives/Slider'
import { PatternPanel } from '../PatternPanel'
import {
  EDIT_LIMITS,
  formatHz,
  formatMs,
  formatRatio,
} from '../../../format'
import type {
  BodyWaveform,
  FilterType,
  NoiseType,
  PercussiveParams,
} from '../../../dsp/types'
import type { PatternConfig } from '../../../dsp/pattern/types'

interface PercussivePanelProps {
  params: PercussiveParams
  onChange: <K extends keyof PercussiveParams>(
    key: K,
    value: PercussiveParams[K],
  ) => void
  pattern: PatternConfig
  onPatternChange: (next: PatternConfig) => void
}

export function PercussivePanel({
  params,
  onChange,
  pattern,
  onPatternChange,
}: PercussivePanelProps) {
  const snapInt = (v: number) => Math.round(v)
  const snap2 = (v: number) => Math.round(v * 100) / 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <ParameterGroup title="01 · IMPULSE" accent="cyan">
        <ParameterRow label="Noise">
          <SegmentedControl<NoiseType>
            ariaLabel="Noise type"
            value={params.noise_type}
            onChange={(v) => onChange('noise_type', v)}
            options={[
              {
                value: 'white',
                label: 'White',
                title:
                  'Equal energy per Hz — bright, harsh, digital. Best for sharp clicks and ticks.',
              },
              {
                value: 'pink',
                label: 'Pink',
                title:
                  'Equal energy per octave — soft, natural, acoustic. Best for taps, pops, and natural impacts.',
              },
              {
                value: 'brown',
                label: 'Brown',
                title:
                  '-6 dB/oct, energy concentrated in the lows — heavy, rumbling. Best for weighty thuds and impacts.',
              },
            ]}
          />
        </ParameterRow>
        <ParameterRow
          label="Duration"
          value={formatMs(params.impulse_duration_ms)}
          unit="ms"
          editValue={params.impulse_duration_ms}
          onEditCommit={(v) => onChange('impulse_duration_ms', snapInt(v))}
          editMin={EDIT_LIMITS.impulse_duration_ms?.[0]}
          editMax={EDIT_LIMITS.impulse_duration_ms?.[1]}
        >
          <Slider
            ariaLabel="Impulse duration"
            value={params.impulse_duration_ms}
            min={1}
            max={50}
            step={1}
            onChange={(v) => onChange('impulse_duration_ms', v)}
          />
        </ParameterRow>
      </ParameterGroup>

      <ParameterGroup title="02 · RESONATOR" accent="amber">
        <ParameterRow label="Type">
          <SegmentedControl<FilterType>
            ariaLabel="Filter type"
            value={params.filter_type}
            onChange={(v) => onChange('filter_type', v)}
            options={[
              {
                value: 'highpass',
                label: 'HP',
                title:
                  'High-pass — removes lows, leaves brightness. Tick / snap character.',
              },
              {
                value: 'bandpass',
                label: 'BP',
                title:
                  'Band-pass — narrow band around the cutoff. Tap / tonk / metallic character.',
              },
              {
                value: 'lowpass',
                label: 'LP',
                title:
                  'Low-pass — removes highs, leaves weight. Thud / thump character.',
              },
            ]}
          />
        </ParameterRow>
        <ParameterRow
          label="Freq"
          value={formatHz(params.filter_freq_hz)}
          unit="Hz"
          editValue={params.filter_freq_hz}
          onEditCommit={(v) => onChange('filter_freq_hz', snapInt(v))}
          editMin={EDIT_LIMITS.filter_freq_hz?.[0]}
          editMax={EDIT_LIMITS.filter_freq_hz?.[1]}
        >
          <Slider
            ariaLabel="Filter frequency"
            value={params.filter_freq_hz}
            min={200}
            max={12000}
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
          editMin={EDIT_LIMITS.filter_q?.[0]}
          editMax={EDIT_LIMITS.filter_q?.[1]}
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

      <ParameterGroup title="03 · BODY" accent="magenta">
        <ParameterRow
          label="Amount"
          value={formatRatio(params.body_amount)}
          editValue={params.body_amount}
          onEditCommit={(v) => onChange('body_amount', snap2(v))}
          editMin={EDIT_LIMITS.body_amount?.[0]}
          editMax={EDIT_LIMITS.body_amount?.[1]}
        >
          <Slider
            ariaLabel="Body amount"
            value={params.body_amount}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => onChange('body_amount', snap2(v))}
          />
        </ParameterRow>
        <ParameterRow
          label="Freq"
          value={formatHz(params.body_freq_hz)}
          unit="Hz"
          editValue={params.body_freq_hz}
          onEditCommit={(v) => onChange('body_freq_hz', snapInt(v))}
          editMin={EDIT_LIMITS.body_freq_hz?.[0]}
          editMax={EDIT_LIMITS.body_freq_hz?.[1]}
        >
          <Slider
            ariaLabel="Body frequency"
            value={params.body_freq_hz}
            min={100}
            max={2000}
            step={1}
            scale="log"
            onChange={(v) => onChange('body_freq_hz', snapInt(v))}
          />
        </ParameterRow>
        <ParameterRow
          label="Decay"
          value={formatMs(params.body_decay_ms)}
          unit="ms"
          editValue={params.body_decay_ms}
          onEditCommit={(v) => onChange('body_decay_ms', snapInt(v))}
          editMin={EDIT_LIMITS.body_decay_ms?.[0]}
          editMax={EDIT_LIMITS.body_decay_ms?.[1]}
        >
          <Slider
            ariaLabel="Body decay"
            value={params.body_decay_ms}
            min={5}
            max={60}
            step={1}
            onChange={(v) => onChange('body_decay_ms', v)}
          />
        </ParameterRow>
        <ParameterRow label="Wave">
          <SegmentedControl<BodyWaveform>
            ariaLabel="Body waveform"
            value={params.body_waveform}
            onChange={(v) => onChange('body_waveform', v)}
            options={[
              {
                value: 'sine',
                label: 'Sine',
                title:
                  'Pure tone with no harmonics — clean resonance, like glass or a bell stem.',
              },
              {
                value: 'triangle',
                label: 'Tri',
                title:
                  'Soft harmonics — adds a slight metallic edge. Used for clanks and some impacts.',
              },
            ]}
          />
        </ParameterRow>
      </ParameterGroup>

      <ParameterGroup title="04 · AMP" accent="green">
        <ParameterRow
          label="Length"
          value={formatMs(params.decay_ms)}
          unit="ms"
          editValue={params.decay_ms}
          onEditCommit={(v) => onChange('decay_ms', snapInt(v))}
          editMin={EDIT_LIMITS.decay_ms?.[0]}
          editMax={EDIT_LIMITS.decay_ms?.[1]}
        >
          <Slider
            ariaLabel="Amp length"
            value={params.decay_ms}
            min={20}
            max={200}
            step={1}
            onChange={(v) => onChange('decay_ms', v)}
          />
        </ParameterRow>
        <ParameterRow
          label="Curve"
          value={formatRatio(params.decay_curve)}
          editValue={params.decay_curve}
          onEditCommit={(v) => onChange('decay_curve', snap2(v))}
          editMin={EDIT_LIMITS.decay_curve?.[0]}
          editMax={EDIT_LIMITS.decay_curve?.[1]}
        >
          <Slider
            ariaLabel="Amp curve"
            value={params.decay_curve}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => onChange('decay_curve', snap2(v))}
          />
        </ParameterRow>
        <ParameterRow
          label="Gain"
          value={formatRatio(params.gain)}
          editValue={params.gain}
          onEditCommit={(v) => onChange('gain', snap2(v))}
          editMin={EDIT_LIMITS.gain?.[0]}
          editMax={EDIT_LIMITS.gain?.[1]}
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

      <PatternPanel
        title="05 · Pattern"
        config={pattern}
        onChange={onPatternChange}
      />
    </div>
  )
}

export const PERCUSSIVE_SIGNAL_FLOW = [
  'Impulse',
  'Resonator',
  'Body',
  'Amp',
  'Out',
]
