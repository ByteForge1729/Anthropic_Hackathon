"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/storage";
import { t } from "@/lib/i18n";
import type { Language, Plan } from "@/lib/types";
import { AppShell } from "@/components/AppShell";

export default function SettingsPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("en");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [familyConnected, setFamilyConnected] = useState(false);
  const [hospitalLinked, setHospitalLinked] = useState(false);

  useEffect(() => {
    const lang = storage.getLanguage();
    if (!lang) {
      router.replace("/onboarding");
      return;
    }
    setLanguage(lang);
    setPlans(storage.getPlans());
    setActivePlan(storage.getActivePlan());
  }, [router]);

  function handleClearAll() {
    const ok = confirm(
      language === "hi"
        ? "क्या आप सच में सब डेटा हटाना चाहते हैं? यह वापस नहीं आएगा।"
        : "Clear all stored data? This cannot be undone.",
    );
    if (!ok) return;
    storage.clearAllPlans();
    storage.clearSymptoms();
    router.push("/onboarding");
  }

  function handleNewReport() {
    router.push("/upload");
  }

  return (
    <AppShell language={language} active="settings">
      <header className="mb-5">
        <h1 className="text-[28px] md:text-[30px] font-semibold text-ink leading-tight tracking-tight">
          {language === "hi" ? "सेटिंग्स" : "Settings"}
        </h1>
        <p className="text-[14px] text-ink-2 mt-1.5">
          {language === "hi"
            ? "खाता, गोपनीयता और एक्सेसिबिलिटी प्राथमिकताएं।"
            : "Account, privacy, and accessibility preferences."}
        </p>
      </header>

      {/* Account */}
      <Section title={t(language, "setAccount")}>
        <SettingRow
          label={t(language, "setName")}
          value="Patient"
          right={<Chevron />}
        />
        <SettingRow
          label={t(language, "setEmail")}
          value="patient@example.com"
          right={<Chevron />}
        />
        <SettingRow
          label={t(language, "setRecoveryPlan")}
          value={
            activePlan
              ? activePlan.summary.plan_name
              : language === "hi"
                ? "कोई योजना नहीं"
                : "No plan"
          }
          right={<Chevron />}
        />
      </Section>

      {/* Notifications */}
      <Section title={t(language, "setNotifications")}>
        <SettingRow
          label={t(language, "setMedReminders")}
          value={`${t(language, "on")} · 15 ${language === "hi" ? "मिनट पहले" : "min before"}`}
          right={<Chevron />}
        />
        <SettingRow
          label={t(language, "setApptReminders")}
          value={`${t(language, "on")} · 1 ${language === "hi" ? "दिन और 1 घंटा पहले" : "day & 1 hour before"}`}
          right={<Chevron />}
        />
        <SettingRow
          label={t(language, "setDailyCheckin")}
          value="9:00 PM"
          right={<Chevron />}
        />
      </Section>

      {/* Connect family / Link hospital — featured cards */}
      <Section
        title={language === "hi" ? "साझा करें" : "Sharing"}
        subtitle={
          language === "hi"
            ? "रिकवरी की जानकारी अपने नज़दीकी लोगों के साथ बाँटें।"
            : "Share recovery context with the people who help you."
        }
      >
        <FeatureRow
          icon="group"
          tone="primary"
          title={t(language, "setConnectFamily")}
          desc={t(language, "setConnectFamilyDesc")}
          status={
            familyConnected
              ? { label: t(language, "active"), tone: "ok" }
              : { label: t(language, "off"), tone: "neutral" }
          }
          onClick={() => setFamilyConnected((v) => !v)}
        />
        <FeatureRow
          icon="local_hospital"
          tone="accent2"
          title={t(language, "setLinkHospital")}
          desc={t(language, "setLinkHospitalDesc")}
          status={
            hospitalLinked
              ? { label: t(language, "active"), tone: "ok" }
              : { label: t(language, "off"), tone: "neutral" }
          }
          onClick={() => setHospitalLinked((v) => !v)}
        />
      </Section>

      {/* Privacy */}
      <Section title={t(language, "setPrivacy")}>
        <SettingRow
          label={t(language, "setHipaa")}
          right={
            <span className="flex items-center gap-1.5 text-ok text-[13px] font-medium">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              {t(language, "active")}
              <Chevron />
            </span>
          }
        />
        <SettingRow
          label={t(language, "set2fa")}
          value={`${t(language, "enabled")} · SMS`}
          right={<Chevron />}
        />
        <SettingRow
          label={t(language, "setDataExport")}
          value={t(language, "downloadHistory")}
          right={<Chevron />}
        />
        <SettingRow
          label={t(language, "setDeleteAccount")}
          right={
            <button
              onClick={handleClearAll}
              className="text-danger text-[13px] font-medium hover:underline"
            >
              {t(language, "permanent")} →
            </button>
          }
        />
      </Section>

      {/* Care team */}
      <Section title={t(language, "setCareTeam")}>
        <SettingRow
          label={t(language, "setPrimaryProvider")}
          value="Dr. R. Smith"
          right={<Chevron />}
        />
        <SettingRow
          label={t(language, "setPharmacy")}
          value="Walgreens · 4th Street"
          right={<Chevron />}
        />
        <SettingRow
          label={t(language, "setEmergencyContact")}
          value={language === "hi" ? "जोड़ें" : "Add"}
          right={<Chevron />}
        />
      </Section>

      {/* Plan management */}
      <Section
        title={t(language, "yourPlans")}
        subtitle={
          language === "hi"
            ? "अपलोड की गई रिपोर्ट्स से बने रिकवरी प्लान।"
            : "Recovery plans built from your uploaded reports."
        }
      >
        {plans.length === 0 ? (
          <p className="text-[13px] text-ink-3">
            {language === "hi" ? "अभी कोई योजना नहीं।" : "No plans yet."}
          </p>
        ) : (
          plans.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 py-2.5 border-b border-line-2 last:border-0"
            >
              <div className="w-10 h-10 rounded-[10px] bg-accent-soft text-accent-ink flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined fill text-[18px]">
                  clinical_notes
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-ink truncate">
                  {p.summary.plan_name}
                </p>
                <p className="mono text-[11px] text-ink-3 truncate">
                  {p.source} ·{" "}
                  {new Date(p.createdAt).toLocaleDateString(
                    language === "hi" ? "hi-IN" : "en-US",
                    { month: "short", day: "numeric" },
                  )}{" "}
                  · {p.summary.medications.length} meds
                </p>
              </div>
              <button
                onClick={() => {
                  if (
                    confirm(t(language, "qaConfirmDelete"))
                  ) {
                    storage.deletePlan(p.id);
                    setPlans(storage.getPlans());
                    setActivePlan(storage.getActivePlan());
                  }
                }}
                className="text-danger text-[12px] font-medium hover:underline"
              >
                {t(language, "qaDeletePlan")}
              </button>
            </div>
          ))
        )}
        <button
          onClick={handleNewReport}
          className="mt-3 w-full h-11 rounded-[12px] bg-accent text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          {t(language, "qaAddReport")}
        </button>
      </Section>
    </AppShell>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-3 bg-surface border border-line rounded-[18px] p-5 shadow-sm">
      <div className="mb-2.5">
        <p className="mono text-[10.5px] uppercase tracking-wider text-ink-3 font-semibold">
          {title}
        </p>
        {subtitle && <p className="text-[12.5px] text-ink-3 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function SettingRow({
  label,
  value,
  right,
}: {
  label: string;
  value?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-line-2 last:border-0">
      <p className="text-[14px] text-ink font-medium">{label}</p>
      <div className="flex items-center gap-1.5 text-ink-3 text-[13px]">
        {value && <span className="truncate">{value}</span>}
        {right}
      </div>
    </div>
  );
}

function Chevron() {
  return (
    <span className="material-symbols-outlined text-[16px] text-ink-3">arrow_forward</span>
  );
}

function FeatureRow({
  icon,
  tone,
  title,
  desc,
  status,
  onClick,
}: {
  icon: string;
  tone: "primary" | "accent2";
  title: string;
  desc: string;
  status: { label: string; tone: "ok" | "neutral" };
  onClick: () => void;
}) {
  const c =
    tone === "primary"
      ? { bg: "var(--accent-soft)", fg: "var(--accent-ink)" }
      : { bg: "var(--accent-2-soft)", fg: "var(--accent-2-ink)" };
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3 border-b border-line-2 last:border-0 text-left"
    >
      <div
        className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
        style={{ background: c.bg, color: c.fg }}
      >
        <span className="material-symbols-outlined fill text-[20px]">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-ink truncate">{title}</p>
        <p className="text-[12px] text-ink-3 truncate">{desc}</p>
      </div>
      <span
        className={`mono text-[10.5px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
          status.tone === "ok"
            ? "bg-ok/10 text-ok"
            : "bg-line-2 text-ink-3"
        }`}
      >
        {status.label}
      </span>
      <Chevron />
    </button>
  );
}
