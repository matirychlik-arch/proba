import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODEL, resolveApiKey, apiError, mapAnthropicError } from '@/lib/api-helpers'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const apiKey = resolveApiKey(req)
  if (!apiKey) return apiError('Brak klucza API — dodaj go w ustawieniach', 401)

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

  const anthropic = new Anthropic({ apiKey })
  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      system,
      messages: [
        {
          role: 'user',
          content: `MATERIAŁ (przypomnienie): ${input}\n\nOPINIE POZOSTAŁYCH:\n${othersText}\n\nTwoja rewizja:`,
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
