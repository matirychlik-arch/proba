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

const MODE_LABELS: Record<string, string> = {
  kreacja: 'kreacja reklamowa',
  hook: 'hook wideo (pierwsze 3 sekundy)',
  cena: 'cena / oferta',
  kampania: 'koncept kampanii',
  content: 'pomysł na content',
  decyzja: 'decyzja biznesowa',
}

const RESULT_FORMAT = `Odpowiadaj WYŁĄCZNIE w JSON. Zero tekstu poza JSON.
Format:
{
  "score": number (1-10),
  "conversionProbability": number (0-100),
  "reaction": "string — 2-3 zdania Twojej szczerej reakcji, pierwszoosobowo, po polsku",
  "emotionalTrigger": "string — co w Tobie zagrało (lub nie)",
  "strengths": ["string"],
  "risks": ["string"],
  "suggestion": "string — jedna konkretna zmiana która poprawiłaby Twój odbiór"
}`

export async function POST(req: NextRequest) {
  const apiKey = resolveApiKey(req)
  if (!apiKey && !isCliMode()) return apiError('Brak klucza API — dodaj go w ustawieniach', 401)

  const { persona, businessDescription, mode, input, context, imageBase64, cold } =
    await req.json()
  if (!input || !String(input).trim()) return apiError('Pusty input', 400)

  // Zimny klient: ZERO kontekstu biznesu i marki — widzi wyłącznie kreację.
  const system = cold
    ? `Jesteś przypadkowym polskim konsumentem scrollującym telefon. Nie znasz tej marki, nie znasz jej historii, nikt Ci nic nie tłumaczył. Widzisz tylko to, co przed Tobą — jak w feedzie. Reagujesz szczerze i bez litości: jeśli nie rozumiesz o co chodzi, mówisz to wprost. Jeśli coś brzmi jak żargon wewnętrzny firmy — wytykasz to. Oceniasz WYŁĄCZNIE to co widzisz.\n\n${RESULT_FORMAT}`
    : `Wcielasz się w konkretną osobę — polskiego konsumenta. Reagujesz na materiał marketingowy tak, jak zareagowałaby ta osoba: jej językiem, jej priorytetami, jej sceptycyzmem. Nie jesteś marketerem — jesteś klientem. Bądź szczery, konkretny, bez lizania tyłka.

TWOJA TOŻSAMOŚĆ:
Imię: ${persona?.name}, wiek: ${persona?.age}
${persona?.description}

KONTEKST BIZNESOWY (znasz tę markę jako klient):
${businessDescription ?? ''}

${RESULT_FORMAT}`

  const userText =
    `TYP MATERIAŁU: ${MODE_LABELS[mode] ?? mode}\nMATERIAŁ:\n${input}` +
    (context && !cold ? `\n\nDODATKOWY KONTEKST: ${context}` : '')

  try {
    const text = await claudeText({
      apiKey,
      system,
      userText,
      imageBase64,
      maxTokens: 1024,
      cacheSystem: !cold,
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
