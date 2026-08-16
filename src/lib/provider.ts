/** Klient: sprawdza jakim providerem dysponuje serwer (cli = klucz API zbędny). */

let cached: 'api' | 'cli' | null = null

export async function getProvider(): Promise<'api' | 'cli'> {
  if (cached) return cached
  try {
    const res = await fetch('/api/provider')
    const data = await res.json()
    cached = data.provider === 'cli' ? 'cli' : 'api'
  } catch {
    cached = 'api'
  }
  return cached
}
