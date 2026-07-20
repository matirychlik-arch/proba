import { Persona } from '@/lib/types'
import { getPersonaColor } from '@/lib/persona-colors'

/** Wyróżnia imiona person w tekście ich kolorami. */
export default function HighlightedText({
  text,
  personas,
}: {
  text: string
  personas: Persona[]
}) {
  if (!text) return null
  const names = personas.map((p) => p.name).filter(Boolean)
  if (names.length === 0) return <>{text}</>

  const colorByName = new Map(personas.map((p, i) => [p.name.toLowerCase(), getPersonaColor(i)]))
  // dopasuj imię + polską odmianę (Zosia, Zosi, Zosię...)
  const pattern = new RegExp(`\\b(${names.join('|')})[a-ząćęłńóśźż]*`, 'gi')

  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    const base = match[1].toLowerCase()
    parts.push(
      <span key={key++} style={{ color: colorByName.get(base), fontWeight: 500 }}>
        {match[0]}
      </span>
    )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))

  return <>{parts}</>
}
