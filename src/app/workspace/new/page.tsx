'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Persona } from '@/lib/types'
import { saveWorkspace, getApiKey } from '@/lib/storage'
import Card from '@/components/ui/Card'
import Label from '@/components/ui/Label'
import Button from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import PersonaAvatar from '@/components/PersonaAvatar'
import Aura from '@/components/Aura'

const BRAIN_DUMP_PLACEHOLDER = `Opisz swój biznes jak byś tłumaczył nowemu wspólnikowi przy kawie.

Co sprzedajesz? Dla kogo? Po ile? Gdzie? Jakie masz plany?
Co już wiesz że działa? Czego się boisz? Co cię wyróżnia?

Im więcej napiszesz, tym precyzyjniejsze będą symulacje.`

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

export default function NewWorkspacePage() {
  const router = useRouter()
  const toast = useToast()
  const [step, setStep] = useState(1)

  const [emoji, setEmoji] = useState('')
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [city, setCity] = useState('')
  const [description, setDescription] = useState('')
  const [personas, setPersonas] = useState<Persona[]>([])
  const [generating, setGenerating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const words = wordCount(description)
  const quality = Math.min(100, Math.round((words / 300) * 100))

  const canNext1 = name.trim() && industry.trim() && city.trim()
  const canNext2 = words >= 100
  const canSave = personas.length >= 2

  const generatePersonas = async () => {
    setGenerating(true)
    try {
      const apiKey = getApiKey()
      const res = await fetch('/api/generate-personas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'X-Api-Key': apiKey } : {}),
        },
        body: JSON.stringify({ description, industry, city }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error ?? 'Nie udało się wygenerować person', 'error')
        return
      }
      setPersonas(
        data.personas.slice(0, 6).map((p: Omit<Persona, 'id'>) => ({
          ...p,
          id: crypto.randomUUID(),
        }))
      )
      toast('Persony wygenerowane — możesz je edytować', 'success')
    } catch {
      toast('Błąd sieci przy generowaniu person', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const addEmptyPersona = () => {
    if (personas.length >= 6) return
    const p: Persona = {
      id: crypto.randomUUID(),
      name: '',
      age: '',
      emoji: '🙂',
      shortDesc: '',
      description: '',
    }
    setPersonas([...personas, p])
    setEditingId(p.id)
  }

  const updatePersona = (id: string, patch: Partial<Persona>) => {
    setPersonas((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  const save = () => {
    const invalid = personas.some((p) => !p.name.trim())
    if (invalid) {
      toast('Każda persona musi mieć imię', 'error')
      return
    }
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    saveWorkspace({
      id,
      name: name.trim(),
      emoji: emoji.trim() || '🧪',
      industry: industry.trim(),
      targetCity: city.trim(),
      description: description.trim(),
      personas,
      createdAt: now,
      updatedAt: now,
    })
    router.push(`/workspace/${id}`)
  }

  return (
    <div className="page-enter" style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card variant="hero" style={{ minHeight: 120 }}>
        <Label>Nowy workspace · krok {step} / 3</Label>
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.03em', marginTop: 8, position: 'relative', zIndex: 2 }}>
          {step === 1 && 'Podstawy'}
          {step === 2 && 'Opis biznesu — brain dump'}
          {step === 3 && 'Persony'}
        </h1>
        <Aura />
      </Card>

      {step === 1 && (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 12 }}>
            <div>
              <Label style={{ marginBottom: 6 }}>Emoji</Label>
              <Input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="🟠"
                maxLength={4}
                style={{ textAlign: 'center', fontSize: 20 }}
              />
            </div>
            <div>
              <Label style={{ marginBottom: 6 }}>Nazwa workspace&apos;u</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="np. KOMBINI / Matchomaty" />
            </div>
          </div>
          <div>
            <Label style={{ marginBottom: 6 }}>Branża / typ biznesu</Label>
            <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="np. Food & Beverage / Vending" />
          </div>
          <div>
            <Label style={{ marginBottom: 6 }}>Miasto / rynek docelowy</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="np. Wrocław, Polska" />
          </div>
          <Button fullWidth disabled={!canNext1} onClick={() => setStep(2)}>
            Dalej →
          </Button>
        </Card>
      )}

      {step === 2 && (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Textarea
            rows={12}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={BRAIN_DUMP_PLACEHOLDER}
          />
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {words} słów {words < 100 ? `(minimum 100)` : words < 300 ? '(optimum 300+)' : '✓'}
              </span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-muted)' }}>
                jakość kontekstu {quality}%
              </span>
            </div>
            <div style={{ width: '100%', height: 3, background: 'var(--border-subtle)', borderRadius: 2, overflow: 'hidden' }}>
              <div
                className="score-fill"
                style={{
                  height: '100%',
                  width: `${quality}%`,
                  background: quality >= 80 ? 'var(--blue)' : quality >= 40 ? 'var(--amber)' : 'var(--coral)',
                  borderRadius: 2,
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" onClick={() => setStep(1)}>
              ← Wstecz
            </Button>
            <Button fullWidth disabled={!canNext2} onClick={() => setStep(3)}>
              Dalej →
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {personas.length === 0 && (
            <Card variant="surface" style={{ textAlign: 'center', padding: '28px 20px' }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                Claude może wygenerować 4 persony na podstawie Twojego opisu biznesu — albo dodaj je
                ręcznie.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <Button onClick={generatePersonas} disabled={generating}>
                  {generating ? 'Generowanie...' : '✨ Wygeneruj persony automatycznie'}
                </Button>
                <Button variant="ghost" onClick={addEmptyPersona}>
                  + Dodaj ręcznie
                </Button>
              </div>
            </Card>
          )}

          {personas.map((p, i) => (
            <Card key={p.id}>
              {editingId === p.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px', gap: 8 }}>
                    <Input
                      value={p.emoji}
                      onChange={(e) => updatePersona(p.id, { emoji: e.target.value })}
                      placeholder="⚡"
                      style={{ textAlign: 'center' }}
                    />
                    <Input
                      value={p.name}
                      onChange={(e) => updatePersona(p.id, { name: e.target.value })}
                      placeholder="Imię"
                    />
                    <Input
                      value={p.age}
                      onChange={(e) => updatePersona(p.id, { age: e.target.value })}
                      placeholder="Wiek"
                    />
                  </div>
                  <Input
                    value={p.shortDesc}
                    onChange={(e) => updatePersona(p.id, { shortDesc: e.target.value })}
                    placeholder="Krótki opis (max 10 słów)"
                  />
                  <Textarea
                    rows={5}
                    value={p.description}
                    onChange={(e) => updatePersona(p.id, { description: e.target.value })}
                    placeholder="Pełny profil behawioralny (200-400 słów)"
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button onClick={() => setEditingId(null)}>Gotowe</Button>
                    <Button
                      variant="ghost"
                      onClick={() => setPersonas((prev) => prev.filter((x) => x.id !== p.id))}
                    >
                      Usuń
                    </Button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <PersonaAvatar name={p.name || '?'} index={i} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {p.emoji} {p.name || '(bez imienia)'}{' '}
                      <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>{p.age}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{p.shortDesc}</div>
                  </div>
                  <button
                    onClick={() => setEditingId(p.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--blue)',
                      fontSize: 13,
                      cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Edytuj
                  </button>
                </div>
              )}
            </Card>
          ))}

          {personas.length > 0 && personas.length < 6 && (
            <Button variant="ghost" onClick={addEmptyPersona}>
              + Dodaj personę ({personas.length}/6)
            </Button>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" onClick={() => setStep(2)}>
              ← Wstecz
            </Button>
            <Button fullWidth disabled={!canSave} onClick={save}>
              Zapisz workspace {personas.length < 2 ? '(min. 2 persony)' : ''}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
