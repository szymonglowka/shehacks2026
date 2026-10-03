// f-care · Mum side of the circle, rendered inside /support (SCREENS §3.8):
// requests with statuses, new-request sheet, share link (copy + navigator.share),
// revoke, share_mood toggle.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useCareRequests,
  useCircleLink,
  useMutateCareRequests,
  useMutateCircleLink,
} from "../../api/circle";

function NewRequestSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation("support");
  const [title, setTitle] = useState("");
  const [whenLabel, setWhenLabel] = useState("");
  const create = useMutateCareRequests().create;

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
        aria-label={t("newRequest")}
        className="w-full max-w-md rounded-t-3xl bg-paper p-6 sm:rounded-3xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="grid gap-3">
          <div>
            <label htmlFor="req-title" className="text-sm font-medium">
              {t("requestTitleLabel")}
            </label>
            <input
              id="req-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("requestTitlePh")}
              className="mt-1 min-h-[44px] w-full rounded-2xl border border-ink/15 bg-cream p-3 text-base"
            />
          </div>
          <div>
            <label htmlFor="req-when" className="text-sm font-medium">
              {t("requestWhenLabel")}
            </label>
            <input
              id="req-when"
              value={whenLabel}
              onChange={(e) => setWhenLabel(e.target.value)}
              placeholder={t("requestWhenPh")}
              className="mt-1 min-h-[44px] w-full rounded-2xl border border-ink/15 bg-cream p-3 text-base"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            className="min-h-[44px] flex-1 rounded-full bg-forest px-4 py-2 text-cream disabled:opacity-50"
            disabled={!title.trim() || create.isPending}
            onClick={() => {
              create.mutate(
                {
                  title: title.trim(),
                  category: "other",
                  when_label: whenLabel.trim(),
                },
                {
                  onSuccess: () => {
                    setTitle("");
                    setWhenLabel("");
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

export function CircleSection() {
  const { t } = useTranslation("support");
  const link = useCircleLink();
  const requests = useCareRequests();
  const linkMut = useMutateCircleLink();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const share = async (url: string) => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ url });
        return;
      } catch {
        /* user dismissed — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <section aria-labelledby="circle-title" className="rounded-3xl bg-paper p-5">
      <h2 id="circle-title" className="font-serif text-2xl">
        {t("circleTitle")}
      </h2>
      <p className="text-sm opacity-70">{t("circleSubtitle")}</p>

      <ul className="mt-3 grid gap-2">
        {(requests.data ?? []).map((r) => (
          <li key={r.id} className="rounded-2xl bg-cream p-3">
            <div className="flex items-center justify-between gap-2">
              <strong className={r.status === "done" ? "line-through opacity-60" : ""}>
                {r.title}
              </strong>
              <span className="shrink-0 rounded-full bg-forest/10 px-3 py-1 text-xs">
                {r.status === "done"
                  ? t("doneBadge")
                  : r.status === "claimed"
                    ? t("claimedBadge")
                    : t("openBadge")}
              </span>
            </div>
            <div className="mt-1 text-sm opacity-70">
              {r.status === "claimed" && r.claimed_by
                ? t("claimedBy", { name: r.claimed_by, when: r.when_label })
                : r.when_label}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="min-h-[44px] rounded-full bg-forest px-5 py-2 text-cream"
          onClick={() => setSheetOpen(true)}
        >
          {t("newRequest")}
        </button>
        {link.data ? (
          <button
            type="button"
            className="min-h-[44px] rounded-full border border-forest px-5 py-2 text-forest"
            onClick={() => void share(link.data.url)}
          >
            {t("shareList")}
          </button>
        ) : (
          <button
            type="button"
            className="min-h-[44px] rounded-full border border-forest px-5 py-2 text-forest"
            onClick={() => linkMut.create.mutate()}
          >
            {t("createLink")}
          </button>
        )}
      </div>

      {copied && (
        <p role="status" className="mt-2 text-sm">
          {t("copied")}
        </p>
      )}

      {link.data && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <label className="inline-flex min-h-[44px] items-center gap-2">
            <input
              type="checkbox"
              checked={link.data.share_mood}
              onChange={(e) =>
                linkMut.update.mutate({ share_mood: e.target.checked })
              }
              className="h-5 w-5"
            />
            {t("shareMood")}
          </label>
          <button
            type="button"
            className="min-h-[44px] underline opacity-70"
            onClick={() => linkMut.revoke.mutate()}
          >
            {t("revokeLink")}
          </button>
        </div>
      )}

      <NewRequestSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </section>
  );
}
