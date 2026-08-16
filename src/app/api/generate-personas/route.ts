import { NextRequest } from 'next/server'
import {
  resolveApiKey,
  apiError,
  mapAnthropicError,
  claudeText,
  extractJson,
  isCliMode,
} from '@/lib/api-helpers'

export const runtime = 'nodejs'
export const maxDuration = 60

const SYSTEM_PROMPT = `Jesteś ekspertem od badań konsumenckich i psychografii rynkowej.
Na podstawie opisu biznesu wygeneruj 4 precyzyjne persony klientów.

Odpowiadaj WYŁĄCZNIE w formacie JSON. Zero tekstu poza JSON.

Format:
{
  "personas": [
    {
      "name": "string — polskie imię",
      "age": "string — wiek lub przedział, np. '23' lub '25-32'",
      "emoji": "string — jeden emoji charakteryzujący personę",
      "shortDesc": "string — max 10 słów, esencja persony",
      "description": "string — 200-300 słów pełnego profilu: demografia, psychografia, motywacje, bariery, media habits, stosunek do kategorii produktowej, typowy dzień, co go/ją wkurwia, co kocha, jak podejmuje decyzje zakupowe"
    }
  ]
}`

export async function POST(req: NextRequest) {
  const apiKey = resolveApiKey(req)
  if (!apiKey && !isCliMode()) return apiError('Brak klucza API — dodaj go w ustawieniach', 401)

  const { description, industry, city } = await req.json()
  if (!description || String(description).trim().length < 20) {
    return apiError('Opis biznesu jest za krótki żeby wygenerować sensowne persony', 400)
  }

  try {
    const text = await claudeText({
      apiKey,
      system: SYSTEM_PROMPT,
      userText: `Opis biznesu: ${description}\nBranża: ${industry ?? 'nie podano'}\nMiasto: ${city ?? 'nie podano'}`,
      maxTokens: 4096,
    })

    const parsed = extractJson<{ personas?: unknown[] }>(text)
    if (!parsed) return apiError('Model zwrócił niepoprawny format — spróbuj ponownie', 502)
    if (!Array.isArray(parsed.personas) || parsed.personas.length === 0) {
      return apiError('Model nie wygenerował person — spróbuj ponownie', 502)
    }

    return Response.json({ personas: parsed.personas })
  } catch (err) {
    if (isCliMode() && err instanceof Error) return apiError(err.message, 500)
    const { message, status } = mapAnthropicError(err)
    return apiError(message, status)
  }
}
