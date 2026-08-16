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

export async function POST(req: NextRequest) {
  const apiKey = resolveApiKey(req)
  if (!apiKey && !isCliMode()) return apiError('Brak klucza API — dodaj go w ustawieniach', 401)

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

  try {
    const text = await claudeText({
      apiKey,
      system,
      userText: `TRYB: ${mode}\nMATERIAŁ:\n${input}\n\nNIEZALEŻNE REAKCJE PERSON:\n${resultsText}${coldText}${shiftsText}\n\nTwoja synteza:`,
      maxTokens: 1536,
    })
    const parsed = extractJson(text)
    if (!parsed) return apiError('Niepoprawny format odpowiedzi modelu', 502)
    return Response.json(parsed)
  } catch (err) {
    if (isCliMode() && err instanceof Error) return apiError(err.message, 500)
    const { message, status } = mapAnthropicError(err)
    return apiError(message, status)
  }
}
