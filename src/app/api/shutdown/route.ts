import { isCliMode, apiError } from '@/lib/api-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Zatrzymuje lokalny serwer Proby (uruchamiany przez Proba.app bez Terminala).
 * Dostępne WYŁĄCZNIE w trybie CLI — na Vercelu / w trybie API nie istnieje potrzeba
 * i nie wolno pozwalać na zdalne ubijanie procesu.
 */
export async function POST() {
  if (!isCliMode()) return apiError('Niedostępne w tym trybie', 403)
  // Odpowiedz zanim proces zgaśnie.
  setTimeout(() => process.exit(0), 300)
  return Response.json({ ok: true, message: 'Proba zatrzymuje się...' })
}
