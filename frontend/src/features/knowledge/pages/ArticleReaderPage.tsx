import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock3, MessageCircleQuestion } from "lucide-react";
import { useArticle, useSaveVisitQuestion } from "@/api/content";

export default function ArticleReaderPage() {
  const { t } = useTranslation("knowledge");
  const { slug = "" } = useParams();
  const { data: article, isLoading, isError } = useArticle(slug);
  const saveQuestion = useSaveVisitQuestion();
  const [question, setQuestion] = useState("");
  const [saved, setSaved] = useState(false);

  const save = () => {
    if (!question.trim()) return;
    saveQuestion.mutate(question.trim(), {
      onSuccess: () => {
        setSaved(true);
        setQuestion("");
        window.setTimeout(() => setSaved(false), 4000);
      },
    });
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-[680px] px-4 pb-24 pt-6">
        <div className="h-[300px] animate-pulse rounded-[22px] bg-sage-light" />
      </main>
    );
  }

  if (isError || !article) {
    return (
      <main className="mx-auto max-w-[680px] px-4 pb-24 pt-6">
        <Link to="/knowledge" className="inline-flex min-h-[44px] items-center gap-1 text-[14px] font-semibold text-forest">
          <ArrowLeft size={16} strokeWidth={1.8} /> {t("back")}
        </Link>
        <p className="mt-6 text-[14px] text-muted">{t("emptyArticles")}</p>
      </main>
    );
  }

  const paragraphs = article.body.split("\n\n");

  const renderInline = (text: string, keyPrefix: string) => {
    const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
    return parts.map((part, j) => {
      const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (!m) return <span key={`${keyPrefix}-${j}`}>{part}</span>;
      return (
        <a
          key={`${keyPrefix}-${j}`}
          href={m[2]}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-forest underline underline-offset-2"
        >
          {m[1]}
        </a>
      );
    });
  };

  return (
    <main className="mx-auto max-w-[680px] px-4 pb-24">
      <Link
        to="/knowledge"
        className="inline-flex min-h-[44px] items-center gap-1 pt-4 text-[14px] font-semibold text-forest"
      >
        <ArrowLeft size={16} strokeWidth={1.8} /> {t("back")}
      </Link>
      <p className="mt-2 text-[11px] font-bold uppercase tracking-[1.5px] text-forest">
        {t(`categories.${article.category}`, { defaultValue: article.category })}
      </p>
      <h1 className="mt-1 font-serif text-[clamp(32px,4vw,44px)] leading-[1.08] tracking-[-0.8px] text-ink">
        {article.title}
      </h1>
      <p className="mt-2 flex items-center gap-1 text-[13px] text-muted">
        <Clock3 size={14} strokeWidth={1.8} /> {t("minRead", { count: article.reading_minutes })}
      </p>

      <div className="mt-6 flex h-44 items-center justify-center rounded-[22px] bg-sage text-[72px]" aria-hidden="true">
        {article.cover_emoji}
      </div>

      <article className="mt-6 space-y-4 text-[17px] leading-relaxed text-ink">
        {paragraphs.map((p, i) =>
          p.startsWith("## ") ? (
            <h2 key={i} className="pt-2 font-serif text-[27px] text-ink">
              {p.slice(3)}
            </h2>
          ) : p.startsWith("> ") ? (
            <blockquote key={i} className="rounded-r-[14px] border-l-4 border-peach bg-cream px-4 py-3 text-[15px] italic">
              {p.slice(2)}
            </blockquote>
          ) : p.startsWith("- ") ? (
            <ul key={i} className="list-disc space-y-1 pl-6">
              {p.split("\n").map((li, j) => (
                <li key={j}>{renderInline(li.replace(/^- /, ""), `ul-${i}`)}</li>
              ))}
            </ul>
          ) : /^\d+\. /m.test(p) ? (
            <ol key={i} className="list-decimal space-y-1 pl-6">
              {p.split("\n").map((li, j) => (
                <li key={j}>{renderInline(li.replace(/^\d+\. /, ""), `ol-${i}`)}</li>
              ))}
            </ol>
          ) : (
            <p key={i}>{renderInline(p, `p-${i}`)}</p>
          ),
        )}
      </article>

      <section aria-label={t("saveAsQuestion")} className="mt-8 rounded-[20px] bg-paper p-5 shadow-[var(--shadow)]">
        <h2 className="flex items-center gap-2 font-serif text-[21px] text-ink">
          <MessageCircleQuestion size={20} strokeWidth={1.8} /> {t("saveAsQuestion")}
        </h2>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t("questionPlaceholder")}
            aria-label={t("saveAsQuestion")}
            className="min-h-[46px] flex-1 rounded-[14px] border border-line bg-cream px-4 text-[15px] text-ink"
          />
          <button
            type="button"
            onClick={save}
            disabled={!question.trim()}
            className="min-h-[46px] rounded-[14px] bg-forest px-5 text-[15px] font-semibold text-paper disabled:opacity-40"
          >
            {t("saveAsQuestion")}
          </button>
        </div>
        {saved && (
          <p role="status" className="mt-2 text-[13px] font-medium text-forest">
            {t("questionSaved")}
          </p>
        )}
      </section>

      <p className="mt-6 rounded-[14px] bg-cream px-4 py-3 text-[13px] italic text-muted">{t("exerciseNote")}</p>
    </main>
  );
}
