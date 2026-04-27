import { Fragment } from 'react'
import { StackLayerListItem } from '../composite/StackLayerListItem'
import { LayerExpansion } from '../composite/LayerExpansion'
import type { LibraryEntry } from '../../library/types'
import type { Stack } from '../../stack/types'
import type { PatternConfig } from '../../dsp/pattern/types'
import { anyLayerSoloed } from '../../stack/operations'

interface StackRosterProps {
  stack: Stack
  library: LibraryEntry[]
  selectedLayerId: string | null
  onSelectLayer: (layerId: string) => void
  onToggleMute: (layerId: string) => void
  onToggleSolo: (layerId: string) => void
  onDeleteLayer: (layerId: string) => void
  onLayerOffsetChange: (layerId: string, offsetMs: number) => void
  onLayerGainChange: (layerId: string, gain: number) => void
  onAddLayerFromLibrary: (entryId: string) => void
  onLayerPatternChange: (
    layerId: string,
    pattern: PatternConfig | undefined,
  ) => void
  onLayerDurationChange: (layerId: string, durationMs: number) => void
}

export function StackRoster({
  stack,
  library,
  selectedLayerId,
  onSelectLayer,
  onToggleMute,
  onToggleSolo,
  onDeleteLayer,
  onLayerOffsetChange,
  onLayerGainChange,
  onAddLayerFromLibrary,
  onLayerPatternChange,
  onLayerDurationChange,
}: StackRosterProps) {
  const soloed = anyLayerSoloed(stack)

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/x-library-entry')) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    const entryId = e.dataTransfer.getData('application/x-library-entry')
    if (entryId) {
      e.preventDefault()
      onAddLayerFromLibrary(entryId)
    }
  }

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#050908',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        className="panel-header"
        style={{ background: '#0a1410', flexShrink: 0 }}
      >
        <span
          style={{
            color: '#39ff7a',
            textShadow: '0 0 6px rgba(57, 255, 122, 0.4)',
          }}
        >
          STACK ROSTER
        </span>
        <span
          className="term"
          style={{
            color: '#6fa180',
            fontSize: '13px',
            letterSpacing: 'normal',
            textTransform: 'none',
          }}
        >
          {stack.layers.length}{' '}
          {stack.layers.length === 1 ? 'layer' : 'layers'}
        </span>
      </div>

      {stack.layers.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <p
            className="term"
            style={{
              fontSize: '14px',
              color: '#6fa180',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            empty stack
            <br />
            <span style={{ color: '#3d5a46' }}>
              drag a library item here to compose
            </span>
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {stack.layers.map((layer) => {
            const sourceEntry =
              typeof layer.ref === 'string'
                ? library.find((e) => e.id === layer.ref) ?? null
                : null
            const isSelected = selectedLayerId === layer.id
            const layerName = sourceEntry?.name ?? '(missing)'
            return (
              <Fragment key={layer.id}>
                <StackLayerListItem
                  layer={layer}
                  sourceEntry={sourceEntry}
                  selected={isSelected}
                  anySoloed={soloed}
                  onSelect={() => onSelectLayer(layer.id)}
                  onToggleMute={() => onToggleMute(layer.id)}
                  onToggleSolo={() => onToggleSolo(layer.id)}
                  onDelete={() => onDeleteLayer(layer.id)}
                  onOffsetChange={(off) => onLayerOffsetChange(layer.id, off)}
                  onGainChange={(g) => onLayerGainChange(layer.id, g)}
                  onDurationChange={(ms) =>
                    onLayerDurationChange(layer.id, ms)
                  }
                />
                {isSelected && (
                  <LayerExpansion
                    layerName={layerName}
                    pattern={layer.pattern}
                    onChange={(p) => onLayerPatternChange(layer.id, p)}
                  />
                )}
              </Fragment>
            )
          })}
        </div>
      )}
    </section>
  )
}
