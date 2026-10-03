# Design — Otula (z Figma Make)

Źródło: projekt Figma Make „Ohne Namen (Copy)” (link w historii zespołu). Kod i style wyciągnięte z podglądu (wersja 1):
- `figma-make/App.tsx` — oryginalny komponent (pulpit „Dzisiaj”, modal check-inu, modal „Gorszy dzień”, nawigacja, ikony, logo)
- `figma-make/styles.css` — pełne style (zwykłe CSS z klasami, bez narzędzi Tailwind)
- `screens/*.jpg` — zrzuty: desktop 1440×900 i mobile 375×812

To **referencja wizualna**, a nie kod do skopiowania 1:1. Dane w niej są zahardkodowane. Odtwarzamy wygląd w naszej strukturze (Tailwind + komponenty), a dane bierzemy z API.

## Tokeny

| Token | Wartość | Użycie |
|---|---|---|
| `--ink` | `#25342f` | tekst główny |
| `--muted` | `#718079` | tekst drugorzędny |
| `--forest` | `#3f6959` | kolor marki, główne akcje, aktywna nawigacja |
| `--forest-deep` | `#315648` | hover dla forest, aktywny tekst nawigacji |
| `--sage` | `#dfeae2` | tła ikon, aktywny element nawigacji, zaznaczenia |
| `--sage-light` | `#f1f5f0` | hover, tor paska postępu |
| `--cream` | `#f8f5ef` | tło aplikacji |
| `--paper` | `#fffdf9` | karty, sidebar, modale |
| `--line` | `#e5e7df` | obramowania |
| `--peach` | `#e9b9a0` | akcent (kropki, badge powiadomień) |
| `--peach-soft` | `#f5e1d6` | przycisk CTA na zielonym tle, ciepłe ikony |
| `--lavender` | `#ddd8e9` | statystyki i odkrycia, EPDS (tło karty `#f1eff5`) |
| ciepły brąz | `#85614f` / `#94654e` / `#684b3d` | przycisk „Gorszy dzień”, ciepłe etykiety, tekst na peach |
| `--shadow` | `0 18px 50px #374c4214` | wyróżnione karty |
| modal shadow | `0 30px 90px #192b2347` | modale |
| backdrop | `#222d287a` + `blur(5px)` | tło modala |

**Typografia**
- Nagłówki: **Newsreader** (serif), wagi 500/600. H1 `clamp(38px, 4vw, 53px)/1.06`, letter-spacing −1.2px. H2 sekcji 27px, nagłówki kart 21px.
- Tekst: **DM Sans**, wagi 400/500/600/700. Body 14–15px, opisy kart 12px.
- „Eyebrow” (nadtytuł): 11px, 700, uppercase, letter-spacing 1.5px, kolor `--forest`.
- Fonty z Google Fonts (import w `styles.css`). W aplikacji najlepiej przez `@fontsource/dm-sans` i `@fontsource/newsreader`, żeby działało offline w PWA.

**Kształty**: karty radius 20–22px, duża karta check-inu i modale 28px, przyciski 14px, pigułki 999px, kafle ikon 13–15px. Przycisk główny ma min. wysokość 46px.

**Ikony**: obrys 1.8, `round` caps i joins, 24×24 (styl lucide). Używamy `lucide-react` z `strokeWidth={1.8}`. Logo to 4 płatki (SVG w `App.tsx` → `Brand`).

**Ruch**: modal `rise` 0.3s, backdrop `fade` 0.2s, kula oddechu `breathe` 5s ease-in-out. Przy `prefers-reduced-motion` animacje wyłączamy.

## Układ (responsywny, nie tylko mobile)

- **≥ 821px**: stały sidebar 248px (logo, nawigacja, na dole „Profil” i karta „Potrzebujesz pomocy? → Telefony wsparcia”), sticky topbar 84px z rozmytym tłem (data, przycisk „Gorszy dzień”, dzwonek z kropką, awatar z inicjałami).
- **Pulpit**: siatka `1fr 320px` (max 1340px). Lewa kolumna: powitanie + pigułka etapu (tydzień połogu / dzień cyklu), zielona karta check-inu z dekoracją z płatków, „Na dzisiejszy dzień” (2 karty rekomendacji, pierwsza „Najlepsze dopasowanie” z rankingu wsparcia), karta odkrycia (insight). Prawa kolumna: „Dzisiaj” (cele z checkboxami i paskiem postępu), karta EPDS (lawendowa), karta artykułu ze zdjęciem.
- **≤ 1080px**: jedna kolumna, prawa kolumna jako siatka 3 kart.
- **≤ 820px**: brak sidebara, dolna nawigacja (70px, blur) z 4 pozycjami, logo w topbarze.
- **≤ 620px**: przycisk „Gorszy dzień” jako ikona serca 40×40, karty w 1 kolumnie, karta „Dzisiaj” na górze.

## Nawigacja (przyjęta z Figmy)

Finalna nawigacja jest opisana w `SCREENS.md` §2: sidebar **Dzisiaj · Kalendarz · Wzorce · Cele · Wsparcie · Wiedza** + Profil, mobile **Dzisiaj · Kalendarz · [+] · Cele · Wsparcie**. „Gorszy dzień” jest zawsze w topbarze.

## Wzorce do powtórzenia na pozostałych ekranach

- **Check-in** = modal (na mobile: pełnoekranowy arkusz) z krokami „1 z 4” i kropkami postępu. Kroki: 1) nastrój (5 kafli z cyfrą Newsreader i podpisem), 2) energia, lęk i sen, 3) ciało: ból, krwawienie, objawy, w połogu objawy alarmowe, 4) emocje i notatka. Na końcu stan sukcesu z ikoną w kółku sage, a jeśli trzeba, karta ryzyka.
- **Gorszy dzień** = modal wyśrodkowany: kula oddechu → eyebrow „Jestem przy Tobie” → nagłówek → „Rozpocznij 1 minutę” → link „Wybierz inną formę wsparcia”, który prowadzi do rankingu strategii.
- **Karta rekomendacji** = kafel ikony (sage lub peach) + eyebrow („Najlepsze dopasowanie” / kategoria) + tytuł Newsreader + opis + stopka (czas trwania + okrągły przycisk strzałki).
- **Puste sekcje**: wzór `Placeholder` (ikona w kafelku 70px, eyebrow, H1, opis).
- Mikrocopy: ciepły, nieoceniający, forma żeńska, „Ty” wielką literą (np. „Dziękuję, że to zauważyłaś”).

## Uwagi

- Zdjęcie artykułu pochodzi z Unsplash. Na demo trzeba je zapisać lokalnie z atrybucją albo zastąpić ilustracją.
- Mobile w Figmie ma etykiety nawigacji 9px i podpisy nastroju 7–8px. To za mało dla dostępności, u nas minimum 11px.
