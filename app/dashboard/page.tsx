"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { storage } from "@/lib/storage";
import { t } from "@/lib/i18n";
import type { AppTheme, Language, Plan, RedFlag } from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import { Disclaimer } from "@/components/Disclaimer";
import { computeNextDose, formatTimeOfDay } from "@/lib/schedule";

export default function DashboardPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("en");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [theme, setThemeState] = useState<AppTheme>("light");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const lang = storage.getLanguage();
    if (!lang) {
      router.replace("/onboarding");
      return;
    }
    setLanguage(lang);
    const all = storage.getPlans();
    if (all.length === 0) {
      router.replace("/upload");
      return;
    }
    setPlans(all);
    setActiveId(storage.getActivePlanId());
    setThemeState(storage.getTheme());
    setLoaded(true);
  }, [router]);

  // Tick every 30s so "in 1h 24m" stays fresh
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const active = useMemo(
    () => plans.find((p) => p.id === activeId) ?? plans[0] ?? null,
    [plans, activeId],
  );
  const summary = active?.summary ?? null;
  const nextDose = useMemo(
    () => (summary ? computeNextDose(summary.medications, language, now) : null),
    [summary, language, now],
  );

  function handleSelectPlan(id: string) {
    storage.setActivePlan(id);
    setActiveId(id);
  }

  function handleDeletePlan(id: string) {
    if (!confirm(t(language, "qaConfirmDelete"))) return;
    storage.deletePlan(id);
    const fresh = storage.getPlans();
    setPlans(fresh);
    setActiveId(storage.getActivePlanId());
    if (fresh.length === 0) router.replace("/upload");
  }

  function handleNewPlan() {
    router.push("/upload");
  }

  function handleToggleTheme() {
    const next: AppTheme = theme === "dark" ? "light" : "dark";
    storage.setTheme(next);
    setThemeState(next);
  }

  if (!loaded || !active || !summary) return null;

  const greeting = greetingFor(language);
  const emergencyCount = summary.red_flags.filter((f) => f.severity === "emergency").length;
  const urgentCount = summary.red_flags.filter((f) => f.severity === "urgent").length;
  const watchCount = summary.red_flags.filter((f) => f.severity === "watch").length;

  return (
    <AppShell language={language} active="home">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
        <div className="space-y-1">
          <p className="mono text-[12px] text-accent-ink uppercase tracking-wider font-semibold">
            {greeting}
          </p>
          <h1 className="text-[26px] md:text-[30px] font-semibold text-ink leading-tight tracking-tight">
            {t(language, "recoverySummary")}
          </h1>
          <p className="text-[13.5px] text-ink-2 max-w-lg">
            {language === "hi"
              ? "किसी भी कार्ड पर क्लिक करें और पूरा विवरण देखें।"
              : "Tap any card to open the full details."}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => router.push("/symptoms")}
            className="h-9 px-3 rounded-[12px] border border-line bg-surface text-ink-2 text-[12.5px] font-medium hover:bg-line-2 transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">monitor_heart</span>
            {t(language, "qaLogSymptoms")}
          </button>
          <button
            onClick={() => router.push("/upload")}
            className="h-9 px-3 rounded-[12px] border border-line bg-surface text-ink-2 text-[12.5px] font-medium hover:bg-line-2 transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            {t(language, "qaAddReport")}
          </button>
          <button
            onClick={() => router.push("/medications")}
            className="h-9 px-3 rounded-[12px] bg-accent text-white text-[12.5px] font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            {t(language, "qaAddMedication")}
          </button>
          <button
            onClick={handleToggleTheme}
            aria-label={theme === "dark" ? t(language, "lightMode") : t(language, "darkMode")}
            className="h-9 w-9 rounded-[12px] border border-line bg-surface text-ink-2 hover:bg-line-2 transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[18px]">
              {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
          </button>
        </div>
      </section>

      {/* Plan tabs */}
      <PlanTabs
        plans={plans}
        activeId={active.id}
        language={language}
        onSelect={handleSelectPlan}
        onDelete={handleDeletePlan}
        onAdd={handleNewPlan}
      />

      {/* Next dose strip */}
      <NextDoseStrip
        nextDose={nextDose}
        hasMeds={summary.medications.length > 0}
        language={language}
      />

      {/* Stats strip */}
      <section className="mt-3 mb-3 grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
        <Stat
          label={t(language, "totalMeds")}
          value={summary.medications.length}
          icon="medication"
          tone="accent2"
        />
        <Stat
          label={t(language, "totalFlags")}
          value={summary.red_flags.length}
          icon="error"
          tone="danger"
        />
        <Stat
          label={t(language, "totalFollowups")}
          value={summary.follow_up.length}
          icon="calendar_month"
          tone="accent"
        />
        <Stat
          label={language === "hi" ? "गंभीरता" : "Severity"}
          value={`${emergencyCount}·${urgentCount}·${watchCount}`}
          icon="monitor_heart"
          tone="neutral"
          mono
        />
      </section>

      <Disclaimer language={language} variant="compact" />

      {/* 4-corner card grid */}
      <section className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 auto-rows-fr">
        <CardLink
          language={language}
          href="/summary"
          icon="assignment"
          tone="primary"
          label={t(language, "planOverview")}
          title={
            language === "hi" ? "आपकी रिकवरी का सारांश" : "Your recovery, in plain words"
          }
          previewText={
            summary.summary ||
            (language === "hi" ? "कोई सारांश उपलब्ध नहीं है।" : "No summary available.")
          }
          ctaLabel={language === "hi" ? "पूरा सारांश पढ़ें" : "Read full summary"}
        />

        <CardLink
          language={language}
          href="/medications"
          icon="medication"
          tone="accent2"
          label={t(language, "medications")}
          count={summary.medications.length}
          title={
            language === "hi"
              ? `${summary.medications.length} सक्रिय दवाइयाँ`
              : `${summary.medications.length} active medications`
          }
          previewList={summary.medications.slice(0, 3).map((m) => ({
            primary: m.name,
            meta: `${m.dose} · ${m.frequency}`,
            sub: m.purpose,
          }))}
          ctaLabel={
            summary.medications.length > 3
              ? `+ ${summary.medications.length - 3} ${language === "hi" ? "और" : "more"}`
              : language === "hi"
                ? "पूरी सूची देखें"
                : "View full list"
          }
        />

        <RedFlagsCard language={language} flags={summary.red_flags} />

        <CardLink
          language={language}
          href="/follow-ups"
          icon="calendar_month"
          tone="primary"
          label={t(language, "followUp")}
          count={summary.follow_up.length}
          title={
            summary.follow_up[0]?.task ||
            (language === "hi" ? "कोई अपॉइंटमेंट नहीं" : "No appointments")
          }
          previewList={summary.follow_up.slice(0, 3).map((f) => ({
            primary: f.task,
            meta: `${f.deadline}${f.contact ? " · " + f.contact : ""}`,
          }))}
          ctaLabel={
            summary.follow_up.length > 3
              ? `+ ${summary.follow_up.length - 3} ${language === "hi" ? "और" : "more"}`
              : language === "hi"
                ? "सभी फॉलो-अप देखें"
                : "View all follow-ups"
          }
        />
      </section>
    </AppShell>
  );
}

/* ---------------- Greeting helper ---------------- */
function greetingFor(language: Language): string {
  const h = new Date().getHours();
  const key = h < 12 ? "greetingMorning" : h < 17 ? "greetingAfternoon" : "greetingEvening";
  return t(language, key);
}

/* ---------------- Plan tabs ---------------- */

function PlanTabs({
  plans,
  activeId,
  language,
  onSelect,
  onDelete,
  onAdd,
}: {
  plans: Plan[];
  activeId: string;
  language: Language;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {plans.map((p) => {
        const active = p.id === activeId;
        return (
          <div
            key={p.id}
            className={`relative inline-flex items-stretch shrink-0 rounded-[12px] border ${
              active
                ? "bg-accent-soft border-accent text-accent-ink"
                : "bg-surface border-line text-ink-2 hover:bg-line-2"
            } transition-colors`}
          >
            <button
              type="button"
              onClick={() => onSelect(p.id)}
              className="flex items-center gap-2 pl-3 pr-1 py-1.5"
            >
              <span
                className={`material-symbols-outlined text-[16px] ${
                  active ? "fill" : ""
                }`}
              >
                clinical_notes
              </span>
              <span className="text-[12.5px] font-semibold whitespace-nowrap">
                {p.summary.plan_name}
              </span>
              <span className="mono text-[10.5px] bg-white/60 dark:bg-black/20 text-ink-3 px-1.5 py-0.5 rounded-full">
                {p.summary.medications.length}
              </span>
            </button>
            {plans.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(p.id);
                }}
                aria-label={t(language, "qaDeletePlan")}
                className="px-1.5 py-1 text-ink-3 hover:text-danger transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-1.5 shrink-0 rounded-[12px] border border-dashed border-accent/50 text-accent-ink bg-accent-soft/40 hover:bg-accent-soft px-3 py-1.5 text-[12.5px] font-medium transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]">add</span>
        {t(language, "qaNewPlan")}
      </button>
    </div>
  );
}

/* ---------------- Next dose strip ---------------- */

function NextDoseStrip({
  nextDose,
  hasMeds,
  language,
}: {
  nextDose: ReturnType<typeof computeNextDose>;
  hasMeds: boolean;
  language: Language;
}) {
  if (!hasMeds) return null;
  return (
    <Link
      href="/medications"
      className="group flex items-center gap-3 bg-accent-2-soft border border-accent-2/30 rounded-[16px] p-3 md:p-4 hover:shadow-sm transition-shadow"
    >
      <div className="w-11 h-11 rounded-[12px] bg-accent-2 text-white flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined fill text-[22px]">schedule</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="mono text-[10px] uppercase tracking-wider text-accent-2-ink font-semibold">
          {t(language, "nextDose")}
        </p>
        {nextDose ? (
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mt-0.5">
            <span className="text-[18px] font-bold text-ink leading-tight">
              {formatTimeOfDay(nextDose.time, language)}
            </span>
            <span className="text-[13px] text-accent-2-ink font-medium">
              {nextDose.inLabel}
            </span>
            <span className="text-[12.5px] text-ink-2 truncate">
              · {nextDose.name}
              {nextDose.alsoDue.length > 0
                ? ` + ${nextDose.alsoDue.length} ${
                    language === "hi" ? "और" : "more"
                  }`
                : ""}
            </span>
          </div>
        ) : (
          <p className="text-[14px] text-ink-2 mt-0.5">{t(language, "noDosesScheduled")}</p>
        )}
      </div>
      <span className="material-symbols-outlined text-[20px] text-ink-3 opacity-50 group-hover:opacity-100 transition-opacity">
        arrow_forward
      </span>
    </Link>
  );
}

/* ---------------- Stats ---------------- */

function Stat({
  label,
  value,
  icon,
  tone,
  mono,
}: {
  label: string;
  value: number | string;
  icon: string;
  tone: "accent" | "accent2" | "danger" | "neutral";
  mono?: boolean;
}) {
  const colorMap = {
    accent: { fg: "var(--accent-ink)", bg: "var(--accent-soft)", icon: "var(--accent)" },
    accent2: { fg: "var(--accent-2-ink)", bg: "var(--accent-2-soft)", icon: "var(--accent-2)" },
    danger: { fg: "var(--danger)", bg: "var(--danger-soft)", icon: "var(--danger)" },
    neutral: { fg: "var(--ink-2)", bg: "var(--line-2)", icon: "var(--ink-2)" },
  } as const;
  const c = colorMap[tone];
  return (
    <div className="bg-surface border border-line rounded-[16px] p-3 flex items-center gap-3 shadow-sm">
      <div
        className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
        style={{ background: c.bg, color: c.icon }}
      >
        <span className="material-symbols-outlined text-[20px] fill">{icon}</span>
      </div>
      <div className="min-w-0">
        <div
          className={`${mono ? "mono" : ""} text-[20px] md:text-[22px] font-bold leading-tight tracking-tight truncate`}
          style={{ color: c.fg }}
        >
          {value}
        </div>
        <div className="mono text-[10px] uppercase tracking-wider text-ink-3 truncate">
          {label}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Cards ---------------- */

function CardShell({
  href,
  children,
  tone,
}: {
  href: string;
  children: React.ReactNode;
  tone: "primary" | "accent2" | "danger";
}) {
  const hoverBorder =
    tone === "danger"
      ? "hover:border-danger/40"
      : tone === "accent2"
        ? "hover:border-accent-2/50"
        : "hover:border-accent/40";
  return (
    <Link
      href={href}
      className={`group text-left rounded-[22px] border bg-surface border-line shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 ${hoverBorder} p-5 md:p-6 flex flex-col w-full overflow-hidden min-h-[200px]`}
    >
      {children}
    </Link>
  );
}

function CardHeader({
  icon,
  label,
  tone,
  count,
  language,
}: {
  icon: string;
  label: string;
  tone: "primary" | "accent2" | "danger";
  count?: number;
  language: Language;
}) {
  const colorMap = {
    primary: { bg: "var(--accent-soft)", fg: "var(--accent-ink)" },
    accent2: { bg: "var(--accent-2-soft)", fg: "var(--accent-2-ink)" },
    danger: { bg: "var(--danger-soft)", fg: "var(--danger)" },
  } as const;
  const c = colorMap[tone];
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0"
          style={{ background: c.bg, color: c.fg }}
        >
          <span className="material-symbols-outlined text-[22px] fill">{icon}</span>
        </div>
        <div className="flex flex-col">
          <p className="mono text-[10.5px] uppercase tracking-wider text-ink-3 font-medium">
            {label}
          </p>
          {count !== undefined && count > 0 && (
            <p className="text-[12px] text-ink-2 font-medium">
              {count}{" "}
              {language === "hi"
                ? count === 1
                  ? "प्रविष्टि"
                  : "प्रविष्टियाँ"
                : count === 1
                  ? "item"
                  : "items"}
            </p>
          )}
        </div>
      </div>
      <span className="material-symbols-outlined text-[20px] text-ink-3 opacity-40 group-hover:opacity-100 transition-opacity">
        arrow_forward
      </span>
    </div>
  );
}

function CardLink({
  language,
  href,
  icon,
  tone,
  label,
  title,
  previewText,
  previewList,
  ctaLabel,
  count,
}: {
  language: Language;
  href: string;
  icon: string;
  tone: "primary" | "accent2" | "danger";
  label: string;
  title: string;
  previewText?: string;
  previewList?: Array<{ primary: string; meta: string; sub?: string }>;
  ctaLabel: string;
  count?: number;
}) {
  const ctaColor =
    tone === "danger"
      ? "text-danger"
      : tone === "accent2"
        ? "text-accent-2-ink"
        : "text-accent-ink";

  return (
    <CardShell href={href} tone={tone}>
      <CardHeader icon={icon} label={label} tone={tone} count={count} language={language} />
      <h2 className="text-[16px] font-semibold text-ink mb-2 leading-snug">{title}</h2>
      {previewText && (
        <p className="text-[13.5px] text-ink-2 leading-relaxed line-clamp-4">{previewText}</p>
      )}
      {previewList && previewList.length > 0 && (
        <ul className="space-y-2">
          {previewList.map((p, i) => (
            <li key={i} className="border-b border-line-2 last:border-0 pb-2 last:pb-0">
              <p className="text-[13.5px] font-medium text-ink truncate">{p.primary}</p>
              <p className="mono text-[11.5px] text-ink-3 truncate">{p.meta}</p>
              {p.sub && (
                <p className="text-[11.5px] text-ink-3 italic truncate mt-0.5">{p.sub}</p>
              )}
            </li>
          ))}
        </ul>
      )}
      <span
        className={`mt-auto pt-3 text-[11px] mono uppercase tracking-wider font-semibold ${ctaColor}`}
      >
        {ctaLabel} →
      </span>
    </CardShell>
  );
}

function RedFlagsCard({ language, flags }: { language: Language; flags: RedFlag[] }) {
  const sorted = [...flags].sort((a, b) => {
    const order = { emergency: 0, urgent: 1, watch: 2 };
    return order[a.severity] - order[b.severity];
  });
  const visible = sorted.slice(0, 3);

  return (
    <CardShell href="/flags" tone="danger">
      <CardHeader
        icon="error"
        label={t(language, "redFlags")}
        tone="danger"
        count={flags.length}
        language={language}
      />
      {flags.length === 0 ? (
        <p className="text-[14px] text-ink-2">{t(language, "noFlags")}</p>
      ) : (
        <ul className="space-y-2.5">
          {visible.map((f, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <SeverityDot severity={f.severity} />
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-semibold text-ink leading-snug truncate">
                  {f.symptom}
                </p>
                {f.watch_for && (
                  <p className="text-[11.5px] text-ink-3 mt-0.5 line-clamp-1">{f.watch_for}</p>
                )}
              </div>
              <SeverityChip severity={f.severity} language={language} />
            </li>
          ))}
        </ul>
      )}
      <span className="mt-auto pt-3 text-[11px] mono uppercase tracking-wider text-danger font-semibold">
        {flags.length > 3
          ? `+ ${flags.length - 3} ${language === "hi" ? "और" : "more"} →`
          : language === "hi"
            ? "सभी देखें →"
            : "View all →"}
      </span>
    </CardShell>
  );
}

function SeverityDot({ severity }: { severity: RedFlag["severity"] }) {
  const cfg = {
    emergency: { bg: "var(--danger)", icon: "emergency" },
    urgent: { bg: "var(--accent-2)", icon: "warning" },
    watch: { bg: "var(--ink-3)", icon: "visibility" },
  }[severity];
  return (
    <span
      className="mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white"
      style={{ background: cfg.bg }}
    >
      <span className="material-symbols-outlined text-[13px] fill">{cfg.icon}</span>
    </span>
  );
}

function SeverityChip({
  severity,
  language,
}: {
  severity: RedFlag["severity"];
  language: Language;
}) {
  const cfg = {
    emergency: { bg: "var(--danger)", text: "white", labelKey: "severityEmergency" as const },
    urgent: { bg: "var(--accent-2)", text: "white", labelKey: "severityUrgent" as const },
    watch: { bg: "var(--line-2)", text: "var(--ink-2)", labelKey: "severityWatch" as const },
  }[severity];
  return (
    <span
      className="mono text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      {t(language, cfg.labelKey)}
    </span>
  );
}
