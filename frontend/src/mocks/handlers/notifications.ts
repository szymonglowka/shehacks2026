import { http, HttpResponse } from "msw";

interface AppNotification {
  id: number;
  kind: string;
  title: string;
  body: string;
  url: string;
  created_at: string;
  read_at: string | null;
}

let notifications: AppNotification[] = [
  {
    id: 1,
    kind: "goal_reminder",
    title: "Czas na chwilę dla siebie",
    body: "10 minut bez telefonu. Zasługujesz na ten kawałek dnia.",
    url: "/goals",
    created_at: "2026-05-14T20:00:00",
    read_at: null,
  },
  {
    id: 2,
    kind: "epds_due",
    title: "Krótka ankieta samopoczucia czeka",
    body: "Dwa tygodnie minęły — sprawdźmy, jak się masz. To zajmie 2 minuty.",
    url: "/epds",
    created_at: "2026-05-14T10:00:00",
    read_at: null,
  },
  {
    id: 3,
    kind: "gentle_nudge",
    title: "Spacer pomógł Ci ostatnio",
    body: "W dni ze spacerem Twój nastrój był wyższy. Może dziś też się uda?",
    url: "/today",
    created_at: "2026-05-13T16:30:00",
    read_at: "2026-05-13T18:00:00",
  },
  {
    id: 4,
    kind: "checkin_reminder",
    title: "Poranny check-in",
    body: "30 sekund dla siebie, zanim dzień się rozkręci.",
    url: "/checkin",
    created_at: "2026-05-12T09:00:00",
    read_at: "2026-05-12T09:20:00",
  },
  {
    id: 5,
    kind: "system",
    title: "Tomek wziął: obiad na czwartek",
    body: "Jedna rzecz mniej na Twojej głowie. Miło, prawda?",
    url: "/support",
    created_at: "2026-05-10T19:45:00",
    read_at: "2026-05-10T20:10:00",
  },
];

export const handlers = [
  http.get("/api/v1/push/vapid-public-key", () =>
    HttpResponse.json({ public_key: "BMockVapidPublicKeyForDemoPurposesOnly000000000000000000" }),
  ),
  http.post("/api/v1/push/subscriptions", () => HttpResponse.json({ ok: true }, { status: 201 })),
  http.delete("/api/v1/push/subscriptions", () => new HttpResponse(null, { status: 204 })),
  http.post("/api/v1/push/test", () => {
    notifications.unshift({
      id: Math.max(...notifications.map((n) => n.id)) + 1,
      kind: "system",
      title: "To jest powiadomienie testowe",
      body: "Tak będą wyglądać przypomnienia. Spokojnie i na czas.",
      url: "/today",
      created_at: new Date().toISOString(),
      read_at: null,
    });
    return HttpResponse.json({ ok: true });
  }),

  http.get("/api/v1/notifications", () => HttpResponse.json(notifications)),
  http.post("/api/v1/notifications/:id/read", ({ params }) => {
    const n = notifications.find((x) => x.id === Number(params.id));
    if (!n) return HttpResponse.json({ detail: "Not found" }, { status: 404 });
    n.read_at = new Date().toISOString();
    return HttpResponse.json(n);
  }),
  http.post("/api/v1/notifications/read-all", () => {
    const now = new Date().toISOString();
    notifications.forEach((n) => {
      n.read_at = n.read_at ?? now;
    });
    return HttpResponse.json({ ok: true });
  }),
];
