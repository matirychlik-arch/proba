import { spawn } from 'child_process'
import { mkdtemp, readdir, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

/**
 * Wrapper na ffmpeg — WYŁĄCZNIE Node (Electron main / API route lokalnie).
 * Nigdy nie importować tego z komponentu klienckiego.
 *
 * Budżet klatek wzorowany na bradautomates/claude-video (MIT) — sprawdzone
 * parametry: im dłuższe wideo, tym rzadsze próbkowanie, twardy limit 100 klatek
 * i 2 fps, bo koszt tokenów rośnie liniowo z liczbą klatek.
 */

export interface VideoMeta {
  durationSec: number
  width: number
  height: number
  fps: number
  hasAudio: boolean
}

export interface ExtractedFrame {
  /** Sekunda w wideo, z której pochodzi klatka. */
  t: number
  /** Ścieżka na dysku (tryb CLI czyta ją bezpośrednio). */
  path: string
}

export interface VideoProcessResult {
  meta: VideoMeta
  frames: ExtractedFrame[]
  /** Ścieżka do wyekstrahowanego audio (16 kHz mono wav) albo null. */
  audioPath: string | null
  /** Katalog roboczy — wywołujący sprząta przez cleanupWorkdir(). */
  workdir: string
}

const MAX_FRAMES = 100
const MAX_FPS = 2
/** Dłuższy bok klatki. 768 px to dobry kompromis detal/tokeny (~550 tok. dla 9:16). */
const FRAME_LONG_EDGE = 768

export class FfmpegMissingError extends Error {
  constructor() {
    super(
      'Nie znaleziono ffmpeg. Zainstaluj: brew install ffmpeg — potem uruchom Probę ponownie.'
    )
    this.name = 'FfmpegMissingError'
  }
}

function run(cmd: string, args: string[], timeoutMs = 300_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args)
    let out = ''
    let err = ''
    let settled = false

    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      child.kill('SIGKILL')
      reject(new Error(`${cmd}: przekroczono limit czasu`))
    }, timeoutMs)

    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (err += d))

    child.on('error', (e: NodeJS.ErrnoException) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(e.code === 'ENOENT' ? new FfmpegMissingError() : e)
    })

    child.on('close', (code) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (code !== 0) {
        reject(new Error(`${cmd} zakończył się błędem: ${err.slice(-400)}`))
        return
      }
      resolve(out)
    })
  })
}

export async function hasFfmpeg(): Promise<boolean> {
  try {
    await run('ffprobe', ['-version'], 10_000)
    return true
  } catch {
    return false
  }
}

/** Ile klatek wyciągnąć dla danej długości — krzywa z claude-video. */
export function frameBudget(durationSec: number): number {
  let budget: number
  if (durationSec <= 30) budget = 30
  else if (durationSec <= 60) budget = 40
  else if (durationSec <= 180) budget = 60
  else if (durationSec <= 600) budget = 80
  else budget = MAX_FRAMES

  // Nigdy gęściej niż MAX_FPS — przy bardzo krótkim wideo budżet by na to pozwolił.
  const fpsCap = Math.max(1, Math.floor(durationSec * MAX_FPS))
  return Math.max(1, Math.min(budget, fpsCap, MAX_FRAMES))
}

export async function probeVideo(videoPath: string): Promise<VideoMeta> {
  const raw = await run('ffprobe', [
    '-v', 'error',
    '-print_format', 'json',
    '-show_format',
    '-show_streams',
    videoPath,
  ])

  const data = JSON.parse(raw) as {
    format?: { duration?: string }
    streams?: Array<{
      codec_type?: string
      width?: number
      height?: number
      avg_frame_rate?: string
    }>
  }

  const video = (data.streams ?? []).find((s) => s.codec_type === 'video')
  if (!video) throw new Error('Plik nie zawiera ścieżki wideo')

  const [num, den] = (video.avg_frame_rate ?? '0/1').split('/').map(Number)
  const fps = den ? num / den : 0

  return {
    durationSec: Number(data.format?.duration ?? 0),
    width: video.width ?? 0,
    height: video.height ?? 0,
    fps: Number.isFinite(fps) ? Math.round(fps * 100) / 100 : 0,
    hasAudio: (data.streams ?? []).some((s) => s.codec_type === 'audio'),
  }
}

/**
 * Wyciąga klatki równomiernie rozłożone po całej długości wideo.
 * Zwraca posortowane ścieżki wraz ze znacznikiem czasu.
 */
export async function extractFrames(
  videoPath: string,
  meta: VideoMeta,
  workdir: string,
  maxFrames?: number
): Promise<ExtractedFrame[]> {
  const count = Math.min(frameBudget(meta.durationSec), maxFrames ?? MAX_FRAMES)
  const fps = count / Math.max(meta.durationSec, 0.001)

  // Skalowanie: dłuższy bok do FRAME_LONG_EDGE, proporcje zachowane, wymiary parzyste.
  const scale =
    meta.width >= meta.height
      ? `scale=${FRAME_LONG_EDGE}:-2`
      : `scale=-2:${FRAME_LONG_EDGE}`

  await run('ffmpeg', [
    '-v', 'error',
    '-i', videoPath,
    '-vf', `fps=${fps.toFixed(6)},${scale}`,
    '-frames:v', String(count),
    '-q:v', '4',
    join(workdir, 'frame-%03d.jpg'),
  ])

  const files = (await readdir(workdir))
    .filter((f) => f.startsWith('frame-') && f.endsWith('.jpg'))
    .sort()

  const step = meta.durationSec / Math.max(files.length, 1)
  return files.map((f, i) => ({
    t: Math.round(i * step * 10) / 10,
    path: join(workdir, f),
  }))
}

/** Audio w formacie, którego oczekuje Whisper: 16 kHz, mono, PCM. */
export async function extractAudio(
  videoPath: string,
  workdir: string
): Promise<string> {
  const audioPath = join(workdir, 'audio.wav')
  await run('ffmpeg', [
    '-v', 'error',
    '-i', videoPath,
    '-vn',
    '-ac', '1',
    '-ar', '16000',
    '-c:a', 'pcm_s16le',
    audioPath,
  ])
  return audioPath
}

export async function createWorkdir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'proba-video-'))
}

export async function cleanupWorkdir(workdir: string): Promise<void> {
  await rm(workdir, { recursive: true, force: true }).catch(() => {})
}

/** Pełny przebieg: sonda → klatki → audio. */
export async function processVideo(
  videoPath: string,
  opts: { maxFrames?: number; withAudio?: boolean } = {}
): Promise<VideoProcessResult> {
  const meta = await probeVideo(videoPath)
  const workdir = await createWorkdir()

  try {
    const frames = await extractFrames(videoPath, meta, workdir, opts.maxFrames)
    let audioPath: string | null = null
    if (opts.withAudio !== false && meta.hasAudio) {
      audioPath = await extractAudio(videoPath, workdir)
    }
    return { meta, frames, audioPath, workdir }
  } catch (e) {
    await cleanupWorkdir(workdir)
    throw e
  }
}
