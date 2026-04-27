import type { CSSProperties, ReactNode } from 'react'
import { KeyHint } from './KeyHint'

export type ButtonVariant = 'trigger' | 'randomize' | 'primary' | 'secondary'

interface ButtonProps {
  variant: ButtonVariant
  onClick: () => void
  disabled?: boolean
  children: ReactNode
  shortcut?: string
  ariaLabel?: string
  title?: string
  height?: number
  fullWidth?: boolean
  pulsing?: boolean
}

/* primary is an alias for randomize (the "left rail primary action"). */
function variantStyle(
  variant: ButtonVariant,
  disabled: boolean | undefined,
): { style: CSSProperties; hintBg: string; hintBorder: string; hintColor: string } {
  if (variant === 'trigger') {
    return {
      style: {
        background: '#0a1a12',
        color: '#39ff7a',
        fontFamily: "'Silkscreen', monospace",
        fontWeight: 'bold',
        border: '2px solid #39ff7a',
        letterSpacing: '0.18em',
        boxShadow: disabled
          ? 'none'
          : '0 0 16px rgba(57, 255, 122, 0.4), inset 0 0 24px rgba(57, 255, 122, 0.12), inset 0 1px 0 rgba(57, 255, 122, 0.2)',
        textShadow: '0 0 8px rgba(57, 255, 122, 0.7)',
      },
      hintBg: '#050908',
      hintBorder: '#1c3a26',
      hintColor: '#8fc0a0',
    }
  }
  if (variant === 'randomize' || variant === 'primary') {
    return {
      style: {
        background: '#1a0a14',
        color: '#ff4dcc',
        fontFamily: "'Silkscreen', monospace",
        fontWeight: 'bold',
        border: '2px solid #ff4dcc',
        letterSpacing: '0.12em',
        boxShadow: disabled
          ? 'none'
          : '0 0 12px rgba(255, 77, 204, 0.35), inset 0 0 16px rgba(255, 77, 204, 0.1)',
        textShadow: '0 0 6px rgba(255, 77, 204, 0.6)',
      },
      hintBg: '#050908',
      hintBorder: '#5a1f4a',
      hintColor: '#ff8fdc',
    }
  }
  // secondary
  return {
    style: {
      background: '#0a1410',
      color: '#b8e0c0',
      fontFamily: "'Silkscreen', monospace",
      fontWeight: 'bold',
      letterSpacing: '0.12em',
      border: '1px solid #1c3a26',
      boxShadow:
        'inset 1px 1px 0 rgba(57, 255, 122, 0.08), inset -1px -1px 0 rgba(0,0,0,0.4)',
    },
    hintBg: '#050908',
    hintBorder: '#1c3a26',
    hintColor: '#8fc0a0',
  }
}

export function Button({
  variant,
  onClick,
  disabled,
  children,
  shortcut,
  ariaLabel,
  title,
  height,
  fullWidth,
  pulsing,
}: ButtonProps) {
  const { style, hintBg, hintBorder, hintColor } = variantStyle(variant, disabled)
  const isTrigger = variant === 'trigger'
  const fontSize = isTrigger ? '12px' : variant === 'secondary' ? '10px' : '11px'
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={pulsing && !disabled ? 'phosphor-pulse' : ''}
      style={{
        ...style,
        fontSize,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        padding: isTrigger ? '0 28px' : '12px 16px',
        height: height ?? (isTrigger ? 70 : undefined),
        width: fullWidth ? '100%' : undefined,
        display: 'flex',
        alignItems: 'center',
        justifyContent: isTrigger ? 'center' : 'space-between',
        gap: '12px',
        textTransform: 'uppercase',
        isolation: 'isolate',
        position: 'relative',
      }}
    >
      {isTrigger && <span style={{ fontSize: '20px' }}>▶</span>}
      <span>{children}</span>
      {shortcut && (
        <KeyHint
          keys={shortcut}
          style={{
            background: hintBg,
            borderColor: hintBorder,
            color: hintColor,
          }}
        />
      )}
    </button>
  )
}
