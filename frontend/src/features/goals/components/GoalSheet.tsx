import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Goal, GoalFormValues } from "@/api/goals";
import { reminderSentence, useCreateGoal, useUpdateGoal, validateGoalForm } from "@/api/goals";

const CATEGORIES = ["movement", "rest", "nutrition", "mind", "social", "recovery", "selfcare"] as const;

function emptyValues(): GoalFormValues {
  return {
    title: "",
    category: "selfcare",
    frequency: "daily",
    target_count: 3,
    reminder_enabled: false,
    reminder_time: "18:00",
    reminder_weekdays: [0, 1, 2, 3, 4, 5, 6],
  };
}

function fromGoal(goal: Goal): GoalFormValues {
  return {
    title: goal.title,
    category: goal.category,
    frequency: goal.frequency,
    target_count: goal.target_count,
    reminder_enabled: goal.reminder_enabled,
    reminder_time: goal.reminder_time ?? "18:00",
    reminder_weekdays: goal.reminder_weekdays,
  };
}

const DAY_INDEX = [0, 1, 2, 3, 4, 5, 6]; // Monday-first, matches backend

export function GoalSheet({ goal, onClose }: { goal: Goal | null; onClose: () => void }) {
  const { t } = useTranslation("goals");
  const simpleT = (key: string) => t(key);
  const [values, setValues] = useState<GoalFormValues>(goal ? fromGoal(goal) : emptyValues());
  const [touched, setTouched] = useState(false);
  const create = useCreateGoal();
  const update = goal ? useUpdateGoal(goal.id) : null;

  const errors = useMemo(
    () => (touched ? validateGoalForm(values, simpleT) : {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values, touched],
  );

  const preview = reminderSentence(values, t("weekdaysShort", { returnObjects: true }) as string[], t("form.preview"));

  const set = <K extends keyof GoalFormValues>(key: K, value: GoalFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const toggleDay = (day: number) =>
    set(
      "reminder_weekdays",
      values.reminder_weekdays.includes(day)
        ? values.reminder_weekdays.filter((d) => d !== day)
        : [...values.reminder_weekdays, day],
    );

  const submit = () => {
    setTouched(true);
    if (Object.keys(validateGoalForm(values, simpleT)).length > 0) return;
    const done = () => onClose();
    if (goal && update) update.mutate(values, { onSuccess: done });
    else create.mutate(values, { onSuccess: done });
  };

  const dayNames = t("weekdaysShort", { returnObjects: true }) as string[];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="presentation">
      <div className="absolute inset-0 bg-[#222d287a] backdrop-blur-[5px]" onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={goal ? t("form.editTitle") : t("form.newTitle")}
        className="relative max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-t-[28px] bg-paper p-6 sm:rounded-[28px]"
      >
        <h2 className="font-serif text-[27px] text-ink">{goal ? t("form.editTitle") : t("form.newTitle")}</h2>

        <label className="mt-4 block">
          <span className="text-[11px] font-bold uppercase tracking-[1.5px] text-forest">{t("form.nameLabel")}</span>
          <input
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder={t("form.namePlaceholder")}
            maxLength={120}
            className="mt-1 w-full rounded-[14px] border border-line bg-cream px-4 py-3 text-[15px] text-ink"
          />
          {errors.title && <span className="mt-1 block text-[12px] text-[#b4533c]">{errors.title}</span>}
        </label>

        <fieldset className="mt-4">
          <legend className="text-[11px] font-bold uppercase tracking-[1.5px] text-forest">{t("form.categoryLabel")}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set("category", c)}
                aria-pressed={values.category === c}
                className={`min-h-[44px] rounded-full px-4 text-[14px] font-medium ${
                  values.category === c ? "bg-forest text-paper" : "bg-sage-light text-ink"
                }`}
              >
                {t(`categories.${c}`)}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="text-[11px] font-bold uppercase tracking-[1.5px] text-forest">{t("form.rhythmLabel")}</legend>
          <div className="mt-2 flex gap-2" role="group">
            <button
              type="button"
              onClick={() => set("frequency", "daily")}
              aria-pressed={values.frequency === "daily"}
              className={`min-h-[44px] flex-1 rounded-full text-[14px] font-medium ${
                values.frequency === "daily" ? "bg-forest text-paper" : "bg-sage-light text-ink"
              }`}
            >
              {t("form.daily")}
            </button>
            <button
              type="button"
              onClick={() => set("frequency", "weekly")}
              aria-pressed={values.frequency === "weekly"}
              className={`min-h-[44px] flex-1 rounded-full text-[14px] font-medium ${
                values.frequency === "weekly" ? "bg-forest text-paper" : "bg-sage-light text-ink"
              }`}
            >
              {t("form.weekly")}
            </button>
          </div>
          {values.frequency === "weekly" && (
            <div className="mt-3 flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={7}
                value={values.target_count}
                onChange={(e) => set("target_count", Number(e.target.value))}
                aria-label={t("form.weekly")}
                className="flex-1"
              />
              <span className="font-serif text-[21px] text-ink tabular-nums">
                {t("form.timesPerWeek", { count: values.target_count })}
              </span>
            </div>
          )}
          {errors.target_count && <span className="mt-1 block text-[12px] text-[#b4533c]">{errors.target_count}</span>}
        </fieldset>

        <fieldset className="mt-4">
          <legend className="text-[11px] font-bold uppercase tracking-[1.5px] text-forest">{t("form.reminderLabel")}</legend>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => set("reminder_enabled", false)}
              aria-pressed={!values.reminder_enabled}
              className={`min-h-[44px] flex-1 rounded-full text-[14px] font-medium ${
                !values.reminder_enabled ? "bg-forest text-paper" : "bg-sage-light text-ink"
              }`}
            >
              {t("form.reminderOff")}
            </button>
            <button
              type="button"
              onClick={() => set("reminder_enabled", true)}
              aria-pressed={values.reminder_enabled}
              className={`min-h-[44px] flex-1 rounded-full text-[14px] font-medium ${
                values.reminder_enabled ? "bg-forest text-paper" : "bg-sage-light text-ink"
              }`}
            >
              {t("form.reminderOn")}
            </button>
          </div>
          {values.reminder_enabled && (
            <>
              <label className="mt-3 block">
                <span className="text-[14px] font-medium text-ink">{t("form.timeLabel")}</span>
                <input
                  type="time"
                  value={values.reminder_time ?? ""}
                  onChange={(e) => set("reminder_time", e.target.value || null)}
                  className="mt-1 w-full rounded-[14px] border border-line bg-cream px-4 py-3 text-[15px]"
                />
                {errors.reminder_time && <span className="mt-1 block text-[12px] text-[#b4533c]">{errors.reminder_time}</span>}
              </label>
              <div className="mt-3 flex justify-between gap-1" role="group" aria-label={t("form.daysLabel")}>
                {DAY_INDEX.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    aria-pressed={values.reminder_weekdays.includes(d)}
                    aria-label={dayNames[i]}
                    className={`flex h-11 w-11 items-center justify-center rounded-full text-[12px] font-semibold ${
                      values.reminder_weekdays.includes(d) ? "bg-forest text-paper" : "bg-sage-light text-muted"
                    }`}
                  >
                    {dayNames[i].slice(0, 2)}
                  </button>
                ))}
              </div>
              {errors.reminder_weekdays && (
                <span className="mt-1 block text-[12px] text-[#b4533c]">{errors.reminder_weekdays}</span>
              )}
            </>
          )}
        </fieldset>

        <p aria-live="polite" className="mt-4 rounded-[14px] bg-cream px-4 py-3 font-serif text-[17px] italic text-ink">
          {values.reminder_enabled ? preview : t("form.noReminderPreview")}
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[46px] flex-1 rounded-[14px] border border-line text-[15px] font-medium text-ink"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={submit}
            className="min-h-[46px] flex-1 rounded-[14px] bg-forest text-[15px] font-semibold text-paper"
          >
            {t("save")}
          </button>
        </div>
      </section>
    </div>
  );
}
