"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/storage";
import { t } from "@/lib/i18n";
import type {
  DischargeSummary,
  Language,
  RedFlag,
  RedFlagCategory,
} from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import { Disclaimer } from "@/components/Disclaimer";

const CATEGORY_KEY: Record<
  RedFlagCategory,
  | "catIncisionWound"
  | "catInfectionFever"
  | "catBreathingCirculation"
  | "catPainMobility"
  | "catMentalState"
  | "catMedicationSideEffect"
  | "catDigestive"
  | "catOther"
> = {
  incision_wound: "catIncisionWound",
  infection_fever: "catInfectionFever",
  breathing_circulation: "catBreathingCirculation",
  pain_mobility: "catPainMobility",
  mental_state: "catMentalState",
  medication_side_effect: "catMedicationSideEffect",
  digestive: "catDigestive",
  other: "catOther",
};

const CATEGORY_ORDER: RedFlagCategory[] = [
  "infection_fever",
  "incision_wound",
  "breathing_circulation",
  "pain_mobility",
  "medication_side_effect",
  "digestive",
  "mental_state",
  "other",
];

export default function FlagsPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("en");
  const [summary, setSummary] = useState<DischargeSummary | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const lang = storage.getLanguage();
    const sum = storage.getSummary();
    if (!lang) {
      router.replace("/onboarding");
      return;
    }
    if (!sum) {
      router.replace("/upload");
      return;
    }
    setLanguage(lang);
    setSummary(sum);
    setLoaded(true);
  }, [router]);

  const grouped = useMemo(() => {
    const map = new Map<RedFlagCategory, RedFlag[]>();
    if (!summary) return map;
    const sevOrder = { emergency: 0, urgent: 1, watch: 2 } as const;
    for (const f of summary.red_flags) {
      const cat = (f.category ?? "other") as RedFlagCategory;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(f);
    }
    for (const list of map.values()) {
      list.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);
    }
    return map;
  }, [summary]);

  if (!loaded || !summary) return null;

  const totals = {
    emergency: summary.red_flags.filter((f) => f.severity === "emergency").length,
    urgent: summary.red_flags.filter((f) => f.severity === "urgent").length,
    watch: summary.red_flags.filter((f) => f.severity === "watch").length,
  };

  return (
    <AppShell language={language} active="symptoms">
      <header className="mb-5">
        <p className="mono text-[12px] text-danger uppercase tracking-wider mb-1.5 font-semibold">
          {t(language, "redFlags")} · {summary.plan_name}
        </p>
        <h1 className="text-[28px] md:text-[32px] font-semibold text-ink leading-tight tracking-tight">
          {language === "hi"
            ? "ध्यान रखने योग्य लक्षण"
            : "Symptoms to watch"}
        </h1>
        <p className="text-[14px] text-ink-2 mt-1.5">
          {language === "hi"
            ? `${summary.red_flags.length} लक्षण — श्रेणी और गंभीरता के अनुसार समूहित।`
            : `${summary.red_flags.length} warning signs — grouped by category and severity.`}
        </p>
      </header>

      <Disclaimer language={language} variant="compact" />

      {/* Severity summary */}
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <SeverityTile
          count={totals.emergency}
          label={t(language, "severityEmergency")}
          color="var(--danger)"
          bg="var(--danger-soft)"
        />
        <SeverityTile
          count={totals.urgent}
          label={t(language, "severityUrgent")}
          color="var(--accent-2)"
          bg="var(--accent-2-soft)"
        />
        <SeverityTile
          count={totals.watch}
          label={t(language, "severityWatch")}
          color="var(--ink-2)"
          bg="var(--line-2)"
        />
      </div>

      {summary.red_flags.length === 0 ? (
        <EmptyState
          language={language}
          icon="check_circle"
          message={t(language, "noFlags")}
        />
      ) : (
        <div className="mt-6 space-y-6">
          {CATEGORY_ORDER.map((cat) => {
            const list = grouped.get(cat);
            if (!list || list.length === 0) return null;
            return (
              <section key={cat}>
                <h2 className="mono text-[11px] uppercase tracking-wider text-accent-ink font-semibold mb-2.5">
                  {t(language, CATEGORY_KEY[cat])}
                </h2>
                <div className="space-y-3">
                  {list.map((f, i) => (
                    <FlagCard key={i} flag={f} language={language} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function SeverityTile({
  count,
  label,
  color,
  bg,
}: {
  count: number;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <div
      className="rounded-[14px] p-3 flex items-center gap-3 border border-line"
      style={{ background: bg }}
    >
      <div className="text-[24px] font-bold mono leading-none" style={{ color }}>
        {count}
      </div>
      <div className="mono text-[10.5px] uppercase tracking-wider" style={{ color }}>
        {label}
      </div>
    </div>
  );
}

function FlagCard({ flag, language }: { flag: RedFlag; language: Language }) {
  const sev = flag.severity;
  const sevColor =
    sev === "emergency"
      ? "var(--danger)"
      : sev === "urgent"
        ? "var(--accent-2)"
        : "var(--ink-3)";
  const sevSoft =
    sev === "emergency"
      ? "var(--danger-soft)"
      : sev === "urgent"
        ? "var(--accent-2-soft)"
        : "var(--line-2)";
  const sevLabel =
    sev === "emergency"
      ? t(language, "severityEmergency")
      : sev === "urgent"
        ? t(language, "severityUrgent")
        : t(language, "severityWatch");

  return (
    <article
      className="border border-line rounded-[18px] overflow-hidden bg-surface shadow-sm"
      style={{ borderLeftColor: sevColor, borderLeftWidth: 4 }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-[15px] font-semibold text-ink leading-snug">
            {flag.symptom}
          </h3>
          <span
            className="mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-white shrink-0"
            style={{ background: sevColor }}
          >
            {sevLabel}
          </span>
        </div>

        {flag.description && (
          <p className="text-[13.5px] text-ink-2 leading-relaxed mb-3">
            {flag.description}
          </p>
        )}

        {flag.examples && flag.examples.length > 0 && (
          <div className="mb-3">
            <p className="mono text-[10px] uppercase tracking-wider text-ink-3 font-semibold mb-1.5">
              {t(language, "examples")}
            </p>
            <ul className="space-y-1">
              {flag.examples.map((ex, i) => (
                <li
                  key={i}
                  className="text-[13px] text-ink-2 pl-4 relative leading-relaxed"
                >
                  <span
                    className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full"
                    style={{ background: sevColor }}
                  />
                  {ex}
                </li>
              ))}
            </ul>
          </div>
        )}

        {flag.watch_for && (
          <div className="mb-3">
            <p className="mono text-[10px] uppercase tracking-wider text-ink-3 font-semibold mb-1">
              {t(language, "watchFor")}
            </p>
            <p className="text-[13px] text-ink-2 leading-relaxed">{flag.watch_for}</p>
          </div>
        )}

        {flag.when_to_call && (
          <div
            className="flex items-start gap-2 px-3 py-2.5 rounded-[10px]"
            style={{ background: sevSoft }}
          >
            <span
              className="material-symbols-outlined text-[16px] fill mt-0.5"
              style={{ color: sevColor }}
            >
              call
            </span>
            <div>
              <p
                className="mono text-[10px] uppercase tracking-wider font-semibold mb-0.5"
                style={{ color: sevColor }}
              >
                {t(language, "whenToCall")}
              </p>
              <p className="text-[13px] font-semibold leading-snug" style={{ color: sevColor }}>
                {flag.when_to_call}
              </p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function EmptyState({
  language,
  icon,
  message,
}: {
  language: Language;
  icon: string;
  message: string;
}) {
  return (
    <div className="mt-6 bg-surface border border-line rounded-[18px] p-8 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-full bg-line-2 text-ink-3 flex items-center justify-center mb-3">
        <span className="material-symbols-outlined text-[28px]">{icon}</span>
      </div>
      <p className="text-[14px] text-ink-2">{message}</p>
    </div>
  );
}
