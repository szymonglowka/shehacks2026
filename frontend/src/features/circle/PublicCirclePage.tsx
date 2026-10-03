// f-care · PUBLIC circle page /c/:token (SCREENS §3.12).
// No auth, no decoration. Claim with name, done, partner-guide link,
// support lines. Never renders notes/symptoms/EPDS (API never sends them).

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useClaimRequest,
  useMarkRequestDone,
  usePublicCircle,
} from "../../api/circle";

function ClaimForm({
  requestId,
  token,
  onDone,
  onCancel,
}: {
  requestId: number;
  token: string;
  onDone: (name: string) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation("circle");
  const [name, setName] = useState("");
  const claim = useClaimRequest(token);

  return (
    <form
      className="mt-2 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        claim.mutate(
          { id: requestId, name: name.trim() },
          { onSuccess: () => onDone(name.trim()) },
        );
      }}
    >
      <label htmlFor={`claim-name-${requestId}`} className="sr-only">
        {t("yourName")}
      </label>
      <input
        id={`claim-name-${requestId}`}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("yourNamePh")}
        autoComplete="given-name"
        className="min-h-[44px] flex-1 rounded-2xl border border-ink/15 bg-cream p-3 text-base"
      />
      <button
        type="submit"
        disabled={!name.trim() || claim.isPending}
        className="min-h-[44px] rounded-full bg-forest px-5 py-2 text-cream disabled:opacity-50"
      >
        {t("claim")}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="min-h-[44px] rounded-full px-3 py-2 underline"
      >
        {t("cancel")}
      </button>
    </form>
  );
}

export function PublicCirclePage() {
  const { t } = useTranslation("circle");
  const { token } = useParams<{ token: string }>();
  const circle = usePublicCircle(token);
  const done = useMarkRequestDone(token ?? "");
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [thanked, setThanked] = useState<string | null>(null);

  if (circle.isPending) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <p aria-busy="true">{t("loading")}</p>
      </main>
    );
  }

  if (circle.isError || !circle.data) {
    const rateLimited =
      (circle.error as { status?: number } | null)?.status === 429;
    return (
      <main className="mx-auto max-w-xl px-4 py-10 text-center">
        <h1 className="font-serif text-3xl">
          {rateLimited ? t("rateTitle") : t("invalidTitle")}
        </h1>
        <p className="mt-2 opacity-70">
          {rateLimited ? t("rateText") : t("invalidText")}
        </p>
      </main>
    );
  }

  const { mom_name: momName, mood_color: moodColor, mood_word: moodWord } =
    circle.data;

  return (
    <main className="mx-auto max-w-xl px-4 pb-16 pt-8">
      <div className="font-serif text-xl">otula</div>
      <h1 className="mt-4 font-serif text-3xl">
        {t("publicTitle", { name: momName })}
      </h1>
      <p className="mt-1 opacity-70">{t("publicSubtitle")}</p>

      {moodColor && (
        <p className="mt-3 flex items-center gap-2 text-sm">
          <span
            aria-hidden="true"
            className="inline-block h-4 w-4 rounded-full"
            style={{ backgroundColor: moodColor }}
          />
          {t("moodToday", { name: momName })} {moodWord ? t(`moodWord.${moodWord}`, { defaultValue: moodWord }) : null}
        </p>
      )}

      {thanked && (
        <p role="status" className="mt-4 rounded-3xl bg-forest p-4 text-cream">
          {t("thanks", { name: thanked })}
        </p>
      )}

      <ul className="mt-4 grid gap-3">
        {circle.data.requests.map((r) => (
          <li key={r.id} className="rounded-3xl bg-paper p-4">
            <div className="flex items-center justify-between gap-2">
              <strong
                className={r.status === "done" ? "line-through opacity-60" : ""}
              >
                {r.title}
              </strong>
              {r.status === "done" && (
                <span className="shrink-0 rounded-full bg-forest/10 px-3 py-1 text-xs">
                  {t("doneBadge")}
                </span>
              )}
            </div>
            <div className="mt-1 text-sm opacity-70">{r.when_label}</div>
            {r.status === "claimed" && r.claimed_by && (
              <div className="mt-1 text-sm">
                {t("takenBy", { name: r.claimed_by })}
              </div>
            )}
            {r.status === "open" &&
              (claimingId === r.id ? (
                <ClaimForm
                  requestId={r.id}
                  token={token ?? ""}
                  onCancel={() => setClaimingId(null)}
                  onDone={(name) => {
                    setClaimingId(null);
                    setThanked(name);
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="mt-2 min-h-[48px] w-full rounded-full bg-forest px-5 py-2 text-cream"
                  onClick={() => {
                    setClaimingId(r.id);
                    setThanked(null);
                  }}
                >
                  {t("takeIt")}
                </button>
              ))}
            {r.status === "claimed" && (
              <button
                type="button"
                className="mt-2 min-h-[44px] w-full rounded-full border border-forest px-5 py-2 text-forest"
                onClick={() => done.mutate(r.id)}
              >
                {t("markDone")}
              </button>
            )}
          </li>
        ))}
      </ul>
      <section aria-labelledby="guide-title" className="mt-8 rounded-3xl bg-paper p-5">
        <h2 id="guide-title" className="font-serif text-xl">
          {t("guideTitle")}
        </h2>
        <p className="mt-1 text-sm opacity-70">{t("guideText")}</p>
        {/*
          Partner guide article (slug jak-wspierac-mame, owned by f-plan/b-content).
          Until that route is public-safe, fall back to /help — see requests/f-care.md.
        */}
        <Link
          to="/knowledge/jak-wspierac-mame"
          className="mt-2 inline-block min-h-[44px] underline"
        >
          {t("guideCta")}
        </Link>
      </section>

      <section aria-label={t("helpTitle")} className="mt-4 text-center">
        <Link to="/help" className="inline-block min-h-[44px] underline">
          {t("helpTitle")} → {t("helpCta")}
        </Link>
      </section>
    </main>
  );
}
