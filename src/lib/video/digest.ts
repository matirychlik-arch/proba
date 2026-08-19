import { readFile } from 'fs/promises'
import { claudeText, extractJson, isCliMode } from '@/lib/api-helpers'
import type { VideoProcessResult } from './ffmpeg'
import { formatTranscript, type TranscriptResult } from './transcript'

/**
 * "Czytanie" wideo: klatki + transkrypt → ustrukturyzowany opis tekstowy.
 *
 * To jest krok wstępny, nie analiza. Dzięki niemu wideo wchodzi do istniejącego
 * pipeline'u Proby jako zwykły (tylko bogatszy) tekst — szybka analiza, rada
 * person i zimny klient działają bez zmian. Efekt uboczny: opis sam w sobie jest
 * dobrym materiałem na ekran ("oto co Proba zobaczyła w Twoim wideo").
 */

export interface VideoBeat {
  /** Sekunda, w której ten fragment się zaczyna. */
  t: number
  /** Co widać w kadrze. */
  visual: string
  /** Co słychać (kwestia z transkryptu albo opis dźwięku). */
  audio: string
}

export interface VideoDigest {
  beats: VideoBeat[]
  /** Pierwsze 3 sekundy — osobno, bo to o nie toczy się gra na TikToku. */
  hook: string
  visualStyle: string
  pacing: string
  /** Zwięzły opis całości — to trafia jako `input` do analizy. */
  summary: string
  transcript: string
  meta: {
    durationSec: number
    resolution: string
    frameCount: number
    transcriptSource: string
  }
}

const SYSTEM_PROMPT = `Jesteś analitykiem materiałów wideo. Dostajesz klatki z wideo w kolejności chronologicznej (każda opisana znacznikiem czasu) oraz transkrypt ścieżki dźwiękowej.

Twoim zadaniem jest OPISAĆ to wideo — nie oceniać go. Opis ma być tak dokładny, żeby ktoś, kto wideo nie widział, mógł na jego podstawie ocenić materiał marketingowo.

Zwracaj uwagę na: co dokładnie widać w kadrze, jak zmienia się obraz między klatkami, tempo cięć, tekst na ekranie (napisy, grafiki), mimikę i gestykulację, jakość i styl realizacji, kolorystykę, kadrowanie (pion/poziom), oraz jak obraz łączy się z tym, co jest mówione.

Odpowiadaj WYŁĄCZNIE w JSON. Zero tekstu poza JSON.

Format:
{
  "beats": [
    { "t": number, "visual": "string — co widać w kadrze", "audio": "string — co słychać/mówione" }
  ],
  "hook": "string — dokładny opis pierwszych 3 sekund: co widać i co pada, sekunda po sekundzie",
  "visualStyle": "string — styl realizacji: kadrowanie, kolory, montaż, jakość, napisy na ekranie",
  "pacing": "string — tempo: jak często zmienia się obraz, gdzie zwalnia, gdzie przyspiesza",
  "summary": "string — 4-6 zdań streszczenia całego wideo: o czym jest, jak zbudowane, co pokazuje i mówi. Pisane tak, by osoba nieoglądająca mogła to ocenić."
}`

/** Ile klatek realnie wysłać do modelu (koszt tokenów rośnie liniowo). */
const MAX_DIGEST_FRAMES = 40

function pickFrames<T>(frames: T[], limit: number): T[] {
  if (frames.length <= limit) return frames
  const step = (frames.length - 1) / (limit - 1)
  return Array.from({ length: limit }, (_, i) => frames[Math.round(i * step)])
}

export async function buildVideoDigest(
  apiKey: string | null,
  video: VideoProcessResult,
  transcript: TranscriptResult,
  hint?: string
): Promise<VideoDigest> {
  const selected = pickFrames(video.frames, MAX_DIGEST_FRAMES)

  // W trybie API klatki muszą pojechać jako base64; w CLI wystarczą ścieżki.
  const frames = await Promise.all(
    selected.map(async (f) => ({
      t: f.t,
      path: f.path,
      base64: isCliMode() ? undefined : (await readFile(f.path)).toString('base64'),
    }))
  )

  const transcriptText = formatTranscript(transcript)
  const userText = [
    `WIDEO: ${video.meta.durationSec.toFixed(1)}s, ${video.meta.width}x${video.meta.height}, ${video.meta.fps} fps`,
    `LICZBA KLATEK: ${frames.length} (równomiernie z całej długości)`,
    transcriptText
      ? `\nTRANSKRYPT ŚCIEŻKI DŹWIĘKOWEJ:\n${transcriptText}`
      : '\nTRANSKRYPT: brak (wideo bez ścieżki dźwiękowej albo transkrypcja niedostępna) — opisz wyłącznie warstwę wizualną i zaznacz brak dźwięku.',
    hint ? `\nKONTEKST OD AUTORA: ${hint}` : '',
    '\nOpisz to wideo w zadanym formacie JSON.',
  ].join('\n')

  const raw = await claudeText({
    apiKey,
    system: SYSTEM_PROMPT,
    userText,
    frames,
    // Opis wideo to gęste zadanie percepcyjne — dajemy zapas i myślenie.
    maxTokens: 8192,
    thinking: 'adaptive',
    effort: 'medium',
  })

  const parsed = extractJson<Omit<VideoDigest, 'transcript' | 'meta'>>(raw)
  if (!parsed) throw new Error('Model zwrócił niepoprawny opis wideo — spróbuj ponownie')

  return {
    beats: parsed.beats ?? [],
    hook: parsed.hook ?? '',
    visualStyle: parsed.visualStyle ?? '',
    pacing: parsed.pacing ?? '',
    summary: parsed.summary ?? '',
    transcript: transcriptText,
    meta: {
      durationSec: Math.round(video.meta.durationSec * 10) / 10,
      resolution: `${video.meta.width}x${video.meta.height}`,
      frameCount: frames.length,
      transcriptSource: transcript.source,
    },
  }
}

/**
 * Spłaszcza opis do tekstu, który trafia jako `input` analizy.
 * To ten tekst "widzą" persony i zimny klient.
 */
export function digestToAnalysisInput(d: VideoDigest): string {
  const beats = d.beats
    .map((b) => `[${b.t.toFixed(1)}s] OBRAZ: ${b.visual}${b.audio ? ` | DŹWIĘK: ${b.audio}` : ''}`)
    .join('\n')

  return [
    `WIDEO (${d.meta.durationSec}s, ${d.meta.resolution})`,
    '',
    `PIERWSZE 3 SEKUNDY (HOOK):\n${d.hook}`,
    '',
    `PRZEBIEG:\n${beats}`,
    '',
    `STYL REALIZACJI: ${d.visualStyle}`,
    `TEMPO: ${d.pacing}`,
    '',
    d.transcript ? `TRANSKRYPT:\n${d.transcript}` : 'TRANSKRYPT: brak dźwięku.',
    '',
    `CAŁOŚĆ: ${d.summary}`,
  ].join('\n')
}
