# Plan pracy — Otula (deadline 4.10.2026, 23:00)

Praca **równoległa**: 9 agentów Muse w osobnych worktree i gałęziach `agent/<id>` oraz integrator (człowiek z agentem) scalający do `main`.
- Zasady współpracy: `AGENTS.md` → „Parallel work protocol”
- Prompty i podział: `docs/AGENT_PROMPTS.md`
- Status na żywo: `docs/agents/STATUS.md` (prowadzi integrator)

## Oś czasu

| Kiedy | Co |
|---|---|
| T+0 | Start wszystkich 9 agentów naraz. `platform` i `f-core` robią **checkpoint-0** (szkielet na `main`, ≤30 min). Pozostali w tym czasie piszą czystą logikę, testy, treści, typy, mocki i teksty. |
| T+0:30 | Wszyscy robią rebase na `main` z checkpoint-0 i pracują na właściwym kodzie. Front działa na mockach MSW. |
| co 30–45 min | Integrator merguje zielone gałęzie, uruchamia `make test`, `make schema`, obsługuje prośby z `docs/agents/requests/`. |
| ~T+8h | Backend kompletny. Front przełącza się z mocków na prawdziwe API (`VITE_USE_MOCKS=false`). |
| ~T+12h | Wszystkie ekrany są zmergowane. QA, dane demo, `make seed`. |
| do 18:00 | Szlif designu, E2E, poprawki, zrzuty ekranów. Opcjonalnie AI. |
| 18:00–21:30 | Prezentacja (10 slajdów PDF), opis, film demo. |
| **do 22:30** | Wysyłka na platformę (bufor 30 min). |

## Ludzie
- **Integrator**: merge, odblokowywanie agentów, decyzje o zakresie. Gdy agent się zapętli, zawęź mu zadanie.
- **Treści i bezpieczeństwo**: weryfikacja numerów pomocowych (`verify: true`), polska wersja EPDS, przegląd tekstów (czy brzmią po ludzku).
- **Pitch**: prezentacja, scenariusz demo (2–3 min), nagranie.

## Kolejność cięcia zakresu (gdy zabraknie czasu)
1. AI (W7) → 2. check-in głosem → 3. prognoza → 4. specjaliści → 5. powiadomienia push (zostają w aplikacji) → 6. tryb cyklu (demo tylko połogu).
**Nie tniemy**: Dzisiaj, check-in, Gorszy dzień, /help, Krąg z linkiem publicznym, Nocna zmiana, Raport na wizytę, EPDS.

## Prezentacja (maks. 10 slajdów)
1. Tytuł, zespół, hasło („Otula — troska o mamę, nie tylko o dziecko”)
2. Problem: depresja poporodowa (10–20%), luka po 6. tygodniu, samotność
3. Persony: Marta (połóg) i Kasia (cykl)
4. Rozwiązanie: codzienny check-in, Gorszy dzień, cele, wiedza
5. Innowacja: Nocna zmiana, Krąg z listą próśb, Raport na wizytę, adaptacyjny zestaw wsparcia
6. Bezpieczeństwo: EPDS, silnik ryzyka, objawy alarmowe, ścieżka kryzysowa
7. Demo: zrzuty ekranów
8. Architektura: Django, React, Postgres, Celery, PWA push, Docker, RODO (szyfrowanie, eksport, usunięcie konta)
9. Wpływ i wdrożenie: położne, POZ, fundacje, NFZ; dalsze kroki
10. Ujawnienie zasobów (Muse Code, AI, biblioteki, EPDS) i podziękowania
