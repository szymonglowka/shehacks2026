import { http, HttpResponse } from 'msw';

const API = '*/api/v1';

const STRATEGIES = [
  { code: 'breath_478', name: 'Oddech 4-7-8', description: 'Minuta spokojnego oddechu, kiedy wszystko naraz.', category: 'breathing', duration_min: 1, icon: 'wind' },
  { code: 'short_walk', name: 'Krótki spacer', description: 'Pięć minut powietrza, we własnym tempie.', category: 'movement', duration_min: 10, icon: 'footprints' },
  { code: 'ask_partner', name: 'Poproś o przejęcie', description: 'Jedna konkretna prośba do bliskiej osoby.', category: 'social', duration_min: 5, icon: 'heart-handshake' },
  { code: 'tea_pause', name: 'Ciepły napój bez telefonu', description: 'Dziesięć minut tylko dla siebie.', category: 'rest', duration_min: 10, icon: 'coffee' },
  { code: 'grounding_54321', name: 'Uziemienie 5-4-3-2-1', description: 'Wróć do tu i teraz przez zmysły.', category: 'mindfulness', duration_min: 5, icon: 'anchor' },
  { code: 'shower_reset', name: 'Prysznic reset', description: 'Ciepła woda i trzy głębokie oddechy.', category: 'sensory', duration_min: 10, icon: 'shower-head' },
  { code: 'call_friend', name: 'Telefon do bliskiej osoby', description: 'Nie musisz być dzielna. Opowiedz, jak jest.', category: 'social', duration_min: 15, icon: 'phone' },
  { code: 'journal_line', name: 'Jedno zdanie do dziennika', description: 'Zapisz, co dziś czujesz. Bez oceniania.', category: 'creative', duration_min: 3, icon: 'pen-line' },
];

const WORSENING = [
  'lack_of_sleep',
  'loneliness',
  'pain',
  'pressure',
  'comparison',
  'mess',
  'no_time_for_self',
  'screens',
  'hunger',
];

const GOAL_TEMPLATES = [
  { id: 1, title: 'Krótki spacer', description: 'Wyjdź na 5–15 minut, w swoim tempie.', category: 'movement', frequency: 'daily', target_count: 1, safety_note: 'Po cesarskim cięciu — po zgodzie lekarza.' },
  { id: 2, title: 'Szklanka wody rano', description: 'Zacznij dzień od nawodnienia.', category: 'nutrition', frequency: 'daily', target_count: 1, safety_note: null },
  { id: 3, title: 'Chwila dla siebie', description: 'Minimum 10 minut bez obowiązków.', category: 'selfcare', frequency: 'daily', target_count: 1, safety_note: null },
  { id: 4, title: 'Połóż się, gdy maluch śpi', description: 'Choć raz dziennie odpocznij razem z dzieckiem.', category: 'rest', frequency: 'daily', target_count: 1, safety_note: null },
];

export const handlers = [
  http.get(`${API}/onboarding/options`, () => {
    return HttpResponse.json({
      coping_strategies: STRATEGIES,
      worsening_factors: WORSENING,
      goal_templates: GOAL_TEMPLATES,
    });
  }),

  http.post(`${API}/onboarding/complete`, async () => {
    return HttpResponse.json({ ok: true }, { status: 201 });
  }),
];
