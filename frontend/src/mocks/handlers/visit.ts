import { http, HttpResponse } from "msw";

interface VisitQuestion {
  id: number;
  text: string;
  done: boolean;
  created_at: string;
}

let questions: VisitQuestion[] = [
  {
    id: 1,
    text: "Czy moje krwawienie w 6. tygodniu jest jeszcze w normie?",
    done: false,
    created_at: "2026-05-10T09:12:00",
  },
  {
    id: 2,
    text: "Kiedy mogę wrócić do ćwiczeń po cesarskim cięciu?",
    done: false,
    created_at: "2026-05-11T18:40:00",
  },
  {
    id: 3,
    text: "Sen — budzę się co godzinę, czy to wpływa na mleko?",
    done: true,
    created_at: "2026-05-06T08:05:00",
  },
];

let nextId = 4;

const mood_sleep_series = [
  { date: "2026-04-30", mood: 2, sleep_hours: 3.5 },
  { date: "2026-05-01", mood: 2, sleep_hours: 4.0 },
  { date: "2026-05-02", mood: 3, sleep_hours: 5.0 },
  { date: "2026-05-03", mood: 2, sleep_hours: 3.0 },
  { date: "2026-05-04", mood: 3, sleep_hours: 5.5 },
  { date: "2026-05-05", mood: 3, sleep_hours: 6.0 },
  { date: "2026-05-06", mood: 4, sleep_hours: 6.5 },
  { date: "2026-05-07", mood: 3, sleep_hours: 5.0 },
  { date: "2026-05-08", mood: 4, sleep_hours: 6.0 },
  { date: "2026-05-09", mood: 3, sleep_hours: 4.5 },
  { date: "2026-05-10", mood: 4, sleep_hours: 6.5 },
  { date: "2026-05-11", mood: 4, sleep_hours: 7.0 },
  { date: "2026-05-12", mood: 3, sleep_hours: 5.5 },
  { date: "2026-05-13", mood: 4, sleep_hours: 6.0 },
];

async function body<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}

export const handlers = [
  http.get("/api/v1/visit-questions", () => HttpResponse.json(questions)),
  http.post("/api/v1/visit-questions", async ({ request }) => {
    const { text } = await body<{ text: string }>(request);
    const q: VisitQuestion = {
      id: nextId++,
      text,
      done: false,
      created_at: new Date().toISOString(),
    };
    questions.push(q);
    return HttpResponse.json(q, { status: 201 });
  }),
  http.patch("/api/v1/visit-questions/:id", async ({ params, request }) => {
    const q = questions.find((x) => x.id === Number(params.id));
    if (!q) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    Object.assign(q, await body<Partial<VisitQuestion>>(request));
    return HttpResponse.json(q);
  }),
  http.delete("/api/v1/visit-questions/:id", ({ params }) => {
    questions = questions.filter((x) => x.id !== Number(params.id));
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("/api/v1/reports/visit", ({ request }) => {
    const url = new URL(request.url);
    const weeks = Number(url.searchParams.get("weeks") ?? "4");
    return HttpResponse.json({
      profile: {
        display_name: "Marta",
        mode: "postpartum",
        postpartum_day: 39,
        postpartum_week: 6,
        delivery_type: "cesarean",
        feeding: "breast",
      },
      weeks,
      range: { from: "2026-04-16", to: "2026-05-14" },
      mood_sleep_series,
      epds_history: [
        { date: "2026-04-18", total: 14 },
        { date: "2026-05-02", total: 11 },
        { date: "2026-05-12", total: 8 },
      ],
      symptom_frequency: [
        { code: "back_pain", count: 6 },
        { code: "headache", count: 3 },
        { code: "breast_pain", count: 4 },
        { code: "fatigue", count: 9 },
      ],
      red_flags: [],
      questions,
    });
  }),
];
