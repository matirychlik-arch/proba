'use client'

import { Persona } from '@/lib/types'
import { CouncilProgress as Progress } from '@/lib/council'
import { getPersonaColor, getPersonaTextColor } from '@/lib/persona-colors'
import Label from './ui/Label'

const PHASE_LABELS: Record<Progress['phase'], string> = {
  reakcje: 'Persony oceniają niezależnie...',
  dyskusja: 'Trwa obrada rady — symulacja dyskusji...',
  synteza: 'Strateg pisze werdykt...',
  done: 'Obrady zakończone',
}

export default function CouncilProgressView({
  personas,
  progress,
}: {
  personas: Persona[]
  progress: Progress
}) {
  const items = [
    ...personas.map((p, i) => ({
      id: p.id,
      initial: p.name.charAt(0).toUpperCase(),
      name: p.name,
      bg: getPersonaColor(i),
      fg: getPersonaTextColor(i),
    })),
    { id: 'cold', initial: '🧊', name: 'Zimny klient', bg: '#EDE9E1', fg: '#1A1916' },
  ]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        padding: '48px 0',
      }}
    >
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        {items.map((item) => {
          const status = progress.members[item.id] ?? 'waiting'
          return (
            <div key={item.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: item.bg,
                  color: item.fg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 600,
                  opacity: status === 'done' ? 1 : status === 'thinking' ? undefined : 0.25,
                  animation: status === 'thinking' ? 'pulse 1.5s ease-in-out infinite' : undefined,
                  border: status === 'error' ? '2px solid var(--coral)' : 'none',
                  transition: 'opacity 0.3s',
                }}
              >
                {item.initial}
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>
                {item.name}
              </span>
            </div>
          )
        })}
      </div>

      {/* Fazy */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {(['reakcje', 'dyskusja', 'synteza'] as const).map((phase, i) => {
          const phases = ['reakcje', 'dyskusja', 'synteza', 'done']
          const current = phases.indexOf(progress.phase)
          const active = i <= current
          return (
            <div
              key={phase}
              style={{
                width: 40,
                height: 3,
                borderRadius: 2,
                background: active ? 'var(--blue)' : 'var(--border-subtle)',
                transition: 'background 0.3s',
              }}
            />
          )
        })}
      </div>

      <Label>{PHASE_LABELS[progress.phase]}</Label>
    </div>
  )
}
