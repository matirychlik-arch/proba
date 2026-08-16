import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { isCliMode, runClaudeCli } from './claude-cli'

export const CLAUDE_MODEL = 'claude-sonnet-4-20250514'
export { isCliMode }

export function resolveApiKey(req: NextRequest): string | null {
  const header = req.headers.get('x-api-key')
  if (header && header.trim()) return header.trim()
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY
  return null
}

export function apiError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

export function mapAnthropicError(err: unknown): { message: string; status: number } {
  const anyErr = err as { status?: number; message?: string }
  const status = anyErr.status
  if (status === 401) return { message: 'Nieprawidłowy klucz API — sprawdź go w ustawieniach', status: 401 }
  if (status === 429) return { message: 'Limit zapytań przekroczony — spróbuj za chwilę', status: 429 }
  if (status === 529) return { message: 'API Anthropic jest przeciążone — spróbuj ponownie', status: 529 }
  return { message: 'Błąd API: ' + (anyErr.message ?? 'nieznany'), status: status ?? 500 }
}

interface ClaudeTextOptions {
  apiKey: string | null
  system: string
  userText: string
  imageBase64?: string
  maxTokens: number
  /** Cache'uj system prompt (opłaca się gdy ten sam system idzie w N calli). */
  cacheSystem?: boolean
}

/**
 * Jeden call do Claude — provider wybierany konfiguracją:
 * - CLAUDE_PROVIDER=cli → lokalny Claude Code (subskrypcja), tylko lokalnie
 * - domyślnie → Anthropic API (klucz użytkownika)
 * Zwraca surowy tekst odpowiedzi.
 */
export async function claudeText(opts: ClaudeTextOptions): Promise<string> {
  if (isCliMode()) {
    if (opts.imageBase64) {
      throw new Error(
        'Tryb CLI nie obsługuje obrazów — usuń obraz albo przełącz się na klucz API'
      )
    }
    return runClaudeCli(opts.system, opts.userText)
  }

  if (!opts.apiKey) {
    const err = new Error('Brak klucza API') as Error & { status: number }
    err.status = 401
    throw err
  }

  const anthropic = new Anthropic({ apiKey: opts.apiKey })
  const content: Anthropic.ContentBlockParam[] = []
  if (opts.imageBase64) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: opts.imageBase64 },
    })
  }
  content.push({ type: 'text', text: opts.userText })

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: opts.maxTokens,
    system: opts.cacheSystem
      ? [{ type: 'text', text: opts.system, cache_control: { type: 'ephemeral' } }]
      : opts.system,
    messages: [{ role: 'user', content }],
  })

  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
}

/** Wyciąga pierwszy obiekt JSON z tekstu odpowiedzi modelu. */
export function extractJson<T>(text: string): T | null {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0]) as T
  } catch {
    return null
  }
}
