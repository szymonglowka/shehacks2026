import { useTranslation } from "react-i18next";
import { ArrowRight, Plus, Sprout } from "lucide-react";
import type { GoalTemplate } from "@/api/goals";
import { useCreateGoal } from "@/api/goals";

export function RecommendedCarousel({ items }: { items: GoalTemplate[] }) {
  const { t } = useTranslation("goals");
  const create = useCreateGoal();
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="recommended-heading">
      <h2 id="recommended-heading" className="font-serif text-[27px] text-ink">
        {t("recommendedTitle")}
      </h2>
      <div className="-mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
        {items.map((tpl) => (
          <article
            key={tpl.id}
            className="w-[260px] shrink-0 snap-start rounded-[20px] bg-[#f1eff5] p-4"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-lavender text-ink">
              <Sprout size={22} strokeWidth={1.8} />
            </div>
            <h3 className="mt-2 font-serif text-[21px] leading-tight text-ink">{tpl.title}</h3>
            {tpl.reason && <p className="mt-1 text-[12px] font-medium text-[#684b3d]">{tpl.reason}</p>}
            <p className="mt-1 text-[12px] text-muted">{tpl.description}</p>
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
                  reminder_time: tpl.default_reminder_time,
                  reminder_weekdays: tpl.default_reminder_time ? [0, 1, 2, 3, 4, 5, 6] : [],
                })
              }
              className="mt-3 inline-flex min-h-[44px] items-center gap-1 text-[14px] font-semibold text-forest"
            >
              <Plus size={18} strokeWidth={1.8} /> {t("addGoal")}
              <ArrowRight size={16} strokeWidth={1.8} />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
