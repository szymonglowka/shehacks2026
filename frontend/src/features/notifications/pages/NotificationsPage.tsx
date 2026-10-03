import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { BellOff, CheckCheck } from "lucide-react";
import type { AppNotification } from "@/api/notifications";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "@/api/notifications";

function NotificationRow({ n }: { n: AppNotification }) {
  const { t } = useTranslation("notifications");
  const markRead = useMarkNotificationRead(n.id);
  return (
    <li className={`rounded-[20px] p-4 ${n.read_at ? "bg-cream" : "bg-paper shadow-[var(--shadow)]"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-forest">
            {t(`kinds.${n.kind}`)}
          </p>
          <h3 className="font-serif text-[19px] leading-snug text-ink">{n.title}</h3>
          <p className="mt-0.5 text-[13px] text-muted">{n.body}</p>
        </div>
        {!n.read_at && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-peach" aria-label="unread" />}
      </div>
      <div className="mt-2 flex gap-2">
        <Link
          to={n.url}
          onClick={() => {
            if (!n.read_at) markRead.mutate();
          }}
          className="inline-flex min-h-[44px] items-center rounded-[14px] bg-forest px-4 text-[14px] font-semibold text-paper"
        >
          {t("open")}
        </Link>
        {!n.read_at && (
          <button
            onClick={() => markRead.mutate()}
            className="inline-flex min-h-[44px] items-center rounded-[14px] bg-sage-light px-4 text-[14px] font-medium text-ink"
          >
            {t("done")}
          </button>
        )}
      </div>
    </li>
  );
}

export default function NotificationsPage() {
  const { t } = useTranslation("notifications");
  const { data, isLoading } = useNotifications();
  const markAll = useMarkAllNotificationsRead();
  const list = data ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const todays = list.filter((n) => n.created_at.slice(0, 10) === today);
  const earlier = list.filter((n) => n.created_at.slice(0, 10) !== today);
  const unread = list.filter((n) => !n.read_at).length;

  return (
    <main className="mx-auto max-w-[720px] px-4 pb-24">
      <header className="flex items-end justify-between pt-6">
        <h1 className="font-serif text-[clamp(32px,4vw,44px)] leading-[1.08] text-ink">{t("title")}</h1>
        {unread > 0 && (
          <button
            onClick={() => markAll.mutate()}
            className="inline-flex min-h-[44px] items-center gap-1 text-[14px] font-semibold text-forest"
          >
            <CheckCheck size={18} strokeWidth={1.8} /> {t("markAllRead")}
          </button>
        )}
      </header>

      {isLoading && (
        <ul className="mt-4 space-y-3">
          {[0, 1].map((i) => (
            <li key={i} className="h-[110px] animate-pulse rounded-[20px] bg-sage-light" />
          ))}
        </ul>
      )}

      {!isLoading && list.length === 0 && (
        <div className="mt-6 rounded-[22px] bg-paper p-8 text-center shadow-[var(--shadow)]">
          <div className="mx-auto flex h-[70px] w-[70px] items-center justify-center rounded-[15px] bg-sage">
            <BellOff size={30} strokeWidth={1.8} />
          </div>
          <p className="mt-3 font-serif text-[21px] italic text-ink">{t("empty")}</p>
        </div>
      )}

      {todays.length > 0 && (
        <section aria-label={t("today")} className="mt-4">
          <h2 className="text-[11px] font-bold uppercase tracking-[1.5px] text-forest">{t("today")}</h2>
          <ul className="mt-2 space-y-3">
            {todays.map((n) => (
              <NotificationRow key={n.id} n={n} />
            ))}
          </ul>
        </section>
      )}
      {earlier.length > 0 && (
        <section aria-label={t("earlier")} className="mt-6">
          <h2 className="text-[11px] font-bold uppercase tracking-[1.5px] text-forest">{t("earlier")}</h2>
          <ul className="mt-2 space-y-3">
            {earlier.map((n) => (
              <NotificationRow key={n.id} n={n} />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
