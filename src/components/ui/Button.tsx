'use client'

import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  fullWidth?: boolean
}

export default function Button({
  variant = 'primary',
  fullWidth = false,
  className = '',
  style,
  children,
  ...props
}: ButtonProps) {
  const base: React.CSSProperties = {
    borderRadius: 'var(--radius-full)',
    padding: '10px 20px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    transition: 'opacity 0.15s, transform 0.15s',
    opacity: props.disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : undefined,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  }

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--blue)',
      color: 'white',
      border: 'none',
    },
    ghost: {
      background: 'white',
      color: 'var(--text-primary)',
      border: '0.5px solid var(--border-default)',
    },
    danger: {
      background: 'var(--coral)',
      color: 'white',
      border: 'none',
    },
  }

  return (
    <button
      {...props}
      className={`btn-hover ${className}`}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={(e) => {
        if (!props.disabled) {
          e.currentTarget.style.opacity = '0.9'
          e.currentTarget.style.transform = 'translateY(-1px)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = props.disabled ? '0.5' : '1'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {children}
    </button>
  )
}
