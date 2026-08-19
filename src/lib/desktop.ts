/** Most do natywnej powłoki (Electron). W przeglądarce `window.proba` nie istnieje. */

declare global {
  interface Window {
    proba?: {
      isDesktop: boolean
      pickVideo: () => Promise<string | null>
    }
  }
}

export interface VideoCapabilities {
  video: boolean
  reason: 'web' | 'ffmpeg' | null
  ffmpeg: boolean
  whisperLocal: boolean
  groq: boolean
}

export function isDesktop(): boolean {
  return typeof window !== 'undefined' && Boolean(window.proba?.isDesktop)
}

/** Natywne okno wyboru pliku — zwraca prawdziwą ścieżkę na dysku. */
export async function pickVideo(): Promise<string | null> {
  if (!isDesktop()) return null
  return window.proba!.pickVideo()
}

let cached: VideoCapabilities | null = null

export async function getVideoCapabilities(): Promise<VideoCapabilities> {
  if (cached) return cached
  try {
    const res = await fetch('/api/video/capabilities')
    cached = (await res.json()) as VideoCapabilities
  } catch {
    cached = { video: false, reason: 'web', ffmpeg: false, whisperLocal: false, groq: false }
  }
  return cached
}

/** Czytelny opis źródła transkryptu — do UI. */
export function transcriptSourceLabel(source: string): string {
  switch (source) {
    case 'whisper-local':
      return 'Whisper lokalnie (offline, za darmo)'
    case 'groq':
      return 'Whisper przez Groq API'
    default:
      return 'brak transkryptu'
  }
}
