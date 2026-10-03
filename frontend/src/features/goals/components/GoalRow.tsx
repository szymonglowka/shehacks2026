import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Check, Pencil, Trash2 } from "lucide-react";
import type { Goal } from "@/api/goals";
import { useDeleteGoal, useLogGoal } from "@/api/goals";
import { PetalWeek } from "./PetalWeek";
import "./petal-close.css";

export function doneCount(goal: Goal): number {
  return goal.progress_this_week.filter(Boolean).length;
}

export function totalCount(goal: Goal): number {
  return goal.frequency === "daily" ? 7 : goal.target_count;
}

export function GoalRow({ goal, onEdit }: { goal: Goal; onEdit: (goal: Goal) => void }) {
  const { t } = useTranslation("goals");
  const log = useLogGoal(goal.id);
  const del = useDeleteGoal(goal.id);
  const [closing, setClosing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const done = doneCount(goal);
  const total = totalCount(goal);

  const toggle = () => {
    if (!goal.done_today) {
      setClosing(true);
      window.setTimeout(() => setClosing(false), 600);
    }
    log.mutate(!goal.done_today);
  };

  return (
    <li className="flex items-center gap-4 rounded-[20px] bg-paper p-4 shadow-[var(--shadow)]">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={goal.done_today}
        aria-label={goal.done_today ? t("logUndone") : t("logDone")}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors ${
          goal.done_today
            ? "border-forest bg-forest text-paper"
            : "border-line bg-cream text-transparent"
        } ${closing ? "animate-petal-close" : ""}`}
      >
        <Check size={20} strokeWidth={2.4} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="font-serif text-[19px] leading-snug text-ink">{goal.title}</p>
        {goal.description && <p className="truncate text-[12px] text-muted">{goal.description}</p>}
        <p className="mt-1 flex items-center gap-2 text-[12px] text-muted">
          <span className="font-serif text-[17px] text-forest tabular-nums">
            {goal.current_streak} {t(goal.current_streak === 1 ? "streakDay" : "streakDays", { count: goal.current_streak })}
          </span>
          {goal.reminder_enabled && goal.reminder_time && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sage-light px-2 py-0.5">
              <Bell size={13} strokeWidth={1.8} />
              {t("reminderAt", { time: goal.reminder_time })}
            </span>
          )}
        </p>
      </div>
      <PetalWeek done={done} total={total} />
      <div className="flex shrink-0 flex-col gap-1">
        <button
          type="button"
          onClick={() => onEdit(goal)}
          aria-label={t("edit")}
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-sage-light"
        >
          <Pencil size={18} strokeWidth={1.8} />
        </button>
        {confirming ? (
          <button
            type="button"
            onClick={() => del.mutate()}
            className="rounded-full bg-[#b4533c] px-2 py-1 text-[11px] font-semibold text-paper"
          >
            {t("deleteConfirm")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={t("delete")}
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-sage-light"
          >
            <Trash2 size={18} strokeWidth={1.8} />
          </button>
        )}
      </div>
    </li>
  );
}
