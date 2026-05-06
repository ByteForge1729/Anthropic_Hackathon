"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/storage";
import { t } from "@/lib/i18n";
import type {
  DischargeSummary,
  Language,
  SymptomCheck,
  SymptomLogEntry,
  Urgency,
} from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import { Disclaimer } from "@/components/Disclaimer";

const MOODS: Array<{ v: 1 | 2 | 3 | 4 | 5; label_en: string; label_hi: string; shade: number }> = [
  { v: 1, label_en: "Very poor", label_hi: "बहुत खराब", shade: 0.2 },
  { v: 2, label_en: "Poor", label_hi: "खराब", shade: 0.4 },
  { v: 3, label_en: "Okay", label_hi: "ठीक", shade: 0.6 },
  { v: 4, label_en: "Good", label_hi: "अच्छा", shade: 0.8 },
  { v: 5, label_en: "Great", label_hi: "बहुत अच्छा", shade: 1.0 },
];

const SYMPTOM_CHIPS_EN = [
  "Pain",
  "Fever",
  "Fatigue",
  "Dizziness",
  "Shortness of breath",
  "Nausea",
  "Swelling",
  "Insomnia",
  "Headache",
  "Bleeding",
];

const SYMPTOM_CHIPS_HI = [
  "दर्द",
  "बुखार",
  "थकान",
  "चक्कर",
  "साँस लेने में तकलीफ़",
  "उबकाई",
  "सूजन",
  "नींद नहीं आना",
  "सिरदर्द",
  "रक्तस्राव",
];

export default function SymptomsPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("en");
  const [summary, setSummary] = useState<DischargeSummary | null>(null);
  const [history, setHistory] = useState<SymptomLogEntry[]>([]);

  const [mood, setMood] = useState<number | null>(null);
  const [pain, setPain] = useState(3);
  const [chips, setChips] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latest, setLatest] = useState<SymptomCheck | null>(null);

  useEffect(() => {
    const lang = storage.getLanguage();
    if (!lang) {
      router.replace("/onboarding");
      return;
    }
    setLanguage(lang);
    setSummary(storage.getSummary());
    setHistory(storage.getSymptoms());
  }, [router]);

  const chipsList = language === "hi" ? SYMPTOM_CHIPS_HI : SYMPTOM_CHIPS_EN;

  function toggleChip(s: string) {
    const next = new Set(chips);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    setChips(next);
  }

  function buildSymptomDescription(): string {
    const parts: string[] = [];
    if (mood) {
      const m = MOODS.find((x) => x.v === mood);
      if (m) parts.push(`Overall feeling: ${m.label_en} (${mood}/5)`);
    }
    parts.push(`Pain level: ${pain}/10`);
    if (chips.size) parts.push(`Symptoms: ${Array.from(chips).join(", ")}`);
    if (note.trim()) parts.push(`Notes: ${note.trim()}`);
    return parts.join(". ");
  }

  const ready = mood !== null || chips.size > 0 || note.trim().length > 0;

  async function handleCheck() {
    if (!ready) return;
    const symptom = buildSymptomDescription();
    setBusy(true);
    setError(null);
    setLatest(null);
    try {
      const res = await fetch("/api/symptom-check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          symptom,
          red_flags: summary?.red_flags ?? [],
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Check failed");
      const result = data.result as SymptomCheck;
      const entry: SymptomLogEntry = {
        id: cryptoId(),
        timestamp: Date.now(),
        symptom,
        result,
      };
      storage.addSymptom(entry);
      setHistory(storage.getSymptoms());
      setLatest(result);
      setMood(null);
      setPain(3);
      setChips(new Set());
      setNote("");
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell language={language} active="symptoms">
      <section className="max-w-2xl mx-auto">
        <div className="mb-5">
          <p className="mono text-[12px] text-accent-ink uppercase tracking-wider mb-1.5 font-semibold">
            {language === "hi" ? "लक्षण लॉगर" : "Symptom logger"}
          </p>
          <h2 className="text-[28px] md:text-[30px] font-semibold text-ink tracking-tight leading-tight">
            {t(language, "symptomLogTitle")}
          </h2>
          <p className="text-[14px] text-ink-2 mt-1.5">{t(language, "symptomLogSubtitle")}</p>
        </div>

        <Disclaimer language={language} variant="compact" />

        {/* Mood */}
        <Card className="mt-4">
          <SectionLabel>
            {language === "hi"
              ? "अभी आप कैसा महसूस कर रहे हैं?"
              : "How are you feeling right now?"}
          </SectionLabel>
          <div className="grid grid-cols-5 gap-2 mt-3">
            {MOODS.map((m) => {
              const active = mood === m.v;
              return (
                <button
                  key={m.v}
                  type="button"
                  onClick={() => setMood(m.v)}
                  className={`flex flex-col items-center gap-2 p-2.5 rounded-[14px] border transition-all ${
                    active
                      ? "border-accent border-2 bg-accent-soft -translate-y-0.5"
                      : "border-line bg-surface-2 hover:bg-line-2"
                  }`}
                >
                  <FaceSvg shade={m.shade} active={active} />
                  <span
                    className={`text-[10.5px] font-medium leading-tight text-center ${
                      active ? "text-accent-ink" : "text-ink-2"
                    }`}
                  >
                    {language === "hi" ? m.label_hi : m.label_en}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Pain */}
        <Card className="mt-3">
          <div className="flex items-baseline justify-between">
            <SectionLabel>
              {language === "hi" ? "दर्द का स्तर" : "Pain level"}
            </SectionLabel>
            <span className="mono text-[14px] font-semibold text-accent-ink">
              {pain}<span className="text-ink-3">/10</span>
            </span>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <span className="mono text-[10.5px] text-ink-3">0</span>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={pain}
              onChange={(e) => setPain(+e.target.value)}
              className="flex-1 accent-accent"
              style={{ accentColor: "var(--accent)" }}
            />
            <span className="mono text-[10.5px] text-ink-3">10</span>
          </div>
        </Card>

        {/* Symptom chips */}
        <Card className="mt-3">
          <SectionLabel>
            {language === "hi" ? "विशिष्ट लक्षण?" : "Any specific symptoms?"}
          </SectionLabel>
          <div className="flex flex-wrap gap-2 mt-3">
            {chipsList.map((s) => {
              const active = chips.has(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleChip(s)}
                  className={`px-3.5 py-1.5 rounded-full text-[12.5px] border transition-all ${
                    active
                      ? "bg-accent text-white border-accent font-semibold"
                      : "bg-surface-2 text-ink-2 border-line hover:bg-line-2"
                  }`}
                >
                  {active ? "✓ " : ""}
                  {s}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Notes */}
        <Card className="mt-3">
          <SectionLabel>{language === "hi" ? "अतिरिक्त नोट" : "Notes"}</SectionLabel>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder={t(language, "symptomPlaceholder")}
            className="w-full mt-3 bg-surface-2 border border-line rounded-[12px] p-3 text-[14px] text-ink resize-none focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
          />
        </Card>

        {error && (
          <div className="mt-3 rounded-[16px] bg-danger-soft border border-danger/30 p-3 flex items-start gap-2">
            <span className="material-symbols-outlined text-danger">error</span>
            <p className="text-[13px] text-danger">{error}</p>
          </div>
        )}

        <button
          onClick={handleCheck}
          disabled={busy || !ready}
          className={`w-full mt-4 h-[52px] rounded-[16px] text-[14px] font-semibold flex items-center justify-center gap-2 transition-all ${
            busy || !ready
              ? "bg-accent text-white opacity-40 cursor-not-allowed"
              : "bg-accent text-white hover:opacity-90 shadow-md"
          }`}
        >
          {busy ? (
            <>
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              {t(language, "checking")}
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">search_check</span>
              {t(language, "checkSymptom")}
            </>
          )}
        </button>

        {latest && (
          <section className="mt-5">
            <UrgencyResult result={latest} language={language} />
          </section>
        )}

        {history.length > 0 && (
          <section className="mt-8">
            <h3 className="mono text-[11px] uppercase tracking-wider text-ink-3 mb-3">
              {t(language, "recentChecks")}
            </h3>
            <ul className="space-y-3">
              {history.slice(0, 10).map((entry) => (
                <li
                  key={entry.id}
                  className="bg-surface border border-line rounded-[16px] p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-[13.5px] text-ink flex-1 leading-snug">{entry.symptom}</p>
                    <UrgencyBadge urgency={entry.result.urgency} language={language} />
                  </div>
                  <p className="mono text-[10.5px] text-ink-3">
                    {new Date(entry.timestamp).toLocaleString(
                      language === "hi" ? "hi-IN" : "en-US",
                      { dateStyle: "medium", timeStyle: "short" },
                    )}
                  </p>
                  {entry.result.advice && (
                    <p className="text-[13px] text-ink-2 mt-1.5 leading-relaxed">
                      {entry.result.advice}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </section>
    </AppShell>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-surface border border-line rounded-[18px] p-4 md:p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mono text-[11px] font-semibold uppercase tracking-wider text-ink-3">
      {children}
    </div>
  );
}

function FaceSvg({ shade, active }: { shade: number; active: boolean }) {
  const fill = `oklch(${0.55 + shade * 0.35} 0.10 250)`;
  const curve = (shade - 0.5) * 8;
  return (
    <svg width="32" height="32" viewBox="0 0 36 36" aria-hidden="true">
      <circle
        cx="18"
        cy="18"
        r="15"
        fill={active ? fill : "var(--line-2)"}
        stroke={active ? fill : "var(--line)"}
        strokeWidth="1"
      />
      <circle cx="13" cy="15" r="1.4" fill={active ? "white" : "var(--ink-3)"} />
      <circle cx="23" cy="15" r="1.4" fill={active ? "white" : "var(--ink-3)"} />
      <path
        d={`M 12 ${22 + curve / 2} Q 18 ${22 - curve} 24 ${22 + curve / 2}`}
        stroke={active ? "white" : "var(--ink-3)"}
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function urgencyTone(u: Urgency) {
  switch (u) {
    case "emergency":
      return {
        bg: "bg-danger-soft",
        border: "border-danger",
        text: "text-ink",
        accent: "text-danger",
        icon: "emergency",
        labelKey: "urgencyEmergency" as const,
      };
    case "urgent":
      return {
        bg: "bg-accent-2-soft",
        border: "border-accent-2",
        text: "text-ink",
        accent: "text-accent-2-ink",
        icon: "warning",
        labelKey: "urgencyUrgent" as const,
      };
    case "monitor":
      return {
        bg: "bg-accent-soft",
        border: "border-accent",
        text: "text-ink",
        accent: "text-accent-ink",
        icon: "visibility",
        labelKey: "urgencyMonitor" as const,
      };
    case "ok":
    default:
      return {
        bg: "bg-line-2",
        border: "border-line",
        text: "text-ink",
        accent: "text-ok",
        icon: "check_circle",
        labelKey: "urgencyOk" as const,
      };
  }
}

function UrgencyResult({ result, language }: { result: SymptomCheck; language: Language }) {
  const tone = urgencyTone(result.urgency);
  return (
    <div className={`rounded-[20px] border-2 ${tone.border} ${tone.bg} p-5 shadow-md`}>
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-12 h-12 rounded-[14px] bg-surface flex items-center justify-center ${tone.accent} shadow-sm`}
        >
          <span className="material-symbols-outlined text-2xl fill">{tone.icon}</span>
        </div>
        <h3 className={`text-[18px] font-semibold ${tone.text} tracking-tight`}>
          {t(language, tone.labelKey)}
        </h3>
      </div>
      {result.matched_red_flag && (
        <p className={`text-[13px] ${tone.text} mb-2`}>
          {language === "hi" ? "मेल खाने वाला चेतावनी लक्षण: " : "Matches your warning sign: "}
          <span className="font-semibold">{result.matched_red_flag}</span>
        </p>
      )}
      {result.reason && (
        <div className="mb-3">
          <p className={`mono text-[10px] uppercase tracking-wider ${tone.accent} mb-1`}>
            {t(language, "whatHappened")}
          </p>
          <p className={`text-[13px] ${tone.text} leading-relaxed`}>{result.reason}</p>
        </div>
      )}
      {result.advice && (
        <div>
          <p className={`mono text-[10px] uppercase tracking-wider ${tone.accent} mb-1`}>
            {t(language, "whatToDo")}
          </p>
          <p className={`text-[13px] ${tone.text} leading-relaxed`}>{result.advice}</p>
        </div>
      )}
    </div>
  );
}

function UrgencyBadge({ urgency, language }: { urgency: Urgency; language: Language }) {
  const tone = urgencyTone(urgency);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${tone.border} ${tone.bg} ${tone.text} shrink-0`}
    >
      <span className={`material-symbols-outlined text-[12px] ${tone.accent}`}>{tone.icon}</span>
      {t(language, tone.labelKey)}
    </span>
  );
}

function cryptoId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
