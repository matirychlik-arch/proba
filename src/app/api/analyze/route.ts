import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  CLAUDE_MODEL,
  resolveApiKey,
  apiError,
  mapAnthropicError,
  claudeText,
  isCliMode,
} from '@/lib/api-helpers'

export const runtime = 'nodejs'
export const maxDuration = 120

const MODE_LABELS: Record<string, string> = {
  kreacja: 'Ocena kreacji reklamowej',
  hook: 'Testowanie hooka wideo (pierwsze 3 sekundy)',
  cena: 'Reakcja na cenę lub zmianę cen',
  kampania: 'Ocena konceptu kampanii',
  content: 'Pomysł na serię wideo lub post',
  decyzja: 'Ogólna decyzja biznesowa / strategiczna',
}

function buildSystemPrompt(businessDescription: string, personasJson: string): string {
  return `Jesteś strategiem marketingowym z 15-letnim doświadczeniem w Polsce.
Specjalizujesz się w predykcji reakcji konsumentów na działania marketingowe.

Masz dostęp do profilu biznesowego klienta i grupy docelowej.
Twoim zadaniem jest symulacja reakcji konkretnych person na podany input marketingowy.

Bądź szczery, konkretny i odważny w ocenach. Nie lizesz tyłka.
Jeśli pomysł jest słaby — powiedz to wprost i wyjaśnij dlaczego.
Jeśli jest silny — powiedz co dokładnie działa i co można jeszcze ulepszyć.

Kontekst biznesowy:
${businessDescription}

Persony do symulacji:
${personasJson}

Odpowiadaj WYŁĄCZNIE w JSON. Zero tekstu poza JSON. Zacznij od pola "verdict", potem score'y, potem "biggestRisk" i "hiddenOpportunity", potem "personas" (w kolejności jak wyżej), na końcu "topActions".

Format odpowiedzi:
{
  "verdict": "string — 2-3 zdania syntetycznego werdyktu, konkretne, po polsku",
  "overallScore": number (1-10),
  "hookScore": number (1-10, tylko jeśli tryb = kreacja lub hook, inaczej null),
  "emotionalScore": number (1-10),
  "potentialScore": number (1-10),
  "biggestRisk": "string — jedno zdanie, największe ryzyko",
  "hiddenOpportunity": "string — jedno zdanie, nieoczywista szansa",
  "personas": [
    {
      "personaId": "string",
      "score": number (1-10),
      "conversionProbability": number (0-100),
      "reaction": "string — 2-3 zdania jak ta persona konkretnie zareaguje, po polsku",
      "emotionalTrigger": "string — główny trigger emocjonalny tej persony",
      "strengths": ["string", "string"],
      "risks": ["string"],
      "suggestion": "string — jedna konkretna zmiana dla tej persony"
    }
  ],
  "topActions": ["string", "string", "string"]
}`
}

export async function POST(req: NextRequest) {
  const apiKey = resolveApiKey(req)
  if (!apiKey && !isCliMode()) return apiError('Brak klucza API — dodaj go w ustawieniach', 401)

  const body = await req.json()
  const { mode, input, context, personas, businessDescription, imageBase64 } = body

  if (!input || !String(input).trim()) return apiError('Input analizy jest pusty', 400)
  if (!Array.isArray(personas) || personas.length === 0) {
    return apiError('Wybierz przynajmniej jedną personę', 400)
  }

  // Tryb CLI: brak streamingu — jeden pełny call, wynik jako pojedynczy chunk SSE.
  if (isCliMode()) {
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          const text = await claudeText({
            apiKey,
            system: buildSystemPrompt(
              businessDescription ?? '',
              JSON.stringify(personas, null, 2)
            ),
            userText:
              `TRYB: ${MODE_LABELS[mode] ?? mode}\nINPUT: ${input}` +
              (context ? `\nDODATKOWY KONTEKST: ${context}` : ''),
            imageBase64,
            maxTokens: 8192,
          })
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Błąd trybu CLI'
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`))
        }
        controller.close()
      },
    })
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  }

  if (!apiKey) return apiError('Brak klucza API — dodaj go w ustawieniach', 401)

  const userContent: Anthropic.ContentBlockParam[] = []
  if (imageBase64) {
    userContent.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 },
    })
  }
  userContent.push({
    type: 'text',
    text:
      `TRYB: ${MODE_LABELS[mode] ?? mode}\nINPUT: ${input}` +
      (context ? `\nDODATKOWY KONTEKST: ${context}` : ''),
  })

  const anthropic = new Anthropic({ apiKey })

  try {
    const stream = anthropic.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      system: buildSystemPrompt(businessDescription ?? '', JSON.stringify(personas, null, 2)),
      messages: [{ role: 'user', content: userContent }],
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
              )
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
          controller.close()
        } catch (err) {
          const { message } = mapAnthropicError(err)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    const { message, status } = mapAnthropicError(err)
    return apiError(message, status)
  }
}
