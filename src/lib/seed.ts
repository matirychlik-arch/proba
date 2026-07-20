import { Workspace } from './types'
import { saveWorkspace, isSeeded } from './storage'

const now = () => new Date().toISOString()

const SEED_WORKSPACES: Omit<Workspace, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'ws-kombini',
    name: 'KOMBINI / Matchomaty',
    emoji: '🟠',
    industry: 'Food & Beverage / Vending Machines',
    targetCity: 'Wrocław, Polska',
    description:
      'Sieć premium automatów vendingowych z matchą ceremonialną i kawą specialty w Wrocławiu. Automat to nie tylko maszyna — to doświadczenie. 43-calowy ekran dotykowy, premium opakowania, mascotek Matchuś i Dripcio. Target: Gen Z i Millenialsi którzy wiedzą czym jest dobra matcha. Ceny: matcha mała 12 zł, duża 16 zł, espresso 8 zł. Pierwsza lokalizacja: centrum Wrocławia. Plany: 10 automatów w 2026, 100 w 2027, potem kawiarnie fizyczne. Marka: japońska estetyka, humor, autentyczność. Właściciel: Mat — twórca wideo i grafik, buduje markę publicznie na @_poprostumati.',
    personas: [
      {
        id: 'p-zosia',
        name: 'Zosia',
        age: '21',
        emoji: '⚡',
        shortDesc: 'Studentka AWF, matcha-girl, TikTok native, kupuje oczami',
        description:
          'Zosia ma 21 lat, studiuje na AWF we Wrocławiu i żyje w rytmie treningów, zajęć i TikToka. Matcha to część jej tożsamości — pije ją nie tylko dla smaku, ale dlatego że pasuje do jej estetyki życia. Kupuje oczami: opakowanie, kolory i to jak produkt wygląda na story decyduje o zakupie szybciej niż cena. Śledzi trendy z USA i Korei, wie czym różni się matcha ceremonialna od kulinarnej. Ma ograniczony budżet studencki, ale na rzeczy które są "jej vibe" pieniądze zawsze się znajdą. Wkurza ją ściema i sztuczność marek które udają młodzieżowe. Kocha odkrywać miejsca przed innymi — bycie pierwszą która pokaże nowy spot na TikToku to dla niej wartość sama w sobie. Decyzje podejmuje impulsywnie, pod wpływem estetyki i social proof. Jeśli trzy dziewczyny z jej feedu pokażą matchomat — ona tam będzie następnego dnia.',
      },
      {
        id: 'p-kacper',
        name: 'Kacper',
        age: '26',
        emoji: '💻',
        shortDesc: 'Junior dev, remote work, kawa jako produktywność, sceptyczny ale lojalny',
        description:
          'Kacper ma 26 lat, pracuje zdalnie jako junior developer w software house. Kawa to dla niego paliwo — pije 2-3 dziennie i traktuje ją funkcjonalnie, jako narzędzie produktywności. Do nowości podchodzi sceptycznie: zanim coś kupi, sprawdzi opinie, porówna ceny i zada sobie pytanie "czy to nie jest przerost formy nad treścią". Nie kupi czegoś dlatego że jest ładne — ale jeśli produkt go przekona jakością, zostaje lojalnym klientem na lata i poleca znajomym. Automat z kawą specialty w sensownej cenie to dla niego ciekawa alternatywa dla sieciówek, które uważa za przepłacone. Matcha go nie kręci, ale dobre espresso za 8 zł — to już rozmowa. Wkurzają go kolejki, small talk z baristą i płacenie 18 zł za latte. Kocha efektywność. Decyzje podejmuje analitycznie, ale raz przekonany — nie szuka dalej.',
      },
      {
        id: 'p-ania',
        name: 'Ania',
        age: '28',
        emoji: '🌿',
        shortDesc: 'Wellness, zdrowe odżywianie, sprawdza składy, gotowa płacić więcej',
        description:
          'Ania ma 28 lat, pracuje w korporacji ale jej prawdziwe życie to wellness: joga, medytacja, świadome odżywianie. Czyta składy na opakowaniach jak inni czytają wiadomości. Matchę pije od lat — wie skąd pochodzi dobra matcha, rozpoznaje jakość po kolorze i smaku. Jest gotowa zapłacić więcej za produkt który jest autentyczny, zdrowy i etyczny — ale biada marce która ściemnia. Jeśli "matcha ceremonialna" okaże się kulinarną, Ania to wykryje i powie o tym całemu swojemu otoczeniu. Instagram to jej medium — śledzi twórców wellness, zapisuje miejsca, planuje. Wkurza ją greenwashing i zdrowotny marketing bez pokrycia. Kocha rytuały — matcha o poranku to jej moment. Decyzje podejmuje świadomie, powoli, ale jest bardzo lojalna wobec marek które przeszły jej weryfikację.',
      },
      {
        id: 'p-mikolaj',
        name: 'Mikołaj',
        age: '32',
        emoji: '⚡',
        shortDesc: 'Zapracowany, convenience first, nie ma czasu na kolejkę w kawiarni',
        description:
          'Mikołaj ma 32 lata, prowadzi własną firmę i jego dzień jest zaplanowany co do minuty. Convenience to jego religia — wszystko co oszczędza czas jest warte pieniędzy. Kawę pije dużo, ale nie ma czasu stać w kolejce w kawiarni ani czekać aż barista skończy rozmowę ze stałym klientem. Automat który w 60 sekund daje dobrą kawę w drodze na spotkanie? Sold. Nie interesuje go historia marki ani estetyka opakowania — interesuje go szybkość, powtarzalność jakości i to żeby płatność działała zbliżeniowo za pierwszym razem. Matchy nie pije, ale jego dziewczyna tak — więc czasem kupi jej w drodze do domu. Wkurzają go niedziałające automaty, aplikacje wymagające rejestracji i wszystko co marnuje jego czas. Kocha rzeczy które po prostu działają. Decyzje podejmuje błyskawicznie na podstawie użyteczności.',
      },
    ],
  },
  {
    id: 'ws-mv',
    name: 'Mobile Vikings',
    emoji: '📱',
    industry: 'Telekomunikacja / MVNO',
    targetCity: 'Polska (ogólnopolski)',
    description:
      'Mobile Vikings to challenger brand w polskiej telekomunikacji. MVNO operujące na sieci Play. Znany z prostych cenników, braku gwiazdek i uczciwego podejścia do klienta. Silna społeczność (Vikings), brand personality: szczery, bezpośredni, antykorpo. Target: osoby 20-40 które mają dość wielkich operatorów. Plany od 25 zł/mc. Główne kanały: digital, social media, word-of-mouth. Mat pracuje tam jako grafik w dziale marketingu.',
    personas: [
      {
        id: 'p-bartek',
        name: 'Bartek',
        age: '27',
        emoji: '🔥',
        shortDesc: 'Tech-savvy, porównuje oferty przed zakupem, nienawidzi ukrytych opłat',
        description:
          'Bartek ma 27 lat, pracuje w IT i jest typem człowieka który przed każdym zakupem robi research. Zna ceny wszystkich operatorów na pamięć, śledzi promocje i wie dokładnie ile GB zużywa miesięcznie. Nienawidzi ukrytych opłat, gwiazdek w regulaminach i "promocji" które po 6 miesiącach zamieniają się w drenaż portfela. Do Mobile Vikings trafił bo znajomy z pracy pokazał mu porównanie cen. Uczciwy cennik bez ściemy to dla niego główny argument — ale też pierwszy powód do odejścia, gdyby marka zaczęła kombinować. Aktywny na Wykopie i Reddicie, jego opinia wpływa na decyzje zakupowe znajomych. Wkurza go korpo-mowa i marketing traktujący klienta jak idiotę. Kocha transparentność i konkrety. Decyzje podejmuje na podstawie danych, ale lojalność buduje przez zaufanie.',
      },
      {
        id: 'p-magda',
        name: 'Magda',
        age: '34',
        emoji: '💼',
        shortDesc: 'Pracująca mama, chce mieć to z głowy, lojalność za dobry deal',
        description:
          'Magda ma 34 lata, pracuje na pełen etat i wychowuje dwójkę dzieci. Telefon to narzędzie — ma działać, a rachunek ma być przewidywalny. Nie ma czasu ani ochoty analizować ofert operatorów; chce raz podjąć dobrą decyzję i mieć to z głowy na lata. Zmiana operatora to dla niej stres — boi się formalności, przerwy w działaniu numeru i tego że "coś pójdzie nie tak". Ale jeśli ktoś zaufany (siostra, koleżanka z pracy) powie jej "przeszłam, było proste, płacę połowę mniej" — rozważy to poważnie. Docenia kiedy firma nie wymaga od niej wysiłku: prosta apka, automatyczne płatności, brak niespodzianek na fakturze. Wkurzają ją infolinie, przedłużanie umów podstępem i konieczność pilnowania promocji. Kocha święty spokój. Za dobry deal i brak problemów odwdzięcza się wieloletnią lojalnością.',
      },
      {
        id: 'p-szymon',
        name: 'Szymon',
        age: '22',
        emoji: '💸',
        shortDesc: 'Student, liczy każdą złotówkę, social proof decyduje o wyborze',
        description:
          'Szymon ma 22 lata, studiuje i utrzymuje się z dorywczych zleceń i pomocy rodziców. Każda złotówka ma znaczenie — 25 zł vs 35 zł miesięcznie to dla niego realna różnica. Internet mobilny to jego podstawowe medium: TikTok, YouTube, Spotify, wszystko na danych komórkowych bo w wynajmowanym pokoju WiFi bywa różne. Potrzebuje dużej paczki GB za minimalną cenę. Ofert nie porównuje w Excelu jak Bartek — patrzy co mają znajomi i co polecają twórcy których ogląda. Social proof to jego kompas: jeśli trzech kumpli ma Vikings i chwalą, to znaczy że działa. Wkurzają go zobowiązania — umowa na 24 miesiące brzmi jak wyrok. Kocha elastyczność i poczucie że nikt go nie wiąże. Decyzje podejmuje szybko, na podstawie rekomendacji i ceny.',
      },
    ],
  },
  {
    id: 'ws-content',
    name: 'Content wideo / @_poprostumati',
    emoji: '🎬',
    industry: 'Content Creator / Social Media',
    targetCity: 'Wrocław / online',
    description:
      'Mat tworzy content na TikToku i Instagramie pod nickiem @_poprostumati. Seria "zakładam biznes i nie gatekeepuję" — dokumentuje budowanie KOMBINI od zera. Inne serie: AI w marketingu, grafika, życie przedsiębiorcy. Widownia: twórcy, młodzi przedsiębiorcy, studenci marketingu, graficy. Format: krótkie wideo (15-60 sek), edukacyjne + entertaining, montaż dynamiczny. Hook jest wszystkim.',
    personas: [
      {
        id: 'p-kasia',
        name: 'Kasia',
        age: '23',
        emoji: '📱',
        shortDesc: 'Twórczyni na TikToku, szuka inspiracji, zapisuje i wraca',
        description:
          'Kasia ma 23 lata i sama tworzy content na TikToku — ma kilka tysięcy obserwujących i ambicję na więcej. Content innych twórców ogląda podwójnie: jako widz i jako analityk. Rozkłada hooki na czynniki pierwsze, zapisuje wideo które ją zatrzymały i wraca do nich przed nagrywaniem własnych. Szuka twórców którzy dzielą się warsztatem — konkretne techniki, before/after, liczby. Follow daje za wartość, nie za osobowość. Scrolluje szybko i bezlitośnie: jeśli pierwsze 2 sekundy nie obiecują konkretu, przesuwa dalej. Wkurza ją content o niczym — gadające głowy które przez minutę nie mówią nic. Kocha kiedy ktoś pokazuje proces od kuchni, z liczbami i błędami. Zapisuje więcej niż lajkuje. Jej zaangażowanie to komentarz z pytaniem technicznym.',
      },
      {
        id: 'p-damian',
        name: 'Damian',
        age: '28',
        emoji: '🚀',
        shortDesc: 'Chce założyć własny biznes, pochłania każdy content o entrepreneurship',
        description:
          'Damian ma 28 lat, pracuje na etacie który go nudzi i od dwóch lat "zaraz zakłada" własny biznes. Pochłania content o przedsiębiorczości kompulsywnie: podcasty, TikToki, YouTube. Serie typu "buduję firmę od zera" to jego ulubiony gatunek — daje mu poczucie uczestnictwa w czymś co sam chce zrobić. Najbardziej rezonują z nim konkrety: ile co kosztowało, jakie błędy, ile zarobił. Motywacyjne ogólniki przewija — ma ich dość. Jest sceptyczny wobec "guru biznesu" sprzedających kursy, ale twórca który pokazuje realny biznes z realnymi liczbami zdobywa jego pełne zaufanie. Komentuje, zadaje pytania, udostępnia znajomym z pracy. Wkurza go gatekeeping i udawanie że sukces przyszedł łatwo. Kocha transparentność. Jest o krok od działania — dobry content może być tym co go popchnie.',
      },
      {
        id: 'p-marta',
        name: 'Marta',
        age: '25',
        emoji: '🎨',
        shortDesc: 'Graficzka, interesuje się AI i designem, ogląda dla konkretów',
        description:
          'Marta ma 25 lat, pracuje jako graficzka w agencji i śledzi wszystko co dzieje się na styku designu i AI. Ogląda content zawodowo — szuka narzędzi, technik i skrótów które może wykorzystać w pracy następnego dnia. Tutorial który pokazuje realny workflow wart jest dla niej więcej niż dziesięć filmów o "przyszłości AI". Ma wyostrzony zmysł estetyczny — słaby design w contencie o designie ją dyskwalifikuje jako odbiorcę. Twórcę który sam robi dobrą grafikę traktuje jako wiarygodne źródło. Boi się trochę że AI zabierze jej pracę, więc content pokazujący jak grafik może używać AI zamiast z nim konkurować trafia w jej czuły punkt. Wkurza ją clickbait i tutoriale które obiecują więcej niż pokazują. Kocha konkret: narzędzie, ustawienia, efekt. Zapisuje do kolekcji i wraca w pracy.',
      },
    ],
  },
  {
    id: 'ws-cyrulicy',
    name: 'Cyrulicy / Soppo',
    emoji: '💈',
    industry: 'Kosmetyki / Grooming',
    targetCity: 'Polska',
    description:
      'Dwie marki kosmetyczne brata. Cyrulicy — produkty do pielęgnacji dla mężczyzn, zakład fryzjerski/barberski vibe, tradycja + nowoczesność. Soppo — bardziej unisex/damskie, premium kosmetyki. Oba brandy celują w świadomych konsumentów którzy traktują pielęgnację jako rytuał. Ceny: segment premium (50-200 zł za produkt). Sprzedaż: online + partnerskie salony.',
    personas: [
      {
        id: 'p-piotr',
        name: 'Piotr',
        age: '30',
        emoji: '💈',
        shortDesc: 'Barbershop regular, dba o siebie, brand story ma znaczenie',
        description:
          'Piotr ma 30 lat i wizyta w barbershopie co trzy tygodnie to jego stały rytuał. Pielęgnacja to dla niego element męskiej tożsamości — broda wymaga oleju, włosy pasty, a skóra po goleniu balsamu. Kupuje kosmetyki świadomie, ale nie analitycznie: decyduje historia marki, rekomendacja barbera i to czy produkt "ma charakter". Marka z autentyczną historią, ładnym opakowaniem i barberskim rodowodem wygrywa z drogeryjnymi gigantami mimo wyższej ceny. Śledzi kilku twórców lifestyle\'owych, ale najbardziej ufa rekomendacji ze swojego barbershopu — to dla niego naturalny kanał odkrywania produktów. Wkurza go marketing traktujący męską pielęgnację jak wstydliwy temat albo odwrotnie — przeseksualizowane reklamy "dla prawdziwych facetów". Kocha rzemieślniczość i szczegóły. Raz przekonany do marki, kupuje cały zestaw.',
      },
      {
        id: 'p-natalia',
        name: 'Natalia',
        age: '27',
        emoji: '✨',
        shortDesc: 'Kupuje kosmetyki świadomie, składy i wartości marki są ważne',
        description:
          'Natalia ma 27 lat i jej półka w łazience to wynik przemyślanych decyzji, nie impulsów. Czyta składy INCI, sprawdza aplikacje analizujące kosmetyki i wie które składniki jej służą. Wartości marki są dla niej realnym kryterium: cruelty-free, lokalna produkcja, sensowne opakowania. Polskie marki premium wspiera z przekonaniem — ale wymaga od nich więcej niż od zagranicznych, bo "skoro lokalnie, to ma być uczciwie". Cena 100+ zł za produkt jej nie odstrasza, jeśli za ceną idzie jakość składu i transparentność. Odkrywa marki przez Instagram i rekomendacje zaufanych twórczyń — ale reklamę od autentycznej rekomendacji odróżnia bezbłędnie. Wkurza ją pinkwashing, przepłacone opakowania z niczym w środku i "clean beauty" bez pokrycia. Kocha rytuał wieczornej pielęgnacji. Lojalna wobec marek które nie zawiodły jej zaufania.',
      },
      {
        id: 'p-tomek',
        name: 'Tomek',
        age: '38',
        emoji: '👔',
        shortDesc: 'Manager, pielęgnacja to element profesjonalizmu, premium = jakość',
        description:
          'Tomek ma 38 lat, zarządza zespołem w dużej firmie i wygląd traktuje jako element profesjonalizmu. Zadbany zarost, dobra fryzura i porządne kosmetyki to dla niego to samo co dobrze skrojony garnitur — inwestycja w wizerunek. Nie śledzi trendów kosmetycznych i nie czyta składów; jego heurystyka jest prosta: premium cena = premium jakość, eleganckie opakowanie = poważna marka. Kupuje rzadko ale dobrze — zestaw raz na kilka miesięcy, najlepiej od jednej marki żeby nie kombinować. Prezenty dla niego kupuje żona, więc marka która trafi do niej, trafi i do niego. Odkrywa produkty przez polecenia kolegów z pracy i klasyczną reklamę w dobrym wydaniu. Wkurza go infantylny marketing i konieczność wyboru z pięćdziesięciu opcji. Kocha prostotę i pewność. Cena nie jest barierą — barierą jest wątpliwość czy produkt jest "na jego poziomie".',
      },
    ],
  },
]

export function seedIfEmpty(): boolean {
  if (isSeeded()) return false
  const timestamp = now()
  for (const ws of SEED_WORKSPACES) {
    saveWorkspace({ ...ws, createdAt: timestamp, updatedAt: timestamp })
  }
  return true
}
