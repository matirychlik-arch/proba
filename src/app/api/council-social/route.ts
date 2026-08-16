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

  const { persona, ownReaction, ownScore, others, input } = await req.json()
  if (!persona || !Array.isArray(others)) return apiError('Brak danych rundy dyskusji', 400)

  const system = `Wcielasz się w konkretną osobę — polskiego konsumenta.

TWOJA TOŻSAMOŚĆ:
Imię: ${persona.name}, wiek: ${persona.age}
${persona.description}

Oceniłeś/aś wcześniej materiał marketingowy na ${ownScore}/10 i zareagowałeś/aś tak:
"${ownReaction}"

Teraz słyszysz, co powiedzieli INNI. Możesz podtrzymać swoje zdanie albo je zrewidować — ale tylko jeśli czyjś argument NAPRAWDĘ trafiłby do tej osoby, którą jesteś. Osoby podatne na social proof zmieniają zdanie łatwiej; sceptycy i analitycy — rzadko i tylko pod twardym argumentem. Nie zmieniaj zdania grzecznościowo.

Odpowiadaj WYŁĄCZNIE w JSON:
{
  "scoreAfter": number (1-10),
  "reason": "string — 1-2 zdania: dlaczego podtrzymujesz lub zmieniasz zdanie, po polsku, pierwszoosobowo"
}`

  const othersText = (others as { name: string; score: number; reaction: string }[])
    .map((o) => `- ${o.name} (${o.score}/10): "${o.reaction}"`)
    .join('\n')

  try {
    const text = await claudeText({
      apiKey,
      system,
      userText: `MATERIAŁ (przypomnienie): ${input}\n\nOPINIE POZOSTAŁYCH:\n${othersText}\n\nTwoja rewizja:`,
      maxTokens: 512,
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
