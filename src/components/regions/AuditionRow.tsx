import { Button } from '../primitives/Button'
import { ExportButton } from '../primitives/ExportButton'
import { SegmentedControl } from '../primitives/SegmentedControl'
import { WaveformDisplay } from '../composite/WaveformDisplay'
import { RollingOscilloscope } from '../composite/RollingOscilloscope'
import { StackPatternPanel } from './StackPatternPanel'
import { StackTimeline, timelineHeightFor } from './StackTimeline'
import type { LibraryEntry } from '../../library/types'
import type { Stack } from '../../stack/types'
import type { PatternConfig } from '../../dsp/pattern/types'

export type TriggerSource = 'source' | 'stack'

interface AuditionRowProps {
  triggerSource: TriggerSource
  onTriggerSourceChange: (next: TriggerSource) => void
  stack: Stack
  library: LibraryEntry[]
  selectedLayerId: string | null
  onSelectLayer: (layerId: string) => void
  onLayerOffsetChange: (layerId: string, offsetMs: number) => void
  onLayerGainChange: (layerId: string, gain: number) => void
  onAddLayerFromLibrary: (entryId: string, offsetMs: number) => void
  onToggleLayerMute: (layerId: string) => void
  onToggleLayerSolo: (layerId: string) => void

  // Source-mode display
  buffer: AudioBuffer | null
  durationLabel: string
  presetLabel: string
  playheadProgress: number
  isPlaying: boolean

  // Atmospheric mode (live playback)
  mode: 'percussive' | 'tonal' | 'fm' | 'atmospheric'
  atmosphericPlaying: boolean
  atmosphericAnalyser: AnalyserNode | null
  onAtmosphericToggle: () => void

  // Stack-level pattern (only used when triggerSource === 'stack')
  stackPattern: PatternConfig | undefined
  onStackPatternChange: (next: PatternConfig | undefined) => void

  onTrigger: () => void
  onSave?: () => void
  onExportWav?: () => void
  onExportJson?: () => void
}

const WAVE_WIDTH = 480
const WAVE_HEIGHT = 88

export function AuditionRow({
  triggerSource,
  onTriggerSourceChange,
  stack,
  library,
  selectedLayerId,
  onSelectLayer,
  onLayerOffsetChange,
  onLayerGainChange,
  onAddLayerFromLibrary,
  onToggleLayerMute,
  onToggleLayerSolo,
  buffer,
  durationLabel,
  presetLabel,
  playheadProgress,
  isPlaying,
  mode,
  atmosphericPlaying,
  atmosphericAnalyser,
  onAtmosphericToggle,
  stackPattern,
  onStackPatternChange,
  onTrigger,
  onSave,
  onExportWav,
  onExportJson,
}: AuditionRowProps) {
  const stackEmpty = stack.layers.length === 0
  const showStackView = triggerSource === 'stack'
  const showAtmosphericView =
    !showStackView && mode === 'atmospheric'
  const stackHeight = timelineHeightFor(stack.layers.length)
  const rowHeight = showStackView ? stackHeight : WAVE_HEIGHT + 16

  return (
    <section
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: '12px',
        padding: '12px 16px',
        borderBottom: '1px solid #122418',
        background: '#050908',
        minHeight: rowHeight,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          width: 170,
          flexShrink: 0,
          justifyContent: 'flex-start',
        }}
      >
        <span
          className="pixel"
          style={{
            fontSize: '8px',
            color: '#6fa180',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          TRIGGER PLAYS
        </span>
        <SegmentedControl<TriggerSource>
          ariaLabel="Trigger source"
          value={triggerSource}
          onChange={onTriggerSourceChange}
          size="sm"
          options={[
            {
              value: 'source',
              label: 'Source',
              title:
                'Trigger plays the currently-authored sound from the parameter panel',
            },
            {
              value: 'stack',
              label: 'Stack',
              title: stackEmpty
                ? 'Stack is empty — add layers to use this'
                : 'Trigger plays the rendered stack composition',
            },
          ]}
        />
        {showStackView && (
          <div
            className="term"
            style={{
              fontSize: '13px',
              color: '#8fc0a0',
              marginTop: '2px',
            }}
          >
            {stack.layers.length} layer{stack.layers.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {showAtmosphericView ? (
        <Button
          variant="trigger"
          onClick={onAtmosphericToggle}
          shortcut="SPACE"
          ariaLabel={atmosphericPlaying ? 'Stop' : 'Play'}
          title={
            atmosphericPlaying
              ? 'Stop continuous atmospheric playback'
              : 'Start continuous atmospheric playback'
          }
          pulsing={atmosphericPlaying}
        >
          {atmosphericPlaying ? 'STOP' : 'PLAY'}
        </Button>
      ) : (
        <Button
          variant="trigger"
          onClick={onTrigger}
          shortcut="SPACE"
          ariaLabel="Trigger sound"
          title={
            showStackView
              ? 'Render and play the stack composition'
              : 'Render and play the current parameters'
          }
        >
          TRIGGER
        </Button>
      )}

      <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignSelf: 'flex-start' }}>
        <ExportButton
          label="Save"
          shortcut="S"
          onClick={onSave ?? noop}
          disabled={!onSave}
          title={
            showStackView
              ? 'Add the current stack to the library as a stack entry'
              : 'Add the current sound to the library'
          }
        />
        <ExportButton
          label="WAV"
          shortcut="⌘E"
          onClick={onExportWav ?? noop}
          disabled={!onExportWav}
          title="Download the current sound or stack as a 16-bit PCM mono WAV file"
        />
        <ExportButton
          label="JSON"
          shortcut="⌘⇧E"
          onClick={onExportJson ?? noop}
          disabled={!onExportJson}
          title="Download the current sound or stack spec as a .sfx.json file"
        />
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: showStackView ? '6px' : 0,
        }}
      >
        {showStackView && (
          <StackPatternPanel
            pattern={stackPattern}
            onChange={onStackPatternChange}
          />
        )}
        <div
          className="waveform-container"
          style={{ flex: 1, minWidth: 0, position: 'relative' }}
        >
        {showStackView ? (
          <StackTimeline
            stack={stack}
            library={library}
            selectedLayerId={selectedLayerId}
            onSelectLayer={onSelectLayer}
            onLayerOffsetChange={onLayerOffsetChange}
            onLayerGainChange={onLayerGainChange}
            onAddLayerFromLibrary={onAddLayerFromLibrary}
            onToggleMute={onToggleLayerMute}
            onToggleSolo={onToggleLayerSolo}
            height={stackHeight}
          />
        ) : showAtmosphericView ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RollingOscilloscope
              analyser={atmosphericPlaying ? atmosphericAnalyser : null}
              width={WAVE_WIDTH}
              height={WAVE_HEIGHT}
            />
            <div
              className="pixel"
              style={{
                position: 'absolute',
                top: '6px',
                left: '8px',
                fontSize: '8px',
                color: '#6fa180',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              {atmosphericPlaying ? 'LIVE · ATMOSPHERIC' : 'STOPPED'}
            </div>
            <div
              className="pixel"
              style={{
                position: 'absolute',
                bottom: '6px',
                right: '8px',
                fontSize: '8px',
                color: '#6fa180',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              {presetLabel.toUpperCase()}
            </div>
          </div>
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <WaveformDisplay
              buffer={buffer}
              width={WAVE_WIDTH}
              height={WAVE_HEIGHT}
              showPlayhead={isPlaying}
              playheadProgress={playheadProgress}
              metadata={{
                durationLabel: buffer ? durationLabel : undefined,
                presetLabel: buffer ? presetLabel.toUpperCase() : undefined,
              }}
            />
          </div>
        )}
        </div>
      </div>
    </section>
  )
}

function noop() {}
