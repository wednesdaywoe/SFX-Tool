import type { CSSProperties } from 'react'

interface KeyHintProps {
  keys: string
  variant?: 'default' | 'inverted'
  style?: CSSProperties
}

export function KeyHint({ keys, style }: KeyHintProps) {
  return (
    <span className="key-hint" style={style}>
      {keys}
    </span>
  )
}
