import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { BellRing, CircleHelp, Download, Globe, LogOut, MoonStar, Trash2 } from "lucide-react";
import { useSendTestPush } from "@/api/notifications";
import { downloadJson, useDeleteAccount, useExportData, useProfile, useUpdateProfile } from "./hooks";

function Row({
  icon,
  title,
  hint,
  control,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-sage text-ink">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-ink">{title}</p>
        {hint && <p className="text-[12px] text-muted">{hint}</p>}
      </div>
      {control}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="mt-4 rounded-[20px] bg-paper p-4 shadow-[var(--shadow)]">
      <h2 className="text-[11px] font-bold uppercase tracking-[1.5px] text-forest">{title}</h2>
      <div className="divide-y divide-line">{children}</div>
    </section>
  );
}

export default function ProfilePage() {
  const { t, i18n } = useTranslation("profile");
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const testPush = useSendTestPush();
  const exportData = useExportData();
  const deleteAccount = useDeleteAccount();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [pushOn, setPushOn] = useState(true);

  const switchLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    update.mutate({ language: lng });
  };

  const logout = () => {
    try {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    } catch {
      /* storage unavailable */
    }
    window.location.href = "/welcome";
  };

  const doDelete = () => {
    deleteAccount.mutate(undefined, {
      onSuccess: () => {
        logout();
      },
    });
  };

  const stage =
    profile?.mode === "postpartum" && profile.postpartum_day !== null
      ? t("stagePostpartum", { day: profile.postpartum_day, week: profile.postpartum_week })
      : t("stageCycle", { day: profile?.cycle_day ?? "–" });

  return (
    <main className="mx-auto max-w-[720px] px-4 pb-24">
      <header className="pt-6">
        <h1 className="font-serif text-[clamp(38px,4vw,53px)] leading-[1.06] tracking-[-1.2px] text-ink">
          {t("title")}
        </h1>
        <p className="mt-1 text-[15px] text-muted">{profile ? stage : t("subtitle")}</p>
      </header>

      <Section title={t("sections.stage")}>
        <Row
          icon={<CircleHelp size={20} strokeWidth={1.8} />}
          title={stage}
          hint={t("editStage")}
          control={
            <Link to="/calendar" className="inline-flex min-h-[44px] items-center text-[14px] font-semibold text-forest">
              →
            </Link>
          }
        />
        <Row
          icon={<CircleHelp size={20} strokeWidth={1.8} />}
          title={t("sections.survey")}
          hint={t("surveyHint")}
          control={
            <Link to="/support" className="inline-flex min-h-[44px] items-center text-[14px] font-semibold text-forest">
              {t("retakeSurvey")}
            </Link>
          }
        />
        <Row
          icon={<CircleHelp size={20} strokeWidth={1.8} />}
          title={t("sections.circle")}
          hint={t("circleHint")}
          control={
            <Link to="/support" className="inline-flex min-h-[44px] items-center text-[14px] font-semibold text-forest">
              {t("circleOpen")}
            </Link>
          }
        />
      </Section>

      <Section title={t("sections.reminders")}>
        <Row
          icon={<BellRing size={20} strokeWidth={1.8} />}
          title={t("checkinReminder")}
          hint={profile?.checkin_reminder_time ?? undefined}
          control={
            <span className="font-serif text-[19px] text-ink tabular-nums">
              {profile?.checkin_reminder_time ?? "–"}
            </span>
          }
        />
        <Row
          icon={<BellRing size={20} strokeWidth={1.8} />}
          title={t("pushEnabled")}
          hint={pushOn ? undefined : t("pushDisabledNote")}
          control={
            <button
              role="switch"
              aria-checked={pushOn}
              aria-label={t("pushEnabled")}
              onClick={() => setPushOn((v) => !v)}
              className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${pushOn ? "bg-forest" : "bg-line"}`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-paper transition-all ${pushOn ? "left-7" : "left-1"}`}
              />
            </button>
          }
        />
        <Row
          icon={<BellRing size={20} strokeWidth={1.8} />}
          title={t("sendTest")}
          hint={testSent ? t("testSent") : undefined}
          control={
            <button
              onClick={() => testPush.mutate(undefined, { onSuccess: () => setTestSent(true) })}
              className="min-h-[44px] rounded-[14px] bg-forest px-4 text-[14px] font-semibold text-paper"
            >
              {t("sendTest")}
            </button>
          }
        />
      </Section>

      <Section title={t("sections.night")}>
        <Row
          icon={<MoonStar size={20} strokeWidth={1.8} />}
          title={t("nightMode")}
          control={
            <div className="flex gap-2">
              <button
                onClick={() => update.mutate({ night_mode: "auto" })}
                aria-pressed={profile?.night_mode !== "off"}
                className={`min-h-[44px] rounded-full px-4 text-[14px] font-medium ${profile?.night_mode !== "off" ? "bg-forest text-paper" : "bg-sage-light text-ink"}`}
              >
                {t("nightAuto")}
              </button>
              <button
                onClick={() => update.mutate({ night_mode: "off" })}
                aria-pressed={profile?.night_mode === "off"}
                className={`min-h-[44px] rounded-full px-4 text-[14px] font-medium ${profile?.night_mode === "off" ? "bg-forest text-paper" : "bg-sage-light text-ink"}`}
              >
                {t("nightOff")}
              </button>
            </div>
          }
        />
      </Section>

      <Section title={t("sections.language")}>
        <Row
          icon={<Globe size={20} strokeWidth={1.8} />}
          title={t("languageName")}
          control={
            <div className="flex gap-2">
              {(["pl", "en"] as const).map((lng) => (
                <button
                  key={lng}
                  onClick={() => switchLanguage(lng)}
                  aria-pressed={i18n.language.startsWith(lng)}
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-[14px] font-bold uppercase ${
                    i18n.language.startsWith(lng) ? "bg-forest text-paper" : "bg-sage-light text-ink"
                  }`}
                >
                  {lng}
                </button>
              ))}
            </div>
          }
        />
      </Section>

      <Section title={t("sections.privacy")}>
        <Row
          icon={<Download size={20} strokeWidth={1.8} />}
          title={t("exportData")}
          control={
            <button
              onClick={() =>
                exportData.mutate(undefined, {
                  onSuccess: (json) => downloadJson("otula-export.json", json),
                })
              }
              className="min-h-[44px] rounded-[14px] bg-sage-light px-4 text-[14px] font-semibold text-ink"
            >
              JSON
            </button>
          }
        />
        <div className="py-3">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex min-h-[44px] items-center gap-2 text-[14px] font-semibold text-[#b4533c]"
            >
              <Trash2 size={18} strokeWidth={1.8} /> {t("deleteAccount")}
            </button>
          ) : (
            <div className="rounded-[14px] bg-[#b4533c]/10 p-4">
              <p className="font-serif text-[19px] text-ink">{t("deleteTitle")}</p>
              <p className="mt-1 text-[13px] text-muted">{t("deleteBody")}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="min-h-[44px] flex-1 rounded-[14px] border border-line text-[14px] font-medium text-ink"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={doDelete}
                  className="min-h-[44px] flex-1 rounded-[14px] bg-[#b4533c] text-[14px] font-semibold text-paper"
                >
                  {t("deleteConfirm")}
                </button>
              </div>
            </div>
          )}
        </div>
      </Section>

      <Section title={t("sections.about")}>
        <p className="py-3 text-[13px] italic leading-relaxed text-muted">{t("medicalNote")}</p>
        <p className="pb-2 text-[12px] text-muted">{t("version")}</p>
      </Section>

      <button
        onClick={logout}
        className="mt-4 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-[14px] border border-line text-[15px] font-semibold text-ink"
      >
        <LogOut size={18} strokeWidth={1.8} /> {t("logout")}
      </button>
    </main>
  );
}
