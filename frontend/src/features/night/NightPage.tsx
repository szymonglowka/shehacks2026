// f-care · Night shift (/night) per SCREENS §3.11.
// Serif clock, "X mam też teraz nie śpi" (hidden when null), 4 big actions:
// quick 1-tap mood check-in (PUT /checkins/{today}), breathe, can't sleep
// 5-4-3-2-1, note for morning. Plus the /today → /night auto-redirect.

import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  dismissNightRedirect,
  isNightHour,
  isNightRedirectDismissed,
  useNightNow,
} from "../../api/night";
import { BreathingOrb } from "../toughday/ToughDayFlow";

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function Clock() {
  const now = useClock();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return (
    <span className="font-serif text-6xl tabular-nums">
      {hh}:{mm}
    </span>
  );
}

function QuickMood() {
  const { t } = useTranslation("night");
  const [saved, setSaved] = useState(false);

  const save = async (mood: number) => {
    const today = new Date().toISOString().slice(0, 10);
    const base =
      (import.meta.env.VITE_API_URL as string | undefined) ??
      "http://localhost:8000/api/v1";
    const token = localStorage.getItem("otula:access");
    try {
      await fetch(`${base}/checkins/${today}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ mood }),
      });
    } catch {
      /* offline at 3 a.m. is fine — the gesture still counts */
    }
    setSaved(true);
  };

  if (saved) return <p role="status">{t("checkinDone")}</p>;
  return (
    <div className="flex gap-2" role="radiogroup" aria-label={t("checkin")}>
      {[1, 2, 3, 4, 5].map((m) => (
        <button
          key={m}
          role="radio"
          aria-checked={false}
          aria-label={`${m}`}
          onClick={() => void save(m)}
          className="min-h-[56px] min-w-[56px] flex-1 rounded-2xl bg-night-card font-serif text-2xl"
        >
          {m}
        </button>
      ))}
    </div>
  );
}

function Grounding() {
  const { t } = useTranslation("night");
  const [step, setStep] = useState(0);
  const senses = t("senses", { returnObjects: true }) as string[];
  const counts = [5, 4, 3, 2, 1];

  if (step >= counts.length) {
    return <p role="status">{t("cantSleepDone")}</p>;
  }
  return (
    <div>
      <p className="font-serif text-xl">
        {t("cantSleepStep", { n: counts[step], sense: senses[step] })}
      </p>
      <button
        className="mt-3 min-h-[56px] w-full rounded-full bg-amber px-4 py-2 text-ink"
        onClick={() => setStep((s) => s + 1)}
      >
        {counts[step]} → {step + 1 >= counts.length ? "·" : counts[step + 1]}
      </button>
    </div>
  );
}

function MorningNote() {
  const { t } = useTranslation("night");
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);

  if (saved) return <p role="status">{t("noteSaved")}</p>;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        try {
          const key = "otula:morning-notes";
          const prev = JSON.parse(localStorage.getItem(key) ?? "[]") as string[];
          localStorage.setItem(key, JSON.stringify([...prev, text.trim()]));
        } catch {
          /* private mode */
        }
        setSaved(true);
      }}
    >
      <label htmlFor="morning-note" className="sr-only">
        {t("noteMorning")}
      </label>
      <textarea
        id="morning-note"
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("notePh")}
        className="w-full rounded-2xl bg-night-card p-3 text-base"
      />
      <button
        type="submit"
        disabled={!text.trim()}
        className="mt-2 min-h-[56px] w-full rounded-full bg-amber px-4 py-2 text-ink disabled:opacity-50"
      >
        {t("backMorning")}
      </button>
    </form>
  );
}

/**
 * Rendered by f-daily's /today: when the night theme is active and the user
 * hasn't dismissed it tonight, swap home for the night shift.
 */
export function NightRedirect({ nightThemeActive }: { nightThemeActive: boolean }) {
  const today = new Date().toISOString().slice(0, 10);
  if (
    nightThemeActive &&
    isNightHour() &&
    !isNightRedirectDismissed(today)
  ) {
    return <Navigate to="/night" replace />;
  }
  return null;
}

export function NightPage() {
  const { t } = useTranslation("night");
  const night = useNightNow();
  const [action, setAction] = useState<"none" | "breathe" | "ground" | "note">("none");
  const awake = night.data?.awake_count ?? null;

  const dismiss = () => {
    dismissNightRedirect(new Date().toISOString().slice(0, 10));
  };

  return (
    <main className="mx-auto max-w-xl bg-night px-4 pb-16 pt-10 text-night-ink">
      <p className="opacity-70">
        <Clock />. {t("greeting")}
      </p>
      {awake != null && (
        <p className="mt-1 font-serif text-xl">
          <strong className="tabular-nums">{awake}</strong> {t("awake", { count: awake }).replace(/^\d+\s*/, "")}
        </p>
      )}

      <div className="mt-6 grid gap-3">
        <section aria-label={t("checkin")} className="rounded-3xl bg-night-card p-5">
          <h2 className="font-serif text-xl">{t("checkin")}</h2>
          <div className="mt-2">
            <QuickMood />
          </div>
        </section>

        <button
          className="min-h-[56px] rounded-3xl bg-night-card p-5 text-left font-serif text-xl"
          onClick={() => setAction(action === "breathe" ? "none" : "breathe")}
        >
          {t("breathe")}
        </button>
        {action === "breathe" && (
          <div className="rounded-3xl bg-night-card p-5">
            <BreathingOrb onDone={() => setAction("none")} onSkip={() => setAction("none")} />
          </div>
        )}

        <button
          className="min-h-[56px] rounded-3xl bg-night-card p-5 text-left font-serif text-xl"
          onClick={() => setAction(action === "ground" ? "none" : "ground")}
        >
          {t("cantSleep")}
        </button>
        {action === "ground" && (
          <div className="rounded-3xl bg-night-card p-5">
            <Grounding />
          </div>
        )}

        <button
          className="min-h-[56px] rounded-3xl bg-night-card p-5 text-left font-serif text-xl"
          onClick={() => setAction(action === "note" ? "none" : "note")}
        >
          {t("noteMorning")}
        </button>
        {action === "note" && (
          <div className="rounded-3xl bg-night-card p-5">
            <MorningNote />
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-2 text-center">
        <Link to="/tough-day" className="min-h-[44px] underline">
          {t("toughDay")}
        </Link>
        <a href="tel:116123" className="min-h-[44px] underline">
          {t("helpNow")}
        </a>
        <Link to="/today" onClick={dismiss} className="min-h-[44px] underline opacity-70">
          {t("dismiss")}
        </Link>
      </div>
    </main>
  );
}
