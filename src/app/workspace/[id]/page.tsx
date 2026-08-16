'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Workspace, Analysis, AnalysisMode, MODE_LABELS, MODE_ICONS } from '@/lib/types'
import { getWorkspace, getAnalysesForWorkspace } from '@/lib/storage'
import { getScoreColor } from '@/lib/persona-colors'
import Card from '@/components/ui/Card'
import Label from '@/components/ui/Label'
import PersonaAvatar from '@/components/PersonaAvatar'

const MODES: AnalysisMode[] = ['kreacja', 'hook', 'cena', 'kampania', 'content', 'decyzja']

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [analyses, setAnalyses] = useState<Analysis[]>([])

  useEffect(() => {
    setWorkspace(getWorkspace(id))
    setAnalyses(getAnalysesForWorkspace(id))
  }, [id])

  if (!workspace) {
    return (
      <div className="page-enter" style={{ color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>
        Nie znaleziono workspace&apos;u.{' '}
        <Link href="/dashboard" style={{ color: 'var(--blue)' }}>
          Wróć do dashboardu
        </Link>
      </div>
    )
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 44 }}>{workspace.emoji}</span>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em' }}>{workspace.name}</h1>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {workspace.industry} · {workspace.targetCity}
          </div>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: 'var(--text-placeholder)',
              marginTop: 6,
            }}
          >
            {workspace.personas.length} person · {analyses.length} analiz
            {analyses[0] ? ` · ostatnia ${formatDate(analyses[0].createdAt)}` : ''}
          </div>
        </div>
        <Link
          href={`/workspace/${id}/settings`}
          style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}
        >
          ⚙ Edytuj
        </Link>
      </div>

      {/* Szybka analiza */}
      <div>
        <Label style={{ marginBottom: 12 }}>Szybka analiza</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {MODES.map((mode) => (
            <Link
              key={mode}
              href={`/workspace/${id}/analyze?mode=${mode}`}
              style={{ textDecoration: 'none' }}
            >
              <Card
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'border-color 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--blue)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
              >
                <span style={{ fontSize: 22 }}>{MODE_ICONS[mode]}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                  {MODE_LABELS[mode]}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Ostatnie analizy */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <Label>Ostatnie analizy</Label>
          {analyses.length > 0 && (
            <Link href={`/workspace/${id}/history`} style={{ fontSize: 13, color: 'var(--blue)', textDecoration: 'none' }}>
              Zobacz wszystkie →
            </Link>
          )}
        </div>
        {analyses.length === 0 ? (
          <Card variant="surface" style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '28px 20px' }}>
            Brak analiz w tym workspace&apos;ie. Wybierz tryb powyżej i uruchom pierwszą symulację.
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {analyses.slice(0, 5).map((a) => (
              <Link
                key={a.id}
                href={`/workspace/${id}/history?analysis=${a.id}`}
                style={{ textDecoration: 'none' }}
              >
                <Card
                  style={{ cursor: 'pointer', padding: '12px 16px', transition: 'border-color 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-input)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 18 }}>{MODE_ICONS[a.mode]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {a.input}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                        {MODE_LABELS[a.mode]} · {formatDate(a.createdAt)}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 20,
                        fontWeight: 600,
                        letterSpacing: '-0.03em',
                        color: getScoreColor(a.result.overallScore),
                      }}
                    >
                      {a.result.overallScore}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Persony */}
      <div>
        <Label style={{ marginBottom: 12 }}>Persony</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {workspace.personas.map((p, i) => (
            <Card key={p.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <PersonaAvatar name={p.name} index={i} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.02em' }}>
                  {p.emoji} {p.name}{' '}
                  <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>{p.age}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.5 }}>
                  {p.shortDesc}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
