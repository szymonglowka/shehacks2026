import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export interface Helpline {
  id: number;
  name: string;
  phone: string;
  hours: string;
  description: string;
  is_emergency: boolean;
}

const FALLBACK_PL: Helpline[] = [
  {
    id: 1,
    name: "Telefon alarmowy",
    phone: "112",
    hours: "całodobowo",
    description: "Gdy Ty lub ktoś obok jest w bezpośrednim niebezpieczeństwie.",
    is_emergency: true,
  },
  {
    id: 2,
    name: "Kryzysowy Telefon Zaufania",
    phone: "116 123",
    hours: "codziennie 14:00–22:00",
    description: "Bezpłatna pomoc psychologiczna dla dorosłych.",
    is_emergency: false,
  },
  {
    id: 3,
    name: "Telefon dla Rodziców i Nauczycieli",
    phone: "800 100 100",
    hours: "pon–pt 12:00–15:00, czw dodatkowo 16:00–18:00",
    description: "Wsparcie dla rodziców w trudnych chwilach.",
    is_emergency: false,
  },
];

const FALLBACK_EN: Helpline[] = [
  {
    id: 1,
    name: "Emergency number",
    phone: "112",
    hours: "24/7",
    description: "When you or someone near you is in immediate danger.",
    is_emergency: true,
  },
  {
    id: 2,
    name: "Crisis Helpline",
    phone: "116 123",
    hours: "daily 2pm–10pm",
    description: "Free psychological support for adults.",
    is_emergency: false,
  },
  {
    id: 3,
    name: "Parents & Teachers Helpline",
    phone: "800 100 100",
    hours: "Mon–Fri 12pm–3pm, Thu also 4pm–6pm",
    description: "Support for parents in difficult moments.",
    is_emergency: false,
  },
];

/** Helplines served by the support domain; static fallback keeps the tab working standalone. */
export function useHelplines(lang: string) {
  return useQuery({
    queryKey: ["support", "helplines", lang],
    queryFn: async () => {
      try {
        return await apiFetch<Helpline[]>("/support/helplines");
      } catch {
        return lang === "pl" ? FALLBACK_PL : FALLBACK_EN;
      }
    },
  });
}
