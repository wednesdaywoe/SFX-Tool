import { Button } from '../primitives/Button'
import { SegmentedControl } from '../primitives/SegmentedControl'
import { PresetItem } from '../composite/PresetItem'
import type { MutateDistance } from '../../foraging'

export interface PresetRailItem {
  key: string
  name: string
  description: string
}

interface PresetRailProps {
  items: PresetRailItem[]
  selected: string
  onSelect: (key: string) => void
  mutateDistance: MutateDistance
  onMutateDistanceChange: (distance: MutateDistance) => void
  onRandomize?: () => void
  onMutate?: () => void
  headerLabel?: string
}

export function PresetRail({
  items,
  selected,
  onSelect,
  mutateDistance,
  onMutateDistanceChange,
  onRandomize,
  onMutate,
  headerLabel = 'PRESETS',
}: PresetRailProps) {
  return (
    <aside
      style={{
        borderRight: '1px solid #122418',
        background: '#050908',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div className="panel-header">
        <span>{headerLabel}</span>
      </div>

      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {items.map((item, i) => (
          <PresetItem
            key={item.key}
            label={item.name}
            shortcut={String(i + 1)}
            description={item.description}
            selected={selected === item.key}
            onClick={() => onSelect(item.key)}
          />
        ))}
      </nav>

      <div
        style={{
          padding: '12px',
          borderTop: '1px solid #122418',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <Button
          variant="randomize"
          fullWidth
          shortcut="R"
          onClick={onRandomize ?? noop}
          disabled={!onRandomize}
          ariaLabel="Randomize parameters within current preset"
          title="Generate a new sound by uniformly sampling each parameter within the preset's range"
        >
          RANDOMIZE
        </Button>
        <div>
          <Button
            variant="secondary"
            fullWidth
            shortcut="M"
            onClick={onMutate ?? noop}
            disabled={!onMutate}
            ariaLabel="Mutate current parameters"
            title="Nudge the current parameters by a small Gaussian — refines the current sound rather than starting fresh"
          >
            MUTATE
          </Button>
          <div style={{ marginTop: 6 }}>
            <SegmentedControl<MutateDistance>
              ariaLabel="Mutate distance"
              value={mutateDistance}
              onChange={onMutateDistanceChange}
              size="sm"
              options={[
                { value: 'S', label: 'S', title: 'Small — ~5% of each range' },
                {
                  value: 'M',
                  label: 'M',
                  title: 'Medium — ~15% of each range',
                },
                { value: 'L', label: 'L', title: 'Large — ~30% of each range' },
              ]}
            />
          </div>
        </div>
      </div>
    </aside>
  )
}

function noop() {}
