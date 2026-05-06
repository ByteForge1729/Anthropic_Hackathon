"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/storage";
import { t } from "@/lib/i18n";
import type { DischargeSummary, Language, SymptomLogEntry } from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import { Disclaimer } from "@/components/Disclaimer";
import { generateSharePdf } from "@/lib/pdf";

export default function SharePage() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("en");
  const [summary, setSummary] = useState<DischargeSummary | null>(null);
  const [symptoms, setSymptoms] = useState<SymptomLogEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeMedications, setIncludeMedications] = useState(true);
  const [includeSymptoms, setIncludeSymptoms] = useState(true);
  const [generating, setGenerating] = useState(false);

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
    setSymptoms(storage.getSymptoms());
    setLoaded(true);
  }, [router]);

  const [genError, setGenError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<{ filename: string; url: string } | null>(null);

  async function handleGenerate() {
    if (!summary) return;
    setGenerating(true);
    setGenError(null);
    setGenerated(null);
    try {
      const result = await generateSharePdf(
        summary,
        symptoms,
        { includeSummary, includeMedications, includeSymptoms },
        language,
      );
      if (result) setGenerated(result);
    } catch (e: any) {
      console.error("PDF generation failed", e);
      setGenError(e?.message || String(e));
    } finally {
      setGenerating(false);
    }
  }

  if (!loaded || !summary) return null;

  return (
    <AppShell language={language} active="share" showBack>
      <section className="text-center mb-5 max-w-xl mx-auto">
        <p className="mono text-[12px] text-accent uppercase tracking-wider mb-2">
          {language === "hi" ? "साझा करें" : "Share"}
        </p>
        <h2 className="text-[28px] md:text-[32px] font-semibold text-ink tracking-tight leading-tight">
          {t(language, "shareTitle")}
        </h2>
        <p className="text-[15px] text-ink-2 mt-1.5">{t(language, "shareSubtitle")}</p>
      </section>

      <Disclaimer language={language} variant="compact" />

      <section className="mt-4 bg-surface border border-line rounded-[22px] p-5 shadow-sm flex flex-col gap-4">
        <ToggleRow
          icon="clinical_notes"
          label={t(language, "fullSummary")}
          subtext={language === "hi" ? "योजना, फॉलो-अप, चेतावनी" : "Plan, follow-ups, red flags"}
          active={includeSummary}
          onToggle={() => setIncludeSummary((v) => !v)}
        />
        <Divider />
        <ToggleRow
          icon="medication"
          label={t(language, "medicationList")}
          subtext={`${summary.medications.length} ${language === "hi" ? "दवाइयाँ" : "medications"}`}
          active={includeMedications}
          onToggle={() => setIncludeMedications((v) => !v)}
        />
        <Divider />
        <ToggleRow
          icon="history"
          label={t(language, "symptomHistory")}
          active={includeSymptoms}
          onToggle={() => setIncludeSymptoms((v) => !v)}
          subtext={
            symptoms.length === 0
              ? language === "hi"
                ? "कोई लॉग नहीं"
                : "No logs yet"
              : `${symptoms.length} ${language === "hi" ? "प्रविष्टियाँ" : "entries"}`
          }
        />
      </section>

      {genError && (
        <div className="mt-3 rounded-[12px] bg-danger-soft border border-danger/30 p-3 text-[13px] text-danger">
          PDF generation failed: {genError}
        </div>
      )}

      {generated && (
        <div className="mt-3 rounded-[14px] bg-accent-soft border border-accent/30 p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-accent fill mt-0.5">check_circle</span>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-accent-ink">
              {language === "hi" ? "PDF तैयार है।" : "Your PDF is ready."}
            </p>
            <p className="text-[12.5px] text-ink-2 mt-0.5 truncate">
              {language === "hi"
                ? "नया टैब खुला है और फ़ाइल आपके डाउनलोड्स फ़ोल्डर में सेव हो गई है।"
                : "It opened in a new tab and was saved to your Downloads folder."}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <a
                href={generated.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-accent-ink underline"
              >
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                {language === "hi" ? "PDF देखें" : "Open PDF"}
              </a>
              <a
                href={generated.url}
                download={generated.filename}
                className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-accent-ink underline"
              >
                <span className="material-symbols-outlined text-[14px]">download</span>
                {language === "hi" ? "फिर से डाउनलोड करें" : "Download again"}
              </a>
            </div>
            <p className="mono text-[10.5px] text-ink-3 mt-1.5 truncate">{generated.filename}</p>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={handleGenerate}
          disabled={generating || (!includeSummary && !includeMedications && !includeSymptoms)}
          className={`w-full h-[56px] rounded-[16px] text-[14px] font-medium flex items-center justify-center gap-2 transition-colors ${
            generating || (!includeSummary && !includeMedications && !includeSymptoms)
              ? "bg-accent text-white opacity-40 cursor-not-allowed"
              : "bg-accent text-white hover:opacity-90 shadow-md"
          }`}
        >
          {generating ? (
            <>
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              {language === "hi" ? "बनाया जा रहा है…" : "Generating PDF…"}
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">picture_as_pdf</span>
              {t(language, "generatePdf")}
            </>
          )}
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 mt-4 text-ink-3">
        <span className="material-symbols-outlined text-[16px]">lock</span>
        <p className="text-[13px]">
          {language === "hi"
            ? "PDF आपके डिवाइस पर ही बनेगा।"
            : "The PDF is generated on your device only."}
        </p>
      </div>
    </AppShell>
  );
}

function ToggleRow({
  icon,
  label,
  active,
  onToggle,
  subtext,
}: {
  icon: string;
  label: string;
  active: boolean;
  onToggle: () => void;
  subtext?: string;
}) {
  return (
    <button onClick={onToggle} type="button" className="flex items-center justify-between gap-3 w-full text-left">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-[12px] bg-accent-soft flex items-center justify-center text-accent-ink shrink-0">
          <span className="material-symbols-outlined fill text-[20px]">{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-ink truncate">{label}</p>
          {subtext && <p className="text-[12px] text-ink-3 truncate">{subtext}</p>}
        </div>
      </div>
      <div
        className={`w-[48px] h-[28px] rounded-full p-1 flex items-center transition-colors shrink-0 ${
          active ? "bg-accent justify-end" : "bg-line justify-start"
        }`}
      >
        <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
      </div>
    </button>
  );
}

function Divider() {
  return <div className="w-full h-px bg-line-2" />;
}
