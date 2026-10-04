import { useTranslation } from "react-i18next";
import { ArrowRight, Plus, Sprout } from "lucide-react";
import type { GoalTemplate } from "@/api/goals";
import { shortTime, useCreateGoal } from "@/api/goals";

type ReasonVars = { min?: number | null };

/** Backend templates carry no reason — build the justification from week range + delivery type. */
export function templateReason(
  tpl: GoalTemplate,
  fmt: (key: "reasonFromWeek" | "reasonCesarean", vars: ReasonVars) => string,
): string | null {
  if (tpl.reason) return tpl.reason;
  const parts: string[] = [];
  if (tpl.min_week != null) parts.push(fmt("reasonFromWeek", { min: tpl.min_week }));
  if ((tpl.delivery_types ?? []).includes("cesarean")) parts.push(fmt("reasonCesarean", {}));
  return parts.length > 0 ? parts.join(" ") : null;
}

export function RecommendedCarousel({ items }: { items: GoalTemplate[] }) {
  const { t } = useTranslation("goals");
  const create = useCreateGoal();
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="recommended-heading">
      <h2 id="recommended-heading" className="font-serif text-[27px] text-ink">
        {t("recommendedTitle")}
      </h2>
      <div className="-mx-4 mt-3 no-scrollbar flex snap-x gap-3 overflow-x-auto px-4 pb-2">
        {items.map((tpl) => {
          const reason = templateReason(tpl, (key, vars) => t(key, vars));
          return (
            <article
              key={tpl.id}
              className="flex w-[260px] shrink-0 snap-start flex-col rounded-[20px] bg-[var(--card-lav-bg)] p-4"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-lavender text-ink">
                <Sprout size={22} strokeWidth={1.8} />
              </div>
              <h3 className="mt-2 line-clamp-2 font-serif text-[21px] leading-tight text-ink">{tpl.title}</h3>
              {reason && <p className="mt-1 text-[12px] font-medium text-[var(--peach-ink)]">{reason}</p>}
              <p className="mt-1 line-clamp-3 text-[12px] text-muted">{tpl.description}</p>
              {tpl.safety_note && <p className="mt-1 text-[11px] italic text-muted">{tpl.safety_note}</p>}
              <button
                type="button"
                onClick={() =>
                  create.mutate({
                    title: tpl.title,
                    category: tpl.category,
                    frequency: tpl.frequency,
                    target_count: tpl.target_count,
                    reminder_enabled: Boolean(tpl.default_reminder_time),
                    reminder_time: shortTime(tpl.default_reminder_time) ?? "18:00",
                    reminder_weekdays: tpl.default_reminder_time ? [0, 1, 2, 3, 4, 5, 6] : [],
                  })
                }
                className="mt-auto min-h-[44px] pt-3 text-left text-[14px] font-semibold text-forest"
              >
                <span className="inline-flex items-center gap-1">
                  <Plus size={18} strokeWidth={1.8} /> {t("addGoal")}
                  <ArrowRight size={16} strokeWidth={1.8} />
                </span>
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
