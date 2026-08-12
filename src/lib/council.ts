import { Persona, PersonaResult, AnalysisResult, AnalysisMode, SocialShift } from './types'

/** Status pojedynczego uczestnika obrad — do UI "obrady rady". */
export type CouncilMemberStatus = 'waiting' | 'thinking' | 'done' | 'error'

export interface CouncilProgress {
  phase: 'reakcje' | 'dyskusja' | 'synteza' | 'done'
  members: Record<string, CouncilMemberStatus> // personaId (+ 'cold') → status
}

interface CouncilInput {
  apiKey: string
  mode: AnalysisMode
  input: string
  context?: string
  imageBase64?: string
  businessDescription: string
  personas: Persona[]
  onProgress: (p: CouncilProgress) => void
}

const COLD_ID = 'cold'
/** Rate limity Tier 1 — nie odpalamy więcej niż tyle wywołań naraz. */
const MAX_CONCURRENT = 4

async function postJson<T>(url: string, apiKey: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `Błąd ${res.status}`)
  return data as T
}

/** Pula z limitem równoległości. */
async function withPool<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length)
  let next = 0
  async function worker() {
    while (next < tasks.length) {
      const i = next++
      results[i] = await tasks[i]()
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker))
  return results
}

interface RawReaction {
  score: number
  conversionProbability: number
  reaction: string
  emotionalTrigger: string
  strengths: string[]
  risks: string[]
  suggestion: string
}

/**
 * Orkiestracja Rady person — z przeglądarki, żeby ominąć timeout Vercela.
 * Fazy: reakcje (N person + zimny klient, równolegle) → dyskusja (N, równolegle)
 * → synteza stratega (1). Razem 2N+2 wywołań.
 */
export async function runCouncil({
  apiKey,
  mode,
  input,
  context,
  imageBase64,
  businessDescription,
  personas,
  onProgress,
}: CouncilInput): Promise<AnalysisResult> {
  const members: Record<string, CouncilMemberStatus> = Object.fromEntries([
    ...personas.map((p) => [p.id, 'thinking' as CouncilMemberStatus]),
    [COLD_ID, 'thinking' as CouncilMemberStatus],
  ])
  const report = (phase: CouncilProgress['phase']) => onProgress({ phase, members: { ...members } })
  report('reakcje')

  // ── Faza 1: niezależne reakcje ──
  const reactionTasks = [
    ...personas.map((p) => async () => {
      try {
        const r = await postJson<RawReaction>('/api/persona-react', apiKey, {
          persona: p,
          businessDescription,
          mode,
          input,
          context,
          imageBase64,
        })
        members[p.id] = 'done'
        report('reakcje')
        return { personaId: p.id, ...r }
      } catch (e) {
        members[p.id] = 'error'
        report('reakcje')
        throw e
      }
    }),
    async () => {
      try {
        const r = await postJson<RawReaction>('/api/persona-react', apiKey, {
          cold: true,
          mode,
          input,
          imageBase64,
        })
        members[COLD_ID] = 'done'
        report('reakcje')
        return { personaId: COLD_ID, ...r }
      } catch (e) {
        members[COLD_ID] = 'error'
        report('reakcje')
        throw e
      }
    },
  ]

  const reactions = await withPool(reactionTasks, MAX_CONCURRENT)
  const personaReactions = reactions.filter((r) => r.personaId !== COLD_ID)
  const coldReaction = reactions.find((r) => r.personaId === COLD_ID)!

  // ── Faza 2: runda dyskusji (symulacja dyskusji — tryb "show") ──
  personas.forEach((p) => (members[p.id] = 'thinking'))
  members[COLD_ID] = 'done'
  report('dyskusja')

  const personaById = new Map(personas.map((p) => [p.id, p]))
  const shiftTasks = personaReactions.map((own) => async () => {
    const persona = personaById.get(own.personaId)!
    const others = [
      ...personaReactions
        .filter((r) => r.personaId !== own.personaId)
        .map((r) => ({
          name: personaById.get(r.personaId)?.name ?? '?',
          score: r.score,
          reaction: r.reaction,
        })),
      { name: 'Przypadkowy przechodzień (nie zna marki)', score: coldReaction.score, reaction: coldReaction.reaction },
    ]
    try {
      const rev = await postJson<{ scoreAfter: number; reason: string }>(
        '/api/council-social',
        apiKey,
        { persona, ownReaction: own.reaction, ownScore: own.score, others, input }
      )
      members[own.personaId] = 'done'
      report('dyskusja')
      return {
        personaId: own.personaId,
        scoreBefore: own.score,
        scoreAfter: rev.scoreAfter,
        reason: rev.reason,
      } satisfies SocialShift
    } catch {
      // Dyskusja jest opcjonalna — błąd nie zabija całej rady.
      members[own.personaId] = 'done'
      report('dyskusja')
      return {
        personaId: own.personaId,
        scoreBefore: own.score,
        scoreAfter: own.score,
        reason: '',
      } satisfies SocialShift
    }
  })
  const socialShifts = await withPool(shiftTasks, MAX_CONCURRENT)

  // ── Faza 3: synteza stratega ──
  Object.keys(members).forEach((k) => (members[k] = 'done'))
  report('synteza')

  const shiftByPersona = new Map(socialShifts.map((s) => [s.personaId, s]))
  const verdict = await postJson<{
    verdict: string
    overallScore: number
    hookScore?: number | null
    emotionalScore: number
    potentialScore: number
    biggestRisk: string
    hiddenOpportunity: string
    topActions: string[]
  }>('/api/council-verdict', apiKey, {
    mode,
    input,
    businessDescription,
    personaResults: personaReactions.map((r) => ({
      name: personaById.get(r.personaId)?.name ?? '?',
      score: r.score,
      scoreAfter: shiftByPersona.get(r.personaId)?.scoreAfter,
      reaction: r.reaction,
      strengths: r.strengths,
      risks: r.risks,
    })),
    coldClient: coldReaction,
    socialShifts: socialShifts.map((s) => ({
      ...s,
      personaName: personaById.get(s.personaId)?.name,
    })),
  })

  report('done')

  const personaResults: PersonaResult[] = personaReactions.map((r) => {
    const shift = shiftByPersona.get(r.personaId)
    return {
      personaId: r.personaId,
      score: shift?.scoreAfter ?? r.score,
      conversionProbability: r.conversionProbability,
      reaction: r.reaction,
      emotionalTrigger: r.emotionalTrigger,
      strengths: r.strengths ?? [],
      risks: r.risks ?? [],
      suggestion: r.suggestion,
    }
  })

  return {
    ...verdict,
    personas: personaResults,
    coldClient: {
      personaId: COLD_ID,
      name: 'Zimny klient',
      score: coldReaction.score,
      conversionProbability: coldReaction.conversionProbability,
      reaction: coldReaction.reaction,
      emotionalTrigger: coldReaction.emotionalTrigger,
      strengths: coldReaction.strengths ?? [],
      risks: coldReaction.risks ?? [],
      suggestion: coldReaction.suggestion,
    },
    socialShifts: socialShifts.filter((s) => s.reason),
  }
}
