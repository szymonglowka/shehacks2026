// f-care · MSW handlers: wins domain (Marta: 9 small wins, SPEC §9).

import { http, HttpResponse } from "msw";

const API = "*/api/v1";

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

export const winsHandlers = [
  http.get(`${API}/wins`, ({ request }) => {
    const lang = request.headers.get("Accept-Language") ?? "pl";
    const en = lang.startsWith("en");
    return HttpResponse.json(
      wins.map((w, i) => ({ ...w, text: en ? winsEn[i] : w.text })),
    );
  }),

  http.get(`${API}/wins/random`, ({ request }) => {
    const lang = request.headers.get("Accept-Language") ?? "pl";
    const en = lang.startsWith("en");
    const idx = Math.floor(Math.random() * wins.length);
    const w = wins[idx];
    return HttpResponse.json({ ...w, text: en ? winsEn[idx] : w.text });
  }),

  http.post(`${API}/wins`, async ({ request }) => {
    const body = (await request.json()) as { text: string; date?: string };
    winSeq += 1;
    const today = new Date().toISOString().slice(0, 10);
    const created = {
      id: winSeq,
      text: body.text,
      date: body.date ?? today,
      created_at: today,
    };
    wins.push({ id: created.id, text: created.text, created_at: created.date });
    return HttpResponse.json(created, { status: 201 });
  }),

  http.delete(`${API}/wins/:id`, ({ params }) => {
    const idx = wins.findIndex((w) => w.id === Number(params.id));
    if (idx >= 0) wins.splice(idx, 1);
    return HttpResponse.json(null, { status: 204 });
  }),
];
