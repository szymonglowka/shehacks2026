// f-care · PUBLIC /help (SCREENS §3.10). No auth, no decoration.
// tel: links, trusted contact when logged in.

import { useTranslation } from "react-i18next";
import { useContacts, useHelplines } from "../../api/support";

export function HelpPage() {
  const { t } = useTranslation("help");
  const helplines = useHelplines();
  const contacts = useContacts();
  const trusted =
    contacts.data && contacts.data.length > 0 ? contacts.data[0] : null;
  const lines = helplines.data ?? [];
  const emergency = lines.find((h) => h.is_emergency);
  const rest = lines.filter((h) => !h.is_emergency);

  return (
    <main className="mx-auto max-w-xl bg-paper px-4 pb-16 pt-10">
      <h1 className="font-serif text-4xl">{t("title")}</h1>
      <p className="mt-2 opacity-70">{t("subtitle")}</p>

      <section
        aria-labelledby="emergency-title"
        className="mt-6 rounded-3xl bg-clay p-6 text-cream"
      >
        <h2 id="emergency-title" className="font-serif text-2xl">
          {emergency ? emergency.label : t("emergency")}
        </h2>
        <p className="mt-1 opacity-90">{t("emergencyText")}</p>
        <a
          href={emergency ? emergency.number_href : "tel:112"}
          className="mt-4 inline-flex min-h-[56px] items-center rounded-full bg-cream px-8 py-3 text-xl font-medium text-ink"
        >
          {emergency ? `${t("call")}: ${emergency.number}` : t("call112")}
        </a>
      </section>

      <section aria-labelledby="lines-title" className="mt-8">
        <h2 id="lines-title" className="font-serif text-2xl">
          {t("linesTitle")}
        </h2>
        <ul className="mt-3 grid gap-3">
          {rest.map((h) => (
            <li key={h.code} className="rounded-3xl bg-cream p-4">
              <div className="font-medium">{h.label}</div>
              <div className="text-sm opacity-70">
                {t("hours", { hours: h.hours })}
              </div>
              <a
                href={h.number_href}
                className="mt-2 inline-flex min-h-[48px] items-center rounded-full bg-forest px-6 py-2 text-cream"
              >
                {t("call")}: {h.number}
              </a>
            </li>
          ))}
        </ul>
      </section>

      {trusted && (
        <section aria-labelledby="trusted-title" className="mt-8 rounded-3xl bg-cream p-5">
          <h2 id="trusted-title" className="font-serif text-2xl">
            {t("trustedTitle")}
          </h2>
          <p className="text-sm opacity-70">{t("trustedText")}</p>
          <a
            href={`tel:${trusted.phone.replace(/[\s-]/g, "")}`}
            className="mt-3 inline-flex min-h-[48px] items-center rounded-full border border-forest px-6 py-2 text-forest"
          >
            {t("call")}: {trusted.name}
          </a>
        </section>
      )}
    </main>
  );
}
