// f-care · MSW handlers: circle domain (Marta: 4 requests, 1 claimed by Tomek, 1 done).
import { http, HttpResponse } from "msw";

const API = "*/api/v1";

let shareMood = true;

const requests = [
  {
    id: 1,
    title: "Obiad na czwartek",
    title_en: "Dinner for Thursday",
    category: "meal",
    when_label: "czwartek po południu",
    when_label_en: "Thursday afternoon",
    status: "open",
    claimed_by: null,
  },
  {
    id: 2,
    title: "Przejmij karmienie o 2:00",
    title_en: "Take over the 2 a.m. feeding",
    category: "night",
    when_label: "dziś w nocy",
    when_label_en: "tonight",
    status: "claimed",
    claimed_by: "Tomek",
  },
  {
    id: 3,
    title: "Spacer ze starszakiem",
    title_en: "A walk with the older one",
    category: "kids",
    when_label: "sobota rano",
    when_label_en: "Saturday morning",
    status: "done",
    claimed_by: "Mama",
  },
  {
    id: 4,
    title: "Zakupy spożywcze",
    title_en: "Grocery shopping",
    category: "errand",
    when_label: "w tym tygodniu",
    when_label_en: "this week",
    status: "open",
    claimed_by: null,
  },
];

const TOKEN = "marta-krag-7f3k9";

function publicRequests(lang: string) {
  const en = lang.startsWith("en");
  return requests.map((r) => ({
    id: r.id,
    title: en ? r.title_en : r.title,
    category: r.category,
    when_label: en ? r.when_label_en : r.when_label,
    status: r.status,
    claimed_by: r.claimed_by,
  }));
}

const wins = [
  { id: 1, text: "Wzięłam prysznic bez pośpiechu.", created_at: "2026-05-12" },
  { id: 2, text: "Pierwszy spacer we dwoje.", created_at: "2026-05-12" },
  { id: 3, text: "Poprosiłam mamę o pomoc. Bez wyrzutów.", created_at: "2026-05-15" },
  { id: 4, text: "Zasnęłam razem z małą o 21:00.", created_at: "2026-05-18" },
  { id: 5, text: "Zjadłam ciepły obiad. Cały.", created_at: "2026-05-20" },
  { id: 6, text: "Wyszłam na 5 minut sama na balkon.", created_at: "2026-05-23" },
  { id: 7, text: "Zadzwoniłam do położnej z pytaniem, które odkładałam.", created_at: "2026-05-27" },
  { id: 8, text: "Ubrałam się w coś, w czym czuję się sobą.", created_at: "2026-05-30" },
  { id: 9, text: "Powiedziałam Tomkowi, że jest ciężko.", created_at: "2026-06-01" },
];

const winsEn = [
  "I took a shower without rushing.",
  "Our first walk, just the two of us.",
  "I asked my mum for help. No guilt.",
  "I fell asleep with the little one at 9 p.m.",
  "I ate a warm dinner. All of it.",
  "I stepped onto the balcony alone for 5 minutes.",
  "I called the midwife with the question I'd been putting off.",
  "I wore something that feels like me.",
  "I told Tomek that it's been hard.",
];

let winSeq = wins.length;

export const circleHandlers = [
  http.get(`${API}/circle/link`, () => {
    return HttpResponse.json({
      token: TOKEN,
      url: `${location.origin}/c/${TOKEN}`,
      share_mood: shareMood,
    });
  }),

  http.post(`${API}/circle/link`, () => {
    shareMood = true;
    return HttpResponse.json({
      token: TOKEN,
      url: `${location.origin}/c/${TOKEN}`,
      share_mood: shareMood,
    });
  }),

  http.patch(`${API}/circle/link`, async ({ request }) => {
    const body = (await request.json()) as { share_mood: boolean };
    shareMood = body.share_mood;
    return HttpResponse.json({
      token: TOKEN,
      url: `${location.origin}/c/${TOKEN}`,
      share_mood: shareMood,
    });
  }),

  http.delete(`${API}/circle/link`, () => {
    return HttpResponse.json(null, { status: 204 });
  }),

  http.get(`${API}/circle/requests`, ({ request }) => {
    const lang = request.headers.get("Accept-Language") ?? "pl";
    return HttpResponse.json(publicRequests(lang));
  }),

  http.post(`${API}/circle/requests`, async ({ request }) => {
    const lang = request.headers.get("Accept-Language") ?? "pl";
    const body = (await request.json()) as {
      title: string;
      category: string;
      when_label: string;
    };
    const created = {
      id: Math.max(...requests.map((r) => r.id)) + 1,
      title: body.title,
      title_en: body.title,
      category: body.category,
      when_label: body.when_label,
      when_label_en: body.when_label,
      status: "open",
      claimed_by: null,
    };
    requests.push(created);
    void lang;
    return HttpResponse.json(
      {
        id: created.id,
        title: created.title,
        category: created.category,
        when_label: created.when_label,
        status: created.status,
        claimed_by: null,
      },
      { status: 201 },
    );
  }),

  http.delete(`${API}/circle/requests/:id`, ({ params }) => {
    const idx = requests.findIndex((r) => r.id === Number(params.id));
    if (idx >= 0) requests.splice(idx, 1);
    return HttpResponse.json(null, { status: 204 });
  }),

  // ---- public (no auth) ----
  http.get(`${API}/circle/public/:token`, ({ request, params }) => {
    if (params.token !== TOKEN) {
      return HttpResponse.json({ detail: "Not found." }, { status: 404 });
    }
    const lang = request.headers.get("Accept-Language") ?? "pl";
    const en = lang.startsWith("en");
    return HttpResponse.json({
      mom_name: "Marta",
      ...(shareMood
        ? { mood_color: "#e8d9b5", mood_word: en ? "a mixed day" : "różnie" }
        : {}),
      requests: publicRequests(lang),
    });
  }),

  http.post(
    `${API}/circle/public/:token/requests/:id/claim`,
    async ({ params, request }) => {
      if (params.token !== TOKEN) {
        return HttpResponse.json({ detail: "Not found." }, { status: 404 });
      }
      const body = (await request.json()) as { name: string };
      const found = requests.find((r) => r.id === Number(params.id));
      if (!found) {
        return HttpResponse.json({ detail: "Not found." }, { status: 404 });
      }
      found.status = "claimed";
      found.claimed_by = body.name;
      return HttpResponse.json({
        id: found.id,
        title: found.title,
        category: found.category,
        when_label: found.when_label,
        status: found.status,
        claimed_by: found.claimed_by,
      });
    },
  ),

  http.post(
    `${API}/circle/public/:token/requests/:id/done`,
    ({ params }) => {
      if (params.token !== TOKEN) {
        return HttpResponse.json({ detail: "Not found." }, { status: 404 });
      }
      const found = requests.find((r) => r.id === Number(params.id));
      if (!found) {
        return HttpResponse.json({ detail: "Not found." }, { status: 404 });
      }
      found.status = "done";
      return HttpResponse.json({
        id: found.id,
        title: found.title,
        category: found.category,
        when_label: found.when_label,
        status: found.status,
        claimed_by: found.claimed_by,
      });
    },
  ),
];

