'use client'

import { useEffect, useState } from 'react'
import { getScoreColor } from '@/lib/persona-colors'
import Label from './ui/Label'

export default function ScoreCard({ label, score }: { label: string; score?: number | null }) {
  const [filled, setFilled] = useState(false)

  useEffect(() => {
    if (score != null) {
      const t = setTimeout(() => setFilled(true), 200)
      return () => clearTimeout(t)
    }
  }, [score])

  const color = score != null ? getScoreColor(score) : 'var(--text-placeholder)'

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <Label>{label}</Label>
      <span style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1, color }}>
        {score != null ? score : '—'}
      </span>
      <div
        style={{
          width: '100%',
          height: 3,
          background: 'var(--border-subtle)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          className="score-fill"
          style={{
            height: '100%',
            borderRadius: 2,
            background: color,
            width: filled && score != null ? `${score * 10}%` : '0%',
          }}
        />
      </div>
    </div>
  )
}
