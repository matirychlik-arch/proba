import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODEL, resolveApiKey, apiError, mapAnthropicError } from '@/lib/api-helpers'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const apiKey = resolveApiKey(req)
  if (!apiKey) return apiError('Brak klucza API — dodaj go w ustawieniach', 401)

  const { mode, input, businessDescription, personaResults, coldClient, socialShifts } =
    await req.json()
  if (!Array.isArray(personaResults) || personaResults.length === 0) {
    return apiError('Brak wyników person do syntezy', 400)
  }

  const system = `Jesteś strategiem marketingowym z 15-letnim doświadczeniem w Polsce.
Przewodniczysz radzie person: niezależne reakcje klientów zostały już zebrane (każda persona oceniała OSOBNO, bez wiedzy o innych), odbyła się też runda dyskusji.
Twoim zadaniem jest synteza: gdzie persony są zgodne (mocny sygnał), gdzie się rozjeżdżają (i dlaczego — to często najciekawsze), co powiedział zimny klient (osoba bez żadnej wiedzy o marce — jej niezrozumienie to klątwa wiedzy twórcy, potraktuj to poważnie).
Bądź szczery, konkretny i odważny. Nie lizesz tyłka. Rama: diagnoza słabych punktów przed publikacją, nie wróżenie sukcesu.

Kontekst biznesowy:
${businessDescription ?? ''}

Odpowiadaj WYŁĄCZNIE w JSON:
{
  "verdict": "string — 3-4 zdania syntezy: zgoda/spór rady + głos zimnego klienta, po polsku",
  "overallScore": number (1-10),
  "hookScore": number (1-10) lub null (tylko dla trybu kreacja/hook),
  "emotionalScore": number (1-10),
  "potentialScore": number (1-10),
  "biggestRisk": "string — jedno zdanie",
  "hiddenOpportunity": "string — jedno zdanie",
  "topActions": ["string", "string", "string"]
}`

  const resultsText = (
    personaResults as {
      name: string
      score: number
      scoreAfter?: number
      reaction: string
      strengths?: string[]
      risks?: string[]
    }[]
  )
    .map(
      (r) =>
        `${r.name}: ${r.score}/10${r.scoreAfter != null && r.scoreAfter !== r.score ? ` (po dyskusji: ${r.scoreAfter}/10)` : ''}\nReakcja: "${r.reaction}"\nPlusy: ${(r.strengths ?? []).join('; ')}\nRyzyka: ${(r.risks ?? []).join('; ')}`
    )
    .join('\n\n')

  const coldText = coldClient
    ? `\n\nZIMNY KLIENT (zero kontekstu marki): ${coldClient.score}/10\nReakcja: "${coldClient.reaction}"\nRyzyka: ${(coldClient.risks ?? []).join('; ')}`
    : ''

  const shiftsText =
    Array.isArray(socialShifts) && socialShifts.length > 0
      ? `\n\nRUNDA DYSKUSJI (symulacja — zmiany zdania):\n${(
          socialShifts as { personaName?: string; personaId: string; scoreBefore: number; scoreAfter: number; reason: string }[]
        )
          .map((s) => `- ${s.personaName ?? s.personaId}: ${s.scoreBefore}→${s.scoreAfter}: "${s.reason}"`)
          .join('\n')}`
      : ''

  const anthropic = new Anthropic({ apiKey })
  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1536,
      system,
      messages: [
        {
          role: 'user',
          content: `TRYB: ${mode}\nMATERIAŁ:\n${input}\n\nNIEZALEŻNE REAKCJE PERSON:\n${resultsText}${coldText}${shiftsText}\n\nTwoja synteza:`,
        },
      ],
    })
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return apiError('Niepoprawny format odpowiedzi modelu', 502)
    return Response.json(JSON.parse(jsonMatch[0]))
  } catch (err) {
    if (err instanceof SyntaxError) return apiError('Błąd parsowania odpowiedzi', 502)
    const { message, status } = mapAnthropicError(err)
    return apiError(message, status)
  }
}
