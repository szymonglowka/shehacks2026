// f-care · MSW handlers: night domain.
// Demo awake_count 37 (SPEC §9: background accounts with night last_seen_at).

import { http, HttpResponse } from "msw";

const API = "*/api/v1";

export const nightHandlers = [
  http.get(`${API}/night/now`, () => {
    return HttpResponse.json({ awake_count: 37 });
  }),
];
