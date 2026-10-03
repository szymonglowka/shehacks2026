import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import type { Goal } from "@/api/goals";
import { useLogGoal, useTodayGoals } from "@/api/goals";

/** Figma "Dzisiaj" card: checkboxes, "1 z 3", progress bar. Exported for the Today dashboard. */
export function TodayGoalsCard() {
  const { t } = useTranslation("goals");
  const { data, isLoading } = useTodayGoals();
  const goals = (data ?? []).filter((g) => g.is_active).slice(0, 4);
  const done = goals.filter((g) => g.done_today).length;

  return (
    <section aria-label={t("todayTitle")} className="rounded-[22px] bg-paper p-5 shadow-[var(--shadow)]">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-[21px] text-ink">{t("todayTitle")}</h2>
        <span className="text-[14px] font-semibold text-ink tabular-nums">
          {t("todayDoneOf", { done, total: goals.length })}
        </span>
      </div>
      {isLoading && <div className="mt-3 h-[120px] animate-pulse rounded-[14px] bg-sage-light" />}
      {!isLoading && goals.length === 0 && (
        <p className="mt-2 text-[14px] text-muted">{t("todayEmpty")}</p>
      )}
      <ul className="mt-2 divide-y divide-line">
        {goals.map((goal) => (
          <LiveRow key={goal.id} goal={goal} />
        ))}
      </ul>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-sage-light"
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={Math.max(goals.length, 1)}
        aria-label={t("todayDoneOf", { done, total: goals.length })}
      >
        <div
          className="h-full rounded-full bg-forest transition-[width]"
          style={{ width: goals.length ? `${(done / goals.length) * 100}%` : "0%" }}
        />
      </div>
      <Link to="/goals" className="mt-2 inline-block min-h-[44px] py-2 text-[14px] font-semibold text-forest">
        {t("title")} →
      </Link>
    </section>
  );
}

function LiveRow({ goal }: { goal: Goal }) {
  const log = useLogGoal(goal.id);
  return (
    <li>
      <button
        type="button"
        onClick={() => log.mutate(!goal.done_today)}
        aria-pressed={goal.done_today}
        className="flex min-h-[44px] w-full items-center gap-3 py-1.5 text-left"
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
            goal.done_today ? "border-forest bg-forest text-paper" : "border-line bg-cream"
          }`}
        >
          {goal.done_today && <Check size={14} strokeWidth={2.4} />}
        </span>
        <span className={`text-[14px] ${goal.done_today ? "text-muted line-through" : "text-ink"}`}>
          {goal.title}
        </span>
      </button>
    </li>
  );
}
