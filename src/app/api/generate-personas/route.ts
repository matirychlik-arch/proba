import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODEL, resolveApiKey, apiError, mapAnthropicError } from '@/lib/api-helpers'

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
  if (!apiKey) return apiError('Brak klucza API — dodaj go w ustawieniach', 401)

  const { description, industry, city } = await req.json()
  if (!description || String(description).trim().length < 20) {
    return apiError('Opis biznesu jest za krótki żeby wygenerować sensowne persony', 400)
  }

  const anthropic = new Anthropic({ apiKey })
  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Opis biznesu: ${description}\nBranża: ${industry ?? 'nie podano'}\nMiasto: ${city ?? 'nie podano'}`,
        },
      ],
    })

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return apiError('Model zwrócił niepoprawny format — spróbuj ponownie', 502)

    const parsed = JSON.parse(jsonMatch[0])
    if (!Array.isArray(parsed.personas) || parsed.personas.length === 0) {
      return apiError('Model nie wygenerował person — spróbuj ponownie', 502)
    }

    return Response.json({ personas: parsed.personas })
  } catch (err) {
    if (err instanceof SyntaxError) {
      return apiError('Nie udało się sparsować odpowiedzi modelu — spróbuj ponownie', 502)
    }
    const { message, status } = mapAnthropicError(err)
    return apiError(message, status)
  }
}
