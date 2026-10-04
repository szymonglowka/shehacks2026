import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Printer } from "lucide-react";
import { Brand } from "@/components/Brand";
import type { VisitReport } from "@/api/visit";
import { useAddVisitQuestion, useToggleVisitQuestion, useVisitReport } from "@/api/visit";
import "../print.css";

type Weeks = 2 | 4 | 6;

const SECTIONS = ["basics", "moodSleep", "epds", "symptoms", "redFlags", "questions"] as const;
type Section = (typeof SECTIONS)[number];

function MoodSleepChart({ series }: { series: VisitReport["mood_sleep_series"] }) {
  const W = 640;
  const H = 180;
  const PAD = 24;
  const points = series.filter((p) => p.mood !== null);
  if (points.length < 2) return null;
  const x = (i: number) => PAD + (i / (points.length - 1)) * (W - PAD * 2);
  const yMood = (m: number) => H - PAD - ((m - 1) / 4) * (H - PAD * 2);
  const ySleep = (s: number) => H - PAD - (Math.min(s, 10) / 10) * (H - PAD * 2);
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${yMood(p.mood ?? 3).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="mood">
      {series.map((p, i) =>
        p.sleep_hours !== null ? (
          <rect
            key={p.date}
            x={x(i) - 4}
            y={ySleep(p.sleep_hours)}
            width={8}
            height={H - PAD - ySleep(p.sleep_hours)}
            className="fill-sage"
            opacity={0.7}
          />
        ) : null,
      )}
      <line x1={PAD} x2={W - PAD} y1={yMood(1)} y2={yMood(1)} stroke="var(--line)" strokeWidth={1} />
      <line x1={PAD} x2={W - PAD} y1={yMood(5)} y2={yMood(5)} stroke="var(--line)" strokeWidth={1} />
      <text x={2} y={yMood(5) + 4} fontSize={11} fill="var(--muted)">5</text>
      <text x={2} y={yMood(1) + 4} fontSize={11} fill="var(--muted)">1</text>
      <path d={line} fill="none" stroke="var(--forest)" strokeWidth={2.5} strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={p.date} cx={x(i)} cy={yMood(p.mood ?? 3)} r={3.5} fill="var(--forest)" />
      ))}
    </svg>
  );
}

function EpdsChart({ history }: { history: VisitReport["epds_history"] }) {
  if (history.length === 0) return null;
  const W = 640;
  const H = 140;
  const PAD = 28;
  const max = 30;
  const x = (i: number) => PAD + (history.length === 1 ? (W - PAD * 2) / 2 : (i / (history.length - 1)) * (W - PAD * 2));
  const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="epds">
      <rect x={PAD} y={y(13)} width={W - PAD * 2} height={y(10) - y(13)} fill="#ddd8e9" opacity={0.5} />
      <rect x={PAD} y={y(max)} width={W - PAD * 2} height={y(13) - y(max)} fill="#e9b9a0" opacity={0.35} />
      {history.map((h, i) => (
        <g key={h.date}>
          <circle cx={x(i)} cy={y(h.total)} r={5} fill="#3f6959" />
          <text x={x(i)} y={y(h.total) - 10} fontSize={12} textAnchor="middle" fill="var(--ink)" fontWeight={600}>
            {h.total}
          </text>
          <text x={x(i)} y={H - 8} fontSize={11} textAnchor="middle" fill="var(--muted)">
            {h.date.slice(5)}
          </text>
        </g>
      ))}
      <text x={W - PAD} y={y(13) - 4} fontSize={11} textAnchor="end" fill="var(--muted)">13</text>
    </svg>
  );
}

export default function ReportPage() {
  const { t } = useTranslation("report");
  const [weeks, setWeeks] = useState<Weeks>(4);
  const [sections, setSections] = useState<Record<Section, boolean>>({
    basics: true,
    moodSleep: true,
    epds: true,
    symptoms: true,
    redFlags: true,
    questions: true,
  });
  const [draft, setDraft] = useState("");
  const { data: report, isLoading, isError } = useVisitReport(weeks);
  const addQuestion = useAddVisitQuestion();

  const toggleSection = (s: Section) => setSections((prev) => ({ ...prev, [s]: !prev[s] }));

  const add = () => {
    if (!draft.trim()) return;
    addQuestion.mutate(draft.trim(), { onSuccess: () => setDraft("") });
  };

  return (
    <main className="report-page mx-auto max-w-[1080px] px-4 pb-24">
      <header className="report-no-print pt-6">
        <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-forest">{t("title")}</p>
        <h1 className="font-serif text-[clamp(38px,4vw,53px)] leading-[1.06] tracking-[-1.2px] text-ink">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-[60ch] text-[15px] text-muted">{t("subtitle")}</p>
      </header>

      <div className="report-no-print mt-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-2" role="group" aria-label={t("title")}>
          {([2, 4, 6] as Weeks[]).map((w) => (
            <button
              key={w}
              onClick={() => setWeeks(w)}
              aria-pressed={weeks === w}
              className={`min-h-[44px] rounded-full px-5 text-[14px] font-medium ${weeks === w ? "bg-forest text-paper" : "bg-sage-light text-ink"}`}
            >
              {t("weeks", { count: w })}
            </button>
          ))}
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex min-h-[46px] items-center gap-2 rounded-[14px] bg-forest px-5 text-[15px] font-semibold text-paper"
        >
          <Printer size={18} strokeWidth={1.8} /> {t("print")}
        </button>
      </div>

      <fieldset className="report-no-print mt-4 rounded-[20px] bg-paper p-4 shadow-[var(--shadow)]">
        <legend className="px-2 text-[11px] font-bold uppercase tracking-[1.5px] text-forest">{t("sections")}</legend>
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => toggleSection(s)}
              aria-pressed={sections[s]}
              className={`min-h-[44px] rounded-full px-4 text-[14px] font-medium ${sections[s] ? "bg-forest text-paper" : "bg-sage-light text-ink"}`}
            >
              {t(`section.${s}`)}
            </button>
          ))}
        </div>
      </fieldset>

      {isLoading && <div className="mt-6 h-[500px] animate-pulse rounded-[8px] bg-sage-light" />}
      {isError && <p className="mt-6 text-[14px] text-[#b4533c]">Otula</p>}

      {report && (
        <div className="report-sheet mx-auto mt-6 max-w-[820px] rounded-[8px] bg-paper p-6 shadow-[var(--shadow)] sm:p-10">
          <header className="border-b border-line pb-4">
            <div className="flex items-center gap-3">
              <Brand compact />
              <span className="font-serif text-[22px] text-ink">· {t("title").toLowerCase()}</span>
            </div>
            <p className="mt-1 text-[13px] text-muted">{t("forPerson", { name: report.profile.display_name })}</p>
          </header>

          {sections.basics && (
            <section className="mt-5">
              <h2 className="font-serif text-[24px] text-ink">{t("section.basics")}</h2>
              <dl className="mt-2 space-y-1 text-[14px] text-ink">
                {report.profile.postpartum_day !== null && (
                  <div className="flex gap-2">
                    <dt className="text-muted">·</dt>
                    <dd>{t("basics.postpartumDay", { day: report.profile.postpartum_day, week: report.profile.postpartum_week })}</dd>
                  </div>
                )}
                <div className="flex gap-2">
                  <dt className="text-muted">{t("basics.delivery")}:</dt>
                  <dd>{t(`basics.deliveryTypes.${report.profile.delivery_type ?? "undisclosed"}`)}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted">{t("basics.feeding")}:</dt>
                  <dd>{t(`basics.feedingTypes.${report.profile.feeding ?? "na"}`)}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted">·</dt>
                  <dd>{t("basics.range", { from: report.range.from, to: report.range.to })}</dd>
                </div>
              </dl>
            </section>
          )}

          {sections.moodSleep && (
            <section className="mt-6">
              <h2 className="font-serif text-[24px] text-ink">{t("moodTitle")}</h2>
              {report.mood_sleep_series.length >= 2 ? (
                <MoodSleepChart series={report.mood_sleep_series} />
              ) : (
                <p className="text-[14px] text-muted">{t("moodEmpty")}</p>
              )}
            </section>
          )}

          {sections.epds && (
            <section className="mt-6">
              <h2 className="font-serif text-[24px] text-ink">{t("epdsTitle")}</h2>
              {report.epds_history.length === 0 ? (
                <p className="text-[14px] text-muted">{t("epdsEmpty")}</p>
              ) : (
                <>
                  <EpdsChart history={report.epds_history} />
                  <table className="mt-2 w-full text-[14px]">
                    <tbody>
                      {report.epds_history.map((h) => (
                        <tr key={h.date} className="border-b border-line">
                          <td className="py-2 text-muted tabular-nums">{h.date}</td>
                          <td className="py-2 text-right font-serif text-[19px] tabular-nums">{h.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-2 text-[13px] italic text-muted">{t("epdsNote")}</p>
                </>
              )}
            </section>
          )}

          {sections.symptoms && (
            <section className="mt-6">
              <h2 className="font-serif text-[24px] text-ink">{t("symptomsTitle")}</h2>
              {report.symptom_frequency.length === 0 ? (
                <p className="text-[14px] text-muted">{t("symptomsEmpty")}</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {report.symptom_frequency.map((s) => (
                    <li key={s.code} className="flex items-center gap-3 text-[14px]">
                      <span className="w-40 shrink-0 text-ink">{s.code.replace(/_/g, " ")}</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-sage-light">
                        <span
                          className="block h-full rounded-full bg-forest"
                          style={{ width: `${Math.min(100, (s.count / weeks / 7) * 100 * 3)}%` }}
                        />
                      </span>
                      <span className="w-12 shrink-0 text-right tabular-nums text-muted">{t("times", { count: s.count })}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {sections.redFlags && (
            <section className="mt-6">
              <h2 className="font-serif text-[24px] text-ink">{t("redFlagsTitle")}</h2>
              {report.red_flags.length === 0 ? (
                <p className="text-[14px] text-muted">{t("redFlagsEmpty")}</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {report.red_flags.map((f, i) => (
                    <li key={i} className="rounded-[12px] bg-[#b4533c]/10 px-3 py-2 text-[14px] text-[#b4533c]">
                      {f.date} — {f.code}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {sections.questions && (
            <section className="mt-6">
              <h2 className="font-serif text-[24px] text-ink">{t("questionsTitle")}</h2>
              {report.questions.length === 0 ? (
                <p className="text-[14px] text-muted">{t("questionsEmpty")}</p>
              ) : (
                <QuestionsList questions={report.questions} />
              )}
              <div className="report-no-print mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t("questionPlaceholder")}
                  aria-label={t("addQuestion")}
                  className="min-h-[46px] flex-1 rounded-[14px] border border-line bg-cream px-4 text-[15px]"
                />
                <button
                  onClick={add}
                  disabled={!draft.trim()}
                  className="inline-flex min-h-[46px] items-center justify-center gap-1 rounded-[14px] bg-forest px-5 text-[15px] font-semibold text-paper disabled:opacity-40"
                >
                  <Plus size={18} strokeWidth={1.8} /> {t("addQuestion")}
                </button>
              </div>
            </section>
          )}

          <footer className="mt-8 border-t border-line pt-3">
            <p className="text-[12px] italic text-muted">{t("disclaimer")}</p>
          </footer>
        </div>
      )}
    </main>
  );
}

function QuestionsList({ questions }: { questions: VisitReport["questions"] }) {
  return (
    <ul className="mt-2 space-y-2">
      {questions.map((q) => (
        <QuestionItem key={q.id} id={q.id} text={q.text} done={q.done} />
      ))}
    </ul>
  );
}

function QuestionItem({ id, text, done }: { id: number; text: string; done: boolean }) {
  const toggle = useToggleVisitQuestion(id);
  return (
    <li className="flex items-start gap-3 rounded-[12px] border border-line px-3 py-2">
      <input
        type="checkbox"
        checked={done}
        onChange={(e) => toggle.mutate(e.target.checked)}
        aria-label={text}
        className="mt-1 h-5 w-5 shrink-0 accent-[#3f6959]"
      />
      <span className={`text-[14px] ${done ? "text-muted line-through" : "text-ink"}`}>{text}</span>
    </li>
  );
}
