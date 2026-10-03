// f-care · Support hub (/support) per SCREENS §3.8.

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useHelplines, useToolkit } from "../../api/support";
import { TopStrategiesCards } from "./TopStrategiesCards";
import { CircleSection } from "../circle/CircleSection";
import { WinsJarCard } from "../wins/WinsCards";

export function SupportPage() {
  const { t } = useTranslation("support");
  const toolkit = useToolkit();
  const helplines = useHelplines();

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">
      <div className="text-xs uppercase tracking-widest opacity-60">
        {t("subtitle")}
      </div>
      <h1 className="font-serif text-4xl">{t("title")}</h1>

      <section
        aria-labelledby="hard-day-title"
        className="mt-6 rounded-3xl bg-forest p-6 text-cream"
      >
        <h2 id="hard-day-title" className="font-serif text-2xl">
          {t("hardDayCardTitle")}
        </h2>
        <p className="mt-1 opacity-85">{t("hardDayCardText")}</p>
        <Link
          to="/tough-day"
          className="mt-4 inline-flex min-h-[48px] items-center rounded-full bg-cream px-6 py-2 text-forest"
        >
          {t("hardDayCta")}
        </Link>
      </section>

      <section aria-label={t("strategiesTitle")} className="mt-8">
        <h2 className="font-serif text-2xl">{t("strategiesTitle")}</h2>
        <p className="text-sm opacity-70">{t("strategiesSubtitle")}</p>
        <div className="mt-3">
          <TopStrategiesCards />
        </div>
        {(toolkit.data?.strategies.length ?? 0) > 2 && (
          <p className="mt-2 text-sm">
            <Link to="/tough-day" className="underline">
              {t("seeAll")}
            </Link>
          </p>
        )}
      </section>

      <div className="mt-8">
        <CircleSection />
      </div>

      <div className="mt-8">
        <WinsJarCard />
      </div>

      <section aria-labelledby="helplines-title" className="mt-8">
        <h2 id="helplines-title" className="font-serif text-2xl">
          {t("helplinesTitle")}
        </h2>
        <p className="text-sm opacity-70">{t("helplinesSubtitle")}</p>
        <ul className="mt-3 grid gap-3">
          {(helplines.data ?? []).map((h) => (
            <li
              key={h.code}
              className="flex items-center justify-between rounded-3xl bg-paper p-4"
            >
              <div>
                <div className="font-medium">{h.label}</div>
                <div className="text-sm opacity-70">
                  {h.number} · {h.hours}
                </div>
              </div>
              <a
                href={h.number_href}
                className="inline-flex min-h-[44px] items-center rounded-full bg-forest px-5 py-2 text-cream"
              >
                {t("callNow")}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="survey-title" className="mt-8 rounded-3xl bg-paper p-5">
        <h2 id="survey-title" className="font-serif text-xl">
          {t("surveyTitle")}
        </h2>
        <p className="mt-1 text-sm opacity-70">{t("surveyText")}</p>
        <Link to="/onboarding" className="mt-2 inline-block min-h-[44px] underline">
          {t("surveyCta")}
        </Link>
      </section>
    </main>
  );
}
