// f-care · Tough-day flow (/tough-day modal route) per SCREENS §3.9:
// intensity petals (5 → /help) → breathing orb (4-7-8 + box, 1-min timer,
// phase text, reduced-motion fallback) → top 3 strategies step-by-step +
// timer → ask for support (sms/WhatsApp URL from API) + RandomWinCard →
// "did it help?" + mood after → PATCH.

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useCreateSession,
  useSupportMessage,
  useContacts,
  useToolkit,
  useUpdateSession,
  type CopingStrategy,
  type Helped,
} from "../../api/support";
import { RandomWinCard } from "../wins/WinsCards";

type Phase = "idle" | "intensity" | "breath" | "strategies" | "end";

const PETAL_SIZES = [28, 36, 44, 54, 66];

export function IntensityPetals({
  value,
  onPick,
}: {
  value: number | null;
  onPick: (v: number) => void;
}) {
  const { t } = useTranslation("toughday");
  const labels = t("intensityLabels", { returnObjects: true }) as string[];
  return (
    <div
      role="radiogroup"
      aria-label={t("intensityTitle")}
      className="flex items-end justify-center gap-3"
    >
      {[1, 2, 3, 4, 5].map((v, i) => (
        <button
          key={v}
          role="radio"
          aria-checked={value === v}
          aria-label={`${v}: ${labels[i]}`}
          title={labels[i]}
          onClick={() => onPick(v)}
          className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full ${
            value === v ? "bg-forest text-cream" : "bg-forest/10"
          }`}
          style={{
            width: PETAL_SIZES[i],
            height: PETAL_SIZES[i],
            borderRadius: "50% 50% 50% 4px",
          }}
        >
          <span className="font-serif">{v}</span>
        </button>
      ))}
    </div>
  );
}

interface BreathPattern {
  inhale: number;
  hold: number;
  exhale: number;
  rest: number;
}

const PATTERNS: Record<"478" | "box", BreathPattern> = {
  "478": { inhale: 4, hold: 7, exhale: 8, rest: 0 },
  box: { inhale: 4, hold: 4, exhale: 4, rest: 4 },
};

export function BreathingOrb({
  onDone,
  onSkip,
}: {
  onDone: () => void;
  onSkip: () => void;
}) {
  const { t } = useTranslation("toughday");
  const [pattern, setPattern] = useState<"478" | "box">("478");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<"in" | "hold" | "out" | "rest">("in");
  const [phaseLeft, setPhaseLeft] = useState(4);
  const timer = useRef<number | null>(null);

  const reducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const total = 60;

  useEffect(() => {
    if (!running) return;
    const p = PATTERNS[pattern];
    const order: Array<"in" | "hold" | "out" | "rest"> =
      p.rest > 0 ? ["in", "hold", "out", "rest"] : ["in", "hold", "out"];
    timer.current = window.setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= total) {
          if (timer.current) window.clearInterval(timer.current);
          setRunning(false);
          onDone();
          return e;
        }
        return e + 1;
      });
      setPhaseLeft((left) => {
        if (left > 1) return left - 1;
        setPhase((ph) => {
          const next = order[(order.indexOf(ph) + 1) % order.length];
          const durations = {
            in: p.inhale,
            hold: p.hold,
            out: p.exhale,
            rest: p.rest,
          };
          setPhaseLeft(durations[next] || 4);
          return next;
        });
        return left;
      });
    }, 1000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, pattern]);

  const phaseText =
    phase === "in" ? t("breathIn") : phase === "hold" ? t("breathHold") : t("breathOut");
  const scale =
    !running || reducedMotion ? 1 : phase === "in" ? 1.35 : phase === "out" ? 0.85 : 1.15;

  return (
    <div>
      <div className="flex justify-center gap-2">
        <button
          className={`min-h-[44px] rounded-full px-4 py-2 ${pattern === "478" ? "bg-forest text-cream" : "bg-forest/10"}`}
          onClick={() => {
            setPattern("478");
            setPhase("in");
            setPhaseLeft(4);
          }}
        >
          {t("breath478")}
        </button>
        <button
          className={`min-h-[44px] rounded-full px-4 py-2 ${pattern === "box" ? "bg-forest text-cream" : "bg-forest/10"}`}
          onClick={() => {
            setPattern("box");
            setPhase("in");
            setPhaseLeft(4);
          }}
        >
          {t("breathBox")}
        </button>
      </div>

      <div className="mt-6 flex flex-col items-center">
        <div
          role="timer"
          aria-label={t("timer")}
          aria-live="off"
          className="flex h-44 w-44 items-center justify-center rounded-full bg-sage/40"
          style={
            reducedMotion
              ? undefined
              : { transform: `scale(${scale})`, transition: "transform 3.5s ease-in-out" }
          }
        >
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-sage/60">
            <span className="font-serif text-3xl tabular-nums">
              {running ? phaseLeft : "·"}
            </span>
          </div>
        </div>
        <p aria-live="polite" className="mt-3 font-serif text-2xl">
          {running ? phaseText : t("breathTitle")}
        </p>
        <p className="text-sm tabular-nums opacity-60">
          {elapsed}s / {total}s
        </p>
      </div>

      {!running && elapsed === 0 && (
        <button
          className="mt-4 min-h-[48px] w-full rounded-full bg-forest px-4 py-2 text-cream"
          onClick={() => {
            setRunning(true);
            setPhase("in");
            setPhaseLeft(PATTERNS[pattern].inhale);
          }}
        >
          {t("breathStart")}
        </button>
      )}
      <button
        className="mt-2 min-h-[44px] w-full rounded-full underline"
        onClick={onSkip}
      >
        {t("breathSkip")}
      </button>
    </div>
  );
}

function StrategyDetail({
  strategy,
  onBack,
  onDone,
}: {
  strategy: CopingStrategy;
  onBack: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation("toughday");
  const [step, setStep] = useState(0);
  const [seconds, setSeconds] = useState(strategy.duration_minutes * 60);
  const [timerOn, setTimerOn] = useState(false);

  useEffect(() => {
    if (!timerOn) return;
    if (seconds <= 0) {
      setTimerOn(false);
      return;
    }
    const id = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [timerOn, seconds]);

  const mm = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div>
      <button
        onClick={onBack}
        className="min-h-[44px] underline"
      >
        ← {t("strategiesTitle")}
      </button>
      <h3 className="mt-2 font-serif text-2xl">{strategy.title}</h3>
      <ol className="mt-3 grid gap-2">
        {strategy.steps.map((s, i) => (
          <li
            key={i}
            className={`rounded-2xl p-3 ${i === step ? "bg-forest text-cream" : "bg-paper"}`}
          >
            <span className="font-serif tabular-nums">{i + 1}. </span>
            {s}
          </li>
        ))}
      </ol>
      <div className="mt-3 flex items-center gap-3">
        <button
          className="min-h-[44px] rounded-full border border-forest px-4 py-2 text-forest"
          onClick={() => setTimerOn((v) => !v)}
        >
          {t("timer")}: <span className="tabular-nums">{mm}:{ss}</span>
        </button>
        <div className="flex gap-2">
          <button
            disabled={step === 0}
            className="min-h-[44px] min-w-[44px] rounded-full bg-forest/10 px-3 disabled:opacity-40"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            aria-label="←"
          >
            ←
          </button>
          <button
            disabled={step >= strategy.steps.length - 1}
            className="min-h-[44px] min-w-[44px] rounded-full bg-forest/10 px-3 disabled:opacity-40"
            onClick={() =>
              setStep((s) => Math.min(strategy.steps.length - 1, s + 1))
            }
            aria-label="→"
          >
            →
          </button>
        </div>
      </div>
      <button
        className="mt-4 min-h-[48px] w-full rounded-full bg-forest px-4 py-2 text-cream"
        onClick={onDone}
      >
        {t("finish")}
      </button>
    </div>
  );
}

function AskSupport() {
  const { t } = useTranslation("toughday");
  const contacts = useContacts();
  const [contactId, setContactId] = useState<number | null>(null);
  const message = useSupportMessage(contactId);

  const list = useMemo(() => contacts.data ?? [], [contacts.data]);
  const activeId = contactId ?? list[0]?.id ?? null;
  const activeMessage = contactId === activeId ? message.data : undefined;

  return (
    <section aria-labelledby="ask-support-title" className="rounded-3xl bg-paper p-5">
      <h3 id="ask-support-title" className="font-serif text-xl">
        {t("askSupport")}
      </h3>
      <p className="text-sm opacity-70">{t("askSupportCopy")}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {list.map((c) => (
          <button
            key={c.id}
            onClick={() => setContactId(c.id)}
            className={`min-h-[44px] rounded-full px-4 py-2 ${
              (contactId ?? list[0]?.id) === c.id
                ? "bg-forest text-cream"
                : "bg-forest/10"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
      {(contactId ?? list[0]?.id) != null && (
        <InnerMessage
          contactId={(contactId ?? list[0]?.id) as number}
          message={activeId === contactId ? activeMessage : undefined}
        />
      )}
    </section>
  );
}

function InnerMessage({
  contactId,
  message,
}: {
  contactId: number;
  message: { text: string; sms_url: string; whatsapp_url: string } | undefined;
}) {
  const { t } = useTranslation("toughday");
  const q = useSupportMessage(contactId);
  const data = message ?? (contactId ? q.data : undefined);
  if (!data) return null;
  return (
    <div className="mt-3">
      <blockquote className="rounded-2xl bg-cream p-3 text-sm italic">
        „{data.text}”
      </blockquote>
      <div className="mt-2 flex gap-2">
        <a
          href={data.sms_url}
          className="inline-flex min-h-[44px] items-center rounded-full bg-forest px-4 py-2 text-cream"
        >
          {t("sendSms")}
        </a>
        <a
          href={data.whatsapp_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[44px] items-center rounded-full border border-forest px-4 py-2 text-forest"
        >
          {t("sendWhatsapp")}
        </a>
      </div>
    </div>
  );
}

const MOOD_LABELS = ["1", "2", "3", "4", "5"];

export function ToughDayFlow() {
  const { t } = useTranslation("toughday");
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("intensity");
  const [intensity, setIntensity] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [strategy, setStrategy] = useState<CopingStrategy | null>(null);
  const [helped, setHelped] = useState<Helped | null>(null);
  const [moodAfter, setMoodAfter] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  const create = useCreateSession();
  const update = useUpdateSession(sessionId);
  const toolkit = useToolkit();
  const top3 = (toolkit.data?.strategies ?? []).slice(0, 3);

  const pickIntensity = (v: number) => {
    setIntensity(v);
    create.mutate(
      { intensity: v },
      {
        onSuccess: (res) => {
          setSessionId(res.session.id);
          setPhase(v === 5 ? "end" : "breath");
          if (v === 5) navigate("/help");
        },
        onError: () => setPhase(v === 5 ? "end" : "breath"),
      },
    );
    if (v === 5) navigate("/help");
  };

  const saveEnd = () => {
    if (sessionId && (strategy || helped || moodAfter)) {
      update.mutate(
        {
          ...(strategy ? { strategy: strategy.code } : {}),
          ...(helped ? { helped } : {}),
          ...(moodAfter ? { mood_after: moodAfter } : {}),
        },
        { onSettled: () => setFinished(true) },
      );
    } else {
      setFinished(true);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="toughday-title"
      className="mx-auto w-full max-w-xl px-4 pb-24 pt-6"
    >
      <div className="text-xs uppercase tracking-widest opacity-60">
        {t("eyebrow")}
      </div>

      {phase === "intensity" && (
        <section>
          <p className="mt-1 text-sm opacity-60">{t("stepIntensity")}</p>
          <h2 id="toughday-title" className="font-serif text-3xl">
            {t("intensityTitle")}
          </h2>
          <p className="mt-1 opacity-70">{t("intensityCopy")}</p>
          <div className="mt-6">
            <IntensityPetals value={intensity} onPick={pickIntensity} />
          </div>
          <button
            className="mt-6 min-h-[44px] w-full underline"
            onClick={() => navigate(-1)}
          >
            {t("close")}
          </button>
        </section>
      )}

      {phase === "breath" && (
        <section>
          <p className="mt-1 text-sm opacity-60">{t("stepBreath")}</p>
          <h2 id="toughday-title" className="font-serif text-3xl">
            {t("breathTitle")}
          </h2>
          <p className="mt-1 opacity-70">{t("breathCopy")}</p>
          <div className="mt-4">
            <BreathingOrb
              onDone={() => setPhase("strategies")}
              onSkip={() => setPhase("strategies")}
            />
          </div>
        </section>
      )}

      {phase === "strategies" &&
        (strategy ? (
          <StrategyDetail
            strategy={strategy}
            onBack={() => setStrategy(null)}
            onDone={() => setPhase("end")}
          />
        ) : (
          <section>
            <p className="mt-1 text-sm opacity-60">{t("stepStrategies")}</p>
            <h2 id="toughday-title" className="font-serif text-3xl">
              {t("strategiesTitle")}
            </h2>
            <p className="mt-1 opacity-70">{t("strategiesCopy")}</p>
            <ul className="mt-4 grid gap-3">
              {top3.map((s) => (
                <li key={s.code}>
                  <button
                    onClick={() => setStrategy(s)}
                    className="min-h-[56px] w-full rounded-3xl bg-paper p-4 text-left"
                  >
                    <strong className="font-serif text-lg">{s.title}</strong>
                    <div className="text-sm opacity-70">{s.description}</div>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <AskSupport />
            </div>
            <div className="mt-4">
              <RandomWinCard />
            </div>
            <button
              className="mt-4 min-h-[48px] w-full rounded-full bg-forest px-4 py-2 text-cream"
              onClick={() => setPhase("end")}
            >
              {t("finish")}
            </button>
          </section>
        ))}

      {phase === "end" &&
        (finished ? (
          <section className="text-center">
            <h2 id="toughday-title" className="font-serif text-3xl">
              {t("closing")}
            </h2>
            <Link
              to="/today"
              className="mt-4 inline-flex min-h-[48px] items-center rounded-full bg-forest px-6 py-2 text-cream"
            >
              {t("finish")}
            </Link>
          </section>
        ) : (
          <section>
            <p className="mt-1 text-sm opacity-60">{t("stepEnd")}</p>
            <h2 id="toughday-title" className="font-serif text-3xl">
              {t("didItHelp")}
            </h2>
            <div className="mt-3 flex gap-2" role="radiogroup" aria-label={t("didItHelp")}>
              {(
                [
                  ["yes", t("helpedYes")],
                  ["partly", t("helpedPartly")],
                  ["no", t("helpedNo")],
                ] as Array<[Helped, string]>
              ).map(([v, label]) => (
                <button
                  key={v}
                  role="radio"
                  aria-checked={helped === v}
                  onClick={() => setHelped(v)}
                  className={`min-h-[48px] flex-1 rounded-full px-4 py-2 ${
                    helped === v ? "bg-forest text-cream" : "bg-forest/10"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <h3 className="mt-5 font-serif text-xl">{t("moodAfter")}</h3>
            <div className="mt-2 flex gap-2" role="radiogroup" aria-label={t("moodAfter")}>
              {MOOD_LABELS.map((m) => (
                <button
                  key={m}
                  role="radio"
                  aria-checked={moodAfter === Number(m)}
                  onClick={() => setMoodAfter(Number(m))}
                  className={`min-h-[48px] min-w-[48px] flex-1 rounded-2xl font-serif text-xl ${
                    moodAfter === Number(m)
                      ? "bg-forest text-cream"
                      : "bg-forest/10"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button
              className="mt-5 min-h-[48px] w-full rounded-full bg-forest px-4 py-2 text-cream"
              onClick={saveEnd}
            >
              {t("finish")}
            </button>
          </section>
        ))}
    </div>
  );
}
