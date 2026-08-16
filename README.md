# ◎ Proba — Universal Marketing Prediction Tool

Testuj decyzje marketingowe przez symulację reakcji person klientów — zanim wydasz
złotówkę na kampanię. Werdykty, score'y, reakcje per persona, zimny klient i rada person.

**Produkcja:** https://proba-chi.vercel.app (klucz API Anthropic w `/settings`)

## 🖥 Apka lokalna na maca (tryb CLI — bez klucza API)

Lokalnie Proba może używać **Claude Code** (Twojej subskrypcji Claude) zamiast płatnego
klucza API.

**Wymagania (jednorazowo):**
1. [Node.js 18+](https://nodejs.org) (LTS)
2. Claude Code: `npm install -g @anthropic-ai/claude-code`, potem `claude` i zaloguj się

**Start:**
```bash
git clone https://github.com/matirychlik-arch/proba.git
```
…i kliknij dwa razy **`Proba.command`** w Finderze. Pierwszy start buduje aplikację
(2–3 min), kolejne są natychmiastowe. Przeglądarka otworzy się sama na
`http://localhost:3789`.

> Przy pierwszym kliknięciu macOS może zablokować plik (Gatekeeper) — kliknij prawym
> przyciskiem → **Otwórz** → **Otwórz**.

**Ograniczenia trybu CLI:** brak obsługi obrazów w analizach (wymaga klucza API),
wynik Szybkiej analizy pojawia się w całości po ~20–30 s (bez streamingu), Rada person
działa wolniej (~4–5 min). Tryb CLI jest do użytku osobistego — subskrypcja konsumencka
nie może być backendem usługi dla osób trzecich.

## 🔧 Tryby providera

| | Provider | Konfiguracja |
|---|---|---|
| Vercel / produkcja | Anthropic API | klucz użytkownika w `/settings` (localStorage) |
| Lokalnie (CLI) | Claude Code | `CLAUDE_PROVIDER=cli` (ustawia `Proba.command`) |
| Lokalnie (API) | Anthropic API | `npm run dev` + klucz w `/settings` lub `.env.local` |

## 🧠 Poziomy analizy

- **⚡ Szybka analiza** — wszystkie persony w jednym prompcie, ~30 s
- **🧠 Rada person** — każda persona osobno + zimny klient 🧊 + runda dyskusji + synteza
  stratega (orkiestracja z przeglądarki, 2N+2 wywołań)
- **🌊 Symulacja populacji** — zamrożona; szczegóły w `CLAUDE.md`

Pełna specyfikacja projektu: [`CLAUDE.md`](./CLAUDE.md)
