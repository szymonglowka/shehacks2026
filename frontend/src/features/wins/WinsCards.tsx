// f-care · WinsJarCard + RandomWinCard + AddWinSheet (SCREENS §3.3, K6).
// Jar fills with petals as wins grow. Self-contained (no f-core imports yet).

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAddWin, useRandomWin, useWins } from "../../api/wins";

const PETAL_SLOTS = 12;

function PetalJar({ count }: { count: number }) {
  const filled = Math.min(count, PETAL_SLOTS);
  return (
    <div
      className="flex items-end gap-1"
      role="img"
      aria-label={`${count}`}
    >
      {Array.from({ length: PETAL_SLOTS }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={
            i < filled
              ? "inline-block h-5 w-3 rounded-full bg-forest"
              : "inline-block h-5 w-3 rounded-full bg-forest/15"
          }
          style={{ transform: `rotate(${(i - 5.5) * 8}deg)` }}
        />
      ))}
    </div>
  );
}

export function AddWinSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation("wins");
  const [text, setText] = useState("");
  const add = useAddWin();

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={t("addTitle")}
        className="w-full max-w-md rounded-t-3xl bg-paper p-6 sm:rounded-3xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif text-2xl">{t("addTitle")}</h2>
        <p className="mt-1 text-sm opacity-70">{t("addHint")}</p>
        <label htmlFor="win-text" className="sr-only">
          {t("addTitle")}
        </label>
        <textarea
          id="win-text"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("addPh")}
          className="mt-4 w-full rounded-2xl border border-ink/15 bg-cream p-3 text-base"
        />
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            className="min-h-[44px] flex-1 rounded-full bg-forest px-4 py-2 text-cream disabled:opacity-50"
            disabled={!text.trim() || add.isPending}
            onClick={() => {
              add.mutate(
                { text: text.trim() },
                {
                  onSuccess: () => {
                    setText("");
                    onClose();
                  },
                },
              );
            }}
          >
            {t("save")}
          </button>
          <button
            type="button"
            className="min-h-[44px] rounded-full px-4 py-2 underline"
            onClick={onClose}
          >
            {t("cancel")}
          </button>
        </div>
      </section>
    </div>
  );
}

export function WinsJarCard({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation("wins");
  const wins = useWins();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (wins.isPending) {
    return (
      <section aria-busy="true" className="rounded-3xl bg-paper p-5">
        <p>{t("loading")}</p>
      </section>
    );
  }
  if (wins.isError) return null;

  const count = wins.data?.length ?? 0;
  return (
    <section
      aria-labelledby="wins-jar-title"
      className="rounded-3xl bg-paper p-5"
    >
      <div className="text-xs uppercase tracking-widest opacity-60">
        {t("jarSubtitle")}
      </div>
      <h2 id="wins-jar-title" className="font-serif text-2xl">
        {t("jarTitle")}
      </h2>
      <div className="mt-3 flex items-center justify-between">
        <PetalJar count={count} />
        <span className="font-serif text-4xl tabular-nums">
          {t("jarCount", { count })}
        </span>
      </div>
      {!compact && count === 0 && (
        <p className="mt-2 text-sm opacity-70">{t("empty")}</p>
      )}
      <button
        type="button"
        className="mt-3 min-h-[44px] w-full rounded-full border border-forest px-4 py-2 text-forest"
        onClick={() => setSheetOpen(true)}
      >
        + {t("addWin")}
      </button>
      <AddWinSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </section>
  );
}

export function RandomWinCard() {
  const { t } = useTranslation("wins");
  const random = useRandomWin();

  if (random.isPending) {
    return (
      <section aria-busy="true" className="rounded-3xl bg-lavender p-5">
        <p>{t("loading")}</p>
      </section>
    );
  }
  if (random.isError || !random.data) {
    return (
      <section className="rounded-3xl bg-lavender p-5">
        <p className="text-sm opacity-70">{t("noWins")}</p>
      </section>
    );
  }
  return (
    <section
      aria-labelledby="random-win-title"
      className="rounded-3xl bg-lavender p-5"
    >
      <div className="text-xs uppercase tracking-widest opacity-60">
        {t("randomTitle")}
      </div>
      <blockquote id="random-win-title" className="mt-1 font-serif text-xl">
        „{random.data.text}”
      </blockquote>
      <button
        type="button"
        className="mt-3 min-h-[44px] rounded-full underline"
        onClick={() => void random.refetch()}
      >
        {t("another")}
      </button>
    </section>
  );
}
