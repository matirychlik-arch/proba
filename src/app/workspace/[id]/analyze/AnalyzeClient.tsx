'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import {
  Workspace,
  Persona,
  Analysis,
  AnalysisMode,
  MODE_LABELS,
  MODE_ICONS,
  MODE_PLACEHOLDERS,
} from '@/lib/types'
import { getWorkspace, getApiKey, saveAnalysis } from '@/lib/storage'
import { resizeImage, validateImageFile } from '@/lib/image'
import { parsePartialJson } from '@/lib/partial-json'
import Card from '@/components/ui/Card'
import Label from '@/components/ui/Label'
import Button from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import PersonaAvatar from '@/components/PersonaAvatar'
import LoadingPersonas from '@/components/LoadingPersonas'
import AnalysisResults, { PartialResult } from '@/components/AnalysisResults'
import { useToast } from '@/components/ui/Toast'

const MODES: AnalysisMode[] = ['kreacja', 'hook', 'cena', 'kampania', 'content', 'decyzja']

export default function AnalyzeClient() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const toast = useToast()

  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [mode, setMode] = useState<AnalysisMode>(
    (searchParams.get('mode') as AnalysisMode) || 'kreacja'
  )
  const [input, setInput] = useState('')
  const [context, setContext] = useState('')
  const [showContext, setShowContext] = useState(false)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [running, setRunning] = useState(false)
  const [partial, setPartial] = useState<PartialResult | null>(null)
  const [saved, setSaved] = useState(false)
  const [showApiModal, setShowApiModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const ws = getWorkspace(id)
    setWorkspace(ws)
    if (ws) setSelectedIds(ws.personas.map((p) => p.id))
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

  const selectedPersonas: Persona[] = workspace.personas.filter((p) => selectedIds.includes(p.id))

  const togglePersona = (pid: string) => {
    setSelectedIds((prev) =>
      prev.includes(pid) ? prev.filter((x) => x !== pid) : [...prev, pid]
    )
  }

  const handleImageChange = async (file: File | undefined) => {
    if (!file) return
    const err = validateImageFile(file)
    if (err) {
      toast(err, 'error')
      return
    }
    try {
      const base64 = await resizeImage(file)
      setImageBase64(base64)
      setImagePreview(`data:image/jpeg;base64,${base64}`)
    } catch {
      toast('Nie udało się przetworzyć obrazu', 'error')
    }
  }

  const runAnalysis = async () => {
    if (!input.trim()) {
      toast('Wpisz treść do analizy', 'error')
      return
    }
    if (selectedPersonas.length === 0) {
      toast('Wybierz przynajmniej jedną personę', 'error')
      return
    }
    const apiKey = getApiKey()
    if (!apiKey) {
      setShowApiModal(true)
      return
    }

    setRunning(true)
    setPartial(null)
    setSaved(false)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
        body: JSON.stringify({
          mode,
          input: input.trim(),
          context: context.trim() || undefined,
          personas: selectedPersonas,
          businessDescription: workspace.description,
          imageBase64: imageBase64 || undefined,
        }),
      })

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        toast(data.error ?? 'Błąd uruchomienia analizy', 'error')
        setRunning(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = JSON.parse(line.slice(6))
          if (payload.error) {
            toast(payload.error, 'error')
            setRunning(false)
            return
          }
          if (payload.done) continue
          if (payload.text) {
            accumulated += payload.text
            const parsed = parsePartialJson(accumulated)
            if (parsed) setPartial(parsed as PartialResult)
          }
        }
      }

      // finalizacja
      const final = parsePartialJson(accumulated) as PartialResult | null
      if (final && final.overallScore != null && final.personas) {
        setPartial(final)
        const analysis: Analysis = {
          id: `a-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
          workspaceId: id,
          mode,
          input: input.trim(),
          imageBase64: imageBase64 || undefined,
          context: context.trim() || undefined,
          selectedPersonaIds: selectedIds,
          result: final as Required<PartialResult>,
          createdAt: new Date().toISOString(),
        }
        const { pruned } = saveAnalysis(analysis)
        setSaved(true)
        if (pruned) {
          toast('Osiągnięto limit 50 analiz — usunięto najstarszą', 'info')
        }
      } else {
        toast('Analiza zwróciła niepełny wynik — spróbuj ponownie', 'error')
      }
    } catch {
      toast('Błąd sieci podczas analizy — sprawdź połączenie', 'error')
    } finally {
      setRunning(false)
    }
  }

  const resetForm = () => {
    setPartial(null)
    setSaved(false)
    setInput('')
    setContext('')
    setImageBase64(null)
    setImagePreview(null)
  }

  const copyReport = () => {
    if (!partial) return
    const lines = [
      `PROBA — ${MODE_LABELS[mode]}`,
      `Input: ${input}`,
      ``,
      `Werdykt: ${partial.verdict ?? ''}`,
      `Ogólny: ${partial.overallScore}/10 · Emocje: ${partial.emotionalScore}/10 · Potencjał: ${partial.potentialScore}/10`,
      `Największe ryzyko: ${partial.biggestRisk ?? ''}`,
      `Ukryta szansa: ${partial.hiddenOpportunity ?? ''}`,
      ``,
      `Rekomendacje:`,
      ...(partial.topActions ?? []).map((a, i) => `${i + 1}. ${a}`),
    ]
    navigator.clipboard.writeText(lines.join('\n'))
    toast('Raport skopiowany do schowka', 'success')
  }

  const hasResults = partial && (partial.verdict || partial.overallScore != null)

  return (
    <div className="page-enter">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href={`/workspace/${id}`} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 20 }}>
          ←
        </Link>
        <span style={{ fontSize: 24 }}>{workspace.emoji}</span>
        <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>
          Nowa analiza · {workspace.name}
        </h1>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: hasResults || running ? '400px 1fr' : '1fr',
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* Lewa kolumna — Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Tryb */}
          <div>
            <Label style={{ marginBottom: 8 }}>Tryb analizy</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {MODES.map((m) => {
                const active = m === mode
                return (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    style={{
                      background: active ? 'var(--blue-pale)' : 'white',
                      border: `0.5px solid ${active ? 'var(--blue-border)' : 'var(--border-default)'}`,
                      color: active ? 'var(--blue)' : 'var(--text-secondary)',
                      borderRadius: 'var(--radius-full)',
                      padding: '6px 14px',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {MODE_ICONS[m]} {MODE_LABELS[m]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Input */}
          <div>
            <Label style={{ marginBottom: 8 }}>Twój input</Label>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={MODE_PLACEHOLDERS[mode]}
              rows={5}
              disabled={running}
            />
          </div>

          {/* Upload */}
          <div>
            <Label style={{ marginBottom: 8 }}>Obraz (opcjonalny)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => handleImageChange(e.target.files?.[0])}
            />
            {imagePreview ? (
              <div style={{ position: 'relative' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="preview"
                  style={{ width: '100%', borderRadius: 'var(--radius-md)', border: '0.5px solid var(--border-default)' }}
                />
                <button
                  onClick={() => {
                    setImageBase64(null)
                    setImagePreview(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-full)',
                    width: 24,
                    height: 24,
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  handleImageChange(e.dataTransfer.files?.[0])
                }}
                style={{
                  border: '1px dashed var(--border-input)',
                  borderRadius: 'var(--radius-md)',
                  padding: '24px 16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: 'var(--text-muted)',
                }}
              >
                Wrzuć kreację, screenshot, mockup lub storyboard
                <br />
                <span style={{ fontSize: 11, color: 'var(--text-placeholder)' }}>PNG, JPG, WEBP · max 5MB</span>
              </div>
            )}
          </div>

          {/* Persony */}
          <div>
            <Label style={{ marginBottom: 8 }}>Persony ({selectedIds.length})</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {workspace.personas.map((p, i) => {
                const checked = selectedIds.includes(p.id)
                return (
                  <div
                    key={p.id}
                    onClick={() => togglePersona(p.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: `0.5px solid ${checked ? 'var(--blue-border)' : 'var(--border-subtle)'}`,
                      background: checked ? 'var(--blue-pale)' : 'white',
                      cursor: 'pointer',
                    }}
                  >
                    <PersonaAvatar name={p.name} index={i} size={28} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.shortDesc}
                      </div>
                    </div>
                    <span style={{ color: checked ? 'var(--blue)' : 'var(--text-placeholder)', fontSize: 14 }}>
                      {checked ? '✓' : '○'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Kontekst */}
          <div>
            <button
              onClick={() => setShowContext(!showContext)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--text-placeholder)',
                padding: 0,
              }}
            >
              {showContext ? '▲' : '▼'} Kontekst (opcjonalny)
            </button>
            {showContext && (
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Dodaj kontekst który może mieć znaczenie — budżet, deadline, platforma, poprzednie wyniki..."
                rows={3}
                disabled={running}
                style={{ marginTop: 8 }}
              />
            )}
          </div>

          {/* RUN */}
          <Button fullWidth onClick={runAnalysis} disabled={running}>
            {running ? 'Symulacja w toku...' : '⟳ Uruchom symulację'}
          </Button>
        </div>

        {/* Prawa kolumna — Wyniki */}
        {(running || hasResults) && (
          <div>
            {running && !hasResults ? (
              <Card variant="surface">
                <LoadingPersonas />
              </Card>
            ) : partial ? (
              <>
                <AnalysisResults
                  mode={mode}
                  input={input}
                  personas={selectedPersonas}
                  result={partial}
                  createdAt={saved ? new Date().toISOString() : undefined}
                  streaming={running}
                />
                {!running && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                    <Button variant="ghost" onClick={resetForm}>
                      ← Nowa analiza
                    </Button>
                    {saved ? (
                      <Button variant="ghost" onClick={() => router.push(`/workspace/${id}/history`)}>
                        Zobacz w historii
                      </Button>
                    ) : null}
                    <Button variant="ghost" onClick={copyReport}>
                      Kopiuj raport
                    </Button>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* Modal — brak klucza API */}
      {showApiModal && (
        <div
          onClick={() => setShowApiModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(26,25,22,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
          }}
        >
          <Card
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 380, borderRadius: 'var(--radius-2xl)', padding: 24 }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
              Dodaj klucz API Anthropic
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
              Żeby uruchomić symulację, potrzebujesz własnego klucza API. Przechowujemy go tylko
              lokalnie w Twojej przeglądarce.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => router.push('/settings')}>Przejdź do ustawień</Button>
              <Button variant="ghost" onClick={() => setShowApiModal(false)}>
                Anuluj
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
