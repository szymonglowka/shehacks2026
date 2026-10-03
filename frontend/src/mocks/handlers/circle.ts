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

  // ---- public (no auth; mirrors the real payload incl. mood + full
  // payload on claim/done) ----
  http.get(`${API}/circle/public/:token`, ({ request, params }) => {
    if (params.token !== TOKEN) {
      return HttpResponse.json({ detail: "Not found." }, { status: 404 });
    }
    const lang = request.headers.get("Accept-Language") ?? "pl";
    return HttpResponse.json({
      mom_name: "Marta",
      ...(shareMood
        ? { mood: { color: "#e8d9b5", label: "ok" } }
        : { mood: null }),
      requests: publicRequests(lang).map((r) => ({
        ...r,
        claimed_by_name: r.claimed_by,
      })),
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
      if (found.status !== "open") {
        return HttpResponse.json(
          { detail: "Already claimed." },
          { status: 400 },
        );
      }
      found.status = "claimed";
      found.claimed_by = body.name;
      const lang = request.headers.get("Accept-Language") ?? "pl";
      return HttpResponse.json({
        mom_name: "Marta",
        mood: shareMood ? { color: "#e8d9b5", label: "ok" } : null,
        requests: publicRequests(lang).map((r) => ({
          ...r,
          claimed_by_name: r.claimed_by,
        })),
      });
    },
  ),

  http.post(
    `${API}/circle/public/:token/requests/:id/done`,
    ({ params, request }) => {
      if (params.token !== TOKEN) {
        return HttpResponse.json({ detail: "Not found." }, { status: 404 });
      }
      const found = requests.find((r) => r.id === Number(params.id));
      if (!found) {
        return HttpResponse.json({ detail: "Not found." }, { status: 404 });
      }
      found.status = "done";
      const lang = request.headers.get("Accept-Language") ?? "pl";
      return HttpResponse.json({
        mom_name: "Marta",
        mood: shareMood ? { color: "#e8d9b5", label: "ok" } : null,
        requests: publicRequests(lang).map((r) => ({
          ...r,
          claimed_by_name: r.claimed_by,
        })),
      });
    },
  ),
];

