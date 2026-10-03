// f-care · TopStrategiesCards — the 2 best strategies with evidence
// (SCREENS §3.3, K5). Exported for f-daily's /today via features/support.

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToolkit } from "../../api/support";

export function TopStrategiesCards() {
  const { t } = useTranslation("support");
  const toolkit = useToolkit();

  if (toolkit.isPending) {
    return (
      <section aria-busy="true" className="grid gap-4 sm:grid-cols-2">
        <p>{t("loading")}</p>
      </section>
    );
  }
  if (toolkit.isError) return null;

  const top = (toolkit.data?.strategies ?? []).slice(0, 2);
  if (top.length === 0) {
    return (
      <section className="rounded-3xl bg-paper p-5">
        <p className="text-sm opacity-70">{t("emptyStrategies")}</p>
      </section>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {top.map((s, i) => (
        <article
          key={s.code}
          className={
            i === 0
              ? "rounded-3xl bg-forest p-5 text-cream"
              : "rounded-3xl bg-paper p-5"
          }
        >
          {i === 0 && (
            <div className="text-xs uppercase tracking-widest opacity-70">
              {t("strategiesTitle")}
            </div>
          )}
          <h3 className="mt-1 font-serif text-xl">{s.title}</h3>
          <p className="mt-1 text-sm opacity-80">
            {s.total_count > 0
              ? t("helpedEvidence", {
                  helped: s.helped_count,
                  total: s.total_count,
                })
              : t("helpedEvidenceNone")}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm tabular-nums opacity-70">
              {t("minutes", { count: s.duration_minutes })}
            </span>
            <Link
              to="/tough-day"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-cream/15 px-4 py-2 text-sm"
              aria-label={`${t("start")}: ${s.title}`}
            >
              {t("start")} →
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
