import { PatternPanel } from '../regions/PatternPanel'
import { DEFAULT_PATTERN, type PatternConfig } from '../../dsp/pattern/types'

interface LayerExpansionProps {
  layerName: string
  pattern: PatternConfig | undefined
  onChange: (next: PatternConfig | undefined) => void
}

/* Per-layer pattern editor — appears in the StackRoster below the selected
 * layer's row. Indented + phosphor-green left border indicates parent-child
 * relationship to the row above it. Like StackPatternPanel, an absent
 * pattern means the layer plays the source's own pattern (no override).
 */
export function LayerExpansion({
  layerName,
  pattern,
  onChange,
}: LayerExpansionProps) {
  const config = pattern ?? { ...DEFAULT_PATTERN, enabled: false }
  return (
    <div
      style={{
        borderLeft: '2px solid #39ff7a',
        paddingLeft: '10px',
        marginLeft: '4px',
        marginRight: '4px',
        marginBottom: '6px',
        background: '#050908',
      }}
    >
      <div
        className="pixel"
        style={{
          padding: '4px 0 6px',
          fontSize: '8px',
          color: '#6fa180',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}
      >
        LAYER PATTERN · {layerName}
      </div>
      <PatternPanel
        title="LAYER PATTERN"
        config={config}
        onChange={(next) => {
          if (!next.enabled) onChange(undefined)
          else onChange(next)
        }}
      />
    </div>
  )
}
