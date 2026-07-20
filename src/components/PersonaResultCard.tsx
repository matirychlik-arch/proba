'use client'

import { useState } from 'react'
import { Persona, PersonaResult } from '@/lib/types'
import { getScoreColor } from '@/lib/persona-colors'
import PersonaAvatar from './PersonaAvatar'

export default function PersonaResultCard({
  persona,
  personaIndex,
  result,
  defaultOpen = false,
}: {
  persona: Persona
  personaIndex: number
  result: PersonaResult
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          padding: '14px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <PersonaAvatar name={persona.name} index={personaIndex} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            {persona.name}{' '}
            <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 13 }}>
              {persona.age}
            </span>
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {persona.shortDesc}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em', color: getScoreColor(result.score) }}>
            {result.score}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>
            {result.conversionProbability}% konwersji
          </div>
        </div>
        <span style={{ color: 'var(--text-placeholder)', fontSize: 12, marginLeft: 4 }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div style={{ padding: '0 20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-secondary)' }}>
            {result.reaction}
          </p>

          {result.emotionalTrigger && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Trigger:{' '}
              </span>
              {result.emotionalTrigger}
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(result.strengths ?? []).map((s, i) => (
              <span
                key={`s-${i}`}
                style={{
                  background: '#EDF7EF',
                  border: '0.5px solid #BFE0C6',
                  color: '#3D7A4A',
                  borderRadius: 'var(--radius-full)',
                  padding: '5px 14px',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                ✓ {s}
              </span>
            ))}
            {(result.risks ?? []).map((r, i) => (
              <span
                key={`r-${i}`}
                style={{
                  background: 'var(--coral-pale)',
                  border: '0.5px solid var(--coral-border)',
                  color: 'var(--coral)',
                  borderRadius: 'var(--radius-full)',
                  padding: '5px 14px',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                ✕ {r}
              </span>
            ))}
          </div>

          {result.suggestion && (
            <div
              style={{
                background: 'var(--amber-pale)',
                borderLeft: '2px solid var(--amber)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                fontSize: 13,
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
              }}
            >
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Sugestia
              </span>
              {result.suggestion}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
