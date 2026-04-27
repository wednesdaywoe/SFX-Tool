import type { ReactNode } from 'react'
import { ParameterGroup } from '../../composite/ParameterGroup'
import { ParameterRow } from '../../composite/ParameterRow'
import { SegmentedControl } from '../../primitives/SegmentedControl'
import { Slider } from '../../primitives/Slider'
import {
  ATMOSPHERIC_EDIT_LIMITS,
  formatHz,
  formatMs,
  formatRatio,
  formatSignedInt,
  noteName,
} from '../../../format'
import type {
  AtmosphericFilterType,
  AtmosphericNoiseType,
  AtmosphericOscWave,
  AtmosphericParams,
  LfoShape,
  ModulationTarget,
  SlowEnvShape,
  SlowEnvTarget,
} from '../../../dsp/atmospheric/types'

interface AtmosphericPanelProps {
  params: AtmosphericParams
  onChange: <K extends keyof AtmosphericParams>(
    key: K,
    value: AtmosphericParams[K],
  ) => void
}

const NOISE_OPTIONS: { value: AtmosphericNoiseType; label: string; title: string }[] = [
  { value: 'white', label: 'WHT', title: 'White noise — equal energy per Hz, bright/harsh' },
  { value: 'pink', label: 'PNK', title: 'Pink noise — equal energy per octave, natural/wind-like' },
  { value: 'brown', label: 'BRN', title: 'Brown noise — heavy lows, rumble' },
  { value: 'blue', label: 'BLU', title: 'Blue noise — high-end shimmer, metallic' },
  { value: 'violet', label: 'VLT', title: 'Violet noise — very high content, sparkle' },
  { value: 'grey', label: 'GRY', title: 'Grey noise — psychoacoustically balanced' },
  { value: 'off', label: 'OFF', title: 'No noise (oscillator-only atmospheric)' },
]

const OSC_OPTIONS: { value: AtmosphericOscWave; label: string; title?: string }[] = [
  { value: 'sine', label: 'SIN' },
  { value: 'triangle', label: 'TRI' },
]

const FILTER_OPTIONS: {
  value: AtmosphericFilterType
  label: string
  title?: string
}[] = [
  { value: 'highpass', label: 'HP' },
  { value: 'bandpass', label: 'BP' },
  { value: 'lowpass', label: 'LP' },
]

const SLOW_ENV_SHAPE_OPTIONS: {
  value: SlowEnvShape
  label: string
  title?: string
}[] = [
  { value: 'ramp_up', label: 'UP', title: 'Linear ramp 0→1' },
  { value: 'ramp_down', label: 'DN', title: 'Linear ramp 1→0' },
  {
    value: 'hold_then_release',
    label: 'HR',
    title: 'Hold at 1 for 70%, ramp to 0 over last 30%',
  },
  {
    value: 'attack_hold_release',
    label: 'AHR',
    title: 'Attack 20%, hold 60%, release 20% — swell',
  },
]

const SLOW_ENV_TARGET_OPTIONS: {
  value: SlowEnvTarget
  label: string
  title?: string
}[] = [
  { value: 'off', label: 'OFF' },
  { value: 'amp', label: 'AMP' },
  { value: 'filter_a_freq', label: 'FA·f' },
  { value: 'filter_b_freq', label: 'FB·f' },
]

const MOD_TARGET_OPTIONS: {
  value: ModulationTarget
  label: string
  title?: string
}[] = [
  { value: 'off', label: 'OFF' },
  { value: 'amp', label: 'AMP' },
  { value: 'pitch', label: 'PCH' },
  { value: 'filter_a_freq', label: 'FA·f' },
  { value: 'filter_a_q', label: 'FA·Q' },
  { value: 'filter_b_freq', label: 'FB·f' },
  { value: 'filter_b_q', label: 'FB·Q' },
]

const LFO_SHAPE_OPTIONS: { value: LfoShape; label: string; title?: string }[] = [
  { value: 'sine', label: 'SIN' },
  { value: 'triangle', label: 'TRI' },
  { value: 'square', label: 'SQR' },
]

const OSC_COUNT_OPTIONS: { value: '0' | '1' | '2' | '3'; label: string }[] = [
  { value: '0', label: '0' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
]

export function AtmosphericPanel({ params, onChange }: AtmosphericPanelProps) {
  const snapInt = (v: number) => Math.round(v)
  const snap2 = (v: number) => Math.round(v * 100) / 100
  const snap1 = (v: number) => Math.round(v * 10) / 10

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <ParameterGroup title="01 · SOURCES" accent="cyan">
        <SubGroupHeader>noise</SubGroupHeader>
        <ParameterRow label="Type">
          <SegmentedControl<AtmosphericNoiseType>
            ariaLabel="Noise type"
            value={params.noise_type}
            onChange={(v) => onChange('noise_type', v)}
            options={NOISE_OPTIONS}
          />
        </ParameterRow>
        <ParameterRow
          label="Amount"
          value={formatRatio(params.noise_amount)}
          editValue={params.noise_amount}
          onEditCommit={(v) => onChange('noise_amount', snap2(v))}
          editMin={ATMOSPHERIC_EDIT_LIMITS.noise_amount?.[0]}
          editMax={ATMOSPHERIC_EDIT_LIMITS.noise_amount?.[1]}
        >
          <Slider
            ariaLabel="Noise amount"
            value={params.noise_amount}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => onChange('noise_amount', snap2(v))}
          />
        </ParameterRow>

        <SubGroupHeader>oscillators</SubGroupHeader>
        <ParameterRow label="Count">
          <SegmentedControl<'0' | '1' | '2' | '3'>
            ariaLabel="Oscillator count"
            value={String(params.osc_count) as '0' | '1' | '2' | '3'}
            onChange={(v) =>
              onChange('osc_count', parseInt(v, 10) as 0 | 1 | 2 | 3)
            }
            options={OSC_COUNT_OPTIONS}
          />
        </ParameterRow>
        <ParameterRow
          label="Note"
          value={formatSignedInt(params.base_pitch_semitones)}
          unit={noteName(params.base_pitch_semitones)}
          editValue={params.base_pitch_semitones}
          onEditCommit={(v) => onChange('base_pitch_semitones', snapInt(v))}
          editMin={ATMOSPHERIC_EDIT_LIMITS.base_pitch_semitones?.[0]}
          editMax={ATMOSPHERIC_EDIT_LIMITS.base_pitch_semitones?.[1]}
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

        {params.osc_count >= 1 && (
          <>
            <SubGroupHeader>osc a</SubGroupHeader>
            <ParameterRow label="Wave">
              <SegmentedControl<AtmosphericOscWave>
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
          </>
        )}

        {params.osc_count >= 2 && (
          <>
            <SubGroupHeader>osc b</SubGroupHeader>
            <ParameterRow label="Wave">
              <SegmentedControl<AtmosphericOscWave>
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
            >
              <Slider
                ariaLabel="Osc B detune (cents)"
                value={params.osc_b_detune_cents}
                min={0}
                max={50}
                step={1}
                onChange={(v) => onChange('osc_b_detune_cents', snapInt(v))}
              />
            </ParameterRow>
          </>
        )}

        {params.osc_count >= 3 && (
          <>
            <SubGroupHeader>osc c</SubGroupHeader>
            <ParameterRow label="Wave">
              <SegmentedControl<AtmosphericOscWave>
                ariaLabel="Osc C waveform"
                value={params.osc_c_wave}
                onChange={(v) => onChange('osc_c_wave', v)}
                options={OSC_OPTIONS}
              />
            </ParameterRow>
            <ParameterRow
              label="Level"
              value={formatRatio(params.osc_c_level)}
              editValue={params.osc_c_level}
              onEditCommit={(v) => onChange('osc_c_level', snap2(v))}
            >
              <Slider
                ariaLabel="Osc C level"
                value={params.osc_c_level}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => onChange('osc_c_level', snap2(v))}
              />
            </ParameterRow>
            <ParameterRow
              label="Detune"
              value={formatMs(params.osc_c_detune_cents)}
              unit="¢"
              editValue={params.osc_c_detune_cents}
              onEditCommit={(v) => onChange('osc_c_detune_cents', snapInt(v))}
            >
              <Slider
                ariaLabel="Osc C detune (cents)"
                value={params.osc_c_detune_cents}
                min={0}
                max={50}
                step={1}
                onChange={(v) => onChange('osc_c_detune_cents', snapInt(v))}
              />
            </ParameterRow>
          </>
        )}
      </ParameterGroup>

      <FilterGroup
        title="02 · FILTER A"
        prefix="a"
        params={params}
        onChange={onChange}
      />
      <FilterGroup
        title="03 · FILTER B"
        prefix="b"
        params={params}
        onChange={onChange}
      />

      <ParameterGroup title="04 · SLOW ENVELOPE" accent="magenta">
        <ParameterRow label="Shape">
          <SegmentedControl<SlowEnvShape>
            ariaLabel="Slow envelope shape"
            value={params.slow_env_shape}
            onChange={(v) => onChange('slow_env_shape', v)}
            options={SLOW_ENV_SHAPE_OPTIONS}
          />
        </ParameterRow>
        <ParameterRow
          label="Duration"
          value={params.slow_env_duration_s.toFixed(1)}
          unit="s"
          editValue={params.slow_env_duration_s}
          onEditCommit={(v) => onChange('slow_env_duration_s', snap1(v))}
          editMin={ATMOSPHERIC_EDIT_LIMITS.slow_env_duration_s?.[0]}
          editMax={ATMOSPHERIC_EDIT_LIMITS.slow_env_duration_s?.[1]}
        >
          <Slider
            ariaLabel="Slow envelope duration (seconds)"
            value={params.slow_env_duration_s}
            min={1}
            max={30}
            step={0.5}
            onChange={(v) => onChange('slow_env_duration_s', snap1(v))}
          />
        </ParameterRow>
        <ParameterRow
          label="Amount"
          value={formatRatio(params.slow_env_amount)}
          editValue={params.slow_env_amount}
          onEditCommit={(v) => onChange('slow_env_amount', snap2(v))}
          editMin={-1}
          editMax={1}
        >
          <Slider
            ariaLabel="Slow envelope amount (signed)"
            value={params.slow_env_amount}
            min={-1}
            max={1}
            step={0.01}
            onChange={(v) => onChange('slow_env_amount', snap2(v))}
          />
        </ParameterRow>
        <ParameterRow label="Target">
          <SegmentedControl<SlowEnvTarget>
            ariaLabel="Slow envelope target"
            value={params.slow_env_target}
            onChange={(v) => onChange('slow_env_target', v)}
            options={SLOW_ENV_TARGET_OPTIONS}
          />
        </ParameterRow>
      </ParameterGroup>

      <ParameterGroup title="05 · RANDOM WALKS" accent="lavender">
        <RandomWalkBlock label="rw1" prefix="rw1" params={params} onChange={onChange} />
        <RandomWalkBlock label="rw2" prefix="rw2" params={params} onChange={onChange} />
      </ParameterGroup>

      <ParameterGroup title="06 · LFOs" accent="lavender">
        <LfoBlock label="lfo1" prefix="lfo1" params={params} onChange={onChange} />
        <LfoBlock label="lfo2" prefix="lfo2" params={params} onChange={onChange} />
      </ParameterGroup>

      <DisabledPatternHint />

      <ParameterGroup title="07 · OUTPUT" accent="green">
        <ParameterRow
          label="Gain"
          value={formatRatio(params.gain)}
          editValue={params.gain}
          onEditCommit={(v) => onChange('gain', snap2(v))}
          editMin={ATMOSPHERIC_EDIT_LIMITS.gain?.[0]}
          editMax={ATMOSPHERIC_EDIT_LIMITS.gain?.[1]}
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

function FilterGroup({
  title,
  prefix,
  params,
  onChange,
}: {
  title: string
  prefix: 'a' | 'b'
  params: AtmosphericParams
  onChange: <K extends keyof AtmosphericParams>(
    key: K,
    value: AtmosphericParams[K],
  ) => void
}) {
  const typeKey = `filter_${prefix}_type` as const
  const freqKey = `filter_${prefix}_freq_hz` as const
  const qKey = `filter_${prefix}_q` as const
  const mixKey = `filter_${prefix}_mix` as const
  const snap2 = (v: number) => Math.round(v * 100) / 100
  return (
    <ParameterGroup title={title} accent="amber">
      <ParameterRow label="Type">
        <SegmentedControl<AtmosphericFilterType>
          ariaLabel={`${title} type`}
          value={params[typeKey]}
          onChange={(v) => onChange(typeKey, v)}
          options={FILTER_OPTIONS}
        />
      </ParameterRow>
      <ParameterRow
        label="Cutoff"
        value={formatHz(params[freqKey])}
        unit="Hz"
        editValue={params[freqKey]}
        onEditCommit={(v) => onChange(freqKey, Math.round(v))}
        editMin={20}
        editMax={22050}
      >
        <Slider
          ariaLabel={`${title} cutoff`}
          value={params[freqKey]}
          min={20}
          max={20000}
          step={1}
          scale="log"
          onChange={(v) => onChange(freqKey, Math.round(v))}
        />
      </ParameterRow>
      <ParameterRow
        label="Q"
        value={formatRatio(params[qKey])}
        editValue={params[qKey]}
        onEditCommit={(v) => onChange(qKey, snap2(v))}
        editMin={0.1}
        editMax={100}
      >
        <Slider
          ariaLabel={`${title} Q`}
          value={params[qKey]}
          min={0.5}
          max={20}
          step={0.1}
          onChange={(v) => onChange(qKey, snap2(v))}
        />
      </ParameterRow>
      <ParameterRow
        label="Mix"
        value={formatRatio(params[mixKey])}
        editValue={params[mixKey]}
        onEditCommit={(v) => onChange(mixKey, snap2(v))}
        editMin={0}
        editMax={2}
      >
        <Slider
          ariaLabel={`${title} mix into output`}
          value={params[mixKey]}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => onChange(mixKey, snap2(v))}
        />
      </ParameterRow>
    </ParameterGroup>
  )
}

function RandomWalkBlock({
  label,
  prefix,
  params,
  onChange,
}: {
  label: string
  prefix: 'rw1' | 'rw2'
  params: AtmosphericParams
  onChange: <K extends keyof AtmosphericParams>(
    key: K,
    value: AtmosphericParams[K],
  ) => void
}) {
  const rateKey = `${prefix}_rate_hz` as const
  const depthKey = `${prefix}_depth` as const
  const smoothKey = `${prefix}_smoothing_ms` as const
  const targetKey = `${prefix}_target` as const
  const snap2 = (v: number) => Math.round(v * 100) / 100
  return (
    <>
      <SubGroupHeader>{label}</SubGroupHeader>
      <ParameterRow
        label="Rate"
        value={formatRatio(params[rateKey])}
        unit="Hz"
        editValue={params[rateKey]}
        onEditCommit={(v) => onChange(rateKey, snap2(v))}
        editMin={0.01}
        editMax={50}
      >
        <Slider
          ariaLabel={`${label} rate`}
          value={params[rateKey]}
          min={0.05}
          max={10}
          step={0.05}
          scale="log"
          onChange={(v) => onChange(rateKey, snap2(v))}
        />
      </ParameterRow>
      <ParameterRow
        label="Depth"
        value={formatRatio(params[depthKey])}
        editValue={params[depthKey]}
        onEditCommit={(v) => onChange(depthKey, snap2(v))}
      >
        <Slider
          ariaLabel={`${label} depth`}
          value={params[depthKey]}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => onChange(depthKey, snap2(v))}
        />
      </ParameterRow>
      <ParameterRow
        label="Smooth"
        value={formatMs(params[smoothKey])}
        unit="ms"
        editValue={params[smoothKey]}
        onEditCommit={(v) => onChange(smoothKey, Math.round(v))}
        editMin={10}
        editMax={5000}
      >
        <Slider
          ariaLabel={`${label} smoothing`}
          value={params[smoothKey]}
          min={50}
          max={2000}
          step={10}
          scale="log"
          onChange={(v) => onChange(smoothKey, Math.round(v))}
        />
      </ParameterRow>
      <ParameterRow label="Target">
        <SegmentedControl<ModulationTarget>
          ariaLabel={`${label} target`}
          value={params[targetKey]}
          onChange={(v) => onChange(targetKey, v)}
          options={MOD_TARGET_OPTIONS}
        />
      </ParameterRow>
    </>
  )
}

function LfoBlock({
  label,
  prefix,
  params,
  onChange,
}: {
  label: string
  prefix: 'lfo1' | 'lfo2'
  params: AtmosphericParams
  onChange: <K extends keyof AtmosphericParams>(
    key: K,
    value: AtmosphericParams[K],
  ) => void
}) {
  const rateKey = `${prefix}_rate_hz` as const
  const depthKey = `${prefix}_depth` as const
  const shapeKey = `${prefix}_shape` as const
  const phaseKey = `${prefix}_phase_offset_deg` as const
  const targetKey = `${prefix}_target` as const
  const snap2 = (v: number) => Math.round(v * 100) / 100
  return (
    <>
      <SubGroupHeader>{label}</SubGroupHeader>
      <ParameterRow
        label="Rate"
        value={formatRatio(params[rateKey])}
        unit="Hz"
        editValue={params[rateKey]}
        onEditCommit={(v) => onChange(rateKey, snap2(v))}
        editMin={0.01}
        editMax={50}
      >
        <Slider
          ariaLabel={`${label} rate`}
          value={params[rateKey]}
          min={0.05}
          max={20}
          step={0.05}
          scale="log"
          onChange={(v) => onChange(rateKey, snap2(v))}
        />
      </ParameterRow>
      <ParameterRow
        label="Depth"
        value={formatRatio(params[depthKey])}
        editValue={params[depthKey]}
        onEditCommit={(v) => onChange(depthKey, snap2(v))}
      >
        <Slider
          ariaLabel={`${label} depth`}
          value={params[depthKey]}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => onChange(depthKey, snap2(v))}
        />
      </ParameterRow>
      <ParameterRow label="Shape">
        <SegmentedControl<LfoShape>
          ariaLabel={`${label} shape`}
          value={params[shapeKey]}
          onChange={(v) => onChange(shapeKey, v)}
          options={LFO_SHAPE_OPTIONS}
        />
      </ParameterRow>
      <ParameterRow
        label="Phase"
        value={formatMs(params[phaseKey])}
        unit="°"
        editValue={params[phaseKey]}
        onEditCommit={(v) => onChange(phaseKey, Math.round(v))}
        editMin={0}
        editMax={360}
      >
        <Slider
          ariaLabel={`${label} phase offset`}
          value={params[phaseKey]}
          min={0}
          max={360}
          step={1}
          onChange={(v) => onChange(phaseKey, Math.round(v))}
        />
      </ParameterRow>
      <ParameterRow label="Target">
        <SegmentedControl<ModulationTarget>
          ariaLabel={`${label} target`}
          value={params[targetKey]}
          onChange={(v) => onChange(targetKey, v)}
          options={MOD_TARGET_OPTIONS}
        />
      </ParameterRow>
    </>
  )
}

/* Pattern is mode-restricted to percussive/tonal — atmospheric is continuous,
 * so "trigger N times with variation" semantics don't apply. Show a disabled
 * stand-in panel rather than silently omitting it, so users searching for the
 * Pattern feature understand it's deliberately unavailable here. */
function DisabledPatternHint() {
  return (
    <div
      className="panel"
      style={{ opacity: 0.5 }}
    >
      <div
        className="panel-header"
        style={{ display: 'flex', justifyContent: 'space-between' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              background: '#ff7a5a',
              boxShadow: '0 0 6px rgba(255, 122, 90, 0.4)',
            }}
          />
          <span style={{ color: '#ff7a5a', opacity: 0.6 }}>
            05 · PATTERN
          </span>
        </span>
        <span
          className="term"
          style={{
            fontSize: '13px',
            color: '#4a7a5a',
            letterSpacing: 'normal',
            textTransform: 'none',
          }}
          title="Pattern repeats trigger N times — not applicable to continuous atmospheric textures."
        >
          not available in atmospheric
        </span>
      </div>
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

export const ATMOSPHERIC_SIGNAL_FLOW = [
  'Sources',
  'Filters',
  'Modulators',
  'Out',
]
