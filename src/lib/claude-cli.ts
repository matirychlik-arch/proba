import { spawn } from 'child_process'

/**
 * Provider CLI: zamiast Anthropic API używa lokalnie zainstalowanego Claude Code
 * (subskrypcja użytkownika). Działa TYLKO lokalnie (npm run dev / next start na
 * własnej maszynie) — nigdy na Vercelu. Tryb osobisty/deweloperski, nie produktowy:
 * subskrypcja konsumencka nie może być backendem usługi dla osób trzecich.
 */

export function isCliMode(): boolean {
  return process.env.CLAUDE_PROVIDER === 'cli'
}

const CLI_TIMEOUT_MS = 600_000

export async function runClaudeCli(system: string, userText: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = [
      '-p',
      '--output-format', 'json',
      '--model', 'claude-sonnet-5',
      '--append-system-prompt', system,
    ]
    const child = spawn('claude', args, {
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    let out = ''
    let err = ''
    let settled = false

    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      child.kill('SIGKILL')
      reject(new Error('Timeout wywołania Claude CLI (4 min) — spróbuj ponownie'))
    }, CLI_TIMEOUT_MS)

    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (err += d))

    child.on('error', () => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(
        new Error(
          'Nie znaleziono komendy "claude". Zainstaluj Claude Code: npm install -g @anthropic-ai/claude-code i zaloguj się (claude login).'
        )
      )
    })

    child.on('close', (code) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (code !== 0) {
        reject(new Error(`Claude CLI zwrócił błąd: ${(err || out).slice(0, 300)}`))
        return
      }
      try {
        const parsed = JSON.parse(out)
        if (parsed.is_error) {
          reject(new Error(`Claude CLI: ${String(parsed.result).slice(0, 300)}`))
          return
        }
        resolve(String(parsed.result ?? ''))
      } catch {
        // Starsze wersje CLI albo output-format text — zwróć surowy tekst.
        resolve(out)
      }
    })

    child.stdin.write(userText)
    child.stdin.end()
  })
}
