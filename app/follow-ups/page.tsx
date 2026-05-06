"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/storage";
import { t } from "@/lib/i18n";
import type { DischargeSummary, Language } from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import { Disclaimer } from "@/components/Disclaimer";

export default function FollowUpsPage() {
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

  if (!loaded || !summary) return null;

  const items = summary.follow_up;

  return (
    <AppShell language={language} active="followups">
      <header className="mb-5">
        <p className="mono text-[12px] text-accent-ink uppercase tracking-wider mb-1.5 font-semibold">
          {t(language, "followUp")} · {summary.plan_name}
        </p>
        <h1 className="text-[28px] md:text-[32px] font-semibold text-ink leading-tight tracking-tight">
          {language === "hi"
            ? "फॉलो-अप और अपॉइंटमेंट"
            : "Follow-ups & appointments"}
        </h1>
        <p className="text-[14px] text-ink-2 mt-1.5">
          {language === "hi"
            ? "अपनी आगामी देखभाल अनुसूची।"
            : "Your upcoming care schedule."}
        </p>
      </header>

      <Disclaimer language={language} variant="compact" />

      {items.length === 0 ? (
        <EmptyState
          language={language}
          icon="event_busy"
          message={t(language, "noFollowUp")}
        />
      ) : (
        <div className="mt-4 space-y-2.5">
          {items.map((f, i) => (
            <article
              key={i}
              className="bg-surface border border-line rounded-[18px] p-4 md:p-5 shadow-sm flex items-start gap-4"
            >
              <div className="w-14 h-14 rounded-[12px] bg-accent-soft text-accent-ink flex flex-col items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px] fill">
                  calendar_month
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-[16px] font-semibold text-ink leading-snug">
                  {f.task}
                </h2>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                  <span className="mono text-[11.5px] text-accent-ink bg-accent-soft px-2 py-0.5 rounded-full">
                    {f.deadline}
                  </span>
                  {f.contact && (
                    <span className="text-[13px] text-ink-2 truncate">
                      · {f.contact}
                    </span>
                  )}
                </div>
              </div>
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
