import { isCliMode } from '@/lib/api-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Informuje klienta, jakim providerem dysponuje serwer (api = wymagany klucz). */
export async function GET() {
  return Response.json({ provider: isCliMode() ? 'cli' : 'api' })
}
