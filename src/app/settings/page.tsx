'use client'

import { useEffect, useState } from 'react'
import { getApiKey, saveApiKey } from '@/lib/storage'
import { getProvider } from '@/lib/provider'
import Card from '@/components/ui/Card'
import Label from '@/components/ui/Label'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('')
  const [visible, setVisible] = useState(false)
  const [testing, setTesting] = useState(false)
  const [cliMode, setCliMode] = useState(false)
  const toast = useToast()

  useEffect(() => {
    setApiKey(getApiKey())
    getProvider().then((p) => setCliMode(p === 'cli'))
  }, [])

  const handleSave = () => {
    saveApiKey(apiKey.trim())
    toast('Klucz API zapisany lokalnie', 'success')
  }

  const handleTest = async () => {
    if (!apiKey.trim()) {
      toast('Wpisz klucz API zanim przetestujesz połączenie', 'error')
      return
    }
    setTesting(true)
    try {
      const res = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey.trim() },
      })
      const data = await res.json()
      if (res.ok) {
        toast('Połączenie działa — klucz jest poprawny ✓', 'success')
      } else {
        toast(data.error ?? 'Klucz nie działa — sprawdź czy jest poprawny', 'error')
      }
    } catch {
      toast('Błąd sieci — sprawdź połączenie z internetem', 'error')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="page-enter" style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <Label>Ustawienia</Label>
        <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 6 }}>
          Ustawienia globalne
        </h1>
      </div>

      {cliMode && (
        <div
          style={{
            background: 'var(--blue-pale)',
            border: '0.5px solid var(--blue-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 18px',
            fontSize: 13,
            lineHeight: 1.6,
            color: 'var(--text-secondary)',
          }}
        >
          <strong style={{ color: 'var(--blue)' }}>💻 Tryb CLI aktywny</strong> — ta instancja
          używa lokalnego Claude Code (Twojej subskrypcji). Klucz API nie jest potrzebny do
          analiz. Obrazy w analizach wymagają jednak klucza API.
          <div style={{ marginTop: 12 }}>
            <Button
              variant="ghost"
              style={{ padding: '8px 16px', fontSize: 13, color: 'var(--coral)' }}
              onClick={async () => {
                try {
                  await fetch('/api/shutdown', { method: 'POST' })
                  toast('Proba zatrzymana — możesz zamknąć tę kartę', 'info')
                } catch {
                  toast('Serwer już nie odpowiada — prawdopodobnie zatrzymany', 'info')
                }
              }}
            >
              ⏻ Zatrzymaj lokalny serwer
            </Button>
          </div>
        </div>
      )}

      <Card>
        <Label style={{ marginBottom: 10 }}>Klucz API Anthropic</Label>
        <div style={{ display: 'flex', gap: 8 }}>
          <Input
            type={visible ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            autoComplete="off"
          />
          <Button variant="ghost" onClick={() => setVisible(!visible)} style={{ whiteSpace: 'nowrap' }}>
            {visible ? 'Ukryj' : 'Pokaż'}
          </Button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.6 }}>
          Twój klucz jest przechowywany tylko lokalnie w tej przeglądarce. Nigdy nie jest wysyłany
          nigdzie poza Anthropic API.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Button onClick={handleSave}>Zapisz klucz</Button>
          <Button variant="ghost" onClick={handleTest} disabled={testing}>
            {testing ? 'Testowanie...' : 'Testuj połączenie'}
          </Button>
        </div>
      </Card>

      <Card>
        <Label style={{ marginBottom: 10 }}>Model</Label>
        <select
          disabled
          style={{
            background: 'var(--bg-input)',
            border: '0.5px solid var(--border-input)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: 'var(--text-primary)',
            width: '100%',
          }}
        >
          <option>claude-sonnet-4-20250514</option>
        </select>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
          W MVP dostępny jest jeden model. Więcej opcji pojawi się w przyszłych wersjach.
        </p>
      </Card>
    </div>
  )
}
