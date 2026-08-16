'use client'

import { useState } from 'react'
import { Analysis, RealOutcome } from '@/lib/types'
import { updateAnalysis } from '@/lib/storage'
import { getScoreColor } from '@/lib/persona-colors'
import Label from './ui/Label'
import Button from './ui/Button'
import { Textarea } from './ui/Input'

/**
 * Pętla walidacji (rama: falsyfikacja, nie predykcja) — "co się faktycznie stało"
 * po publikacji. Werdykt Council: pierwszy krok przed rozbudową silnika.
 */
export default function RealOutcomeCard({
  analysis,
  onSaved,
}: {
  analysis: Analysis
  onSaved: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [note, setNote] = useState(analysis.realOutcome?.note ?? '')
  const [success, setSuccess] = useState<boolean | undefined>(analysis.realOutcome?.success)

  const save = () => {
    if (!note.trim()) return
    const realOutcome: RealOutcome = {
      note: note.trim(),
      success,
      recordedAt: new Date().toISOString(),
    }
    updateAnalysis(analysis.id, { realOutcome })
    setEditing(false)
    onSaved()
  }

  const outcome = analysis.realOutcome
  const predicted = analysis.result.overallScore
  // Zgrubna zgodność predykcji z rzeczywistością: score >=6 = "obstawiał sukces"
  const hit = outcome?.success != null ? (predicted >= 6) === outcome.success : null

  if (outcome && !editing) {
    return (
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '0.5px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 18px',
          marginTop: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <Label>Co się faktycznie stało</Label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
            {hit != null && (
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: hit ? 'var(--score-high)' : 'var(--coral)',
                }}
              >
                {hit ? '✓ predykcja trafiona' : '✗ predykcja chybiona'}
              </span>
            )}
            <button
              onClick={() => setEditing(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 11,
                color: 'var(--text-muted)',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              edytuj
            </button>
          </div>
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
          {outcome.success != null && (
            <span style={{ fontWeight: 600, color: outcome.success ? 'var(--score-high)' : 'var(--coral)' }}>
              {outcome.success ? 'Sukces. ' : 'Nie zagrało. '}
            </span>
          )}
          {outcome.note}
        </p>
        <div style={{ fontSize: 11, color: 'var(--text-placeholder)', marginTop: 6, fontFamily: "'DM Mono', monospace" }}>
          Proba przewidywała:{' '}
          <span style={{ color: getScoreColor(predicted) }}>{predicted}/10</span>
          {analysis.promptVersion ? ` · prompt v${analysis.promptVersion}` : ''} · zapisano{' '}
          {new Date(outcome.recordedAt).toLocaleDateString('pl-PL')}
        </div>
      </div>
    )
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        style={{
          marginTop: 12,
          background: 'none',
          border: '1px dashed var(--border-input)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 16px',
          width: '100%',
          cursor: 'pointer',
          fontSize: 13,
          color: 'var(--text-muted)',
          fontFamily: "'DM Sans', sans-serif",
          textAlign: 'left',
        }}
      >
        + Dodaj realny wynik — co się faktycznie stało po publikacji?
      </button>
    )
  }

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '0.5px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 18px',
        marginTop: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <Label>Co się faktycznie stało</Label>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Np. 42k wyświetleń, 8% zapisów, komentarze pozytywne — najlepszy hook miesiąca. Albo: umarło po 200 views."
        rows={3}
        autoFocus
      />
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { val: true, label: '✓ Sukces', color: 'var(--score-high)' },
          { val: false, label: '✗ Nie zagrało', color: 'var(--coral)' },
        ].map((o) => (
          <button
            key={String(o.val)}
            onClick={() => setSuccess(success === o.val ? undefined : o.val)}
            style={{
              background: success === o.val ? 'var(--bg-app)' : 'white',
              border: `0.5px solid ${success === o.val ? o.color : 'var(--border-default)'}`,
              color: success === o.val ? o.color : 'var(--text-muted)',
              borderRadius: 'var(--radius-full)',
              padding: '5px 14px',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button onClick={save} disabled={!note.trim()} style={{ padding: '8px 16px', fontSize: 13 }}>
          Zapisz wynik
        </Button>
        <Button variant="ghost" onClick={() => setEditing(false)} style={{ padding: '8px 16px', fontSize: 13 }}>
          Anuluj
        </Button>
      </div>
    </div>
  )
}
