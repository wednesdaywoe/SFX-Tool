import { PatternPanel } from './PatternPanel'
import { DEFAULT_PATTERN, type PatternConfig } from '../../dsp/pattern/types'

interface StackPatternPanelProps {
  pattern: PatternConfig | undefined
  onChange: (next: PatternConfig | undefined) => void
}

/* Stack-level pattern UI — sits above the timeline ruler. Wraps the existing
 * PatternPanel and treats `undefined` (the absent stack.pattern field) as the
 * disabled state, so toggling OFF strips the field entirely (cleaner specs
 * on save than a config with `enabled: false`). */
export function StackPatternPanel({
  pattern,
  onChange,
}: StackPatternPanelProps) {
  const config = pattern ?? { ...DEFAULT_PATTERN, enabled: false }
  return (
    <PatternPanel
      title="STACK PATTERN"
      config={config}
      onChange={(next) => {
        // When the user toggles off, drop the entire field rather than
        // persisting `enabled: false` — keeps stack JSON minimal.
        if (!next.enabled) onChange(undefined)
        else onChange(next)
      }}
    />
  )
}
