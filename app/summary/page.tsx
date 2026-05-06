"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/storage";
import { t } from "@/lib/i18n";
import type { DischargeSummary, Language } from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import { Disclaimer } from "@/components/Disclaimer";

export default function SummaryPage() {
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

  return (
    <AppShell language={language} active="home">
      <header className="mb-5">
        <p className="mono text-[12px] text-accent-ink uppercase tracking-wider mb-1.5 font-semibold">
          {t(language, "planOverview")} · {summary.plan_name}
        </p>
        <h1 className="text-[28px] md:text-[32px] font-semibold text-ink leading-tight tracking-tight">
          {language === "hi"
            ? "आपकी रिकवरी का विवरण"
            : "Your recovery, in plain words"}
        </h1>
      </header>

      <Disclaimer language={language} variant="compact" />

      <article className="mt-4 bg-surface border border-line rounded-[20px] p-6 shadow-sm">
        <p className="text-[15px] text-ink-2 leading-relaxed whitespace-pre-line">
          {summary.summary ||
            (language === "hi"
              ? "कोई सारांश उपलब्ध नहीं है।"
              : "No summary available.")}
        </p>
      </article>
    </AppShell>
  );
}
