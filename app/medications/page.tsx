"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/storage";
import { t } from "@/lib/i18n";
import type { Language, Plan } from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import { Disclaimer } from "@/components/Disclaimer";
import { computeNextDose, formatTimeOfDay } from "@/lib/schedule";

export default function MedicationsPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("en");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const lang = storage.getLanguage();
    if (!lang) {
      router.replace("/onboarding");
      return;
    }
    const active = storage.getActivePlan();
    if (!active) {
      router.replace("/upload");
      return;
    }
    setLanguage(lang);
    setPlan(active);
    setLoaded(true);
  }, [router]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const meds = plan?.summary.medications ?? [];
  const nextDose = useMemo(() => computeNextDose(meds, language, now), [meds, language, now]);

  if (!loaded || !plan) return null;

  return (
    <AppShell language={language} active="medications">
      <header className="mb-5">
        <p className="mono text-[12px] text-accent-2-ink uppercase tracking-wider mb-1.5 font-semibold">
          {t(language, "medications")} · {plan.summary.plan_name}
        </p>
        <h1 className="text-[28px] md:text-[30px] font-semibold text-ink leading-tight tracking-tight">
          {language === "hi" ? "आपकी पूरी दवा सूची" : "Your full medication list"}
        </h1>
        <p className="text-[14px] text-ink-2 mt-1.5">
          {meds.length}{" "}
          {language === "hi"
            ? "सक्रिय दवाइयाँ — सही समय और मात्रा का पालन करें।"
            : "active prescriptions — follow timing and dose carefully."}
        </p>
      </header>

      <Disclaimer language={language} variant="compact" />

      {/* Next dose reminder */}
      {meds.length > 0 && (
        <div className="mt-4 bg-accent-2-soft border border-accent-2/30 rounded-[18px] p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] bg-accent-2 text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined fill text-[24px]">schedule</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="mono text-[10.5px] uppercase tracking-wider text-accent-2-ink font-semibold">
              {t(language, "nextDose")}
            </p>
            {nextDose ? (
              <>
                <p className="text-[20px] font-bold text-ink leading-tight mt-0.5">
                  {formatTimeOfDay(nextDose.time, language)}{" "}
                  <span className="text-[13px] font-medium text-accent-2-ink">
                    · {nextDose.inLabel}
                  </span>
                </p>
                <p className="text-[13px] text-ink-2 mt-0.5 truncate">
                  {nextDose.name}
                  {nextDose.alsoDue.length > 0 &&
                    ` + ${nextDose.alsoDue.length} ${
                      language === "hi" ? "और" : "more at this time"
                    }`}
                </p>
              </>
            ) : (
              <p className="text-[14px] text-ink-2 mt-0.5">{t(language, "noDosesScheduled")}</p>
            )}
          </div>
        </div>
      )}

      {meds.length === 0 ? (
        <EmptyState language={language} icon="medication" message={t(language, "noMeds")} />
      ) : (
        <div className="mt-4 space-y-3">
          {meds.map((m, i) => (
            <article
              key={i}
              className="bg-surface border border-line rounded-[18px] p-5 shadow-sm"
            >
              <div className="flex items-start gap-3 mb-1">
                <div className="w-11 h-11 rounded-[12px] bg-accent-2-soft text-accent-2-ink flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px] fill">medication</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[18px] font-semibold text-ink leading-tight">{m.name}</h2>
                  {m.purpose && (
                    <p className="text-[13px] text-ink-2 leading-snug mt-0.5">
                      <span className="mono text-[10px] uppercase tracking-wider text-ink-3 mr-1.5">
                        {t(language, "medPurpose")}:
                      </span>
                      {m.purpose}
                    </p>
                  )}
                  <p className="mono text-[12.5px] text-accent-2-ink mt-1">
                    {m.dose} · {m.frequency}
                  </p>
                </div>
              </div>

              {m.times && m.times.length > 0 && (
                <div className="mt-3 pl-14">
                  <p className="mono text-[10px] uppercase tracking-wider text-ink-3 mb-1.5">
                    {language === "hi" ? "समय" : "Schedule"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {m.times.map((time, j) => {
                      const isNext =
                        nextDose && nextDose.name === m.name && nextDose.time === time;
                      return (
                        <span
                          key={j}
                          className={`mono text-[12px] px-2.5 py-1 rounded-full font-medium ${
                            isNext
                              ? "bg-accent-2 text-white"
                              : "bg-accent-2-soft text-accent-2-ink"
                          }`}
                        >
                          {formatTimeOfDay(time, language)}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              {(!m.times || m.times.length === 0) && /* PRN */ (
                <div className="mt-3 pl-14">
                  <span className="mono text-[11px] uppercase tracking-wider text-ink-3 bg-line-2 px-2 py-0.5 rounded-full">
                    {t(language, "asNeeded")}
                  </span>
                </div>
              )}

              {m.instructions && (
                <div className="mt-3 pl-14">
                  <p className="mono text-[10px] uppercase tracking-wider text-ink-3 mb-1">
                    {language === "hi" ? "निर्देश" : "Instructions"}
                  </p>
                  <p className="text-[13.5px] text-ink-2 leading-relaxed">{m.instructions}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </AppShell>
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
