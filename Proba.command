#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  Proba — lokalna apka na maca (tryb CLI: Twoja subskrypcja
#  Claude zamiast klucza API)
#
#  Użycie: kliknij dwa razy w Finderze.
#  Przy pierwszym uruchomieniu instaluje zależności i buduje
#  aplikację (2-3 min) — kolejne starty są natychmiastowe.
# ─────────────────────────────────────────────────────────────
set -e
cd "$(dirname "$0")"

PORT=3789
BOLD=$(tput bold 2>/dev/null || true)
RESET=$(tput sgr0 2>/dev/null || true)

echo ""
echo "${BOLD}  ◎ Proba — start lokalny (tryb CLI)${RESET}"
echo ""

fail() {
  echo ""
  echo "  ✗ $1"
  echo ""
  read -n 1 -s -r -p "  Naciśnij dowolny klawisz, żeby zamknąć..."
  exit 1
}

# ── Wymagania ──
command -v node >/dev/null 2>&1 || fail "Brak Node.js. Zainstaluj z https://nodejs.org (LTS) i uruchom ponownie."

NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
[ "$NODE_MAJOR" -ge 18 ] || fail "Node.js $(node -v) jest za stary — potrzeba 18+. Zaktualizuj z https://nodejs.org."

command -v claude >/dev/null 2>&1 || fail "Brak Claude Code. Zainstaluj:  npm install -g @anthropic-ai/claude-code  — potem zaloguj się:  claude login"

# ── Zależności (tylko przy pierwszym starcie / po aktualizacji) ──
if [ ! -d node_modules ]; then
  echo "  → Instaluję zależności (tylko za pierwszym razem)..."
  npm install --no-fund --no-audit
fi

# ── Build (przy pierwszym starcie albo gdy kod się zmienił) ──
if [ ! -d .next ] || [ -n "$(find src package.json -newer .next -print -quit 2>/dev/null)" ]; then
  echo "  → Buduję aplikację..."
  npm run build
fi

# ── Zwolnij port, jeśli została wisząca instancja ──
EXISTING=$(lsof -ti tcp:$PORT 2>/dev/null || true)
if [ -n "$EXISTING" ]; then
  kill $EXISTING 2>/dev/null || true
  sleep 1
fi

# ── Start ──
export CLAUDE_PROVIDER=cli
echo ""
echo "  ✓ Proba wstaje na ${BOLD}http://localhost:$PORT${RESET}"
echo "    Provider: Claude Code (Twoja subskrypcja) — klucz API zbędny"
echo "    Zamknij to okno Terminala, żeby zatrzymać aplikację."
echo ""

( sleep 2 && open "http://localhost:$PORT" ) &
exec npx next start -p $PORT
