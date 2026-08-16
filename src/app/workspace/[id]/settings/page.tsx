'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Workspace, Persona } from '@/lib/types'
import { getWorkspace, saveWorkspace, deleteWorkspace } from '@/lib/storage'
import Card from '@/components/ui/Card'
import Label from '@/components/ui/Label'
import Button from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import PersonaAvatar from '@/components/PersonaAvatar'

export default function WorkspaceSettingsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const toast = useToast()

  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setWorkspace(getWorkspace(id))
  }, [id])

  if (!workspace) return null

  const update = (patch: Partial<Workspace>) => {
    setWorkspace({ ...workspace, ...patch })
  }

  const updatePersona = (pid: string, patch: Partial<Persona>) => {
    update({
      personas: workspace.personas.map((p) => (p.id === pid ? { ...p, ...patch } : p)),
    })
  }

  const addPersona = () => {
    if (workspace.personas.length >= 6) return
    const p: Persona = {
      id: crypto.randomUUID(),
      name: '',
      age: '',
      emoji: '🙂',
      shortDesc: '',
      description: '',
    }
    update({ personas: [...workspace.personas, p] })
    setEditingId(p.id)
  }

  const removePersona = (pid: string) => {
    if (workspace.personas.length <= 2) {
      toast('Workspace musi mieć minimum 2 persony', 'error')
      return
    }
    update({ personas: workspace.personas.filter((p) => p.id !== pid) })
  }

  const save = () => {
    if (!workspace.name.trim()) {
      toast('Nazwa workspace’u nie może być pusta', 'error')
      return
    }
    if (workspace.personas.some((p) => !p.name.trim())) {
      toast('Każda persona musi mieć imię', 'error')
      return
    }
    saveWorkspace({ ...workspace, updatedAt: new Date().toISOString() })
    toast('Zmiany zapisane', 'success')
    router.push(`/workspace/${id}`)
  }

  const handleDeleteWorkspace = () => {
    deleteWorkspace(id)
    router.push('/dashboard')
  }

  return (
    <div className="page-enter" style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <Link href={`/workspace/${id}`} style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← {workspace.emoji} {workspace.name}
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 6 }}>
          Ustawienia workspace&apos;u
        </h1>
      </div>

      <Card style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 12 }}>
          <div>
            <Label style={{ marginBottom: 6 }}>Emoji</Label>
            <Input
              value={workspace.emoji}
              onChange={(e) => update({ emoji: e.target.value })}
              style={{ textAlign: 'center', fontSize: 20 }}
              maxLength={4}
            />
          </div>
          <div>
            <Label style={{ marginBottom: 6 }}>Nazwa</Label>
            <Input value={workspace.name} onChange={(e) => update({ name: e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <Label style={{ marginBottom: 6 }}>Branża</Label>
            <Input value={workspace.industry} onChange={(e) => update({ industry: e.target.value })} />
          </div>
          <div>
            <Label style={{ marginBottom: 6 }}>Miasto / rynek</Label>
            <Input value={workspace.targetCity} onChange={(e) => update({ targetCity: e.target.value })} />
          </div>
        </div>
        <div>
          <Label style={{ marginBottom: 6 }}>Opis biznesu</Label>
          <Textarea
            rows={8}
            value={workspace.description}
            onChange={(e) => update({ description: e.target.value })}
          />
        </div>
      </Card>

      <div>
        <Label style={{ marginBottom: 12 }}>Persony ({workspace.personas.length}/6)</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {workspace.personas.map((p, i) => (
            <Card key={p.id}>
              {editingId === p.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px', gap: 8 }}>
                    <Input
                      value={p.emoji}
                      onChange={(e) => updatePersona(p.id, { emoji: e.target.value })}
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
                    placeholder="Krótki opis"
                  />
                  <Textarea
                    rows={6}
                    value={p.description}
                    onChange={(e) => updatePersona(p.id, { description: e.target.value })}
                    placeholder="Pełny profil behawioralny"
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button onClick={() => setEditingId(null)}>Gotowe</Button>
                    <Button variant="ghost" onClick={() => removePersona(p.id)} style={{ color: 'var(--coral)' }}>
                      Usuń personę
                    </Button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <PersonaAvatar name={p.name || '?'} index={i} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {p.emoji} {p.name}{' '}
                      <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>{p.age}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.shortDesc}</div>
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
          {workspace.personas.length < 6 && (
            <Button variant="ghost" onClick={addPersona}>
              + Dodaj personę
            </Button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Button onClick={save}>Zapisz zmiany</Button>
        <Button variant="ghost" onClick={() => router.push(`/workspace/${id}`)}>
          Anuluj
        </Button>
        <div style={{ marginLeft: 'auto' }}>
          {confirmDelete ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--coral)' }}>Na pewno?</span>
              <Button variant="danger" onClick={handleDeleteWorkspace}>
                Tak, usuń
              </Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                Nie
              </Button>
            </div>
          ) : (
            <Button variant="ghost" onClick={() => setConfirmDelete(true)} style={{ color: 'var(--coral)' }}>
              Usuń workspace
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
