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
}

export interface Analysis {
  id: string
  workspaceId: string
  mode: AnalysisMode
  input: string
  imageBase64?: string
  context?: string
  selectedPersonaIds: string[]
  result: AnalysisResult
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
