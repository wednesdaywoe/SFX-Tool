import type { ReactNode } from 'react'
import { ParameterGroup } from '../../composite/ParameterGroup'
import { ParameterRow } from '../../composite/ParameterRow'
import { SegmentedControl } from '../../primitives/SegmentedControl'
import { Slider } from '../../primitives/Slider'
import { PatternPanel } from '../PatternPanel'
import {
  TONAL_EDIT_LIMITS,
  formatHz,
  formatMs,
  formatRatio,
  formatSignedInt,
  noteName,
} from '../../../format'
import type {
  FilterType,
  LfoShape,
  LfoTarget,
  OscWaveform,
  TonalNoiseType,
  TonalParams,
} from '../../../dsp/types'
import type { PatternConfig } from '../../../dsp/pattern/types'

interface TonalPanelProps {
  params: TonalParams
  onChange: <K extends keyof TonalParams>(
    key: K,
    value: TonalParams[K],
  ) => void
  pattern: PatternConfig
  onPatternChange: (next: PatternConfig) => void
}

const OSC_OPTIONS: Array<{ value: OscWaveform; label: string; title: string }> =
  [
    { value: 'sine', label: 'Sine', title: 'Pure tone, no harmonics — clean.' },
    {
      value: 'triangle',
      label: 'Tri',
      title: 'Soft harmonics — slight character but still mellow.',
    },
    {
      value: 'square',
      label: 'Sq',
      title:
        'Hollow, retro game character — odd harmonics dominate. Square is the classic chiptune sound.',
    },
    {
      value: 'saw',
      label: 'Saw',
      title:
        'Bright and buzzy — full harmonic content. The brashest oscillator.',
    },
  ]

export function TonalPanel({
  params,
  onChange,
  pattern,
  onPatternChange,
}: TonalPanelProps) {
  const snapInt = (v: number) => Math.round(v)
  const snap2 = (v: number) => Math.round(v * 100) / 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <ParameterGroup title="01 · SOURCES" accent="cyan">
        <SubGroupHeader>pitch</SubGroupHeader>
        <ParameterRow
          label="Note"
          value={formatSignedInt(params.base_pitch_semitones)}
          unit={noteName(params.base_pitch_semitones)}
          editValue={params.base_pitch_semitones}
          onEditCommit={(v) => onChange('base_pitch_semitones', snapInt(v))}
          editMin={TONAL_EDIT_LIMITS.base_pitch_semitones?.[0]}
          editMax={TONAL_EDIT_LIMITS.base_pitch_semitones?.[1]}
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

        <SubGroupHeader>oscillator a</SubGroupHeader>
        <ParameterRow label="Wave">
          <SegmentedControl<OscWaveform>
            ariaLabel="Osc A waveform"
            value={params.osc_a_wave}
            onChange={(v) => onChange('osc_a_wave', v)}
            options={OSC_OPTIONS}
          />
        </ParameterRow>
        <ParameterRow
          label="Level"
          value={formatRatio(params.osc_a_level)}
          editValue={params.osc_a_level}
          onEditCommit={(v) => onChange('osc_a_level', snap2(v))}
          editMin={TONAL_EDIT_LIMITS.osc_a_level?.[0]}
          editMax={TONAL_EDIT_LIMITS.osc_a_level?.[1]}
        >
          <Slider
            ariaLabel="Osc A level"
            value={params.osc_a_level}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => onChange('osc_a_level', snap2(v))}
          />
        </ParameterRow>

        <SubGroupHeader>oscillator b</SubGroupHeader>
        <ParameterRow label="Wave">
          <SegmentedControl<OscWaveform>
            ariaLabel="Osc B waveform"
            value={params.osc_b_wave}
            onChange={(v) => onChange('osc_b_wave', v)}
            options={OSC_OPTIONS}
          />
        </ParameterRow>
        <ParameterRow
          label="Level"
          value={formatRatio(params.osc_b_level)}
          editValue={params.osc_b_level}
          onEditCommit={(v) => onChange('osc_b_level', snap2(v))}
          editMin={TONAL_EDIT_LIMITS.osc_b_level?.[0]}
          editMax={TONAL_EDIT_LIMITS.osc_b_level?.[1]}
        >
          <Slider
            ariaLabel="Osc B level"
            value={params.osc_b_level}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => onChange('osc_b_level', snap2(v))}
          />
        </ParameterRow>
        <ParameterRow
          label="Detune"
          value={formatMs(params.osc_b_detune_cents)}
          unit="¢"
          editValue={params.osc_b_detune_cents}
          onEditCommit={(v) => onChange('osc_b_detune_cents', snapInt(v))}
          editMin={TONAL_EDIT_LIMITS.osc_b_detune_cents?.[0]}
          editMax={TONAL_EDIT_LIMITS.osc_b_detune_cents?.[1]}
        >
          <Slider
            ariaLabel="Osc B detune"
            value={params.osc_b_detune_cents}
            min={0}
            max={50}
            step={1}
            onChange={(v) => onChange('osc_b_detune_cents', snapInt(v))}
          />
        </ParameterRow>

        <SubGroupHeader>sub + noise</SubGroupHeader>
        <ParameterRow
          label="Sub"
          value={formatRatio(params.sub_amount)}
          editValue={params.sub_amount}
          onEditCommit={(v) => onChange('sub_amount', snap2(v))}
          editMin={TONAL_EDIT_LIMITS.sub_amount?.[0]}
          editMax={TONAL_EDIT_LIMITS.sub_amount?.[1]}
        >
          <Slider
            ariaLabel="Sub oscillator amount"
            value={params.sub_amount}
            min={0}
            max={0.7}
            step={0.01}
            onChange={(v) => onChange('sub_amount', snap2(v))}
          />
        </ParameterRow>
        <ParameterRow label="Noise">
          <SegmentedControl<TonalNoiseType>
            ariaLabel="Noise type"
            value={params.noise_type}
            onChange={(v) => onChange('noise_type', v)}
            options={[
              { value: 'none', label: 'Off', title: 'No noise component.' },
              {
                value: 'white',
                label: 'White',
                title: 'Bright, harsh — adds grit and air.',
              },
              {
                value: 'pink',
                label: 'Pink',
                title: 'Soft, natural — adds breath without harshness.',
              },
              {
                value: 'brown',
                label: 'Brown',
                title: 'Heavy, low-concentrated — adds weight.',
              },
            ]}
          />
        </ParameterRow>
        <ParameterRow
          label="Amount"
          value={formatRatio(params.noise_amount)}
          editValue={params.noise_amount}
          onEditCommit={(v) => onChange('noise_amount', snap2(v))}
          editMin={TONAL_EDIT_LIMITS.noise_amount?.[0]}
          editMax={TONAL_EDIT_LIMITS.noise_amount?.[1]}
        >
          <Slider
            ariaLabel="Noise amount"
            value={params.noise_amount}
            min={0}
            max={0.4}
            step={0.01}
            onChange={(v) => onChange('noise_amount', snap2(v))}
          />
        </ParameterRow>
      </ParameterGroup>

      <ParameterGroup title="02 · FILTER" accent="amber">
        <ParameterRow label="Type">
          <SegmentedControl<FilterType>
            ariaLabel="Filter type"
            value={params.filter_type}
            onChange={(v) => onChange('filter_type', v)}
            options={[
              {
                value: 'highpass',
                label: 'HP',
                title: 'High-pass — removes lows, leaves brightness.',
              },
              {
                value: 'bandpass',
                label: 'BP',
                title: 'Band-pass — narrow band around the cutoff.',
              },
              {
                value: 'lowpass',
                label: 'LP',
                title: 'Low-pass — removes highs, leaves weight.',
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
          editMin={TONAL_EDIT_LIMITS.filter_freq_hz?.[0]}
          editMax={TONAL_EDIT_LIMITS.filter_freq_hz?.[1]}
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
          editMin={TONAL_EDIT_LIMITS.filter_q?.[0]}
          editMax={TONAL_EDIT_LIMITS.filter_q?.[1]}
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

      <ParameterGroup title="03 · ENVELOPES" accent="magenta">
        <SubGroupHeader>filter envelope</SubGroupHeader>
        <ParameterRow
          label="Amount"
          value={formatRatio(params.filter_env_amount)}
          editValue={params.filter_env_amount}
          onEditCommit={(v) => onChange('filter_env_amount', snap2(v))}
          editMin={TONAL_EDIT_LIMITS.filter_env_amount?.[0]}
          editMax={TONAL_EDIT_LIMITS.filter_env_amount?.[1]}
        >
          <Slider
            ariaLabel="Filter envelope amount"
            value={params.filter_env_amount}
            min={-1}
            max={1}
            step={0.01}
            onChange={(v) => onChange('filter_env_amount', snap2(v))}
          />
        </ParameterRow>
        <ParameterRow
          label="Attack"
          value={formatMs(params.filter_env_attack_ms)}
          unit="ms"
          editValue={params.filter_env_attack_ms}
          onEditCommit={(v) => onChange('filter_env_attack_ms', snapInt(v))}
          editMin={TONAL_EDIT_LIMITS.filter_env_attack_ms?.[0]}
          editMax={TONAL_EDIT_LIMITS.filter_env_attack_ms?.[1]}
        >
          <Slider
            ariaLabel="Filter envelope attack"
            value={params.filter_env_attack_ms}
            min={0}
            max={500}
            step={1}
            onChange={(v) => onChange('filter_env_attack_ms', snapInt(v))}
          />
        </ParameterRow>
        <ParameterRow
          label="Decay"
          value={formatMs(params.filter_env_decay_ms)}
          unit="ms"
          editValue={params.filter_env_decay_ms}
          onEditCommit={(v) => onChange('filter_env_decay_ms', snapInt(v))}
          editMin={TONAL_EDIT_LIMITS.filter_env_decay_ms?.[0]}
          editMax={TONAL_EDIT_LIMITS.filter_env_decay_ms?.[1]}
        >
          <Slider
            ariaLabel="Filter envelope decay"
            value={params.filter_env_decay_ms}
            min={5}
            max={1000}
            step={1}
            scale="log"
            onChange={(v) => onChange('filter_env_decay_ms', snapInt(v))}
          />
        </ParameterRow>

        <SubGroupHeader>amp envelope (adsr)</SubGroupHeader>
        <ParameterRow
          label="Attack"
          value={formatMs(params.amp_attack_ms)}
          unit="ms"
          editValue={params.amp_attack_ms}
          onEditCommit={(v) => onChange('amp_attack_ms', snapInt(v))}
          editMin={TONAL_EDIT_LIMITS.amp_attack_ms?.[0]}
          editMax={TONAL_EDIT_LIMITS.amp_attack_ms?.[1]}
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
          editMin={TONAL_EDIT_LIMITS.amp_decay_ms?.[0]}
          editMax={TONAL_EDIT_LIMITS.amp_decay_ms?.[1]}
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
          editMin={TONAL_EDIT_LIMITS.amp_sustain?.[0]}
          editMax={TONAL_EDIT_LIMITS.amp_sustain?.[1]}
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
          editMin={TONAL_EDIT_LIMITS.amp_release_ms?.[0]}
          editMax={TONAL_EDIT_LIMITS.amp_release_ms?.[1]}
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

        <SubGroupHeader>pitch envelope</SubGroupHeader>
        <ParameterRow
          label="Amount"
          value={formatRatio(params.pitch_env_amount_oct)}
          unit="oct"
          editValue={params.pitch_env_amount_oct}
          onEditCommit={(v) => onChange('pitch_env_amount_oct', snap2(v))}
          editMin={TONAL_EDIT_LIMITS.pitch_env_amount_oct?.[0]}
          editMax={TONAL_EDIT_LIMITS.pitch_env_amount_oct?.[1]}
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
          editMin={TONAL_EDIT_LIMITS.pitch_env_attack_ms?.[0]}
          editMax={TONAL_EDIT_LIMITS.pitch_env_attack_ms?.[1]}
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
          editMin={TONAL_EDIT_LIMITS.pitch_env_decay_ms?.[0]}
          editMax={TONAL_EDIT_LIMITS.pitch_env_decay_ms?.[1]}
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

      <ParameterGroup title="04 · LFO" accent="lavender">
        <ParameterRow
          label="Rate"
          value={params.lfo_rate_hz.toFixed(2)}
          unit="Hz"
          editValue={params.lfo_rate_hz}
          onEditCommit={(v) => onChange('lfo_rate_hz', snap2(v))}
          editMin={TONAL_EDIT_LIMITS.lfo_rate_hz?.[0]}
          editMax={TONAL_EDIT_LIMITS.lfo_rate_hz?.[1]}
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
          editMin={TONAL_EDIT_LIMITS.lfo_depth?.[0]}
          editMax={TONAL_EDIT_LIMITS.lfo_depth?.[1]}
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
              {
                value: 'triangle',
                label: 'Tri',
                title: 'Linear ramp up and down — slightly more pointed.',
              },
              {
                value: 'square',
                label: 'Sq',
                title: 'Hard switch — produces a stepped/gated effect.',
              },
            ]}
          />
        </ParameterRow>
        <ParameterRow label="Target">
          <SegmentedControl<LfoTarget>
            ariaLabel="LFO target"
            value={params.lfo_target}
            onChange={(v) => onChange('lfo_target', v)}
            options={[
              { value: 'off', label: 'Off', title: 'LFO disabled.' },
              {
                value: 'pitch',
                label: 'Pitch',
                title:
                  'Modulates oscillator pitch — vibrato (slow) to FM-like (fast).',
              },
              {
                value: 'filter',
                label: 'Filter',
                title:
                  'Modulates filter cutoff — wah-wah (slow) to harsh modulation (fast).',
              },
              {
                value: 'amp',
                label: 'Amp',
                title:
                  'Modulates amplitude — tremolo (slow) to amplitude modulation (fast).',
              },
            ]}
          />
        </ParameterRow>
      </ParameterGroup>

      <PatternPanel
        title="05 · Pattern"
        config={pattern}
        onChange={onPatternChange}
      />

      <ParameterGroup title="06 · OUTPUT" accent="green">
        <ParameterRow
          label="Gain"
          value={formatRatio(params.gain)}
          editValue={params.gain}
          onEditCommit={(v) => onChange('gain', snap2(v))}
          editMin={TONAL_EDIT_LIMITS.gain?.[0]}
          editMax={TONAL_EDIT_LIMITS.gain?.[1]}
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

function SubGroupHeader({ children }: { children: ReactNode }) {
  return (
    <div
      className="pixel"
      style={{
        fontSize: '8px',
        color: '#4a7a5a',
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

export const TONAL_SIGNAL_FLOW = ['Sources', 'Filter', 'Envelopes', 'LFO', 'Out']
