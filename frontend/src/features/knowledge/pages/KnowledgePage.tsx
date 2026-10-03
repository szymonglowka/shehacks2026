import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Clock3, MapPin, Phone } from "lucide-react";
import { useArticles, useSpecialists } from "@/api/content";
import { useHelplines } from "../hooks";

const CATEGORIES = [
  "postpartum_recovery",
  "mental_health",
  "cycle",
  "movement",
  "sleep",
  "nutrition",
  "relationships",
  "breastfeeding",
];

const SPECIALTIES = ["midwife", "physiotherapist", "psychologist", "psychiatrist", "lactation"];

export default function KnowledgePage() {
  const { t, i18n } = useTranslation("knowledge");
  const [tab, setTab] = useState<"articles" | "specialists" | "helplines">("articles");
  const [category, setCategory] = useState<string | null>(null);
  const [specialty, setSpecialty] = useState<string | null>(null);

  return (
    <main className="mx-auto max-w-[1080px] px-4 pb-24">
      <header className="pt-6">
        <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-forest">{t("title")}</p>
        <h1 className="font-serif text-[clamp(38px,4vw,53px)] leading-[1.06] tracking-[-1.2px] text-ink">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-[60ch] text-[15px] text-muted">{t("subtitle")}</p>
      </header>

      <div className="mt-4 flex gap-2" role="tablist" aria-label={t("title")}>
        {(["articles", "specialists", "helplines"] as const).map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`min-h-[44px] rounded-full px-5 text-[14px] font-medium ${
              tab === key ? "bg-forest text-paper" : "bg-sage-light text-ink"
            }`}
          >
            {t(`tabs.${key}`)}
          </button>
        ))}
      </div>

      {tab === "articles" && (
        <ArticlesTab category={category} onCategory={setCategory} />
      )}
      {tab === "specialists" && (
        <SpecialistsTab specialty={specialty} onSpecialty={setSpecialty} />
      )}
      {tab === "helplines" && <HelplinesTab lang={i18n.language} />}
    </main>
  );
}

function ArticlesTab({
  category,
  onCategory,
}: {
  category: string | null;
  onCategory: (c: string | null) => void;
}) {
  const { t } = useTranslation("knowledge");
  const { data, isLoading } = useArticles(category ? { category } : undefined);
  const list = data ?? [];
  const [featured, ...rest] = list;

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2" aria-label={t("allArticles")}>
        <button
          onClick={() => onCategory(null)}
          aria-pressed={!category}
          className={`min-h-[44px] rounded-full px-4 text-[14px] font-medium ${!category ? "bg-forest text-paper" : "bg-sage-light text-ink"}`}
        >
          {t("filterAll")}
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => onCategory(category === c ? null : c)}
            aria-pressed={category === c}
            className={`min-h-[44px] rounded-full px-4 text-[14px] font-medium ${category === c ? "bg-forest text-paper" : "bg-sage-light text-ink"}`}
          >
            {t(`categories.${c}`)}
          </button>
        ))}
      </div>

      {isLoading && <div className="mt-4 h-[280px] animate-pulse rounded-[22px] bg-sage-light" />}
      {!isLoading && list.length === 0 && <p className="mt-6 text-[14px] text-muted">{t("emptyArticles")}</p>}

      {featured && (
        <article className="mt-4 overflow-hidden rounded-[22px] bg-paper shadow-[var(--shadow)]">
          <div className="flex h-40 items-center justify-center bg-sage text-[64px]" aria-hidden="true">
            {featured.cover_emoji}
          </div>
          <div className="p-6">
            <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-forest">{t("featuredForYou")}</p>
            <h2 className="mt-1 font-serif text-[27px] leading-tight text-ink">{featured.title}</h2>
            <p className="mt-2 text-[14px] text-muted">{featured.summary}</p>
            <p className="mt-2 flex items-center gap-1 text-[12px] text-muted">
              <Clock3 size={14} strokeWidth={1.8} /> {t("minRead", { count: featured.reading_minutes })}
            </p>
            <Link
              to={`/knowledge/${featured.slug}`}
              className="mt-3 inline-flex min-h-[44px] items-center text-[15px] font-semibold text-forest"
            >
              → {featured.title}
            </Link>
          </div>
        </article>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {rest.map((a) => (
          <Link
            key={a.slug}
            to={`/knowledge/${a.slug}`}
            className="flex min-h-[44px] gap-3 rounded-[20px] bg-paper p-4 shadow-[var(--shadow)]"
          >
            <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[15px] bg-sage text-[26px]" aria-hidden="true">
              {a.cover_emoji}
            </span>
            <span>
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-[#94654e]">
                {t(`categories.${a.category}`, { defaultValue: a.category })}
              </span>
              <span className="block font-serif text-[19px] leading-snug text-ink">{a.title}</span>
              <span className="mt-0.5 block text-[12px] text-muted">{t("minRead", { count: a.reading_minutes })}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SpecialistsTab({
  specialty,
  onSpecialty,
}: {
  specialty: string | null;
  onSpecialty: (s: string | null) => void;
}) {
  const { t } = useTranslation("knowledge");
  const { data, isLoading } = useSpecialists(specialty ? { specialty } : undefined);
  const list = data ?? [];

  return (
    <div className="mt-6">
      <p className="rounded-[14px] bg-[#f5e1d6] px-4 py-3 text-[13px] text-[#684b3d]">{t("sampleNote")}</p>
      <div className="mt-3 flex flex-wrap gap-2" aria-label={t("specialtyFilter")}>
        <button
          onClick={() => onSpecialty(null)}
          aria-pressed={!specialty}
          className={`min-h-[44px] rounded-full px-4 text-[14px] font-medium ${!specialty ? "bg-forest text-paper" : "bg-sage-light text-ink"}`}
        >
          {t("filterAll")}
        </button>
        {SPECIALTIES.map((s) => (
          <button
            key={s}
            onClick={() => onSpecialty(specialty === s ? null : s)}
            aria-pressed={specialty === s}
            className={`min-h-[44px] rounded-full px-4 text-[14px] font-medium ${specialty === s ? "bg-forest text-paper" : "bg-sage-light text-ink"}`}
          >
            {t(`specialties.${s}`)}
          </button>
        ))}
      </div>

      {isLoading && <div className="mt-4 h-[200px] animate-pulse rounded-[20px] bg-sage-light" />}
      {!isLoading && list.length === 0 && <p className="mt-6 text-[14px] text-muted">{t("emptySpecialists")}</p>}

      <ul className="mt-4 space-y-3">
        {list.map((s) => (
          <li key={s.id} className="rounded-[20px] bg-paper p-4 shadow-[var(--shadow)]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-serif text-[21px] text-ink">{s.name}</h3>
                <p className="text-[13px] text-muted">
                  {t(`specialties.${s.specialty}`, { defaultValue: s.specialty })} ·{" "}
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={13} strokeWidth={1.8} /> {s.online ? t("online") : s.city}
                  </span>
                </p>
              </div>
              {s.is_sample && (
                <span className="shrink-0 rounded-full bg-peach-soft px-3 py-1 text-[11px] font-semibold text-[#684b3d]">
                  {t("sampleBadge")}
                </span>
              )}
            </div>
            <p className="mt-1 text-[14px] text-muted">{s.description}</p>
            {s.phone && (
              <a
                href={`tel:${s.phone.replace(/\s/g, "")}`}
                className="mt-2 inline-flex min-h-[44px] items-center gap-2 rounded-[14px] bg-forest px-4 text-[14px] font-semibold text-paper"
              >
                <Phone size={16} strokeWidth={1.8} /> {t("call")}: {s.phone}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function HelplinesTab({ lang }: { lang: string }) {
  const { data } = useHelplines(lang);
  const list = data ?? [];
  return (
    <ul className="mt-6 space-y-3">
      {list.map((h) => (
        <li
          key={h.id}
          className={`rounded-[20px] p-5 ${h.is_emergency ? "bg-[#b4533c] text-paper" : "bg-paper shadow-[var(--shadow)]"}`}
        >
          <h3 className={`font-serif text-[21px] ${h.is_emergency ? "text-paper" : "text-ink"}`}>{h.name}</h3>
          <p className={`text-[13px] ${h.is_emergency ? "text-paper/90" : "text-muted"}`}>
            {h.hours} · {h.description}
          </p>
          <a
            href={`tel:${h.phone.replace(/\s/g, "")}`}
            className={`mt-3 inline-flex min-h-[56px] items-center gap-2 rounded-[14px] px-5 font-serif text-[24px] tabular-nums ${
              h.is_emergency ? "bg-paper text-[#b4533c]" : "bg-forest text-paper"
            }`}
          >
            <Phone size={20} strokeWidth={1.8} /> {h.phone}
          </a>
        </li>
      ))}
    </ul>
  );
}
