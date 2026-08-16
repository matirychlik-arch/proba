import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'card' | 'surface' | 'hero'
}

export default function Card({ variant = 'card', style, children, ...props }: CardProps) {
  const variants: Record<string, React.CSSProperties> = {
    card: {
      background: 'var(--bg-card)',
      border: '0.5px solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px 20px',
    },
    surface: {
      background: 'var(--bg-surface)',
      border: '0.5px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px 20px',
    },
    hero: {
      background: 'var(--bg-app)',
      borderRadius: 'var(--radius-xl)',
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
      minHeight: 160,
    },
  }

  return (
    <div {...props} style={{ ...variants[variant], ...style }}>
      {children}
    </div>
  )
}
