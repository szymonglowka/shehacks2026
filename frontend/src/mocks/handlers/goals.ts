import { http, HttpResponse } from "msw";

export interface MockGoal {
  id: number;
  title: string;
  description: string;
  category: string;
  frequency: "daily" | "weekly";
  target_count: number;
  reminder_enabled: boolean;
  reminder_time: string | null;
  reminder_weekdays: number[];
  is_active: boolean;
  current_streak: number;
  done_today: boolean;
  progress_this_week: boolean[];
}

let goals: MockGoal[] = [
  {
    id: 1,
    title: "Szklanka wody rano",
    description: "Zanim kawa zdąży wystygnąć.",
    category: "nutrition",
    frequency: "daily",
    target_count: 1,
    reminder_enabled: true,
    reminder_time: "08:00",
    reminder_weekdays: [0, 1, 2, 3, 4, 5, 6],
    is_active: true,
    current_streak: 12,
    done_today: true,
    progress_this_week: [true, true, true, true, false, false, false],
  },
  {
    id: 2,
    title: "Krótki spacer",
    description: "5–15 minut, w Twoim tempie. Po zgodzie lekarza.",
    category: "movement",
    frequency: "weekly",
    target_count: 3,
    reminder_enabled: true,
    reminder_time: "11:30",
    reminder_weekdays: [1, 3, 5],
    is_active: true,
    current_streak: 4,
    done_today: false,
    progress_this_week: [true, false, true, false, false, false, false],
  },
  {
    id: 3,
    title: "Chwila dla siebie",
    description: "Minimum 10 minut bez telefonu.",
    category: "selfcare",
    frequency: "daily",
    target_count: 1,
    reminder_enabled: true,
    reminder_time: "20:00",
    reminder_weekdays: [0, 1, 2, 3, 4, 5, 6],
    is_active: true,
    current_streak: 6,
    done_today: false,
    progress_this_week: [true, true, false, true, false, false, false],
  },
  {
    id: 4,
    title: "Codzienny check-in",
    description: "30 sekund dla siebie.",
    category: "mind",
    frequency: "daily",
    target_count: 1,
    reminder_enabled: true,
    reminder_time: "09:00",
    reminder_weekdays: [0, 1, 2, 3, 4, 5, 6],
    is_active: true,
    current_streak: 9,
    done_today: false,
    progress_this_week: [true, true, true, false, false, false, false],
  },
  {
    id: 5,
    title: "Ćwiczenia dna miednicy",
    description: "Delikatnie, po konsultacji z fizjoterapeutką.",
    category: "recovery",
    frequency: "weekly",
    target_count: 2,
    reminder_enabled: false,
    reminder_time: null,
    reminder_weekdays: [],
    is_active: true,
    current_streak: 2,
    done_today: false,
    progress_this_week: [true, false, false, false, false, false, false],
  },
];

let nextId = 6;

const recommended = [
  {
    id: 101,
    title: "Wietrzenie głowy przy oknie",
    description: "2 minuty świeżego powietrza, gdy spacer to za dużo.",
    category: "rest",
    frequency: "daily",
    target_count: 1,
    default_reminder_time: "15:00",
    safety_note: null,
    reason: "Polecane w 6. tygodniu połogu — małe, a robi różnicę.",
  },
  {
    id: 102,
    title: "Telefon do bliskiej osoby",
    description: "Krótka rozmowa zamiast scrollowania.",
    category: "social",
    frequency: "weekly",
    target_count: 2,
    default_reminder_time: "17:00",
    safety_note: null,
    reason: "Dobra na dni, gdy dopada Cię samotność.",
  },
  {
    id: 103,
    title: "Rozciąganie karku i barków",
    description: "5 minut po karmieniu. Delikatnie, bez spinania brzucha.",
    category: "recovery",
    frequency: "daily",
    target_count: 1,
    default_reminder_time: "13:00",
    safety_note: "Po cesarskim cięciu — dopiero po zgodzie lekarza.",
    reason: "Polecane po cesarskim cięciu, po zgodzie lekarza.",
  },
];

async function body<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}

export const handlers = [
  http.get("/api/v1/goals/today", () => HttpResponse.json(goals.filter((g) => g.is_active))),
  http.get("/api/v1/goals/recommended", () => HttpResponse.json(recommended)),
  http.get("/api/v1/goals", () => HttpResponse.json(goals.filter((g) => g.is_active))),

  http.post("/api/v1/goals", async ({ request }) => {
    const values = await body<Partial<MockGoal>>(request);
    const goal: MockGoal = {
      id: nextId++,
      title: values.title ?? "Nowy cel",
      description: values.description ?? "",
      category: values.category ?? "selfcare",
      frequency: values.frequency ?? "daily",
      target_count: values.target_count ?? 1,
      reminder_enabled: values.reminder_enabled ?? false,
      reminder_time: values.reminder_time ?? null,
      reminder_weekdays: values.reminder_weekdays ?? [],
      is_active: true,
      current_streak: 0,
      done_today: false,
      progress_this_week: [false, false, false, false, false, false, false],
    };
    goals.push(goal);
    return HttpResponse.json(goal, { status: 201 });
  }),

  http.patch("/api/v1/goals/:id", async ({ params, request }) => {
    const goal = goals.find((g) => g.id === Number(params.id));
    if (!goal) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    Object.assign(goal, await body<Partial<MockGoal>>(request));
    return HttpResponse.json(goal);
  }),

  http.delete("/api/v1/goals/:id", ({ params }) => {
    const goal = goals.find((g) => g.id === Number(params.id));
    if (!goal) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    goal.is_active = false;
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("/api/v1/goals/:id/log", async ({ params, request }) => {
    const goal = goals.find((g) => g.id === Number(params.id));
    if (!goal) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    const { completed } = await body<{ completed?: boolean }>(request);
    const done = completed ?? true;
    goal.done_today = done;
    if (done) {
      goal.current_streak += 1;
      const idx = goal.progress_this_week.indexOf(false);
      if (idx >= 0) goal.progress_this_week[idx] = true;
    } else {
      goal.current_streak = 0;
    }
    return HttpResponse.json({ ok: true });
  }),
];

export function __resetGoalsMocks() {
  nextId = 6;
}
