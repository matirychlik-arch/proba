'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Workspace, Analysis, MODE_LABELS, MODE_ICONS } from '@/lib/types'
import { getWorkspaces, getAllAnalyses } from '@/lib/storage'
import { seedIfEmpty } from '@/lib/seed'
import { getScoreColor } from '@/lib/persona-colors'
import Card from '@/components/ui/Card'
import Label from '@/components/ui/Label'
import Aura from '@/components/Aura'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Dashboard() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [analyses, setAnalyses] = useState<Analysis[]>([])

  useEffect(() => {
    seedIfEmpty()
    setWorkspaces(getWorkspaces())
    setAnalyses(
      getAllAnalyses().sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    )
  }, [])

  const wsById = new Map(workspaces.map((w) => [w.id, w]))

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card variant="hero">
        <Label>Dashboard</Label>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            marginTop: 8,
            position: 'relative',
            zIndex: 2,
          }}
        >
          Testuj decyzje marketingowe,
          <br />
          zanim wydasz złotówkę.
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 10, fontSize: 14, position: 'relative', zIndex: 2 }}>
          Wybierz workspace i uruchom symulację reakcji swoich person.
        </p>
        <Aura />
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        {/* Lewa kolumna — workspace'y */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Label>Twoje workspace&apos;y</Label>
          {workspaces.map((ws) => {
            const wsAnalyses = analyses.filter((a) => a.workspaceId === ws.id)
            const last = wsAnalyses[0]
            return (
              <Link key={ws.id} href={`/workspace/${ws.id}`} style={{ textDecoration: 'none' }}>
                <Card
                  style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = 'var(--border-input)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = 'var(--border-default)')
                  }
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 28 }}>{ws.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                        {ws.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {ws.personas.length} person
                        {last ? ` · ostatnia analiza ${formatDate(last.createdAt)}` : ' · brak analiz'}
                      </div>
                    </div>
                    <span style={{ color: 'var(--text-placeholder)', fontSize: 18 }}>→</span>
                  </div>
                </Card>
              </Link>
            )
          })}
          <Link href="/workspace/new" style={{ textDecoration: 'none' }}>
            <Card
              variant="surface"
              style={{
                cursor: 'pointer',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              + Nowy Workspace
            </Card>
          </Link>
        </div>

        {/* Prawa kolumna — ostatnie analizy */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Label>Ostatnie analizy</Label>
          {analyses.length === 0 && (
            <Card variant="surface" style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '32px 20px' }}>
              Jeszcze nie masz żadnych analiz.
              <br />
              Wejdź w workspace i uruchom pierwszą symulację.
            </Card>
          )}
          {analyses.slice(0, 10).map((a) => {
            const ws = wsById.get(a.workspaceId)
            return (
              <Link
                key={a.id}
                href={`/workspace/${a.workspaceId}/history?analysis=${a.id}`}
                style={{ textDecoration: 'none' }}
              >
                <Card
                  style={{ cursor: 'pointer', padding: '12px 16px', transition: 'border-color 0.15s' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = 'var(--border-input)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = 'var(--border-default)')
                  }
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{ws?.emoji ?? '❓'}</span>
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
                        {MODE_ICONS[a.mode]} {MODE_LABELS[a.mode]}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                        {formatDate(a.createdAt)}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 18,
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
            )
          })}
        </div>
      </div>
    </div>
  )
}
