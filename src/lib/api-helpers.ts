import { NextRequest } from 'next/server'

export const CLAUDE_MODEL = 'claude-sonnet-4-20250514'

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
