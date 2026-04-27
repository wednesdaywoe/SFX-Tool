import { ParameterGroup } from '../composite/ParameterGroup'
import { ParameterRow } from '../composite/ParameterRow'
import { FXSubsection } from '../composite/FXSubsection'
import { SegmentedControl } from '../primitives/SegmentedControl'
import { Slider } from '../primitives/Slider'
import { formatHz, formatMs, formatRatio, formatSignedInt } from '../../format'
import type {
  DistortionCurve,
  FXConfig,
  ReverbSpace,
} from '../../dsp/fx/types'

interface FXPanelProps {
  fx: FXConfig
  onChange: (next: FXConfig) => void
}

const REVERB_SPACES: { value: ReverbSpace; label: string; title?: string }[] = [
  { value: 'small_room', label: 'ROOM', title: 'Small room — tight, intimate (~0.4s)' },
  { value: 'hall', label: 'HALL', title: 'Concert hall (~2.0s)' },
  { value: 'cathedral', label: 'CATH', title: 'Cathedral — long, ethereal (~4.5s)' },
  { value: 'plate', label: 'PLATE', title: 'Plate — dense, classic studio (~1.8s)' },
  { value: 'spring', label: 'SPRG', title: 'Spring — distinctive metallic ring (~0.9s)' },
  { value: 'ambient_pad', label: 'PAD', title: 'Ambient pad — wash (~6s)' },
]

const DISTORTION_CURVES: { value: DistortionCurve; label: string; title?: string }[] = [
  { value: 'soft', label: 'SOFT', title: 'Tanh saturation — warm overdrive' },
  { value: 'hard', label: 'HARD', title: 'Hard clip — aggressive square-edge' },
  { value: 'fold', label: 'FOLD', title: 'Wave folding — complex harmonic generation' },
]

const snap2 = (v: number) => Math.round(v * 100) / 100

export function FXPanel({ fx, onChange }: FXPanelProps) {
  const setReverb = (next: Partial<FXConfig['reverb']>) =>
    onChange({ ...fx, reverb: { ...fx.reverb, ...next } })
  const setDelay = (next: Partial<FXConfig['delay']>) =>
    onChange({ ...fx, delay: { ...fx.delay, ...next } })
  const setBitcrusher = (next: Partial<FXConfig['bitcrusher']>) =>
    onChange({ ...fx, bitcrusher: { ...fx.bitcrusher, ...next } })
  const setDistortion = (next: Partial<FXConfig['distortion']>) =>
    onChange({ ...fx, distortion: { ...fx.distortion, ...next } })
  const setEq = (next: Partial<FXConfig['eq']>) =>
    onChange({ ...fx, eq: { ...fx.eq, ...next } })

  return (
    <ParameterGroup title="08 · FX" accent="lavender">
      <FXSubsection
        name="Reverb"
        enabled={fx.reverb.enabled}
        summary={
          fx.reverb.enabled
            ? `${spaceLabel(fx.reverb.space)} · ${Math.round(fx.reverb.mix * 100)}%`
            : 'off'
        }
        onEnabledChange={(v) => setReverb({ enabled: v })}
      >
        <ParameterRow label="Space">
          <SegmentedControl<ReverbSpace>
            ariaLabel="Reverb space"
            value={fx.reverb.space}
            onChange={(v) => setReverb({ space: v })}
            options={REVERB_SPACES}
            size="sm"
          />
        </ParameterRow>
        <ParameterRow
          label="Mix"
          value={formatRatio(fx.reverb.mix)}
          editValue={fx.reverb.mix}
          onEditCommit={(v) => setReverb({ mix: snap2(v) })}
          editMin={0}
          editMax={1}
        >
          <Slider
            ariaLabel="Reverb mix"
            value={fx.reverb.mix}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => setReverb({ mix: snap2(v) })}
          />
        </ParameterRow>
        <ParameterRow
          label="Pre-delay"
          value={formatMs(fx.reverb.pre_delay_ms)}
          unit="ms"
          editValue={fx.reverb.pre_delay_ms}
          onEditCommit={(v) => setReverb({ pre_delay_ms: Math.round(v) })}
          editMin={0}
          editMax={100}
        >
          <Slider
            ariaLabel="Reverb pre-delay"
            value={fx.reverb.pre_delay_ms}
            min={0}
            max={100}
            step={1}
            onChange={(v) => setReverb({ pre_delay_ms: Math.round(v) })}
          />
        </ParameterRow>
      </FXSubsection>

      <FXSubsection
        name="Delay"
        enabled={fx.delay.enabled}
        summary={
          fx.delay.enabled
            ? `${Math.round(fx.delay.time_ms)}ms · fb ${formatRatio(fx.delay.feedback)}`
            : 'off'
        }
        onEnabledChange={(v) => setDelay({ enabled: v })}
      >
        <ParameterRow
          label="Time"
          value={formatMs(fx.delay.time_ms)}
          unit="ms"
          editValue={fx.delay.time_ms}
          onEditCommit={(v) => setDelay({ time_ms: Math.round(v) })}
          editMin={1}
          editMax={2000}
        >
          <Slider
            ariaLabel="Delay time"
            value={fx.delay.time_ms}
            min={1}
            max={2000}
            step={1}
            scale="log"
            onChange={(v) => setDelay({ time_ms: Math.round(v) })}
          />
        </ParameterRow>
        <ParameterRow
          label="Feedback"
          value={formatRatio(fx.delay.feedback)}
          editValue={fx.delay.feedback}
          onEditCommit={(v) => setDelay({ feedback: snap2(v) })}
          editMin={0}
          editMax={0.95}
        >
          <Slider
            ariaLabel="Delay feedback"
            value={fx.delay.feedback}
            min={0}
            max={0.95}
            step={0.01}
            onChange={(v) => setDelay({ feedback: snap2(v) })}
          />
        </ParameterRow>
        <ParameterRow
          label="FB Tone"
          value={formatHz(fx.delay.feedback_filter_freq_hz)}
          unit="Hz"
          editValue={fx.delay.feedback_filter_freq_hz}
          onEditCommit={(v) =>
            setDelay({ feedback_filter_freq_hz: Math.round(v) })
          }
          editMin={200}
          editMax={20000}
        >
          <Slider
            ariaLabel="Delay feedback filter cutoff"
            value={fx.delay.feedback_filter_freq_hz}
            min={200}
            max={12000}
            step={1}
            scale="log"
            onChange={(v) =>
              setDelay({ feedback_filter_freq_hz: Math.round(v) })
            }
          />
        </ParameterRow>
        <ParameterRow
          label="Mix"
          value={formatRatio(fx.delay.mix)}
          editValue={fx.delay.mix}
          onEditCommit={(v) => setDelay({ mix: snap2(v) })}
          editMin={0}
          editMax={1}
        >
          <Slider
            ariaLabel="Delay mix"
            value={fx.delay.mix}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => setDelay({ mix: snap2(v) })}
          />
        </ParameterRow>
      </FXSubsection>

      <FXSubsection
        name="Bitcrusher"
        enabled={fx.bitcrusher.enabled}
        summary={
          fx.bitcrusher.enabled
            ? `${fx.bitcrusher.bit_depth}b · ÷${fx.bitcrusher.sample_rate_div}`
            : 'off'
        }
        onEnabledChange={(v) => setBitcrusher({ enabled: v })}
      >
        <ParameterRow
          label="Bits"
          value={String(fx.bitcrusher.bit_depth)}
          editValue={fx.bitcrusher.bit_depth}
          onEditCommit={(v) =>
            setBitcrusher({ bit_depth: Math.max(1, Math.min(16, Math.round(v))) })
          }
          editMin={1}
          editMax={16}
        >
          <Slider
            ariaLabel="Bit depth"
            value={fx.bitcrusher.bit_depth}
            min={1}
            max={16}
            step={1}
            onChange={(v) =>
              setBitcrusher({ bit_depth: Math.round(v) })
            }
          />
        </ParameterRow>
        <ParameterRow
          label="SR Div"
          value={String(fx.bitcrusher.sample_rate_div)}
          editValue={fx.bitcrusher.sample_rate_div}
          onEditCommit={(v) =>
            setBitcrusher({
              sample_rate_div: Math.max(1, Math.min(32, Math.round(v))),
            })
          }
          editMin={1}
          editMax={32}
        >
          <Slider
            ariaLabel="Sample rate division"
            value={fx.bitcrusher.sample_rate_div}
            min={1}
            max={32}
            step={1}
            onChange={(v) =>
              setBitcrusher({ sample_rate_div: Math.round(v) })
            }
          />
        </ParameterRow>
        <ParameterRow
          label="Mix"
          value={formatRatio(fx.bitcrusher.mix)}
          editValue={fx.bitcrusher.mix}
          onEditCommit={(v) => setBitcrusher({ mix: snap2(v) })}
          editMin={0}
          editMax={1}
        >
          <Slider
            ariaLabel="Bitcrusher mix"
            value={fx.bitcrusher.mix}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => setBitcrusher({ mix: snap2(v) })}
          />
        </ParameterRow>
      </FXSubsection>

      <FXSubsection
        name="Distortion"
        enabled={fx.distortion.enabled}
        summary={
          fx.distortion.enabled
            ? `${fx.distortion.curve} · drv ${formatRatio(fx.distortion.drive)}`
            : 'off'
        }
        onEnabledChange={(v) => setDistortion({ enabled: v })}
      >
        <ParameterRow label="Curve">
          <SegmentedControl<DistortionCurve>
            ariaLabel="Distortion curve"
            value={fx.distortion.curve}
            onChange={(v) => setDistortion({ curve: v })}
            options={DISTORTION_CURVES}
            size="sm"
          />
        </ParameterRow>
        <ParameterRow
          label="Drive"
          value={formatRatio(fx.distortion.drive)}
          editValue={fx.distortion.drive}
          onEditCommit={(v) => setDistortion({ drive: snap2(v) })}
          editMin={0}
          editMax={1}
        >
          <Slider
            ariaLabel="Distortion drive"
            value={fx.distortion.drive}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => setDistortion({ drive: snap2(v) })}
          />
        </ParameterRow>
        <ParameterRow
          label="Tone"
          value={formatHz(fx.distortion.tone_hz)}
          unit="Hz"
          editValue={fx.distortion.tone_hz}
          onEditCommit={(v) => setDistortion({ tone_hz: Math.round(v) })}
          editMin={100}
          editMax={20000}
        >
          <Slider
            ariaLabel="Distortion tone"
            value={fx.distortion.tone_hz}
            min={100}
            max={12000}
            step={1}
            scale="log"
            onChange={(v) => setDistortion({ tone_hz: Math.round(v) })}
          />
        </ParameterRow>
        <ParameterRow
          label="Mix"
          value={formatRatio(fx.distortion.mix)}
          editValue={fx.distortion.mix}
          onEditCommit={(v) => setDistortion({ mix: snap2(v) })}
          editMin={0}
          editMax={1}
        >
          <Slider
            ariaLabel="Distortion mix"
            value={fx.distortion.mix}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => setDistortion({ mix: snap2(v) })}
          />
        </ParameterRow>
      </FXSubsection>

      <FXSubsection
        name="EQ"
        enabled={fx.eq.enabled}
        summary={
          fx.eq.enabled
            ? `L${formatSignedInt(fx.eq.low_gain_db)} LM${formatSignedInt(fx.eq.low_mid_gain_db)} HM${formatSignedInt(fx.eq.high_mid_gain_db)} H${formatSignedInt(fx.eq.high_gain_db)}`
            : 'off'
        }
        onEnabledChange={(v) => setEq({ enabled: v })}
      >
        <ParameterRow
          label="Low"
          value={formatSignedInt(fx.eq.low_gain_db)}
          unit="dB"
          editValue={fx.eq.low_gain_db}
          onEditCommit={(v) => setEq({ low_gain_db: snap2(v) })}
          editMin={-24}
          editMax={24}
        >
          <Slider
            ariaLabel="EQ low (250Hz shelf)"
            value={fx.eq.low_gain_db}
            min={-12}
            max={12}
            step={0.5}
            onChange={(v) => setEq({ low_gain_db: snap2(v) })}
          />
        </ParameterRow>
        <ParameterRow
          label="Low-mid"
          value={formatSignedInt(fx.eq.low_mid_gain_db)}
          unit="dB"
          editValue={fx.eq.low_mid_gain_db}
          onEditCommit={(v) => setEq({ low_mid_gain_db: snap2(v) })}
          editMin={-24}
          editMax={24}
        >
          <Slider
            ariaLabel="EQ low-mid (600Hz peaking)"
            value={fx.eq.low_mid_gain_db}
            min={-12}
            max={12}
            step={0.5}
            onChange={(v) => setEq({ low_mid_gain_db: snap2(v) })}
          />
        </ParameterRow>
        <ParameterRow
          label="Hi-mid"
          value={formatSignedInt(fx.eq.high_mid_gain_db)}
          unit="dB"
          editValue={fx.eq.high_mid_gain_db}
          onEditCommit={(v) => setEq({ high_mid_gain_db: snap2(v) })}
          editMin={-24}
          editMax={24}
        >
          <Slider
            ariaLabel="EQ high-mid (3kHz peaking)"
            value={fx.eq.high_mid_gain_db}
            min={-12}
            max={12}
            step={0.5}
            onChange={(v) => setEq({ high_mid_gain_db: snap2(v) })}
          />
        </ParameterRow>
        <ParameterRow
          label="High"
          value={formatSignedInt(fx.eq.high_gain_db)}
          unit="dB"
          editValue={fx.eq.high_gain_db}
          onEditCommit={(v) => setEq({ high_gain_db: snap2(v) })}
          editMin={-24}
          editMax={24}
        >
          <Slider
            ariaLabel="EQ high (6kHz shelf)"
            value={fx.eq.high_gain_db}
            min={-12}
            max={12}
            step={0.5}
            onChange={(v) => setEq({ high_gain_db: snap2(v) })}
          />
        </ParameterRow>
      </FXSubsection>
    </ParameterGroup>
  )
}

function spaceLabel(space: ReverbSpace): string {
  return REVERB_SPACES.find((s) => s.value === space)?.label ?? space
}
