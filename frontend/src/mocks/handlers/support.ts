// f-care · MSW handlers: support domain.
// Realistic Marta data (SPEC §9): ranking shifted by 6 support sessions
// with feedback — rest-without-phone leads with "helped 4 of 5".

import { http, HttpResponse } from "msw";

const API = "*/api/v1";

export interface MockStrategy {
  code: string;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  steps: string[];
  icon: string;
  score: number;
  helped_count: number;
  total_count: number;
}

const toolkitPl: MockStrategy[] = [
  {
    code: "rest-no-phone",
    title: "10 minut odpoczynku bez telefonu",
    description: "Połóż się, odłóż telefon ekranem do dołu i po prostu bądź.",
    category: "rest",
    duration_minutes: 10,
    steps: [
      "Odłóż telefon ekranem do dołu, najlepiej w innym pokoju.",
      "Połóż się wygodnie albo oprzyj głowę o poduszkę.",
      "Przez 10 minut nie rób nic. Jeśli myśli pędzą, wróć do oddechu.",
      "Wstań powoli. To wystarczy.",
    ],
    icon: "moon",
    score: 0.94,
    helped_count: 4,
    total_count: 5,
  },
  {
    code: "short-walk",
    title: "Krótki spacer w Twoim tempie",
    description: "Świeże powietrze rozluźnia ciało i myśli. Bez celu, bez tempa.",
    category: "movement",
    duration_minutes: 15,
    steps: [
      "Ubierz się wygodnie, weź dziecko albo wyjdź sama.",
      "Idź tam, gdzie masz ochotę. Możesz zawrócić w każdej chwili.",
      "Zauważ trzy rzeczy: zapach, dźwięk, coś zielonego.",
      "Wróć, kiedy będziesz mieć dość. Każdy spacer się liczy.",
    ],
    icon: "footprints",
    score: 0.81,
    helped_count: 3,
    total_count: 5,
  },
  {
    code: "breath-478",
    title: "Oddech 4–7–8",
    description: "Minuta oddechu, która uspokaja układ nerwowy.",
    category: "breath",
    duration_minutes: 1,
    steps: [
      "Usiądź wygodnie, rozluźnij ramiona.",
      "Wdech nosem przez 4 sekundy.",
      "Wstrzymaj oddech na 7 sekund.",
      "Długi wydech ustami przez 8 sekund. Powtórz 4 razy.",
    ],
    icon: "wind",
    score: 0.77,
    helped_count: 5,
    total_count: 7,
  },
  {
    code: "warm-shower",
    title: "Ciepły prysznic tylko dla Ciebie",
    description: "Zamknij drzwi łazienki. Te pięć minut jest Twoje.",
    category: "body",
    duration_minutes: 5,
    steps: [
      "Poproś kogoś, żeby przez chwilę pobył z dzieckiem.",
      "Zamknij drzwi łazienki i odkręć ciepłą wodę.",
      "Stań pod strumieniem i poczuj ciepło na karku.",
      "Nie spiesz się. Wyjdź, kiedy będziesz gotowa.",
    ],
    icon: "droplets",
    score: 0.66,
    helped_count: 2,
    total_count: 4,
  },
  {
    code: "call-friend",
    title: "Zadzwoń do kogoś bliskiego",
    description: "Nie musisz mówić, że jest ciężko. Wystarczy usłyszeć głos.",
    category: "people",
    duration_minutes: 10,
    steps: [
      "Wybierz jedną osobę, przy której nie musisz udawać.",
      "Zadzwoń. Jeśli nie odbierze, napisz dwa zdania.",
      "Powiedz, jak jest naprawdę — albo pogadaj o niczym.",
      "Podziękuj sobie, że się odezwałaś.",
    ],
    icon: "phone",
    score: 0.58,
    helped_count: 2,
    total_count: 5,
  },
  {
    code: "tea-window",
    title: "Ciepła herbata przy oknie",
    description: "Usiądź z kubkiem i popatrz przed siebie. Kawa, co wystygła, też się liczy.",
    category: "rest",
    duration_minutes: 5,
    steps: [
      "Zrób sobie coś ciepłego do picia.",
      "Usiądź przy oknie albo na balkonie.",
      "Pij powoli, patrz na świat za szybą.",
      "Nie sprzątaj kubka od razu. Posiedź jeszcze chwilę.",
    ],
    icon: "coffee",
    score: 0.44,
    helped_count: 1,
    total_count: 3,
  },
];

const toolkitEn: MockStrategy[] = toolkitPl.map((s) => ({ ...s }));

const toolkitEnTitles: Record<string, { title: string; description: string }> = {
  "rest-no-phone": {
    title: "10 minutes of rest without your phone",
    description: "Lie down, put the phone face-down and just be.",
  },
  "short-walk": {
    title: "A short walk at your own pace",
    description: "Fresh air loosens the body and the mind. No goal, no pace.",
  },
  "breath-478": {
    title: "4–7–8 breathing",
    description: "One minute of breathing that calms your nervous system.",
  },
  "warm-shower": {
    title: "A warm shower, just for you",
    description: "Close the bathroom door. These five minutes are yours.",
  },
  "call-friend": {
    title: "Call someone close",
    description: "You don't have to say it's hard. Hearing a voice is enough.",
  },
  "tea-window": {
    title: "Warm tea by the window",
    description: "Sit with a mug and look ahead. Cold coffee counts too.",
  },
};

function toolkitFor(lang: string): MockStrategy[] {
  if (!lang.startsWith("en")) return toolkitPl;
  return toolkitPl.map((s) => ({
    ...s,
    title: toolkitEnTitles[s.code]?.title ?? s.title,
    description: toolkitEnTitles[s.code]?.description ?? s.description,
  }));
}
void toolkitEn;

let sessionSeq = 100;

const contacts = [
  { id: 1, name: "Tomek", relation: "partner", phone: "+48600111222" },
  { id: 2, name: "Mama", relation: "mother", phone: "+48600333444" },
];

const helplines = [
  {
    code: "emergency",
    label: "Numer alarmowy",
    label_en: "Emergency number",
    number: "112",
    number_href: "tel:112",
    hours: "24/7",
    verify: true,
  },
  {
    code: "crisis-adult",
    label: "Telefon zaufania dla dorosłych",
    label_en: "Crisis helpline for adults",
    number: "116 123",
    number_href: "tel:+48116123",
    hours: "pn–pt 14:00–22:00",
    verify: true,
  },
  {
    code: "depression",
    label: "Antydepresyjny Telefon Forum Przeciw Depresji",
    label_en: "Anti-depression helpline",
    number: "22 594 91 00",
    number_href: "tel:+48225949100",
    hours: "śr–czw 17:00–19:00",
    verify: true,
  },
];

export const supportHandlers = [
  http.get(`${API}/support/toolkit`, ({ request }) => {
    const lang = request.headers.get("Accept-Language") ?? "pl";
    return HttpResponse.json({ strategies: toolkitFor(lang) });
  }),

  http.post(`${API}/support/sessions`, async ({ request }) => {
    const body = (await request.json()) as {
      intensity: number;
      trigger?: string;
    };
    sessionSeq += 1;
    const urgent = body.intensity === 5;
    return HttpResponse.json(
      {
        session: {
          id: sessionSeq,
          intensity: body.intensity,
          trigger: body.trigger ?? null,
          strategy: null,
          helped: null,
          mood_after: null,
          created_at: new Date().toISOString(),
        },
        risk: urgent
          ? {
              level: "urgent",
              reasons: ["intensity_5"],
              actions: ["show_crisis"],
            }
          : null,
      },
      { status: 201 },
    );
  }),

  http.patch(`${API}/support/sessions/:id`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      id: Number(params.id),
      intensity: 3,
      trigger: null,
      strategy: body.strategy ?? null,
      helped: body.helped ?? null,
      mood_after: body.mood_after ?? null,
      created_at: new Date().toISOString(),
    });
  }),

  http.put(`${API}/support/preferences`, async () => {
    return HttpResponse.json({ ok: true });
  }),

  http.get(`${API}/support/contacts`, () => {
    return HttpResponse.json(contacts);
  }),

  http.post(`${API}/support/contacts`, async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      relation: string;
      phone: string;
    };
    return HttpResponse.json(
      { id: contacts.length + 1, ...body },
      { status: 201 },
    );
  }),

  http.delete(`${API}/support/contacts/:id`, () => {
    return HttpResponse.json(null, { status: 204 });
  }),

  http.get(`${API}/support/contacts/:id/message`, ({ request, params }) => {
    const lang = request.headers.get("Accept-Language") ?? "pl";
    const contact = contacts.find((c) => c.id === Number(params.id));
    const name = contact?.name ?? "Tomek";
    const text =
      lang.startsWith("en")
        ? `Hi ${name}, today is a heavier day for me. Could you take the evening feeding over? No need to reply — just knowing you're there helps. — Marta (via Otula)`
        : `Cześć ${name}, mam dziś cięższy dzień. Mogłabyś/Mógłbyś przejąć wieczorne karmienie? Nie musisz odpisywać — sama wiadomość, że jesteś, pomaga. — Marta (przez Otulę)`;
    const phone = (contact?.phone ?? "+48600111222").replace(/[\s-]/g, "");
    return HttpResponse.json({
      text,
      sms_url: `sms:${phone}?&body=${encodeURIComponent(text)}`,
      whatsapp_url: `https://wa.me/${phone.replace("+", "")}?text=${encodeURIComponent(text)}`,
    });
  }),

  http.get(`${API}/support/helplines`, ({ request }) => {
    const lang = request.headers.get("Accept-Language") ?? "pl";
    const en = lang.startsWith("en");
    return HttpResponse.json(
      helplines.map((h) => ({
        code: h.code,
        label: en ? h.label_en : h.label,
        number: h.number,
        number_href: h.number_href,
        hours: h.hours,
        verify: h.verify,
      })),
    );
  }),
];
