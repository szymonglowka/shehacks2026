import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Plus } from "lucide-react";
import type { Goal } from "@/api/goals";
import { useGoals, useLogGoal, useRecommendedGoals } from "@/api/goals";
import { GoalRow } from "./components/GoalRow";
import { GoalSheet } from "./components/GoalSheet";
import { RecommendedCarousel } from "./components/RecommendedCarousel";

export default function GoalsPage() {
  const { t } = useTranslation("goals");
  const { data: goals, isLoading, isError } = useGoals();
  const { data: recommended } = useRecommendedGoals();
  const [editing, setEditing] = useState<Goal | null | "new">(null);

  const active = (goals ?? []).filter((g) => g.is_active);
  const weekDone = active.reduce(
    (sum, g) => sum + g.progress_this_week.filter(Boolean).length,
    0,
  );
  const weekTotal = active.reduce(
    (sum, g) => sum + (g.frequency === "daily" ? 7 : g.target_count),
    0,
  );

  return (
    <main className="mx-auto max-w-[1080px] px-4 pb-24">
      <header className="pt-6">
        <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-forest">{t("title")}</p>
        <h1 className="font-serif text-[clamp(38px,4vw,53px)] leading-[1.06] tracking-[-1.2px] text-ink">
          {t("title")}
        </h1>
        {weekTotal > 0 && (
          <p className="mt-1 font-serif text-[21px] text-forest tabular-nums">
            {t("weekCount", { done: weekDone, total: weekTotal })}
          </p>
        )}
      </header>

      {isLoading && (
        <ul aria-label={t("title")} className="mt-6 space-y-3">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-[92px] animate-pulse rounded-[20px] bg-sage-light" />
          ))}
        </ul>
      )}
      {isError && <p className="mt-6 text-[14px] text-[#b4533c]">Otula</p>}

      {!isLoading && !isError && active.length === 0 && (
        <section className="mt-6 rounded-[22px] bg-paper p-8 text-center shadow-[var(--shadow)]">
          <h2 className="font-serif text-[27px] text-ink">{t("emptyTitle")}</h2>
          <p className="mt-2 text-[14px] text-muted">{t("emptyBody")}</p>
        </section>
      )}

      <ul className="mt-6 space-y-3">
        {active.map((goal) => (
          <GoalRow key={goal.id} goal={goal} onEdit={(g) => setEditing(g)} />
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setEditing("new")}
        className="mt-4 inline-flex min-h-[46px] items-center gap-2 rounded-[14px] bg-forest px-5 text-[15px] font-semibold text-paper"
      >
        <Plus size={18} strokeWidth={1.8} /> {t("addGoal")}
      </button>

      <div className="mt-8">
        <RecommendedCarousel items={recommended ?? []} />
      </div>

      {editing && (
        <GoalSheet goal={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
      )}
    </main>
  );
}

export function GoalsTeaser() {
  const { t } = useTranslation("goals");
  const { data } = useGoals();
  const active = (data ?? []).filter((g) => g.is_active).slice(0, 3);
  return (
    <section aria-label={t("title")} className="rounded-[22px] bg-paper p-5 shadow-[var(--shadow)]">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-[21px] text-ink">{t("title")}</h2>
        <Link
          to="/goals"
          aria-label={t("title")}
          className="inline-flex min-h-[44px] items-center gap-1 text-[14px] font-semibold text-forest"
        >
          <ArrowRight size={16} strokeWidth={1.8} />
        </Link>
      </div>
      <ul className="mt-2 space-y-1">
        {active.map((goal) => (
          <TeaserRow key={goal.id} goal={goal} />
        ))}
      </ul>
    </section>
  );
}

function TeaserRow({ goal }: { goal: Goal }) {
  const log = useLogGoal(goal.id);
  return (
    <li>
      <button
        type="button"
        onClick={() => log.mutate(!goal.done_today)}
        aria-pressed={goal.done_today}
        className="flex min-h-[44px] w-full items-center gap-3 text-left"
      >
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full border ${
            goal.done_today ? "border-forest bg-forest text-paper" : "border-line"
          }`}
        >
          {goal.done_today && <Check size={14} strokeWidth={2.4} />}
        </span>
        <span className="text-[14px] text-ink">{goal.title}</span>
      </button>
    </li>
  );
}
