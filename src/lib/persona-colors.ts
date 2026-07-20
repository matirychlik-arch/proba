export const PERSONA_COLORS = [
  '#4A7FF8',
  '#FF7648',
  '#FFC757',
  '#9A7ABA',
  '#5B9E6A',
  '#BA7A5A',
]

export const PERSONA_TEXT_COLORS = [
  '#FFFFFF',
  '#FFFFFF',
  '#1A1916',
  '#FFFFFF',
  '#FFFFFF',
  '#FFFFFF',
]

export function getPersonaColor(index: number): string {
  return PERSONA_COLORS[index % PERSONA_COLORS.length]
}

export function getPersonaTextColor(index: number): string {
  return PERSONA_TEXT_COLORS[index % PERSONA_TEXT_COLORS.length]
}

export function getScoreColor(score: number): string {
  if (score >= 8) return 'var(--score-high)'
  if (score >= 5) return 'var(--score-mid)'
  return 'var(--score-low)'
}
