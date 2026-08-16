export interface Persona {
  id: string
  name: string
  age: string
  emoji: string
  description: string
  shortDesc: string
}

export interface Workspace {
  id: string
  name: string
  emoji: string
  industry: string
  description: string
  targetCity: string
  personas: Persona[]
  createdAt: string
  updatedAt: string
}

export type AnalysisMode = 'kreacja' | 'hook' | 'cena' | 'kampania' | 'content' | 'decyzja'

export interface PersonaResult {
  personaId: string
  score: number
  conversionProbability: number
  reaction: string
  emotionalTrigger: string
  strengths: string[]
  risks: string[]
  suggestion: string
}

export interface AnalysisResult {
  verdict: string
  overallScore: number
  hookScore?: number | null
  emotionalScore: number
  potentialScore: number
  biggestRisk: string
  hiddenOpportunity: string
  personas: PersonaResult[]
  topActions: string[]
  /** Tylko depth='rada': reakcja zimnego klienta (zero kontekstu marki). */
  coldClient?: PersonaResult & { name: string }
  /** Tylko depth='rada': rewizje po rundzie dyskusji. */
  socialShifts?: SocialShift[]
}

/** Wersja promptów — podbijać przy każdej zmianie promptów systemowych.
 *  Bez tego pętla walidacji porównuje różne systemy i nic nie mierzy. */
export const PROMPT_VERSION = '1.1.0'

export type AnalysisDepth = 'szybka' | 'rada'

/** "Co się faktycznie stało" — pętla walidacji (falsyfikacja, nie predykcja). */
export interface RealOutcome {
  note: string          // co się stało po publikacji (zasięgi, sprzedaż, reakcje)
  success?: boolean     // czy Mat uznaje to za sukces
  recordedAt: string
}

/** Rewizja opinii persony po rundzie dyskusji (symulacja dyskusji — tryb "show"). */
export interface SocialShift {
  personaId: string
  scoreBefore: number
  scoreAfter: number
  reason: string        // 1 zdanie dlaczego zmieniła/podtrzymała zdanie
}

export interface Analysis {
  id: string
  workspaceId: string
  mode: AnalysisMode
  depth?: AnalysisDepth // brak = 'szybka' (analizy sprzed v1.1)
  input: string
  imageBase64?: string
  context?: string
  selectedPersonaIds: string[]
  result: AnalysisResult
  promptVersion?: string
  realOutcome?: RealOutcome
  createdAt: string
}

export const MODE_LABELS: Record<AnalysisMode, string> = {
  kreacja: 'Kreacja reklamowa',
  hook: 'Hook wideo',
  cena: 'Cena & oferta',
  kampania: 'Koncept kampanii',
  content: 'Pomysł na content',
  decyzja: 'Decyzja biznesowa',
}

export const MODE_ICONS: Record<AnalysisMode, string> = {
  kreacja: '🎨',
  hook: '🎬',
  cena: '💰',
  kampania: '📢',
  content: '📱',
  decyzja: '🤔',
}

export const MODE_PLACEHOLDERS: Record<AnalysisMode, string> = {
  kreacja: 'Opisz kreację lub wklej copy. Możesz też wrzucić obraz poniżej.',
  hook: 'Wpisz pierwsze 3 sekundy swojego wideo — co dokładnie mówisz i pokazujesz?',
  cena: 'Opisz produkt i cenę którą testujesz. Podaj obecną cenę jeśli to zmiana.',
  kampania: 'Opisz koncept kampanii — cel, przekaz, format, czas trwania.',
  content: 'Opisz pomysł na serię lub pojedynczy post — temat, format, kąt.',
  decyzja: 'Opisz decyzję którą rozważasz. Im więcej kontekstu, tym lepsza predykcja.',
}
