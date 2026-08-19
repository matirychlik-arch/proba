# ◎ Proba — Universal Marketing Prediction Tool

Testuj decyzje marketingowe przez symulację reakcji person klientów — zanim wydasz
złotówkę na kampanię. Werdykty, score'y, reakcje per persona, zimny klient i rada person.

**Produkcja:** https://proba-chi.vercel.app (klucz API Anthropic w `/settings`)

## 🖥 Apka na maca (tryb CLI — bez klucza API)

Lokalnie Proba może używać **Claude Code** (Twojej subskrypcji Claude) zamiast płatnego
klucza API.

**Wymagania (jednorazowo):**
1. [Node.js 18+](https://nodejs.org) (LTS)
2. Claude Code: `npm install -g @anthropic-ai/claude-code`, potem `claude` i zaloguj się

**Start:**
```bash
git clone https://github.com/matirychlik-arch/proba.git
```
…i kliknij dwa razy **`Proba.app`** w sklonowanym folderze. Proba otwiera **własne okno
programu** (Electron) — bez Terminala i bez przeglądarki. Pierwsze uruchomienie instaluje
zależności i buduje aplikację (3–5 min, dostaniesz powiadomienia systemowe); kolejne
starty są natychmiastowe.

### 🎬 Analiza wideo (tylko wersja na Maca)

```bash
brew install ffmpeg          # wymagane — klatki i ścieżka dźwiękowa
brew install whisper-cpp     # opcjonalne — darmowy transkrypt offline
```

W widoku analizy pojawi się przycisk **„Wybierz wideo z dysku"**. Proba:

1. wyciąga klatki z całej długości (30–100, gęściej dla krótkich wideo),
2. przepisuje ścieżkę dźwiękową (whisper.cpp lokalnie → Groq API → ręcznie),
3. czyta wideo klatka po klatce i buduje opis: hook, przebieg, styl, tempo,
4. ten opis wchodzi do normalnej analizy — szybkiej albo rady person.

Plik wideo **nie jest nigdzie wysyłany** — ffmpeg czyta go prosto z dysku, klatki lądują
w katalogu tymczasowym i są kasowane po analizie. W trybie CLI cała analiza idzie przez
Twoją subskrypcję Claude, więc **nie kosztuje nic ponad abonament**.

Transkrypt przez Groq (opcjonalnie, gdy nie chcesz instalować whisper.cpp): dopisz
`GROQ_API_KEY=...` do `.env.local`.

**Chcesz mieć Probę w Aplikacjach?** Przeciągnij (lub skopiuj) `Proba.app` do
`/Applications` — launcher sam odnajdzie folder projektu: sprawdza typowe lokalizacje
klonu (`~/proba`, `~/Documents/proba`, `~/Desktop/proba`…), a jeśli trzymasz go gdzie
indziej, przy pierwszym starcie poprosi o wskazanie folderu i zapamięta wybór.

**Zatrzymanie:** Ustawienia Proby → „⏻ Zatrzymaj lokalny serwer".
Logi: `~/Library/Logs/Proba.log`.

> Jeśli macOS zablokuje pierwszy start (Gatekeeper): prawy przycisk → **Otwórz** → **Otwórz**.
> Alternatywa terminalowa: `./Proba.command`.

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
