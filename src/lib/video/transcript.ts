import { spawn } from 'child_process'
import { readFile, access } from 'fs/promises'
import { basename, join } from 'path'
import { homedir } from 'os'

/**
 * Transkrypcja audio — WYŁĄCZNIE Node (lokalnie).
 *
 * Trzy poziomy, w kolejności preferencji:
 *  1. whisper.cpp lokalnie — darmowe, offline, na Apple Silicon szybciej niż realtime
 *     (Metal). Wymaga `brew install whisper-cpp` + pobranego modelu.
 *  2. Groq Whisper API — grosze (~0,04 $/h), bardzo szybkie. Wymaga GROQ_API_KEY.
 *  3. Brak — użytkownik wkleja skrypt ręcznie (i tak zna własne wideo).
 */

export type TranscriptSource = 'whisper-local' | 'groq' | 'none'

export interface TranscriptSegment {
  start: number
  end: number
  text: string
}

export interface TranscriptResult {
  source: TranscriptSource
  text: string
  segments: TranscriptSegment[]
}

/** Typowe lokalizacje modeli whisper.cpp po instalacji z brew / ręcznym pobraniu. */
const MODEL_CANDIDATES = [
  join(homedir(), '.cache/whisper/ggml-base.bin'),
  join(homedir(), '.cache/whisper/ggml-small.bin'),
  join(homedir(), 'Library/Application Support/Proba/models/ggml-base.bin'),
  '/opt/homebrew/share/whisper-cpp/ggml-base.bin',
  '/usr/local/share/whisper-cpp/ggml-base.bin',
]

const WHISPER_BINARIES = ['whisper-cli', 'whisper-cpp', 'main']

async function exists(p: string): Promise<boolean> {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

function run(cmd: string, args: string[], timeoutMs = 600_000): Promise<string> {
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
    child.on('error', (e) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(e)
    })
    child.on('close', (code) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (code === 0) resolve(out)
      else reject(new Error(err.slice(-400) || `kod ${code}`))
    })
  })
}

async function findWhisperBinary(): Promise<string | null> {
  for (const bin of WHISPER_BINARIES) {
    try {
      await run(bin, ['--help'], 8_000)
      return bin
    } catch {
      /* próbuj dalej */
    }
  }
  return null
}

async function findWhisperModel(): Promise<string | null> {
  for (const m of MODEL_CANDIDATES) {
    if (await exists(m)) return m
  }
  return null
}

/** Czy da się transkrybować lokalnie (bez sieci i bez kosztów). */
export async function whisperLocalAvailable(): Promise<boolean> {
  return Boolean((await findWhisperBinary()) && (await findWhisperModel()))
}

/** Parsuje format .srt, który whisper.cpp zapisuje obok pliku audio. */
function parseSrt(srt: string): TranscriptSegment[] {
  const toSec = (stamp: string) => {
    const [h, m, rest] = stamp.split(':')
    const [s, ms] = rest.replace(',', '.').split('.')
    return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms ?? 0) / 1000
  }

  return srt
    .split(/\n\s*\n/)
    .map((block) => block.trim().split('\n'))
    .filter((lines) => lines.length >= 2 && lines[1]?.includes('-->'))
    .map((lines) => {
      const [from, to] = lines[1].split('-->').map((s) => s.trim())
      return {
        start: toSec(from),
        end: toSec(to),
        text: lines.slice(2).join(' ').trim(),
      }
    })
    .filter((s) => s.text)
}

async function transcribeLocal(audioPath: string): Promise<TranscriptResult | null> {
  const bin = await findWhisperBinary()
  const model = await findWhisperModel()
  if (!bin || !model) return null

  const outBase = audioPath.replace(/\.wav$/, '')
  await run(bin, [
    '-m', model,
    '-f', audioPath,
    '-l', 'pl',       // polski — główny język materiałów Mata
    '-osrt',          // wyjście .srt ze znacznikami czasu
    '-of', outBase,
    '-np',            // bez printów postępu
  ])

  const srt = await readFile(`${outBase}.srt`, 'utf8').catch(() => '')
  if (!srt.trim()) return null

  const segments = parseSrt(srt)
  return {
    source: 'whisper-local',
    text: segments.map((s) => s.text).join(' '),
    segments,
  }
}

async function transcribeGroq(audioPath: string): Promise<TranscriptResult | null> {
  const key = process.env.GROQ_API_KEY
  if (!key) return null

  const audio = await readFile(audioPath)
  const form = new FormData()
  form.append('file', new Blob([new Uint8Array(audio)], { type: 'audio/wav' }), basename(audioPath))
  form.append('model', 'whisper-large-v3-turbo')
  form.append('language', 'pl')
  form.append('response_format', 'verbose_json')

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  })
  if (!res.ok) return null

  const data = (await res.json()) as {
    text?: string
    segments?: Array<{ start: number; end: number; text: string }>
  }

  return {
    source: 'groq',
    text: data.text ?? '',
    segments: (data.segments ?? []).map((s) => ({
      start: s.start,
      end: s.end,
      text: s.text.trim(),
    })),
  }
}

/** Próbuje po kolei: lokalnie → Groq → nic. Nigdy nie rzuca. */
export async function transcribeAudio(audioPath: string): Promise<TranscriptResult> {
  for (const attempt of [transcribeLocal, transcribeGroq]) {
    try {
      const result = await attempt(audioPath)
      if (result?.text.trim()) return result
    } catch {
      /* następny poziom */
    }
  }
  return { source: 'none', text: '', segments: [] }
}

/** Transkrypt jako tekst ze znacznikami czasu — do promptu. */
export function formatTranscript(t: TranscriptResult): string {
  if (!t.segments.length) return t.text
  return t.segments
    .map((s) => `[${s.start.toFixed(1)}s] ${s.text}`)
    .join('\n')
}
