# Otula — specyfikacja produktu (ImpactHer @ HackYeah 2026)

> Nazwa robocza: **Otula** (od „otulić”). Do zmiany po projekcie w Figmie.
> Stack: Django 5 + DRF · React (Vite + TS) · PostgreSQL 16 · Redis + Celery · Docker Compose · PWA (web push).

## 1. Problem i propozycja wartości

- Ok. 10–20% kobiet po porodzie doświadcza depresji poporodowej, a duża część przypadków nie jest rozpoznawana. Wiele kobiet nie wie, czy to jeszcze „baby blues”, czy coś, z czym trzeba iść do specjalisty.
- Opieka po porodzie skupia się na dziecku, a matka po 6-tygodniowej wizycie kontrolnej zostaje sama z regeneracją ciała i psychiki.
- Aplikacje cyklowe (Flo, Clue) liczą dni, ale nie **wspierają w gorszym momencie** i nie uczą się, co danej osobie realnie pomaga.

**Otula** to towarzyszka dobrostanu dla kobiet w połogu i kobiet śledzących cykl:
1. codzienny, 30-sekundowy check-in samopoczucia,
2. śledzenie połogu → płynne przejście do śledzenia cyklu, gdy wróci miesiączka,
3. własne cele i przypomnienia push (z rekomendacjami dopasowanymi do tygodnia połogu),
4. **tryb „Gorszy dzień”**, który uczy się, co pomaga właśnie Tobie,
5. wczesne wykrywanie ryzyka (EPDS + sygnały z check-inów + objawy alarmowe po porodzie) i jasna ścieżka do pomocy.

## 2. Wyróżniki (Idea & Innovation, 30%)

| # | Wyróżnik | Na czym polega |
|---|---|---|
| W1 | **Adaptacyjny zestaw wsparcia** | Onboarding pyta „co Ci pomaga, gdy jest ciężko?”. Po każdym użyciu strategii pytamy „czy pomogło?”. Ranking strategii aktualizuje się (wynik bayesowski: preferencja z ankiety + historia skuteczności). |
| W2 | **Przesiew EPDS** | Edynburska Skala Depresji Poporodowej (zwalidowana, 10 pytań) co 14 dni w trybie połogu, trend na wykresie, progi ryzyka. Pytanie 10 (samookaleczenie) natychmiast pokazuje ekran pomocy. |
| W3 | **Krąg wsparcia** | Zaufana osoba (partner/partnerka, mama, przyjaciółka). Przycisk „Poproś o wsparcie” tworzy gotową, konkretną wiadomość SMS/WhatsApp (np. „Możesz dziś przejąć wieczorne karmienie?”). Bez backendu wysyłkowego: link `sms:`/`https://wa.me/`. |
| W4 | **Plan „czwartego trymestru”** | Rekomendowane cele i artykuły zależne od tygodnia po porodzie i rodzaju porodu (np. po cesarskim cięciu inne ćwiczenia). |
| W5 | **Wykrywanie zależności** | Automatyczne karty: „W dni, gdy śpisz >6 h, Twój nastrój jest średnio o 1,2 pkt wyższy”, „Nastrój spada w fazie lutealnej”, „Dni z wykonanym celem = lepszy nastrój”. |
| W6 | **Objawy alarmowe po porodzie** | Check-in w połogu zawiera listę objawów alarmowych (wg schematu POST-BIRTH). Zaznaczenie któregoś → komunikat „skontaktuj się z lekarzem / 112”. |
| W7 | (opcjonalnie) **Podsumowanie AI** | Cotygodniowe, ciepłe podsumowanie. Działa w trybie bez klucza API (szablony), a z kluczem przez LLM. Ostatnie zadanie. |

## 3. Persony i tryby

- **Tryb `postpartum`** — Ania, 4 tydzień po cesarskim cięciu, karmi piersią, mało śpi, nie wie, czy jej smutek jest „normalny”.
- **Tryb `cycle`** — Kasia, 29 lat, chce zrozumieć wahania nastroju w cyklu i zadbać o siebie.
- Przejście: w trybie połogu przełącznik „Wróciła mi miesiączka” → zapis pierwszego okresu → tryb `cycle` (historia i EPDS zostają).

## 4. Ekrany (wszystkie w prototypie)

Nawigacja dolna: **Start · Check-in · Cele · Wiedza · Profil** oraz pływający przycisk **„Gorszy dzień” (serce)**, widoczny zawsze.

1. **Powitanie / logowanie / rejestracja** (e-mail i hasło).
2. **Onboarding** (wieloetapowy, z paskiem postępu, można pominąć kroki opcjonalne):
   1. język (PL/EN), imię,
   2. tryb: „Jestem po porodzie” / „Śledzę cykl”,
   3. połóg: data porodu, rodzaj porodu (naturalny/cesarskie cięcie/wolę nie mówić), karmienie (piersią/mieszane/butelką/nie dotyczy). Cykl: data ostatniej miesiączki, średnia długość cyklu i okresu,
   4. **„Co Ci pomaga, gdy jest ciężej?”**: siatka kart strategii, każda oceniana skalą 0–3 (nie dla mnie → bardzo pomaga),
   5. „Co pogarsza Twoje samopoczucie?” (brak snu, samotność, ból, presja, ekrany, głód…),
   6. krąg wsparcia: zaufana osoba (opcjonalnie),
   7. ton komunikatów: łagodny / motywujący,
   8. cele: propozycje dopasowane do trybu i tygodnia oraz „dodaj własny”,
   9. przypomnienia: godzina check-inu i zgoda na push.
3. **Start (dashboard)**: powitanie zależne od pory dnia, karta statusu (np. „Dzień 26 po porodzie · tydzień 4” albo pierścień cyklu „Dzień 18 · faza lutealna · okres za ~10 dni”), stan dzisiejszego check-inu, dzisiejsze cele z checkboxami, karta zależności, karta „EPDS do wypełnienia” (gdy należy), artykuł dnia.
4. **Check-in** (≤30 s): nastrój (5 emotek), energia, lęk, sen (godziny i jakość), ból 0–10, emocje (tagi), krwawienie (brak/plamienie/lekkie/średnie/obfite; w połogu opisane jako odchody), objawy (tagi), notatka. W trybie połogu dodatkowo sekcja „Objawy alarmowe”. Po zapisie: podziękowanie i, jeśli trzeba, karta ryzyka.
5. **Kalendarz / cykl**: widok miesiąca z kolorami nastroju i dniami okresu, dodawanie/edycja okresu, przewidywanie. W połogu: oś tygodni połogu.
6. **Statystyki / zależności**: wykresy (nastrój, sen, energia 7/30 dni), nastrój w fazach cyklu, historia EPDS, karty zależności, serie celów.
7. **Cele**: lista z seriami, dodawanie/edycja (tytuł, kategoria, częstotliwość dzienna/tygodniowa N×, przypomnienie: godzina i dni), sekcja „Polecane dla Ciebie”.
8. **Gorszy dzień** (SOS):
   1. „Jak bardzo jest ciężko?” (1–5) → przy 5 od razu pomoc kryzysowa,
   2. ćwiczenie oddechowe 4-7-8 lub „pudełkowe” z animacją (zawsze pierwsze, 1 min, można pominąć),
   3. **Twoje strategie** (ranking W1) z instrukcją krok po kroku,
   4. „Poproś o wsparcie” (W3),
   5. telefony zaufania,
   6. po zakończeniu: „Czy pomogło?” (tak / trochę / nie) i nastrój po.
9. **Ekran kryzysowy**: 112, numery kryzysowe, zaufana osoba jednym tapnięciem, komunikat „Nie jesteś sama”. Pokazywany przy EPDS q10 ≥ 1 lub „5/5” w Gorszym dniu.
10. **EPDS**: 10 pytań, po jednym na ekranie, wynik z interpretacją bez diagnozowania i z rekomendowanymi krokami.
11. **Wiedza** (osobna zakładka): podzakładki *Artykuły* (filtr kategorii, dopasowane do trybu i tygodnia), *Specjaliści* (katalog: położne, fizjoterapeutki uroginekologiczne, psycholożki, psychiatrzy, doradczynie laktacyjne; filtr miasto/online), *Telefony pomocowe*.
12. **Powiadomienia** (lista w aplikacji).
13. **Profil / ustawienia**: język, tryb (z przełączeniem), dane połogu i cyklu, ponowne wypełnienie ankiety „co pomaga”, krąg wsparcia, przypomnienia, eksport danych (JSON), usunięcie konta, wylogowanie.

## 5. Model danych (PostgreSQL)

> `*_pl` / `*_en` = treści dwujęzyczne w bazie. UI tłumaczone w i18next.

**accounts**
- `User` (custom, login e-mailem): `email`, `password`, `date_joined`
- `Profile` (1:1): `display_name`, `language` (pl|en), `mode` (postpartum|cycle), `birth_date` (data porodu, null), `delivery_type` (vaginal|cesarean|undisclosed), `feeding` (breast|mixed|formula|na), `period_returned` (bool), `avg_cycle_length` (28), `avg_period_length` (5), `tone` (gentle|motivating), `checkin_reminder_time` (time, null), `timezone` (Europe/Warsaw), `onboarding_completed` (bool), `worsening_factors` (ArrayField[str])

**support**
- `CopingStrategy` (katalog, seed ~16): `code`, `name_pl/en`, `description_pl/en`, `steps_pl/en` (JSON list), `category` (breathing|movement|social|sensory|rest|creative|mindfulness|practical), `duration_min`, `icon`
- `UserCopingPreference`: `user`, `strategy`, `survey_score` (0–3), `used_count`, `helped_score_sum` (tak=1, trochę=0.5, nie=0). Unikalne (user, strategy)
  - **ranking** = `(survey_score/3 * 2 + helped_score_sum) / (2 + used_count)`, czyli średnia bayesowska z priorem z ankiety (waga 2 obserwacji). Strategie z `survey_score=0` i `used_count=0` na końcu.
- `SupportSession`: `user`, `started_at`, `ended_at`, `intensity` (1–5), `trigger` (manual|low_mood|epds|checkin_risk), `strategy` (FK null), `helped` (yes|somewhat|no|null), `mood_after` (1–5 null)
- `TrustedContact`: `user`, `name`, `relation`, `phone`, `preferred_channel` (sms|whatsapp), `default_message`
- `Helpline` (seed): `name`, `phone`, `hours_pl/en`, `description_pl/en`, `is_emergency`, `order`

**tracking**
- `DailyCheckIn`: `user`, `date` (unikalne z user), `mood` 1–5, `energy` 1–5, `anxiety` 1–5, `sleep_hours` (decimal 0–24), `sleep_quality` 1–5, `pain` 0–10, `emotions` (Array), `bleeding` (none|spotting|light|medium|heavy), `symptoms` (Array), `red_flags` (Array), `note` (**szyfrowane** Fernetem), `created_at`, `updated_at`
- `Period`: `user`, `start_date`, `end_date` (null)
- `EPDSAssessment`: `user`, `answers` (Array[int] ×10, 0–3), `total`, `self_harm_score` (q10), `risk_level` (low|moderate|high|urgent), `created_at`

**goals**
- `GoalTemplate` (seed ~25): `title_pl/en`, `description_pl/en`, `category` (movement|rest|nutrition|mind|social|recovery|selfcare), `mode` (postpartum|cycle|both), `min_week`, `max_week` (tydzień połogu, null), `delivery_types` (Array, puste = wszystkie), `frequency` (daily|weekly), `target_count`, `default_reminder_time`, `safety_note_pl/en`
- `Goal`: `user`, `template` (FK null), `title`, `description`, `category`, `frequency`, `target_count` (np. 3× w tygodniu), `reminder_enabled`, `reminder_time`, `reminder_weekdays` (Array[0–6]), `is_active`, `created_at`
- `GoalLog`: `goal`, `date`, `completed` (bool), unikalne (goal, date)

**notifications**
- `PushSubscription`: `user`, `endpoint` (unikalny), `p256dh`, `auth`, `created_at`
- `Notification`: `user`, `kind` (goal_reminder|checkin_reminder|epds_due|gentle_nudge|system), `title`, `body`, `url`, `created_at`, `sent_at`, `read_at`

**content**
- `Article`: `slug`, `title_pl/en`, `summary_pl/en`, `body_pl/en` (markdown), `category` (postpartum_recovery|mental_health|cycle|movement|sleep|nutrition|relationships|breastfeeding), `mode` (postpartum|cycle|both), `min_week`, `max_week`, `reading_minutes`, `cover_emoji`
- `Specialist` (seed, **przykładowe dane, oznaczone w UI**): `name`, `specialty`, `city`, `online`, `phone`, `website`, `description_pl/en`

## 6. Logika domenowa

### 6.1 Status trybu (`GET /cycle/status`)
- **postpartum**: `days_since_birth`, `postpartum_week` (1-indeksowany), etap: `early` (0–14 dni, okno „baby blues”), `recovery` (15–42), `beyond` (>42).
- **cycle**: na podstawie ostatniego `Period` i średnich (średnia z ostatnich 6 cykli, gdy ≥2 okresy, w przeciwnym razie `avg_cycle_length` z profilu): `cycle_day`, `phase` (menstrual: dni 1..period_len; follicular: do owulacji−1; ovulation: owulacja ±1, owulacja = cycle_len−14; luteal: reszta), `next_period_date`, `confidence` (low|medium|high wg liczby okresów). **Bez okna płodnego / antykoncepcji** (zastrzeżenie w UI).

### 6.2 Silnik ryzyka (`tracking/risk.py`, czyste funkcje i testy)
Wynik: `{level: none|info|moderate|high|urgent, reasons: [code], actions: [code]}`. Wywoływany po zapisie check-inu i EPDS, zwracany w odpowiedzi.

| Reguła | Warunek | Poziom | Akcje |
|---|---|---|---|
| R1 | EPDS q10 ≥ 1 | urgent | `show_crisis` |
| R2 | czerwona flaga w check-inie (`red_flags` niepuste) | urgent | `contact_doctor_now`, `show_emergency` |
| R3 | EPDS total ≥ 13 | high | `contact_specialist`, `show_specialists`, `ask_support` |
| R4 | EPDS 10–12 | moderate | `repeat_epds_14d`, `open_toolkit` |
| R5 | nastrój ≤ 2 w ≥3 z ostatnich 4 check-inów | moderate | `open_toolkit`, `ask_support`, `suggest_epds` |
| R6 | R5 i tryb postpartum i dzień ≤ 14 | info (+R5) | `read_baby_blues` |
| R7 | R5 i postpartum i dzień > 14 | moderate | `read_ppd`, `suggest_epds` |
| R8 | lęk ≥ 4 dziś | info | `open_breathing` |

Czerwone flagi po porodzie (kody): `heavy_bleeding` (podpaska przesiąka w ≤1 h), `fever` (≥38°C), `severe_headache_vision`, `chest_pain_breathing`, `leg_swelling_pain`, `wound_redness_discharge`, `thoughts_of_harm`.

### 6.3 EPDS
- 10 pytań, odpowiedzi 0–3 (pytania 1, 2, 4 punktowane normalnie, 3, 5–10 odwrotnie, czyli kolejność opcji w treści). Treść PL/EN w `tracking/epds_data.py` z cytowaniem: *Cox, J.L., Holden, J.M., Sagovsky, R. (1987). British Journal of Psychiatry, 150, 782–786.* Weryfikujemy polską wersję językową.
- „Należne”: tryb postpartum i (brak EPDS lub ostatni ≥14 dni temu). W trybie cycle tylko na żądanie.
- UI nigdy nie mówi „masz depresję”, tylko „Twój wynik sugeruje, że warto porozmawiać ze specjalistą”.

### 6.4 Zależności (`insights/engine.py`)
Okno 30 dni, wymagane ≥7 punktów danych na kartę. Karty zwracane jako `{code, params, strength}` (tekst tłumaczy frontend):
- `sleep_mood`: średni nastrój dla sleep_hours ≥ 6 vs < 6 (różnica ≥ 0,5),
- `goals_mood`: nastrój w dni z ≥1 wykonanym celem vs bez,
- `phase_mood`: średni nastrój per faza cyklu (tryb cycle, ≥1 pełny cykl),
- `trend`: nastrój ostatnie 7 dni vs poprzednie 7,
- `streak`: najdłuższa aktualna seria check-inów lub celu,
- `toolkit_top`: strategia, która najczęściej pomagała.

### 6.5 Przypomnienia (Celery beat co 1 min)
- `send_due_goal_reminders`: aktywne cele z `reminder_enabled`, `reminder_time` = teraz (w strefie użytkownika, okno ±1 min), dzień tygodnia pasuje, brak `GoalLog.completed` na dziś → `Notification` + web push.
- `send_checkin_reminders`: brak check-inu na dziś o `checkin_reminder_time`.
- `send_epds_due` (codziennie 10:00): tryb postpartum i EPDS należne.
- `gentle_nudge`: po R5, raz na 48 h, treść w tonie z profilu.
- Web push przez `pywebpush` i klucze VAPID z `.env`. Wygasłe subskrypcje (404/410) usuwamy.
- Demo: `POST /push/test` wysyła testowe powiadomienie natychmiast.

## 7. Kontrakt API (`/api/v1`, JSON, JWT `Authorization: Bearer`)

Konwencje: snake_case, daty ISO (`YYYY-MM-DD`), paginacja tylko tam, gdzie zaznaczono (`?page=`), błędy `{"detail": "...", "errors": {field: [..]}}`. Język treści: nagłówek `Accept-Language: pl|en` (fallback: profil).

| Metoda | Ścieżka | Opis |
|---|---|---|
| POST | `/auth/register` | `{email, password, display_name, language}` → `{access, refresh, user}` |
| POST | `/auth/login` | `{email, password}` → `{access, refresh}` |
| POST | `/auth/refresh` | `{refresh}` → `{access}` |
| GET/PATCH | `/me` | `{id, email, profile:{...}}` |
| DELETE | `/me` | usuwa konto i wszystkie dane |
| GET | `/me/export` | pełny eksport JSON |
| GET | `/onboarding/options` | `{coping_strategies:[...], worsening_factors:[...], goal_templates:[...] }` (filtrowane po trybie, przekazanym w query `?mode=&week=&delivery_type=`) |
| POST | `/onboarding/complete` | `{profile:{...}, coping_scores:{code:0-3}, worsening_factors:[], trusted_contact?:{...}, goal_template_ids:[], custom_goals:[...]}` |
| GET | `/dashboard` | `{status, today_checkin, today_goals, insight, epds_due, article_of_day, unread_notifications}` |
| GET | `/checkins?from=&to=` | lista |
| GET/PUT | `/checkins/{date}` | upsert dnia → `{checkin, risk}` |
| GET | `/cycle/status` | patrz 6.1 |
| GET/POST | `/periods` | |
| PATCH/DELETE | `/periods/{id}` | |
| POST | `/profile/period-returned` | `{start_date}` → przełącza tryb na cycle |
| GET | `/epds/questions` | pytania w języku |
| GET/POST | `/epds` | historia / `{answers:[10]}` → `{assessment, risk}` |
| GET | `/epds/due` | `{due: bool, last_at}` |
| GET | `/support/toolkit` | strategie posortowane rankingiem z `score` |
| POST | `/support/sessions` | `{intensity, trigger}` → sesja (+ `risk` jeśli intensity=5) |
| PATCH | `/support/sessions/{id}` | `{strategy, helped, mood_after}` → aktualizacja rankingu |
| PUT | `/support/preferences` | `{coping_scores:{...}}` (ponowna ankieta) |
| CRUD | `/support/contacts` | zaufane osoby |
| GET | `/support/contacts/{id}/message` | `{text, sms_url, whatsapp_url}` |
| GET | `/support/helplines` | |
| CRUD | `/goals` | + pola wyliczane `current_streak`, `done_today`, `progress_this_week` |
| GET | `/goals/recommended` | szablony dopasowane do profilu, bez już dodanych |
| POST | `/goals/{id}/log` | `{date, completed}` |
| GET | `/goals/today` | |
| GET | `/push/vapid-public-key` | |
| POST/DELETE | `/push/subscriptions` | `{endpoint, keys:{p256dh, auth}}` |
| POST | `/push/test` | |
| GET | `/notifications` | (paginacja) |
| POST | `/notifications/{id}/read`, `/notifications/read-all` | |
| GET | `/insights?range=7|30` | `{series:[{date,mood,energy,anxiety,sleep_hours}], phase_mood, epds_history, cards:[...], streaks}` |
| GET | `/articles?category=&mode=` | (paginacja) |
| GET | `/articles/{slug}` | |
| GET | `/specialists?specialty=&city=&online=` | |
| POST | `/ai/weekly-summary` | (opcjonalne) `{text, source: "llm"|"template"}` |

OpenAPI generowane przez `drf-spectacular` pod `/api/schema/` i `/api/docs/`. Frontend generuje typy z `openapi-typescript`.

## 8. Wymagania niefunkcjonalne

- **Prywatność (RODO, dane szczególnej kategorii)**: szyfrowanie notatek (Fernet, klucz w `.env`), eksport i usunięcie konta, minimalizacja danych, brak zewnętrznych trackerów, dane tylko lokalnie. Ekran zgody przy rejestracji: dane zdrowotne przetwarzane w celu działania aplikacji.
- **Bezpieczeństwo treści**: aplikacja nie jest wyrobem medycznym, stały disclaimer w stopce ustawień i przy EPDS. Ćwiczenia fizyczne w połogu z dopiskiem „po konsultacji z lekarzem / fizjoterapeutką”. Ekrany kryzysowe nigdy nie są za paywallem ani za logowaniem: `/help` jest publiczne.
- **Dostępność**: kontrast WCAG AA, obsługa klawiatury, `prefers-reduced-motion` dla animacji oddechu, duże pola dotykowe (≥44 px). Projekt pod jedną rękę (karmienie!), mobile-first i działa na desktopie.
- **i18n**: PL (domyślnie) i EN, `react-i18next`. Brak hardcodowanych tekstów w komponentach.
- **Wydajność**: dashboard w 1 zapytaniu, indeksy na `(user, date)`.

## 9. Dane demo

`python manage.py seed_demo` tworzy:
- konto `demo@otula.app` (hasło wyłącznie w `.env.example` / README),
- tryb postpartum, poród 38 dni temu, cesarskie cięcie, karmienie piersią,
- 6 tygodni check-inów z realistycznym przebiegiem (dołek w 2.–3. tygodniu, poprawa po wprowadzeniu spacerów i snu), 3 EPDS (14 → 11 → 8), 5 celów z historią, 6 sesji „Gorszy dzień” z feedbackiem (ranking ma się przesunąć),
- drugie konto `demo-cycle@otula.app` z 4 cyklami.

## 10. Poza zakresem (MVP)

Natywne aplikacje mobilne, śledzenie dziecka, czat z ludźmi, telekonsultacje, prawdziwy katalog specjalistów, integracje z zegarkami, okno płodne.

## 11. Ujawnienie zasobów (wymóg regulaminu)

Lista w README: użyte narzędzia AI (Muse Code / Claude Code), biblioteki open-source, EPDS (Cox i in., 1987), źródła treści artykułów. Praca rozpoczęta po 3.10.2026 23:00. Te dokumenty planistyczne powstały wcześniej jako koncepcja.
