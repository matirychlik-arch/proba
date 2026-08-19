import { NextRequest } from 'next/server'
import { access } from 'fs/promises'
import { resolveApiKey, apiError, mapAnthropicError, isCliMode } from '@/lib/api-helpers'
import { processVideo, cleanupWorkdir, hasFfmpeg, FfmpegMissingError } from '@/lib/video/ffmpeg'
import { transcribeAudio } from '@/lib/video/transcript'
import { buildVideoDigest, digestToAnalysisInput } from '@/lib/video/digest'

export const runtime = 'nodejs'
/** Pełny pipeline wideo bywa długi — działa tylko lokalnie, więc limit Vercela nie gra roli. */
export const maxDuration = 800

/**
 * Pipeline wideo — DZIAŁA WYŁĄCZNIE LOKALNIE (Proba.app / npm run dev).
 * Wymaga ffmpeg na maszynie i dostępu do pliku po ścieżce, więc na Vercelu
 * ten endpoint jest świadomie zablokowany.
 */
export async function POST(req: NextRequest) {
  if (process.env.VERCEL) {
    return apiError(
      'Analiza wideo działa tylko w aplikacji Proba na Macu — wersja przeglądarkowa nie ma dostępu do ffmpeg ani do pliku wideo.',
      501
    )
  }

  const apiKey = resolveApiKey(req)
  if (!apiKey && !isCliMode()) {
    return apiError('Brak klucza API — dodaj go w ustawieniach', 401)
  }

  const { videoPath, hint } = await req.json()
  if (!videoPath || typeof videoPath !== 'string') {
    return apiError('Nie podano ścieżki do pliku wideo', 400)
  }

  try {
    await access(videoPath)
  } catch {
    return apiError(`Nie znaleziono pliku: ${videoPath}`, 404)
  }

  if (!(await hasFfmpeg())) {
    return apiError(new FfmpegMissingError().message, 503)
  }

  let workdir: string | null = null
  try {
    const video = await processVideo(videoPath)
    workdir = video.workdir

    const transcript = video.audioPath
      ? await transcribeAudio(video.audioPath)
      : { source: 'none' as const, text: '', segments: [] }

    const digest = await buildVideoDigest(apiKey, video, transcript, hint)

    return Response.json({
      digest,
      /** Ten tekst wchodzi do zwykłej analizy jako `input`. */
      analysisInput: digestToAnalysisInput(digest),
    })
  } catch (err) {
    if (err instanceof FfmpegMissingError) return apiError(err.message, 503)
    if (isCliMode() && err instanceof Error) return apiError(err.message, 500)
    const { message, status } = mapAnthropicError(err)
    return apiError(message, status)
  } finally {
    // Klatki i audio to pliki tymczasowe — nie zostawiamy ich na dysku.
    if (workdir) await cleanupWorkdir(workdir)
  }
}
