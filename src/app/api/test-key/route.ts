import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODEL, resolveApiKey, apiError, mapAnthropicError } from '@/lib/api-helpers'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const apiKey = resolveApiKey(req)
  if (!apiKey) return apiError('Brak klucza API', 401)

  const anthropic = new Anthropic({ apiKey })
  try {
    await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 8,
      messages: [{ role: 'user', content: 'ping' }],
    })
    return Response.json({ ok: true })
  } catch (err) {
    const { message, status } = mapAnthropicError(err)
    return apiError(message, status)
  }
}
