'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { Workspace, Analysis, AnalysisMode, MODE_LABELS, MODE_ICONS } from '@/lib/types'
import { getWorkspace, getAnalysesForWorkspace, deleteAnalysis } from '@/lib/storage'
import { getScoreColor } from '@/lib/persona-colors'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import AnalysisResults from '@/components/AnalysisResults'
import RealOutcomeCard from '@/components/RealOutcomeCard'
import { useToast } from '@/components/ui/Toast'

const MODES: AnalysisMode[] = ['kreacja', 'hook', 'cena', 'kampania', 'content', 'decyzja']

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function HistoryPageInner() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const toast = useToast()

  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [filter, setFilter] = useState<AnalysisMode | 'all'>('all')
  const [sort, setSort] = useState<'newest' | 'score'>('newest')
  const [openId, setOpenId] = useState<string | null>(searchParams.get('analysis'))

  useEffect(() => {
    setWorkspace(getWorkspace(id))
    setAnalyses(getAnalysesForWorkspace(id))
  }, [id])

  if (!workspace) return null

  const filtered = analyses
    .filter((a) => filter === 'all' || a.mode === filter)
    .sort((a, b) =>
      sort === 'score'
        ? b.result.overallScore - a.result.overallScore
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

  const handleDelete = (analysisId: string) => {
    deleteAnalysis(analysisId)
    setAnalyses(getAnalysesForWorkspace(id))
    toast('Analiza usunięta', 'info')
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <Link
          href={`/workspace/${id}`}
          style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}
        >
          ← {workspace.emoji} {workspace.name}
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 6 }}>
          Historia analiz
        </h1>
      </div>

      {/* Filtry */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            background: filter === 'all' ? 'var(--blue-pale)' : 'var(--bg-card)',
            border: `0.5px solid ${filter === 'all' ? 'var(--blue-border)' : 'var(--border-default)'}`,
            color: filter === 'all' ? 'var(--blue)' : 'var(--text-primary)',
            borderRadius: 'var(--radius-full)',
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Wszystkie ({analyses.length})
        </button>
        {MODES.map((m) => {
          const count = analyses.filter((a) => a.mode === m).length
          if (count === 0) return null
          return (
            <button
              key={m}
              onClick={() => setFilter(m)}
              style={{
                background: filter === m ? 'var(--blue-pale)' : 'var(--bg-card)',
                border: `0.5px solid ${filter === m ? 'var(--blue-border)' : 'var(--border-default)'}`,
                color: filter === m ? 'var(--blue)' : 'var(--text-primary)',
                borderRadius: 'var(--radius-full)',
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {MODE_ICONS[m]} {MODE_LABELS[m]} ({count})
            </button>
          )
        })}
        <div style={{ marginLeft: 'auto' }}>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'newest' | 'score')}
            style={{
              background: 'var(--bg-card)',
              border: '0.5px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              fontSize: 12,
              fontFamily: "'DM Sans', sans-serif",
              color: 'var(--text-primary)',
            }}
          >
            <option value="newest">Najnowsze</option>
            <option value="score">Najwyższy score</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 && (
        <Card variant="surface" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '32px 20px' }}>
          Brak analiz.{' '}
          <Link href={`/workspace/${id}/analyze`} style={{ color: 'var(--blue)' }}>
            Uruchom pierwszą symulację →
          </Link>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((a) => {
          const open = openId === a.id
          const analysisPersonas = workspace.personas.filter((p) =>
            a.selectedPersonaIds.includes(p.id)
          )
          return (
            <div key={a.id}>
              <Card
                onClick={() => setOpenId(open ? null : a.id)}
                style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-input)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>{MODE_ICONS[a.mode]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {a.input}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {MODE_LABELS[a.mode]} · {a.depth === 'rada' ? '🧠 rada person · ' : ''}
                      {formatDate(a.createdAt)} · {a.selectedPersonaIds.length} person
                      {a.realOutcome ? ' · ✓ realny wynik zapisany' : ''}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 24,
                      fontWeight: 600,
                      letterSpacing: '-0.03em',
                      color: getScoreColor(a.result.overallScore),
                    }}
                  >
                    {a.result.overallScore}
                  </span>
                  <span style={{ color: 'var(--text-placeholder)', fontSize: 12 }}>{open ? '▲' : '▼'}</span>
                </div>
              </Card>

              {open && (
                <div style={{ marginTop: 12, paddingLeft: 12, borderLeft: '2px solid var(--border-subtle)' }} className="page-enter">
                  <AnalysisResults
                    mode={a.mode}
                    input={a.input}
                    personas={analysisPersonas}
                    result={a.result}
                    createdAt={a.createdAt}
                  />
                  <RealOutcomeCard
                    analysis={a}
                    onSaved={() => setAnalyses(getAnalysesForWorkspace(id))}
                  />
                  <div style={{ marginTop: 12 }}>
                    <Button variant="ghost" onClick={() => handleDelete(a.id)} style={{ color: 'var(--coral)' }}>
                      Usuń analizę
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function HistoryPage() {
  return (
    <Suspense>
      <HistoryPageInner />
    </Suspense>
  )
}
