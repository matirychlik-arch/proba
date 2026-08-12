'use client'

import { AnalysisMode, AnalysisResult, Persona, MODE_LABELS } from '@/lib/types'
import { getScoreColor } from '@/lib/persona-colors'
import Card from './ui/Card'
import Label from './ui/Label'
import Aura from './Aura'
import ScoreCard from './ScoreCard'
import PersonaResultCard from './PersonaResultCard'
import HighlightedText from './HighlightedText'

export type PartialResult = Partial<AnalysisResult>

export default function AnalysisResults({
  mode,
  input,
  personas,
  result,
  createdAt,
  streaming = false,
}: {
  mode: AnalysisMode
  input: string
  personas: Persona[]
  result: PartialResult
  createdAt?: string
  streaming?: boolean
}) {
  const personaById = new Map(personas.map((p) => [p.id, p]))
  const personaIndexById = new Map(personas.map((p, i) => [p.id, i]))
  const showHook = mode === 'hook' || mode === 'kreacja'

  const chipStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.6)',
    border: '0.5px solid var(--border-default)',
    borderRadius: 'var(--radius-full)',
    padding: '4px 12px',
    fontSize: 11,
    fontFamily: "'DM Mono', monospace",
    color: 'var(--text-muted)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Blok 1 — Hero */}
      <Card variant="hero">
        <Label>{MODE_LABELS[mode]}</Label>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            lineHeight: 1.25,
            marginTop: 8,
            position: 'relative',
            zIndex: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {input}
        </h2>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, position: 'relative', zIndex: 2 }}>
          <span style={chipStyle}>{personas.length} person</span>
          {createdAt && (
            <span style={chipStyle}>
              {new Date(createdAt).toLocaleString('pl-PL', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
          {streaming && <span style={chipStyle}>symulacja w toku…</span>}
        </div>
        <Aura pulse={streaming} />
      </Card>

      {/* Blok 2 — Score trio */}
      <div style={{ display: 'grid', gridTemplateColumns: showHook ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: 12 }}>
        <ScoreCard label="Ogólny" score={result.overallScore} />
        {showHook && <ScoreCard label="Hook" score={result.hookScore} />}
        <ScoreCard label="Emocje" score={result.emotionalScore} />
        <ScoreCard label="Potencjał" score={result.potentialScore} />
      </div>

      {/* Blok 3 — Werdykt */}
      {result.verdict && (
        <Card style={{ borderColor: 'var(--border-subtle)' }}>
          <Label style={{ marginBottom: 8 }}>Werdykt</Label>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-secondary)' }}>
            <HighlightedText text={result.verdict} personas={personas} />
          </p>
        </Card>
      )}

      {/* Blok 4 — Ryzyko & Szansa */}
      {(result.biggestRisk || result.hiddenOpportunity) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {result.biggestRisk && (
            <div
              style={{
                background: 'var(--coral-pale)',
                borderLeft: '2px solid var(--coral)',
                borderRadius: 'var(--radius-sm)',
                padding: '14px 16px',
              }}
            >
              <Label style={{ marginBottom: 6 }}>Największe ryzyko</Label>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                {result.biggestRisk}
              </p>
            </div>
          )}
          {result.hiddenOpportunity && (
            <div
              style={{
                background: 'var(--amber-pale)',
                borderLeft: '2px solid var(--amber)',
                borderRadius: 'var(--radius-sm)',
                padding: '14px 16px',
              }}
            >
              <Label style={{ marginBottom: 6 }}>Ukryta szansa</Label>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                {result.hiddenOpportunity}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Blok 5 — Persony */}
      {result.personas && result.personas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Label>Analiza per persona</Label>
          {result.personas.map((pr, i) => {
            const persona = personaById.get(pr.personaId)
            if (!persona || pr.score == null) return null
            return (
              <PersonaResultCard
                key={pr.personaId}
                persona={persona}
                personaIndex={personaIndexById.get(pr.personaId) ?? i}
                result={pr}
                defaultOpen={i === 0}
              />
            )
          })}
        </div>
      )}

      {/* Zimny klient (tylko depth='rada') */}
      {result.coldClient && result.coldClient.score != null && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '0.5px solid var(--blue-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#EDE9E1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              🧊
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em' }}>
                Zimny klient
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Nie zna Twojej marki — widział tylko kreację
              </div>
            </div>
            <span
              style={{
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: '-0.03em',
                color: getScoreColor(result.coldClient.score),
              }}
            >
              {result.coldClient.score}
            </span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-secondary)' }}>
            {result.coldClient.reaction}
          </p>
          {result.coldClient.suggestion && (
            <div
              style={{
                marginTop: 10,
                background: 'var(--blue-pale)',
                borderLeft: '2px solid var(--blue)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                fontSize: 13,
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
              }}
            >
              {result.coldClient.suggestion}
            </div>
          )}
        </div>
      )}

      {/* Runda dyskusji (tylko depth='rada') — jawnie oznaczona jako symulacja */}
      {result.socialShifts && result.socialShifts.length > 0 && (
        <Card style={{ borderColor: 'var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <Label>Runda dyskusji</Label>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-placeholder)',
                background: 'var(--bg-app)',
                borderRadius: 'var(--radius-full)',
                padding: '3px 10px',
              }}
            >
              symulacja dyskusji
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {result.socialShifts.map((s) => {
              const persona = personaById.get(s.personaId)
              const changed = s.scoreAfter !== s.scoreBefore
              return (
                <div key={s.personaId} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, flexShrink: 0, minWidth: 70 }}>
                    <HighlightedText text={persona?.name ?? '?'} personas={personas} />
                  </span>
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 12,
                      flexShrink: 0,
                      color: changed
                        ? s.scoreAfter > s.scoreBefore
                          ? 'var(--blue)'
                          : 'var(--coral)'
                        : 'var(--text-muted)',
                    }}
                  >
                    {changed ? `${s.scoreBefore}→${s.scoreAfter}` : `${s.scoreBefore} ·`}
                  </span>
                  <span style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                    {s.reason}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Blok 6 — Top 3 rekomendacje */}
      {result.topActions && result.topActions.length > 0 && (
        <Card>
          <Label style={{ marginBottom: 12 }}>Top 3 rekomendacje</Label>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {result.topActions.map((action, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 16,
                  alignItems: 'baseline',
                  padding: '12px 0',
                  borderTop: i > 0 ? '0.5px solid var(--border-subtle)' : 'none',
                }}
              >
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 20,
                    fontWeight: 500,
                    color: 'var(--blue)',
                    flexShrink: 0,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                  <HighlightedText text={action} personas={personas} />
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
