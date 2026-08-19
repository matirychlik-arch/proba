import { hasFfmpeg } from '@/lib/video/ffmpeg'
import { whisperLocalAvailable } from '@/lib/video/transcript'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Co potrafi ta instancja — UI włącza tryb wideo tylko gdy jest czym go obsłużyć. */
export async function GET() {
  if (process.env.VERCEL) {
    return Response.json({
      video: false,
      reason: 'web',
      ffmpeg: false,
      whisperLocal: false,
      groq: false,
    })
  }

  const [ffmpeg, whisperLocal] = await Promise.all([hasFfmpeg(), whisperLocalAvailable()])

  return Response.json({
    video: ffmpeg,
    reason: ffmpeg ? null : 'ffmpeg',
    ffmpeg,
    whisperLocal,
    groq: Boolean(process.env.GROQ_API_KEY),
  })
}
