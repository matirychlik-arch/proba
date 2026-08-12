# CLAUDE.md — Universal Marketing Prediction Tool
# Specyfikacja dla Claude Code | Marzec 2026
# Autor: Mat | Język: Polski

---

## KONTEKST PROJEKTU

Budujesz **Universal Marketing Prediction Tool** — webową aplikację która pozwala testować decyzje marketingowe przez symulację reakcji grupy docelowej przed wydaniem złotówki na kampanię.

Właściciel produktu: Mat — grafik, twórca wideo, założyciel KOMBINI (automaty z matchą). Używa tego narzędzia do:
- Testowania kreacji reklamowych (Mobile Vikings, KOMBINI, klienci agencji)
- Symulacji reakcji klientów na ceny, produkty, kampanie
- Testowania hooków i pomysłów na content wideo
- Pokazywania wyników w swoich filmach na TikToku/Instagramie (screenshoty w montażu)

**To narzędzie musi wyglądać tak dobrze żeby screenshot z niego był sam w sobie contentem.**

---

## STACK TECHNICZNY

```
Frontend:  Next.js 14 (App Router) + TypeScript
Styling:   Tailwind CSS + CSS Variables (własny design system)
Backend:   Next.js API Routes (serverless)
AI:        Anthropic Claude API (claude-sonnet-4-20250514)
Storage:   localStorage (MVP) → później migracja do Supabase
Fonts:     Google Fonts — DM Sans (główna) + DM Mono (labels/meta)
Deploy:    Vercel (zero-config z Next.js)
```

**Klucz API:** Użytkownik wpisuje własny klucz Anthropic w ustawieniach aplikacji. Klucz jest przechowywany w localStorage (nigdy nie wysyłany nigdzie poza Anthropic API). W środowisku dev można użyć `.env.local` z `ANTHROPIC_API_KEY`.

---

## ARCHITEKTURA DANYCH

### Workspace (profil biznesowy)
```typescript
interface Workspace {
  id: string                    // uuid
  name: string                  // np. "KOMBINI / Matchomaty"
  emoji: string                 // np. "🟠"
  industry: string              // np. "Food & Beverage / Vending"
  description: string           // Opis biznesu (brain dump — kilkaset słów)
  targetCity: string            // np. "Wrocław, Polska"
  personas: Persona[]           // 3-6 person
  createdAt: string
  updatedAt: string
}
```

### Persona (segment klienta)
```typescript
interface Persona {
  id: string
  name: string                  // np. "Zosia"
  age: string                   // np. "21"
  emoji: string                 // np. "⚡"
  description: string           // Pełny profil behawioralny (200-400 słów)
  shortDesc: string             // np. "Studentka AWF, matcha-girl, TikTok native"
}
```

### Analiza
```typescript
interface Analysis {
  id: string
  workspaceId: string
  mode: AnalysisMode            // patrz niżej
  input: string                 // Treść/opis kreacji lub pomysłu
  imageBase64?: string          // Opcjonalny upload obrazu
  context?: string              // Dodatkowy kontekst
  selectedPersonaIds: string[]
  result: AnalysisResult
  createdAt: string
}

type AnalysisMode =
  | 'kreacja'      // Ocena kreacji reklamowej (obraz/wideo/copy)
  | 'hook'         // Testowanie hooka wideo (pierwsze 3 sekundy)
  | 'cena'         // Reakcja na cenę lub zmianę cen
  | 'kampania'     // Ocena konceptu kampanii
  | 'content'      // Pomysł na serię wideo lub post
  | 'decyzja'      // Ogólna decyzja biznesowa / strategiczna

interface AnalysisResult {
  verdict: string               // 2-3 zdania syntezy
  overallScore: number          // 1-10
  hookScore?: number            // tylko dla mode='hook' i 'kreacja'
  emotionalScore: number        // 1-10
  potentialScore: number        // 1-10
  biggestRisk: string
  hiddenOpportunity: string
  personas: PersonaResult[]
  topActions: string[]          // 3 konkretne rekomendacje
}

interface PersonaResult {
  personaId: string
  score: number                 // 1-10
  conversionProbability: number // 0-100 (%)
  reaction: string              // 2-3 zdania jak ta persona zareaguje
  emotionalTrigger: string      // główny trigger emocjonalny
  strengths: string[]           // co działa dla tej persony
  risks: string[]               // co nie działa
  suggestion: string            // jedna zmiana żeby poprawić score
}
```

---

## STRUKTURA APLIKACJI (STRONY)

```
/                           → Redirect do /dashboard
/dashboard                  → Lista workspace'ów + ostatnie analizy
/workspace/new              → Kreator nowego workspace'u
/workspace/[id]             → Główny widok workspace'u
/workspace/[id]/analyze     → Nowa analiza
/workspace/[id]/history     → Historia analiz
/workspace/[id]/settings    → Ustawienia workspace'u (edycja person itp.)
/settings                   → Ustawienia globalne (klucz API)
```

---

## WIDOKI — SZCZEGÓŁOWY OPIS

### 1. Dashboard (`/dashboard`)

**Layout:** Ciemne tło, dwie kolumny.

**Lewa kolumna — Workspace'y:**
- Header: "TWOJE WORKSPACE'Y" (monospace, uppercase, muted)
- Lista kart workspace'ów z emoji, nazwą, liczbą person, datą ostatniej analizy
- Przycisk "+ Nowy Workspace" na dole listy
- Aktywny workspace podświetlony akcentem

**Prawa kolumna — Feed ostatnich analiz:**
- "OSTATNIE ANALIZY" header
- Lista 10 ostatnich analiz ze wszystkich workspace'ów
- Każda: emoji workspace'u + nazwa + tryb + overall score + data
- Klik → przejście do szczegółów analizy

**Stały element:** Pasek boczny (sidebar) z ikonami workspace'ów do szybkiego przełączania.

---

### 2. Kreator Workspace'u (`/workspace/new`)

**Wieloetapowy wizard (3 kroki):**

**Krok 1 — Podstawy:**
- Pole: Emoji (picker lub wpisz)
- Pole: Nazwa workspace'u
- Pole: Branża / typ biznesu
- Pole: Miasto / rynek docelowy

**Krok 2 — Opis biznesu (Brain Dump):**
- Duże pole textarea z placeholderem:
  ```
  Opisz swój biznes jak byś tłumaczył nowemu wspólnikowi przy kawie.
  
  Co sprzedajesz? Dla kogo? Po ile? Gdzie? Jakie masz plany?
  Co już wiesz że działa? Czego się boisz? Co cię wyróżnia?
  
  Im więcej napiszesz, tym precyzyjniejsze będą symulacje.
  ```
- Licznik słów (minimum: 100 słów, optimum: 300+)
- Wskaźnik "jakości kontekstu" (progress bar 0-100% oparty na długości i kompletności)

**Krok 3 — Persony:**
- Propozycja: przycisk "Wygeneruj persony automatycznie" (Claude generuje 4 persony na podstawie opisu biznesu)
- Lub: ręczne dodanie person (formularz: imię, wiek, emoji, krótki opis, pełny profil)
- Edytowalne po wygenerowaniu
- Min. 2, max. 6 person

**Po zapisaniu:** Redirect do `/workspace/[id]`

---

### 3. Główny widok Workspace'u (`/workspace/[id]`)

**Layout:** Sidebar z workspace'ami (lewo) + główna treść (prawo).

**Header workspace'u:**
- Duże emoji + nazwa
- Branża + miasto
- Liczba person | Liczba analiz | Data ostatniej analizy

**Sekcja "Szybka analiza":**
- 6 przycisków trybów analizy z ikonkami:
  - 🎨 Kreacja reklamowa
  - 🎬 Hook wideo
  - 💰 Cena & oferta
  - 📢 Koncept kampanii
  - 📱 Pomysł na content
  - 🤔 Decyzja biznesowa
- Klik → przejście do `/workspace/[id]/analyze?mode=X`

**Sekcja "Ostatnie analizy" (w tym workspace'ie):**
- Lista 5 ostatnich z quick preview wyników
- Link "Zobacz wszystkie →"

**Sekcja "Persony":**
- Karty person z emoji, imieniem, krótkim opisem i score'ami z ostatnich analiz
- Przycisk edycji każdej persony

---

### 4. Nowa Analiza (`/workspace/[id]/analyze`)

**Layout:** Dwukolumnowy na desktop, jednokolumnowy na mobile.

**Lewa kolumna — Input:**

**Blok 1 — Tryb analizy:**
- Tabs z ikonkami: Kreacja | Hook | Cena | Kampania | Content | Decyzja
- Po wyborze trybu — dynamiczny placeholder w textarea się zmienia

**Blok 2 — Twój input:**
- Textarea główna z dynamicznym placeholderem zależnym od trybu:
  - Kreacja: "Opisz kreację lub wklej copy. Możesz też wrzucić obraz poniżej."
  - Hook: "Wpisz pierwsze 3 sekundy swojego wideo — co dokładnie mówisz i pokazujesz?"
  - Cena: "Opisz produkt i cenę którą testujesz. Podaj obecną cenę jeśli to zmiana."
  - Kampania: "Opisz koncept kampanii — cel, przekaz, format, czas trwania."
  - Content: "Opisz pomysł na serię lub pojedynczy post — temat, format, kąt."
  - Decyzja: "Opisz decyzję którą rozważasz. Im więcej kontekstu, tym lepsza predykcja."

**Blok 3 — Upload obrazu (opcjonalny):**
- Drag & drop zone
- Akceptuje: PNG, JPG, WEBP
- Preview po uploadzie
- Label: "Wrzuć kreację, screenshot, mockup lub storyboard"

**Blok 4 — Wybór person:**
- Checkboxy z kartami person z workspace'u
- Default: wszystkie zaznaczone
- Min. 1 persona

**Blok 5 — Kontekst (opcjonalny, zwijany):**
- Małe textarea: "Dodaj kontekst który może mieć znaczenie..."
- Przykłady: budżet, deadline, platforma, poprzednie wyniki

**Przycisk RUN:**
- Pełna szerokość, duży, accent color
- Tekst: "⟳ URUCHOM SYMULACJĘ"
- Stan loading: animowany tekst "Symulacja w toku..."

**Prawa kolumna — Wyniki (pojawia się po analizie):**
→ Patrz sekcja WYNIKI niżej

---

### 5. Widok Wyników

**Wyniki ładują się strumieniowo (streaming) — użytkownik widzi jak się budują.**

**Blok 1 — Greeting / Hero card:**
- Tło: kremowe `--bg-app` (#F0EDE6), border-radius 20px
- Górny lewy róg: label trybu analizy (DM Mono, uppercase, muted)
- Tytuł: duży (22px, 600), tekst inputu skrócony do 1-2 linii
- Prawy dolny róg: AURA (dekoracyjne elipsy, opacity 0.2-0.25)
- Chip'y: liczba person, data/czas analizy

**Blok 2 — Trio score'ów:**
- 3 karty obok siebie (grid 3 kolumny)
- Każda: tło białe, border subtle, border-radius 16px
- Liczba: 32px, font-weight 600, kolor zależny od wartości
  - 8-10: `--blue` (#4A7FF8)
  - 5-7: `--amber` (#FFC757)
  - 1-4: `--coral` (#FF7648)
- Pasek postępu: 3px height, animowany od 0
- Label: DM Mono, 10px, uppercase

**Blok 3 — Werdykt:**
- Biała karta, border subtle, border-radius 16px
- Label: "WERDYKT" (DM Mono, muted, uppercase)
- Tekst: 14px, DM Sans, line-height 1.65
- Imiona person wyróżnione ich kolorami (inline spans)

**Blok 4 — Ryzyko & Szansa:**
- Dwa boksy side-by-side w grid 2-kolumny
- Lewy: border-left 2px coral, tło coral-pale
- Prawy: border-left 2px amber, tło amber-pale
- Label uppercase, DM Mono

**Blok 5 — Analiza per persona:**
- Każda persona = karta (biała, border, radius 16px)
- Header: avatar (kolorowe kółko z inicjałem) + imię + rola + score + konwersja%
- Body (accordion, domyślnie pierwsza otwarta):
  - Tekst reakcji 14px, DM Sans
  - Chip-tagi: zielone (co działa) + coral (co nie działa) — pill shape
  - Sugestia: tło amber-pale, border-left amber

**Blok 6 — Top 3 rekomendacje:**
- Numerowane: 01, 02, 03 (DM Mono, blue, duże)
- Każda w osobnej karcie lub z separatorem
- Tekst: konkretna, actionable, 1 zdanie

**Blok 6 — Akcje:**
- "← Nowa analiza" (ghost button)
- "Zapisz wyniki" (primary)
- "Kopiuj raport" (ghost)
- "⎙ Eksportuj PDF" (ghost) — do zaimplementowania w fazie 2

---

### 6. Historia Analiz (`/workspace/[id]/history`)

**Lista wszystkich analiz workspace'u:**
- Filtrowanie po trybie analizy
- Sortowanie: najnowsze / najwyższy score
- Każda karta: tryb + input preview + overall score + data
- Klik → rozwinięcie pełnych wyników inline

---

### 7. Ustawienia globalne (`/settings`)

**Jedyna wrażliwa sekcja:**
- Pole: Klucz API Anthropic
  - Typ: password (maskowany)
  - Przycisk "Pokaż/Ukryj"
  - Przycisk "Testuj połączenie" — wysyła testowy request do API
  - Info: "Twój klucz jest przechowywany tylko lokalnie w tej przeglądarce. Nigdy nie jest wysyłany nigdzie poza Anthropic API."
- Model: dropdown (tylko claude-sonnet-4-20250514 — nie dawać innych opcji w MVP)

---

## DESIGN SYSTEM

> **WAŻNE:** Design system został zaktualizowany (marzec 2026) z inspiracji projektem Niva AI (Behance).
> Poprzednia wersja była ciemna z ostrymi rogami — nowa jest jasna, organiczna, ciepła.
> Filozofia: AI które rozumie ludzi powinno wyglądać jak coś ludzkiego — nie jak terminal.

---

### Inspiracja wizualna

Projekt referencyjny: **Niva AI family assistant** (Behance, Estrella Gracia / Luca Giordano, 2026)

Kluczowe elementy które przenosimy do Proba:
- Jasne kremowe tło zamiast ciemnego
- Mocno zaokrąglone rogi (16–24px) na wszystkich kartach
- Trzy kolory akcentu tworzące "aurę" — gradient dekoracyjny
- Persony jako inicjały w kolorowych okrągłych avatarach
- Typografia geometryczna (DM Sans) zamiast ostrego monospace
- Dużo białej przestrzeni, powietrze w layoutcie
- Pill-shaped chips i tagi z zaokrągleniami

---

### Paleta kolorów

```css
:root {
  /* ── TŁA ── */
  --bg-app: #F0EDE6;          /* Główne tło aplikacji — ciepły kremowy */
  --bg-surface: #FAFAF8;      /* Karty, panele, sidebar — prawie biały */
  --bg-card: #FFFFFF;         /* Karty wynikowe, persona cards */
  --bg-sidebar: #F5F3EE;      /* Sidebar tło — nieco ciemniejszy */
  --bg-input: #FFFFFF;        /* Pola tekstowe */

  /* ── GRANICE ── */
  --border-subtle: #EAE8E2;   /* Subtelne separatory między sekcjami */
  --border-default: #D8D5CE;  /* Standardowe obramowania kart */
  --border-input: #C8C5BE;    /* Obramowanie inputów */
  --border-focus: #4A7FF8;    /* Focus state inputów */

  /* ── TEKST ── */
  --text-primary: #1A1916;    /* Główny tekst — ciepła czerń */
  --text-secondary: #3A3834;  /* Treść, body text */
  --text-muted: #6B6860;      /* Podrzędny, meta informacje */
  --text-placeholder: #9A9890; /* Placeholdery, labels */

  /* ── AKCENTY — TRZY KOLORY PROBA ── */
  --blue: #4A7FF8;            /* Primary akcent — persona Zosia, primary buttons */
  --blue-pale: #EEF3FF;       /* Bardzo jasne tło blue — badge, tagi */
  --blue-border: #C8D8FC;     /* Border dla blue elementów */

  --coral: #FF7648;           /* Energia, ryzyko, niska konwersja */
  --coral-pale: #FFF0EB;      /* Bardzo jasne tło coral */
  --coral-border: #FFC4B0;    /* Border dla coral elementów */

  --amber: #FFC757;           /* Szansa, uwaga, średnia konwersja */
  --amber-pale: #FFF8E8;      /* Bardzo jasne tło amber */
  --amber-border: #FFE4A0;    /* Border dla amber elementów */

  /* ── SCORING ── */
  --score-high: #4A7FF8;      /* 8-10 — niebieski */
  --score-mid: #FFC757;       /* 5-7 — amber */
  --score-low: #FF7648;       /* 1-4 — coral */

  /* ── KOLORY PERSON — AVATARY ── */
  --persona-1: #4A7FF8;       /* Niebieski — Zosia */
  --persona-2: #FF7648;       /* Coral — Kacper */
  --persona-3: #FFC757;       /* Amber — Ania */
  --persona-4: #9A7ABA;       /* Fioletowy — Mikołaj */
  --persona-5: #5B9E6A;       /* Zielony — 5ta persona */
  --persona-6: #BA7A5A;       /* Brązowy — 6ta persona */

  /* ── WORKSPACE DOTS ── */
  --ws-kombini: #4A7FF8;
  --ws-mv: #5B9E6A;
  --ws-content: #9A7ABA;
  --ws-cyrulicy: #BA7A5A;
}
```

---

### Typografia

```
Główna (display + UI):  DM Sans (Google Fonts)
                        weights: 400 (regular), 500 (medium), 600 (semibold)
                        Używana do: WSZYSTKIEGO — nagłówków, body, przycisków
                        letter-spacing: -0.02em do -0.03em dla dużych rozmiarów
                        Import: https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600

Monospace (labels):     DM Mono (Google Fonts)
                        weights: 400, 500
                        Używana do: labelek sekcji, metadanych, tagów uppercase,
                                    hexów kolorów, dat, workspace badge
                        Import: https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500
```

**Hierarchia typograficzna:**

```css
/* Display — wielkie nagłówki landing/hero */
.text-display {
  font-family: 'DM Sans', sans-serif;
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.1;
  color: var(--text-primary);
}

/* H1 — nagłówki sekcji */
.text-h1 {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

/* H2 — nagłówki kart */
.text-h2 {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

/* Body — treść, werdykty */
.text-body {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.65;
  color: var(--text-secondary);
}

/* Small — metadane, daty */
.text-small {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-muted);
}

/* Label — sekcje, tagi uppercase */
.text-label {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-placeholder);
}

/* Score number — duże liczby wynikowe */
.text-score {
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1;
}
```

---

### Spacing system

```
Bazowa jednostka: 4px
Używaj: 4, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 64px
```

---

### Border-radius — KLUCZOWE

```css
--radius-sm: 8px;     /* Małe elementy: tagi, badges, inputs */
--radius-md: 12px;    /* Przyciski, małe karty */
--radius-lg: 16px;    /* Główne karty, persona cards, score cards */
--radius-xl: 20px;    /* Duże sekcje hero, greeting card */
--radius-2xl: 24px;   /* Outer frame, modal */
--radius-full: 9999px; /* Pills, avatary, chip-tags */
```

**ZASADA:** Żadnych ostrych rogów (0px). Minimalny border-radius w aplikacji: 8px.
To jest fundamentalna zmiana względem poprzedniej specyfikacji.

---

### Komponenty UI

**Karty (Card):**
```css
background: var(--bg-card);          /* #FFFFFF */
border: 0.5px solid var(--border-default);  /* #D8D5CE */
border-radius: var(--radius-lg);     /* 16px */
padding: 16px 20px;
```

**Karty surface (lekko szare):**
```css
background: var(--bg-surface);       /* #FAFAF8 */
border: 0.5px solid var(--border-subtle);
border-radius: var(--radius-lg);
```

**Greeting / Hero card:**
```css
background: var(--bg-app);           /* #F0EDE6 — kremowe */
border-radius: var(--radius-xl);     /* 20px */
padding: 20px;
position: relative;
overflow: hidden;                    /* dla aury */
min-height: 160px;
```

**Przyciski primary:**
```css
background: var(--blue);             /* #4A7FF8 */
color: white;
border: none;
border-radius: var(--radius-full);   /* pill shape */
padding: 10px 20px;
font-family: 'DM Sans', sans-serif;
font-size: 14px;
font-weight: 500;
cursor: pointer;
transition: opacity 0.15s;
```
Hover: `opacity: 0.9; transform: translateY(-1px);`

**Przyciski ghost:**
```css
background: white;
color: var(--text-primary);
border: 0.5px solid var(--border-default);
border-radius: var(--radius-full);
padding: 10px 20px;
```

**Inputs / Textarea:**
```css
background: var(--bg-input);
border: 0.5px solid var(--border-input);
border-radius: var(--radius-md);     /* 12px */
padding: 12px 16px;
font-family: 'DM Sans', sans-serif;
font-size: 14px;
color: var(--text-primary);
transition: border-color 0.15s;
```
Focus: `border-color: var(--blue); outline: none;`

**Chip tags (persona, kategoria):**
```css
background: var(--bg-app);           /* lub kolor specificzny */
border: 0.5px solid var(--border-default);
border-radius: var(--radius-full);
padding: 5px 14px;
font-size: 12px;
font-weight: 500;
color: var(--text-primary);
```

**Chip kolorowy (aktywny):**
```css
/* Niebieski */
background: var(--blue-pale);        /* #EEF3FF */
border-color: var(--blue-border);    /* #C8D8FC */
color: var(--blue);                  /* #4A7FF8 */

/* Coral */
background: var(--coral-pale);
border-color: var(--coral-border);
color: var(--coral);

/* Amber */
background: var(--amber-pale);
border-color: var(--amber-border);
color: var(--amber);
```

**Workspace dot (sidebar):**
```css
width: 8px;
height: 8px;
border-radius: 50%;
background: var(--ws-kombini);       /* lub odpowiedni kolor */
flex-shrink: 0;
```

**Workspace badge (topbar):**
```css
background: #EDE9E1;
border-radius: var(--radius-full);
padding: 4px 12px;
font-family: 'DM Mono', monospace;
font-size: 11px;
color: var(--text-muted);
```

**Persona avatar:**
```css
width: 36px;
height: 36px;
border-radius: 50%;
background: var(--persona-1);        /* kolor przypisany do persony */
color: white;
display: flex;
align-items: center;
justify-content: center;
font-size: 14px;
font-weight: 600;
font-family: 'DM Sans', sans-serif;
flex-shrink: 0;
```

Persony z jasnym avatarem (np. amber):
```css
background: var(--amber);
color: var(--text-primary);          /* ciemny tekst na jasnym tle */
```

**Score bar:**
```css
width: 100%;
height: 3px;
background: var(--border-subtle);
border-radius: 2px;

/* Fill: */
height: 100%;
border-radius: 2px;
background: var(--score-high);       /* lub mid/low zależnie od wartości */
transition: width 0.8s ease-out;
```

**Sidebar workspace item:**
```css
display: flex;
align-items: center;
gap: 10px;
padding: 8px 10px;
border-radius: var(--radius-md);     /* 12px */
cursor: pointer;
transition: background 0.15s;

/* Aktywny: */
background: #EDE9E1;
```

---

### Aura — sygnatura wizualna Proba

"Aura" to nakładające się trzy półprzezroczyste elipsy w kolorach Proba (niebieski + coral + amber), umieszczone jako dekoracyjny element w prawym dolnym rogu karty hero/greeting. Symbolizuje nakładające się reakcje różnych person.

```jsx
/* React/SVG implementation */
const Aura = () => (
  <div style={{
    position: 'absolute',
    bottom: -30,
    right: -20,
    width: 200,
    height: 150,
    pointerEvents: 'none',
    zIndex: 1,
  }}>
    <svg width="200" height="150" viewBox="0 0 200 150" fill="none">
      <ellipse cx="60" cy="100" rx="90" ry="70" fill="#4A7FF8" opacity="0.2"/>
      <ellipse cx="110" cy="80" rx="80" ry="65" fill="#FF7648" opacity="0.2"/>
      <ellipse cx="150" cy="105" rx="70" ry="55" fill="#FFC757" opacity="0.25"/>
    </svg>
  </div>
);
```

Aura pojawia się w:
1. Greeting card / hero sekcja ekranu analizy
2. Ekran onboardingu (krok wyboru planu)
3. Strona welcome (`/`) jeśli będzie

Aura NIE pojawia się w: sidebar, kartach wynikowych, persona cards, history list.

---

### Logo i ikona

**Logo wordmark:**
```jsx
<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="8" fill="none" stroke="#4A7FF8" strokeWidth="2"/>
    <circle cx="12" cy="12" r="3.5" fill="#4A7FF8"/>
  </svg>
  <span style={{
    fontFamily: 'DM Sans',
    fontSize: 17,
    fontWeight: 600,
    color: '#1A1916',
    letterSpacing: '-0.03em'
  }}>Proba</span>
</div>
```

**Ikona aplikacji (favicon / app icon):**
- Tło: gradient trójkolorowy (#4A7FF8 → #FF7648 → #FFC757)
- Symbol: okrąg z wypełnionym środkiem, biały
- Border-radius ikony: 14px (iOS style)

**Symbol standalone (favicon, loading):**
```svg
<circle cx="12" cy="12" r="8" fill="none" stroke="#4A7FF8" strokeWidth="2"/>
<circle cx="12" cy="12" r="3.5" fill="#4A7FF8"/>
```

---

### Animacje

```css
/* Wejście strony */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.page-enter { animation: fadeUp 0.35s ease-out; }

/* Score bar fill (po załadowaniu wyników) */
.score-fill { transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
/* Startuje od width: 0%, po 200ms delay animuje do wartości docelowej */

/* Loading aura (podczas oczekiwania na API) */
@keyframes auraPulse {
  0%, 100% { opacity: 0.15; transform: scale(0.95); }
  50%       { opacity: 0.3;  transform: scale(1.05); }
}
/* Nakładane na 3 elipsy aury z różnymi delay: 0s, 0.4s, 0.8s */

/* Hover karty */
.card { transition: border-color 0.15s ease, transform 0.15s ease; }
.card:hover { border-color: var(--border-input); }

/* Persona accordion */
.accordion-body { transition: height 0.25s ease-out, opacity 0.2s ease; }

/* Przycisk */
.btn { transition: opacity 0.15s, transform 0.15s; }
.btn:hover { opacity: 0.9; transform: translateY(-1px); }
.btn:active { transform: translateY(0); opacity: 1; }
```

---

### Loading state — symulacja person

Podczas oczekiwania na odpowiedź API (streaming):

```jsx
/* Avatar grid — 12 kółek pulsujących jak agenty */
const LoadingPersonas = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
    {[...Array(12)].map((_, i) => (
      <div key={i} style={{
        width: 32, height: 32,
        borderRadius: '50%',
        background: PERSONA_COLORS[i % 6],
        opacity: 0.3,
        animation: `pulse 1.5s ease-in-out ${i * 0.12}s infinite`,
      }}/>
    ))}
  </div>
);

/* Tekst pod avatarami */
<p style={{ fontFamily: 'DM Mono', fontSize: 11, color: '#9A9890', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
  Symulacja w toku...
</p>
```

---

### Werdykt — wyróżnianie person w tekście

Kiedy Claude wspomina personę z imienia w tekście werdyktu lub rekomendacji, jej imię powinno być wyróżnione kolorem przypisanym do tej persony:

```jsx
/* Zosia → kolor --persona-1 (#4A7FF8) */
<span style={{ color: '#4A7FF8', fontWeight: 500 }}>Zosia</span>

/* Kacper → kolor --persona-2 (#FF7648) */
<span style={{ color: '#FF7648', fontWeight: 500 }}>Kacper</span>
```

Implementacja: po otrzymaniu werdyktu z API, replace imion person na span'y z odpowiednimi kolorami.

---

### Dark mode

MVP nie ma dark mode. Wystarczy jasny motyw.
Przyszła wersja: dodamy dark mode jako opcję w ustawieniach.
Nie używaj `prefers-color-scheme` w MVP — nie komplikuj.

---

## LOGIKA AI — SYSTEM PROMPTY

### Prompt do generowania person (onboarding)

```
System:
Jesteś ekspertem od badań konsumenckich i psychografii rynkowej.
Na podstawie opisu biznesu wygeneruj 4 precyzyjne persony klientów.

Odpowiadaj WYŁĄCZNIE w formacie JSON. Zero tekstu poza JSON.

Format:
{
  "personas": [
    {
      "name": "string — polskie imię",
      "age": "string — wiek lub przedział, np. '23' lub '25-32'",
      "emoji": "string — jeden emoji charakteryzujący personę",
      "shortDesc": "string — max 10 słów, esencja persony",
      "description": "string — 200-300 słów pełnego profilu: demografia, psychografia, motywacje, bariery, media habits, stosunek do kategorii produktowej, typowy dzień, co go/ją wkurwia, co kocha, jak podejmuje decyzje zakupowe"
    }
  ]
}

User:
Opis biznesu: [BUSINESS_DESCRIPTION]
Branża: [INDUSTRY]
Miasto: [CITY]
```

### Prompt do analizy (główna funkcja)

```
System:
Jesteś strategiem marketingowym z 15-letnim doświadczeniem w Polsce.
Specjalizujesz się w predykcji reakcji konsumentów na działania marketingowe.

Masz dostęp do profilu biznesowego klienta i grupy docelowej.
Twoim zadaniem jest symulacja reakcji konkretnych person na podany input marketingowy.

Bądź szczery, konkretny i odważny w ocenach. Nie lizesz tyłka.
Jeśli pomysł jest słaby — powiedz to wprost i wyjaśnij dlaczego.
Jeśli jest silny — powiedz co dokładnie działa i co można jeszcze ulepszyć.

Kontekst biznesowy:
[BUSINESS_DESCRIPTION]

Persony do symulacji:
[PERSONAS_JSON]

Odpowiadaj WYŁĄCZNIE w JSON. Zero tekstu poza JSON.

Format odpowiedzi:
{
  "verdict": "string — 2-3 zdania syntetycznego werdyktu, konkretne, po polsku",
  "overallScore": number (1-10),
  "hookScore": number (1-10, tylko jeśli tryb = kreacja lub hook, inaczej null),
  "emotionalScore": number (1-10),
  "potentialScore": number (1-10),
  "biggestRisk": "string — jedno zdanie, największe ryzyko",
  "hiddenOpportunity": "string — jedno zdanie, nieoczywista szansa",
  "personas": [
    {
      "personaId": "string",
      "score": number (1-10),
      "conversionProbability": number (0-100),
      "reaction": "string — 2-3 zdania jak ta persona konkretnie zareaguje, po polsku",
      "emotionalTrigger": "string — główny trigger emocjonalny tej persony",
      "strengths": ["string", "string"],
      "risks": ["string"],
      "suggestion": "string — jedna konkretna zmiana dla tej persony"
    }
  ],
  "topActions": ["string", "string", "string"]
}

User:
TRYB: [MODE_LABEL]
INPUT: [USER_INPUT]
[CONTEXT jeśli podany]
[IMAGE jeśli uploadowany]
```

### Prompt do streamingu

Używaj `stream: true` w API call. Wyniki parsuj inkrementalnie i wyświetlaj w UI w miarę jak przychodzą. Zamiast pokazywać surowy JSON — parse'uj na bieżąco i wyświetlaj sekcje w miarę kompletowania się danych:
1. Najpierw pojawia się werdykt (hero section)
2. Potem score'y (animowane paski)
3. Potem ryzyko & szansa
4. Potem persony jedna po drugiej (accordion się buduje)
5. Na końcu rekomendacje

---

## POZIOMY ANALIZY (v1.1 — sierpień 2026)

> Decyzja architektoniczna podjęta po analizie MiroShark (github.com/MiroShark/MiroShark)
> i MiroFish (github.com/666ghj/MiroFish) oraz obradach AI Council.
> Oba projekty referencyjne są na licencji AGPL-3.0 — **inspirujemy się wzorcami
> architektonicznymi, NIGDY nie kopiujemy kodu** (ryzyko licencyjne dla komercjalizacji).

Proba ma dwa jawnie rozdzielone joby:
- **(a) Narzędzie diagnostyczne** — znajduje słabe punkty kreacji PRZED publikacją (falsyfikacja, nie wyrocznia)
- **(b) Generator contentu** — wyniki są materiałem do filmów Mata

To rozróżnienie determinuje etykiety w UI i komunikację (patrz: STRATEGIA KOMUNIKACJI).

### ⚡ Poziom 1 — Szybka analiza (istnieje)

Jeden strzał do Claude: wszystkie persony w jednym prompcie, streaming JSON, ~30 sek, grosze.
Do codziennego testu hooka przed nagraniem. Bez zmian.

**Znane ograniczenie (nazywać uczciwie):** persony symulowane w jednym kontekście są
skorelowane — jeden model gra wszystkie naraz. Poziom 2 istnieje właśnie po to.

### 🧠 Poziom 2 — Rada person (implementacja TERAZ)

Wzorzec: LLM Council (Karpathy). Każda persona = OSOBNE wywołanie API z własnym kontekstem.

**Elementy (tylko te — reszta odrzucona przez Council jako dekoracja):**
1. **Niezależne reakcje** — każda persona osobny call, nie widzi innych person. Usuwa cross-kontaminację.
2. **Zimny klient** 🧊 — dodatkowa pseudo-persona która dostaje WYŁĄCZNIE kreację/input,
   ZERO kontekstu biznesu, person i marki. Łapie klątwę wiedzy ("nie wiem co to KOMBINI").
   Najwyżej oceniony element całego planu — implementować pierwszorzędnie.
3. **Runda dyskusji (social proof)** — persony widzą skrócone opinie pozostałych i mogą
   zrewidować ocenę. W UI etykieta: "symulacja dyskusji" — NIE "dowód rynkowy".
   Zmiana zdania persony to artefakt symulacji, nie nauka. Ale jest świetnym contentem.
4. **Synteza stratega** — jeden call zbiera wszystko: gdzie persony zgodne, gdzie się
   rozjeżdżają, finalne score'y i rekomendacje.

**Architektura wykonania (KRYTYCZNE):**
- Orkiestracja **z przeglądarki**, nie z serverless — omija timeout Vercela (60-120s)
  i pasuje do modelu "klucz API u użytkownika". Klient robi sekwencję fetchy do lekkich
  API routes; każdy route to JEDEN call do Claude.
- Fazy: reakcje person równolegle (N+1 calli z zimnym klientem) → runda dyskusji
  równolegle (N calli) → synteza (1 call). Razem 2N+2 (~10 dla 4 person), 2-3 min.
- Prompt caching (cache_control ephemeral) na wspólnym system prompcie — te same
  opisy biznesu idą w N calli, bez cache płacimy N razy.
- Rate limity: świeży klucz Tier 1 ma niskie RPM — ograniczyć równoległość do 4-5
  jednoczesnych wywołań, resztę kolejkować.
- Czas oczekiwania to dramaturgia: UI pokazuje "obrady rady" (avatary person zapalają
  się po kolei, status per persona). Pasek "trwa obrada rady" filmuje się sam.

### 🌊 Poziom 3 — Symulacja populacji (NIE TERAZ)

Wzorzec koncepcyjny: MiroShark (fazowy pipeline: ontologia → populacja → symulacja
w rundach → raport; wstrzykiwanie wydarzeń; fork timeline'ów). NIE MiroFish (wymaga
zewnętrznej pamięci Zep Cloud i frameworka OASIS — architektura dla zespołu, nie solo).

**Status: zamrożony jako feature.** Warunki odblokowania: (1) Poziom 2 działa i jest
używany, (2) pojawia się płacący klient który o to prosi, (3) decyzja o backendzie
(kolejka zadań, baza — to inny produkt architektonicznie).

**Dozwolone wcześniej: jednorazowy event contentowy** — półręczna symulacja 500-1000
agentów lokalnym skryptem (Haiku + prompt caching ≈ 20-60 zł/przebieg, ~20+ min na
Tier 1), nagrana jako film. Wartość: dowód że Proba to nie zabawka + materiał flagowy.

**Uczciwa fizyka symulacji (do komunikacji i raportów):** N agentów tego samego modelu
to NIE N niezależnych opinii — błędy są skorelowane ("problem 11 kostiumów"). Realna
wartość dużej populacji to ROZKŁAD reakcji (ile % entuzjastów, gdzie pęka przekaz,
jak propaguje się opinia) i dynamika — nie precyzja pojedynczej predykcji.

---

## PĘTLA WALIDACJI (implementacja PRZED Poziomem 2)

Pierwszy krok z werdyktu Council — dzień pracy, zero nowej architektury:

1. **Pole `realOutcome` w Analysis** — "co się faktycznie stało": notatka + opcjonalny
   wynik liczbowy + data. Edytowalne z poziomu historii analiz.
2. **Wypełnić wstecznie** dla 5-10 starych kreacji o znanych wynikach (Mobile Vikings,
   własne hooki) — odpowiada na pytanie "czy Poziom 1 trafia lepiej niż rzut monetą".
3. **Wersjonowanie promptów** — stała `PROMPT_VERSION` zapisywana w każdej analizie.
   Bez zamrożenia wersji pętla porównuje różne systemy i nic nie mierzy.
4. **Rama: falsyfikacja, nie predykcja.** Przy kilkunastu zaszumionych punktach danych
   miesięcznie nie zbudujemy kalibracji statystycznej — pętla służy do: (a) wykrycia
   systematycznej ślepoty narzędzia, (b) budowy assetu danych nie do sklonowania,
   (c) uczciwej odpowiedzi dla pierwszego płacącego klienta.
5. **Publiczne zakłady jako format** — film "Proba mówi 7/10, sprawdzimy za tydzień"
   zamienia walidację w serial i buduje wiarygodność na oczach widzów.

---

## STRATEGIA KOMUNIKACJI — CLAIM FLAGOWY I ZASADY UCZCIWOŚCI

### Claim flagowy (hak marketingowy)

Najmocniejszy przekaz Proby (i źródło chwytliwości MiroShark/MiroFish):

> **"Zamknięty świat z 1000 postaci. Każda ma swoje życie, budżet i humory.
> Wpuszczam tam twoją reklamę i patrzę, co się stanie."**

Struktura "halo product": marketing opowiada o Poziomie 3 (spektakl), produkt
codzienny to Poziom 1/2 (sedan). Jak concept car w salonie — przyciąga wizja,
kupuje się narzędzie.

### Zasady uczciwości (NIENEGOCJOWALNE)

1. **Czasownik: "oceni i pokaże dynamikę", NIGDY "przewidzi sukces".**
   "1000 postaci oceni twoją kreację i pokaże ci, jak umiera albo jak się niesie" —
   równie chwytliwe, a nie składa obietnicy nie do obrony. Cyfrowa grupa fokusowa
   na sterydach, nie szklana kula. Sprzedawanie pewności bez kalibracji = horoskop
   w ładnym UI = spalony kanał (jedyne aktywo dystrybucyjne).
2. **Nigdy nie zawyżać liczby agentów.** Puściłeś 100 — mówisz 100. Widownia
   buildera-w-publicznym wybacza wszystko oprócz ściemy.
3. **Tryb "show" vs tryb "predykcja" jawnie rozdzielone.** Runda dyskusji person to
   "symulacja dyskusji" (show). Score'y i ryzyka to "diagnoza" (falsyfikacja).
   W UI i w filmach te etykiety nie mogą się mieszać.
4. **Publiczna kalibracja zamiast twierdzeń o trafności.** Dopóki nie ma serii
   "symulacja przewidziała X, stało się X" — nie twierdzimy, pokazujemy i sprawdzamy
   na oczach widzów.
5. **Sprzedawać pytaniami, nie mechaniką** (na poziomie UI): "Sprawdź pomysł" /
   "Znajdź słabe punkty" / "Zobacz, jak się przyjmie" — klient nie wie, czy jego
   problem to problem "za 30 sekund" czy "za 3 minuty". Liczba agentów i minut to
   hak w marketingu, nie nawigacja w produkcie.

---

## STORAGE — MVP z localStorage

```typescript
// Klucze localStorage
const KEYS = {
  API_KEY: 'umpt_api_key',
  WORKSPACES: 'umpt_workspaces',
  ANALYSES: 'umpt_analyses',        // Array wszystkich analiz
}

// Limity MVP
const LIMITS = {
  MAX_WORKSPACES: 10,
  MAX_ANALYSES_PER_WORKSPACE: 50,
  MAX_PERSONAS_PER_WORKSPACE: 6,
  MAX_IMAGE_SIZE_MB: 5,
}
```

**Ważne:** Przed każdym zapisem analiz sprawdź czy nie przekroczono limitu. Jeśli tak — usuń najstarszą analizę (FIFO). Poinformuj użytkownika o tym faktem w notifikacji.

---

## OBSŁUGA OBRAZÓW

```typescript
// Przed wysłaniem do API — resize po stronie klienta
async function resizeImage(file: File, maxDimension = 1024): Promise<string> {
  // Canvas resize do max 1024px (shorter side)
  // Eksport jako JPEG quality 0.85
  // Return base64 string (bez prefix data:image/...)
}
```

Antropic API przyjmuje obrazy jako base64 w wiadomości user. Format:
```json
{
  "type": "image",
  "source": {
    "type": "base64",
    "media_type": "image/jpeg",
    "data": "[BASE64_STRING]"
  }
}
```

---

## FLOW IMPLEMENTACJI — KOLEJNOŚĆ BUDOWANIA

### Faza 1 — Fundament (dzień 1-2)
1. Next.js setup z TypeScript + Tailwind
2. Design system: CSS variables, fonty, podstawowe komponenty (Button, Card, Input, Textarea)
3. Layout z sidebar + main content
4. localStorage service (CRUD dla workspace'ów i analiz)
5. Strona `/settings` z kluczem API

### Faza 2 — Workspace (dzień 2-3)
1. Dashboard (`/dashboard`) — lista workspace'ów
2. Kreator workspace'u — krok 1 i 2 (bez person)
3. Generowanie person przez AI — `POST /api/generate-personas`
4. Ręczna edycja person
5. Widok główny workspace'u (`/workspace/[id]`)

### Faza 3 — Analiza (dzień 3-4)
1. Formularz analizy (`/workspace/[id]/analyze`)
2. Upload i resize obrazu po stronie klienta
3. API route `POST /api/analyze` — streaming response
4. Parsing streamu i inkrementalne wyświetlanie wyników
5. Zapis wyników do localStorage

### Faza 4 — Polish (dzień 4-5)
1. Historia analiz (`/workspace/[id]/history`)
2. Animacje i micro-interactions
3. Dekoracyjne elementy japońskie
4. Responsywność (mobile-first check)
5. Error handling (brak klucza API, błąd sieci, zbyt duży obraz)
6. Loading states dla wszystkich async operacji
7. Notifikacje (toast) dla akcji użytkownika

---

## PRELOADED WORKSPACE'Y (SEED DATA)

Przy pierwszym uruchomieniu aplikacji (localStorage pusty) — utwórz 4 workspace'y z wbudowanymi personami żeby użytkownik od razu mógł testować bez konfiguracji:

### Workspace 1: KOMBINI / Matchomaty
```
Emoji: 🟠
Nazwa: KOMBINI / Matchomaty
Branża: Food & Beverage / Vending Machines
Miasto: Wrocław, Polska
Opis: Sieć premium automatów vendingowych z matchą ceremonialną i kawą specialty w Wrocławiu. Automat to nie tylko maszyna — to doświadczenie. 43-calowy ekran dotykowy, premium opakowania, mascotek Matchuś i Dripcio. Target: Gen Z i Millenialsi którzy wiedzą czym jest dobra matcha. Ceny: matcha mała 12 zł, duża 16 zł, espresso 8 zł. Pierwsza lokalizacja: centrum Wrocławia. Plany: 10 automatów w 2026, 100 w 2027, potem kawiarnie fizyczne. Marka: japońska estetyka, humor, autentyczność. Właściciel: Mat — twórca wideo i grafik, buduje markę publicznie na @_poprostumati.
Persony: [patrz niżej]
```

Persony KOMBINI:
- Zosia, 21, ⚡ — "Studentka AWF, matcha-girl, TikTok native, kupuje oczami"
- Kacper, 26, 💻 — "Junior dev, remote work, kawa jako produktywność, sceptyczny ale lojalny"
- Ania, 28, 🌿 — "Wellness, zdrowe odżywianie, sprawdza składy, gotowa płacić więcej"
- Mikołaj, 32, ⚡ — "Zapracowany, convenience first, nie ma czasu na kolejkę w kawiarni"

### Workspace 2: Mobile Vikings
```
Emoji: 📱
Nazwa: Mobile Vikings
Branża: Telekomunikacja / MVNO
Miasto: Polska (ogólnopolski)
Opis: Mobile Vikings to challenger brand w polskiej telekomunikacji. MVNO operujące na sieci Play. Znany z prostych cenników, braku gwiazdek i uczciwego podejścia do klienta. Silna społeczność (Vikings), brand personality: szczery, bezpośredni, antykorpo. Target: osoby 20-40 które mają dość wielkich operatorów. Plany od 25 zł/mc. Główne kanały: digital, social media, word-of-mouth. Mat pracuje tam jako grafik w dziale marketingu.
Persony: [patrz niżej]
```

Persony Mobile Vikings:
- Bartek, 27, 🔥 — "Tech-savvy, porównuje oferty przed zakupem, nienawidzi ukrytych opłat"
- Magda, 34, 💼 — "Pracująca mama, chce mieć to z głowy, lojalność za dobry deal"
- Szymon, 22, 💸 — "Student, liczy każdą złotówkę, social proof decyduje o wyborze"

### Workspace 3: Content Wideo (@_poprostumati)
```
Emoji: 🎬
Nazwa: Content wideo / @_poprostumati
Branża: Content Creator / Social Media
Miasto: Wrocław / online
Opis: Mat tworzy content na TikToku i Instagramie pod nickiem @_poprostumati. Seria "zakładam biznes i nie gatekeepuję" — dokumentuje budowanie KOMBINI od zera. Inne serie: AI w marketingu, grafika, życie przedsiębiorcy. Widownia: twórcy, młodzi przedsiębiorcy, studenci marketingu, graficy. Format: krótkie wideo (15-60 sek), edukacyjne + entertaining, montaż dynamiczny. Hook jest wszystkim.
Persony: [patrz niżej]
```

Persony content:
- Kasia, 23, 📱 — "Twórczyni na TikToku, szuka inspiracji, zapisuje i wraca"
- Damian, 28, 🚀 — "Chce założyć własny biznes, pochłania każdy content o entrepreneurship"
- Marta, 25, 🎨 — "Graficzka, interesuje się AI i designem, ogląda dla konkretów"

### Workspace 4: Cyrulicy / Soppo (brat)
```
Emoji: 💈
Nazwa: Cyrulicy / Soppo
Branża: Kosmetyki / Grooming
Miasto: Polska
Opis: Dwie marki kosmetyczne brata. Cyrulicy — produkty do pielęgnacji dla mężczyzn, zakład fryzjerski/barberski vibe, tradycja + nowoczesność. Soppo — bardziej unisex/damskie, premium kosmetyki. Oba brandy celują w świadomych konsumentów którzy traktują pielęgnację jako rytuał. Ceny: segment premium (50-200 zł za produkt). Sprzedaż: online + partnerskie salony.
Persony: [patrz niżej]
```

Persony Cyrulicy/Soppo:
- Piotr, 30, 💈 — "Barbershop regular, dba o siebie, brand story ma znaczenie"
- Natalia, 27, ✨ — "Kupuje kosmetyki świadomie, składy i wartości marki są ważne"
- Tomek, 38, 👔 — "Manager, pielęgnacja to element profesjonalizmu, premium = jakość"

---

## ERROR HANDLING

### Brak klucza API
- Nie blokuj całej aplikacji
- Przy próbie uruchomienia analizy: modal "Dodaj klucz API Anthropic żeby uruchomić symulację" z przyciskiem → `/settings`

### Błąd API (rate limit, timeout, invalid key)
- Toast notification z konkretnym komunikatem
- Możliwość retry
- Nie tracić inputu użytkownika

### Zbyt duży obraz
- Sprawdź rozmiar przed uploadem (max 5MB)
- Auto-resize dzieje się zawsze (do 1024px) ale ponad 5MB odrzuć z komunikatem

### Brak internetu
- Graceful degradation — workspace'y i historia działają offline (localStorage)
- Tylko analiza wymaga połączenia — wyraźny komunikat

---

## UWAGI DLA CLAUDE CODE

1. **Zacznij od design systemu** — zdefiniuj CSS variables i podstawowe komponenty zanim zaczniesz budować strony. Spójność wizualna jest krytyczna. Import fontów DM Sans + DM Mono na początku global CSS.

2. **localStorage jako primary storage w MVP** — nie instaluj bazy danych. Supabase dodamy w v2 kiedy będzie rzeczywisty użytkownik płacący.

3. **Streaming jest obowiązkowy** — nie czekaj na pełną odpowiedź API. Użytkownik musi widzieć że coś się dzieje. Streaming API Anthropic przez Next.js Server-Sent Events.

4. **Nigdy nie commituj klucza API** — `.env.local` jest w `.gitignore`. Klucz API pochodzi z localStorage ustawionego przez użytkownika w `/settings`.

5. **Resize obrazów po stronie klienta** — przed wysłaniem do Anthropic API. Nie wysyłaj oryginalnych plików. Max 1024px, JPEG 0.85.

6. **Seed data przy pierwszym uruchomieniu** — sprawdź czy localStorage jest pusty, jeśli tak — załaduj 4 predefiniowane workspace'y z personami. To eliminuje friction przy pierwszym użyciu.

7. **ZERO ostrych rogów** — minimalny border-radius to 8px. Każda karta, button, input, tag ma zaokrąglone rogi. To fundamentalna zasada nowego design systemu.

8. **Aura na ekranie analizy** — zaimplementuj dekoracyjne elipsy (SVG, 3 kolory, opacity 0.2-0.25) jako absolutely positioned element w greeting card. To jest najważniejszy element wizualny który wyróżni Proba.

9. **DM Sans dla wszystkiego, DM Mono tylko dla labels** — nie używaj innych fontów. DM Sans weight 400/500/600. Letter-spacing -0.02 do -0.03em dla dużych nagłówków.

10. **Kolory person w tekście** — po otrzymaniu werdyktu, replace imion person na kolorowe span'y. Zosia = #4A7FF8, Kacper = #FF7648, Ania = #FFC757, Mikołaj = #9A7ABA.

11. **Mobile-first ale desktop-first w designie** — aplikacja będzie używana głównie na desktopie. Responsywność obowiązkowa ale desktop layout jest priorytetem.

12. **Historia analiz jest ważna** — Mat będzie pokazywał screenshoty historycznych analiz w filmach. Każda analiza musi być zapisana z pełnymi wynikami i łatwo dostępna.

---

## METRYKI SUKCESU MVP

- [ ] Można stworzyć workspace i wygenerować persony w < 3 minuty
- [ ] Analiza zwraca wyniki w < 30 sekund (streaming)
- [ ] Screenshoty wyników wyglądają profesjonalnie (test: czy Mat chciałby to pokazać w wideo)
- [ ] Aplikacja działa bez błędów dla 4 preloaded workspace'ów
- [ ] Klucz API jest bezpieczny (tylko localStorage, nie logowany)
- [ ] Historia analiz jest dostępna i czytelna

---

*Specyfikacja: Claude (Anthropic) | Projekt: Mat | Marzec 2026*
*Wersja dokumentu: 1.0 — MVP*
