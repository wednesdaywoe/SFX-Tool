import { ALGORITHMS, ALGORITHM_ORDER } from '../../../dsp/fm/algorithms'
import type { FmAlgorithm } from '../../../dsp/fm/types'

interface FmAlgorithmPickerProps {
  value: FmAlgorithm
  onChange: (next: FmAlgorithm) => void
}

// 4×2 grid of algorithm cards. Each card shows the topology label
// (e.g. "1▸2▸3▸4"). Selected card has the green CRT accent border.
export function FmAlgorithmPicker({
  value,
  onChange,
}: FmAlgorithmPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="FM algorithm"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '6px',
      }}
    >
      {ALGORITHM_ORDER.map((id) => {
        const spec = ALGORITHMS[id]
        const selected = id === value
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(id)}
            className={`seg-button ${selected ? 'active' : ''}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '10px 4px',
              minHeight: '52px',
            }}
            title={`Algorithm ${id}: ${spec.name}`}
          >
            <span
              className="pixel"
              style={{
                fontSize: '8px',
                opacity: 0.55,
                letterSpacing: '0.18em',
              }}
            >
              ALG {id}
            </span>
            <span
              className="tabular"
              style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
            >
              {spec.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
