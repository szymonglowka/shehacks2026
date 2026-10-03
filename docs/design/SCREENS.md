# Otula — ekrany, killer features i zasady „nie wygląda jak AI”

Uzupełnia `README.md` (tokeny, układ). Ten plik opisuje **każdy ekran**: układ, treść, stany. Copy jest po polsku, angielską wersję robi i18n.

---

## 0. Zasada naczelna: ma wyglądać, jakby ktoś to zaprojektował z troską, a nie wygenerował

**Nie robimy** (to są znaki rozpoznawcze „AI slopu”):
- fioletowo-niebieskich gradientów, glassmorphismu wszędzie, świecących obramowań,
- ikony ✨ „magia/AI”, emoji zamiast ikon, ilustracji 3D blobów i ludzików z Corporate Memphis,
- generycznego copy: „Witaj z powrotem!”, „Odblokuj swój potencjał”, „Twoja podróż zaczyna się tutaj”,
- identycznych kart w siatce 3×N z ikoną, tytułem i dwoma zdaniami na każdym ekranie,
- domyślnych wykresów (siatka, legenda na dole, 6 kolorów),
- wyśrodkowanych hero z dwoma przyciskami.

**Robimy** (charakter Otuli):
- **Edytorski układ**: duże nagłówki szeryfowe (Newsreader), asymetria, dużo powietrza, liczby w szeryfie jako element graficzny (np. „39” dzień połogu jako wielka cyfra).
- **Motyw płatka**: cztery płatki z logo to jedyny element dekoracyjny. Wracają jako maska zdjęć, wskaźnik postępu (płatki się „domykają”), kształt kuli oddechu i separator. Nic innego nie dekorujemy.
- **Faktura papieru**: subtelny szum (SVG noise, 3–4% krycia) na tle `--cream`, żeby nie było „płasko-cyfrowo”.
- **Ręczne adnotacje na wykresach**: krótkie podpisy przy punktach („tu zaczęłaś spacery”, „noc 2 h snu”) pisane DM Sans italic z cienką linią wskazującą. To robi największą różnicę.
- **Copy ludzkie, konkretne, czasem z przymrużeniem oka**: „Kawa znowu wystygła? Normalka.”, „Nie musisz dziś niczego naprawiać.”, „Spałaś 3 godziny. To nie jest porażka, to jest noworodek.” Zwracamy się w formie żeńskiej, „Ty” wielką literą, nigdy nie oceniamy.
- **Zdjęcia**: prawdziwe, ciepłe, lekko zdesaturowane (`saturate(.78)`, jak w Figmie), zawsze w masce z zaokrągleniem albo płatkiem. Bez stockowych uśmiechów do kamery.
- **Ruch ma sens**: oddech, domykanie płatków po wykonaniu celu, delikatne „rise” modali. Żadnych konfetti.
- **Szczegóły, które czuć**: liczby tabelaryczne (`font-variant-numeric: tabular-nums`), polskie cudzysłowy „ ”, półpauzy (5–15 min), twarde spacje przed jednoliterowymi słowami.

---

## 1. Killer features (wyróżniki 2026)

| # | Funkcja | Dlaczego to robi wrażenie | Złożoność |
|---|---|---|---|
| K1 | **Nocna zmiana** | Automatycznie 22:00–6:00 (lub ręcznie) aplikacja przechodzi w ciepły, przyciemniony tryb do karmienia o 3 w nocy: bursztyn na prawie czarnym tle, mało niebieskiego światła, duże przyciski na jedną rękę, zero zbędnych treści. Pokazuje „**Nie jesteś sama: 37 mam z Otuli też teraz nie śpi**” (zanonimizowana liczba aktywnych w ostatnich 60 min, ukryta przy < 5). | średnia |
| K2 | **Krąg wsparcia z listą próśb** | Mama tworzy konkretne prośby („Obiad na czwartek”, „Przejmij karmienie o 2:00”, „Zabierz starsze dziecko na plac”). Bliscy dostają **link bez zakładania konta**, widzą listę i klikają „Biorę to”. Mama dostaje push „Tomek wziął: obiad na czwartek”. Zamienia „daj znać, jak coś” w realną pomoc. | średnia |
| K3 | **Raport na wizytę** | Jeden przycisk „Przygotuj się do wizyty”: 1–2 strony do druku i PDF dla położnej lub lekarza. Zawiera trend nastroju i snu, wyniki EPDS, objawy i ich częstotliwość, czerwone flagi oraz **Twoje pytania** zbierane na bieżąco („Zapisz pytanie na wizytę”). Rozwiązuje realny problem „w gabinecie wszystko zapominam”. | niska |
| K4 | **Prognoza na jutro** | Karta pogodowa samopoczucia (słonecznie / przejaśnienia / pochmurno / deszczowo), wyliczana z fazy cyklu, snu z ostatnich 3 nocy, trendu i dnia połogu (szczyt baby blues to 3.–5. doba). Daje proaktywną radę: „Jutro może być ciężej. Odpuść jedną rzecz z listy i zaplanuj 10 minut dla siebie”. Z dopiskiem „to wskazówka, nie wyrocznia”. | niska |
| K5 | **Adaptacyjny zestaw wsparcia** | (już w SPEC) Ranking strategii uczy się na podstawie odpowiedzi „czy pomogło?”. Na karcie widać to wprost: „Pomogło Ci w 4 z 5 trudniejszych dni”. | średnia |
| K6 | **Słoik małych wygranych** | Szybki wpis „Dziś mi się udało…” (wzięłam prysznic, wyszłam na 5 minut, poprosiłam o pomoc). Słoik wizualnie się zapełnia płatkami. W gorszy dzień wraca losowa wygrana: „Pamiętasz? 12 maja: pierwszy spacer we dwoje.” Przeciwwaga dla negatywnego myślenia. | niska |
| K7 | **Check-in głosem** | Przycisk mikrofonu przy notatce: Web Speech API w przeglądarce (pl-PL / en-US). Nie wysyłamy nic na zewnątrz, nie potrzeba klucza API. Na jedną rękę, gdy druga trzyma dziecko. Ukryty, gdy przeglądarka go nie obsługuje. | niska |
| K8 | **Objawy alarmowe + EPDS + silnik ryzyka** | (już w SPEC) Bezpieczeństwo jako funkcja, a nie dopisek. | — |

Na pitch: **K1 + K2 + K3** to trzy „wow” (emocja, społeczność, praktyczność). K4–K7 to detale, które budują wrażenie dopracowania.

---

## 2. Nawigacja (finalna)

- **Desktop (sidebar)**: Dzisiaj · Kalendarz · Wzorce · Cele · Wsparcie · Wiedza, a na dole: Profil i karta „Potrzebujesz pomocy? → Telefony wsparcia”.
  - „Statystyki” zmieniamy na **„Wzorce”**, bo brzmi mniej klinicznie i mówi, co użytkowniczka dostaje.
- **Mobile (dół)**: Dzisiaj · Kalendarz · **[ + ]** · Cele · Wsparcie.
  - `+` to wyróżniony środkowy przycisk (kółko forest, 52px), który otwiera szybkie menu: Check-in, Mała wygrana, Pytanie na wizytę, Okres się zaczął.
  - Wzorce: z karty odkrycia na „Dzisiaj” i z przełącznika w Kalendarzu. Wiedza i Profil: z awatara (arkusz „Ty”).
- **Topbar**: data · „Gorszy dzień” (pigułka z sercem) · dzwonek · awatar. W nocy dochodzi przełącznik księżyca (Nocna zmiana).

---

## 3. Ekrany

### 3.1 Powitanie (niezalogowana)
- Pełny ekran `--cream` z fakturą papieru. Po lewej (desktop) lub na górze (mobile) duży nagłówek: **„Troska o mamę. Nie tylko o dziecko.”**, pod nim jedno zdanie: „Codzienny check-in, wsparcie w gorszy dzień i plan powrotu do siebie. W Twoim tempie.”
- Po prawej zdjęcie w masce płatka (rodzic z dzieckiem, ciepłe światło).
- Przyciski: „Zaczynam” (forest) i „Mam już konto” (link). W stopce zawsze: „Potrzebujesz pomocy teraz? → Telefony wsparcia” (publiczne `/help`).

### 3.2 Onboarding („Poznajmy się”, 7 kroków, ~2 min)
Wspólny układ: lewa kolumna (desktop) z wielką cyfrą kroku w szeryfie („03”) i jednym zdaniem „po co pytamy”. Po prawej pytanie. Na górze pasek z 7 płatkami, które wypełniają się kolorem.
1. **Imię i język**: „Jak mamy się do Ciebie zwracać?”
2. **Tryb**: dwie duże karty ze zdjęciem: „Jestem po porodzie” / „Chcę lepiej rozumieć swój cykl”.
3. **Szczegóły**:
   - połóg: data porodu (kalendarz), rodzaj porodu (pigułki), karmienie (pigułki), a pod spodem na żywo: „To Twój **39. dzień** połogu, 6. tydzień”,
   - cykl: data ostatniej miesiączki, długość cyklu i okresu (suwaki z wartościami w szeryfie).
4. **„Co Ci pomaga, gdy jest ciężej?”**: lista strategii jako **wiersze** (nie siatka kart). Nazwa, krótki opis i 4-stopniowa skala w formie płatków: „nie dla mnie · czasem · pomaga · bardzo”. Licznik na górze: „Wybrałaś 5. Nauczymy się, co działa najlepiej.”
5. **„A co Ci odbiera siły?”**: pigułki do zaznaczenia (brak snu, samotność, ból, presja, porównywanie się, bałagan, brak czasu dla siebie…).
6. **Twój krąg**: „Kto może Ci pomóc, kiedy będzie trzeba?” Imię, relacja, telefon. Można pominąć („dodam później”).
7. **Pierwsze cele i rytm**: 3 polecane cele (wyróżnione: „Polecane w 6. tygodniu po cesarskim cięciu”) + „Dodaj własny”, godzina codziennego check-inu, prośba o powiadomienia z wyjaśnieniem „Przypomnimy tylko o tym, co sama ustawisz”.

Koniec: ekran „Gotowe, Marta.” z płatkami domykającymi się w logo (animacja 1,2 s) → Dzisiaj.

### 3.3 Dzisiaj (pulpit, wg Figmy + nowości)
Bazuje na `figma-make/App.tsx`. Zmiany i dodatki:
- **Pigułka etapu**: wielka cyfra (tydzień połogu albo dzień cyklu) + podpis. W trybie cyklu zamiast cyfry jest mini-pierścień fazy.
- **Karta check-inu (forest)**: po wykonaniu zmienia się w podsumowanie dnia: „Dziś: nastrój 3/5 · sen 4,5 h · energia niska” + „Edytuj”.
- **Prognoza na jutro (K4)**: wąska karta pod hero, ikona pogody rysowana kreską (nie emoji), jedno zdanie i rada.
- **Na dzisiejszy dzień**: 2 rekomendacje. Pierwsza zawsze z rankingu wsparcia z dowodem („pomogło Ci w 4 z 5 dni”), druga to cel lub ruch dopasowany do tygodnia.
- **Twoje odkrycie**: karta insightu z lawendową ikoną (wg Figmy).
- **Prawa kolumna**: Dzisiaj (cele, checkbox domyka płatek), EPDS (kiedy należny), **Słoik wygranych (K6)** (mini słoik z liczbą płatków i przycisk „+ Dodaj wygraną”), artykuł.
- **Pusty stan (pierwszy dzień)**: „Twój pierwszy check-in pokaże nam, od czego zacząć.”

### 3.4 Check-in (modal → pełny arkusz na mobile, 4 kroki)
1. **Nastrój**: 5 kafli z cyfrą w szeryfie i podpisem (wg Figmy). Kolor kafla po wyborze to odcień ze skali nastroju (1 = ciepła glina `#c98b6b`, 3 = piasek, 5 = sage). Tej samej skali używamy w Kalendarzu.
2. **Energia, lęk, sen**: dwa suwaki 1–5 z opisami na końcach („bez sił” ↔ „pełna energii”), sen jako „godziny” z dużymi przyciskami −/+ (co 0,5 h) i jakość (3 pigułki).
3. **Ciało**: ból 0–10 (rząd 11 małych kafli), krwawienie (pigułki; w połogu podpis „odchody połogowe”), objawy (pigułki). W połogu dochodzi sekcja **„Czy coś Cię niepokoi?”** z 7 objawami alarmowymi. Jeśli któryś zaznaczony, od razu pojawia się czerwono-gliniana ramka „To wymaga kontaktu z lekarzem. Zadzwoń teraz…” z przyciskami `tel:`.
4. **Emocje i notatka**: pigułki emocji (spokojna, zmęczona, przytłoczona, wdzięczna, samotna, drażliwa, czuła, niespokojna…), notatka z **mikrofonem (K7)**, checkbox „Zapisz jako pytanie na wizytę” (K3).

Sukces: „Dziękuję, że to zauważyłaś” (wg Figmy). Jeśli silnik ryzyka zwróci coś poza `none`, pod spodem pojawia się karta z odpowiednią akcją (np. „Ostatnie dni były ciężkie. Chcesz spróbować czegoś, co pomogło Ci ostatnio?”).

### 3.5 Kalendarz
- **Przełącznik** u góry: `Miesiąc | Wzorce` (segmentowany, pigułki).
- **Widok miesiąca**: duża siatka, każdy dzień ma kółko w kolorze nastroju (brak check-inu to tylko obrys). Pod cyfrą jest cienka linia: okres (glina), przewidywany okres (przerywana), dzień EPDS (lawendowa kropka), wygrana (mały płatek).
- **Połóg**: nad siatką pasek tygodni połogu 1–12 z zaznaczonym bieżącym. Kamienie milowe: „6 tyg. wizyta kontrolna”.
- **Klik w dzień**: panel boczny (desktop) lub arkusz (mobile) z podsumowaniem check-inu, celami, wygranymi i „Edytuj”.
- Przyciski: „Okres się zaczął / skończył”, a w połogu „Wróciła mi miesiączka”.

### 3.6 Wzorce (statystyki)
Edytorski raport, nie dashboard:
- Nagłówek: „Twoje ostatnie 30 dni” + przełącznik 7/30.
- **Wstęga nastroju**: wykres obszarowy jednym kolorem (forest 20%), linia nastroju i słupki snu (sage) w tle. **Adnotacje ręczne** przy ważnych punktach (najniższy dzień, pierwszy cel, EPDS). Bez siatki, oś Y tylko 1 i 5.
- **3 odkrycia** jako zdania z liczbą w szeryfie: „**+24%** lepszy nastrój po nocach z ≥6 h snu”, „**4 z 5** gorszych dni poprawił spacer”, „Najtrudniej bywa w **niedziele**”.
- **Cykl** (tryb cycle): koło faz z średnim nastrojem na każdym łuku.
- **EPDS**: oś czasu wyników z pasmami progów (bez czerwieni, tylko odcienie lawendy i gliny) i podpisem „wynik ≥13 sugeruje rozmowę ze specjalistą”.
- **Twoje strategie**: ranking z paskami skuteczności.
- CTA na dole: **„Przygotuj raport na wizytę”** (K3).

### 3.7 Cele
- Nagłówek „Małe kroki” + licznik tygodnia („12 z 18 w tym tygodniu”).
- Lista celów jako **wiersze z płatkowym wskaźnikiem**: każdy cel ma 4-płatkowy znak, który wypełnia się w miarę postępu tygodnia. Seria w szeryfie („7 dni”). Godzina przypomnienia jako mała pigułka z dzwonkiem.
- **Polecane dla Ciebie**: pozioma karuzela z uzasadnieniem („Polecane od 6. tygodnia po cesarskim cięciu, po zgodzie lekarza”).
- **Nowy cel** (arkusz): nazwa, kategoria (pigułki z ikonami), rytm („codziennie” / „N razy w tygodniu”), przypomnienie (godzina + dni tygodnia jako 7 kółek), podgląd „Przypomnimy Ci we wt., czw., sob. o 18:00”.
- Pusty stan: „Jeden mały cel wystarczy. Może szklanka wody rano?”

### 3.8 Wsparcie (hub)
Sekcje na jednej stronie:
1. **Gorszy dzień?**: duża karta forest z kulą oddechu: „Zacznij od jednego oddechu”.
2. **Twoje strategie**: ranking (K5), każda z dowodem skuteczności i czasem trwania.
3. **Twój krąg (K2)**: avatary bliskich, aktywne prośby ze statusem („Tomek wziął · czw.”), przyciski „Nowa prośba” i „Udostępnij listę”.
4. **Słoik wygranych (K6)**: większa wersja.
5. **Telefony wsparcia**: zawsze widoczne, `tel:` linki.
6. **Ankieta „Co Ci pomaga”**: „Zmieniło się coś? Zaktualizuj.”

### 3.9 Gorszy dzień (flow modalny)
1. „Jak bardzo jest ciężko?”: 5 płatków od małego do dużego. Przy 5 → ekran kryzysowy.
2. **Oddech** (wg Figmy): kula oddechu 4-7-8 lub pudełkowy, licznik 1 min, tekst zmienia się z fazą („wdech… zatrzymaj… wydech”). Można pominąć.
3. **„Co teraz może pomóc?”**: 3 najlepsze strategie (K5). Wybrana otwiera instrukcję krok po kroku z timerem.
4. Opcje dodatkowe: „Poproś o wsparcie” (gotowa wiadomość SMS/WhatsApp do osoby z kręgu), „Przypomnij mi coś dobrego” (losowa wygrana, K6).
5. Zakończenie: „Czy to pomogło?” (tak / trochę / nie) + nastrój teraz → „Dobrze, że o siebie zadbałaś. Jestem tu też jutro.”

### 3.10 Pomoc kryzysowa (`/help`, publiczna)
- Spokojne tło `--paper`, bez dekoracji. Nagłówek: „Nie jesteś z tym sama.”
- Duże przyciski telefonów: 112 (na górze, glina) i linie wsparcia (zweryfikowane numery i godziny).
- „Zadzwoń do: Tomek” (osoba z kręgu, gdy zalogowana).
- „Jeśli jesteś w niebezpieczeństwie, zadzwoń pod 112 albo jedź na najbliższy SOR.”
- Bez formularzy i bez logowania.

### 3.11 Nocna zmiana (K1)
- Motyw: tło `#1b1a17`, tekst `#f3e6d3`, akcent bursztynowy `#e0a46b`, karty `#24221e`. Mniej niebieskiego, obniżona jasność, większe fonty (+2px), przyciski min. 56px.
- Nagłówek: „3:12. Nocna zmiana.” (aktualna godzina w szeryfie).
- Linia: „**37 mam** z Otuli też teraz nie śpi.” (gdy ≥ 5).
- 4 duże przyciski: **Szybki check-in** (sam nastrój, 1 tap) · **Oddychaj ze mną** · **Nie mogę zasnąć** (body scan / technika 5-4-3-2-1) · **Zapisz myśl na rano**.
- Na dole: „Gorszy dzień” i telefon wsparcia czynny w nocy.
- Włącza się automatycznie 22:00–6:00 (do wyłączenia w Profilu) albo księżycem w topbarze. Animacje przejścia trwają 600 ms, płynnie.

### 3.12 Krąg wsparcia — strona dla bliskich (K2, publiczna `/c/<token>`)
- Bez konta, mobile-first, logo Otuli małe.
- „**Marta** będzie wdzięczna za pomoc w tych sprawach:”
- Lista próśb jako karty: tytuł, kiedy, kategoria, przycisk „Biorę to” → pole „Twoje imię” → „Dzięki, Tomek! Marta dostała wiadomość.”
- Prośby wzięte pokazują, kto je wziął. Wykonane są przekreślone z płatkiem.
- Opcjonalnie (jeśli mama włączy): „Jak Marta się dziś czuje: 🌤️ różnie” jako kolor i słowo, bez szczegółów.
- Na dole poradnik „Jak wspierać mamę po porodzie” (link do artykułu dla partnerów) oraz telefony wsparcia.
- Mama w aplikacji: tworzy prośbę (tytuł, kategoria, kiedy), widzi statusy, może unieważnić link.

### 3.13 Raport na wizytę (K3)
- Ekran z wyborem okresu (ostatnie 2 / 4 / 6 tygodni) i przełącznikami sekcji. Podgląd wygląda jak kartka A4 (szeryf, dużo bieli, logo w nagłówku).
- Sekcje: dane podstawowe (dzień połogu, rodzaj porodu, karmienie) · wykres nastroju i snu · wyniki EPDS z datami · objawy i ich częstotliwość · objawy alarmowe (jeśli były) · **Moje pytania** (z checkboxami) · zastrzeżenie „Raport z dzienniczka samoobserwacji, nie dokumentacja medyczna”.
- Przyciski: „Drukuj / zapisz PDF” (`window.print()` z `@media print`) i „Dodaj pytanie”.

### 3.14 EPDS
- Wstęp: czym jest, ile trwa (2 min), że to przesiew, a nie diagnoza, i że odpowiedzi dotyczą ostatnich 7 dni.
- Jedno pytanie na ekran, odpowiedzi jako duże wiersze, pasek z 10 płatkami.
- Wynik: bez liczby na pierwszym planie. Najpierw zdanie i rekomendowany krok, liczba mniejsza pod spodem. Ścieżki: niski („Dobrze, że sprawdzasz”), umiarkowany (wróć za 2 tygodnie + strategie), wysoki (porozmawiaj ze specjalistą + katalog + raport na wizytę), pytanie 10 → kryzys.

### 3.15 Wiedza
- Nagłówek edytorski „Wiedza bez straszenia”. Zakładki: Artykuły · Specjaliści · Telefony.
- **Artykuły**: pierwszy jako duża karta ze zdjęciem (polecany na Twój tydzień), dalej lista dwukolumnowa z kategorią, czasem czytania i miniaturą. Filtry jako pigułki.
- **Czytnik**: kolumna 680px, szeryf w nagłówku, DM Sans 17px w treści, „Źródła” na dole, przycisk „Zapisz pytanie na wizytę” przy tekście.
- **Specjaliści**: lista z filtrem (położna, fizjoterapeutka uroginekologiczna, psycholożka, psychiatra, doradczyni laktacyjna) i miasto/online, z badge „dane przykładowe”.

### 3.16 Ty / Profil
- Nagłówek z imieniem i etapem. Sekcje: Mój etap (połóg/cykl, daty) · Ankieta „co pomaga” · Krąg · Przypomnienia i powiadomienia (z „Wyślij testowe”) · Nocna zmiana (auto / wył.) · Język · Prywatność (eksport JSON, usuń konto) · O aplikacji i zastrzeżenie medyczne · Wyloguj.

### 3.17 Powiadomienia
- Arkusz z prawej (desktop) lub pełny ekran (mobile), pogrupowane „Dziś / Wcześniej”. Każde z ikoną kategorii i akcją („Zrobione”, „Otwórz”). Pusty stan: „Cisza. Czasem to najlepsza wiadomość.”

---

## 4. Skala kolorów nastroju (wspólna dla check-inu, kalendarza i wykresów)

| Nastrój | Kolor | Nazwa |
|---|---|---|
| 1 | `#c98b6b` | glina |
| 2 | `#dfb48f` | morela |
| 3 | `#e8d9b5` | piasek |
| 4 | `#bcd3c2` | szałwia jasna |
| 5 | `#7fa891` | szałwia |

Zawsze z podpisem lub cyfrą, a nie tylko kolorem (dostępność). Czerwień `#b4533c` tylko dla objawów alarmowych.
