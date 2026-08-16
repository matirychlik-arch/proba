/**
 * Parsuje niekompletny JSON ze streamu — domyka otwarte stringi,
 * tablice i obiekty, żeby dało się inkrementalnie renderować wyniki.
 */
export function parsePartialJson(raw: string): Record<string, unknown> | null {
  const start = raw.indexOf('{')
  if (start === -1) return null
  let text = raw.slice(start)

  try {
    return JSON.parse(text)
  } catch {
    // domknij ręcznie
  }

  let inString = false
  let escaped = false
  const stack: string[] = []

  for (const ch of text) {
    if (escaped) {
      escaped = false
      continue
    }
    if (ch === '\\' && inString) {
      escaped = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (inString) continue
    if (ch === '{') stack.push('}')
    else if (ch === '[') stack.push(']')
    else if (ch === '}' || ch === ']') stack.pop()
  }

  if (inString) text += '"'
  // utnij wiszący przecinek lub dwukropek na końcu
  let trimmed = text.replace(/[,:]\s*$/, '')
  // utnij niedokończony klucz typu `"verd` bez dwukropka
  trimmed = trimmed.replace(/,?\s*"[^"]*$/, (m) => (m.includes(':') ? m : ''))

  let closing = ''
  for (let i = stack.length - 1; i >= 0; i--) closing += stack[i]

  try {
    return JSON.parse(trimmed + closing)
  } catch {
    // ostatnia próba: utnij do ostatniego kompletnego elementu
    const lastComma = trimmed.lastIndexOf(',')
    if (lastComma > 0) {
      try {
        return JSON.parse(trimmed.slice(0, lastComma) + closing)
      } catch {
        return null
      }
    }
    return null
  }
}
